import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS } from "@/lib/limits";

export interface DailyTrendItem {
  dateStr: string;
  label: string;
  requests: number;
  tokens: number;
  costUsd: number;
  costUzs: number;
  newUsers: number;
}

export interface FeatureStatItem {
  feature: string;
  label: string;
  requests: number;
  successful: number;
  failed: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: number;
  costUzs: number;
  avgDurationMs: number;
}

export interface ModelStatItem {
  model: string;
  provider: string;
  requests: number;
  tokens: number;
  costUsd: number;
  costUzs: number;
}

export interface SuperAdminUserRow {
  id: string;
  name: string;
  email: string;
  username: string | null;
  role: string;
  plan: string;
  avatar: string | null;
  isGoogle: boolean;
  isTelegramLinked: boolean;
  telegramUsername: string | null;
  twoFactorEnabled: boolean;
  isLocked: boolean;
  createdAt: string;
  lastActiveAt: string | null;
  documentsCount: number;
  todayRequests: number;
  todayTokens: number;
  todayCostUsd: number;
  monthRequests: number;
  monthTokens: number;
  monthCostUsd: number;
  monthCostUzs: number;
  academicUsed: number;
  academicLimit: number;
  totalAiUsageCount: number;
}

export interface LiveAiLogRow {
  id: string;
  userName: string;
  userEmail: string;
  plan: string;
  feature: string;
  featureLabel: string;
  model: string;
  status: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: number;
  costUzs: number;
  durationMs: number;
  errorCode: string | null;
  createdAt: string;
}

export interface SuperAdminTransactionRow {
  id: string;
  userName: string;
  userEmail: string;
  amount: number;
  provider: string;
  status: string;
  createdAt: string;
}

export interface SuperAdminDocumentRow {
  id: string;
  title: string;
  type: string;
  status: string;
  ownerName: string;
  ownerEmail: string;
  updatedAt: string;
}

export interface SuperAdminSecurityRow {
  id: string;
  eventType: string;
  ipAddress: string;
  path: string;
  userAgent: string | null;
  createdAt: string;
}

export interface SuperAdminSupportTicketRow {
  id: string;
  category: string;
  subject: string;
  message: string;
  contact: string;
  rating: number;
  pageUrl: string;
  status: string;
  userName: string;
  userEmail: string;
  createdAt: string;
}

export interface SuperAdminSiteReport {
  generatedAtDate: string;
  generatedAtTime: string;
  usdToUzsRate: number;

  users: {
    total: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
    activeSessions: number;
    activeToday: number;
    activeThisMonth: number;
    googleOAuthCount: number;
    emailAuthCount: number;
    telegramLinkedCount: number;
    twoFactorCount: number;
    lockedCount: number;
    byPlan: {
      FREE: number;
      PRO: number;
      PREMIUM: number;
      paidTotal: number;
      conversionPercent: number;
    };
    byRole: {
      SUPER_ADMIN: number;
      ADMIN: number;
      USER: number;
    };
  };

  aiCostsAndUsage: {
    dailyBudgetUsd: number;
    emergencyBudgetUsd: number;
    dailyBudgetUsedPercent: number;
    today: {
      requests: number;
      successful: number;
      failed: number;
      quotaExceeded: number;
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
      costUsd: number;
      costUzs: number;
      avgDurationMs: number;
    };
    week: {
      requests: number;
      totalTokens: number;
      costUsd: number;
      costUzs: number;
    };
    month: {
      requests: number;
      successful: number;
      failed: number;
      quotaExceeded: number;
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
      costUsd: number;
      costUzs: number;
      avgDurationMs: number;
      successRatePercent: number;
    };
    allTime: {
      requests: number;
      totalTokens: number;
      costUsd: number;
      costUzs: number;
    };
    planUsage: {
      FREE: { users: number; requests: number; tokens: number; costUsd: number; costUzs: number };
      PRO: { users: number; requests: number; tokens: number; costUsd: number; costUzs: number };
      PREMIUM: {
        users: number;
        requests: number;
        tokens: number;
        costUsd: number;
        costUzs: number;
      };
    };
    features: FeatureStatItem[];
    models: ModelStatItem[];
    dailyTrend: DailyTrendItem[];
    recentLogs: LiveAiLogRow[];
  };

