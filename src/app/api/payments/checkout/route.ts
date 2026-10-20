import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { buildProviderPaymentUrl } from "@/lib/billing/provider";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const rawPlan = (body.plan || "").toString().trim().toUpperCase();
    const rawProvider = (body.provider || "click").toString().trim().toLowerCase();
    const billingCycle = body.billingCycle === "yearly" ? "yearly" : "monthly";

    if (
      !["PRO", "PREMIUM"].includes(rawPlan) ||
      !["click", "payme", "payx"].includes(rawProvider)
    ) {
      return NextResponse.json({ error: "Invalid plan or provider" }, { status: 400 });
    }

    const isYearly = billingCycle === "yearly";
    const amount =
      rawPlan === "PREMIUM" ? (isYearly ? 662_000 : 69_000) : isYearly ? 374_000 : 39_000;

    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        amount,
        provider: rawProvider.toUpperCase(),
        status: "PENDING",
      },
    });

    const paymentUrl = buildProviderPaymentUrl({
      provider: rawProvider as "click" | "payme" | "payx",
      transactionId: transaction.id,
      amountUzs: transaction.amount,
      returnUrl: body.returnUrl,
    });

    return NextResponse.json({
      paymentUrl,
      pay_url: paymentUrl,
      transactionId: transaction.id,
    });
  } catch (error) {
    console.error("Payment API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
