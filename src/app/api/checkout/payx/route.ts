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
    const { plan } = body; // 'pro' | 'premium'

    if (!["pro", "premium"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Pro is 29990, Premium is 49990
    const amount = plan === "premium" ? 49990 : 29990;

    // Create a pending transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        amount: amount,
        provider: "PAYX",
        status: "PENDING",
      },
    });

    // PayX API Key
    const PAYX_API_KEY = process.env.PAYX_API_KEY || "927182ee-e87b-4e34-b23d-acb67cdbf2fd";

    // Call PayX invoice creation API
    const payxRes = await fetch("https://backend.payx.uz/api/v1/invoice", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PAYX_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payer_reference: transaction.id,
        amount: amount, // Assumed UZS
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

    return NextResponse.json({ pay_url: payxData.pay_url });
  } catch (error: any) {
    console.error("PayX API error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