  finance: {
    todayRevenueUzs: number;
    monthRevenueUzs: number;
    allTimeRevenueUzs: number;
    estimatedMrrUzs: number;
    netMarginUzs: number;
    paidTransactionsCount: number;
    pendingTransactionsCount: number;
    failedTransactionsCount: number;
    activeSubscriptionsCount: number;
    promoCodesCount: number;
    promoTotalUses: number;
    byProvider: Array<{ provider: string; count: number; totalUzs: number }>;
    recentTransactions: SuperAdminTransactionRow[];
  };

  content: {
    totalDocuments: number;
    documentsToday: number;
    documentsByType: Array<{ type: string; count: number }>;
    documentsByStatus: { DRAFT: number; PUBLISHED: number; ARCHIVED: number };
    totalAtsAnalyses: number;
    avgAtsScore: number;
    totalMockTests: number;
    mockTestsByLang: Array<{ language: string; count: number }>;
    totalChatMessages: number;
    totalAiConversations: number;
    totalJobApplications: number;
    totalFolders: number;
    recentDocuments: SuperAdminDocumentRow[];
  };

  securityAndSystem: {
    totalSecurityLogs: number;
    recentLogs: SuperAdminSecurityRow[];
    eventBreakdown: Array<{ eventType: string; count: number }>;
    envStatus: {
      database: boolean;
      geminiAi: boolean;
      telegramBot: boolean;
      telegramAdminChat: boolean;
      googleOAuth: boolean;
      paymentGateways: boolean;
    };
  };

  userRows: SuperAdminUserRow[];
  supportTickets: SuperAdminSupportTicketRow[];
}

const FEATURE_LABELS: Record<string, string> = {
  COURSEWORK: "Kurs ishi generatori",
  REFERAT: "Mustaqil ish va Referat",
  REFERAT_EXTENDED: "Kengaytirilgan Referat (10-15 bet)",
  BMI_DIPLOM: "Diplom ishi va BMI",
  PRESENTATION: "Prezentatsiya va Slaydlar (PPTX)",
  EXAM_PREP: "Imtihon biletlari va Test",
  ACADEMIC_GENERATION: "Akademik generatsiya",
  MOCK_TEST: "Mock Test (IELTS / TRKI / TÖMER)",
  REWRITE: "AI Yozuvchi / Insho tahriri",
  DOCUMENT_GENERATION: "Rezyume va Xat yaratish",
  RESUME_ANALYSIS: "CV va ATS Tahlili",
  CHAT: "AI Maslahatchi (Chat)",
};

export function getFeatureLabel(feature: string): string {
  return FEATURE_LABELS[feature] || feature.replace(/_/g, " ");
}

