import { webhookCallback } from "grammy";
import { bot } from "@/lib/telegram";
import { prisma } from "@/lib/prisma";

if (bot) {
  // Command: /start [token]
  bot.command("start", async (ctx) => {
    const token = ctx.match; // The token after /start

    if (token) {
      // Handle account linking
      try {
        const user = await prisma.user.findUnique({
          where: { telegramLinkToken: token },
        });

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              telegramId: ctx.from?.id.toString(),
              telegramUsername: ctx.from?.username,
              telegramChatId: ctx.chat?.id.toString(),
              isTelegramLinked: true,
              telegramLinkToken: null, // Consume the token
            },
          });

          await ctx.reply(
            `✅ *Hisob muvaffaqiyatli bog'landi! / Account linked!*\n\nXush kelibsiz, *${user.name || "Foydalanuvchi"}*! Endi siz DocNova platformasidan tayyorlangan rezyume, kurs ishlari va xabarnomalarni bevosita shu yerda olasiz. 🚀\n\n_Buyruqlar: /status - profilingiz, /help - yordam_`,
            { parse_mode: "Markdown" }
          );
        } else {
          await ctx.reply(
            "❌ Bog'lanish tokeni eskirgan yoki yaroqsiz. Iltimos, DocNova boshqaruv panelidan yangi token oling.\n\n_Invalid or expired token. Please generate a new one from your dashboard._"
          );
        }
      } catch (error) {
        console.error("[TELEGRAM_LINK_ERROR]", error);
        await ctx.reply("❌ Xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.");
      }
    } else {
      await ctx.reply(
        "👋 *DocNova rasmiy botiga xush kelibsiz!*\n\nHisobingizni bog'lash uchun, saytimizdagi Sozlamalar bo'limidan 'Telegramni ulash' tugmasini bosing yoki profilingizdagi havolani oching.\n\n🌐 Sayt: https://www.docnova.uz\n\n_Commands: /status - tekshirish, /help - yordam_",
        { parse_mode: "Markdown" }
      );
    }
  });

  // Command: /status
  bot.command("status", async (ctx) => {
    if (!ctx.from?.id) return;
    try {
      const user = await prisma.user.findUnique({
        where: { telegramId: ctx.from.id.toString() },
      });

      if (user) {
        const activePlan = (user as unknown as { plan?: string }).plan || user.planId || "FREE";
        await ctx.reply(
          `📊 *Sizning DocNova Holatingiz / Status*\n\n👤 Ism: *${user.name || "Noma'lum"}*\n📧 Email: \`${user.email}\`\n💳 Tarif: *${activePlan}*\n🤖 Ishlatilgan AI so'rovlar: *${user.aiUsageCount || 0}*\n\n_Platformadan foydalanish uchun: https://www.docnova.uz_`,
          { parse_mode: "Markdown" }
        );
      } else {
        await ctx.reply(
          "⚠️ Telegram hisobingiz DocNova platformasiga hali bog'lanmagan.\n\nBog'lash uchun saytdagi Sozlamalar bo'limidan maxsus havolani oling:\n👉 https://www.docnova.uz/dashboard/settings/account"
        );
      }
    } catch (error) {
      console.error("[TELEGRAM_STATUS_ERROR]", error);
      await ctx.reply("❌ Ma'lumotlarni yuklashda xatolik yuz berdi.");
    }
  });

  // Command: /help
  bot.command("help", async (ctx) => {
    await ctx.reply(
      "🤖 *DocNova Bot Yordam*\n\n/start - Botni ishga tushirish va hisobni bog'lash\n/status - Tarif va AI limitlarini tekshirish\n/help - Yordam xabarini ko'rsatish\n\nSavollar yoki takliflar uchun: @docnova_support",
      { parse_mode: "Markdown" }
    );
  });
}

export const POST = bot
  ? webhookCallback(bot, "std/http", { secretToken: process.env.TELEGRAM_WEBHOOK_SECRET })
  : async () => new Response("Bot not configured", { status: 500 });
