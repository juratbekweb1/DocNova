import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { paymentProvider } from "@/lib/billing/provider";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const planId = (body.planId || body.plan || "").toString().trim();
    const provider = (body.provider || "click").toString().toLowerCase() as
      "click" | "payme" | "payx";
    const billingCycle = body.billingCycle === "yearly" ? "yearly" : "monthly";
    const { successUrl, cancelUrl } = body;

    if (!planId) {
      return NextResponse.json({ error: "Plan ID is required" }, { status: 400 });
    }

    // Ensure the user's personal organization exists
    let orgUser = await prisma.organizationUser.findFirst({
      where: { userId: session.user.id, role: "OWNER" },
    });

    if (!orgUser) {
      const org = await prisma.organization.create({
        data: {
          name: `${session.user.name || "User"}'s Personal Workspace`,
          slug: `personal-${session.user.id.slice(0, 8)}-${Date.now()}`,
        },
      });
      orgUser = await prisma.organizationUser.create({
        data: {
          organizationId: org.id,
          userId: session.user.id,
          role: "OWNER",
        },
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.docnova.uz";
    const sessionData = await paymentProvider.createCheckoutSession({
      userId: session.user.id,
      organizationId: orgUser.organizationId,
      planId,
      provider,
      billingCycle,
      successUrl: successUrl || `${appUrl}/dashboard?payment=success`,
      cancelUrl: cancelUrl || `${appUrl}/checkout?payment=cancelled`,
    });

    return NextResponse.json({
      url: sessionData.url,
      paymentUrl: sessionData.url,
      transactionId: sessionData.transactionId,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Failed to initialize checkout" }, { status: 500 });
  }
}
