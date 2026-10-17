import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS } from "@/lib/limits";

export interface UserAiSummary {
  userId: string;
  name: string;
  email: string;
  plan: string;
  role: string;
  avatar?: string;
  todayRequests: number;
  todayTokens: number;
  monthRequests: number;
  monthTokens: number;
  monthCostUsd: number;
  monthCostUzs: number;
  academicLimit: number;
  academicUsed: number;
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
  };
  month: {
    totalRequests: number;
    successful: number;
    failed: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    costUsd: number;
    costUzs: number;
    activeUsers: number;
  };
  planBreakdown: {
    FREE: { usersCount: number; requests: number; tokens: number; costUsd: number };
    PRO: { usersCount: number; requests: number; tokens: number; costUsd: number };
    PREMIUM: { usersCount: number; requests: number; tokens: number; costUsd: number };
  };
  featureBreakdown: Record<string, { requests: number; tokens: number }>;
  topUsers: UserAiSummary[];
  allUsers: UserAiSummary[];
}

export async function getDetailedAiReport(): Promise<PlatformAiSummary> {
  const now = new Date();
  const uzTime = new Date(now.getTime() + 5 * 60 * 60 * 1000);
  const reportDateStr = uzTime.toISOString().split("T")[0];
  const reportTimeStr = uzTime.toISOString().split("T")[1].slice(0, 5);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // 1. Fetch AI usage for this month
  const monthlyUsages = await prisma.aIUsage.findMany({
    where: {
      createdAt: { gte: startOfMonth },
    },
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
  });

  // 2. Fetch all registered users to have total counts by tier
  const allUsersDb = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      plan: true,
      role: true,
      avatar: true,
      image: true,
      createdAt: true,
    },
  });

  const conversionRate = parseFloat(process.env.AI_COST_USD_TO_UZS || "12800");

  // Today calculations
  const todayUsages = monthlyUsages.filter((u) => u.createdAt >= startOfToday);

  const calcBucket = (items: typeof monthlyUsages) => {
    let inputTokens = 0;
    let outputTokens = 0;
    let costUsd = 0;
    let successful = 0;
    let failed = 0;
    let quotaExceeded = 0;

    items.forEach((u) => {
      inputTokens += u.inputTokens || 0;
      outputTokens += u.outputTokens || 0;
      costUsd += u.estimatedCostUsd || 0;
      if (u.status === "SUCCESS") successful++;
      else if (u.status === "FAILED") failed++;
      else if (u.status === "QUOTA_EXCEEDED" || u.status === "RATE_LIMITED") quotaExceeded++;
    });

    const totalTokens = inputTokens + outputTokens;
    const costUzs = Math.round(costUsd * conversionRate);
    const activeUsers = new Set(items.map((u) => u.userId).filter(Boolean)).size;

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
    };
  };

  const todaySummary = calcBucket(todayUsages);
  const monthSummary = calcBucket(monthlyUsages);

  // Plan Breakdown
  const planBreakdown = {
    FREE: { usersCount: 0, requests: 0, tokens: 0, costUsd: 0 },
    PRO: { usersCount: 0, requests: 0, tokens: 0, costUsd: 0 },
    PREMIUM: { usersCount: 0, requests: 0, tokens: 0, costUsd: 0 },
  };

  allUsersDb.forEach((u) => {
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

  // Feature Breakdown
  const featureBreakdown: Record<string, { requests: number; tokens: number }> = {};
  monthlyUsages.forEach((u) => {
    const f = u.feature || "OTHER";
    if (!featureBreakdown[f]) {
      featureBreakdown[f] = { requests: 0, tokens: 0 };
    }
    featureBreakdown[f].requests++;
    featureBreakdown[f].tokens += (u.inputTokens || 0) + (u.outputTokens || 0);
  });

  // User Summaries
  const userMap = new Map<string, UserAiSummary>();

  // Initialize with active users from DB
  allUsersDb.forEach((u) => {
    const tier = (u.plan as "FREE" | "PRO" | "PREMIUM") || "FREE";
    const limits = PLAN_LIMITS[tier] || PLAN_LIMITS.FREE;

    userMap.set(u.id, {
      userId: u.id,
      name: u.name || "Noma'lum foydalanuvchi",
      email: u.email || "Email kiritilmagan",
      plan: tier,
      role: u.role,
      avatar: u.avatar || u.image || undefined,
      todayRequests: 0,
      todayTokens: 0,
      monthRequests: 0,
      monthTokens: 0,
      monthCostUsd: 0,
      monthCostUzs: 0,
      academicLimit: limits.coursework || 3,
      academicUsed: 0,
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
    userStat.monthCostUzs += Math.round(cost * conversionRate);

    // Feature breakdown
    userStat.featureBreakdown[u.feature] = (userStat.featureBreakdown[u.feature] || 0) + 1;

    // Academic usage
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

    // Check if today
    if (u.createdAt >= startOfToday) {
      userStat.todayRequests++;
      userStat.todayTokens += tokens;
    }
  });

  const allUsersArray = Array.from(userMap.values());
  // Sort by monthly tokens descending
  allUsersArray.sort((a, b) => b.monthTokens - a.monthTokens);

  const topUsers = allUsersArray.filter((u) => u.monthRequests > 0).slice(0, 5);

  return {
    reportDateStr,
    reportTimeStr,
    today: todaySummary,
    month: monthSummary,
    planBreakdown,
    featureBreakdown,
    topUsers,
    allUsers: allUsersArray,
  };
}

export function formatTelegramReport(summary: PlatformAiSummary): string {
  const { reportDateStr, reportTimeStr, today, month, planBreakdown, featureBreakdown, topUsers } =
    summary;

  const featureLabels: Record<string, string> = {
    COURSEWORK: "Kurs ishi",
    REFERAT: "Mustaqil ish / Referat",
    REFERAT_EXTENDED: "Referat (10-15 bet)",
    BMI_DIPLOM: "BMI va Diplom ishi",
    PRESENTATION: "Prezentatsiya / Slaydlar",
    EXAM_PREP: "Imtihon tayyorgarligi",
    REWRITE: "AI Yozuvchi / Insho",
    MOCK_TEST: "Mock Test (Tillari)",
    CHAT: "AI Chat / Maslahatchi",
    DOCUMENT_GENERATION: "Rezyume yaratish",
    RESUME_ANALYSIS: "CV Tahlili",
  };

  const topUsersText =
    topUsers.length === 0
      ? "• Bu oyda hali faol so'rovlar qayd etilmadi."
      : topUsers
          .map((u, i) => {
            const badge =
              u.plan === "PREMIUM" ? "👑 PREMIUM" : u.plan === "PRO" ? "⭐ PRO" : "🆓 FREE";
            const tokensK = (u.monthTokens / 1000).toFixed(1);
            return `${i + 1}. *${u.name}* (${u.email})\n   Tarif: ${badge} | So'rovlar: *${u.monthRequests} ta* (Limit: ${u.academicUsed}/${u.academicLimit})\n   Tokenlar: *${tokensK}k token* (~${u.monthCostUzs.toLocaleString()} so'm)`;
          })
          .join("\n\n");

  const featureText = Object.entries(featureBreakdown)
    .sort((a, b) => b[1].requests - a[1].requests)
    .slice(0, 6)
    .map(
      ([f, d]) =>
        `• ${featureLabels[f] || f}: *${d.requests} ta* (${(d.tokens / 1000).toFixed(0)}k token)`
    )
    .join("\n");

  return `📊 *DOCNOVA AI TOKEN & FOYDALANUVCHILAR HISOBOTI*
📅 *Sana:* ${reportDateStr} | *Vaqt:* ${reportTimeStr} (Toshkent)

👥 *FOYDALANUVCHILAR VA TARIFLAR:*
• Jami ro'yxatdan o'tganlar: *${planBreakdown.FREE.usersCount + planBreakdown.PRO.usersCount + planBreakdown.PREMIUM.usersCount} nafar*
• 🆓 Bepul (FREE): *${planBreakdown.FREE.usersCount}* (${planBreakdown.FREE.requests} ta so'rov, ${(planBreakdown.FREE.tokens / 1000).toFixed(0)}k token)
• ⭐ PRO (39k): *${planBreakdown.PRO.usersCount}* (${planBreakdown.PRO.requests} ta so'rov, ${(planBreakdown.PRO.tokens / 1000).toFixed(0)}k token)
• 👑 PREMIUM (69k): *${planBreakdown.PREMIUM.usersCount}* (${planBreakdown.PREMIUM.requests} ta so'rov, ${(planBreakdown.PREMIUM.tokens / 1000).toFixed(0)}k token)

⚡️ *BUGUNGI FOYDALANISH:*
• Faol foydalanuvchilar: *${today.activeUsers} nafar*
• Jami so'rovlar: *${today.totalRequests} ta* (Muvaffaqiyatli: ${today.successful})
• Sarflangan tokenlar: *${today.totalTokens.toLocaleString()} token*
• AI xarajati: *$${today.costUsd.toFixed(3)}* (~*${today.costUzs.toLocaleString()} so'm*)

🗓 *SHU OY FOYDALANISH:*
• Faol foydalanuvchilar: *${month.activeUsers} nafar*
• Jami so'rovlar: *${month.totalRequests} ta*
• Sarflangan tokenlar: *${(month.totalTokens / 1_000_000).toFixed(2)}M token* (${month.totalTokens.toLocaleString()})
• AI xarajati: *$${month.costUsd.toFixed(2)}* (~*${month.costUzs.toLocaleString()} so'm*)

🔝 *ENG FAOL FOYDALANUVCHILAR (TOP-5):*
${topUsersText}

📚 *ENG KO'P ISHLATILGAN MODULLAR:*
${featureText || "• Hali ma'lumot yo'q"}

🔗 _Hisobot DocNova Super Admin boshqaruv markazidan yuborildi._`;
}

export async function sendAiReportToTelegram(): Promise<{ success: boolean; message: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!botToken || !adminChatId) {
    throw new Error("TELEGRAM_BOT_TOKEN yoki TELEGRAM_ADMIN_CHAT_ID sozlanmagan.");
  }

  const summary = await getDetailedAiReport();
  const text = formatTelegramReport(summary);

  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: adminChatId,
      text,
      parse_mode: "Markdown",
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Telegram API xatoligi: ${errText}`);
  }

  return {
    success: true,
    message: "Hisobot Super Admin Telegram botiga muvaffaqiyatli yuborildi!",
  };
}
