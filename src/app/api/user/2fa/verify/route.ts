import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { authenticator } from "otplib";
import { decrypt } from "@/lib/security/encryption";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await req.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    });

    if (!user || !user.twoFactorSecret) {
      return NextResponse.json({ error: "2FA setup not initiated" }, { status: 400 });
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json({ error: "2FA is already enabled" }, { status: 400 });
    }

    const secret = decrypt(user.twoFactorSecret);
    const isValid = authenticator.verify({ token, secret });

    if (!isValid) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }).map(() => crypto.randomBytes(4).toString("hex"));

    // Enable 2FA and save backup codes
    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: { twoFactorEnabled: true },
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
      message: "2FA enabled successfully.",
    });
  } catch (error) {
    console.error("2FA Verify Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
