import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ favorites: [] }, { status: 401 });
  }

  try {
    const favorites = await prisma.userFavoriteTool.findMany({
      where: { userId: session.user.id },
      select: { toolId: true },
    });

    return NextResponse.json({ favorites: favorites.map((f) => f.toolId) });
  } catch (error) {
    console.error("GET Favorites error:", error);
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
    const { toolId } = body;

    if (!toolId) {
      return NextResponse.json({ error: "Tool ID is required" }, { status: 400 });
    }

    const favorite = await prisma.userFavoriteTool.upsert({
      where: {
        userId_toolId: {
          userId: session.user.id,
          toolId,
        },
      },
      update: {}, // if exists, do nothing (or update createdAt if needed)
      create: {
        userId: session.user.id,
        toolId,
      },
    });

    return NextResponse.json({ success: true, favorite });
  } catch (error) {
    console.error("POST Favorites error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { toolId } = body;

    if (!toolId) {
      return NextResponse.json({ error: "Tool ID is required" }, { status: 400 });
    }

    await prisma.userFavoriteTool.delete({
      where: {
        userId_toolId: {
          userId: session.user.id,
          toolId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Favorites error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
