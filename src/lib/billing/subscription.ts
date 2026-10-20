import { prisma } from "@/lib/prisma";

export type SubscriptionStatus = {
  isPremium: boolean;
  planSlug?: string;
  planName?: string;
  expiresAt?: Date | null;
  features: Record<string, unknown>;
};

const DEFAULT_FREE_PLAN_FEATURES = {
  ai_usage_limit: 5,
  templates_limit: 3,
  export_formats: ["txt"],
};

/**
 * Validates if the user currently has an active Pro/Premium subscription
 * by checking both their Personal Organization's Subscription and the User record.
 */
export async function getUserSubscription(userId: string): Promise<SubscriptionStatus> {
  if (!userId) {
    return {
      isPremium: false,
      planSlug: "free",
      planName: "Free",
      features: DEFAULT_FREE_PLAN_FEATURES,
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        plan: true,
        subscriptionEndDate: true,
      },
    });

    if (!user) {
      return {
        isPremium: false,
        planSlug: "free",
        planName: "Free",
        features: DEFAULT_FREE_PLAN_FEATURES,
      };
    }

    if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
      return {
        isPremium: true,
        planSlug: "premium",
        planName: "Super Admin (Cheksiz)",
        features: {
          ai_usage_limit: 999999,
          templates_limit: 999999,
          export_formats: ["txt", "pdf", "docx"],
          unlimited: true,
        },
      };
    }

    const now = new Date();

    const orgUser = await prisma.organizationUser.findFirst({
      where: { userId, role: "OWNER" },
      include: {
        organization: {
          include: {
            subscriptions: {
              where: {
                status: "active",
              },
              include: {
                plan: true,
              },
              orderBy: {
                createdAt: "desc",
              },
              take: 1,
            },
          },
        },
      },
    });

    const activeSub = orgUser?.organization.subscriptions[0];
    if (activeSub && (!activeSub.currentPeriodEnd || new Date(activeSub.currentPeriodEnd) >= now)) {
      return {
        isPremium: activeSub.plan.slug !== "free",
        planSlug: activeSub.plan.slug,
        planName: activeSub.plan.name,
        expiresAt: activeSub.currentPeriodEnd,
        features: (activeSub.plan.features as Record<string, unknown>) || {},
      };
    }

    // Fallback to User.plan & User.subscriptionEndDate
    const userSubValid =
      (user.plan === "PRO" || user.plan === "PREMIUM") &&
      (!user.subscriptionEndDate || new Date(user.subscriptionEndDate) >= now);

    if (userSubValid) {
      const isPrem = user.plan === "PREMIUM";
      return {
        isPremium: true,
        planSlug: isPrem ? "premium" : "pro",
        planName: isPrem ? "DocNova Premium" : "DocNova Pro",
        expiresAt: user.subscriptionEndDate,
        features: {
          isPremium: true,
          ai_usage_limit: isPrem ? 500 : 200,
          templates_limit: 999,
          export_formats: ["txt", "pdf", "docx"],
        },
      };
    }

    return {
      isPremium: false,
      planSlug: "free",
      planName: "Free",
      features: DEFAULT_FREE_PLAN_FEATURES,
    };
  } catch (error) {
    console.error("Failed to fetch subscription, defaulting to FREE:", error);
    return {
      isPremium: false,
      planSlug: "free",
      planName: "Free",
      features: DEFAULT_FREE_PLAN_FEATURES,
    };
  }
}
