import { prisma } from "@/lib/prisma";
import { SubscriptionTier } from "@prisma/client";

export type FeatureType = "chat" | "mock_test" | "resume_export";

export const PLAN_LIMITS = {
  FREE: {
    chat: 10,       // per day
    mock_test: 1,   // per month
    resume_export: "basic", // Basic templates only
  },
  PRO: {
    chat: 60,
    mock_test: 10,
    resume_export: "all",
  },
  PREMIUM: {
    chat: 200,
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
      dailyAiCount: true,
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
  const lastReq = new Date(user.lastRequestDate);
  const isSameDay = 
    now.getFullYear() === lastReq.getFullYear() &&
    now.getMonth() === lastReq.getMonth() &&
    now.getDate() === lastReq.getDate();

  const isSameMonth =
    now.getFullYear() === lastReq.getFullYear() &&
    now.getMonth() === lastReq.getMonth();

  // Reset counts if necessary (Mock in memory, actual reset happens in increment)
  let currentDailyAiCount = isSameDay ? user.dailyAiCount : 0;
  let currentMockTestCount = isSameMonth ? user.mockTestCount : 0;

  switch (featureType) {
    case "chat": {
      const allowed = currentDailyAiCount < limits.chat;
      return {
        allowed,
        limitExceeded: !allowed,
        remaining: Math.max(0, limits.chat - currentDailyAiCount),
        totalLimit: limits.chat,
        ...( !allowed && { error: "Daily chat limit exceeded", code: "LIMIT_EXCEEDED" } )
      };
    }
    case "mock_test": {
      const allowed = currentMockTestCount < limits.mock_test;
      return {
        allowed,
        limitExceeded: !allowed,
        remaining: Math.max(0, limits.mock_test - currentMockTestCount),
        totalLimit: limits.mock_test,
        ...( !allowed && { error: "Monthly mock test limit exceeded", code: "LIMIT_EXCEEDED" } )
      };
    }
    case "resume_export": {
      // Resume export limit is qualitative here, so we just return allowed. 
      // Specific template check should be done at the template level.
      return {
        allowed: true,
        limitExceeded: false,
        remaining: 999,
        totalLimit: 999,
      };
    }
    default:
      return { allowed: false, limitExceeded: true, remaining: 0, totalLimit: 0, code: "INVALID_FEATURE" };
  }
}

export async function incrementFeatureUsage(userId: string, featureType: FeatureType) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { dailyAiCount: true, mockTestCount: true, lastRequestDate: true },
  });
  
  if (!user) return;

  const now = new Date();
  const lastReq = new Date(user.lastRequestDate);
  const isSameDay = 
    now.getFullYear() === lastReq.getFullYear() &&
    now.getMonth() === lastReq.getMonth() &&
    now.getDate() === lastReq.getDate();

  const isSameMonth =
    now.getFullYear() === lastReq.getFullYear() &&
    now.getMonth() === lastReq.getMonth();

  const updates: any = { lastRequestDate: now };

  if (featureType === "chat") {
    updates.dailyAiCount = isSameDay ? user.dailyAiCount + 1 : 1;
    if (!isSameMonth) updates.mockTestCount = 0; // reset monthlies if it's a new month
  } else if (featureType === "mock_test") {
    updates.mockTestCount = isSameMonth ? user.mockTestCount + 1 : 1;
    if (!isSameDay) updates.dailyAiCount = 0; // reset dailies if it's a new day
  }

  await prisma.user.update({
    where: { id: userId },
    data: updates,
  });
}
