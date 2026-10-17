import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { docnovaAiBot, getMainReplyKeyboard } from "@/lib/telegram-docnova-ai";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Avtorizatsiya talab etiladi. Iltimos Google yoki email orqali kiring.",
          requireLogin: true,
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { token } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Bog'lanish tokeni taqdim etilmadi" }, { status: 400 });
    }

    const verificationRecord = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationRecord) {
      return NextResponse.json(
        {
          error:
            "Bog'lanish tokeni topilmadi yoki eskirgan. Telegram botda /start buyrug'ini qayta yuboring.",
        },
        { status: 400 }
      );
    }

    if (new Date(verificationRecord.expires) < new Date()) {
      await prisma.verificationToken.deleteMany({ where: { token } });
      return NextResponse.json(
        {
          error:
            "Bog'lanish havolasining amal qilish muddati (15 daqiqa) tugagan. Yangisini oling.",
        },
        { status: 400 }
      );
    }

    const telegramId = verificationRecord.identifier.replace("tg_link_", "").trim();
    if (!telegramId) {
      return NextResponse.json({ error: "Telegram identifikatori aniqlanmadi" }, { status: 400 });
    }

    // 1. Unlink any previous user associated with this telegramId
    await prisma.user.updateMany({
      where: { telegramId },
      data: {
        telegramId: null,
        telegramChatId: null,
        isTelegramLinked: false,
      },
    });

    // 2. Link current authenticated user
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        telegramId: telegramId,
        telegramChatId: telegramId,
        isTelegramLinked: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
      },
    });

    // 3. Consume token
    await prisma.verificationToken.deleteMany({ where: { token } });

    // 4. Send instant confirmation push into Telegram chat
    if (docnovaAiBot) {
      try {
        await docnovaAiBot.api.sendMessage(
          telegramId,
          `🎉 *Tabriklaymiz, hisobingiz muvaffaqiyatli bog'landi!*\n\n` +
            `👤 Foydalanuvchi: *${updatedUser.name || updatedUser.email}*\n` +
            `📧 Email: \`${updatedUser.email}\`\n` +
            `💳 Tarif: *${updatedUser.plan || "FREE"}*\n\n` +
            `Endi barcha akademik generatorlardan (@DocNovaAI_bot) bevosita foydalanishingiz mumkin! 🚀\n\n` +
            `Boshlash uchun quyidagi menyudan foydalaning:`,
          {
            parse_mode: "Markdown",
            reply_markup: getMainReplyKeyboard(),
          }
        );
      } catch (tgErr) {
        console.error("[TG_CONNECT_PUSH_ERR]", tgErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Hisob muvaffaqiyatli bog'landi",
      user: updatedUser,
    });
  } catch (err) {
    console.error("[DOCNOVA_AI_CONNECT_ERR]", err);
    return NextResponse.json({ error: "Tizimda xatolik yuz berdi" }, { status: 500 });
  }
}
