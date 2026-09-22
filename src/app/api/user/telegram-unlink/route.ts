import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.user.update({
      where: { email: session.user.email },
      data: { 
        isTelegramLinked: false,
        telegramId: null,
        telegramUsername: null,
        telegramChatId: null,
        telegramLinkToken: null
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[TELEGRAM_UNLINK_ERROR]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
