export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { webhookCallback, InlineKeyboard, InputFile, Context } from "grammy";
import {
  docnovaAiBot,
  getBotSession,
  setBotSession,
  clearBotSession,
  createTelegramLinkToken,
  getLinkedUser,
  getMainReplyKeyboard,
  getStudentInlineMenu,
  getInitialPageCountKeyboard,
  getDocumentEditKeyboard,
  getRewriteOptionsKeyboard,
  getPartSelectionKeyboard,
  getPartEditOptionsKeyboard,
  getLengthOptionsKeyboard,
  getRegenConfirmKeyboard,
  generateWordDocumentBuffer,
  BotWizardState,
} from "@/lib/telegram-docnova-ai";
import {
  acquireUserLock,
  releaseUserLock,
  isJobActive,
  forceReleaseUserLock,
  claimTelegramUpdate,
  markTelegramUpdateSuccess,
  markTelegramUpdateFailed,
  createAcademicTask,
  updateAcademicTaskStage,
  completeAcademicTask,
  failAcademicTask,
  getAcademicTask,
} from "@/lib/telegram-lock";
import {
  generateAcademicDocument,
  rewriteAcademicDoc,
  editAcademicSection,
  adjustAcademicLength,
  expandAcademicContent,
  condenseAcademicContent,
  improveAcademicStyle,
  regenerateAcademicDoc,
  AcademicGenResult,
} from "@/lib/telegram-academic-generator";
import {
  createAcademicDocumentRecord,
  saveNewDocumentVersion,
  getDocumentVersionData,
  revertToPreviousVersion,
  finalizeAcademicDocument,
  parseDocumentSections,
  SectionKey,
} from "@/lib/telegram-doc-manager";
import { prisma } from "@/lib/prisma";
import { checkUserLimit, getUserSubscription } from "@/lib/limits";

/**
 * Diagnostic logger for academic flow stages.
 * Never logs secrets, API keys, bot tokens, or user raw prompt text.
 */
function logAcademicStage(data: {
  requestId: string;
  stage: string;
  telegramId?: string | number;
  durationMs?: number;
  status: "START" | "SUCCESS" | "FAILED";
  error?: string;
  meta?: Record<string, unknown>;
}) {
  const metaStr = data.meta ? ` | meta=${JSON.stringify(data.meta)}` : "";
  const durStr = data.durationMs !== undefined ? ` | duration=${data.durationMs}ms` : "";
  const errStr = data.error ? ` | error=${data.error}` : "";
  console.log(
    `[ACADEMIC_FLOW] req=${data.requestId} | stage=${data.stage} | status=${data.status} | tgId=${data.telegramId ?? "N/A"}${durStr}${metaStr}${errStr}`
  );
}

/**
 * Helper to handle successful initial document generation
 */
