import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySharedSecret } from "@/lib/security/internal-secret";

export async function GET(req: Request) {
  try {
    const expectedSecret = process.env.BOT_SECRET?.trim();
    if (!expectedSecret) {
      return NextResponse.json({ error: "BOT_SECRET is not configured" }, { status: 503 });
    }

    const { searchParams } = new URL(req.url);
    const token = req.headers.get("x-bot-secret") || searchParams.get("token");

    if (!verifySharedSecret(token, expectedSecret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [newUsers, newDocs, todayTransactions] = await Promise.all([
      prisma.user.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.document.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.transaction.aggregate({
        where: {
          createdAt: { gte: today },
          status: "COMPLETED",
        },
        _sum: { amount: true },
      }),
    ]);

    return NextResponse.json({
      newUsers,
      newDocs,
      income: todayTransactions._sum.amount || 0,
    });
  } catch (error) {
    console.error("Bot stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
