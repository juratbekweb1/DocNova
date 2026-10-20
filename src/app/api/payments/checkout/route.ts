import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { buildProviderPaymentUrl, createClickPhoneInvoice } from "@/lib/billing/provider";

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
    const cardType =
      body.cardType === "humo" ? "humo" : body.cardType === "uzcard" ? "uzcard" : undefined;
    const phoneNumber = typeof body.phoneNumber === "string" ? body.phoneNumber.trim() : "";

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

    // If Click + phoneNumber provided, attempt direct Click Shop API invoice push first
    let invoiceSent = false;
    let invoiceId: number | undefined;
    if (rawProvider === "click" && phoneNumber.replace(/\D/g, "").length >= 9) {
      const invoiceResult = await createClickPhoneInvoice({
        transactionId: transaction.id,
        amountUzs: transaction.amount,
        phoneNumber,
      }).catch(() => ({ ok: false }));

      if (invoiceResult.ok) {
        invoiceSent = true;
        invoiceId = "invoiceId" in invoiceResult ? invoiceResult.invoiceId : undefined;
      }
    }

    // Default to card_type=uzcard for Click web checkout so users get direct Card/Phone form instead of QR-only lock
    const paymentUrl = buildProviderPaymentUrl({
      provider: rawProvider as "click" | "payme" | "payx",
      transactionId: transaction.id,
      amountUzs: transaction.amount,
      returnUrl: body.returnUrl,
      cardType: rawProvider === "click" ? cardType || "uzcard" : undefined,
    });

    return NextResponse.json({
      paymentUrl,
      pay_url: paymentUrl,
      transactionId: transaction.id,
      invoiceSent,
      invoiceId,
    });
  } catch (error) {
    console.error("Payment API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
