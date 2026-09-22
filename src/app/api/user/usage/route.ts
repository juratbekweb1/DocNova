import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS } from "@/lib/limits";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        plan: true,
        dailyAiCount: true,
        lastRequestDate: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const plan = user.plan || "FREE";
    const limits = PLAN_LIMITS[plan];

    const now = new Date();
    const lastReq = new Date(user.lastRequestDate);
    const isSameDay = 
      now.getFullYear() === lastReq.getFullYear() &&
      now.getMonth() === lastReq.getMonth() &&
      now.getDate() === lastReq.getDate();

    const currentDailyAiCount = isSameDay ? user.dailyAiCount : 0;
    
    return NextResponse.json({
      plan,
      usage: currentDailyAiCount,
      limit: limits.chat,
      remaining: Math.max(0, limits.chat - currentDailyAiCount)
    });
  } catch (error) {
    console.error("Usage API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
