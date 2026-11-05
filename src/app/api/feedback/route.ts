import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

function escapeMd(text: string): string {
  return text.replace(/([_*`\[])/g, "\\$1");
}

async function sendTelegramNotification(
  token: string,
  chatId: string,
  markdownText: string
): Promise<void> {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: markdownText,
      parse_mode: "Markdown",
    }),
  });

  if (!res.ok) {
    // Fallback to plain text if Markdown entity parsing fails
    const plainText = markdownText.replace(/\\([_*`\[])/g, "$1").replace(/[*_`]/g, "");
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: plainText,
      }),
    }).catch(() => null);
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions).catch(() => null);
    if (!session?.user?.id) {
      return NextResponse.json({ tickets: [] });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    const isAdmin =
      dbUser?.role === "SUPER_ADMIN" ||
      dbUser?.role === "ADMIN" ||
      session.user.role === "SUPER_ADMIN" ||
      session.user.role === "ADMIN";

    const logs = await prisma.auditLog.findMany({
      where: {
        action: "SUPPORT_TICKET",
        ...(isAdmin ? {} : { userId: session.user.id }),
      },
      orderBy: { createdAt: "desc" },
      take: isAdmin ? 50 : 20,
      include: {
        user: {
          select: { name: true, email: true, plan: true },
        },
      },
    });

    const tickets = logs.map((log) => {
      const meta = (log.metadata as Record<string, unknown>) || {};
      return {
        id: log.id,
        category: String(meta.category || "Murojaat"),
        subject: String(meta.subject || ""),
        message: String(meta.message || ""),
        contact: String(meta.contact || log.user?.email || ""),
        rating: Number(meta.rating || 5),
        pageUrl: String(meta.pageUrl || ""),
        status: String(meta.status || "QABUL_QILINDI"),
        userName: String(meta.userName || log.user?.name || "Foydalanuvchi"),
        userEmail: String(meta.userEmail || log.user?.email || ""),
        userPlan: String(log.user?.plan || "FREE"),
        createdAt: log.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ tickets });
  } catch (err) {
    console.error("[FEEDBACK_GET_ERROR]", err);
    return NextResponse.json({ tickets: [] });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions).catch(() => null);
    const body = await req.json();

    const category = String(body.category || "🚨 Shikoyat / Muammo")
      .trim()
      .slice(0, 100);
    const subject = String(body.subject || "")
      .trim()
      .slice(0, 200);
    const message = String(body.message || "")
      .trim()
      .slice(0, 2500);
    const contact = String(body.contact || session?.user?.email || "")
      .trim()
      .slice(0, 200);
    const pageUrl = String(body.pageUrl || "/help")
      .trim()
      .slice(0, 300);
    const rating = Math.min(5, Math.max(1, Number(body.rating) || 5));

    if (!message || message.length < 3) {
      return NextResponse.json(
        { error: "Iltimos, fikr yoki muammo matnini batafsilroq yozing." },
        { status: 400 }
      );
    }

    const userName = session?.user?.name || "Foydalanuvchi";
    const userEmail = session?.user?.email || contact || "Ko'rsatilmagan";
    const stars = "⭐".repeat(rating);
    const uzTime = new Date(Date.now() + 5 * 60 * 60 * 1000)
      .toISOString()
      .replace("T", " ")
      .slice(0, 16);

    // 1. Persist ticket in AuditLog so Super Admin and the user can track it on the site
    const ticket = await prisma.auditLog.create({
      data: {
        userId: session?.user?.id || null,
        action: "SUPPORT_TICKET",
        entityType: "FEEDBACK",
        entityId: session?.user?.id || "anonymous",
        metadata: {
          category,
          subject,
          rating,
          message,
          contact,
          pageUrl,
          userName,
          userEmail,
          status: "QABUL_QILINDI",
        },
      },
    });

    // 2. Dispatch to Telegram Admin(s)
    const telegramText =
      `📬 *YANGI MUROJAAT / SHIKOYAT (SAYTDAN)*\n` +
      `🆔 *ID:* \`#${ticket.id.slice(-6).toUpperCase()}\`\n\n` +
      `📂 *Bo'lim:* ${escapeMd(category)}\n` +
      (subject ? `📌 *Mavzu:* ${escapeMd(subject)}\n` : "") +
      `⭐️ *Baho:* ${stars} (${rating}/5)\n` +
      `👤 *Foydalanuvchi:* ${escapeMd(userName)}\n` +
      `📧 *Aloqa / Email:* \`${userEmail.replace(/`/g, "")}\`\n` +
      (contact && contact !== userEmail ? `📱 *Qo'shimcha aloqa:* ${escapeMd(contact)}\n` : "") +
      `🌐 *Sahifa:* ${escapeMd(pageUrl || "/help")}\n` +
      `🕒 *Vaqt:* ${uzTime} (Toshkent)\n\n` +
      `💬 *Xabar matni:*\n${escapeMd(message)}`;

    const botTokens = Array.from(
      new Set(
        [process.env.TELEGRAM_BOT_TOKEN, process.env.DOCNOVA_AI_BOT_TOKEN].filter(
          (t): t is string => Boolean(t && t.trim())
        )
      )
    );

    const chatIds = new Set<string>();
    if (process.env.TELEGRAM_ADMIN_CHAT_ID?.trim()) {
      for (const id of process.env.TELEGRAM_ADMIN_CHAT_ID.split(",")) {
        if (id.trim()) chatIds.add(id.trim());
      }
    }

    const adminUsers = await prisma.user.findMany({
      where: {
        role: "SUPER_ADMIN",
        OR: [{ telegramChatId: { not: null } }, { telegramId: { not: null } }],
      },
      select: { telegramChatId: true, telegramId: true },
    });

    for (const admin of adminUsers) {
      if (admin.telegramChatId) chatIds.add(admin.telegramChatId);
      else if (admin.telegramId) chatIds.add(admin.telegramId);
    }

    if (botTokens.length > 0 && chatIds.size > 0) {
      for (const chatId of chatIds) {
        await sendTelegramNotification(botTokens[0], chatId, telegramText).catch((err) => {
          console.error("[FEEDBACK_TELEGRAM_SEND_ERR]", err);
        });
      }
    }

    return NextResponse.json({
      success: true,
      ticketId: ticket.id,
      message: "Murojaatingiz qabul qilindi va loyiha ma'muriyatiga yetkazildi.",
    });
  } catch (error) {
    console.error("[FEEDBACK_API_ERROR]", error);
    return NextResponse.json(
      { error: "Xabarni yuborishda xatolik yuz berdi. Qaytadan urinib ko'ring." },
      { status: 500 }
    );
  }
}
