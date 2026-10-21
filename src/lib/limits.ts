import { prisma } from "@/lib/prisma";
import { SubscriptionTier } from "@prisma/client";

export type FeatureType =
  | "chat"
  | "document_generation"
  | "resume_analysis"
  | "rewrite"
  | "mock_test"
  | "resume_export"
  | "coursework"
  | "presentation";

export const PLAN_LIMITS = {
  FREE: {
    chat: 20,
    document_generation: 3,
    resume_analysis: 1,
    rewrite: 5,
    mock_test: 1,
    coursework: 3,
    presentation: 3,
    resume_export: "basic",
  },
  PRO: {
    chat: 200,
    document_generation: 30,
    resume_analysis: 10,
    rewrite: 50,
    mock_test: 10,
    coursework: 30,
    presentation: 30,
    resume_export: "all",
  },
  PREMIUM: {
    chat: 500,
    document_generation: 100,
    resume_analysis: 30,
    rewrite: 150,
    mock_test: 30,
    coursework: 100,
    presentation: 100,
    resume_export: "all",
  },
};

export interface LimitCheckResult {
  allowed: boolean;
  limitExceeded: boolean;
  remaining: number;
  totalLimit: number;
  error?: string;
  code?: string;
  unlimited?: boolean;
}

export async function checkUserLimit(
  userId: string,
  featureType: FeatureType
): Promise<LimitCheckResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      plan: true,
      lastRequestDate: true,
      mockTestCount: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const isSuperAdmin = user.role === "SUPER_ADMIN" || user.role === "ADMIN";

  const dailyBudget = parseFloat(process.env.AI_DAILY_BUDGET_USD || "10.0");
  const emergencyBudget = parseFloat(process.env.AI_EMERGENCY_BUDGET_USD || "500.0");
  const todayForBudget = new Date();
  todayForBudget.setHours(0, 0, 0, 0);

  const agg = await prisma.aIUsage.aggregate({
    where: { createdAt: { gte: todayForBudget } },
    _sum: { estimatedCostUsd: true },
  });
  const currentDailyCost = agg._sum.estimatedCostUsd || 0;

  // Super Admin: unlimited access on all features. Only stopped by extreme emergency cap ($500)
  if (isSuperAdmin) {
    if (currentDailyCost >= emergencyBudget) {
      return {
        allowed: false,
        limitExceeded: true,
        remaining: 0,
        totalLimit: 0,
        error:
          "AI favqulodda xavfsizlik chegarasi (Emergency Safety Cap Exceeded). API balansini tekshiring.",
        code: "EMERGENCY_BUDGET_EXCEEDED",
      };
    }
    return {
      allowed: true,
      limitExceeded: false,
      remaining: 999999,
      totalLimit: 999999,
      unlimited: true,
    };
  }

  if (currentDailyCost >= dailyBudget) {
    return {
      allowed: false,
      limitExceeded: true,
      remaining: 0,
      totalLimit: 0,
      error: "AI xizmati vaqtincha band (Global Budget Exceeded). Keyinroq urinib koring.",
      code: "GLOBAL_BUDGET_EXCEEDED",
    };
  }

  const plan = user.plan || SubscriptionTier.FREE;
  const limits = PLAN_LIMITS[plan];

  const now = new Date();

  if (featureType === "resume_export") {
    return {
      allowed: true,
      limitExceeded: false,
      remaining: 999,
      totalLimit: 999,
    };
  }

  // Monthly AI feature limits using AIUsage table
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const featureKey = featureType.toUpperCase();

  const featureKeysToCount =
    featureType === "coursework"
      ? [
          "COURSEWORK",
          "REFERAT",
          "REFERAT_EXTENDED",
          "BMI_DIPLOM",
          "EXAM_PREP",
          "ACADEMIC_GENERATION",
        ]
      : featureType === "mock_test"
        ? ["MOCK_TEST"]
        : featureType === "presentation"
          ? ["PRESENTATION"]
          : featureType === "rewrite"
            ? ["REWRITE"]
            : [featureKey];

  const usageCount = await prisma.aIUsage.count({
    where: {
      userId,
      feature: { in: featureKeysToCount },
      status: "SUCCESS",
      createdAt: {
        gte: startOfMonth,
      },
    },
  });

  const limit = (limits[featureType as keyof typeof limits] ?? 10) as number;
  const allowed = usageCount < limit;

  return {
    allowed,
    limitExceeded: !allowed,
    remaining: Math.max(0, limit - usageCount),
    totalLimit: limit,
    ...(!allowed && {
      error: "Limitingiz tugadi! Generatsiyani davom ettirish uchun iltimos obuna sotib oling.",
      code: "LIMIT_EXCEEDED",
    }),
  };
}

export interface SectionLimitStat {
  id: FeatureType;
  title: string;
  used: number;
  total: number;
  remaining: number;
  unlimited: boolean;
  href: string;
}

