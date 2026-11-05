import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { getDetailedAiReport, sendAiReportToTelegram } from "@/lib/telegram-ai-report";

// Vercel cron: "0 18 * * *" UTC == 23:00 Tashkent (UTC+5)
// Also supports authenticated SUPER_ADMIN / ADMIN manual trigger and ?force=true
async function handleDailyReport(req: Request) {
  try {
    const url = new URL(req.url);
    const force = url.searchParams.get("force") === "true";
    const secretParam = url.searchParams.get("secret");
    const authHeader = req.headers.get("authorization");

    const hasValidCronSecret =
      Boolean(process.env.CRON_SECRET) &&
      (authHeader === `Bearer ${process.env.CRON_SECRET}` ||
        secretParam === process.env.CRON_SECRET);

    let isAuthorizedAdmin = false;
    if (!hasValidCronSecret) {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { role: true },
        });
        isAuthorizedAdmin =
          dbUser?.role === "SUPER_ADMIN" ||
          dbUser?.role === "ADMIN" ||
          session.user.role === "SUPER_ADMIN" ||
          session.user.role === "ADMIN";
      }
    }

    if (!hasValidCronSecret && !isAuthorizedAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const summary = await getDetailedAiReport();
    const reportDateStr = summary.reportDateStr;
    const { today } = summary;

    const existing = await prisma.aIDailyReport.findUnique({
      where: { reportDate: reportDateStr },
    });
    if (existing && existing.telegramStatus === "SUCCESS" && !force) {
      return NextResponse.json({
        success: true,
        alreadySent: true,
        message: "Report already generated and sent for today.",
      });
    }

    const freeReqs = summary.planBreakdown.FREE?.requests ?? 0;
    const proReqs = summary.planBreakdown.PRO?.requests ?? 0;
    const premiumReqs = summary.planBreakdown.PREMIUM?.requests ?? 0;

    const record = existing
      ? await prisma.aIDailyReport.update({
          where: { id: existing.id },
          data: {
            totalRequests: today.totalRequests,
            successfulRequests: today.successful,
            failedRequests: today.failed,
            inputTokens: today.inputTokens,
            outputTokens: today.outputTokens,
            totalTokens: today.totalTokens,
            estimatedCostUsd: today.costUsd,
            estimatedCostUzs: today.costUzs,
            freeRequests: freeReqs,
            proRequests: proReqs,
            premiumRequests: premiumReqs,
          },
        })
      : await prisma.aIDailyReport.create({
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
            freeRequests: freeReqs,
            proRequests: proReqs,
            premiumRequests: premiumReqs,
            telegramStatus: "PENDING",
          },
        });

    try {
      await sendAiReportToTelegram();
      await prisma.aIDailyReport.update({
        where: { id: record.id },
        data: { telegramStatus: "SUCCESS", telegramSentAt: new Date(), errorCode: null },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await prisma.aIDailyReport.update({
        where: { id: record.id },
        data: { telegramStatus: "FAILED", errorCode: message },
      });
      return NextResponse.json({ error: "Telegram API error", details: message }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      reportDate: reportDateStr,
      message: "Report generated and sent to Telegram.",
    });
  } catch (error) {
    console.error("Daily Report Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return handleDailyReport(req);
}

export async function POST(req: Request) {
  return handleDailyReport(req);
}