async function handleInitialDocSuccess(
  ctx: Context,
  userId: string,
  tgId: number,
  res: AcademicGenResult,
  params: {
    workType: "coursework" | "referat" | "bmi" | "presentation" | "essay" | "exam";
    topic: string;
    subject?: string;
    specialty?: string;
    length?: string;
    slidesCount?: number;
  },
  jobId?: string
) {
  // If jobId is provided, ensure this job is still the active lock owner (not timed out or superseded)
  if (jobId) {
    const active = await isJobActive(tgId, jobId);
    if (!active) {
      console.warn(
        `[HANDLE_INITIAL_DOC_STALE] Job ${jobId} for user ${tgId} is no longer active. Discarding stale result.`
      );
      return;
    }
  }

  if (!res.success || !res.docBuffer || !res.fileName || !res.markdownContent) {
    if (jobId) {
      await failAcademicTask(jobId, res.error || "Generation returned invalid or empty content");
    }
    await ctx.reply(`❌ ${res.error || "Hujjatni tayyorlashda xatolik yuz berdi."}`);
    return;
  }

  // Validate Buffer and size
  if (!Buffer.isBuffer(res.docBuffer) || res.docBuffer.length < 500) {
    if (jobId) {
      await failAcademicTask(jobId, "Invalid Word buffer generated");
    }
    await ctx.reply("❌ Hujjat faylini tayyorlashda texnik xatolik yuz berdi.");
    return;
  }

  let docId: string | null = null;
  try {
    // 1. Multi-tenant document and version persistence in PostgreSQL with fencing token guard
    if (jobId) {
      await updateAcademicTaskStage(jobId, "DB_SAVE");
    }
    const record = await createAcademicDocumentRecord({
      userId,
      workType: params.workType,
      topic: params.topic,
      subject: params.subject || params.specialty,
      markdownContent: res.markdownContent,
      fileName: res.fileName,
      jobId,
      telegramId: tgId,
    });
    docId = record.docId;

    // 2. Set editing session state
    await setBotSession(tgId, {
      type: params.workType,
      step: "editing",
      docId: record.docId,
      currentVersion: 1,
      topic: params.topic,
      subject: params.subject,
      specialty: params.specialty,
      length: params.length,
      slidesCount: params.slidesCount,
    });

    // 3. Send Word document file via Telegram API with safe Markdown fallback
    if (jobId) {
      await updateAcademicTaskStage(jobId, "TG_SEND", {
        docId: record.docId,
        fileName: res.fileName,
      });
    }

    try {
      await ctx.replyWithDocument(new InputFile(res.docBuffer, res.fileName), {
        caption: res.summaryText,
        parse_mode: "Markdown",
      });
    } catch (sendErr) {
      console.warn("[SEND_DOC_MD_FAIL] Retrying sendDocument without markdown parsing:", sendErr);
      await ctx.replyWithDocument(new InputFile(res.docBuffer, res.fileName), {
        caption: res.summaryText?.replace(/[*_`\[\]()]/g, "") || "Hujjat tayyorlandi.",
      });
    }

    // 4. Mark task completed only after successful delivery!
    if (jobId) {
      await completeAcademicTask(jobId, record.docId, res.fileName);
    }

    // 5. Send Post-Generation Editing Menu (Section 9.A)
    await ctx.reply(
      `✍️ *Hujjat tayyor! Endi uni o'z xohishingizga ko'ra tahrirlashingiz mumkin.*\n\n` +
        `📄 *Joriy versiya:* \`v1 (Boshlang'ich)\`\n\n` +
        `Barcha qismlar ma'qul bo'lsa, *«✅ Ma’qul, yakunlash»* tugmasini bosing. O'zgartirish kiritmoqchi bo'lsangiz, quyidagi variantlardan birini tanlang:`,
      {
        parse_mode: "Markdown",
        reply_markup: getDocumentEditKeyboard({ version: 1, hasPrevVersion: false }),
      }
    );
  } catch (err: unknown) {
    const errObj = err as { message?: string };
    if (errObj?.message?.includes("JOB_SUPERSEDED")) {
      console.warn(
        `[HANDLE_INITIAL_DOC_SUPERSEDED] Job ${jobId} was superseded by another job. Version write aborted.`
      );
      return;
    }
    console.error("[HANDLE_INITIAL_DOC_ERR]", err);
    if (jobId) {
      await failAcademicTask(jobId, errObj?.message || "Initial doc save or send failed");
    }

    if (docId) {
      const kb = new InlineKeyboard().text("📥 Faylni qayta yuborish", `tg_resend_${docId}`);
      await ctx.reply(
        "⚠️ Hujjat muvaffaqiyatli tayyorlandi va profilingizda saqlandi, lekin Telegram orqali faylni yuborishda uzilish yuz berdi. Faylni olish uchun quyidagi tugmani bosing:",
        { reply_markup: kb }
      );
    } else {
      await ctx.reply("❌ Hujjatni saqlashda xatolik yuz berdi.");
    }
  }
}

/**
 * Helper to handle successful updated/edited document version
 */
async function handleUpdatedDocSuccess(
  ctx: Context,
  userId: string,
  tgId: number,
  res: AcademicGenResult,
  session: BotWizardState,
  changeLog: string,
  jobId?: string
) {
  // If jobId is provided, ensure this job is still active before committing new version to DB
  if (jobId) {
    const active = await isJobActive(tgId, jobId);
    if (!active) {
      console.warn(
        `[HANDLE_UPDATED_DOC_STALE] Job ${jobId} for user ${tgId} is no longer active. Discarding stale result.`
      );
      return;
    }
  }

  if (!res.success || !res.docBuffer || !res.fileName || !res.markdownContent || !session.docId) {
    if (jobId) {
      await failAcademicTask(jobId, res.error || "Update returned invalid or empty content");
    }
    await ctx.reply(`❌ ${res.error || "Tahrirlashda xatolik yuz berdi."}`);
    await setBotSession(tgId, { ...session, inProgress: false });
    return;
  }

  // Validate Buffer and size
  if (!Buffer.isBuffer(res.docBuffer) || res.docBuffer.length < 500) {
    if (jobId) {
      await failAcademicTask(jobId, "Invalid updated Word buffer generated");
    }
    await ctx.reply("❌ Yangilangan faylni tayyorlashda texnik xatolik yuz berdi.");
    await setBotSession(tgId, { ...session, inProgress: false });
    return;
  }

  try {
    // 1. Save new version in PostgreSQL with fencing token guard
    if (jobId) {
      await updateAcademicTaskStage(jobId, "DB_SAVE");
    }
    const { version: newVersion } = await saveNewDocumentVersion({
      docId: session.docId,
      userId,
      markdownContent: res.markdownContent,
      changeLog,
      topic: session.topic,
      subject: session.subject || session.specialty,
      workType: session.type,
      fileName: res.fileName,
      jobId,
      telegramId: tgId,
    });

    // 2. Update session state
    await setBotSession(tgId, {
      ...session,
      currentVersion: newVersion,
      action: undefined,
      selectedPart: undefined,
      inProgress: false,
      activeJobId: undefined,
    });

    // 3. Send updated Word document file via Telegram API with safe fallback
    if (jobId) {
      await updateAcademicTaskStage(jobId, "TG_SEND", {
        docId: session.docId,
        fileName: res.fileName,
      });
    }

    try {
      await ctx.replyWithDocument(new InputFile(res.docBuffer, res.fileName), {
        caption: `${res.summaryText}\n\n📄 *Versiya:* \`v${newVersion}\` (Oldingi: \`v${newVersion - 1}\`)`,
        parse_mode: "Markdown",
      });
    } catch (sendErr) {
      console.warn("[SEND_UPDATED_DOC_MD_FAIL] Retrying sendDocument without markdown:", sendErr);
      await ctx.replyWithDocument(new InputFile(res.docBuffer, res.fileName), {
        caption: `${res.summaryText?.replace(/[*_`\[\]()]/g, "") || "Hujjat yangilandi."}\n\nVersiya: v${newVersion}`,
      });
    }

    // 4. Mark task completed only after delivery!
    if (jobId) {
      await completeAcademicTask(jobId, session.docId, res.fileName);
    }

    // 5. Send Post-Generation Editing Menu with version controls
    await ctx.reply(
      `✍️ *Yangi tahrir (v${newVersion}) tayyor!*\n\n` +
        `Siz yangi versiyani qabul qilishingiz, yana o'zgartirish kiritishingiz yoki avvalgi versiyaga qaytishingiz mumkin:`,
      {
        parse_mode: "Markdown",
        reply_markup: getDocumentEditKeyboard({ version: newVersion, hasPrevVersion: true }),
      }
    );
  } catch (err: unknown) {
    const errObj = err as { message?: string };
    if (errObj?.message?.includes("JOB_SUPERSEDED")) {
      console.warn(
        `[HANDLE_UPDATED_DOC_SUPERSEDED] Job ${jobId} was superseded by another job. Version write aborted.`
      );
      return;
    }
    console.error("[HANDLE_UPDATED_DOC_ERR]", err);
    if (jobId) {
      await failAcademicTask(jobId, errObj?.message || "Updated doc save or send failed");
    }
    await setBotSession(tgId, { ...session, inProgress: false });
    await ctx.reply("❌ Yangilangan versiyani saqlashda xatolik yuz berdi.");
  }
}

if (docnovaAiBot) {
  // 1. /start command
  docnovaAiBot.command("start", async (ctx) => {
    if (!ctx.from) return;
    const tgId = ctx.from.id;
    const username = ctx.from.username;

    try {
      const user = await getLinkedUser(tgId);

      if (!user) {
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
            `Quyidagi tugma orqali Google yoki profilingiz bilan tizimga kiring:`,
          { parse_mode: "Markdown", reply_markup: kb }
        );
        return;
      }

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
    await forceReleaseUserLock(ctx.from.id);
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

    const isSuperAdmin = user.role === "SUPER_ADMIN" || user.role === "ADMIN";

    if (isSuperAdmin) {
      await ctx.reply(
        `💎 *Sizning DocNova AI Holatingiz:*\n\n` +
          `👤 Ism: *${user.name || "Super Admin"}*\n` +
          `📧 Email: \`${user.email}\`\n` +
          `💳 Tarif: *Super Admin (Cheksiz)*\n\n` +
          `📊 *Oylik AI Limitlaringiz:*\n` +
          `• 📘 Kurs ishi / Referat / BMI: *Cheksiz (Unlimited)*\n` +
          `• ✍️ Qayta tahrirlash / Rewrite: *Cheksiz (Unlimited)*\n` +
          `• 📊 Taqdimotlar: *Cheksiz (Unlimited)*\n` +
          `• 🤖 Jami so'rovlar: *${user.aiUsageCount || 0} ta*\n\n` +
          `🚀 Super Admin imtiyozi: Barcha AI modullariga cheksiz kirish faollashtirilgan.`,
        { parse_mode: "Markdown" }
      );
      return;
    }

    const sub = await getUserSubscription(user.id);
    const courseworkLimit = await checkUserLimit(user.id, "coursework");
    const presentationLimit = await checkUserLimit(user.id, "presentation");
    const rewriteLimit = await checkUserLimit(user.id, "rewrite");

    await ctx.reply(
      `💎 *Sizning DocNova AI Holatingiz:*\n\n` +
        `👤 Ism: *${user.name || "Foydalanuvchi"}*\n` +
        `📧 Email: \`${user.email}\`\n` +
        `💳 Tarif: *${sub.plan}*\n\n` +
        `📊 *Oylik AI Limitlaringiz:*\n` +
        `• 📘 Kurs ishi / Referat / BMI: *${courseworkLimit.remaining} ta qoldi* (Jami: ${courseworkLimit.totalLimit})\n` +
        `• ✍️ Qayta tahrirlash / Rewrite: *${rewriteLimit.remaining} ta qoldi* (Jami: ${rewriteLimit.totalLimit})\n` +
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
        `1. *Kurs ishi* — Titul, reja, kirish (dolzarblik, ilmiy apparat), 3 ta bob, statistik jadval, xulosa va 15+ adabiyotlar.\n` +
        `2. *Referat / Mustaqil ish* — 3-5, 5-8 yoki 10-15 betlik akademik referatlar.\n` +
        `3. *BMI / Diplom ishi* — Bitiruv malakaviy ishi to'liq ilmiy apparati bilan.\n` +
        `4. *Taqdimot* — Slaydlar rejasi va har bir slayd uchun spiker nutqi.\n` +
        `5. *Insho / Esse* — Ilmiy-badiiy chuqur esse.\n` +
        `6. *Imtihon* — 10 ta asosiy bilet savoli va yechimlari.\n\n` +
        `✍️ *Tahrirlash va qayta ishlash imkoniyatlari:*\n` +
        `Hujjat yaratilgandan keyin uni boshqacharoq yozdirish, tanlangan bo'limini o'zgartirish, hajmini kengaytirish/qisqartirish, akademik uslubini oshirish yoki avvalgi versiyalarga qaytishingiz mumkin!\n\n` +
        `⌨️ *Buyruqlar:*\n` +
        `/start — Botni yangilash va bosh menyu\n` +
        `/status — Limitlar va tarifni tekshirish\n` +
        `/cancel — Har qanday jarayonni bekor qilish\n` +
        `/unlink — Telegram hisobni uzish\n\n` +
        `🌐 Rasmiy sayt: https://www.docnova.uz`,
      { parse_mode: "Markdown" }
    );
  });

  // 6. Wizard Selection Callbacks
  docnovaAiBot.callbackQuery("wiz_cancel", async (ctx) => {
    await ctx.answerCallbackQuery({ text: "Bekor qilindi" });
    if (ctx.from) {
      await forceReleaseUserLock(ctx.from.id);
      await clearBotSession(ctx.from.id);
    }
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
        `Iltimos, kurs ishi *mavzusini* to'liq kiriting:\n\n` +
        `_Masalan: Tijorat banklarida kredit risklarini boshqarish strategiyasi_`,
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

  docnovaAiBot.callbackQuery("wiz_pdf_to_word", async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!ctx.from) return;
    await setBotSession(ctx.from.id, { type: "pdf_to_word", step: "pdf_wait" });
    await ctx.reply(
      `📄 *PDF dan Word (.doc) ga o'tkazish*\n\n` +
        `Marhamat, o'zingizdagi *.pdf* faylni shu chatga yuboring (maksimal 20 MB).\n\n` +
        `🤖 Bot PDF ichidagi barcha matnlarni o'qib olib, sizga tayyor *Microsoft Word (.doc)* formatida qaytarib beradi!`,
      { parse_mode: "Markdown" }
    );
  });

  docnovaAiBot.callbackQuery("wiz_feedback", async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!ctx.from) return;
    await setBotSession(ctx.from.id, { type: "feedback", step: "feedback_input" });
    await ctx.reply(
      `💬 *Fikr, taklif va kamchiliklarni bildirish*\n\n` +
        `Sayt yoki bot ishlashida qandaydir kamchilik, tushunmovchilik yoki taklifingiz bo'lsa, marhamat, shu yerga yozib yuboring.\n\n` +
        `📬 _Xabaringiz to'g'ridan-to'g'ri DocNova loyiha rahbariyatiga yetkaziladi:_`,
      { parse_mode: "Markdown" }
    );
  });

  docnovaAiBot.command(["feedback", "fikr"], async (ctx) => {
    if (!ctx.from) return;
    await setBotSession(ctx.from.id, { type: "feedback", step: "feedback_input" });
    await ctx.reply(
      `💬 *Fikr, taklif va kamchiliklarni bildirish*\n\n` +
        `Sayt yoki bot ishlashida qandaydir kamchilik, tushunmovchilik yoki taklifingiz bo'lsa, marhamat, shu yerga yozib yuboring.\n\n` +
        `📬 _Xabaringiz to'g'ridan-to'g'ri DocNova loyiha rahbariyatiga yetkaziladi:_`,
      { parse_mode: "Markdown" }
    );
  });

  // Page count callbacks for Coursework, Referat, and BMI (15, 25, 50, 100, 200, 300)
  docnovaAiBot.callbackQuery(/^(cw_pages|ref_pages|bmi_pages):(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!ctx.from) return;
    const tgId = ctx.from.id;
    const prefix = ctx.match[1];
    const selectedPages = ctx.match[2];
    const session = await getBotSession(tgId);
    const user = await getLinkedUser(tgId);

    if (!session || !user || !session.topic) {
      await ctx.reply("Sessiya muddati tugagan. Qaytadan /start bosing.");
      return;
    }

    const lock = await acquireUserLock(tgId);
    if (!lock.acquired) {
      return;
    }

    const taskId = lock.jobId!;
    let taskCompleted = false;
    const workType =
      prefix === "cw_pages" ? "coursework" : prefix === "bmi_pages" ? "bmi" : "referat";

    try {
      const sub = await getUserSubscription(user.id);
      await createAcademicTask({
        taskId,
        telegramId: tgId,
        userId: user.id,
        workType,
        topic: session.topic,
        subject: session.subject || session.specialty,
      });

      await ctx.reply(
        `⏳ *Hujjat tayyorlanmoqda...*\n\n` +
          `📌 *Mavzu:* ${session.topic}\n` +
          `📚 *Fan / Yo'nalish:* ${session.subject || session.specialty || "Standart"}\n` +
          `📄 *Tanlangan hajm:* ${selectedPages} bet\n\n` +
          `🤖 _Gemini AI MOVSO RUz standartlari bo'yicha to'liq matn va mundarijani shakllantirmoqda. Iltimos 20-45 soniya kuting..._`,
        { parse_mode: "Markdown" }
      );

      await updateAcademicTaskStage(taskId, "GEMINI_GEN");

      const res = await generateAcademicDocument({
        workType,
        userId: user.id,
        userPlan: sub.plan,
        topic: session.topic,
        subject: session.subject,
        specialty: session.specialty,
        pageCount: selectedPages,
        lengthOption: Number(selectedPages) >= 10 ? "extended" : "standard",
        studentName: user.name || undefined,
        taskId,
        telegramId: tgId,
        releaseLockOnExit: false,
      });

      if (res.success) {
        await handleInitialDocSuccess(
          ctx,
          user.id,
          tgId,
          res,
          {
            workType,
            topic: session.topic,
            subject: session.subject,
            specialty: session.specialty,
            length: `${selectedPages} bet`,
          },
          taskId
        );
        const finalTask = await getAcademicTask(taskId);
        if (finalTask?.status === "COMPLETED") {
          taskCompleted = true;
        }
      } else {
        await failAcademicTask(taskId, res.error || "Generatsiya xatoligi");
        await ctx.reply(`❌ ${res.error || "Hujjat yaratishda xatolik yuz berdi."}`);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      await failAcademicTask(taskId, errorMsg);
      await ctx.reply("❌ Hujjat yaratishda kutilmagan xatolik yuz berdi.");
    } finally {
      if (!taskCompleted) {
        try {
          await failAcademicTask(taskId, "Jarayon to'xtatildi yoki uzildi");
        } catch {}
      }
      await releaseUserLock(tgId, taskId);
    }
  });

  // Length callbacks for Referat
  docnovaAiBot.callbackQuery(/^ref_len_(short|standard|extended)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!ctx.from) return;
    const tgId = ctx.from.id;
    const session = await getBotSession(tgId);
    const user = await getLinkedUser(tgId);
    if (!session || !user || !session.topic) {
      await ctx.reply("Sessiya muddati tugagan. Qaytadan /start bosing.");
      return;
    }

    const lock = await acquireUserLock(tgId);
    if (!lock.acquired) {
      console.warn(
        `[PARALLEL_RETRY_SUPPRESSED] Referat generation already running for tgId ${tgId}`
      );
      return;
    }

    const taskId = lock.jobId!;
    let taskCompleted = false;

    try {
      const lengthOption = ctx.match[1] as "short" | "standard" | "extended";
      const sub = await getUserSubscription(user.id);

      await createAcademicTask({
        taskId,
        telegramId: tgId,
        userId: user.id,
        workType: "referat",
        topic: session.topic,
        subject: session.subject,
      });

      await ctx.reply(
        `⏳ *Referat tayyorlanmoqda...*\n\n` +
          `📌 *Mavzu:* ${session.topic}\n` +
          `📚 *Fan:* ${session.subject || "Umumiy"}\n` +
          `📄 *Hajm:* ${lengthOption === "short" ? "3-5 bet" : lengthOption === "standard" ? "5-8 bet" : "10-15 bet"}\n\n` +
          `🤖 _Gemini AI MOVSO standartlari bo'yicha to'liq matn shakllantirmoqda. Iltimos 20-40 soniya kuting..._`,
        { parse_mode: "Markdown" }
      );

      await updateAcademicTaskStage(taskId, "GEMINI_GEN");

      const res = await generateAcademicDocument({
        workType: "referat",
        userId: user.id,
        userPlan: sub.plan,
        topic: session.topic,
        subject: session.subject,
        lengthOption,
        studentName: user.name || undefined,
        taskId,
        telegramId: tgId,
        releaseLockOnExit: false,
      });

      if (res.success) {
        await handleInitialDocSuccess(
          ctx,
          user.id,
          tgId,
          res,
          {
            workType: "referat",
            topic: session.topic,
            subject: session.subject,
            length: lengthOption,
          },
          taskId
        );
        const finalTask = await getAcademicTask(taskId);
        if (finalTask?.status === "COMPLETED") {
          taskCompleted = true;
        }
      } else {
        await failAcademicTask(
          taskId,
          res.error || "Referat generatsiyasi muvaffaqiyatsiz bo'ldi."
        );
        await ctx.reply(
          `❌ ${res.error || "Referatni yaratishda xatolik yuz berdi. Iltimos qaytadan urinib ko'ring."}`
        );
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("[TELEGRAM_REFERAT_ERR]", err);
      await failAcademicTask(taskId, errorMsg);
      await ctx.reply(
        "❌ Referat yaratishda kutilmagan xatolik yuz berdi. Iltimos qaytadan urinib ko'ring."
      );
    } finally {
      if (!taskCompleted) {
        try {
          await failAcademicTask(taskId, "Jarayon to'xtatildi yoki uzildi");
        } catch (e) {
          console.error("[FINALLY_FAIL_TASK_ERR]", e);
        }
      }
      await releaseUserLock(tgId, taskId);
    }
  });

  // Slide count callbacks for Presentation
  docnovaAiBot.callbackQuery(/^pres_slides_(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!ctx.from) return;
    const tgId = ctx.from.id;
    const session = await getBotSession(tgId);
    const user = await getLinkedUser(tgId);
    if (!session || !user || !session.topic) {
      await ctx.reply("Sessiya muddati tugagan. Qaytadan /start bosing.");
      return;
    }

    const lock = await acquireUserLock(tgId);
    if (!lock.acquired) {
      console.warn(
        `[PARALLEL_RETRY_SUPPRESSED] Presentation generation already running for tgId ${tgId}`
      );
      return;
    }

    const taskId = lock.jobId!;
    let taskCompleted = false;

    try {
      const slidesCount = parseInt(ctx.match[1], 10);
      const sub = await getUserSubscription(user.id);

      await createAcademicTask({
        taskId,
        telegramId: tgId,
        userId: user.id,
        workType: "presentation",
        topic: session.topic,
      });

      await ctx.reply(
        `⏳ *Taqdimot slaydlari tayyorlanmoqda...*\n\n` +
          `📌 *Mavzu:* ${session.topic}\n` +
          `📑 *Slaydlar:* ${slidesCount} ta\n\n` +
          `🤖 _Gemini AI slaydlar matni va ma'ruzachi nutqini shakllantirmoqda. Iltimos kuting..._`,
        { parse_mode: "Markdown" }
      );

      await updateAcademicTaskStage(taskId, "GEMINI_GEN");

      const res = await generateAcademicDocument({
        workType: "presentation",
        userId: user.id,
        userPlan: sub.plan,
        topic: session.topic,
        slidesCount,
        taskId,
        telegramId: tgId,
        releaseLockOnExit: false,
      });

      if (res.success) {
        await handleInitialDocSuccess(
          ctx,
          user.id,
          tgId,
          res,
          {
            workType: "presentation",
            topic: session.topic,
            slidesCount,
          },
          taskId
        );
        const finalTask = await getAcademicTask(taskId);
        if (finalTask?.status === "COMPLETED") {
          taskCompleted = true;
        }
      } else {
        await failAcademicTask(
          taskId,
          res.error || "Taqdimot generatsiyasi muvaffaqiyatsiz bo'ldi."
        );
        await ctx.reply(
          `❌ ${res.error || "Taqdimotni yaratishda xatolik yuz berdi. Iltimos qaytadan urinib ko'ring."}`
        );
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("[TELEGRAM_PRESENTATION_ERR]", err);
      await failAcademicTask(taskId, errorMsg);
      await ctx.reply(
        "❌ Taqdimot yaratishda kutilmagan xatolik yuz berdi. Iltimos qaytadan urinib ko'ring."
      );
    } finally {
      if (!taskCompleted) {
        try {
          await failAcademicTask(taskId, "Jarayon to'xtatildi yoki uzildi");
        } catch (e) {
          console.error("[FINALLY_FAIL_TASK_ERR]", e);
        }
      }
      await releaseUserLock(tgId, taskId);
    }
  });

  // =========================================================================
  // SECTION 9: ACADEMIC EDITING & REWRITING CALLBACK QUERIES
  // =========================================================================

  // 1. ed_done: Accept and finish
  docnovaAiBot.callbackQuery("ed_done", async (ctx) => {
    await ctx.answerCallbackQuery({ text: "✅ Yakunlandi!" });
    if (!ctx.from) return;
    const session = await getBotSession(ctx.from.id);
    const user = await getLinkedUser(ctx.from.id);

    if (session?.docId && user) {
      await finalizeAcademicDocument(session.docId, user.id);
    }

    await clearBotSession(ctx.from.id);
    await ctx.reply(
      `🎉 *Akademik ish muvaffaqiyatli qabul qilindi va yakunlandi!*\n\n` +
        `Siz yaratgan hujjat va barcha tahrirlangan versiyalar DocNova profilingizda xavfsiz saqlandi.\n\n` +
        `🌐 Rasmiy sayt: https://www.docnova.uz\n\n` +
        `Yana qanday akademik ish tayyorlaymiz?`,
      { parse_mode: "Markdown", reply_markup: getMainReplyKeyboard() }
    );
  });

  // 2. ed_menu: Back to main editing menu
  docnovaAiBot.callbackQuery("ed_menu", async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!ctx.from) return;
    const session = await getBotSession(ctx.from.id);
    const ver = session?.currentVersion || 1;
    await setBotSession(ctx.from.id, {
      ...session!,
      action: undefined,
      selectedPart: undefined,
    });
    await ctx.reply("✍️ Quyidagi tahrirlash amallaridan birini tanlang:", {
      reply_markup: getDocumentEditKeyboard({ version: ver, hasPrevVersion: ver > 1 }),
    });
  });

  // 3. ed_rewrite: "Boshqacharoq yozib ber"
  docnovaAiBot.callbackQuery("ed_rewrite", async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!ctx.from) return;
    const session = await getBotSession(ctx.from.id);
    if (!session || !session.docId) {
      await ctx.reply("⚠️ Hujjat sessiyasi topilmadi. Qaytadan boshlash uchun /start ni bosing.");
      return;
    }

    await setBotSession(ctx.from.id, { ...session, action: "rewrite_custom" });
    await ctx.reply(
      `✍️ *Hujjatni qanday o'zgartirishni xohlaysiz?*\n\n` +
        `Quyidagi tavsiyalardan birini tanlashingiz yoki o'zgartirish talabingizni *to'g'ridan-to'g'ri yozma xabar qilib yuborishingiz* mumkin:\n\n` +
        `_Masalan: Kirish qismini o'zgartir, 2024-yilgi yangi statistik ma'lumotlarni qo'sh va xulosani kengaytir._`,
      { parse_mode: "Markdown", reply_markup: getRewriteOptionsKeyboard() }
    );
  });

  // Quick suggestions for rewrite
  docnovaAiBot.callbackQuery(
    /^rw_(simple|academic|detailed|examples|intro|notemp|deep|teacher)$/,
    async (ctx) => {
      await ctx.answerCallbackQuery();
      if (!ctx.from) return;
      const tgId = ctx.from.id;
      const session = await getBotSession(tgId);
      const user = await getLinkedUser(tgId);
      if (!session || !session.docId || !user) {
        await ctx.reply("Sessiya topilmadi. /start buyrug'ini bosing.");
        return;
      }

      const lock = await acquireUserLock(tgId);
      if (!lock.acquired) {
        console.warn(`[PARALLEL_RETRY_SUPPRESSED] Rewriting already running for tgId ${tgId}`);
        return;
      }

      try {
        const map: Record<string, { label: string; prompt: string }> = {
          simple: {
            label: "Sodda va tushunarli",
            prompt: "Matnni oddiy, sodda va barchaga tushunarli tilda qayta yozib ber.",
          },
          academic: {
            label: "Ilmiy-akademik uslub",
            prompt:
              "Matnni qat'iy ilmiy, akademik va rasmiy terminologiya bilan, OAK talablariga mos qayta yozib ber.",
          },
          detailed: {
            label: "Batafsil tahlil",
            prompt:
              "Matnni har bir fikr va tushunchani chuqur yoritib, yanada batafsilroq va to'liq qil.",
          },
          examples: {
            label: "Misol va tahlillar",
            prompt:
              "Matnga amaliy misollar, 2024-2026 yillardagi statistik ko'rsatkichlar va qiyosiy jadvallarni ko'paytir.",
          },
          intro: {
            label: "Kirish qismi yangilandi",
            prompt:
              "Kirish qismini dolzarblik, O'zbekiston-2030 strategiyasi, maqsad va vazifalar bilan butunlay boshqacha va mukammal qilib qayta yoz.",
          },
          notemp: {
            label: "Takrorlar olib tashlandi",
            prompt:
              "Matndagi bir xil fikrlar va takrorlangan jumlalarni olib tashlab, toza, aniq va lo'nda qil.",
          },
          deep: {
            label: "Chuqur ilmiy tahlil",
            prompt:
              "Mavzuning tub muammolari, ilmiy tahlillari va innovatsion yechimlarini chuqurroq tahlil qil.",
          },
          teacher: {
            label: "O'qituvchi talabiga moslandi",
            prompt:
              "O'qituvchi va kafedra talab qiladigan standartlarga moslashtir, ilmiy apparatni kuchaytir.",
          },
        };

        const key = ctx.match[1];
        const opt = map[key] || { label: "Tahrir", prompt: "Matnni qayta tahrirlab ber." };

        await setBotSession(tgId, { ...session, inProgress: true, activeJobId: lock.jobId });
        await ctx.reply(
          `⏳ *Hujjat tanlangan talab asosida qayta tahrirlanmoqda...*\n\n` +
            `📌 *Talab:* _${opt.label}_\n\n` +
            `🤖 _Gemini AI ishlamoqda, iltimos 25-45 soniya kuting..._`,
          { parse_mode: "Markdown" }
        );

        const snapshot = await getDocumentVersionData({
          docId: session.docId,
          userId: user.id,
          version: session.currentVersion || 1,
        });

        if (!snapshot) {
          await setBotSession(tgId, { ...session, inProgress: false });
          await ctx.reply("❌ Hujjat ma'lumotlari topilmadi.");
          return;
        }

        const sub = await getUserSubscription(user.id);
        const res = await rewriteAcademicDoc({
          userId: user.id,
          userPlan: sub.plan,
          currentMarkdown: snapshot.markdown,
          instruction: opt.prompt,
          workType: session.type,
          topic: session.topic,
          subject: session.subject || session.specialty,
        });

        await handleUpdatedDocSuccess(
          ctx,
          user.id,
          tgId,
          res,
          session,
          `Boshqacharoq yozish: ${opt.label}`,
          lock.jobId
        );
      } finally {
        await releaseUserLock(tgId, lock.jobId!);
      }
    }
  );

  // 4. ed_regen: "Qaytadan yaratish"
  docnovaAiBot.callbackQuery("ed_regen", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(
      `🔄 *Hujjatni noldan qaytadan yaratmoqchimisiz?*\n\n` +
        `Avval kiritilgan mavzu va parametrlar asosida yangi variant shakllantiriladi. Avvalgi versiyangiz yo'qolmaydi va unga istalgan payt qaytishingiz mumkin bo'ladi.`,
      { parse_mode: "Markdown", reply_markup: getRegenConfirmKeyboard() }
    );
  });

  docnovaAiBot.callbackQuery("ed_regen_confirm", async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!ctx.from) return;
    const tgId = ctx.from.id;
    const session = await getBotSession(tgId);
    const user = await getLinkedUser(tgId);
    if (!session || !session.docId || !user) {
      await ctx.reply("Sessiya topilmadi. /start buyrug'ini bosing.");
      return;
    }

    const lock = await acquireUserLock(tgId);
    if (!lock.acquired) {
      console.warn(`[PARALLEL_RETRY_SUPPRESSED] Task already running for tgId ${tgId}`);
      return;
    }

    try {
      await setBotSession(tgId, { ...session, inProgress: true, activeJobId: lock.jobId });
      await ctx.reply(
        `⏳ *Hujjat noldan yangi parametrlar bilan yaratilmoqda...*\n\n` +
          `📌 *Mavzu:* ${session.topic}\n\n` +
          `🤖 _Gemini AI ishlamoqda, iltimos 30-45 soniya kuting..._`,
        { parse_mode: "Markdown" }
      );

      const sub = await getUserSubscription(user.id);
      const res = await regenerateAcademicDoc({
        userId: user.id,
        userPlan: sub.plan,
        type: session.type,
        topic: session.topic || "Akademik ish",
        subject: session.subject,
        specialty: session.specialty,
        lengthOption: session.length as "short" | "standard" | "extended" | undefined,
        slidesCount: session.slidesCount,
      });

      await handleUpdatedDocSuccess(
        ctx,
        user.id,
        tgId,
        res,
        session,
        "Noldan qaytadan yaratildi",
        lock.jobId
      );
    } finally {
      await releaseUserLock(tgId, lock.jobId!);
    }
  });

  // 5. ed_part: "Faqat tanlangan qismini o'zgartirish"
  docnovaAiBot.callbackQuery("ed_part", async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!ctx.from) return;
    const session = await getBotSession(ctx.from.id);
    const user = await getLinkedUser(ctx.from.id);
    if (!session || !session.docId || !user) {
      await ctx.reply("Sessiya topilmadi. /start buyrug'ini bosing.");
      return;
    }

    const snapshot = await getDocumentVersionData({
      docId: session.docId,
      userId: user.id,
      version: session.currentVersion || 1,
    });

    const parsed = snapshot ? parseDocumentSections(snapshot.markdown) : [];
    const availableKeys = parsed.map((p) => p.key);

    await setBotSession(ctx.from.id, { ...session, action: "part_select" });
    await ctx.reply(
      `📝 *Faqat tanlangan qismini o'zgartirish:*\n\n` +
        `Qaysi qismni o'zgartirmoqchisiz? Quyidagi tarkibiy qismlardan birini tanlang:`,
      {
        parse_mode: "Markdown",
        reply_markup: getPartSelectionKeyboard(availableKeys),
      }
    );
  });

  // Selected Part Handler
  docnovaAiBot.callbackQuery(
    /^prt_(titul|mundarija|kirish|bob1|bob2|bob3|xulosa|adabiyot)$/,
    async (ctx) => {
      await ctx.answerCallbackQuery();
      if (!ctx.from) return;
      const session = await getBotSession(ctx.from.id);
      if (!session || !session.docId) {
        await ctx.reply("Sessiya topilmadi. /start buyrug'ini bosing.");
        return;
      }

      const partKey = ctx.match[1] as SectionKey;
      const labelMap: Record<string, string> = {
        titul: "Titul / Muqova varag'i",
        mundarija: "Mundarija / Reja",
        kirish: "Kirish qismi",
        bob1: "1-bob (Nazariy asoslar)",
        bob2: "2-bob (Amaliy / Tahlil)",
        bob3: "3-bob (Taklif va tavsiyalar)",
        xulosa: "Xulosa va tavsiyalar",
        adabiyot: "Foydalanilgan adabiyotlar",
      };

      const partLabel = labelMap[partKey] || partKey;

      await setBotSession(ctx.from.id, {
        ...session,
        action: "part_instruction",
        selectedPart: partKey,
      });

      await ctx.reply(
        `📝 *«${partLabel}» qismini tahrirlash:*\n\n` +
          `Ushbu qismni qanday o'zgartirmoqchisiz? Quyidagi tavsiyalardan birini tanlang yoki *o'zgartirish talabingizni yozma xabar qilib yuboring*:\n\n` +
          `_Masalan: 2024-yilgi rasmiy statistikalarni kirit va qiyosiy jadval qo'sh._`,
        {
          parse_mode: "Markdown",
          reply_markup: getPartEditOptionsKeyboard(partKey, partLabel),
        }
      );
    }
  );

  // Suggested edits for the selected part
  docnovaAiBot.callbackQuery(/^prtop_(stats|expand|academic|condense)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!ctx.from) return;
    const tgId = ctx.from.id;
    const session = await getBotSession(tgId);
    const user = await getLinkedUser(tgId);
    if (!session || !session.docId || !user || !session.selectedPart) {
      await ctx.reply("Sessiya muddati o'tgan. /start buyrug'ini bosing.");
      return;
    }

    const lock = await acquireUserLock(tgId);
    if (!lock.acquired) {
      console.warn(`[PARALLEL_RETRY_SUPPRESSED] Task already running for tgId ${tgId}`);
      return;
    }

    try {
      const optMap: Record<string, { label: string; prompt: string }> = {
        stats: {
          label: "Jadval va statistika qo'shildi",
          prompt:
            "Ushbu bo'limga 2024-2026 yillardagi rasmiy statistik ko'rsatkichlar va batafsil qiyosiy Markdown jadval qo'shing.",
        },
        expand: {
          label: "Mazmun kengaytirildi",
          prompt:
            "Ushbu bo'lim mazmunini chuqur tahlillar, qo'shimcha ilmiy ma'lumotlar va amaliy misollar bilan kengaytiring.",
        },
        academic: {
          label: "Ilmiy apparat kuchaytirildi",
          prompt:
            "Ushbu bo'limning ilmiy uslubini, terminologiyasini va ilmiy dalillarini kuchaytiring.",
        },
        condense: {
          label: "Ixchamlashtirildi",
          prompt:
            "Ushbu bo'limdagi ortiqcha gaplarni olib tashlab, eng muhim ilmiy mohiyatni lo'nda bayon qiling.",
        },
      };

      const opt = optMap[ctx.match[1]] || {
        label: "Bo'lim yangilandi",
        prompt: "Ushbu bo'limni mukammal tahrirlang.",
      };

      await setBotSession(tgId, { ...session, inProgress: true, activeJobId: lock.jobId });
      await ctx.reply(
        `⏳ *«${session.selectedPart}» bo'limi tahrirlanmoqda...*\n\n` +
          `📌 *Amal:* _${opt.label}_\n\n` +
          `🤖 _Faqat ushbu bo'lim yangilanmoqda, boshqa qismlar to'liq saqlanadi. Iltimos 15-30 soniya kuting..._`,
        { parse_mode: "Markdown" }
      );

      const snapshot = await getDocumentVersionData({
        docId: session.docId,
        userId: user.id,
        version: session.currentVersion || 1,
      });

      if (!snapshot) {
        await setBotSession(tgId, { ...session, inProgress: false });
        await ctx.reply("❌ Hujjat ma'lumotlari topilmadi.");
        return;
      }

      const sub = await getUserSubscription(user.id);
      const res = await editAcademicSection({
        userId: user.id,
        userPlan: sub.plan,
        currentMarkdown: snapshot.markdown,
        sectionKey: session.selectedPart as SectionKey,
        sectionInstruction: opt.prompt,
        workType: session.type,
        topic: session.topic,
        subject: session.subject || session.specialty,
      });

      await handleUpdatedDocSuccess(
        ctx,
        user.id,
        tgId,
        res,
        session,
        `Bo'lim tahrirlandi: ${session.selectedPart} (${opt.label})`,
        lock.jobId
      );
    } finally {
      await releaseUserLock(tgId, lock.jobId!);
    }
  });

  // 6. ed_length: "Hajmini o'zgartirish"
  docnovaAiBot.callbackQuery("ed_length", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(
      `📏 *Hujjat hajmini qanday o'zgartirmoqchisiz?*\n\n` +
        `Kerakli variantni tanlang yoki o'zingiz xohlagan aniq sahifa sonini kiriting:`,
      { parse_mode: "Markdown", reply_markup: getLengthOptionsKeyboard() }
    );
  });

  // Length option buttons
  docnovaAiBot.callbackQuery(
    /^len_(expand_2x|shorten_2x|10_15|20_25|30_plus|50|100|200|300)$/,
    async (ctx) => {
      await ctx.answerCallbackQuery();
      if (!ctx.from) return;
      const tgId = ctx.from.id;
      const session = await getBotSession(tgId);
      const user = await getLinkedUser(tgId);
      if (!session || !session.docId || !user) {
        await ctx.reply("Sessiya topilmadi. /start buyrug'ini bosing.");
        return;
      }

      const lock = await acquireUserLock(tgId);
      if (!lock.acquired) {
        console.warn(`[PARALLEL_RETRY_SUPPRESSED] Task already running for tgId ${tgId}`);
        return;
      }

      try {
        const lengthOption = ctx.match[1] as
          "expand_2x" | "shorten_2x" | "10_15" | "20_25" | "30_plus" | "50" | "100" | "200" | "300";
        await setBotSession(tgId, { ...session, inProgress: true, activeJobId: lock.jobId });

        await ctx.reply(
          `⏳ *Hujjat hajmi o'zgartirilmoqda...*\n\n` +
            `🤖 _Mantiqiy tuzilma va GOST standartlari saqlangan holda yangi hajm shakllantirilmoqda. Iltimos 25-45 soniya kuting..._`,
          { parse_mode: "Markdown" }
        );

        const snapshot = await getDocumentVersionData({
          docId: session.docId,
          userId: user.id,
          version: session.currentVersion || 1,
        });

        if (!snapshot) {
          await setBotSession(tgId, { ...session, inProgress: false });
          await ctx.reply("❌ Hujjat ma'lumotlari topilmadi.");
          return;
        }

        const sub = await getUserSubscription(user.id);
        const res = await adjustAcademicLength({
          userId: user.id,
          userPlan: sub.plan,
          currentMarkdown: snapshot.markdown,
          lengthOption,
          workType: session.type,
          topic: session.topic,
          subject: session.subject || session.specialty,
        });

        await handleUpdatedDocSuccess(
          ctx,
          user.id,
          tgId,
          res,
          session,
          `Hajm o'zgartirildi: ${lengthOption}`,
          lock.jobId
        );
      } finally {
        await releaseUserLock(tgId, lock.jobId!);
      }
    }
  );

  docnovaAiBot.callbackQuery("len_custom", async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!ctx.from) return;
    const session = await getBotSession(ctx.from.id);
    if (!session) return;

    await setBotSession(ctx.from.id, { ...session, action: "length_custom_input" });
    await ctx.reply(
      `✏️ *Iltimos, hujjat aynan necha bet bo'lishini yozib yuboring:*\n\n` +
        `_Masalan: 18 bet yoki 26 bet_`,
      { parse_mode: "Markdown" }
    );
  });

  // 7. ed_expand: "Mazmunini kengaytirish"
  docnovaAiBot.callbackQuery("ed_expand", async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!ctx.from) return;
    const tgId = ctx.from.id;
    const session = await getBotSession(tgId);
    const user = await getLinkedUser(tgId);
    if (!session || !session.docId || !user) {
      await ctx.reply("Sessiya topilmadi. /start buyrug'ini bosing.");
      return;
    }

    const lock = await acquireUserLock(tgId);
    if (!lock.acquired) {
      console.warn(`[PARALLEL_RETRY_SUPPRESSED] Task already running for tgId ${tgId}`);
      return;
    }

    try {
      await setBotSession(tgId, { ...session, inProgress: true, activeJobId: lock.jobId });
      await ctx.reply(
        `⏳ *Hujjat mazmuni kengaytirilmoqda...*\n\n` +
          `📊 _2024-2026 yillardagi rasmiy statistika, qiyosiy jadvallar va amaliy tahlillar bilan boyitilmoqda. Iltimos 25-45 soniya kuting..._`,
        { parse_mode: "Markdown" }
      );

      const snapshot = await getDocumentVersionData({
        docId: session.docId,
        userId: user.id,
        version: session.currentVersion || 1,
      });

      if (!snapshot) {
        await setBotSession(tgId, { ...session, inProgress: false });
        await ctx.reply("❌ Hujjat ma'lumotlari topilmadi.");
        return;
      }

      const sub = await getUserSubscription(user.id);
      const res = await expandAcademicContent({
        userId: user.id,
        userPlan: sub.plan,
        currentMarkdown: snapshot.markdown,
        workType: session.type,
        topic: session.topic,
        subject: session.subject || session.specialty,
      });

      await handleUpdatedDocSuccess(
        ctx,
        user.id,
        tgId,
        res,
        session,
        "Mazmuni kengaytirildi (Faktlar, jadvallar, tahlillar)",
        lock.jobId
      );
    } finally {
      await releaseUserLock(tgId, lock.jobId!);
    }
  });

  // 8. ed_shorten: "Qisqartirish"
  docnovaAiBot.callbackQuery("ed_shorten", async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!ctx.from) return;
    const tgId = ctx.from.id;
    const session = await getBotSession(tgId);
    const user = await getLinkedUser(tgId);
    if (!session || !session.docId || !user) {
      await ctx.reply("Sessiya topilmadi. /start buyrug'ini bosing.");
      return;
    }

    const lock = await acquireUserLock(tgId);
    if (!lock.acquired) {
      console.warn(`[PARALLEL_RETRY_SUPPRESSED] Task already running for tgId ${tgId}`);
      return;
    }

    try {
      await setBotSession(tgId, { ...session, inProgress: true, activeJobId: lock.jobId });
      await ctx.reply(
        `⏳ *Hujjat qisqartirilmoqda va ixchamlashtirilmoqda...*\n\n` +
          `🧹 _Ortiqcha gaplar, suv matnlar va takroriy fikrlar olib tashlanmoqda. Asosiy ilmiy mohiyat saqlanadi..._`,
        { parse_mode: "Markdown" }
      );

      const snapshot = await getDocumentVersionData({
        docId: session.docId,
        userId: user.id,
        version: session.currentVersion || 1,
      });

      if (!snapshot) {
        await setBotSession(tgId, { ...session, inProgress: false });
        await ctx.reply("❌ Hujjat ma'lumotlari topilmadi.");
        return;
      }

      const sub = await getUserSubscription(user.id);
      const res = await condenseAcademicContent({
        userId: user.id,
        userPlan: sub.plan,
        currentMarkdown: snapshot.markdown,
        workType: session.type,
        topic: session.topic,
        subject: session.subject || session.specialty,
      });

      await handleUpdatedDocSuccess(
        ctx,
        user.id,
        tgId,
        res,
        session,
        "Hujjat qisqartirildi va ixchamlashtirildi",
        lock.jobId
      );
    } finally {
      await releaseUserLock(tgId, lock.jobId!);
    }
  });

  // 9. ed_style: "Akademik uslubni yaxshilash"
  docnovaAiBot.callbackQuery("ed_style", async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!ctx.from) return;
    const tgId = ctx.from.id;
    const session = await getBotSession(tgId);
    const user = await getLinkedUser(tgId);
    if (!session || !session.docId || !user) {
      await ctx.reply("Sessiya topilmadi. /start buyrug'ini bosing.");
      return;
    }

    const lock = await acquireUserLock(tgId);
    if (!lock.acquired) {
      console.warn(`[PARALLEL_RETRY_SUPPRESSED] Task already running for tgId ${tgId}`);
      return;
    }

    try {
      await setBotSession(tgId, { ...session, inProgress: true, activeJobId: lock.jobId });
      await ctx.reply(
        `⏳ *Akademik uslub yaxshilanmoqda...*\n\n` +
          `🏛 _O'zbekiston OAK va MOVSO talablariga mos ilmiy terminologiya, rasmiy uslub va GOST standartlari kiritilmoqda..._`,
        { parse_mode: "Markdown" }
      );

      const snapshot = await getDocumentVersionData({
        docId: session.docId,
        userId: user.id,
        version: session.currentVersion || 1,
      });

      if (!snapshot) {
        await setBotSession(tgId, { ...session, inProgress: false });
        await ctx.reply("❌ Hujjat ma'lumotlari topilmadi.");
        return;
      }

      const sub = await getUserSubscription(user.id);
      const res = await improveAcademicStyle({
        userId: user.id,
        userPlan: sub.plan,
        currentMarkdown: snapshot.markdown,
        workType: session.type,
        topic: session.topic,
        subject: session.subject || session.specialty,
      });

      await handleUpdatedDocSuccess(
        ctx,
        user.id,
        tgId,
        res,
        session,
        "Akademik uslub yaxshilandi (OAK / MOVSO)",
        lock.jobId
      );
    } finally {
      await releaseUserLock(tgId, lock.jobId!);
    }
  });

  // 10. ed_revert: Revert to previous version
  docnovaAiBot.callbackQuery("ed_revert", async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!ctx.from) return;
    const session = await getBotSession(ctx.from.id);
    const user = await getLinkedUser(ctx.from.id);
    if (!session || !session.docId || !user) {
      await ctx.reply("Sessiya topilmadi. /start buyrug'ini bosing.");
      return;
    }

    const curVer = session.currentVersion || 1;
    if (curVer <= 1) {
      await ctx.reply("⚠️ Bu birinchi versiya, avvalgi versiya mavjud emas.");
      return;
    }

    await ctx.reply("⏪ *Avvalgi versiya yuklanmoqda...*", { parse_mode: "Markdown" });

    const revertResult = await revertToPreviousVersion({
      docId: session.docId,
      userId: user.id,
      currentVersion: curVer,
    });

    if (!revertResult) {
      await ctx.reply("❌ Avvalgi versiya ma'lumotlari topilmadi.");
      return;
    }

    const { snapshot, targetVersion } = revertResult;

    // Generate Word document Buffer from reverted snapshot
    const buffer = generateWordDocumentBuffer({
      title: snapshot.topic,
      bodyContent: snapshot.markdown,
      workType: snapshot.workType,
      subject: snapshot.subject,
    });

    // Update session to targetVersion
    await setBotSession(ctx.from.id, {
      ...session,
      currentVersion: targetVersion,
      action: undefined,
      selectedPart: undefined,
    });

    await ctx.replyWithDocument(new InputFile(buffer, snapshot.fileName || "Hujjat.doc"), {
      caption: `⏪ *Hujjat avvalgi v${targetVersion} versiyasiga muvaffaqiyatli qaytarildi!*\n\n📌 *Mavzu:* ${snapshot.topic}\n📄 *Format:* Microsoft Word (.doc)`,
      parse_mode: "Markdown",
    });

    await ctx.reply(`✍️ *Hujjat v${targetVersion} holatida.* Qanday amal bajaramiz?`, {
      reply_markup: getDocumentEditKeyboard({
        version: targetVersion,
        hasPrevVersion: targetVersion > 1,
      }),
    });
  });

  // =========================================================================
  // DOCUMENT MESSAGE HANDLER (PDF to Word .doc Conversion directly in Bot)
  // =========================================================================
  docnovaAiBot.on("message:document", async (ctx) => {
    if (!ctx.from || !ctx.message?.document) return;
    const tgId = ctx.from.id;
    const doc = ctx.message.document;
    const fileName = doc.file_name || "Hujjat.pdf";
    const isPdf = doc.mime_type === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      await ctx.reply(
        "⚠️ Iltimos, faqat *.pdf* formatidagi fayl yuboring. Bot PDF fayl ichidagi matnlarni o'qib, *Microsoft Word (.doc)* formatiga o'girib beradi.",
        { parse_mode: "Markdown" }
      );
      return;
    }

    if (doc.file_size && doc.file_size > 20 * 1024 * 1024) {
      await ctx.reply("⚠️ Fayl hajmi 20 MB dan kichik bo'lishi kerak.");
      return;
    }

    const lock = await acquireUserLock(tgId, 30);
    if (!lock.acquired) return;

    try {
      await ctx.reply(`⏳ *«${fileName}» o'qilmoqda va Word (.doc) formatiga o'tkazilmoqda...*`, {
        parse_mode: "Markdown",
      });

      const fileInfo = await ctx.api.getFile(doc.file_id);
      if (!fileInfo.file_path) {
        throw new Error("Telegram fayl manzili topilmadi");
      }

      const token = process.env.DOCNOVA_AI_BOT_TOKEN;
      const fileUrl = `https://api.telegram.org/file/bot${token}/${fileInfo.file_path}`;
      const fileRes = await fetch(fileUrl);
      if (!fileRes.ok) {
        throw new Error("Faylni yuklab olishda xatolik");
      }

      const arrayBuffer = await fileRes.arrayBuffer();
      const pdfBuffer = Buffer.from(arrayBuffer);

      // Parse PDF text using pdf-parse
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse");
      const pdfData = await pdfParse(pdfBuffer);
      const extractedText = String(pdfData?.text || "").trim();

      if (!extractedText || extractedText.length < 5) {
        await ctx.reply(
          "⚠️ Ushbu PDF fayldan matn topilmadi (fayl skanerlangan rasm bo'lishi mumkin). Iltimos, matnli PDF yuboring."
        );
        return;
      }

      const cleanBaseName = fileName
        .replace(/\.pdf$/i, "")
        .replace(/[^a-zA-Z0-9_\-\u0400-\u04FF]/g, "_");
      const wordBuffer = generateWordDocumentBuffer({
        title: cleanBaseName || "PDF_to_Word",
        bodyContent: `# ${fileName.replace(/\.pdf$/i, "")}\n\n${extractedText}`,
        workType: "PDF dan Word ga o'tkazilgan hujjat",
      });

      const wordCount = extractedText.split(/\s+/).filter(Boolean).length;
      const outFileName = `${cleanBaseName || "DocNova_Converted"}.doc`;

      await ctx.replyWithDocument(new InputFile(wordBuffer, outFileName), {
        caption:
          `✅ *PDF muvaffaqiyatli Word (.doc) formatiga o'tkazildi!*\n\n` +
          `📄 *Asl fayl:* ${fileName}\n` +
          `📑 *Sahifalar:* ${pdfData?.numpages || 1} bet\n` +
          `📝 *So'zlar soni:* ${wordCount.toLocaleString()} ta so'z\n` +
          `🏛 *Format:* Microsoft Word (.doc)`,
        parse_mode: "Markdown",
      });

      await clearBotSession(tgId);
    } catch (err) {
      console.error("[BOT_PDF_TO_WORD_ERR]", err);
      await ctx.reply(
        "❌ PDF faylni Word formatiga o'tkazishda xatolik yuz berdi. Fayl shikastlanmagan va parollanmaganligini tekshiring."
      );
    } finally {
      await releaseUserLock(tgId, lock.jobId!);
    }
  });

  // =========================================================================
  // TEXT MESSAGE HANDLER (Wizard Steps + Editing Text Input + Main Menu)
  // =========================================================================
  docnovaAiBot.on("message:text", async (ctx) => {
    if (!ctx.from) return;
    const tgId = ctx.from.id;
    const text = ctx.message.text.trim();

    // Ignore commands (they are handled by bot.command)
    if (text.startsWith("/")) return;

    // Handle Main Reply Keyboard Navigation
    if (text === "🎓 Talabalar uchun") {
      const user = await getLinkedUser(tgId);
      if (!user) {
        const linkUrl = await createTelegramLinkToken(tgId, ctx.from.username);
        const kb = new InlineKeyboard().url("🔗 Hisobni bog'lash", linkUrl);
        await ctx.reply("⚠️ Iltimos, oldin DocNova hisobingizni bog'lang:", { reply_markup: kb });
        return;
      }
      await ctx.reply("🎓 *Kerakli akademik ish turini tanlang:*", {
        reply_markup: getStudentInlineMenu(),
        parse_mode: "Markdown",
      });
      return;
    }

    if (text === "💎 Tarif va limitlar") {
      const user = await getLinkedUser(tgId);
      if (!user) {
        const linkUrl = await createTelegramLinkToken(tgId, ctx.from.username);
        const kb = new InlineKeyboard().url("🔗 Hisobni bog'lash", linkUrl);
        await ctx.reply("⚠️ Iltimos, oldin DocNova hisobingizni bog'lang:", { reply_markup: kb });
        return;
      }

      const isSuperAdmin = user.role === "SUPER_ADMIN" || user.role === "ADMIN";
      if (isSuperAdmin) {
        await ctx.reply(
          `💎 *Tarif va Limitlaringiz:*\n\n` +
            `👤 Ism: *${user.name || "Super Admin"}*\n` +
            `💳 Joriy tarif: *Super Admin (Cheksiz)*\n\n` +
            `• 📘 Kurs ishi / Referat / BMI: *Cheksiz (Unlimited)*\n` +
            `• ✍️ Qayta tahrirlash: *Cheksiz (Unlimited)*\n` +
            `• 📊 Taqdimotlar: *Cheksiz (Unlimited)*\n` +
            `• 🤖 Jami so'rovlar: *${user.aiUsageCount || 0} ta*\n\n` +
            `🚀 Super Admin imtiyozi: Barcha AI modullariga to'siqsiz cheksiz ruxsat.`,
          { parse_mode: "Markdown" }
        );
        return;
      }

      const sub = await getUserSubscription(user.id);
      const courseworkLimit = await checkUserLimit(user.id, "coursework");
      const presentationLimit = await checkUserLimit(user.id, "presentation");
      const rewriteLimit = await checkUserLimit(user.id, "rewrite");

      await ctx.reply(
        `💎 *Tarif va Limitlaringiz:*\n\n` +
          `👤 Ism: *${user.name || "Talaba"}*\n` +
          `💳 Joriy tarif: *${sub.plan}*\n\n` +
          `• 📘 Kurs ishi / Referat / BMI: *${courseworkLimit.remaining} ta qoldi*\n` +
          `• ✍️ Qayta tahrirlash: *${rewriteLimit.remaining} ta qoldi*\n` +
          `• 📊 Taqdimotlar: *${presentationLimit.remaining} ta qoldi*\n\n` +
          `Tarifni yangilash: https://www.docnova.uz/pricing`,
        { parse_mode: "Markdown" }
      );
      return;
    }

    if (text === "👤 Mening akkauntim") {
      const user = await getLinkedUser(tgId);
      if (!user) {
        const linkUrl = await createTelegramLinkToken(tgId, ctx.from.username);
        const kb = new InlineKeyboard().url("🔗 Hisobni bog'lash", linkUrl);
        await ctx.reply("⚠️ Hisob bog'lanmagan. Iltimos, profilingizni ulang:", {
          reply_markup: kb,
        });
        return;
      }

      const isSuperAdmin = user.role === "SUPER_ADMIN" || user.role === "ADMIN";
      const roleDisplay = isSuperAdmin ? "Super Admin 👑" : user.role;

      await ctx.reply(
        `👤 *Sizning profilingiz:*\n\n` +
          `Ism: *${user.name || "Talaba"}*\n` +
          `Email: \`${user.email}\`\n` +
          `Rol: *${roleDisplay}*\n` +
          `Telegram ID: \`${tgId}\`\n` +
          `Holat: *Ulangan ✅*`,
        { parse_mode: "Markdown" }
      );
      return;
    }

    if (text === "🌐 DocNova sayti") {
      await ctx.reply(
        `🌐 *DocNova Rasmiy Platformasi:*\n\nhttps://www.docnova.uz\n\nBarcha xizmatlar, shaxsiy kabinet va hisobotlar saytda mavjud.`,
        { parse_mode: "Markdown" }
      );
      return;
    }

    if (text === "📄 PDF → Word (.doc)") {
      await setBotSession(tgId, { type: "pdf_to_word", step: "pdf_wait" });
      await ctx.reply(
        `📄 *PDF dan Word (.doc) ga o'tkazish*\n\n` +
          `Marhamat, o'zingizdagi *.pdf* faylni shu chatga yuboring (maksimal 20 MB).\n\n` +
          `🤖 Bot PDF ichidagi barcha matnlarni o'qib olib, sizga tayyor *Microsoft Word (.doc)* formatida qaytarib beradi!`,
        { parse_mode: "Markdown" }
      );
      return;
    }

    if (text === "💬 Fikr bildirish") {
      await setBotSession(tgId, { type: "feedback", step: "feedback_input" });
      await ctx.reply(
        `💬 *Fikr, taklif va kamchiliklarni bildirish*\n\n` +
          `Sayt yoki bot ishlashida qandaydir kamchilik, tushunmovchilik yoki taklifingiz bo'lsa, marhamat, shu yerga yozib yuboring.\n\n` +
          `📬 _Xabaringiz to'g'ridan-to'g'ri DocNova loyiha rahbariyatiga yetkaziladi:_`,
        { parse_mode: "Markdown" }
      );
      return;
    }

    if (text === "❓ Yordam") {
      await ctx.reply(
        `❓ *Yordam va qo'llab-quvvatlash:*\n\n` +
          `Har qanday savol yoki takliflar bo'yicha «💬 Fikr bildirish» tugmasini bosing yoki biz bilan bog'laning:\n` +
          `💬 Qo'llab-quvvatlash: @docnova_support\n` +
          `🌐 Sayt: https://www.docnova.uz`,
        { parse_mode: "Markdown" }
      );
      return;
    }

    // Check active session
    const session = await getBotSession(tgId);
    if (!session) {
      await ctx.reply("Iltimos, pastdagi menyudan kerakli bo'limni tanlang:", {
        reply_markup: getMainReplyKeyboard(),
      });
      return;
    }

    // Handle feedback submission (works even if user has not linked Google account yet)
    if (session.type === "feedback" && session.step === "feedback_input") {
      const linkedUser = await getLinkedUser(tgId);
      const adminToken = process.env.TELEGRAM_BOT_TOKEN || process.env.DOCNOVA_AI_BOT_TOKEN;
      const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
      const uzTime = new Date(Date.now() + 5 * 60 * 60 * 1000)
        .toISOString()
        .replace("T", " ")
        .slice(0, 16);

      if (adminToken && adminChatId) {
        const fbReport =
          `📬 *YANGI FIKR VA MUROJAAT (TELEGRAM BOTDAN)*\n\n` +
          `👤 *Ism:* ${linkedUser?.name || ctx.from.first_name || "Foydalanuvchi"}\n` +
          `📧 *Email:* \`${linkedUser?.email || "Ulanmagan"}\`\n` +
          `🔗 *Telegram:* ${ctx.from.username ? `@${ctx.from.username}` : "Username yo'q"} (ID: \`${tgId}\`)\n` +
          `🕒 *Vaqt:* ${uzTime} (Toshkent)\n\n` +
          `💬 *Xabar matni:*\n${text}`;

        await fetch(`https://api.telegram.org/bot${adminToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: adminChatId,
            text: fbReport,
            parse_mode: "Markdown",
          }),
        }).catch((err) => console.error("[BOT_FEEDBACK_SEND_ERR]", err));
      }

      await clearBotSession(tgId);
      await ctx.reply(
        `✅ *Rahmat! Fikr va murojaatingiz qabul qilindi.*\n\nXabaringiz loyiha rahbariyatiga to'g'ridan-to'g'ri yetkazildi.`,
        { parse_mode: "Markdown", reply_markup: getMainReplyKeyboard() }
      );
      return;
    }

    const user = await getLinkedUser(tgId);
    if (!user) {
      await ctx.reply("Iltimos, avval hisobingizni bog'lang (/start).");
      return;
    }

    const sub = await getUserSubscription(user.id);

    // =======================================================================
    // EDITING MODE: User typed text to modify or rewrite the document
    // =======================================================================
    if (session.step === "editing") {
      const lock = await acquireUserLock(tgId);
      if (!lock.acquired) {
        console.warn(`[PARALLEL_RETRY_SUPPRESSED] Rewriting already running for tgId ${tgId}`);
        return;
      }

      try {
        const snapshot = await getDocumentVersionData({
          docId: session.docId!,
          userId: user.id,
          version: session.currentVersion || 1,
        });

        if (!snapshot) {
          await ctx.reply("❌ Hujjat ma'lumotlari topilmadi.");
          return;
        }

        await setBotSession(tgId, { ...session, inProgress: true, activeJobId: lock.jobId });

        // Case A: Custom length input
        if (session.action === "length_custom_input") {
          await ctx.reply(
            `⏳ *Hujjat ko'rsatilgan hajm (${text}) bo'yicha tahrirlanmoqda...*\n\n_Iltimos, 25-45 soniya kuting..._`,
            { parse_mode: "Markdown" }
          );

          const res = await adjustAcademicLength({
            userId: user.id,
            userPlan: sub.plan,
            currentMarkdown: snapshot.markdown,
            lengthOption: "custom",
            customPages: text,
            workType: session.type,
            topic: session.topic,
            subject: session.subject || session.specialty,
          });

          await handleUpdatedDocSuccess(
            ctx,
            user.id,
            tgId,
            res,
            session,
            `Hajm o'zgartirildi: ${text}`,
            lock.jobId
          );
          return;
        }

        // Case B: Instruction for a specific section
        if (session.action === "part_instruction" && session.selectedPart) {
          await ctx.reply(
            `⏳ *«${session.selectedPart}» bo'limi ko'rsatilgan talab asosida tahrirlanmoqda...*\n\n` +
              `📌 *Talab:* _"${text}"_\n\n` +
              `🤖 _Faqat ushbu bo'lim yangilanmoqda, qolgan qismlar o'zgarishsiz saqlanadi. Iltimos kuting..._`,
            { parse_mode: "Markdown" }
          );

          const res = await editAcademicSection({
            userId: user.id,
            userPlan: sub.plan,
            currentMarkdown: snapshot.markdown,
            sectionKey: session.selectedPart as SectionKey,
            sectionInstruction: text,
            workType: session.type,
            topic: session.topic,
            subject: session.subject || session.specialty,
          });

          await handleUpdatedDocSuccess(
            ctx,
            user.id,
            tgId,
            res,
            session,
            `Bo'lim tahrirlandi: ${session.selectedPart} ("${text.slice(0, 40)}")`,
            lock.jobId
          );
          return;
        }

        // Case C: Free-form custom rewrite (or action === "rewrite_custom")
        await ctx.reply(
          `⏳ *Hujjat talabingiz asosida qayta tahrirlanmoqda...*\n\n` +
            `📌 *Talab:* _"${text}"_\n\n` +
            `🤖 _Gemini AI ishlamoqda, iltimos 25-45 soniya kuting..._`,
          { parse_mode: "Markdown" }
        );

        const res = await rewriteAcademicDoc({
          userId: user.id,
          userPlan: sub.plan,
          currentMarkdown: snapshot.markdown,
          instruction: text,
          workType: session.type,
          topic: session.topic,
          subject: session.subject || session.specialty,
        });

        await handleUpdatedDocSuccess(
          ctx,
          user.id,
          tgId,
          res,
          session,
          `Tahrir: "${text.slice(0, 40)}"`,
          lock.jobId
        );
        return;
      } finally {
        await releaseUserLock(tgId, lock.jobId!);
      }
    }

    // =======================================================================
    // WIZARD STEPS FOR INITIAL GENERATION
    // =======================================================================

    // 1. Coursework flow
    if (session.type === "coursework") {
      if (session.step === "topic") {
        await setBotSession(tgId, { ...session, topic: text, step: "subject" });
        await ctx.reply(`📚 Ajoyib! Endi *fan nomini* kiriting (yoki 'Standart' deb yozing):`, {
          parse_mode: "Markdown",
        });
        return;
      }

      if (session.step === "subject") {
        const subject = text.toLowerCase() === "standart" ? undefined : text;
        await setBotSession(tgId, { ...session, subject, step: "length" });
        await ctx.reply(
          `📄 *Kurs ishining kerakli sahifalar sonini (hajmini) tanlang*\n\n` +
            `Pastdagi tugmalardan birini bosing yoki *o'zingiz xohlagan sahifa sonini* (masalan: \`35\`, \`75\`, \`100\`, \`200\`, \`300\`) yozib yuboring:`,
          {
            parse_mode: "Markdown",
            reply_markup: getInitialPageCountKeyboard("cw_pages"),
          }
        );
        return;
      }

      if (session.step === "length") {
        const parsedPages = Math.min(500, Math.max(1, parseInt(text.replace(/\D/g, ""), 10) || 25));
        const pageCountStr = String(parsedPages);

        const lock = await acquireUserLock(tgId);
        if (!lock.acquired) return;

        const taskId = lock.jobId!;
        let taskCompleted = false;

        try {
          const subject = session.subject;
          const topic = session.topic || "Kurs ishi";

          await createAcademicTask({
            taskId,
            telegramId: tgId,
            userId: user.id,
            workType: "coursework",
            topic,
            subject,
          });

          await ctx.reply(
            `⏳ *Kurs ishi tayyorlanmoqda...*\n\n` +
              `📌 *Mavzu:* ${topic}\n` +
              `📚 *Fan:* ${subject || "Standart"}\n` +
              `📄 *Hajm:* ${pageCountStr} bet\n\n` +
              `🤖 _Gemini AI ilmiy apparat va boblarni shakllantirmoqda. Iltimos 15-30 soniya kuting..._`,
            { parse_mode: "Markdown" }
          );

          await updateAcademicTaskStage(taskId, "GEMINI_GEN");

          const res = await generateAcademicDocument({
            workType: "coursework",
            userId: user.id,
            userPlan: sub.plan,
            topic,
            subject,
            pageCount: pageCountStr,
            studentName: user.name || undefined,
            taskId,
            telegramId: tgId,
            releaseLockOnExit: false,
          });

          if (res.success) {
            await handleInitialDocSuccess(
              ctx,
              user.id,
              tgId,
              res,
              {
                workType: "coursework",
                topic,
                subject,
                length: `${pageCountStr} bet`,
              },
              taskId
            );
            const finalTask = await getAcademicTask(taskId);
            if (finalTask?.status === "COMPLETED") {
              taskCompleted = true;
            }
          } else {
            await failAcademicTask(
              taskId,
              res.error || "Kurs ishi generatsiyasi muvaffaqiyatsiz bo'ldi."
            );
            await ctx.reply(
              `❌ ${res.error || "Kurs ishini yaratishda xatolik yuz berdi. Iltimos qaytadan urinib ko'ring."}`
            );
          }
        } catch (genErr) {
          await failAcademicTask(taskId, genErr instanceof Error ? genErr.message : String(genErr));
          await ctx.reply("❌ Kurs ishini yaratishda kutilmagan xatolik yuz berdi.");
        } finally {
          if (!taskCompleted) {
            try {
              await failAcademicTask(taskId, "Jarayon to'xtatildi yoki uzildi");
            } catch {}
          }
          await releaseUserLock(tgId, taskId);
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
          .text("📄 3-5 bet", "ref_len_short")
          .text("📄 5-8 bet", "ref_len_standard")
          .text("📄 10-15 bet", "ref_len_extended")
          .row()
          .text("📄 25 bet", "ref_pages:25")
          .text("📄 50 bet", "ref_pages:50")
          .text("📄 100 bet", "ref_pages:100")
          .row()
          .text("📄 200 bet", "ref_pages:200")
          .text("📄 300 bet", "ref_pages:300")
          .row()
          .text("❌ Bekor qilish", "wiz_cancel");

        await ctx.reply(
          "📄 Referat yoki mustaqil ishning kerakli *hajmini (sahifalar sonini)* tanlang yoki *o'zingiz xohlagan bet sonini* (masalan: `40`, `120`, `250`) yozib yuboring:",
          {
            reply_markup: kb,
            parse_mode: "Markdown",
          }
        );
        return;
      }

      if (session.step === "length") {
        const parsedPages = Math.min(500, Math.max(1, parseInt(text.replace(/\D/g, ""), 10) || 10));
        const pageCountStr = String(parsedPages);

        const lock = await acquireUserLock(tgId);
        if (!lock.acquired) return;
        const taskId = lock.jobId!;
        let taskCompleted = false;

        try {
          await createAcademicTask({
            taskId,
            telegramId: tgId,
            userId: user.id,
            workType: "referat",
            topic: session.topic || "Referat",
            subject: session.subject,
          });

          await ctx.reply(
            `⏳ *Referat / Mustaqil ish tayyorlanmoqda...*\n\n` +
              `📌 *Mavzu:* ${session.topic}\n` +
              `📚 *Fan:* ${session.subject || "Umumiy"}\n` +
              `📄 *Hajm:* ${pageCountStr} bet\n\n` +
              `🤖 _Gemini AI MOVSO standartlari bo'yicha to'liq matn shakllantirmoqda..._`,
            { parse_mode: "Markdown" }
          );

          await updateAcademicTaskStage(taskId, "GEMINI_GEN");

          const res = await generateAcademicDocument({
            workType: "referat",
            userId: user.id,
            userPlan: sub.plan,
            topic: session.topic || "Referat",
            subject: session.subject,
            pageCount: pageCountStr,
            lengthOption: parsedPages >= 10 ? "extended" : "standard",
            studentName: user.name || undefined,
            taskId,
            telegramId: tgId,
            releaseLockOnExit: false,
          });

          if (res.success) {
            await handleInitialDocSuccess(
              ctx,
              user.id,
              tgId,
              res,
              {
                workType: "referat",
                topic: session.topic || "Referat",
                subject: session.subject,
                length: `${pageCountStr} bet`,
              },
              taskId
            );
            const finalTask = await getAcademicTask(taskId);
            if (finalTask?.status === "COMPLETED") {
              taskCompleted = true;
            }
          } else {
            await failAcademicTask(taskId, res.error || "Xatolik");
            await ctx.reply(`❌ ${res.error || "Referat yaratishda xatolik yuz berdi."}`);
          }
        } catch (err) {
          await failAcademicTask(taskId, err instanceof Error ? err.message : String(err));
          await ctx.reply("❌ Referat yaratishda kutilmagan xatolik yuz berdi.");
        } finally {
          if (!taskCompleted) {
            try {
              await failAcademicTask(taskId, "Jarayon to'xtatildi yoki uzildi");
            } catch {}
          }
          await releaseUserLock(tgId, taskId);
        }
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
        await setBotSession(tgId, { ...session, specialty, subject: specialty, step: "length" });
        const kb = new InlineKeyboard()
          .text("📄 50 bet", "bmi_pages:50")
          .text("📄 70 bet", "bmi_pages:70")
          .text("📄 100 bet", "bmi_pages:100")
          .row()
          .text("📄 150 bet", "bmi_pages:150")
          .text("📄 200 bet", "bmi_pages:200")
          .text("📄 300 bet", "bmi_pages:300")
          .row()
          .text("❌ Bekor qilish", "wiz_cancel");

        await ctx.reply(
          `📄 *BMI / Diplom ishining kerakli hajmini (sahifalar sonini) tanlang*\n\n` +
            `Tugmalardan birini bosing yoki *o'zingiz xohlagan sahifa sonini* (masalan: \`80\`, \`120\`, \`250\`, \`300\`) yozib yuboring:`,
          { parse_mode: "Markdown", reply_markup: kb }
        );
        return;
      }

      if (session.step === "length") {
        const parsedPages = Math.min(
          500,
          Math.max(10, parseInt(text.replace(/\D/g, ""), 10) || 70)
        );
        const pageCountStr = String(parsedPages);

        const lock = await acquireUserLock(tgId);
        if (!lock.acquired) return;

        const taskId = lock.jobId!;
        let taskCompleted = false;

        try {
          const specialty = session.specialty || session.subject || "Umumiy";
          const topic = session.topic || "BMI";

          await createAcademicTask({
            taskId,
            telegramId: tgId,
            userId: user.id,
            workType: "bmi",
            topic,
            subject: specialty,
          });

          await ctx.reply(
            `⏳ *Bitiruv malakaviy ishi (BMI) majmuasi tayyorlanmoqda...*\n\n` +
              `📌 *Mavzu:* ${topic}\n` +
              `🏛 *Yo'nalish:* ${specialty}\n` +
              `📄 *Hajm:* ${pageCountStr} bet\n\n` +
              `🤖 _MOVSO RUz standartidagi to'liq ilmiy apparat, boblar va statistik tahlil shakllantirilmoqda. Iltimos 35-50 soniya kuting..._`,
            { parse_mode: "Markdown" }
          );

          await updateAcademicTaskStage(taskId, "GEMINI_GEN");

          const res = await generateAcademicDocument({
            workType: "bmi",
            userId: user.id,
            userPlan: sub.plan,
            topic,
            specialty,
            pageCount: pageCountStr,
            studentName: user.name || undefined,
            taskId,
            telegramId: tgId,
            releaseLockOnExit: false,
          });

          if (res.success) {
            await handleInitialDocSuccess(
              ctx,
              user.id,
              tgId,
              res,
              {
                workType: "bmi",
                topic,
                specialty,
                length: `${pageCountStr} bet`,
              },
              taskId
            );
            const finalTask = await getAcademicTask(taskId);
            if (finalTask?.status === "COMPLETED") {
              taskCompleted = true;
            }
          } else {
            await failAcademicTask(
              taskId,
              res.error || "BMI generatsiyasi muvaffaqiyatsiz bo'ldi."
            );
            await ctx.reply(
              `❌ ${res.error || "BMI yaratishda xatolik yuz berdi. Iltimos qaytadan urinib ko'ring."}`
            );
          }
        } catch (err: unknown) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          await failAcademicTask(taskId, errorMsg);
          await ctx.reply("❌ BMI yaratishda kutilmagan xatolik yuz berdi.");
        } finally {
          if (!taskCompleted) {
            try {
              await failAcademicTask(taskId, "Jarayon to'xtatildi yoki uzildi");
            } catch {}
          }
          await releaseUserLock(tgId, taskId);
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
          .text("15 ta slayd", "pres_slides_15")
          .row()
          .text("20 ta slayd", "pres_slides_20")
          .text("30 ta slayd", "pres_slides_30")
          .text("50 ta slayd", "pres_slides_50")
          .row()
          .text("❌ Bekor qilish", "wiz_cancel");

        await ctx.reply(
          "📊 Taqdimot uchun kerakli *slaydlar sonini* tanlang yoki *o'zingiz xohlagan slayd sonini* yozib yuboring:",
          {
            reply_markup: kb,
            parse_mode: "Markdown",
          }
        );
        return;
      }

      if (session.step === "slidesCount") {
        const parsedSlides = Math.min(
          100,
          Math.max(3, parseInt(text.replace(/\D/g, ""), 10) || 10)
        );
        const lock = await acquireUserLock(tgId);
        if (!lock.acquired) return;
        const taskId = lock.jobId!;
        let taskCompleted = false;

        try {
          await createAcademicTask({
            taskId,
            telegramId: tgId,
            userId: user.id,
            workType: "presentation",
            topic: session.topic || "Taqdimot",
          });

          await ctx.reply(
            `⏳ *Taqdimot slaydlari tayyorlanmoqda...*\n\n` +
              `📌 *Mavzu:* ${session.topic}\n` +
              `📑 *Slaydlar:* ${parsedSlides} ta\n\n` +
              `🤖 _Gemini AI slaydlar matni va ma'ruzachi nutqini shakllantirmoqda..._`,
            { parse_mode: "Markdown" }
          );

          await updateAcademicTaskStage(taskId, "GEMINI_GEN");

          const res = await generateAcademicDocument({
            workType: "presentation",
            userId: user.id,
            userPlan: sub.plan,
            topic: session.topic || "Taqdimot",
            slidesCount: parsedSlides,
            taskId,
            telegramId: tgId,
            releaseLockOnExit: false,
          });

          if (res.success) {
            await handleInitialDocSuccess(
              ctx,
              user.id,
              tgId,
              res,
              {
                workType: "presentation",
                topic: session.topic || "Taqdimot",
                slidesCount: parsedSlides,
              },
              taskId
            );
            const finalTask = await getAcademicTask(taskId);
            if (finalTask?.status === "COMPLETED") {
              taskCompleted = true;
            }
          } else {
            await failAcademicTask(taskId, res.error || "Xatolik");
            await ctx.reply(`❌ ${res.error || "Taqdimot yaratishda xatolik yuz berdi."}`);
          }
        } catch (err) {
          await failAcademicTask(taskId, err instanceof Error ? err.message : String(err));
          await ctx.reply("❌ Taqdimot yaratishda kutilmagan xatolik yuz berdi.");
        } finally {
          if (!taskCompleted) {
            try {
              await failAcademicTask(taskId, "Jarayon to'xtatildi yoki uzildi");
            } catch {}
          }
          await releaseUserLock(tgId, taskId);
        }
        return;
      }
    }

    // 5. Essay flow
    if (session.type === "essay") {
      const lock = await acquireUserLock(tgId);
      if (!lock.acquired) {
        console.warn(
          `[PARALLEL_RETRY_SUPPRESSED] Essay generation already running for tgId ${tgId}`
        );
        return;
      }

      const taskId = lock.jobId!;
      let taskCompleted = false;

      try {
        const topic = text;
        await createAcademicTask({
          taskId,
          telegramId: tgId,
          userId: user.id,
          workType: "essay",
          topic,
        });

        await ctx.reply(
          `⏳ *Insho / Esse yozilmoqda...*\n\n📌 *Mavzu:* ${topic}\n\n🤖 _Gemini AI chuqur falsafiy va adabiy kompozitsiya tayyorlamoqda..._`,
          { parse_mode: "Markdown" }
        );

        await updateAcademicTaskStage(taskId, "GEMINI_GEN");

        const res = await generateAcademicDocument({
          workType: "essay",
          userId: user.id,
          userPlan: sub.plan,
          topic,
          taskId,
          telegramId: tgId,
          releaseLockOnExit: false,
        });

        if (res.success) {
          await handleInitialDocSuccess(
            ctx,
            user.id,
            tgId,
            res,
            {
              workType: "essay",
              topic,
            },
            taskId
          );
          const finalTask = await getAcademicTask(taskId);
          if (finalTask?.status === "COMPLETED") {
            taskCompleted = true;
          }
        } else {
          await failAcademicTask(taskId, res.error || "Esse generatsiyasi muvaffaqiyatsiz bo'ldi.");
          await ctx.reply(
            `❌ ${res.error || "Esse yaratishda xatolik yuz berdi. Iltimos qaytadan urinib ko'ring."}`
          );
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error("[TELEGRAM_ESSAY_ERR]", err);
        await failAcademicTask(taskId, errorMsg);
        await ctx.reply(
          "❌ Esse yaratishda kutilmagan xatolik yuz berdi. Iltimos qaytadan urinib ko'ring."
        );
      } finally {
        if (!taskCompleted) {
          try {
            await failAcademicTask(taskId, "Jarayon to'xtatildi yoki uzildi");
          } catch (e) {
            console.error("[FINALLY_FAIL_TASK_ERR]", e);
          }
        }
        await releaseUserLock(tgId, taskId);
      }
      return;
    }

    // 6. Exam flow
    if (session.type === "exam") {
      const lock = await acquireUserLock(tgId);
      if (!lock.acquired) {
        console.warn(
          `[PARALLEL_RETRY_SUPPRESSED] Exam generation already running for tgId ${tgId}`
        );
        return;
      }

      const taskId = lock.jobId!;
      let taskCompleted = false;

      try {
        const topic = text;
        await createAcademicTask({
          taskId,
          telegramId: tgId,
          userId: user.id,
          workType: "exam",
          topic,
        });

        await ctx.reply(
          `⏳ *Imtihon biletlari va konspekt tayyorlanmoqda...*\n\n📌 *Fan / Mavzular:* ${topic}\n\n🤖 _10 ta asosiy imtihon savoli va yechimlari tuzilmoqda..._`,
          { parse_mode: "Markdown" }
        );

        await updateAcademicTaskStage(taskId, "GEMINI_GEN");

        const res = await generateAcademicDocument({
          workType: "exam",
          userId: user.id,
          userPlan: sub.plan,
          topic,
          taskId,
          telegramId: tgId,
          releaseLockOnExit: false,
        });

        if (res.success) {
          await handleInitialDocSuccess(
            ctx,
            user.id,
            tgId,
            res,
            {
              workType: "exam",
              topic,
            },
            taskId
          );
          const finalTask = await getAcademicTask(taskId);
          if (finalTask?.status === "COMPLETED") {
            taskCompleted = true;
          }
        } else {
          await failAcademicTask(
            taskId,
            res.error || "Imtihon materiallari generatsiyasi muvaffaqiyatsiz bo'ldi."
          );
          await ctx.reply(
            `❌ ${res.error || "Imtihon materiallarini tayyorlashda xatolik yuz berdi. Iltimos qaytadan urinib ko'ring."}`
          );
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error("[TELEGRAM_EXAM_ERR]", err);
        await failAcademicTask(taskId, errorMsg);
        await ctx.reply(
          "❌ Imtihon materiallarini tayyorlashda kutilmagan xatolik yuz berdi. Iltimos qaytadan urinib ko'ring."
        );
      } finally {
        if (!taskCompleted) {
          try {
            await failAcademicTask(taskId, "Jarayon to'xtatildi yoki uzildi");
          } catch (e) {
            console.error("[FINALLY_FAIL_TASK_ERR]", e);
          }
        }
        await releaseUserLock(tgId, taskId);
      }
      return;
    }
  });

  // Callback for resending already-created document if Telegram delivery failed
  docnovaAiBot.callbackQuery(/^tg_resend_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery({ text: "Fayl yuklanmoqda..." });
    if (!ctx.from) return;
    const docId = ctx.match[1];
    const user = await getLinkedUser(ctx.from.id);
    if (!user) {
      await ctx.reply("Sessiya topilmadi. /start buyrug'ini bosing.");
      return;
    }

    // 1. Debounce guard: prevent concurrent duplicate taps without sending warning message
    const lock = await acquireUserLock(ctx.from.id, 20);
    if (!lock.acquired) {
      return;
    }

    try {
      // 2. Multi-tenant ownership check (userId: user.id enforced in DB)
      const snapshot = await getDocumentVersionData({
        docId,
        userId: user.id,
        version: 1,
      });

      if (!snapshot) {
        await ctx.reply("❌ Hujjat ma'lumotlari topilmadi yoki bu hujjat sizga tegishli emas.");
        return;
      }

      const buffer = generateWordDocumentBuffer({
        title: snapshot.topic,
        bodyContent: snapshot.markdown,
        workType: snapshot.workType,
        subject: snapshot.subject,
      });

      // 3. Remove inline button so user cannot re-trigger duplicate delivery
      try {
        await ctx.editMessageReplyMarkup({ reply_markup: undefined });
      } catch {
        // Safe to ignore if already edited or deleted
      }

      // 4. Send document with safe Markdown error fallback
      try {
        await ctx.replyWithDocument(new InputFile(buffer, snapshot.fileName || "Hujjat.doc"), {
          caption: `📄 *${snapshot.topic}*\nFormat: Microsoft Word (.doc)`,
          parse_mode: "Markdown",
        });
      } catch {
        await ctx.replyWithDocument(new InputFile(buffer, snapshot.fileName || "Hujjat.doc"), {
          caption: `Hujjat: ${snapshot.topic}\nFormat: Microsoft Word (.doc)`,
        });
      }

      await ctx.reply(
        `✅ *Hujjat muvaffaqiyatli yetkazildi!*\n\n` +
          `Siz ushbu hujjatni tahrirlashingiz, reja o'zgartirishingiz yoki yangi bo'lim qo'shishingiz mumkin.`,
        {
          parse_mode: "Markdown",
          reply_markup: new InlineKeyboard()
            .text("✏️ Qayta tahrirlash", `edit_custom_${docId}`)
            .row()
            .text("➕ Yangi bo'lim", `edit_addsec_${docId}`)
            .text("✅ Qabul qilish", `edit_accept_${docId}`),
        }
      );
    } catch (err) {
      console.error("[TG_RESEND_ERR]", err);
      await ctx.reply("❌ Faylni qayta yuborishda xatolik yuz berdi.");
    } finally {
      await releaseUserLock(ctx.from.id, lock.jobId!);
    }
  });
}

