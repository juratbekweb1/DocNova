import { prisma } from "@/lib/prisma";
import { SubscriptionTier } from "@prisma/client";

export type FeatureType = "chat" | "document_generation" | "resume_analysis" | "rewrite" | "mock_test" | "resume_export";

export const PLAN_LIMITS = {
  FREE: {
    chat: 20,
    document_generation: 3,
    resume_analysis: 1,
    rewrite: 5,
    mock_test: 1,
    resume_export: "basic",
  },
  PRO: {
    chat: 200,
    document_generation: 30,
    resume_analysis: 10,
    rewrite: 50,
    mock_test: 10,
    resume_export: "all",
  },
  PREMIUM: {
    chat: 500,
    document_generation: 100,
    resume_analysis: 30,
    rewrite: 150,
    mock_test: 30,
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
}

export async function checkUserLimit(userId: string, featureType: FeatureType): Promise<LimitCheckResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      lastRequestDate: true,
      mockTestCount: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const plan = user.plan || SubscriptionTier.FREE;
  const limits = PLAN_LIMITS[plan];

  const now = new Date();

  const dailyBudget = parseFloat(process.env.AI_DAILY_BUDGET_USD || '10.0');
  const todayForBudget = new Date();
  todayForBudget.setHours(0, 0, 0, 0);

  const agg = await prisma.aIUsage.aggregate({
    where: { createdAt: { gte: todayForBudget } },
    _sum: { estimatedCostUsd: true }
  });
  const currentDailyCost = agg._sum.estimatedCostUsd || 0;

  if (currentDailyCost >= dailyBudget) {
    return {
      allowed: false,
      limitExceeded: true,
      remaining: 0,
      totalLimit: 0,
      error: 'AI xizmati vaqtincha band (Global Budget Exceeded). Keyinroq urinib koring.',
      code: 'GLOBAL_BUDGET_EXCEEDED'
    };
  }

  
  if (featureType === "resume_export") {
    return {
      allowed: true,
      limitExceeded: false,
      remaining: 999,
      totalLimit: 999,
    };
  }
  
  if (featureType === "mock_test") {
    const lastReq = new Date(user.lastRequestDate);
    const isSameMonth = now.getFullYear() === lastReq.getFullYear() && now.getMonth() === lastReq.getMonth();
    const currentMockTestCount = isSameMonth ? user.mockTestCount : 0;
    const allowed = currentMockTestCount < limits.mock_test;
    return {
      allowed,
      limitExceeded: !allowed,
      remaining: Math.max(0, limits.mock_test - currentMockTestCount),
      totalLimit: limits.mock_test,
      ...( !allowed && { error: "Monthly mock test limit exceeded", code: "LIMIT_EXCEEDED" } )
    };
  }

  // Monthly AI feature limits using AIUsage table
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const featureKey = featureType.toUpperCase();
  
  const usageCount = await prisma.aIUsage.count({
    where: {
      userId,
      feature: featureKey,
      status: "SUCCESS",
      createdAt: {
        gte: startOfMonth
      }
    }
  });

  const limit = (limits as any)[featureType];
  const allowed = usageCount < limit;

  return {
    allowed,
    limitExceeded: !allowed,
    remaining: Math.max(0, limit - usageCount),
    totalLimit: limit,
    ...(!allowed && { error: `Bugungi AI limitingiz tugadi. Pro tarifga o'tib ko'proq foydalanishingiz mumkin.`, code: "LIMIT_EXCEEDED" })
  };
}

export async function trackAIUsage({
  userId,
  organizationId,
  plan,
  feature,
  provider = "gemini",
  model = process.env.GEMINI_MODEL || "gemini-3.8-flash",
  status,
  inputTokens = 0,
  outputTokens = 0,
  requestDurationMs = 0,
  errorCode
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
        errorCode
      }
    });
  } catch (err) {
    console.error("Failed to track AI usage", err);
  }
}
