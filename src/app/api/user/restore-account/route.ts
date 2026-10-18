import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { deletedAt: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.deletedAt) {
      return NextResponse.json({ error: "Account is not scheduled for deletion" }, { status: 400 });
    }

    // Restore account
    await prisma.user.update({
      where: { id: session.user.id },
      data: { deletedAt: null },
    });

    return NextResponse.json({ success: true, message: "Account restored successfully." });
  } catch (error) {
    console.error("Restore Account Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