const webhookSecret = process.env.DOCNOVA_AI_BOT_SECRET;

const baseWebhookHandler =
  docnovaAiBot && webhookSecret
    ? webhookCallback(docnovaAiBot, "std/http", {
        secretToken: webhookSecret,
        timeoutMilliseconds: 55_000,
        onTimeout: "return",
      })
    : null;

export async function POST(req: Request): Promise<Response> {
  if (!docnovaAiBot || !webhookSecret || !baseWebhookHandler) {
    return new Response("DocNova AI Bot or Webhook Secret is not configured securely.", {
      status: 500,
    });
  }

  // 1. Secret token header verification
  const headerSecret = req.headers.get("x-telegram-bot-api-secret-token");
  if (headerSecret !== webhookSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 2. Webhook Idempotency Check: intercept update_id to prevent duplicate execution from Telegram retries
  let updateId: number | string | undefined;
  let rawBodyText = "";
  try {
    rawBodyText = await req.text();
    if (rawBodyText) {
      const parsedBody = JSON.parse(rawBodyText);
      updateId = parsedBody?.update_id;
    }
  } catch (err) {
    console.error("[WEBHOOK_BODY_PARSE_ERR]", err);
  }

  let updatePersisted = false;
  if (updateId !== undefined && updateId !== null) {
    const claim = await claimTelegramUpdate(updateId);
    updatePersisted = claim.persisted;
    if (!claim.canProcess) {
      console.warn(
        `[WEBHOOK_IDEMPOTENT_SKIP] Duplicate update_id ${updateId} (${claim.status}) ignored.`
      );
      // Return HTTP 200 OK immediately so Telegram stops resending this update
      return new Response(
        JSON.stringify({ ok: true, note: `duplicate_update_ignored_${claim.status}` }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  // 3. Reconstruct Request with the consumed body text so Grammy std/http can process it
  const newReq = new Request(req.url, {
    method: req.method,
    headers: req.headers,
    body: rawBodyText || undefined,
  });

  try {
    const res = await baseWebhookHandler(newReq);
    if (updateId !== undefined && updateId !== null) {
      if (res.status >= 200 && res.status < 400) {
        await markTelegramUpdateSuccess(updateId);
      } else {
        await markTelegramUpdateFailed(updateId);
      }
    }
    return res;
  } catch (err) {
    console.error("[WEBHOOK_POST_ERR]", err);
    if (updateId !== undefined && updateId !== null) {
      await markTelegramUpdateFailed(updateId);
    }
    // If the update was NEVER reliably persisted in DB (e.g. DB outage), return 503
    // so Telegram's retry mechanism safely redelivers the update when DB is healthy
    if (!updatePersisted) {
      console.error(
        "[WEBHOOK_UNPERSISTED_FAIL] Update was not persisted in DB; requesting Telegram retry via HTTP 503"
      );
      return new Response(
        JSON.stringify({ ok: false, error: "Database unavailable, retry requested" }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    // Return HTTP 200 OK with error payload if update was claimed and recorded, preventing duplicate retry loops
    return new Response(
      JSON.stringify({ ok: false, error: "Internal processing error handled safely" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
