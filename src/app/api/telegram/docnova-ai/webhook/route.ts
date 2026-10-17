import { webhookCallback, InlineKeyboard, InputFile } from "grammy";
import {
  docnovaAiBot,
  getBotSession,
  setBotSession,
  clearBotSession,
  createTelegramLinkToken,
  getLinkedUser,
  getMainReplyKeyboard,
  getStudentInlineMenu,
} from "@/lib/telegram-docnova-ai";
import {
  generateCourseworkDoc,
  generateReferatDoc,
  generateBmiDoc,
  generatePresentationDoc,
  generateEssayDoc,
  generateExamDoc,
} from "@/lib/telegram-academic-generator";
import { prisma } from "@/lib/prisma";
import { checkUserLimit, getUserSubscription } from "@/lib/limits";

if (docnovaAiBot) {
  // 1. /start command
  docnovaAiBot.command("start", async (ctx) => {
    if (!ctx.from) return;
    const tgId = ctx.from.id;
    const username = ctx.from.username;

    try {
      const user = await getLinkedUser(tgId);

      if (!user) {
        // User not linked -> Generate single-use secure auth link
        const linkUrl = await createTelegramLinkToken(tgId, username);
        const kb = new InlineKeyboard().url("🔗 Google orqali hisobni bog'lash", linkUrl);

        await ctx.reply(
          `👋 *Assalomu alaykum! DocNova AI talabalar botiga xush kelibsiz!*\n\n` +
            `DocNova — O‘zbekiston talabalari va ilmiy tadqiqotchilari uchun mo‘ljallangan milliy sun'iy intellekt platformasi.\n\n` +
            `Bot orqali quyidagi akademik xizmatlardan to'g'ridan-to'g'ri foydalanishingiz mumkin:\n` +
            `• 📘 *Kurs ishlari* (Mundarija, 3 ta bob, statistik jadval va adabiyotlar)\n` +
            `• 📑 *Referat va Mustaqil ishlar* (3-5, 5-8, 10-15 bet, MOVSO standarti)\n` +
            `• 🎓 *Bitiruv malakaviy ishi (BMI) / Diplom*\n` +
            `• 📊 *Prezentatsiyalar va slaydlar* (Har bir slayd matni va nutqi)\n` +
            `• ✍️ *Insho va ilmiy esselar*\n` +
            `• 📝 *Imtihon biletlari va konspektlar*\n\n` +
            `🔒 *Xavfsiz foydalanish va AI limitlaringizni ulash uchun DocNova hisobingizni bog'lang:*\n` +
            `Quyidagi tugma orqali Google yoki profilingiz bilan tizimga kiring. Bu bir necha soniya vaqt oladi:`,
          { parse_mode: "Markdown", reply_markup: kb }
        );
        return;
      }

      // User already linked
      const sub = await getUserSubscription(user.id);
      await clearBotSession(tgId);

      await ctx.reply(
        `👋 Assalomu alaykum, *${user.name || "Talaba"}*!\n\n` +
          `🎓 *DocNova AI talabalar platformasi faol.*\n\n` +
          `👤 Profil: *${user.email}*\n` +
          `💳 Joriy tarif: *${sub.plan}*\n` +
          `🤖 Ishlatilgan AI so'rovlar: *${user.aiUsageCount || 0} ta*\n\n` +
          `Quyidagi menyudan kerakli bo'limni tanlang:`,
        { parse_mode: "Markdown", reply_markup: getMainReplyKeyboard() }
      );
    } catch (err) {
      console.error("[BOT_START_ERR]", err);
      await ctx.reply("❌ Tizimda vaqtincha xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.");
    }
  });

  // 2. /cancel command
  docnovaAiBot.command("cancel", async (ctx) => {
    if (!ctx.from) return;
    await clearBotSession(ctx.from.id);
    await ctx.reply("❌ Joriy jarayon bekor qilindi. Asosiy menyudasiz.", {
      reply_markup: getMainReplyKeyboard(),
    });
  });

  // 3. /status and /limit command
  docnovaAiBot.command(["status", "limit", "tarif"], async (ctx) => {
    if (!ctx.from) return;
    const user = await getLinkedUser(ctx.from.id);
    if (!user) {
      const linkUrl = await createTelegramLinkToken(ctx.from.id, ctx.from.username);
      const kb = new InlineKeyboard().url("🔗 Hisobni bog'lash", linkUrl);
      await ctx.reply("⚠️ Siz hali hisobingizni bog'lamagansiz. Iltimos, oldin tizimga kiring:", {
        reply_markup: kb,
      });
      return;
    }

    const sub = await getUserSubscription(user.id);
    const courseworkLimit = await checkUserLimit(user.id, "coursework");
    const presentationLimit = await checkUserLimit(user.id, "presentation");

    await ctx.reply(
      `💎 *Sizning DocNova AI Holatingiz:*\n\n` +
        `👤 Ism: *${user.name || "Foydalanuvchi"}*\n` +
        `📧 Email: \`${user.email}\`\n` +
        `💳 Tarif: *${sub.plan}*\n\n` +
        `📊 *Oylik AI Limitlaringiz:*\n` +
        `• 📘 Kurs ishi / Referat / BMI: *${courseworkLimit.remaining} ta qoldi* (Jami: ${courseworkLimit.totalLimit})\n` +
        `• 📊 Taqdimotlar: *${presentationLimit.remaining} ta qoldi* (Jami: ${presentationLimit.totalLimit})\n` +
        `• 🤖 Jami so'rovlar: *${user.aiUsageCount || 0} ta*\n\n` +
        `Tarifni oshirish yoki limitlarni yangilash uchun:\n` +
        `👉 https://www.docnova.uz/pricing`,
      { parse_mode: "Markdown" }
    );
  });

  // 4. /unlink command
  docnovaAiBot.command("unlink", async (ctx) => {
    if (!ctx.from) return;
    try {
      await prisma.user.updateMany({
        where: { telegramId: ctx.from.id.toString() },
        data: {
          telegramId: null,
          telegramUsername: null,
          telegramChatId: null,
          isTelegramLinked: false,
        },
      });
      await clearBotSession(ctx.from.id);
      await ctx.reply(
        "✅ DocNova hisobingiz ushbu Telegram botdan uzildi. Qayta ulash uchun /start ni bosing."
      );
    } catch (err) {
      console.error("[BOT_UNLINK_ERR]", err);
      await ctx.reply("❌ Xatolik yuz berdi.");
    }
  });

  // 5. /help command
  docnovaAiBot.command("help", async (ctx) => {
    await ctx.reply(
      `🤖 *DocNova AI Boti bo'yicha qo'llanma:*\n\n` +
        `Ushbu bot yordamida bir necha soniyada O'zbekiston OTMlari talablariga mos ilmiy va akademik ishlarni tayyorlab, tayyor *Microsoft Word (.doc)* faylini yuklab olishingiz mumkin.\n\n` +
        `📋 *Xizmatlar:*\n` +
        `1. *Kurs ishi* — Titul, reja, kirish (dolzarbligi, ilmiy apparat), 3 ta bob, statistik jadval, xulosa va 15+ adabiyotlar.\n` +
        `2. *Referat / Mustaqil ish* — 3-5, 5-8 yoki 10-15 betlik akademik referatlar.\n` +
        `3. *BMI / Diplom ishi* — Bitiruv malakaviy ishi to'liq ilmiy apparati bilan.\n` +
        `4. *Taqdimot* — Slaydlar rejasi va har bir slayd uchun spiker nutqi.\n` +
        `5. *Insho / Esse* — Ilmiy-badiiy chuqur esse.\n` +
        `6. *Imtihon* — 10 ta asosiy bilet savoli va yechimlari.\n\n` +
        `⌨️ *Buyruqlar:*\n` +
        `/start — Botni yangilash va bosh menyu\n` +
        `/status — Limitlar va tarifni tekshirish\n` +
        `/cancel — Har qanday jarayonni bekor qilish\n` +
        `/unlink — Telegram hisobni uzish\n\n` +
        `🌐 Rasmiy sayt: https://www.docnova.uz\n` +
        `💬 Qo'llab-quvvatlash: @docnova_support`,
      { parse_mode: "Markdown" }
    );
  });

  // 6. Callback Queries: Wizard selection
  docnovaAiBot.callbackQuery("wiz_cancel", async (ctx) => {
    await ctx.answerCallbackQuery({ text: "Bekor qilindi" });
    if (ctx.from) await clearBotSession(ctx.from.id);
    await ctx.reply("❌ Jarayon bekor qilindi.", { reply_markup: getMainReplyKeyboard() });
  });

  docnovaAiBot.callbackQuery("wiz_coursework", async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!ctx.from) return;
    const user = await getLinkedUser(ctx.from.id);
    if (!user) {
      await ctx.reply("Iltimos, avval /start buyrug'i orqali hisobingizni bog'lang.");
      return;
    }

    const limit = await checkUserLimit(user.id, "coursework");
    if (!limit.allowed) {
      await ctx.reply(
        `⚠️ ${limit.error || "Ushbu oy uchun kurs ishi limitingiz tugagan."}\n\nTarifni yangilang: https://www.docnova.uz/pricing`
      );
      return;
    }

    await setBotSession(ctx.from.id, { type: "coursework", step: "topic" });
    await ctx.reply(
      `📘 *Kurs ishi generatori*\n\n` +
        `Iltimos, kurs ishingizning *mavzusini* yozing:\n\n` +
        `_Masalan: O'zbekistonda tijorat banklarining investitsion faoliyatini takomillashtirish_\n\n` +
        `Bekor qilish uchun /cancel deb yozing.`,
      { parse_mode: "Markdown" }
    );
  });

  docnovaAiBot.callbackQuery("wiz_referat", async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!ctx.from) return;
    const user = await getLinkedUser(ctx.from.id);
    if (!user) {
      await ctx.reply("Iltimos, avval /start buyrug'i orqali hisobingizni bog'lang.");
      return;
    }

    await setBotSession(ctx.from.id, { type: "referat", step: "topic" });
    await ctx.reply(
      `📑 *Referat va Mustaqil ish generatori*\n\n` +
        `Iltimos, referat yoki mustaqil ish *mavzusini* yozing:\n\n` +
        `_Masalan: Yashil iqtisodiyotga o'tishning global tamoyillari_`,
      { parse_mode: "Markdown" }
    );
  });

  docnovaAiBot.callbackQuery("wiz_bmi", async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!ctx.from) return;
    const user = await getLinkedUser(ctx.from.id);
    if (!user) {
      await ctx.reply("Iltimos, avval /start buyrug'i orqali hisobingizni bog'lang.");
      return;
    }

    await setBotSession(ctx.from.id, { type: "bmi", step: "topic" });
    await ctx.reply(
      `🎓 *Bitiruv malakaviy ishi (BMI) / Diplom generatori*\n\n` +
        `Iltimos, BMI yoki magistrlik dissertatsiyasi *mavzusini* kiriting:\n\n` +
        `_Masalan: Axborot tizimlarida kiberxavfsizlik mexanizmlarini optimallashtirish_`,
      { parse_mode: "Markdown" }
    );
  });

  docnovaAiBot.callbackQuery("wiz_presentation", async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!ctx.from) return;
    const user = await getLinkedUser(ctx.from.id);
    if (!user) {
      await ctx.reply("Iltimos, avval /start buyrug'i orqali hisobingizni bog'lang.");
      return;
    }

    await setBotSession(ctx.from.id, { type: "presentation", step: "topic" });
    await ctx.reply(
      `📊 *Taqdimot (Prezentatsiya va Slaydlar) generatori*\n\n` +
        `Iltimos, taqdimot *mavzusini* kiriting:\n\n` +
        `_Masalan: Sun'iy intellektning tibbiyotdagi zamonaviy qo'llanilishi_`,
      { parse_mode: "Markdown" }
    );
  });

  docnovaAiBot.callbackQuery("wiz_essay", async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!ctx.from) return;
    const user = await getLinkedUser(ctx.from.id);
    if (!user) {
      await ctx.reply("Iltimos, avval /start buyrug'i orqali hisobingizni bog'lang.");
      return;
    }

    await setBotSession(ctx.from.id, { type: "essay", step: "topic" });
    await ctx.reply(
      `✍️ *Insho va Ilmiy esse generatori*\n\n` +
        `Iltimos, insho yoki esse *mavzusini* kiriting:\n\n` +
        `_Masalan: Kitobxonlik — ma'naviyatimizning poydevori_`,
      { parse_mode: "Markdown" }
    );
  });

  docnovaAiBot.callbackQuery("wiz_exam", async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!ctx.from) return;
    const user = await getLinkedUser(ctx.from.id);
    if (!user) {
      await ctx.reply("Iltimos, avval /start buyrug'i orqali hisobingizni bog'lang.");
      return;
    }

    await setBotSession(ctx.from.id, { type: "exam", step: "topic" });
    await ctx.reply(
      `📝 *Imtihon biletlari va tayyorgarlik generatori*\n\n` +
        `Iltimos, fan nomini yoki imtihon mavzularini kiriting:\n\n` +
        `_Masalan: Ehtimollar nazariyasi va matematik statistika_`,
      { parse_mode: "Markdown" }
    );
  });

  // Length callbacks for Referat
  docnovaAiBot.callbackQuery(/^ref_len_(short|standard|extended)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!ctx.from) return;
    const session = await getBotSession(ctx.from.id);
    const user = await getLinkedUser(ctx.from.id);
    if (!session || !user || !session.topic) {
      await ctx.reply("Sessiya muddati tugagan. Qaytadan /start bosing.");
      return;
    }

    const lengthOption = ctx.match[1] as "short" | "standard" | "extended";
    const sub = await getUserSubscription(user.id);

    await ctx.reply(
      `⏳ *Referat tayyorlanmoqda...*\n\n` +
        `📌 *Mavzu:* ${session.topic}\n` +
        `📚 *Fan:* ${session.subject || "Umumiy"}\n` +
        `📄 *Hajm:* ${lengthOption === "short" ? "3-5 bet" : lengthOption === "standard" ? "5-8 bet" : "10-15 bet"}\n\n` +
        `🤖 _Gemini AI MOVSO standartlari bo'yicha to'liq matn shakllantirmoqda. Iltimos 20-40 soniya kuting..._`,
      { parse_mode: "Markdown" }
    );

    const res = await generateReferatDoc({
      userId: user.id,
      userPlan: sub.plan,
      topic: session.topic,
      subject: session.subject,
      lengthOption,
      studentName: user.name || undefined,
    });

    await clearBotSession(ctx.from.id);

    if (res.success && res.docBuffer && res.fileName) {
      await ctx.replyWithDocument(new InputFile(res.docBuffer, res.fileName), {
        caption: res.summaryText,
        parse_mode: "Markdown",
      });
      await ctx.reply("Yana qanday akademik ish tayyorlaymiz?", {
        reply_markup: getMainReplyKeyboard(),
      });
    } else {
      await ctx.reply(`❌ ${res.error || "Xatolik yuz berdi"}`);
    }
  });

  // Slide count callbacks for Presentation
  docnovaAiBot.callbackQuery(/^pres_slides_(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!ctx.from) return;
    const session = await getBotSession(ctx.from.id);
    const user = await getLinkedUser(ctx.from.id);
    if (!session || !user || !session.topic) {
      await ctx.reply("Sessiya muddati tugagan. Qaytadan /start bosing.");
      return;
    }

    const slidesCount = parseInt(ctx.match[1], 10);
    const sub = await getUserSubscription(user.id);

    await ctx.reply(
      `⏳ *Taqdimot slaydlari tayyorlanmoqda...*\n\n` +
        `📌 *Mavzu:* ${session.topic}\n` +
        `📑 *Slaydlar:* ${slidesCount} ta\n\n` +
        `🤖 _Gemini AI slaydlar matni va ma'ruzachi nutqini shakllantirmoqda. Iltimos kuting..._`,
      { parse_mode: "Markdown" }
    );

    const res = await generatePresentationDoc({
      userId: user.id,
      userPlan: sub.plan,
      topic: session.topic,
      slidesCount,
    });

    await clearBotSession(ctx.from.id);

    if (res.success && res.docBuffer && res.fileName) {
      await ctx.replyWithDocument(new InputFile(res.docBuffer, res.fileName), {
        caption: res.summaryText,
        parse_mode: "Markdown",
      });
      await ctx.reply("Yana qanday akademik ish tayyorlaymiz?", {
        reply_markup: getMainReplyKeyboard(),
      });
    } else {
      await ctx.reply(`❌ ${res.error || "Xatolik yuz berdi"}`);
    }
  });

  // 7. General Text Message Handler (Replies & Conversational steps)
  docnovaAiBot.on("message:text", async (ctx) => {
    if (!ctx.from) return;
    const text = ctx.message.text.trim();
    const tgId = ctx.from.id;

    // Handle Reply Keyboard buttons
    if (text === "🎓 Talabalar uchun") {
      const user = await getLinkedUser(tgId);
      if (!user) {
        const linkUrl = await createTelegramLinkToken(tgId, ctx.from.username);
        const kb = new InlineKeyboard().url("🔗 Hisobni bog'lash", linkUrl);
        await ctx.reply("Akademik generatorlardan foydalanish uchun hisobingizni bog'lang:", {
          reply_markup: kb,
        });
        return;
      }
      await ctx.reply(
        "🎓 *Qanday akademik hujjat tayyorlaymiz?*\n\nQuyidagi xizmatlardan birini tanlang:",
        {
          parse_mode: "Markdown",
          reply_markup: getStudentInlineMenu(),
        }
      );
      return;
    }

    if (text === "💎 Tarif va limitlar") {
      const user = await getLinkedUser(tgId);
      if (!user) {
        const linkUrl = await createTelegramLinkToken(tgId, ctx.from.username);
        const kb = new InlineKeyboard().url("🔗 Hisobni bog'lash", linkUrl);
        await ctx.reply("Iltimos, avval hisobingizni bog'lang:", { reply_markup: kb });
        return;
      }
      const sub = await getUserSubscription(user.id);
      const cw = await checkUserLimit(user.id, "coursework");
      const pr = await checkUserLimit(user.id, "presentation");

      await ctx.reply(
        `💎 *Tarif va Oylik Limitlaringiz:*\n\n` +
          `💳 Tarif: *${sub.plan}*\n` +
          `📘 Kurs ishi / Referat / BMI: *${cw.remaining} ta qoldi* (Jami: ${cw.totalLimit})\n` +
          `📊 Taqdimotlar: *${pr.remaining} ta qoldi* (Jami: ${pr.totalLimit})\n` +
          `🤖 Jami AI so'rovlar: *${user.aiUsageCount || 0} ta*\n\n` +
          `Barcha limitlarni oshirish uchun saytimizga kiring:\n👉 https://www.docnova.uz/pricing`,
        { parse_mode: "Markdown" }
      );
      return;
    }

    if (text === "👤 Mening akkauntim") {
      const user = await getLinkedUser(tgId);
      if (!user) {
        const linkUrl = await createTelegramLinkToken(tgId, ctx.from.username);
        const kb = new InlineKeyboard().url("🔗 Hisobni bog'lash", linkUrl);
        await ctx.reply("Hisobingiz hali ulanmagan:", { reply_markup: kb });
        return;
      }
      await ctx.reply(
        `👤 *Sizning Profilingiz:*\n\n` +
          `👤 Ism: *${user.name || "Noma'lum"}*\n` +
          `📧 Email: \`${user.email}\`\n` +
          `💳 Tarif: *${user.plan || "FREE"}*\n` +
          `🔗 Bog'langan Telegram ID: \`${tgId}\`\n\n` +
          `DocNova platformasini ochish: https://www.docnova.uz`,
        { parse_mode: "Markdown" }
      );
      return;
    }

    if (text === "🌐 DocNova sayti") {
      const kb = new InlineKeyboard().url("🌐 Saytni ochish", "https://www.docnova.uz/academic");
      await ctx.reply("DocNova rasmiy veb-platformasiga o'tish uchun quyidagi tugmani bosing:", {
        reply_markup: kb,
      });
      return;
    }

    if (text === "❓ Yordam") {
      await ctx.reply(
        `🤖 *DocNova AI Yordam:*\n\n` +
          `• Kurs ishi yoki referat yaratish uchun «🎓 Talabalar uchun» tugmasini bosing.\n` +
          `• Har qanday jarayondan chiqish uchun /cancel deb yozing.\n` +
          `• Barcha hujjatlar Word (.doc) formatida to'g'ridan-to'g'ri Telegramingizga yuboriladi.\n` +
          `• Telefoningizda Word dasturi (Microsoft Word, WPS Office) orqali ochib, darhol chop etishingiz yoki tahrirlashingiz mumkin.`,
        { reply_markup: getMainReplyKeyboard() }
      );
      return;
    }

    // Check active wizard session
    const session = await getBotSession(tgId);
    if (!session) {
      await ctx.reply("Kerakli xizmatni tanlash uchun quyidagi menyudan foydalaning:", {
        reply_markup: getMainReplyKeyboard(),
      });
      return;
    }

    const user = await getLinkedUser(tgId);
    if (!user) {
      await clearBotSession(tgId);
      await ctx.reply("Sessiya muddati tugadi. Iltimos, /start bosing.");
      return;
    }

    const sub = await getUserSubscription(user.id);

    // 1. Coursework flow
    if (session.type === "coursework") {
      if (session.step === "topic") {
        await setBotSession(tgId, { ...session, topic: text, step: "subject" });
        await ctx.reply(
          `📚 Rahmat! Endi *fan yoki mutaxassislik nomini* kiriting:\n\n` +
            `_Masalan: Moliya va bank ishi (yoki o'tkazib yuborish uchun 'Standart' deb yozing)_`,
          { parse_mode: "Markdown" }
        );
        return;
      }

      if (session.step === "subject") {
        const subject = text.toLowerCase() === "standart" ? undefined : text;
        const topic = session.topic || "Kurs ishi";

        await ctx.reply(
          `⏳ *Kurs ishi tayyorlanmoqda...*\n\n` +
            `📌 *Mavzu:* ${topic}\n` +
            `📚 *Fan:* ${subject || "Standart"}\n\n` +
            `1️⃣ Titul varag'i va mundarija...\n` +
            `2️⃣ Kirish (dolzarblik, ilmiy apparat)...\n` +
            `3️⃣ Nazariy va tahliliy boblar (jadval bilan)...\n` +
            `4️⃣ Takliflar, xulosa va 15+ adabiyotlar...\n\n` +
            `🤖 _Gemini AI ishlamoqda. Bu taxminan 30-45 soniya vaqt oladi, iltimos kuting..._`,
          { parse_mode: "Markdown" }
        );

        const res = await generateCourseworkDoc({
          userId: user.id,
          userPlan: sub.plan,
          topic,
          subject,
          studentName: user.name || undefined,
        });

        await clearBotSession(tgId);

        if (res.success && res.docBuffer && res.fileName) {
          await ctx.replyWithDocument(new InputFile(res.docBuffer, res.fileName), {
            caption: res.summaryText,
            parse_mode: "Markdown",
          });
          await ctx.reply("Yana qanday akademik ish tayyorlaymiz?", {
            reply_markup: getMainReplyKeyboard(),
          });
        } else {
          await ctx.reply(`❌ ${res.error || "Kurs ishini tayyorlashda xatolik yuz berdi."}`);
        }
        return;
      }
    }

    // 2. Referat flow
    if (session.type === "referat") {
      if (session.step === "topic") {
        await setBotSession(tgId, { ...session, topic: text, step: "subject" });
        await ctx.reply(`📚 Rahmat! Endi *fan nomini* kiriting (yoki 'Standart' deb yozing):`, {
          parse_mode: "Markdown",
        });
        return;
      }

      if (session.step === "subject") {
        const subject = text.toLowerCase() === "standart" ? undefined : text;
        await setBotSession(tgId, { ...session, subject, step: "length" });

        const kb = new InlineKeyboard()
          .text("📄 3-5 bet (Qisqa)", "ref_len_short")
          .row()
          .text("📄 5-8 bet (Standart)", "ref_len_standard")
          .row()
          .text("📄 10-15 bet (Kengaytirilgan)", "ref_len_extended")
          .row()
          .text("❌ Bekor qilish", "wiz_cancel");

        await ctx.reply("📄 Referat yoki mustaqil ishning kerakli *hajmini* tanlang:", {
          reply_markup: kb,
          parse_mode: "Markdown",
        });
        return;
      }
    }

    // 3. BMI flow
    if (session.type === "bmi") {
      if (session.step === "topic") {
        await setBotSession(tgId, { ...session, topic: text, step: "subject" });
        await ctx.reply(
          `🏛 Rahmat! Endi *mutaxassislik yoki yo'nalish nomini* kiriting:\n\n_Masalan: Axborot xavfsizligi_`,
          { parse_mode: "Markdown" }
        );
        return;
      }

      if (session.step === "subject") {
        const specialty = text;
        const topic = session.topic || "BMI";

        await ctx.reply(
          `⏳ *Bitiruv malakaviy ishi (BMI) majmuasi tayyorlanmoqda...*\n\n` +
            `📌 *Mavzu:* ${topic}\n` +
            `🏛 *Yo'nalish:* ${specialty}\n\n` +
            `🤖 _MOVSO RUz standartidagi to'liq ilmiy apparat, boblar va statistik tahlil shakllantirilmoqda. Iltimos 35-50 soniya kuting..._`,
          { parse_mode: "Markdown" }
        );

        const res = await generateBmiDoc({
          userId: user.id,
          userPlan: sub.plan,
          topic,
          specialty,
          studentName: user.name || undefined,
        });

        await clearBotSession(tgId);

        if (res.success && res.docBuffer && res.fileName) {
          await ctx.replyWithDocument(new InputFile(res.docBuffer, res.fileName), {
            caption: res.summaryText,
            parse_mode: "Markdown",
          });
          await ctx.reply("Yana qanday akademik ish tayyorlaymiz?", {
            reply_markup: getMainReplyKeyboard(),
          });
        } else {
          await ctx.reply(`❌ ${res.error || "BMI tayyorlashda xatolik yuz berdi."}`);
        }
        return;
      }
    }

    // 4. Presentation flow
    if (session.type === "presentation") {
      if (session.step === "topic") {
        await setBotSession(tgId, { ...session, topic: text, step: "slidesCount" });
        const kb = new InlineKeyboard()
          .text("8 ta slayd", "pres_slides_8")
          .text("10 ta slayd", "pres_slides_10")
          .row()
          .text("12 ta slayd", "pres_slides_12")
          .text("15 ta slayd", "pres_slides_15")
          .row()
          .text("❌ Bekor qilish", "wiz_cancel");

        await ctx.reply("📊 Taqdimot uchun kerakli *slaydlar sonini* tanlang:", {
          reply_markup: kb,
          parse_mode: "Markdown",
        });
        return;
      }
    }

    // 5. Essay flow
    if (session.type === "essay") {
      const topic = text;
      await ctx.reply(
        `⏳ *Insho / Esse yozilmoqda...*\n\n📌 *Mavzu:* ${topic}\n\n🤖 _Gemini AI chuqur falsafiy va adabiy kompozitsiya tayyorlamoqda..._`,
        { parse_mode: "Markdown" }
      );

      const res = await generateEssayDoc({
        userId: user.id,
        userPlan: sub.plan,
        topic,
      });

      await clearBotSession(tgId);

      if (res.success && res.docBuffer && res.fileName) {
        await ctx.replyWithDocument(new InputFile(res.docBuffer, res.fileName), {
          caption: res.summaryText,
          parse_mode: "Markdown",
        });
        await ctx.reply("Yana qanday akademik ish tayyorlaymiz?", {
          reply_markup: getMainReplyKeyboard(),
        });
      } else {
        await ctx.reply(`❌ ${res.error || "Insho tayyorlashda xatolik yuz berdi."}`);
      }
      return;
    }

    // 6. Exam flow
    if (session.type === "exam") {
      const topic = text;
      await ctx.reply(
        `⏳ *Imtihon biletlari va konspekt tayyorlanmoqda...*\n\n📌 *Fan / Mavzular:* ${topic}\n\n🤖 _10 ta asosiy imtihon savoli va yechimlari tuzilmoqda..._`,
        { parse_mode: "Markdown" }
      );

      const res = await generateExamDoc({
        userId: user.id,
        userPlan: sub.plan,
        topic,
      });

      await clearBotSession(tgId);

      if (res.success && res.docBuffer && res.fileName) {
        await ctx.replyWithDocument(new InputFile(res.docBuffer, res.fileName), {
          caption: res.summaryText,
          parse_mode: "Markdown",
        });
        await ctx.reply("Yana qanday akademik ish tayyorlaymiz?", {
          reply_markup: getMainReplyKeyboard(),
        });
      } else {
        await ctx.reply(
          `❌ ${res.error || "Imtihon materiallarini tayyorlashda xatolik yuz berdi."}`
        );
      }
      return;
    }
  });
}

export const POST = docnovaAiBot
  ? webhookCallback(docnovaAiBot, "std/http", {
      secretToken: process.env.DOCNOVA_AI_BOT_SECRET,
    })
  : async () => new Response("DocNova AI Bot not configured", { status: 500 });
