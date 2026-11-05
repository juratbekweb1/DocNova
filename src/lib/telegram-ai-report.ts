import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS } from "@/lib/limits";

export interface UserAiSummary {
  userId: string;
  name: string;
  email: string;
  plan: string;
  role: string;
  avatar?: string;
  isGoogle?: boolean;
  isTelegramLinked?: boolean;
  todayRequests: number;
  todayTokens: number;
  monthRequests: number;
  monthTokens: number;
  monthCostUsd: number;
  monthCostUzs: number;
  academicLimit: number;
  academicUsed: number;
  documentsCount?: number;
  lastActive: Date | null;
  featureBreakdown: Record<string, number>;
}

export interface PlatformAiSummary {
  reportDateStr: string;
  reportTimeStr: string;
  today: {
    totalRequests: number;
    successful: number;
    failed: number;
    quotaExceeded: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    costUsd: number;
    costUzs: number;
    activeUsers: number;
    newUsers?: number;
    documentsCreated?: number;
    revenueUzs?: number;
  };
  month: {
    totalRequests: number;
    successful: number;
    failed: number;
    quotaExceeded?: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    costUsd: number;
    costUzs: number;
    activeUsers: number;
    newUsers?: number;
    avgDurationMs?: number;
    revenueUzs?: number;
  };
  allTime?: {
    totalRequests: number;
    totalTokens: number;
    costUsd: number;
    costUzs: number;
    revenueUzs: number;
  };
  platformStats?: {
    totalUsers: number;
    googleUsers: number;
    emailUsers: number;
    telegramLinkedUsers: number;
    activeSessions: number;
    dailyBudgetUsd: number;
    dailyBudgetPercent: number;
    estimatedMrrUzs: number;
    netMarginUzs: number;
    totalDocuments: number;
    totalAtsAnalyses: number;
    totalMockTests: number;
    totalChatMessages: number;
  };
  planBreakdown: {
    FREE: { usersCount: number; requests: number; tokens: number; costUsd: number; costUzs?: number };
    PRO: { usersCount: number; requests: number; tokens: number; costUsd: number; costUzs?: number };
    PREMIUM: {
      usersCount: number;
      requests: number;
      tokens: number;
      costUsd: number;
      costUzs?: number;
    };
  };
  featureBreakdown: Record<
    string,
    { requests: number; tokens: number; costUsd?: number; costUzs?: number }
  >;
  topUsers: UserAiSummary[];
  allUsers: UserAiSummary[];
}

