import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions).catch(() => null);
    const body = await req.json();

    const category = String(body.category || "Taklif / Mulohaza")
      .trim()
      .slice(0, 100);
    const message = String(body.message || "")
      .trim()
      .slice(0, 2500);
    const contact = String(body.contact || session?.user?.email || "")
      .trim()
      .slice(0, 200);
    const pageUrl = String(body.pageUrl || "")
      .trim()
      .slice(0, 300);
    const rating = Number(body.rating) || 5;

    if (!message || message.length < 3) {
      return NextResponse.json(
        { error: "Iltimos, fikr yoki muammo matnini batafsilroq yozing." },
        { status: 400 }
      );
    }

    const userName = session?.user?.name || "Mehmon foydalanuvchi";
    const userEmail = session?.user?.email || contact || "Ko'rsatilmagan";
    const stars = "⭐".repeat(Math.min(5, Math.max(1, rating)));
    const uzTime = new Date(Date.now() + 5 * 60 * 60 * 1000)
      .toISOString()
      .replace("T", " ")
      .slice(0, 16);

    const telegramText =
      `📬 *YANGI FIKR VA MUROJAAT (WEB SAYTDAN)*\n\n` +
      `📂 *Bo'lim:* ${category}\n` +
      `⭐️ *Baho:* ${stars} (${rating}/5)\n` +
      `👤 *Foydalanuvchi:* ${userName}\n` +
      `📧 *Aloqa / Email:* \`${userEmail}\`\n` +
      `🌐 *Sahifa:* ${pageUrl || "Bosh sahifa"}\n` +
      `🕒 *Vaqt:* ${uzTime} (Toshkent)\n\n` +
      `💬 *Xabar matni:*\n${message}`;

    const botToken = process.env.TELEGRAM_BOT_TOKEN || process.env.DOCNOVA_AI_BOT_TOKEN;
    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

    if (botToken && adminChatId) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: adminChatId,
          text: telegramText,
          parse_mode: "Markdown",
        }),
      }).catch((err) => {
        console.error("[FEEDBACK_TELEGRAM_SEND_ERR]", err);
      });
    }

    return NextResponse.json({
      success: true,
      message: "Fikringiz uchun rahmat! Xabaringiz loyiha ma'muriyatiga yetkazildi.",
    });
  } catch (error) {
    console.error("[FEEDBACK_API_ERROR]", error);
    return NextResponse.json(
      { error: "Xabarni yuborishda xatolik yuz berdi. Qaytadan urinib ko'ring." },
      { status: 500 }
    );
  }
}
