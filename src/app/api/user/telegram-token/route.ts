import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = crypto.randomBytes(16).toString("hex");

    await prisma.user.update({
      where: { email: session.user.email },
      data: { telegramLinkToken: token },
    });

    return NextResponse.json({ success: true, token });
  } catch (error) {
    console.error("[TELEGRAM_TOKEN_ERROR]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
