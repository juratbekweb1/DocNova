import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { plan, provider } = body; // e.g., plan: 'PRO', provider: 'click' | 'payme'

    if (!["PRO", "PREMIUM"].includes(plan) || !["click", "payme"].includes(provider)) {
      return NextResponse.json({ error: "Invalid plan or provider" }, { status: 400 });
    }

    // Prepare transaction or payment link generation logic here.
    // E.g., fetch price based on plan, create a transaction record with 'PENDING' status,
    // and generate a redirect URL to Click or Payme gateway.

    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        amount: plan === "PRO" ? 50000 : 150000, // Example amounts in UZS
        provider: provider.toUpperCase(),
        status: "PENDING",
      },
    });

    const paymentUrl = provider === "click" 
      ? `https://my.click.uz/services/pay?service_id=123&merchant_id=456&amount=${transaction.amount}&transaction_param=${transaction.id}`
      : `https://checkout.paycom.uz/base64encodedStringHere`; // Payme URL

    return NextResponse.json({ paymentUrl, transactionId: transaction.id });
  } catch (error) {
    console.error("Payment API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
