import { webhookCallback, InlineKeyboard } from "grammy";
import { bot } from "@/lib/telegram";
import { prisma } from "@/lib/prisma";
import { QUIZ_SUBJECTS } from "@/lib/quiz-bank";
import { TelegramQuizService } from "@/lib/telegram-quiz-service";

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
            `✅ *Hisob muvaffaqiyatli bog'landi! / Account linked!*\n\nXush kelibsiz, *${user.name || "Foydalanuvchi"}*! Endi siz DocNova platformasidan tayyorlangan rezyume, kurs ishlari va xabarnomalarni bevosita shu yerda olasiz. 🚀\n\n_Buyruqlar: /test - imtihon testlari, /status - profilingiz, /help - yordam_`,
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
      const kb = new InlineKeyboard()
        .text("📝 Testni boshlash (30 ta savol)", "quiz_menu")
        .row()
        .url("🌐 DocNova Platformasi", "https://www.docnova.uz/academic");

      await ctx.reply(
        "👋 *DocNova rasmiy botiga xush kelibsiz!*\n\n" +
          "Bu yerda siz:\n" +
          "• Universitet imtihonlariga tayyorlanishingiz (/test)\n" +
          "• Tayyorlangan hujjatlar va eslatmalarni qabul qilishingiz\n" +
          "• DocNova hisobingizni boshqarishingiz mumkin.\n\n" +
          "_Foydalanish uchun quyidagi tugmalardan birini tanlang:_ ",
        { parse_mode: "Markdown", reply_markup: kb }
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

  // Helper: Build Question Message Text & Markup
  const renderQuestion = (userId: number) => {
    const session = TelegramQuizService.getSession(userId);
    if (!session) return null;

    const q = session.questions[session.currentIndex];
    if (!q) return null;

    const qNum = session.currentIndex + 1;
    const total = session.questions.length;

    // Progress bar representation
    const progressBlocks = Math.round((qNum / total) * 10);
    const progressBar = "🟩".repeat(progressBlocks) + "⬜️".repeat(10 - progressBlocks);

    const labels = ["A", "B", "C", "D"];
    const optionsText = q.options.map((opt, i) => `*${labels[i]})* ${opt}`).join("\n");

    const messageText =
      `📖 *Fan:* ${session.subjectName}\n` +
      `🔢 *Savol:* ${qNum} / ${total}   |   ⭐️ *Ball:* ${session.correctAnswers}\n` +
      `📊 ${progressBar}\n\n` +
      `❓ *${q.question}*\n\n` +
      `${optionsText}`;

    const kb = new InlineKeyboard()
      .text("A", "quiz_ans:0")
      .text("B", "quiz_ans:1")
      .text("C", "quiz_ans:2")
      .text("D", "quiz_ans:3")
      .row()
      .text("❌ Testni to'xtatish", "quiz_stop");

    return { messageText, kb };
  };

  // Helper: Render Subject Selection Menu
  const renderSubjectMenu = () => {
    const kb = new InlineKeyboard();
    QUIZ_SUBJECTS.forEach((subj, index) => {
      kb.text(subj.name, `quiz_start:${subj.id}`);
      if (index % 2 === 1) kb.row();
    });
    return kb;
  };

  // Command: /test or /quiz
  bot.command(["test", "quiz"], async (ctx) => {
    const kb = renderSubjectMenu();
    await ctx.reply(
      "🎓 *DocNova Imtihon Testlari (Exam Prep Quiz)*\n\n" +
        "500 ta savollar bazasidan *Fisher-Yates* algoritmi bo'yicha saralangan *30 ta mutlaqo takrorlanmas savol*.\n\n" +
        "Qaysi fan bo'yicha bilimingizni sinab ko'rmoqchisiz? Fanni tanlang:",
      { parse_mode: "Markdown", reply_markup: kb }
    );
  });

  // Command: /stop
  bot.command("stop", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    const session = TelegramQuizService.getSession(userId);
    if (session) {
      TelegramQuizService.endSession(userId);
      await ctx.reply(
        `🛑 *Test to'xtatildi.*\n\nIshlangan savollar: ${session.currentIndex} / ${session.questions.length}\nTo'g'ri javoblar: ${session.correctAnswers}\n\nYangi testni boshlash uchun /test buyrug'ini yuboring.`,
        { parse_mode: "Markdown" }
      );
    } else {
      await ctx.reply(
        "Sizda hozir faol test sessiyasi mavjud emas. /test orqali yangisini boshlang."
      );
    }
  });

  // Callback Query: Subject Selection Menu
  bot.callbackQuery("quiz_menu", async (ctx) => {
    await ctx.answerCallbackQuery();
    const kb = renderSubjectMenu();
    await ctx.editMessageText(
      "🎓 *Fanni tanlang:*\n\nHar bir test sessiyasida 30 ta noyob savol beriladi (hech bir savol takrorlanmaydi).",
      { parse_mode: "Markdown", reply_markup: kb }
    );
  });

  // Callback Query: Start Test with Selected Subject
  bot.callbackQuery(/^quiz_start:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery({ text: "Test yuklanmoqda... 30 ta savol tayyorlandi!" });
    const userId = ctx.from.id;
    const chatId = ctx.chat?.id || userId;
    const subjectId = ctx.match[1];

    TelegramQuizService.startSession(userId, chatId, subjectId);
    const render = renderQuestion(userId);
    if (!render) {
      await ctx.reply("❌ Testni boshlashda xatolik yuz berdi.");
      return;
    }

    await ctx.editMessageText(render.messageText, {
      parse_mode: "Markdown",
      reply_markup: render.kb,
    });
  });

  // Callback Query: Record Answer
  bot.callbackQuery(/^quiz_ans:([0-3])$/, async (ctx) => {
    const userId = ctx.from.id;
    const chosenIndex = parseInt(ctx.match[1], 10);

    const result = TelegramQuizService.recordAnswer(userId, chosenIndex);
    if (!result) {
      await ctx.answerCallbackQuery({
        text: "⚠️ Sessiya topilmadi yoki yakunlangan. /test orqali yangisini boshlang.",
      });
      return;
    }

    const { isCorrect, correctIndex, explanation, isFinished, session } = result;
    const labels = ["A", "B", "C", "D"];

    // Provide instant feedback toast
    if (isCorrect) {
      await ctx.answerCallbackQuery({ text: "✅ To'g'ri javob! (+1 ball)", show_alert: false });
    } else {
      await ctx.answerCallbackQuery({
        text: `❌ Noto'g'ri! To'g'ri javob: ${labels[correctIndex]}`,
        show_alert: false,
      });
    }

    if (isFinished) {
      // Test completed!
      const total = session.questions.length;
      const grade = TelegramQuizService.calculateGrade(session.correctAnswers, total);
      TelegramQuizService.endSession(userId);

      const finishKb = new InlineKeyboard()
        .text("🔄 Yangi 30 ta savol (Qayta topshirish)", `quiz_start:${session.subjectId}`)
        .row()
        .text("📚 Boshqa fanni tanlash", "quiz_menu")
        .row()
        .url("🌐 DocNova Platformasiga o'tish", "https://www.docnova.uz/academic/exam-prep");

      const finalReport =
        `🎉 *TEST MUVAFFAQIYATLI YAKUNLANDI!*\n\n` +
        `📊 *Natijalar hisoboti:*\n` +
        `• 📖 Fan: *${session.subjectName}*\n` +
        `• 🔢 Jami savollar: *${total} ta* (Fisher-Yates himoyasi)\n` +
        `• ✅ To'g'ri javoblar: *${session.correctAnswers} ta*\n` +
        `• ❌ Xato javoblar: *${session.wrongAnswers} ta*\n` +
        `• 📈 Aniqlik darajasi: *${grade.percentage}%*\n` +
        `• 🎖 Baho: *${grade.gradeText}*\n` +
        `• ⭐ Reyting: ${grade.stars}\n\n` +
        `💡 *Ilmiy tavsiya:*\n${grade.recommendation}\n\n` +
        `_Oxirgi xatolik tushuntirishi:_ ${explanation || "Mavzuni to'liq takrorlang."}`;

      await ctx.editMessageText(finalReport, {
        parse_mode: "Markdown",
        reply_markup: finishKb,
      });
    } else {
      // Advance to next question
      const render = renderQuestion(userId);
      if (render) {
        await ctx.editMessageText(render.messageText, {
          parse_mode: "Markdown",
          reply_markup: render.kb,
        });
      }
    }
  });

  // Callback Query: Stop Test
  bot.callbackQuery("quiz_stop", async (ctx) => {
    await ctx.answerCallbackQuery({ text: "Test to'xtatildi." });
    const userId = ctx.from.id;
    const session = TelegramQuizService.getSession(userId);
    if (session) {
      TelegramQuizService.endSession(userId);
      const kb = new InlineKeyboard().text("📝 Yangi test boshlash", "quiz_menu");
      await ctx.editMessageText(
        `🛑 *Test to'xtatildi.*\n\nIshlangan savollar: ${session.currentIndex} / ${session.questions.length}\nTo'g'ri javoblar: ${session.correctAnswers}\n\nIstalgan vaqtda qayta urinib ko'rishingiz mumkin!`,
        { parse_mode: "Markdown", reply_markup: kb }
      );
    }
  });

  // Command: /help
  bot.command("help", async (ctx) => {
    await ctx.reply(
      "🤖 *DocNova Bot Buyruqlari:*\n\n" +
        "/start - Botni ishga tushirish va hisobni bog'lash\n" +
        "/test - 30 talik imtihon testini topshirish (Fisher-Yates himoyasi bilan)\n" +
        "/stop - Faol testni to'xtatish\n" +
        "/status - DocNova balansingiz va tarifingizni tekshirish\n" +
        "/help - Ushbu yordam xabarini ko'rsatish\n\n" +
        "Savollar yoki qo'llab-quvvatlash uchun: @docnova_support",
      { parse_mode: "Markdown" }
    );
  });
}

export const POST = bot
  ? webhookCallback(bot, "std/http", { secretToken: process.env.TELEGRAM_WEBHOOK_SECRET })
  : async () => new Response("Bot not configured", { status: 500 });