function escapeTelegramMarkdown(text: string): string {
  return text.replace(/([_*`\[])/g, "\\$1");
}

export async function getDetailedAiReport(): Promise<PlatformAiSummary> {
  const safe = <T>(p: Promise<T>, fallback: T): Promise<T> =>
    p.catch((err) => {
      console.error("[TELEGRAM_REPORT_QUERY_ERR]", err instanceof Error ? err.message : err);
      return fallback;
    });

  const now = new Date();
  const TZ_MS = 5 * 60 * 60 * 1000;
  const uzTime = new Date(now.getTime() + TZ_MS);
  const reportDateStr = uzTime.toISOString().split("T")[0];
  const reportTimeStr = uzTime.toISOString().split("T")[1].slice(0, 5);

  // Tashkent (UTC+5) day/month boundaries
  const startOfToday = new Date(
    Date.UTC(uzTime.getUTCFullYear(), uzTime.getUTCMonth(), uzTime.getUTCDate()) - TZ_MS
  );
  const startOfMonth = new Date(
    Date.UTC(uzTime.getUTCFullYear(), uzTime.getUTCMonth(), 1) - TZ_MS
  );

  const [
    monthlyUsages,
    allUsersDb,
    allTimeAiAgg,
    activeSessionsCount,
    transactionsDb,
    totalDocuments,
    documentsToday,
    totalAtsAnalyses,
    totalMockTests,
    totalChatMessages,
  ] = await Promise.all([
    safe(
      prisma.aIUsage.findMany({
        where: { createdAt: { gte: startOfMonth } },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              plan: true,
              role: true,
              avatar: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      []
    ),
    safe(
      prisma.user.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          displayName: true,
          email: true,
          plan: true,
          role: true,
          avatar: true,
          image: true,
          isTelegramLinked: true,
          telegramId: true,
          aiUsageCount: true,
          createdAt: true,
          lastRequestDate: true,
          accounts: { select: { provider: true } },
          _count: { select: { documents: true } },
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
        _sum: { inputTokens: 0, outputTokens: 0, totalTokens: 0, estimatedCostUsd: 0 },
      }
    ),
    safe(prisma.session.count({ where: { expires: { gt: now } } }), 0),
    safe(
      prisma.transaction.findMany({
        where: { status: { in: ["PAID", "COMPLETED", "success", "SUCCESS"] } },
        select: { amount: true, createdAt: true },
      }),
      []
    ),
    safe(prisma.document.count({ where: { deletedAt: null } }), 0),
    safe(
      prisma.document.count({ where: { deletedAt: null, createdAt: { gte: startOfToday } } }),
      0
    ),
    safe(prisma.atsAnalysis.count(), 0),
    safe(prisma.mockTestSession.count(), 0),
    safe(prisma.chatMessage.count(), 0),
  ]);

  const conversionRate = parseFloat(process.env.AI_COST_USD_TO_UZS || "12800");
  const dailyBudgetUsd = parseFloat(process.env.AI_DAILY_BUDGET_USD || "10.0");

  // Today calculations
  const todayUsages = monthlyUsages.filter((u) => u.createdAt >= startOfToday);

  const calcBucket = (items: typeof monthlyUsages) => {
    let inputTokens = 0;
    let outputTokens = 0;
    let costUsd = 0;
    let successful = 0;
    let failed = 0;
    let quotaExceeded = 0;
    let durationSum = 0;
    let durationCount = 0;

    items.forEach((u) => {
      inputTokens += u.inputTokens || 0;
      outputTokens += u.outputTokens || 0;
      costUsd += u.estimatedCostUsd || 0;
      if (u.status === "SUCCESS") successful++;
      else if (u.status === "FAILED") failed++;
      else if (u.status === "QUOTA_EXCEEDED" || u.status === "RATE_LIMITED") quotaExceeded++;

      if (u.requestDurationMs && u.requestDurationMs > 0) {
        durationSum += u.requestDurationMs;
        durationCount++;
      }
    });

    const totalTokens = inputTokens + outputTokens;
    const costUzs = Math.round(costUsd * conversionRate);
    const activeUsers = new Set(items.map((u) => u.userId).filter(Boolean)).size;
    const avgDurationMs = durationCount > 0 ? Math.round(durationSum / durationCount) : 0;

    return {
      totalRequests: items.length,
      successful,
      failed,
      quotaExceeded,
      inputTokens,
      outputTokens,
      totalTokens,
      costUsd,
      costUzs,
      activeUsers,
      avgDurationMs,
    };
  };

  const todayBucket = calcBucket(todayUsages);
  const monthBucket = calcBucket(monthlyUsages);

  let newUsersToday = 0;
  let newUsersMonth = 0;
  let googleUsers = 0;
  let telegramLinkedUsers = 0;

  // Plan Breakdown
  const planBreakdown = {
    FREE: { usersCount: 0, requests: 0, tokens: 0, costUsd: 0, costUzs: 0 },
    PRO: { usersCount: 0, requests: 0, tokens: 0, costUsd: 0, costUzs: 0 },
    PREMIUM: { usersCount: 0, requests: 0, tokens: 0, costUsd: 0, costUzs: 0 },
  };

  allUsersDb.forEach((u) => {
    if (u.createdAt >= startOfToday) newUsersToday++;
    if (u.createdAt >= startOfMonth) newUsersMonth++;
    if ((u.accounts || []).some((a) => a.provider === "google")) googleUsers++;
    if (u.isTelegramLinked || u.telegramId) telegramLinkedUsers++;

    const tier = (u.plan as "FREE" | "PRO" | "PREMIUM") || "FREE";
    if (planBreakdown[tier]) {
      planBreakdown[tier].usersCount++;
    }
  });

  monthlyUsages.forEach((u) => {
    const tier = (u.plan as "FREE" | "PRO" | "PREMIUM") || "FREE";
    if (planBreakdown[tier]) {
      planBreakdown[tier].requests++;
      planBreakdown[tier].tokens += (u.inputTokens || 0) + (u.outputTokens || 0);
      planBreakdown[tier].costUsd += u.estimatedCostUsd || 0;
    }
  });

  planBreakdown.FREE.costUzs = Math.round(planBreakdown.FREE.costUsd * conversionRate);
  planBreakdown.PRO.costUzs = Math.round(planBreakdown.PRO.costUsd * conversionRate);
  planBreakdown.PREMIUM.costUzs = Math.round(planBreakdown.PREMIUM.costUsd * conversionRate);

  // Feature Breakdown
  const featureBreakdown: Record<
    string,
    { requests: number; tokens: number; costUsd: number; costUzs: number }
  > = {};
  monthlyUsages.forEach((u) => {
    const f = u.feature || "OTHER";
    if (!featureBreakdown[f]) {
      featureBreakdown[f] = { requests: 0, tokens: 0, costUsd: 0, costUzs: 0 };
    }
    featureBreakdown[f].requests++;
    featureBreakdown[f].tokens += (u.inputTokens || 0) + (u.outputTokens || 0);
    featureBreakdown[f].costUsd += u.estimatedCostUsd || 0;
    featureBreakdown[f].costUzs = Math.round(featureBreakdown[f].costUsd * conversionRate);
  });

  // User Summaries
  const userMap = new Map<string, UserAiSummary>();

  allUsersDb.forEach((u) => {
    const tier = (u.plan as "FREE" | "PRO" | "PREMIUM") || "FREE";
    const limits = PLAN_LIMITS[tier] || PLAN_LIMITS.FREE;

    userMap.set(u.id, {
      userId: u.id,
      name: u.displayName || u.name || "Noma'lum foydalanuvchi",
      email: u.email || "Email kiritilmagan",
      plan: tier,
      role: u.role,
      avatar: u.avatar || u.image || undefined,
      isGoogle: (u.accounts || []).some((a) => a.provider === "google"),
      isTelegramLinked: Boolean(u.isTelegramLinked || u.telegramId),
      todayRequests: 0,
      todayTokens: 0,
      monthRequests: 0,
      monthTokens: 0,
      monthCostUsd: 0,
      monthCostUzs: 0,
      academicLimit: limits.coursework || 3,
      academicUsed: 0,
      documentsCount: u._count?.documents || 0,
      lastActive: null,
      featureBreakdown: {},
    });
  });

  monthlyUsages.forEach((u) => {
    const userId = u.userId;
    if (!userId) return;

    let userStat = userMap.get(userId);
    if (!userStat) {
      userStat = {
        userId,
        name: u.user?.name || "Foydalanuvchi",
        email: u.user?.email || "Email mavjud emas",
        plan: u.plan || "FREE",
        role: u.user?.role || "USER",
        avatar: u.user?.avatar || u.user?.image || undefined,
        todayRequests: 0,
        todayTokens: 0,
        monthRequests: 0,
        monthTokens: 0,
        monthCostUsd: 0,
        monthCostUzs: 0,
        academicLimit: 3,
        academicUsed: 0,
        documentsCount: 0,
        lastActive: null,
        featureBreakdown: {},
      };
      userMap.set(userId, userStat);
    }

    const tokens = (u.inputTokens || 0) + (u.outputTokens || 0);
    const cost = u.estimatedCostUsd || 0;

    userStat.monthRequests++;
    userStat.monthTokens += tokens;
    userStat.monthCostUsd += cost;
    userStat.monthCostUzs = Math.round(userStat.monthCostUsd * conversionRate);

    userStat.featureBreakdown[u.feature] = (userStat.featureBreakdown[u.feature] || 0) + 1;

    if (
      [
        "COURSEWORK",
        "REFERAT",
        "REFERAT_EXTENDED",
        "BMI_DIPLOM",
        "EXAM_PREP",
        "ACADEMIC_GENERATION",
      ].includes(u.feature) &&
      u.status === "SUCCESS"
    ) {
      userStat.academicUsed++;
    }

    if (!userStat.lastActive || u.createdAt > userStat.lastActive) {
      userStat.lastActive = u.createdAt;
    }

    if (u.createdAt >= startOfToday) {
      userStat.todayRequests++;
      userStat.todayTokens += tokens;
    }
  });

  const allUsersArray = Array.from(userMap.values());
  allUsersArray.sort((a, b) => {
    if (b.monthTokens !== a.monthTokens) return b.monthTokens - a.monthTokens;
    return b.monthRequests - a.monthRequests;
  });

  const activeTopUsers = allUsersArray.filter((u) => u.monthRequests > 0).slice(0, 10);
  const topUsers =
    activeTopUsers.length > 0 ? activeTopUsers : allUsersArray.slice(0, 5);

  // Revenue calculations
  let todayRevenueUzs = 0;
  let monthRevenueUzs = 0;
  let allTimeRevenueUzs = 0;
  for (const tr of transactionsDb) {
    allTimeRevenueUzs += tr.amount || 0;
    if (tr.createdAt >= startOfMonth) monthRevenueUzs += tr.amount || 0;
    if (tr.createdAt >= startOfToday) todayRevenueUzs += tr.amount || 0;
  }

  const estimatedMrrUzs =
    planBreakdown.PRO.usersCount * 39000 + planBreakdown.PREMIUM.usersCount * 69000;
  const netMarginUzs = Math.max(monthRevenueUzs, estimatedMrrUzs) - monthBucket.costUzs;

  const allTimeTokens =
    allTimeAiAgg._sum.totalTokens ||
    (allTimeAiAgg._sum.inputTokens || 0) + (allTimeAiAgg._sum.outputTokens || 0);
  const allTimeCostUsd = allTimeAiAgg._sum.estimatedCostUsd || monthBucket.costUsd;
  const allTimeCostUzs = Math.round(allTimeCostUsd * conversionRate);

  const dailyBudgetPercent =
    dailyBudgetUsd > 0
      ? Math.min(100, Math.round((todayBucket.costUsd / dailyBudgetUsd) * 1000) / 10)
      : 0;

  return {
    reportDateStr,
    reportTimeStr,
    today: {
      ...todayBucket,
      newUsers: newUsersToday,
      documentsCreated: documentsToday,
      revenueUzs: todayRevenueUzs,
    },
    month: {
      ...monthBucket,
      newUsers: newUsersMonth,
      revenueUzs: monthRevenueUzs,
    },
    allTime: {
      totalRequests: Math.max(allTimeAiAgg._count._all, monthBucket.totalRequests),
      totalTokens: Math.max(allTimeTokens, monthBucket.totalTokens),
      costUsd: allTimeCostUsd,
      costUzs: allTimeCostUzs,
      revenueUzs: allTimeRevenueUzs,
    },
    platformStats: {
      totalUsers: allUsersDb.length,
      googleUsers,
      emailUsers: Math.max(0, allUsersDb.length - googleUsers),
      telegramLinkedUsers,
      activeSessions: activeSessionsCount,
      dailyBudgetUsd,
      dailyBudgetPercent,
      estimatedMrrUzs,
      netMarginUzs,
      totalDocuments,
      totalAtsAnalyses,
      totalMockTests,
      totalChatMessages,
    },
    planBreakdown,
    featureBreakdown,
    topUsers,
    allUsers: allUsersArray,
  };
}

export function formatTelegramReport(summary: PlatformAiSummary): string {
  const {
    reportDateStr,
    reportTimeStr,
    today,
    month,
    allTime,
    platformStats,
    planBreakdown,
    featureBreakdown,
    topUsers,
  } = summary;

  const featureLabels: Record<string, string> = {
    COURSEWORK: "Kurs ishi",
    REFERAT: "Mustaqil ish / Referat",
    REFERAT_EXTENDED: "Referat (10-15 bet)",
    BMI_DIPLOM: "BMI va Diplom ishi",
    PRESENTATION: "Prezentatsiya / Slaydlar",
    EXAM_PREP: "Imtihon tayyorgarligi",
    ACADEMIC_GENERATION: "Akademik generatsiya",
    REWRITE: "AI Yozuvchi / Insho",
    MOCK_TEST: "Mock Test (Tillar)",
    CHAT: "AI Chat / Maslahatchi",
    DOCUMENT_GENERATION: "Rezyume yaratish",
    RESUME_ANALYSIS: "CV / ATS Tahlili",
  };

  const totalRegistered =
    platformStats?.totalUsers ??
    planBreakdown.FREE.usersCount +
      planBreakdown.PRO.usersCount +
      planBreakdown.PREMIUM.usersCount;

  const topUsersText =
    topUsers.length === 0
      ? "• Bu oyda hali faol so'rovlar qayd etilmadi."
      : topUsers
          .map((u, i) => {
            const badge =
              u.plan === "PREMIUM" ? "👑 PREMIUM" : u.plan === "PRO" ? "⭐ PRO" : "🆓 FREE";
            const tokensK = (u.monthTokens / 1000).toFixed(1);
            const safeName = escapeTelegramMarkdown(u.name);
            const safeEmail = escapeTelegramMarkdown(u.email);
            const todayNote =
              u.todayRequests > 0 ? ` (Bugun: ${u.todayRequests} ta)` : "";
            return `${i + 1}. *${safeName}* (${safeEmail})\n   Tarif: ${badge} | So'rovlar: *${u.monthRequests} ta*${todayNote} (Limit: ${u.academicUsed}/${u.academicLimit})\n   Tokenlar: *${tokensK}k token* (~${u.monthCostUzs.toLocaleString()} so'm)`;
          })
          .join("\n\n");

  const featureText = Object.entries(featureBreakdown)
    .sort((a, b) => b[1].requests - a[1].requests)
    .map(([f, d]) => {
      const costPart =
        d.costUzs && d.costUzs > 0 ? `, ~${d.costUzs.toLocaleString()} so'm` : "";
      return `• ${featureLabels[f] || escapeTelegramMarkdown(f)}: *${d.requests} ta* (${(d.tokens / 1000).toFixed(0)}k token${costPart})`;
    })
    .join("\n");

  const freeCostUzs = planBreakdown.FREE.costUzs ?? 0;
  const proCostUzs = planBreakdown.PRO.costUzs ?? 0;
  const premCostUzs = planBreakdown.PREMIUM.costUzs ?? 0;

  const newTodayStr = today.newUsers ? ` (+${today.newUsers} bugun)` : "";
  const googleCount = platformStats?.googleUsers ?? 0;
  const tgCount = platformStats?.telegramLinkedUsers ?? 0;
  const dailyBudgetUsd = platformStats?.dailyBudgetUsd ?? 10;
  const dailyBudgetPct = platformStats?.dailyBudgetPercent ?? 0;

  return `📊 *DOCNOVA AI TOKEN & FOYDALANUVCHILAR HISOBOTI*
📅 *Sana:* ${reportDateStr} | *Vaqt:* ${reportTimeStr} (Toshkent)

👥 *FOYDALANUVCHILAR VA TARIFLAR:*
• Jami ro'yxatdan o'tganlar: *${totalRegistered} nafar*${newTodayStr}
• Google OAuth: *${googleCount} nafar* | Telegram ulangan: *${tgCount} nafar*
• 🆓 Bepul (FREE): *${planBreakdown.FREE.usersCount}* (${planBreakdown.FREE.requests} ta so'rov, ${(planBreakdown.FREE.tokens / 1000).toFixed(0)}k token, ~${freeCostUzs.toLocaleString()} so'm)
• ⭐ PRO (39k): *${planBreakdown.PRO.usersCount}* (${planBreakdown.PRO.requests} ta so'rov, ${(planBreakdown.PRO.tokens / 1000).toFixed(0)}k token, ~${proCostUzs.toLocaleString()} so'm)
• 👑 PREMIUM (69k): *${planBreakdown.PREMIUM.usersCount}* (${planBreakdown.PREMIUM.requests} ta so'rov, ${(planBreakdown.PREMIUM.tokens / 1000).toFixed(0)}k token, ~${premCostUzs.toLocaleString()} so'm)

⚡️ *BUGUNGI FOYDALANISH:*
• Faol foydalanuvchilar: *${today.activeUsers} nafar* (Yangi userlar: +${today.newUsers ?? 0})
• Jami so'rovlar: *${today.totalRequests} ta* (Muvaffaqiyatli: ${today.successful} | Xato: ${today.failed})
• Sarflangan tokenlar: *${today.totalTokens.toLocaleString()} token*
• AI xarajati: *$${today.costUsd.toFixed(3)}* (~*${today.costUzs.toLocaleString()} so'm*)
• Kunlik byudjet: *$${today.costUsd.toFixed(3)} / $${dailyBudgetUsd.toFixed(2)}* (${dailyBudgetPct}%)

🗓 *SHU OY FOYDALANISH:*
• Faol foydalanuvchilar: *${month.activeUsers} nafar* (Yangi userlar: +${month.newUsers ?? 0})
• Jami so'rovlar: *${month.totalRequests} ta* (Muvaffaqiyatli: ${month.successful})
• Sarflangan tokenlar: *${(month.totalTokens / 1_000_000).toFixed(2)}M token* (${month.totalTokens.toLocaleString()})
• AI xarajati: *$${month.costUsd.toFixed(2)}* (~*${month.costUzs.toLocaleString()} so'm*)
${allTime ? `• Barcha vaqt xarajati: *$${allTime.costUsd.toFixed(2)}* (~*${allTime.costUzs.toLocaleString()} so'm*)` : ""}

💰 *MOLIYA VA KONTENT STATISTIKASI:*
• Shu oy tushumi: *${(month.revenueUzs ?? 0).toLocaleString()} so'm* | Obunalar (MRR): *${(platformStats?.estimatedMrrUzs ?? 0).toLocaleString()} so'm*
• Sof foyda (Margin): *${(platformStats?.netMarginUzs ?? 0).toLocaleString()} so'm*
• Yaratilgan hujjatlar: *${platformStats?.totalDocuments ?? 0} ta* (+${today.documentsCreated ?? 0} bugun)
• CV/ATS tahlillar: *${platformStats?.totalAtsAnalyses ?? 0} ta* | Mock test: *${platformStats?.totalMockTests ?? 0} ta* | Chat: *${platformStats?.totalChatMessages ?? 0} ta*

🔝 *ENG FAOL FOYDALANUVCHILAR (TOP-${topUsers.length}):*
${topUsersText}

📚 *ENG KO'P ISHLATILGAN MODULLAR:*
${featureText || "• Hali ma'lumot yo'q"}

🔗 _Hisobot DocNova Super Admin boshqaruv markazidan yuborildi._`;
}

async function sendTelegramMessageWithFallback(
  botToken: string,
  chatId: string,
  text: string
): Promise<boolean> {
  // Try with Markdown first
  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
    }),
  });

  if (res.ok) return true;

  // Fallback to plain text if Markdown parsing failed
  const plainText = text.replace(/[*_`\\]/g, "");
  const fallbackRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: plainText,
    }),
  });

  if (!fallbackRes.ok) {
    const errText = await fallbackRes.text();
    throw new Error(`Telegram API xatoligi: ${errText}`);
  }

  return true;
}

