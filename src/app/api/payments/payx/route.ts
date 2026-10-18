import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    // 1. Fail-closed: Ensure provider credentials are configured
    const configuredSecret = process.env.PAYX_WEBHOOK_SECRET || process.env.PAYX_API_KEY;
    if (!configuredSecret) {
      console.error("[PAYX_WEBHOOK_ERR] PAYX_WEBHOOK_SECRET / PAYX_API_KEY is not configured.");
      return NextResponse.json(
        {
          error: "Payment provider webhook authentication is not configured on server.",
          code: "PAYX_UNCONFIGURED",
        },
        { status: 503 }
      );
    }

    // 2. Authenticate webhook caller via Bearer token or custom secret header
    const authHeader =
      req.headers.get("authorization") ||
      req.headers.get("x-payx-secret") ||
      req.headers.get("x-secret-key");
    const providedToken = authHeader?.replace(/^Bearer\s+/i, "").trim();

    if (!providedToken || providedToken !== configuredSecret) {
      return NextResponse.json(
        { error: "Invalid webhook credentials or signature", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    console.log("[PAYX_WEBHOOK_VERIFIED]", {
      order_id: body.payer_reference || body.reference,
      status: body.status,
    });

    const reference = body.payer_reference || body.reference || body.order_id;
    const status = (body.status || "").toString().toLowerCase();
    const amount = body.amount !== undefined ? parseFloat(body.amount) : undefined;

    if (!reference || typeof reference !== "string") {
      return NextResponse.json(
        { error: "No valid transaction reference provided" },
        { status: 400 }
      );
    }

    // 3. Find transaction in database
    const transaction = await prisma.transaction.findUnique({
      where: { id: reference },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // 4. Idempotency: if transaction is already completed/paid, return success without duplicate grants
    if (transaction.status === "COMPLETED" || transaction.status === "PAID") {
      return NextResponse.json({
        success: true,
        message: "Transaction already processed and completed",
      });
    }

    // 5. Amount integrity check
    if (amount !== undefined && !isNaN(amount)) {
      if (amount !== transaction.amount) {
        console.error(
          `[PAYX_AMOUNT_MISMATCH] Transaction ${transaction.id}: Expected ${transaction.amount}, received ${amount}`
        );
        return NextResponse.json(
          { error: "Amount mismatch between webhook and recorded transaction" },
          { status: 400 }
        );
      }
    }

    // 6. Process payment status
    const isSuccess = ["paid", "completed", "success", "approved"].includes(status);

    if (isSuccess) {
      const planSlug = transaction.amount >= 60000 ? "premium" : "pro";
      const planTier = transaction.amount >= 60000 ? "PREMIUM" : "PRO";
      const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await prisma.$transaction(async (tx) => {
        // A. Mark transaction as COMPLETED
        await tx.transaction.update({
          where: { id: transaction.id },
          data: { status: "COMPLETED" },
        });

        // B. Activate user plan in User table
        await tx.user.update({
          where: { id: transaction.userId },
          data: {
            plan: planTier,
            paymentStatus: "PAID",
            subscriptionEndDate: nextMonth,
          },
        });

        // C. Maintain organization subscription
        let orgUser = await tx.organizationUser.findFirst({
          where: { userId: transaction.userId, role: "OWNER" },
        });

        if (!orgUser) {
          const org = await tx.organization.create({
            data: {
              name: `Personal Workspace`,
              slug: `personal-${Date.now()}`,
            },
          });
          orgUser = await tx.organizationUser.create({
            data: {
              organizationId: org.id,
              userId: transaction.userId,
              role: "OWNER",
            },
          });
        }

        let plan = await tx.plan.findUnique({ where: { slug: planSlug } });
        if (!plan) {
          plan = await tx.plan.create({
            data: {
              name: planSlug === "premium" ? "DocNova Premium" : "DocNova Pro",
              slug: planSlug,
              features: {
                isPremium: true,
              },
            },
          });
        }

        const existingSub = await tx.subscription.findFirst({
          where: { organizationId: orgUser.organizationId, status: "active" },
        });

        if (existingSub) {
          await tx.subscription.update({
            where: { id: existingSub.id },
            data: {
              planId: plan.id,
              currentPeriodEnd: nextMonth,
            },
          });
        } else {
          await tx.subscription.create({
            data: {
              organizationId: orgUser.organizationId,
              planId: plan.id,
              status: "active",
              currentPeriodEnd: nextMonth,
            },
          });
        }
      });

      return NextResponse.json({ success: true, message: "Payment processed successfully" });
    } else if (["failed", "cancelled", "rejected"].includes(status)) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: "FAILED" },
      });
      return NextResponse.json({ success: true, message: "Transaction marked as failed" });
    }

    return NextResponse.json({ error: "Unhandled transaction status" }, { status: 400 });
  } catch (error) {
    console.error("[PAYX_WEBHOOK_ERR]", error);
    return NextResponse.json({ error: "Internal webhook processing error" }, { status: 500 });
  }
}
