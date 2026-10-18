import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { authenticator } from "otplib";
import { decrypt } from "@/lib/security/encryption";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token, password } = await req.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { twoFactorSecret: true, twoFactorEnabled: true, passwordHash: true },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json({ error: "2FA is not enabled" }, { status: 400 });
    }

    // Verify password first as a security measure (if user has a password)
    if (user.passwordHash) {
      if (!password) {
        return NextResponse.json({ error: "Password is required to disable 2FA" }, { status: 400 });
      }
      const bcrypt = await import("bcryptjs");
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return NextResponse.json({ error: "Invalid password" }, { status: 400 });
      }
    }

    const secret = decrypt(user.twoFactorSecret);
    const isValid = authenticator.verify({ token, secret });

    if (!isValid) {
      return NextResponse.json({ error: "Invalid TOTP token" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: { twoFactorEnabled: false, twoFactorSecret: null },
      }),
      prisma.backupRecoveryCode.deleteMany({
        where: { userId: session.user.id },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "2FA has been disabled successfully.",
    });
  } catch (error) {
    console.error("2FA Disable Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
