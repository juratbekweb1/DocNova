import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

/**
 * DEV ONLY: This endpoint is strictly disabled in production.
 * In development, only verified SUPER_ADMIN / ADMIN users may trigger this endpoint.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Strict production guard: NEVER allow dev-upgrade in production
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          error: "Forbidden: dev-upgrade endpoint is permanently disabled in production.",
          code: "ENDPOINT_DISABLED_IN_PRODUCTION",
        },
        { status: 403 }
      );
    }

    // 2. Authentication check
    const session = await getServerSession(authOptions).catch(() => null);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3. Database role check (prevent regular users from privilege escalation)
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!dbUser || (dbUser.role !== "SUPER_ADMIN" && dbUser.role !== "ADMIN")) {
      return NextResponse.json(
        {
          error: "Forbidden: Only administrative accounts can access dev-upgrade.",
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const planSlug = body?.planSlug; // e.g. 'premium', 'pro'

    if (!planSlug || !["pro", "premium"].includes(planSlug)) {
      return NextResponse.json(
        { error: "Invalid plan slug. Must be 'pro' or 'premium'." },
        { status: 400 }
      );
    }

    // Get the user's personal organization
    let orgUser = await prisma.organizationUser.findFirst({
      where: { userId: session.user.id, role: "OWNER" },
    });

    // If the user was created before Organizations existed, create one now
    if (!orgUser) {
      const org = await prisma.organization.create({
        data: {
          name: `${session.user.name || "User"}'s Personal Workspace`,
          slug: `personal-${Date.now()}`,
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

    // Ensure the Plan exists in the database
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

    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // +30 days

    // Upsert subscription
    await prisma.subscription.create({
      data: {
        organizationId: orgUser.organizationId,
        planId: plan.id,
        status: "active",
        currentPeriodEnd: nextMonth,
      },
    });

    // Also update User record
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        plan: planSlug === "premium" ? "PREMIUM" : "PRO",
        paymentStatus: "PAID",
        subscriptionEndDate: nextMonth,
      },
    });

    return NextResponse.json({ success: true, plan: planSlug });
  } catch (error) {
    console.error("[DEV_UPGRADE_ERR]", error);
    return NextResponse.json({ error: "Failed to upgrade" }, { status: 500 });
  }
}
