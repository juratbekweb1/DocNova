import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ recents: [] }, { status: 401 });
  }

  try {
    const recents = await prisma.userRecentTool.findMany({
      where: { userId: session.user.id },
      orderBy: { lastUsedAt: "desc" },
      take: 5,
    });

    return NextResponse.json({ recents });
  } catch (error) {
    console.error("GET Recents error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { toolId, title, subTitle, route } = body;

    if (!toolId || !title || !route) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const recent = await prisma.userRecentTool.upsert({
      where: {
        userId_toolId: {
          userId: session.user.id,
          toolId,
        },
      },
      update: {
        lastUsedAt: new Date(),
        title,
        subTitle,
        route,
      },
      create: {
        userId: session.user.id,
        toolId,
        title,
        subTitle,
        route,
      },
    });

    return NextResponse.json({ success: true, recent });
  } catch (error) {
    console.error("POST Recents error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