export async function getSuperAdminSiteReport(): Promise<SuperAdminSiteReport> {
  const safe = <T>(p: Promise<T>, fallback: T): Promise<T> =>
    p.catch((err) => {
      console.error("[SUPER_ADMIN_ANALYTICS_ERROR]", err instanceof Error ? err.message : err);
      return fallback;
    });

  const now = new Date();
  const TZ_MS = 5 * 60 * 60 * 1000;
  const uzTime = new Date(now.getTime() + TZ_MS);
  const generatedAtDate = uzTime.toISOString().split("T")[0];
  const generatedAtTime = uzTime.toISOString().split("T")[1].slice(0, 5);

  const startOfToday = new Date(
    Date.UTC(uzTime.getUTCFullYear(), uzTime.getUTCMonth(), uzTime.getUTCDate()) - TZ_MS
  );
  const startOfWeek = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(
    Date.UTC(uzTime.getUTCFullYear(), uzTime.getUTCMonth(), 1) - TZ_MS
  );

  const usdToUzsRate = parseFloat(process.env.AI_COST_USD_TO_UZS || "12800");
  const dailyBudgetUsd = parseFloat(process.env.AI_DAILY_BUDGET_USD || "10.0");
  const emergencyBudgetUsd = parseFloat(process.env.AI_EMERGENCY_BUDGET_USD || "500.0");

  const [
    usersDb,
    activeSessionsCount,
    monthlyAiUsages,
    allTimeAiAgg,
    recentAiUsagesDb,
    transactionsDb,
    activeSubsCount,
    promosDb,
    totalDocuments,
    documentsToday,
    docTypeGroup,
    docStatusGroup,
    recentDocsDb,
    atsAgg,
    mockTestsGroup,
    chatMessagesCount,
    aiConversationsCount,
    jobAppsCount,
    foldersCount,
    totalSecurityLogs,
    recentSecurityLogsDb,
    securityEventGroup,
    supportTicketsDb,
  ] = await Promise.all([
    safe(
      prisma.user.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          displayName: true,
          username: true,
          email: true,
          role: true,
          plan: true,
          avatar: true,
          image: true,
          isTelegramLinked: true,
          telegramId: true,
          telegramUsername: true,
          twoFactorEnabled: true,
          lockedUntil: true,
          aiUsageCount: true,
          createdAt: true,
          lastLoginAt: true,
          lastSeenAt: true,
          lastRequestDate: true,
          accounts: { select: { provider: true } },
          _count: { select: { documents: true, aiusages: true } },
        },
      }),
      []
    ),
    safe(prisma.session.count({ where: { expires: { gt: now } } }), 0),
    safe(
      prisma.aIUsage.findMany({
        where: { createdAt: { gte: startOfMonth } },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          userId: true,
          plan: true,
          feature: true,
          provider: true,
          model: true,
          status: true,
          inputTokens: true,
          outputTokens: true,
          totalTokens: true,
          estimatedCostUsd: true,
          requestDurationMs: true,
          errorCode: true,
          createdAt: true,
        },
      }),
      []
    ),
    safe(
      prisma.aIUsage.aggregate({
        _count: { _all: true },
        _sum: {
          inputTokens: true,
          outputTokens: true,
          totalTokens: true,
          estimatedCostUsd: true,
        },
      }),
      {
        _count: { _all: 0 },
        _sum: {
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          estimatedCostUsd: 0,
        },
      }
    ),
    safe(
      prisma.aIUsage.findMany({
        orderBy: { createdAt: "desc" },
        take: 30,
        include: {
          user: { select: { name: true, email: true, plan: true } },
        },
      }),
      []
    ),
    safe(
      prisma.transaction.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
        },
      }),
      []
    ),
    safe(prisma.subscription.count({ where: { status: "active" } }), 0),
    safe(prisma.promoCode.findMany(), []),
    safe(prisma.document.count({ where: { deletedAt: null } }), 0),
    safe(
      prisma.document.count({
        where: { deletedAt: null, createdAt: { gte: startOfToday } },
      }),
      0
    ),
    safe(
      prisma.document.groupBy({
        by: ["type"],
        where: { deletedAt: null },
        _count: { _all: true },
      }),
      []
    ),
    safe(
      prisma.document.groupBy({
        by: ["status"],
        where: { deletedAt: null },
        _count: { _all: true },
      }),
      []
    ),
    safe(
      prisma.document.findMany({
        where: { deletedAt: null },
        orderBy: { updatedAt: "desc" },
        take: 10,
        include: { user: { select: { name: true, email: true } } },
      }),
      []
    ),
    safe(
      prisma.atsAnalysis.aggregate({
        _count: { _all: true },
        _avg: { overallScore: true },
      }),
      { _count: { _all: 0 }, _avg: { overallScore: 0 } }
    ),
    safe(
      prisma.mockTestSession.groupBy({
        by: ["language"],
        _count: { _all: true },
      }),
      []
    ),
    safe(prisma.chatMessage.count(), 0),
    safe(prisma.aIConversation.count(), 0),
    safe(prisma.jobApplication.count(), 0),
    safe(prisma.folder.count(), 0),
    safe(prisma.securityLog.count(), 0),
    safe(
      prisma.securityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      []
    ),
    safe(
      prisma.securityLog.groupBy({
        by: ["eventType"],
        _count: { _all: true },
      }),
      []
    ),
    safe(
      prisma.auditLog.findMany({
        where: { action: "SUPPORT_TICKET" },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { user: { select: { name: true, email: true } } },
      }),
      []
    ),
  ]);

  // 1. Process Users
  let newToday = 0;
  let newThisWeek = 0;
  let newThisMonth = 0;
  let googleOAuthCount = 0;
  let telegramLinkedCount = 0;
  let twoFactorCount = 0;
  let lockedCount = 0;

  const byPlan = { FREE: 0, PRO: 0, PREMIUM: 0, paidTotal: 0, conversionPercent: 0 };
  const byRole = { SUPER_ADMIN: 0, ADMIN: 0, USER: 0 };

  const userMap = new Map<string, SuperAdminUserRow>();

  for (const u of usersDb) {
    if (u.createdAt >= startOfToday) newToday++;
    if (u.createdAt >= startOfWeek) newThisWeek++;
    if (u.createdAt >= startOfMonth) newThisMonth++;

    const isGoogle = (u.accounts || []).some((a) => a.provider === "google");
    if (isGoogle) googleOAuthCount++;

    const isTg = Boolean(u.isTelegramLinked || u.telegramId);
    if (isTg) telegramLinkedCount++;

    if (u.twoFactorEnabled) twoFactorCount++;
    const isLocked = Boolean(u.lockedUntil && new Date(u.lockedUntil) > now);
    if (isLocked) lockedCount++;

    const planKey = (u.plan as "FREE" | "PRO" | "PREMIUM") || "FREE";
    if (planKey in byPlan) byPlan[planKey]++;

    const roleKey = (u.role as "SUPER_ADMIN" | "ADMIN" | "USER") || "USER";
    if (roleKey in byRole) byRole[roleKey]++;

    const tierLimits = PLAN_LIMITS[planKey] || PLAN_LIMITS.FREE;

    userMap.set(u.id, {
      id: u.id,
      name: u.displayName || u.name || "Foydalanuvchi",
      email: u.email || "Email kiritilmagan",
      username: u.username || null,
      role: roleKey,
      plan: planKey,
      avatar: u.avatar || u.image || null,
      isGoogle,
      isTelegramLinked: isTg,
      telegramUsername: u.telegramUsername || null,
      twoFactorEnabled: Boolean(u.twoFactorEnabled),
      isLocked,
      createdAt: u.createdAt.toISOString(),
      lastActiveAt: (u.lastSeenAt || u.lastLoginAt || u.lastRequestDate)?.toISOString() || null,
      documentsCount: u._count?.documents || 0,
      todayRequests: 0,
      todayTokens: 0,
      todayCostUsd: 0,
      monthRequests: 0,
      monthTokens: 0,
      monthCostUsd: 0,
      monthCostUzs: 0,
      academicUsed: 0,
      academicLimit:
        roleKey === "SUPER_ADMIN" || roleKey === "ADMIN" ? 999999 : tierLimits.coursework || 3,
      totalAiUsageCount: Math.max(u.aiUsageCount || 0, u._count?.aiusages || 0),
    });
  }

  byPlan.paidTotal = byPlan.PRO + byPlan.PREMIUM;
  byPlan.conversionPercent =
    usersDb.length > 0 ? Math.round((byPlan.paidTotal / usersDb.length) * 1000) / 10 : 0;

  // 2. Process AI Usages
  const calcBucket = (items: typeof monthlyAiUsages) => {
    let successful = 0;
    let failed = 0;
    let quotaExceeded = 0;
    let inputTokens = 0;
    let outputTokens = 0;
    let costUsd = 0;
    let durationSum = 0;
    let durationCount = 0;

    for (const item of items) {
      if (item.status === "SUCCESS") successful++;
      else if (item.status === "FAILED") failed++;
      else if (item.status === "QUOTA_EXCEEDED" || item.status === "RATE_LIMITED") quotaExceeded++;

      inputTokens += item.inputTokens || 0;
      outputTokens += item.outputTokens || 0;
      costUsd += item.estimatedCostUsd || 0;

      if (item.requestDurationMs && item.requestDurationMs > 0) {
        durationSum += item.requestDurationMs;
        durationCount++;
      }
    }

    const totalTokens = inputTokens + outputTokens;
    const costUzs = Math.round(costUsd * usdToUzsRate);
    const avgDurationMs = durationCount > 0 ? Math.round(durationSum / durationCount) : 0;

    return {
      requests: items.length,
      successful,
      failed,
      quotaExceeded,
      inputTokens,
      outputTokens,
      totalTokens,
      costUsd,
      costUzs,
      avgDurationMs,
    };
  };

  const todayAiItems = monthlyAiUsages.filter((u) => u.createdAt >= startOfToday);
  const weekAiItems = monthlyAiUsages.filter((u) => u.createdAt >= startOfWeek);

  const todayStats = calcBucket(todayAiItems);
  const weekBucket = calcBucket(weekAiItems);
  const monthBucket = calcBucket(monthlyAiUsages);

  const activeTodayUserSet = new Set<string>();
  const activeMonthUserSet = new Set<string>();

  const planUsage = {
    FREE: { users: byPlan.FREE, requests: 0, tokens: 0, costUsd: 0, costUzs: 0 },
    PRO: { users: byPlan.PRO, requests: 0, tokens: 0, costUsd: 0, costUzs: 0 },
    PREMIUM: { users: byPlan.PREMIUM, requests: 0, tokens: 0, costUsd: 0, costUzs: 0 },
  };

  const featureMap = new Map<
    string,
    {
      requests: number;
      successful: number;
      failed: number;
      inputTokens: number;
      outputTokens: number;
      costUsd: number;
      durationSum: number;
      durationCount: number;
    }
  >();

  const modelMap = new Map<
    string,
    { provider: string; requests: number; tokens: number; costUsd: number }
  >();

  for (const u of monthlyAiUsages) {
    if (u.userId) {
      activeMonthUserSet.add(u.userId);
      if (u.createdAt >= startOfToday) {
        activeTodayUserSet.add(u.userId);
      }
    }

    const tokens = (u.inputTokens || 0) + (u.outputTokens || 0);
    const cost = u.estimatedCostUsd || 0;

    // Plan usage
    const pKey = (u.plan as "FREE" | "PRO" | "PREMIUM") || "FREE";
    if (pKey in planUsage) {
      planUsage[pKey].requests++;
      planUsage[pKey].tokens += tokens;
      planUsage[pKey].costUsd += cost;
    }

    // Feature breakdown
    const fKey = u.feature || "OTHER";
    const fCur = featureMap.get(fKey) || {
      requests: 0,
      successful: 0,
      failed: 0,
      inputTokens: 0,
      outputTokens: 0,
      costUsd: 0,
      durationSum: 0,
      durationCount: 0,
    };
    fCur.requests++;
    if (u.status === "SUCCESS") fCur.successful++;
    else if (u.status === "FAILED") fCur.failed++;
    fCur.inputTokens += u.inputTokens || 0;
    fCur.outputTokens += u.outputTokens || 0;
    fCur.costUsd += cost;
    if (u.requestDurationMs && u.requestDurationMs > 0) {
      fCur.durationSum += u.requestDurationMs;
      fCur.durationCount++;
    }
    featureMap.set(fKey, fCur);

    // Model breakdown
    const mKey = u.model || "gemini-flash";
    const mCur = modelMap.get(mKey) || {
      provider: u.provider || "gemini",
      requests: 0,
      tokens: 0,
      costUsd: 0,
    };
    mCur.requests++;
    mCur.tokens += tokens;
    mCur.costUsd += cost;
    modelMap.set(mKey, mCur);

    // Per-user stats
    if (u.userId) {
      const uRow = userMap.get(u.userId);
      if (uRow) {
        uRow.monthRequests++;
        uRow.monthTokens += tokens;
        uRow.monthCostUsd += cost;
        uRow.monthCostUzs = Math.round(uRow.monthCostUsd * usdToUzsRate);

        if (u.createdAt >= startOfToday) {
          uRow.todayRequests++;
          uRow.todayTokens += tokens;
          uRow.todayCostUsd += cost;
        }

        if (
          [
            "COURSEWORK",
            "REFERAT",
            "REFERAT_EXTENDED",
            "BMI_DIPLOM",
            "EXAM_PREP",
            "ACADEMIC_GENERATION",
          ].includes(fKey) &&
          u.status === "SUCCESS"
        ) {
          uRow.academicUsed++;
        }

        const iso = u.createdAt.toISOString();
        if (!uRow.lastActiveAt || iso > uRow.lastActiveAt) {
          uRow.lastActiveAt = iso;
        }
      }
    }
  }

  planUsage.FREE.costUzs = Math.round(planUsage.FREE.costUsd * usdToUzsRate);
  planUsage.PRO.costUzs = Math.round(planUsage.PRO.costUsd * usdToUzsRate);
  planUsage.PREMIUM.costUzs = Math.round(planUsage.PREMIUM.costUsd * usdToUzsRate);

  const features: FeatureStatItem[] = Array.from(featureMap.entries())
    .map(([feature, d]) => ({
      feature,
      label: getFeatureLabel(feature),
      requests: d.requests,
      successful: d.successful,
      failed: d.failed,
      inputTokens: d.inputTokens,
      outputTokens: d.outputTokens,
      totalTokens: d.inputTokens + d.outputTokens,
      costUsd: d.costUsd,
      costUzs: Math.round(d.costUsd * usdToUzsRate),
      avgDurationMs: d.durationCount > 0 ? Math.round(d.durationSum / d.durationCount) : 0,
    }))
    .sort((a, b) => b.requests - a.requests);

  const models: ModelStatItem[] = Array.from(modelMap.entries())
    .map(([model, d]) => ({
      model,
      provider: d.provider,
      requests: d.requests,
      tokens: d.tokens,
      costUsd: d.costUsd,
      costUzs: Math.round(d.costUsd * usdToUzsRate),
    }))
    .sort((a, b) => b.requests - a.requests);

  // 7-day trend
  const dailyTrend: DailyTrendItem[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(startOfToday.getTime() - i * 24 * 60 * 60 * 1000);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const uzDay = new Date(dayStart.getTime() + TZ_MS);
    const dateStr = uzDay.toISOString().split("T")[0];
    const label = dateStr.slice(5); // MM-DD

    const dayAi = monthlyAiUsages.filter((u) => u.createdAt >= dayStart && u.createdAt < dayEnd);
    const dayUsers = usersDb.filter((u) => u.createdAt >= dayStart && u.createdAt < dayEnd).length;

    let dayTokens = 0;
    let dayCostUsd = 0;
    for (const x of dayAi) {
      dayTokens += (x.inputTokens || 0) + (x.outputTokens || 0);
      dayCostUsd += x.estimatedCostUsd || 0;
    }

    dailyTrend.push({
      dateStr,
      label,
      requests: dayAi.length,
      tokens: dayTokens,
      costUsd: dayCostUsd,
      costUzs: Math.round(dayCostUsd * usdToUzsRate),
      newUsers: dayUsers,
    });
  }

  const allTimeTokens =
    allTimeAiAgg._sum.totalTokens ||
    (allTimeAiAgg._sum.inputTokens || 0) + (allTimeAiAgg._sum.outputTokens || 0);
  const allTimeCostUsd = allTimeAiAgg._sum.estimatedCostUsd || monthBucket.costUsd;
  const allTimeCostUzs = Math.round(allTimeCostUsd * usdToUzsRate);

  const recentLogs: LiveAiLogRow[] = recentAiUsagesDb.map((r) => {
    const inTok = r.inputTokens || 0;
    const outTok = r.outputTokens || 0;
    const totTok = r.totalTokens || inTok + outTok;
    const cUsd = r.estimatedCostUsd || 0;
    return {
      id: r.id,
      userName: r.user?.name || "Foydalanuvchi",
      userEmail: r.user?.email || "—",
      plan: r.plan || r.user?.plan || "FREE",
      feature: r.feature,
      featureLabel: getFeatureLabel(r.feature),
      model: r.model,
      status: r.status,
      inputTokens: inTok,
      outputTokens: outTok,
      totalTokens: totTok,
      costUsd: cUsd,
      costUzs: Math.round(cUsd * usdToUzsRate),
      durationMs: r.requestDurationMs || 0,
      errorCode: r.errorCode || null,
      createdAt: r.createdAt.toISOString(),
    };
  });

  // 3. Process Finance & Transactions
  const PAID_STATUSES = new Set(["PAID", "COMPLETED", "success", "SUCCESS"]);
  let todayRevenueUzs = 0;
  let monthRevenueUzs = 0;
  let allTimeRevenueUzs = 0;
  let paidTransactionsCount = 0;
  let pendingTransactionsCount = 0;
  let failedTransactionsCount = 0;

  const providerMap = new Map<string, { count: number; totalUzs: number }>();

  for (const tr of transactionsDb) {
    const isPaid = PAID_STATUSES.has(tr.status);
    if (isPaid) {
      paidTransactionsCount++;
      allTimeRevenueUzs += tr.amount || 0;
      if (tr.createdAt >= startOfMonth) monthRevenueUzs += tr.amount || 0;
      if (tr.createdAt >= startOfToday) todayRevenueUzs += tr.amount || 0;

      const prov = (tr.provider || "OTHER").toUpperCase();
      const cur = providerMap.get(prov) || { count: 0, totalUzs: 0 };
      cur.count++;
      cur.totalUzs += tr.amount || 0;
      providerMap.set(prov, cur);
    } else if (tr.status === "PENDING" || tr.status === "pending") {
      pendingTransactionsCount++;
    } else {
      failedTransactionsCount++;
    }
  }

  const estimatedMrrUzs = byPlan.PRO * 39000 + byPlan.PREMIUM * 69000;
  const effectiveMonthlyRev = Math.max(monthRevenueUzs, estimatedMrrUzs);
  const netMarginUzs = effectiveMonthlyRev - monthBucket.costUzs;

  const byProvider = Array.from(providerMap.entries()).map(([provider, d]) => ({
    provider,
    count: d.count,
    totalUzs: d.totalUzs,
  }));

  const recentTransactions: SuperAdminTransactionRow[] = transactionsDb.slice(0, 15).map((tr) => ({
    id: tr.id,
    userName: tr.user?.name || "Foydalanuvchi",
    userEmail: tr.user?.email || "—",
    amount: tr.amount,
    provider: tr.provider,
    status: tr.status,
    createdAt: tr.createdAt.toISOString(),
  }));

  const promoTotalUses = promosDb.reduce((acc, p) => acc + (p.timesUsed || 0), 0);

  // 4. Process Content
  const documentsByType = docTypeGroup.map((g) => ({
    type: String(g.type),
    count: g._count._all,
  }));

  const documentsByStatus = { DRAFT: 0, PUBLISHED: 0, ARCHIVED: 0 };
  for (const g of docStatusGroup) {
    const sKey = String(g.status) as "DRAFT" | "PUBLISHED" | "ARCHIVED";
    if (sKey in documentsByStatus) {
      documentsByStatus[sKey] = g._count._all;
    }
  }

  const mockTestsByLang = mockTestsGroup.map((m) => ({
    language: m.language,
    count: m._count._all,
  }));
  const totalMockTests = mockTestsByLang.reduce((acc, m) => acc + m.count, 0);

  const recentDocuments: SuperAdminDocumentRow[] = recentDocsDb.map((d) => ({
    id: d.id,
    title: d.title,
    type: String(d.type),
    status: String(d.status),
    ownerName: d.user?.name || "Foydalanuvchi",
    ownerEmail: d.user?.email || "—",
    updatedAt: d.updatedAt.toISOString(),
  }));

  // 5. Security & System
  const eventBreakdown = securityEventGroup
    .map((e) => ({ eventType: e.eventType, count: e._count._all }))
    .sort((a, b) => b.count - a.count);

  const recentSecurityRows: SuperAdminSecurityRow[] = recentSecurityLogsDb.map((s) => ({
    id: s.id,
    eventType: s.eventType,
    ipAddress: s.ipAddress || "127.0.0.1",
    path: s.path || "/",
    userAgent: s.userAgent || null,
    createdAt: s.createdAt.toISOString(),
  }));

  const userRows = Array.from(userMap.values()).sort((a, b) => {
    if (b.monthTokens !== a.monthTokens) return b.monthTokens - a.monthTokens;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const successRatePercent =
    monthBucket.requests > 0
      ? Math.round((monthBucket.successful / monthBucket.requests) * 1000) / 10
      : 100;

  return {
    generatedAtDate,
    generatedAtTime,
    usdToUzsRate,

    users: {
      total: usersDb.length,
      newToday,
      newThisWeek,
      newThisMonth,
      activeSessions: activeSessionsCount,
      activeToday: activeTodayUserSet.size,
      activeThisMonth: activeMonthUserSet.size,
      googleOAuthCount,
      emailAuthCount: Math.max(0, usersDb.length - googleOAuthCount),
      telegramLinkedCount,
      twoFactorCount,
      lockedCount,
      byPlan,
      byRole,
    },

    aiCostsAndUsage: {
      dailyBudgetUsd,
      emergencyBudgetUsd,
      dailyBudgetUsedPercent:
        dailyBudgetUsd > 0 ? Math.min(100, Math.round((todayStats.costUsd / dailyBudgetUsd) * 1000) / 10) : 0,
      today: todayStats,
      week: {
        requests: weekBucket.requests,
        totalTokens: weekBucket.totalTokens,
        costUsd: weekBucket.costUsd,
        costUzs: weekBucket.costUzs,
      },
      month: {
        ...monthBucket,
        successRatePercent,
      },
      allTime: {
        requests: Math.max(allTimeAiAgg._count._all, monthBucket.requests),
        totalTokens: Math.max(allTimeTokens, monthBucket.totalTokens),
        costUsd: allTimeCostUsd,
        costUzs: allTimeCostUzs,
      },
      planUsage,
      features,
      models,
      dailyTrend,
      recentLogs,
    },

    finance: {
      todayRevenueUzs,
      monthRevenueUzs,
      allTimeRevenueUzs,
      estimatedMrrUzs,
      netMarginUzs,
      paidTransactionsCount,
      pendingTransactionsCount,
      failedTransactionsCount,
      activeSubscriptionsCount: Math.max(activeSubsCount, byPlan.paidTotal),
      promoCodesCount: promosDb.length,
      promoTotalUses,
      byProvider,
      recentTransactions,
    },

    content: {
      totalDocuments,
      documentsToday,
      documentsByType,
      documentsByStatus,
      totalAtsAnalyses: atsAgg._count._all || 0,
      avgAtsScore: Math.round(atsAgg._avg.overallScore || 0),
      totalMockTests,
      mockTestsByLang,
      totalChatMessages: chatMessagesCount,
      totalAiConversations: aiConversationsCount,
      totalJobApplications: jobAppsCount,
      totalFolders: foldersCount,
      recentDocuments,
    },

    securityAndSystem: {
      totalSecurityLogs,
      recentLogs: recentSecurityRows,
      eventBreakdown,
      envStatus: {
        database: true,
        geminiAi: Boolean(
          process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
        ),
        telegramBot: Boolean(process.env.TELEGRAM_BOT_TOKEN),
        telegramAdminChat: Boolean(process.env.TELEGRAM_ADMIN_CHAT_ID),
        googleOAuth: Boolean(
          process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
        ),
        paymentGateways: Boolean(
          process.env.PAYX_API_KEY ||
            process.env.CLICK_MERCHANT_ID ||
            process.env.PAYME_MERCHANT_ID
        ),
      },
    },

    userRows,
    supportTickets: supportTicketsDb.map((log) => {
      const meta = (log.metadata as Record<string, unknown>) || {};
      return {
        id: log.id,
        category: String(meta.category || "Murojaat"),
        subject: String(meta.subject || ""),
        message: String(meta.message || ""),
        contact: String(meta.contact || log.user?.email || "—"),
        rating: Number(meta.rating || 5),
        pageUrl: String(meta.pageUrl || "/help"),
        status: String(meta.status || "QABUL_QILINDI"),
        userName: String(meta.userName || log.user?.name || "Foydalanuvchi"),
        userEmail: String(meta.userEmail || log.user?.email || "—"),
        createdAt: log.createdAt.toISOString(),
      };
    }),
  };
}
