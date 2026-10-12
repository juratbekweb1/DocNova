import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (token !== (process.env.BOT_SECRET || "MY_SECRET_BOT_TOKEN_123")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [newUsers, newDocs, todayTransactions] = await Promise.all([
      prisma.user.count({
        where: { createdAt: { gte: today } }
      }),
      prisma.document.count({
        where: { createdAt: { gte: today } }
      }),
      prisma.transaction.aggregate({
        where: { 
          createdAt: { gte: today },
          status: "COMPLETED" 
        },
        _sum: { amount: true }
      })
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
