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

const subscriptionCache = new Map<string, { data: SubscriptionStatus; expiresAt: number }>();
const SUBSCRIPTION_CACHE_TTL_MS = 15_000;

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

  const isTest = process.env.NODE_ENV === "test" || process.env.VITEST === "true";
  if (!isTest) {
    const cached = subscriptionCache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }
  }

  try {
    const [user, orgUser] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          role: true,
          plan: true,
          subscriptionEndDate: true,
        },
      }),
      prisma.organizationUser.findFirst({
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
      }),
    ]);

    if (!user) {
      return {
        isPremium: false,
        planSlug: "free",
        planName: "Free",
        features: DEFAULT_FREE_PLAN_FEATURES,
      };
    }

    if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
      const adminStatus: SubscriptionStatus = {
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
      if (!isTest) {
        subscriptionCache.set(userId, {
          data: adminStatus,
          expiresAt: Date.now() + SUBSCRIPTION_CACHE_TTL_MS,
        });
      }
      return adminStatus;
    }

    const now = new Date();

    const activeSub = orgUser?.organization.subscriptions[0];
    if (activeSub && (!activeSub.currentPeriodEnd || new Date(activeSub.currentPeriodEnd) >= now)) {
      const orgStatus: SubscriptionStatus = {
        isPremium: activeSub.plan.slug !== "free",
        planSlug: activeSub.plan.slug,
        planName: activeSub.plan.name,
        expiresAt: activeSub.currentPeriodEnd,
        features: (activeSub.plan.features as Record<string, unknown>) || {},
      };
      if (!isTest) {
        subscriptionCache.set(userId, {
          data: orgStatus,
          expiresAt: Date.now() + SUBSCRIPTION_CACHE_TTL_MS,
        });
      }
      return orgStatus;
    }

    // Fallback to User.plan & User.subscriptionEndDate
    const userSubValid =
      (user.plan === "PRO" || user.plan === "PREMIUM") &&
      (!user.subscriptionEndDate || new Date(user.subscriptionEndDate) >= now);

    if (userSubValid) {
      const isPrem = user.plan === "PREMIUM";
      const paidStatus: SubscriptionStatus = {
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
      if (!isTest) {
        subscriptionCache.set(userId, {
          data: paidStatus,
          expiresAt: Date.now() + SUBSCRIPTION_CACHE_TTL_MS,
        });
      }
      return paidStatus;
    }

    const freeStatus: SubscriptionStatus = {
      isPremium: false,
      planSlug: "free",
      planName: "Free",
      features: DEFAULT_FREE_PLAN_FEATURES,
    };
    if (!isTest) {
      subscriptionCache.set(userId, {
        data: freeStatus,
        expiresAt: Date.now() + SUBSCRIPTION_CACHE_TTL_MS,
      });
    }
    return freeStatus;
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