export async function getAllUserSectionLimits(userId: string): Promise<SectionLimitStat[]> {
  const [sub, apiLimit, usageGroup] = await Promise.all([
    getUserSubscription(userId),
    prisma.userApiLimit.findUnique({ where: { userId } }),
    prisma.aIUsage.groupBy({
      by: ["feature"],
      where: {
        userId,
        status: "SUCCESS",
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _count: { _all: true },
    }),
  ]);

  const plan = sub.plan || "FREE";
  const limits = PLAN_LIMITS[plan];
  const unlimited = sub.isSuperAdmin;

  const countMap = new Map<string, number>();
  for (const row of usageGroup) {
    countMap.set(row.feature, row._count._all);
  }

  const sumFeatures = (keys: string[]) => keys.reduce((acc, k) => acc + (countMap.get(k) || 0), 0);

  const courseworkUsed = sumFeatures([
    "COURSEWORK",
    "REFERAT",
    "REFERAT_EXTENDED",
    "BMI_DIPLOM",
    "EXAM_PREP",
    "ACADEMIC_GENERATION",
  ]);
  const presentationUsed = sumFeatures(["PRESENTATION"]);
  const docGenUsed = Math.max(sumFeatures(["DOCUMENT_GENERATION"]), apiLimit?.count || 0);
  const cvUsed = Math.max(sumFeatures(["RESUME_ANALYSIS"]), apiLimit?.cvCount || 0);
  const rewriteUsed = sumFeatures(["REWRITE"]);
  const mockTestUsed = Math.max(sumFeatures(["MOCK_TEST"]), apiLimit?.ieltsCount || 0);

  const buildStat = (
    id: FeatureType,
    title: string,
    used: number,
    total: number,
    href: string
  ): SectionLimitStat => ({
    id,
    title,
    used,
    total,
    remaining: unlimited ? total : Math.max(0, total - used),
    unlimited,
    href,
  });

  return [
    buildStat(
      "coursework",
      "Kurs ishi, Referat va BMI",
      courseworkUsed,
      limits.coursework,
      "/academic/coursework"
    ),
    buildStat(
      "presentation",
      "Taqdimot (Slaydlar)",
      presentationUsed,
      limits.presentation,
      "/academic/presentation"
    ),
    buildStat(
      "document_generation",
      "AI Yaratishlar (Rezyume & Xat)",
      docGenUsed,
      limits.document_generation,
      "/tools/resume-builder"
    ),
    buildStat(
      "resume_analysis",
      "CV va ATS Tahlili",
      cvUsed,
      limits.resume_analysis,
      "/tools/cv-analyzer"
    ),
    buildStat("rewrite", "AI Tahrirlash va Insho", rewriteUsed, limits.rewrite, "/tools/ai-writer"),
    buildStat(
      "mock_test",
      "IELTS / Mock Testlar",
      mockTestUsed,
      limits.mock_test,
      "/academic/mock-test"
    ),
  ];
}

export async function trackAIUsage({
  userId,
  organizationId,
  plan,
  feature,
  provider = "gemini",
  model = process.env.GEMINI_MODEL || "gemini-1.5-flash",
  status,
  inputTokens = 0,
  outputTokens = 0,
  requestDurationMs = 0,
  errorCode,
}: {
  userId?: string;
  organizationId?: string;
  plan: string;
  feature: string;
  provider?: string;
  model?: string;
  status: "SUCCESS" | "FAILED" | "RATE_LIMITED" | "QUOTA_EXCEEDED";
  inputTokens?: number;
  outputTokens?: number;
  requestDurationMs?: number;
  errorCode?: string;
}) {
  try {
    const totalTokens = inputTokens + outputTokens;
    // Centralized cost (approx $0.075 / 1M input, $0.3 / 1M output for flash, example)
    const inputCost = (inputTokens / 1_000_000) * 0.075;
    const outputCost = (outputTokens / 1_000_000) * 0.3;
    const estimatedCostUsd = inputCost + outputCost;

    await prisma.aIUsage.create({
      data: {
        userId,
        organizationId,
        plan,
        feature,
        provider,
        model,
        status,
        inputTokens,
        outputTokens,
        totalTokens,
        estimatedCostUsd,
        requestDurationMs,
        errorCode,
      },
    });
  } catch (err) {
    console.error("Failed to track AI usage", err);
  }
}

/**
 * Check user subscription status, expiration, and plan tier (FREE vs PRO/PREMIUM)
 */
export async function getUserSubscription(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      plan: true,
      subscriptionEndDate: true,
      aiUsageCount: true,
      dailyAiCount: true,
      lastRequestDate: true,
    },
  });

  if (!user) {
    return { plan: "FREE" as const, isProOrPremium: false, isSuperAdmin: false, user: null };
  }

  const isSuperAdmin = user.role === "SUPER_ADMIN" || user.role === "ADMIN";

  if (isSuperAdmin) {
    return {
      plan: "PREMIUM" as const,
      isProOrPremium: true,
      isSuperAdmin: true,
      user,
    };
  }

  const isExpired = user.subscriptionEndDate
    ? new Date(user.subscriptionEndDate) < new Date()
    : false;
  const activePlan = isExpired ? "FREE" : user.plan || "FREE";

  return {
    plan: activePlan as "FREE" | "PRO" | "PREMIUM",
    isProOrPremium: activePlan === "PRO" || activePlan === "PREMIUM",
    isSuperAdmin: false,
    user,
  };
}

/**
 * Deduct/increment AI generation credits and daily usage in the database
 */
export async function deductUserAiCredit(userId: string): Promise<void> {
  try {
    const now = new Date();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastRequestDate: true, dailyAiCount: true },
    });
    if (!user) return;

    const lastReq = user.lastRequestDate ? new Date(user.lastRequestDate) : new Date(0);
    const isSameDay =
      now.getFullYear() === lastReq.getFullYear() &&
      now.getMonth() === lastReq.getMonth() &&
      now.getDate() === lastReq.getDate();

    await prisma.user.update({
      where: { id: userId },
      data: {
        aiUsageCount: { increment: 1 },
        dailyAiCount: isSameDay ? { increment: 1 } : 1,
        lastRequestDate: now,
      },
    });
  } catch (err) {
    console.error("Failed to deduct user AI credit:", err);
  }
}
