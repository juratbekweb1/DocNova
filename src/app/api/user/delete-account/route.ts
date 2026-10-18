import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { password } = await req.json();

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.passwordHash) {
      if (!password) {
        return NextResponse.json(
          { error: "Password is required to delete account" },
          { status: 400 }
        );
      }
      const bcrypt = await import("bcryptjs");
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return NextResponse.json({ error: "Invalid password" }, { status: 400 });
      }
    }

    // Soft delete implementation
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        deletedAt: new Date(),
        sessionVersion: { increment: 1 }, // Logout from all devices
      },
    });

    return NextResponse.json({ success: true, message: "Account scheduled for deletion." });
  } catch (error) {
    console.error("Delete Account Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
