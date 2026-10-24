import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDetailedAiReport, sendAiReportToTelegram } from "@/lib/telegram-ai-report";

// Vercel cron: "0 18 * * *" UTC == 23:00 Tashkent (UTC+5)
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const summary = await getDetailedAiReport();
    const reportDateStr = summary.reportDateStr;
    const { today } = summary;

    const existing = await prisma.aIDailyReport.findUnique({
      where: { reportDate: reportDateStr },
    });
    if (existing && existing.telegramStatus === "SUCCESS") {
      return NextResponse.json({ success: true, message: "Report already generated and sent." });
    }

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
          freeRequests: 0,
          proRequests: 0,
          premiumRequests: 0,
          telegramStatus: "PENDING",
        },
      }));

    try {
      await sendAiReportToTelegram();
      await prisma.aIDailyReport.update({
        where: { id: record.id },
        data: { telegramStatus: "SUCCESS", telegramSentAt: new Date() },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await prisma.aIDailyReport.update({
        where: { id: record.id },
        data: { telegramStatus: "FAILED", errorCode: message },
      });
      return NextResponse.json({ error: "Telegram API error", details: message }, { status: 502 });
    }

    return NextResponse.json({ success: true, message: "Report generated and sent." });
  } catch (error) {
    console.error("Daily Report Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
