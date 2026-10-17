import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { getDetailedAiReport } from "@/lib/telegram-ai-report";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (user?.role !== "SUPER_ADMIN" && user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "30d";

    const dateGte = new Date();
    if (range === "7d") dateGte.setDate(dateGte.getDate() - 7);
    else if (range === "90d") dateGte.setDate(dateGte.getDate() - 90);
    else dateGte.setDate(dateGte.getDate() - 30);

    const [usages, detailedSummary] = await Promise.all([
      prisma.aIUsage.findMany({
        where: {
          createdAt: {
            gte: dateGte,
          },
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
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      getDetailedAiReport(),
    ]);

    return NextResponse.json({
      success: true,
      usages,
      summary: detailedSummary,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("AI Usage API Error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
