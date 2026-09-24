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
 * Validates if the user currently has an active premium subscription
 * by querying their Personal Organization.
 */
export async function getUserSubscription(userId: string): Promise<SubscriptionStatus> {
  if (!userId) {
    return { isPremium: false, features: DEFAULT_FREE_PLAN_FEATURES };
  }

  try {
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
                createdAt: 'desc'
              },
              take: 1
            }
          }
        }
      }
    });

    if (!orgUser || !orgUser.organization.subscriptions.length) {
      return { isPremium: false, features: DEFAULT_FREE_PLAN_FEATURES };
    }

    const activeSub = orgUser.organization.subscriptions[0];

    return {
      isPremium: true,
      planSlug: activeSub.plan.slug,
      planName: activeSub.plan.name,
      expiresAt: activeSub.currentPeriodEnd,
      features: (activeSub.plan.features as Record<string, unknown>) || {},
    };
  } catch (error) {
    console.error("Failed to fetch subscription, defaulting to FREE:", error);
    return { isPremium: false, features: DEFAULT_FREE_PLAN_FEATURES };
  }
}
