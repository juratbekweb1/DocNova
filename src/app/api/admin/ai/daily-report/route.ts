import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // O'zbekiston vaqti bo'yicha hisobot (UTC+5)
    // Vercel cron UTC bo'yicha ishlaydi. 
    // Agar cron "0 18 * * *" (UTC) bo'lsa, O'zbekistonda bu taxminan soat 23:00 bo'ladi.
    const today = new Date();
    // reportDate 'YYYY-MM-DD' formatida O'zbekiston vaqti uchun:
    const reportDateStr = new Date(today.getTime() + 5 * 60 * 60 * 1000).toISOString().split("T")[0];
    
    // Idempotency check:
    const existing = await prisma.aIDailyReport.findUnique({
      where: { reportDate: reportDateStr }
    });

    if (existing && existing.telegramStatus === "SUCCESS") {
      return NextResponse.json({ success: true, message: "Report already generated and sent." });
    }

    // Get today's usage from midnight UTC to now
    const todayStartUTC = new Date();
    todayStartUTC.setUTCHours(0, 0, 0, 0);

    const usages = await prisma.aIUsage.findMany({
      where: {
        createdAt: {
          gte: todayStartUTC,
        },
      },
    });

    const totalRequests = usages.length;
    const successful = usages.filter(u => u.status === "SUCCESS").length;
    const failed = usages.filter(u => u.status === "FAILED").length;
    const rateLimited = usages.filter(u => u.status === "RATE_LIMITED").length;
    const quotaExceeded = usages.filter(u => u.status === "QUOTA_EXCEEDED").length;

    let inputTokens = 0;
    let outputTokens = 0;
    let estimatedCostUsd = 0;

    const featureStats: Record<string, number> = {};
    const planStats: Record<string, number> = {};

    usages.forEach(u => {
      inputTokens += u.inputTokens || 0;
      outputTokens += u.outputTokens || 0;
      estimatedCostUsd += u.estimatedCostUsd || 0;

      featureStats[u.feature] = (featureStats[u.feature] || 0) + 1;
      planStats[u.plan] = (planStats[u.plan] || 0) + 1;
    });

    const totalTokens = inputTokens + outputTokens;
    const conversionRate = parseFloat(process.env.AI_COST_USD_TO_UZS || "12800");
    const estimatedCostUzs = estimatedCostUsd * conversionRate;

    const activeUsers = new Set(usages.map(u => u.userId).filter(Boolean)).size;

    const freeRequests = planStats["FREE"] || 0;
    const proRequests = planStats["PRO"] || 0;
    const premiumRequests = planStats["PREMIUM"] || 0;

    let reportRecord = existing;
    if (!reportRecord) {
      reportRecord = await prisma.aIDailyReport.create({
        data: {
          reportDate: reportDateStr,
          totalRequests,
          successfulRequests: successful,
          failedRequests: failed,
          inputTokens,
          outputTokens,
          totalTokens,
          estimatedCostUsd,
          estimatedCostUzs,
          freeRequests,
          proRequests,
          premiumRequests,
          telegramStatus: "PENDING"
        }
      });
    }

    const message = `
DOCNOVA AI DAILY REPORT
📅 ${reportDateStr}

👥 Active users: ${activeUsers}

🤖 AI requests: ${totalRequests}
✅ Success: ${successful}
❌ Failed: ${failed}
⚠️ Rate/Quota limit: ${rateLimited + quotaExceeded}

🧠 Tokens:
Input: ${(inputTokens / 1_000_000).toFixed(2)}M
Output: ${(outputTokens / 1_000_000).toFixed(2)}M

💵 Estimated AI cost:
$${estimatedCostUsd.toFixed(2)}
~${Math.round(estimatedCostUzs).toLocaleString("uz-UZ")} UZS (Current rate)

FREE: ${freeRequests} requests
PRO: ${proRequests} requests
PREMIUM: ${premiumRequests} requests

📊 Features:
Chat: ${featureStats["CHAT"] || 0}
Resume: ${featureStats["DOCUMENT_GENERATION"] || 0}
Analysis: ${featureStats["RESUME_ANALYSIS"] || 0}
Rewrite: ${featureStats["REWRITE"] || 0}
Mock Test: ${featureStats["MOCK_TEST"] || 0}
`.trim();

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

    if (botToken && chatId) {
      try {
        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
          }),
        });
        
        if (!res.ok) {
          throw new Error("Telegram API error: " + await res.text());
        }

        await prisma.aIDailyReport.update({
          where: { id: reportRecord.id },
          data: { telegramStatus: "SUCCESS", telegramSentAt: new Date() }
        });

      } catch (err: any) {
        await prisma.aIDailyReport.update({
          where: { id: reportRecord.id },
          data: { telegramStatus: "FAILED", errorCode: err.message }
        });
        return NextResponse.json({ error: "Telegram API error", details: err.message }, { status: 502 });
      }
    } else {
        await prisma.aIDailyReport.update({
          where: { id: reportRecord.id },
          data: { telegramStatus: "FAILED", errorCode: "MISSING_TELEGRAM_CREDENTIALS" }
        });
    }

    return NextResponse.json({ success: true, message: "Report generated and sent." });
  } catch (error: any) {
    console.error("Daily Report Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