export async function sendAiReportToTelegram(): Promise<{ success: boolean; message: string }> {
  const tokens = [
    process.env.TELEGRAM_BOT_TOKEN,
    process.env.DOCNOVA_AI_BOT_TOKEN,
  ].filter((t): t is string => Boolean(t));

  const chatIds = new Set<string>();
  if (process.env.TELEGRAM_ADMIN_CHAT_ID) {
    chatIds.add(process.env.TELEGRAM_ADMIN_CHAT_ID.trim());
  }

  // Also include linked SUPER_ADMIN users from DB
  try {
    const superAdmins = await prisma.user.findMany({
      where: { role: "SUPER_ADMIN" },
      select: { telegramChatId: true, telegramId: true },
    });
    for (const sa of superAdmins) {
      if (sa.telegramChatId) chatIds.add(sa.telegramChatId.trim());
      else if (sa.telegramId) chatIds.add(sa.telegramId.trim());
    }
  } catch {
    // ignore DB lookup error
  }

  if (tokens.length === 0 || chatIds.size === 0) {
    throw new Error("TELEGRAM_BOT_TOKEN yoki TELEGRAM_ADMIN_CHAT_ID sozlanmagan.");
  }

  const summary = await getDetailedAiReport();
  const text = formatTelegramReport(summary);

  let sentCount = 0;
  let lastError = "";

  for (const chatId of chatIds) {
    let deliveredForChat = false;
    for (const token of tokens) {
      if (deliveredForChat) break;
      try {
        await sendTelegramMessageWithFallback(token, chatId, text);
        deliveredForChat = true;
        sentCount++;
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
      }
    }
  }

  if (sentCount === 0) {
    throw new Error(lastError || "Telegramga hisobot yuborilmadi.");
  }

  return {
    success: true,
    message: "Hisobot Super Admin Telegram botiga muvaffaqiyatli yuborildi!",
  };
}

