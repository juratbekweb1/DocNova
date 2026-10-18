import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import { encrypt } from "@/lib/security/encryption";

export async function POST(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, twoFactorEnabled: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json({ error: "2FA is already enabled" }, { status: 400 });
    }

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(user.email as string, "DocNova", secret);
    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

    const encryptedSecret = encrypt(secret);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { twoFactorSecret: encryptedSecret },
    });

    return NextResponse.json({
      secret,
      qrCodeUrl,
      message: "Secret generated successfully. Verify to enable 2FA.",
    });
  } catch (error) {
    console.error("2FA Generate Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
