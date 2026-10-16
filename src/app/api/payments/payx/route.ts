import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("PayX Webhook Payload:", body);

    // According to PayX standard, the identifier we sent was `payer_reference`
    // Usually they return it back as `payer_reference` or `reference` or similar.
    const reference = body.payer_reference || body.reference || body.order_id;
    const status = body.status; // e.g., 'paid', 'completed', 'success'

    if (!reference) {
      return NextResponse.json({ error: "No reference provided" }, { status: 400 });
    }

    // Find the transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: reference },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Idempotency: if transaction is already completed or paid, return success immediately
    if (transaction.status === "COMPLETED" || transaction.status === "PAID") {
      return NextResponse.json({ success: true, message: "Transaction already processed" });
    }

    // Determine success (we'll check common success strings)
    const isSuccess = ["paid", "completed", "success", "approved"].includes(
      (status || "").toLowerCase()
    );

    if (isSuccess) {
      // Grant subscription based on amount
      const planSlug = transaction.amount >= 60000 ? "premium" : "pro";
      const planTier = transaction.amount >= 60000 ? "PREMIUM" : "PRO";
      const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await prisma.$transaction(async (tx) => {
        // 1. Update transaction status
        await tx.transaction.update({
          where: { id: transaction.id },
          data: { status: "COMPLETED" },
        });

        // 2. CRITICAL: Activate user plan in User table
        await tx.user.update({
          where: { id: transaction.userId },
          data: {
            plan: planTier,
            paymentStatus: "PAID",
            subscriptionEndDate: nextMonth,
          },
        });

        // 3. Ensure organization and subscription records exist
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
    } else if (status === "failed" || status === "cancelled") {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: "FAILED" },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PayX Webhook error:", error);
    return NextResponse.json({ error: "Webhook Error" }, { status: 500 });
  }
}
