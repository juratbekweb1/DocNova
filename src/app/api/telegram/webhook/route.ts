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

          await ctx.reply(`✅ Account linked successfully! Welcome to DocNova, ${user.name || "User"}. You will now receive documents and notifications here.`);
        } else {
          await ctx.reply("❌ Invalid or expired linking token. Please generate a new one from your dashboard.");
        }
      } catch (error) {
        console.error("[TELEGRAM_LINK_ERROR]", error);
        await ctx.reply("❌ An error occurred while linking your account.");
      }
    } else {
      await ctx.reply("Welcome to DocNova Bot! 🚀\n\nTo link your account, please generate a token from your DocNova Dashboard Settings.");
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
        await ctx.reply(`📊 *Your Status*\n\n📧 Email: ${user.email}\n💳 Plan: ${user.planId || "Free"}\n🤖 AI Credits Used: ${user.aiUsageCount}`, { parse_mode: "Markdown" });
      } else {
        await ctx.reply("Your Telegram account is not linked to any DocNova account.");
      }
    } catch (error) {
      console.error("[TELEGRAM_STATUS_ERROR]", error);
      await ctx.reply("❌ Could not fetch status at this time.");
    }
  });

  // Command: /help
  bot.command("help", async (ctx) => {
    await ctx.reply("🤖 *DocNova Bot Help*\n\n/start - Welcome message & account linking\n/status - Check your subscription and credits\n/help - Show this message", { parse_mode: "Markdown" });
  });
}

export const POST = bot 
  ? webhookCallback(bot, "std/http", { secretToken: process.env.TELEGRAM_WEBHOOK_SECRET }) 
  : async () => new Response("Bot not configured", { status: 500 });
