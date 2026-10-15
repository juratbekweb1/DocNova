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

    // Determine success (we'll check common success strings)
    const isSuccess = ["paid", "completed", "success", "approved"].includes(
      (status || "").toLowerCase()
    );

    if (isSuccess) {
      // Update transaction status
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: "COMPLETED" },
      });

      // Grant subscription based on amount
      const planSlug = transaction.amount >= 60000 ? "premium" : "pro";

      let orgUser = await prisma.organizationUser.findFirst({
        where: { userId: transaction.userId, role: "OWNER" },
      });

      if (!orgUser) {
        const org = await prisma.organization.create({
          data: {
            name: `Personal Workspace`,
            slug: `personal-${Date.now()}`,
          },
        });
        orgUser = await prisma.organizationUser.create({
          data: {
            organizationId: org.id,
            userId: transaction.userId,
            role: "OWNER",
          },
        });
      }

      let plan = await prisma.plan.findUnique({ where: { slug: planSlug } });
      if (!plan) {
        plan = await prisma.plan.create({
          data: {
            name: planSlug === "premium" ? "DocNova Premium" : "DocNova Pro",
            slug: planSlug,
            features: {
              isPremium: true,
            },
          },
        });
      }

      const existingSub = await prisma.subscription.findFirst({
        where: { organizationId: orgUser.organizationId, status: "active" },
      });

      const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      if (existingSub) {
        await prisma.subscription.update({
          where: { id: existingSub.id },
          data: {
            planId: plan.id,
            currentPeriodEnd: nextMonth,
          },
        });
      } else {
        await prisma.subscription.create({
          data: {
            organizationId: orgUser.organizationId,
            planId: plan.id,
            status: "active",
            currentPeriodEnd: nextMonth,
          },
        });
      }
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
