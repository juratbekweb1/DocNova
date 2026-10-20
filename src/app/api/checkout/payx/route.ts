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

    const body = await req.json().catch(() => ({}));
    const rawPlan = (body.plan || "").toString().trim().toLowerCase();
    const billingCycle = body.billingCycle === "yearly" ? "yearly" : "monthly";

    if (!["pro", "premium"].includes(rawPlan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const isYearly = billingCycle === "yearly";
    const amount =
      rawPlan === "premium" ? (isYearly ? 662_000 : 69_000) : isYearly ? 374_000 : 39_000;

    // Create a pending transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        amount,
        provider: "PAYX",
        status: "PENDING",
      },
    });

    const PAYX_API_KEY = process.env.PAYX_API_KEY;
    if (!PAYX_API_KEY) {
      console.error("[PAYX_CHECKOUT_ERR] PAYX_API_KEY is not configured.");
      return NextResponse.json(
        { error: "Payment gateway credentials are not configured", transactionId: transaction.id },
        { status: 503 }
      );
    }

    // Call PayX invoice creation API
    const payxRes = await fetch("https://backend.payx.uz/api/v1/invoice", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYX_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payer_reference: transaction.id,
        amount,
      }),
    });

    if (!payxRes.ok) {
      const errorText = await payxRes.text();
      console.error("PayX Error:", errorText);
      return NextResponse.json({ error: "Payment gateway error" }, { status: 502 });
    }

    const payxData = await payxRes.json();

    if (!payxData.pay_url) {
      return NextResponse.json({ error: "Invalid response from payment gateway" }, { status: 502 });
    }

    return NextResponse.json({
      pay_url: payxData.pay_url,
      paymentUrl: payxData.pay_url,
      transactionId: transaction.id,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("PayX API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