let lastAutoCheckTime = 0;

/**
 * Ensures the daily report is automatically generated and sent to Telegram once per day
 * (after 21:00 Tashkent time, or for any missed previous day).
 */
export async function ensureDailyTelegramReportSent(): Promise<void> {
  const nowMs = Date.now();
  // Throttle checks to at most once every 5 minutes per process
  if (nowMs - lastAutoCheckTime < 5 * 60 * 1000) return;
  lastAutoCheckTime = nowMs;

  try {
    const TZ_MS = 5 * 60 * 60 * 1000;
    const uzTime = new Date(nowMs + TZ_MS);
    const uzHour = uzTime.getUTCHours();

    // Send today's report automatically once it is 21:00+ Tashkent time
    if (uzHour < 21) return;

    const reportDateStr = uzTime.toISOString().split("T")[0];
    const existing = await prisma.aIDailyReport.findUnique({
      where: { reportDate: reportDateStr },
    });

    if (existing && existing.telegramStatus === "SUCCESS") {
      return;
    }

    const summary = await getDetailedAiReport();
    const { today, planBreakdown } = summary;

    const record =
      existing ??
      (await prisma.aIDailyReport.create({
        data: {
          reportDate: reportDateStr,
          totalRequests: today.totalRequests,
          successfulRequests: today.successful,
          failedRequests: today.failed,
          inputTokens: today.inputTokens,
          outputTokens: today.outputTokens,
          totalTokens: today.totalTokens,
          estimatedCostUsd: today.costUsd,
          estimatedCostUzs: today.costUzs,
          freeRequests: planBreakdown.FREE.requests,
          proRequests: planBreakdown.PRO.requests,
          premiumRequests: planBreakdown.PREMIUM.requests,
          telegramStatus: "PENDING",
        },
      }));

    await sendAiReportToTelegram();
    await prisma.aIDailyReport.update({
      where: { id: record.id },
      data: { telegramStatus: "SUCCESS", telegramSentAt: new Date() },
    });
  } catch (err) {
    console.error("[AUTO_DAILY_REPORT_ERR]", err instanceof Error ? err.message : err);
  }
}
