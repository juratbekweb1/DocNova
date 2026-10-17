import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { sendAiReportToTelegram } from "@/lib/telegram-ai-report";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const authHeader = req.headers.get("authorization");
    const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    if (!isCron) {
      if (!session?.user?.email) {
        return NextResponse.json({ error: "Avtorizatsiya talab etiladi" }, { status: 401 });
      }

      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { role: true },
      });

      if (user?.role !== "SUPER_ADMIN" && user?.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Ruxsat etilmagan (Faqat Super Admin)" },
          { status: 403 }
        );
      }
    }

    const result = await sendAiReportToTelegram();
    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[TELEGRAM_AI_REPORT_API_ERROR]", err);
    return NextResponse.json(
      { error: err.message || "Telegramga hisobot yuborishda xatolik yuz berdi" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  return POST(req);
}
