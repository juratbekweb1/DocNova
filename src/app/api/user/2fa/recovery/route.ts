import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { twoFactorEnabled: true },
    });

    if (!user || !user.twoFactorEnabled) {
      return NextResponse.json({ error: "2FA is not enabled" }, { status: 400 });
    }

    // Generate new backup codes
    const backupCodes = Array.from({ length: 10 }).map(() => crypto.randomBytes(4).toString("hex"));

    // Delete old ones and insert new ones
    await prisma.$transaction([
      prisma.backupRecoveryCode.deleteMany({
        where: { userId: session.user.id },
      }),
      prisma.backupRecoveryCode.createMany({
        data: backupCodes.map((code) => ({
          userId: session.user.id as string,
          code,
        })),
      }),
    ]);

    return NextResponse.json({
      success: true,
      backupCodes,
      message: "Recovery codes regenerated successfully.",
    });
  } catch (error) {
    console.error("2FA Recovery Codes Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
