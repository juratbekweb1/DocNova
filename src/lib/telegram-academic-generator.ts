import { generateGeminiContent, generateGeminiJson } from "@/lib/gemini";
import { checkUserLimit, deductUserAiCredit, trackAIUsage } from "@/lib/limits";
import { generateWordDocumentBuffer } from "@/lib/telegram-docnova-ai";
import {
  generateAcademicPages,
  CourseworkAiChapters,
  CourseworkData,
} from "@/app/api/generate-coursework/route";
import {
  parseDocumentSections,
  replaceDocumentSection,
  SectionKey,
} from "@/lib/telegram-doc-manager";
import {
  acquireUserLock,
  createAcademicTask,
  updateAcademicTaskStage,
  failAcademicTask,
  releaseUserLock,
} from "@/lib/telegram-lock";

export interface AcademicGenResult {
  success: boolean;
  docBuffer?: Buffer;
  fileName?: string;
  summaryText?: string;
  markdownContent?: string;
  error?: string;
  requireUpgrade?: boolean;
}

async function generateMultiPageAcademicMarkdown(params: {
  topic: string;
  subject: string;
  studentName: string;
  pageCount: number;
  workTypeTitle: string;
  language?: "uz" | "ru";
}): Promise<{
  markdown: string;
  pagesCount: number;
  modelUsed: string;
  inputTokens: number;
  outputTokens: number;
}> {
  const { topic, subject, studentName, pageCount, workTypeTitle, language = "uz" } = params;
  const targetPages = Math.max(5, Math.min(500, pageCount || 25));

  const chapterPrompt = `Siz O'zbekiston Respublikasi Oliy ta'lim, fan va innovatsiyalar vazirligi (MOVSO RUz) standartlariga to'liq javob beradigan yetakchi professor va ilmiy ekspertsiz.
Quyidagi parametrlar bo'yicha "${workTypeTitle}" uchun Kirish, 3 ta bobning barcha fasllari (1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3), qiyosiy tahliliy jadval, Xulosa va 15 ta GOST adabiyotlardan iborat chuqur ilmiy matnni JSON formatida tayyorlang:
- Fan / Yo'nalish: "${subject}"
- Mavzu: "${topic}"
- Kutilayotgan hajm: ${targetPages} bet
- Til: "${language}"

QAT'IY TALABLAR:
1. Barcha bo'limlar FAQAT VA FAQAT «${topic}» mavzusiga 100% bog'langan bo'lsin.
2. Har bir bo'limda (sub1_1, sub1_2, sub1_3, sub2_1, sub2_2, sub2_3, sub3_1, sub3_2, sub3_3) kamida 2-3 ta to'liq, mukammal ilmiy abzas yozilsin (hech qachon jumlani yarim so'zda uzib qo'ymang!).
3. sub2_table obyektida 5 ustunli va kamida 4 qatorli qiyosiy tahliliy jadval bo'lsin.
4. Javobni FAQAT quyidagi JSON formatida qaytaring:
{
  "kirishContent": "...",
  "sub1_1": "...",
  "sub1_2": "...",
  "sub1_3": "...",
  "sub2_1": "...",
  "sub2_table": {
    "title": "...",
    "headers": ["№", "Ko'rsatkich / Mezon", "An'anaviy holat", "Zamonaviy yondashuv", "Amaliy samara"],
    "rows": [["1", "...", "...", "...", "..."]],
    "sourceNote": "Manba: Tadqiqot asosida shakllantirildi."
  },
  "sub2_2": "...",
  "sub2_3": "...",
  "sub3_1": "...",
  "sub3_2": "...",
  "sub3_3": "...",
  "xulosaContent": "...",
  "references": ["1. ...", "2. ..."]
}`;

  let aiChapters: CourseworkAiChapters | undefined;
  let modelUsed = "docnova-academic-engine";
  let inputTokens = Math.ceil(chapterPrompt.length / 4);
  let outputTokens = 0;

  try {
    const geminiRes = await generateGeminiJson<CourseworkAiChapters>(chapterPrompt, {
      systemInstruction:
        "Siz O'zbekiston OTMlarining yetakchi ilmiy professori va metodistisiz. Matnni faqat kiritilgan mavzuga 100% bog'langan holda, tugallangan ilmiy abzaslar bilan JSON formatida qaytaring.",
      temperature: 0.2,
      maxOutputTokens: 8192,
      timeoutMs: 22_000,
    });

    if (
      geminiRes.data &&
      (geminiRes.data.kirishContent || geminiRes.data.sub1_1 || geminiRes.data.chapter1Content)
    ) {
      aiChapters = geminiRes.data;
      modelUsed = geminiRes.modelUsed;
      inputTokens = geminiRes.usage.promptTokenCount;
      outputTokens = geminiRes.usage.candidatesTokenCount;
    }
  } catch (aiErr) {
    console.warn("[TELEGRAM_MULTI_PAGE_AI_FALLBACK]", aiErr);
  }

  const courseworkData: CourseworkData = {
    subject,
    topic,
    studentName,
    year: new Date().getFullYear().toString(),
    pageCount: String(targetPages),
    language,
    workTypeTitle,
  };

  const pages = generateAcademicPages(courseworkData, aiChapters);
  const fullMarkdown = pages.map((p) => p.content).join("\n\n---\n\n");

  if (outputTokens === 0) {
    outputTokens = Math.ceil(fullMarkdown.length / 4);
  }

  return {
    markdown: fullMarkdown,
    pagesCount: pages.length,
    modelUsed,
    inputTokens,
    outputTokens,
  };
}

/**
 * 1. Kurs ishi generatsiyasi
 */
export async function generateCourseworkDoc(params: {
  userId: string;
  userPlan: string;
  topic: string;
  subject?: string;
  studentName?: string;
  pageCount?: string;
}): Promise<AcademicGenResult> {
  const startTime = Date.now();
  const limitCheck = await checkUserLimit(params.userId, "coursework");
  if (!limitCheck.allowed) {
    return {
      success: false,
      error: limitCheck.error || "Ushbu oy uchun kurs ishi limitingiz tugadi.",
      requireUpgrade: true,
    };
  }

  const currentYear = new Date().getFullYear();
  const subjectName = params.subject || "Umumkasbiy va mutaxassislik fanlari";
  const authorName = params.studentName || "DocNova talabasi";
  const parsedPages = Math.max(10, Math.min(300, parseInt(params.pageCount || "25", 10) || 25));

  try {
    const gen = await generateMultiPageAcademicMarkdown({
      topic: params.topic,
      subject: subjectName,
      studentName: authorName,
      pageCount: parsedPages,
      workTypeTitle: "KURS ISHI",
      language: "uz",
    });

    const content = gen.markdown.trim();
    if (!content || content.length < 500) {
      throw new Error("AI tomonidan yaratilgan matn yetarli hajmda emas");
    }

    await deductUserAiCredit(params.userId);
    await trackAIUsage({
      userId: params.userId,
      plan: params.userPlan,
      feature: "COURSEWORK",
      model: gen.modelUsed,
      status: "SUCCESS",
      inputTokens: gen.inputTokens,
      outputTokens: gen.outputTokens,
      requestDurationMs: Date.now() - startTime,
    });

    const buffer = generateWordDocumentBuffer({
      title: `Kurs_Ishi_${params.topic.slice(0, 30)}`,
      bodyContent: content,
      workType: "Kurs ishi",
      subject: subjectName,
      studentName: authorName,
      year: currentYear,
    });

    if (!Buffer.isBuffer(buffer) || buffer.length < 500) {
      throw new Error("Word hujjat buferi yaratilmadi yoki hajm yetarli emas");
    }

    const safeTopic = params.topic.replace(/[^a-zA-Z0-9\u0400-\u04FF]/g, "_").slice(0, 30);
    const fileName = `Kurs_Ishi_${safeTopic}_${gen.pagesCount}bet_DocNova.doc`;

    return {
      success: true,
      docBuffer: buffer,
      fileName,
      markdownContent: content,
      summaryText: `📘 *Kurs ishi muvaffaqiyatli tayyorlandi!*\n\n📌 *Mavzu:* ${params.topic}\n📚 *Fan:* ${subjectName}\n📏 *Hajm:* ${gen.pagesCount} bet (to'liq sahifalangan)\n📄 *Format:* Microsoft Word (.doc)\n🏛 *Standart:* MOVSO RUz / GOST\n⏱ *Vaqt:* ${Math.round((Date.now() - startTime) / 1000)} soniya`,
    };
  } catch (err) {
    console.error("[TELEGRAM_COURSEWORK_GEN_ERR]", err);
    return {
      success: false,
      error: "Kurs ishini generatsiya qilishda xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.",
    };
  }
}

/**
 * 2. Referat va Mustaqil ish generatsiyasi
 */
export async function generateReferatDoc(params: {
  userId: string;
  userPlan: string;
  topic: string;
  subject?: string;
  lengthOption?: "short" | "standard" | "extended" | string;
  pageCount?: string;
  language?: "uz" | "ru";
  studentName?: string;
}): Promise<AcademicGenResult> {
  const startTime = Date.now();
  const limitCheck = await checkUserLimit(params.userId, "coursework");
  if (!limitCheck.allowed) {
    return {
      success: false,
      error: limitCheck.error || "Ushbu oy uchun referat limitingiz tugadi.",
      requireUpgrade: true,
    };
  }

  const currentYear = new Date().getFullYear();
  const subjectName = params.subject || "Umumta'lim fanlari";
  const authorName = params.studentName || "DocNova talabasi";
  const isRu = params.language === "ru";

  let targetPages = 10;
  if (params.pageCount) {
    targetPages = Math.max(5, Math.min(300, parseInt(params.pageCount, 10) || 10));
  } else if (params.lengthOption === "short") {
    targetPages = 6;
  } else if (params.lengthOption === "standard") {
    targetPages = 10;
  } else if (params.lengthOption === "extended") {
    targetPages = 15;
  } else if (params.lengthOption) {
    const parsed = parseInt(params.lengthOption, 10);
    if (!isNaN(parsed) && parsed > 0) {
      targetPages = Math.max(5, Math.min(300, parsed));
    }
  }

  try {
    const gen = await generateMultiPageAcademicMarkdown({
      topic: params.topic,
      subject: subjectName,
      studentName: authorName,
      pageCount: targetPages,
      workTypeTitle: isRu ? "РЕФЕРАТ / САМОСТОЯТЕЛЬНАЯ РАБОТА" : "MUSTAQIL ISH VA REFERAT",
      language: isRu ? "ru" : "uz",
    });

    const content = gen.markdown.trim();
    if (!content || content.length < 400) {
      throw new Error("AI tomonidan yaratilgan matn yetarli hajmda emas");
    }

    await deductUserAiCredit(params.userId);
    await trackAIUsage({
      userId: params.userId,
      plan: params.userPlan,
      feature: "REFERAT",
      model: gen.modelUsed,
      status: "SUCCESS",
      inputTokens: gen.inputTokens,
      outputTokens: gen.outputTokens,
      requestDurationMs: Date.now() - startTime,
    });

    const buffer = generateWordDocumentBuffer({
      title: `Referat_${params.topic.slice(0, 30)}`,
      bodyContent: content,
      workType: "Referat / Mustaqil ish",
      subject: subjectName,
      studentName: authorName,
      year: currentYear,
    });

    if (!Buffer.isBuffer(buffer) || buffer.length < 500) {
      throw new Error("Word hujjat buferi yaratilmadi yoki hajm yetarli emas");
    }

    const safeTopic = params.topic.replace(/[^a-zA-Z0-9\u0400-\u04FF]/g, "_").slice(0, 30);
    const fileName = `Referat_${safeTopic}_${gen.pagesCount}bet_DocNova.doc`;

    return {
      success: true,
      docBuffer: buffer,
      fileName,
      markdownContent: content,
      summaryText: `📑 *Referat / Mustaqil ish tayyorlandi!*\n\n📌 *Mavzu:* ${params.topic}\n📚 *Fan:* ${subjectName}\n📏 *Hajm:* ${gen.pagesCount} bet (to'liq sahifalangan)\n📄 *Format:* Microsoft Word (.doc)\n🏛 *Standart:* MOVSO RUz / GOST\n⏱ *Vaqt:* ${Math.round((Date.now() - startTime) / 1000)} soniya`,
    };
  } catch (err) {
    console.error("[TELEGRAM_REFERAT_GEN_ERR]", err);
    return {
      success: false,
      error: "Referatni generatsiya qilishda xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.",
    };
  }
}

/**
 * 3. BMI / Diplom ishi generatsiyasi
 */
export async function generateBmiDoc(params: {
  userId: string;
  userPlan: string;
  topic: string;
  specialty?: string;
  studentName?: string;
  pageCount?: string;
}): Promise<AcademicGenResult> {
  const startTime = Date.now();
  const limitCheck = await checkUserLimit(params.userId, "coursework");
  if (!limitCheck.allowed) {
    return {
      success: false,
      error: limitCheck.error || "Ushbu oy uchun BMI limitingiz tugadi.",
      requireUpgrade: true,
    };
  }

  const currentYear = new Date().getFullYear();
  const specialtyName = params.specialty || "Axborot texnologiyalari va iqtisodiyot";
  const authorName = params.studentName || "Bitiruvchi talaba";
  const parsedPages = Math.max(20, Math.min(350, parseInt(params.pageCount || "70", 10) || 70));

  try {
    const gen = await generateMultiPageAcademicMarkdown({
      topic: params.topic,
      subject: specialtyName,
      studentName: authorName,
      pageCount: parsedPages,
      workTypeTitle: "BITIRUV MALAKAVIY ISHI (BMI)",
      language: "uz",
    });

    const content = gen.markdown.trim();
    if (!content || content.length < 600) {
      throw new Error("AI tomonidan yaratilgan matn yetarli hajmda emas");
    }

    await deductUserAiCredit(params.userId);
    await trackAIUsage({
      userId: params.userId,
      plan: params.userPlan,
      feature: "BMI_DIPLOM",
      model: gen.modelUsed,
      status: "SUCCESS",
      inputTokens: gen.inputTokens,
      outputTokens: gen.outputTokens,
      requestDurationMs: Date.now() - startTime,
    });

    const buffer = generateWordDocumentBuffer({
      title: `BMI_${params.topic.slice(0, 30)}`,
      bodyContent: content,
      workType: "Bitiruv Malakaviy Ishi (BMI)",
      subject: specialtyName,
      studentName: authorName,
      year: currentYear,
    });

    if (!Buffer.isBuffer(buffer) || buffer.length < 500) {
      throw new Error("Word hujjat buferi yaratilmadi yoki hajm yetarli emas");
    }

    const safeTopic = params.topic.replace(/[^a-zA-Z0-9\u0400-\u04FF]/g, "_").slice(0, 30);
    const fileName = `BMI_${safeTopic}_${gen.pagesCount}bet_DocNova.doc`;

    return {
      success: true,
      docBuffer: buffer,
      fileName,
      markdownContent: content,
      summaryText: `🎓 *Bitiruv malakaviy ishi (BMI) tayyorlandi!*\n\n📌 *Mavzu:* ${params.topic}\n🏛 *Yo'nalish:* ${specialtyName}\n📏 *Hajm:* ${gen.pagesCount} bet (to'liq sahifalangan)\n📄 *Format:* Microsoft Word (.doc)\n📚 *Tarkib:* Titul, Mundarija, Kirish, 3 ta Bob, Jadval, Xulosa, Adabiyotlar\n⏱ *Vaqt:* ${Math.round((Date.now() - startTime) / 1000)} soniya`,
    };
  } catch (err) {
    console.error("[TELEGRAM_BMI_GEN_ERR]", err);
    return {
      success: false,
      error: "BMI generatsiyasida xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.",
    };
  }
}

/**
 * 4. Taqdimot / Prezentatsiya generatsiyasi
 */
export async function generatePresentationDoc(params: {
  userId: string;
  userPlan: string;
  topic: string;
  slidesCount?: number;
}): Promise<AcademicGenResult> {
  const startTime = Date.now();
  const limitCheck = await checkUserLimit(params.userId, "presentation");
  if (!limitCheck.allowed) {
    return {
      success: false,
      error: limitCheck.error || "Ushbu oy uchun taqdimot limitingiz tugadi.",
      requireUpgrade: true,
    };
  }

  const count = params.slidesCount || 10;
  const prompt = `Quyidagi mavzu bo'yicha ${count} ta slayddan iborat mukammal akademik/biznes taqdimot (prezentatsiya) tayyorlang:
Mavzu: "${params.topic}"

Har bir slayd uchun quyidagilarni bering:
1. Slayd raqami va sarlavhasi
2. Asosiy mazmun (3-5 ta punktda)
3. Ma'ruzachi nutqi (Speaker Notes - talaba auditoriya oldida nima deyishi kerakligi)
4. Slayd uchun tavsiya etilgan vizual element / diagramma turi

Slaydlar ketma-ketligi:
- 1-slayd: Titul
- 2-slayd: Mavzuning dolzarbligi va muammo
- 3-slayd: Tadqiqot maqsadi va vazifalari
- 4 dan ${count - 2}-slaydgacha: Asosiy nazariy, tahliliy va statistik natijalar
- ${count - 1}-slayd: Xulosa va amaliy tavsiyalar
- ${count}-slayd: E'tiboringiz uchun rahmat va savol-javob

Format: Markdown ko'rinishida aniq sarlavhalar bilan yozing.`;

  try {
    const res = await generateGeminiContent(prompt, {
      systemInstruction: "Siz professional taqdimotlar va spikerlik bo'yicha mutaxassissiz.",
      temperature: 0.3,
      maxOutputTokens: 6000,
    });

    const content = res.text.trim();
    await deductUserAiCredit(params.userId);
    await trackAIUsage({
      userId: params.userId,
      plan: params.userPlan,
      feature: "PRESENTATION",
      model: res.modelUsed,
      status: "SUCCESS",
      inputTokens: res.usage.promptTokenCount,
      outputTokens: res.usage.candidatesTokenCount,
      requestDurationMs: Date.now() - startTime,
    });

    const buffer = generateWordDocumentBuffer({
      title: `Taqdimot_${params.topic.slice(0, 30)}`,
      bodyContent: content,
      workType: "Taqdimot va Ma'ruza Matni",
    });

    const safeTopic = params.topic.replace(/[^a-zA-Z0-9\u0400-\u04FF]/g, "_").slice(0, 30);
    const fileName = `Taqdimot_${safeTopic}_DocNova.doc`;

    return {
      success: true,
      docBuffer: buffer,
      fileName,
      markdownContent: content,
      summaryText: `📊 *Taqdimot (slaydlar) muvaffaqiyatli tayyorlandi!*\n\n📌 *Mavzu:* ${params.topic}\n📑 *Slaydlar soni:* ${count} ta\n🎙 *Tarkib:* Har bir slayd mazmuni + Spiker nutqi (Speaker Notes)\n📄 *Format:* Microsoft Word (.doc)\n⏱ *Vaqt:* ${Math.round((Date.now() - startTime) / 1000)} soniya`,
    };
  } catch (err) {
    console.error("[TELEGRAM_PRES_GEN_ERR]", err);
    return {
      success: false,
      error: "Taqdimotni tayyorlashda xatolik yuz berdi.",
    };
  }
}

/**
 * 5. Insho / Esse generatsiyasi
 */
export async function generateEssayDoc(params: {
  userId: string;
  userPlan: string;
  topic: string;
}): Promise<AcademicGenResult> {
  const startTime = Date.now();
  const limitCheck = await checkUserLimit(params.userId, "rewrite");
  if (!limitCheck.allowed) {
    return {
      success: false,
      error: limitCheck.error || "Ushbu oy uchun insho/esse limitingiz tugadi.",
      requireUpgrade: true,
    };
  }

  const prompt = `Quyidagi mavzu bo'yicha chuqur falsafiy, ilmiy va adabiy jihatdan mukammal INSHO / ESSE yozib bering:
Mavzu: "${params.topic}"

Tarkib:
1. Reja
2. Epigraf (mos maqol yoki donishmandlar so'zi)
3. Kirish (mavzuning tub ma'nosi va dolzarbligi)
4. Asosiy fikr va dalillar (hayotiy va tarixiy misollar, falsafiy qarashlar)
5. Qarama-qarshi fikrlar tahlili
6. Xulosa (shaxsiy nuqtai nazar va umumlashtirish)

Format: Markdown formatida ravon va jozibali o'zbek tilida yozing.`;

  try {
    const res = await generateGeminiContent(prompt, {
      systemInstruction: "Siz ijodiy va ilmiy esselar bo'yicha usta adib va ustozsiz.",
      temperature: 0.4,
      maxOutputTokens: 4000,
    });

    const content = res.text.trim();
    await deductUserAiCredit(params.userId);
    await trackAIUsage({
      userId: params.userId,
      plan: params.userPlan,
      feature: "REWRITE",
      model: res.modelUsed,
      status: "SUCCESS",
      inputTokens: res.usage.promptTokenCount,
      outputTokens: res.usage.candidatesTokenCount,
      requestDurationMs: Date.now() - startTime,
    });

    const buffer = generateWordDocumentBuffer({
      title: `Insho_${params.topic.slice(0, 30)}`,
      bodyContent: content,
      workType: "Insho / Esse",
    });

    const safeTopic = params.topic.replace(/[^a-zA-Z0-9\u0400-\u04FF]/g, "_").slice(0, 30);
    const fileName = `Insho_${safeTopic}_DocNova.doc`;

    return {
      success: true,
      docBuffer: buffer,
      fileName,
      markdownContent: content,
      summaryText: `✍️ *Insho / Esse muvaffaqiyatli tayyorlandi!*\n\n📌 *Mavzu:* ${params.topic}\n📄 *Format:* Microsoft Word (.doc)\n⏱ *Vaqt:* ${Math.round((Date.now() - startTime) / 1000)} soniya`,
    };
  } catch (err) {
    console.error("[TELEGRAM_ESSAY_GEN_ERR]", err);
    return {
      success: false,
      error: "Insho tayyorlashda xatolik yuz berdi.",
    };
  }
}

/**
 * 6. Imtihon biletlari va testlarga tayyorgarlik
 */
export async function generateExamDoc(params: {
  userId: string;
  userPlan: string;
  topic: string;
}): Promise<AcademicGenResult> {
  const startTime = Date.now();
  const limitCheck = await checkUserLimit(params.userId, "coursework");
  if (!limitCheck.allowed) {
    return {
      success: false,
      error: limitCheck.error || "Ushbu oy uchun imtihon tayyorgarligi limitingiz tugadi.",
      requireUpgrade: true,
    };
  }

  const prompt = `Quyidagi fan yoki mavzular doirasida universitet talabalari yakuniy davlat / semestr imtihoniga tayyorlanishi uchun 10 ta eng muhim imtihon savolini va ularning har biri bo'yicha to'liq, mukammal, ilmiy asoslangan javobini (konspekt) tayyorlab bering:
Mavzu / Fan: "${params.topic}"

Har bir bilet savoli uchun:
- Bilet savolining aniq shakli
- Savolning qisqa lo'nda javobi (tezkor yodlash uchun)
- Savolning batafsil ilmiy bayoni, formulalari, ta'riflari va qonuniyatlari
- Amaliy misol yoki masalasi (agar fan xususiyatiga to'g'ri kelsa)

Format: Markdown ko'rinishida yozing.`;

  try {
    const res = await generateGeminiContent(prompt, {
      systemInstruction:
        "Siz imtihon komissiyasi a'zosi va universitet professori sifatida to'liq va aniq javoblar tayyorlaysiz.",
      temperature: 0.25,
      maxOutputTokens: 8192,
    });

    const content = res.text.trim();
    await deductUserAiCredit(params.userId);
    await trackAIUsage({
      userId: params.userId,
      plan: params.userPlan,
      feature: "EXAM_PREP",
      model: res.modelUsed,
      status: "SUCCESS",
      inputTokens: res.usage.promptTokenCount,
      outputTokens: res.usage.candidatesTokenCount,
      requestDurationMs: Date.now() - startTime,
    });

    const buffer = generateWordDocumentBuffer({
      title: `Imtihon_Biletlari_${params.topic.slice(0, 30)}`,
      bodyContent: content,
      workType: "Imtihon biletlari va konspekt",
    });

    const safeTopic = params.topic.replace(/[^a-zA-Z0-9\u0400-\u04FF]/g, "_").slice(0, 30);
    const fileName = `Imtihon_${safeTopic}_DocNova.doc`;

    return {
      success: true,
      docBuffer: buffer,
      fileName,
      markdownContent: content,
      summaryText: `📝 *Imtihon biletlari va yechimlari tayyorlandi!*\n\n📌 *Fan / Mavzu:* ${params.topic}\n📚 *Tarkib:* 10 ta asosiy bilet savoli va batafsil javoblar\n📄 *Format:* Microsoft Word (.doc)\n⏱ *Vaqt:* ${Math.round((Date.now() - startTime) / 1000)} soniya`,
    };
  } catch (err) {
    console.error("[TELEGRAM_EXAM_GEN_ERR]", err);
    return {
      success: false,
      error: "Imtihon materiallarini tayyorlashda xatolik yuz berdi.",
    };
  }
}

/**
 * Section 9.B: Rewrite entire document based on user's custom instruction / quick suggestion
 */
export async function rewriteAcademicDoc(params: {
  userId: string;
  userPlan: string;
  currentMarkdown: string;
  instruction: string;
  workType?: string;
  topic?: string;
  subject?: string;
}): Promise<AcademicGenResult> {
  const startTime = Date.now();
  const limitCheck = await checkUserLimit(params.userId, "rewrite");
  if (!limitCheck.allowed) {
    return {
      success: false,
      error: limitCheck.error || "Ushbu oy uchun qayta tahrirlash limitingiz tugadi.",
      requireUpgrade: true,
    };
  }

  const prompt = `Siz O'zbekiston Respublikasi OTMlari bo'yicha yetakchi professor, ilmiy ekspert va tahrirchisiz.
Quyida avval yaratilgan ${params.workType || "akademik ish"} hujjati matni berilgan:
---
${params.currentMarkdown}
---

FOYDALANUVCHINING TAHRIRLASH TALABI:
"${params.instruction}"

QAT'IY TALABLAR:
1. Foydalanuvchining talabini to'liq va benuqson inobatga olgan holda butun hujjatni qayta tahrirlang.
2. Hujjatning barcha zaruriy tuzilmasini (Titul varag'i, Mundarija, Kirish, Boblar, Xulosa, Foydalanilgan adabiyotlar) MOVSO RUz standartida to'liq saqlang.
3. Kerakli o'rinlarda statistik tahlillar, Markdown jadvallari va rasmiy manbalarni yangilang.
4. Javobni faqat to'liq yangilangan matn sifatida Markdown formatida (#, ##, ### sarlavhalari bilan) qaytaring. Ortiqcha tushuntirish yozmang.`;

  try {
    const res = await generateGeminiContent(prompt, {
      systemInstruction:
        "Siz O'zbekiston OTMlarining yetakchi ilmiy muharriri va professori sifatida hujjatlarni foydalanuvchi talabiga mos mukammal tahrirlaysiz.",
      temperature: 0.3,
      maxOutputTokens: 8192,
    });

    const content = res.text.trim();
    if (!content || content.length < 300) {
      throw new Error("AI tomonidan yaratilgan yangilangan matn yetarli hajmda emas");
    }

    await deductUserAiCredit(params.userId);
    await trackAIUsage({
      userId: params.userId,
      plan: params.userPlan,
      feature: "REWRITE",
      model: res.modelUsed,
      status: "SUCCESS",
      inputTokens: res.usage.promptTokenCount,
      outputTokens: res.usage.candidatesTokenCount,
      requestDurationMs: Date.now() - startTime,
    });

    const topic = params.topic || "Akademik_Hujjat";
    const buffer = generateWordDocumentBuffer({
      title: topic,
      bodyContent: content,
      workType: params.workType,
      subject: params.subject,
    });

    const safeTopic = topic.replace(/[^a-zA-Z0-9\u0400-\u04FF]/g, "_").slice(0, 30);
    const fileName = `${params.workType ? params.workType.replace(/\s+/g, "_") : "Hujjat"}_${safeTopic}_Tahrirlangan.doc`;

    return {
      success: true,
      docBuffer: buffer,
      fileName,
      markdownContent: content,
      summaryText: `✍️ *Hujjat talabingiz asosida qayta tahrirlandi!*\n\n📌 *Talab:* _"${params.instruction.slice(0, 60)}${params.instruction.length > 60 ? "..." : ""}"_\n📄 *Format:* Microsoft Word (.doc)\n⏱ *Vaqt:* ${Math.round((Date.now() - startTime) / 1000)} soniya`,
    };
  } catch (err) {
    console.error("[TELEGRAM_REWRITE_ERR]", err);
    return {
      success: false,
      error: "Hujjatni tahrirlashda xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.",
    };
  }
}

/**
 * Section 9.D: Edit only a specific selected section of the document
 */
export async function editAcademicSection(params: {
  userId: string;
  userPlan: string;
  currentMarkdown: string;
  sectionKey: SectionKey;
  sectionInstruction: string;
  workType?: string;
  topic?: string;
  subject?: string;
}): Promise<AcademicGenResult> {
  const startTime = Date.now();
  const limitCheck = await checkUserLimit(params.userId, "rewrite");
  if (!limitCheck.allowed) {
    return {
      success: false,
      error: limitCheck.error || "Ushbu oy uchun tahrirlash limitingiz tugadi.",
      requireUpgrade: true,
    };
  }

  const sections = parseDocumentSections(params.currentMarkdown);
  const targetSection = sections.find((s) => s.key === params.sectionKey);

  let newMarkdown = "";

  if (targetSection && targetSection.content.length > 20) {
    // Isolated section rewrite: lightning fast and keeps all other sections 100% intact
    const prompt = `Siz O'zbekiston OTMlari bo'yicha yetakchi professor va ilmiy ekspertsiz.
Quyida "${params.topic || "mavzu"}" bo'yicha akademik ishning aynan "${targetSection.label}" qismi matni berilgan:
---
${targetSection.content}
---

FOYDALANUVCHINING USHBU BO'LIM BO'YICHA TALABI:
"${params.sectionInstruction}"

VAZIFA:
Faqat va faqat ushbu "${targetSection.label}" qismini foydalanuvchining talabiga ko'ra mukammal va chuqur tahrirlab, to'liq matn sifatida qaytaring.
Boshqa bo'limlarni qo'shmang. Faqat yangilangan bo'lim matnini Markdown formatida qaytaring.`;

    try {
      const res = await generateGeminiContent(prompt, {
        systemInstruction: "Siz ilmiy bo'limlarni mukammal tahrirlovchi professsiz.",
        temperature: 0.3,
        maxOutputTokens: 5000,
      });

      const updatedSection = res.text.trim();
      newMarkdown = replaceDocumentSection(
        params.currentMarkdown,
        params.sectionKey,
        updatedSection
      );

      await deductUserAiCredit(params.userId);
      await trackAIUsage({
        userId: params.userId,
        plan: params.userPlan,
        feature: "REWRITE",
        model: res.modelUsed,
        status: "SUCCESS",
        inputTokens: res.usage.promptTokenCount,
        outputTokens: res.usage.candidatesTokenCount,
        requestDurationMs: Date.now() - startTime,
      });
    } catch (err) {
      console.error("[TELEGRAM_SECTION_EDIT_ERR]", err);
      return {
        success: false,
        error: "Bo'limni tahrirlashda xatolik yuz berdi.",
      };
    }
  } else {
    // Fallback: full context rewrite targeting section
    const prompt = `Siz O'zbekiston OTMlari bo'yicha yetakchi professorsiz.
Quyidagi akademik hujjatning faqat "${params.sectionKey}" qismini quyidagi talab asosida o'zgartiring va butun hujjatni qaytaring:
"${params.sectionInstruction}"

Hujjat:
${params.currentMarkdown}`;

    try {
      const res = await generateGeminiContent(prompt, {
        systemInstruction:
          "Faqat so'ralgan bo'limni o'zgartiring, boshqa bo'limlarni to'liq saqlang.",
        temperature: 0.3,
        maxOutputTokens: 8192,
      });

      newMarkdown = res.text.trim();
      await deductUserAiCredit(params.userId);
      await trackAIUsage({
        userId: params.userId,
        plan: params.userPlan,
        feature: "REWRITE",
        model: res.modelUsed,
        status: "SUCCESS",
        inputTokens: res.usage.promptTokenCount,
        outputTokens: res.usage.candidatesTokenCount,
        requestDurationMs: Date.now() - startTime,
      });
    } catch (err) {
      console.error("[TELEGRAM_SECTION_FALLBACK_ERR]", err);
      return {
        success: false,
        error: "Bo'limni tahrirlashda xatolik yuz berdi.",
      };
    }
  }

  const topic = params.topic || "Akademik_Hujjat";
  const buffer = generateWordDocumentBuffer({
    title: topic,
    bodyContent: newMarkdown,
    workType: params.workType,
    subject: params.subject,
  });

  const safeTopic = topic.replace(/[^a-zA-Z0-9\u0400-\u04FF]/g, "_").slice(0, 30);
  const fileName = `${safeTopic}_Qism_Yangilandi.doc`;

  return {
    success: true,
    docBuffer: buffer,
    fileName,
    markdownContent: newMarkdown,
    summaryText: `📝 *«${targetSection?.label || params.sectionKey}» bo'limi muvaffaqiyatli yangilandi!*\n\n📌 *Talab:* _"${params.sectionInstruction.slice(0, 60)}"_\n📄 *Format:* Microsoft Word (.doc)\n⏱ *Vaqt:* ${Math.round((Date.now() - startTime) / 1000)} soniya`,
  };
}

/**
 * Section 9.E: Adjust document length (expand, shorten, or set explicit page count)
 */
export async function adjustAcademicLength(params: {
  userId: string;
  userPlan: string;
  currentMarkdown: string;
  lengthOption:
    | "expand_2x"
    | "shorten_2x"
    | "10_15"
    | "20_25"
    | "30_plus"
    | "50"
    | "100"
    | "200"
    | "300"
    | "custom";
  customPages?: string;
  workType?: string;
  topic?: string;
  subject?: string;
}): Promise<AcademicGenResult> {
  const startTime = Date.now();
  const limitCheck = await checkUserLimit(params.userId, "rewrite");
  if (!limitCheck.allowed) {
    return {
      success: false,
      error: limitCheck.error || "Ushbu oy uchun qayta tahrirlash limitingiz tugadi.",
      requireUpgrade: true,
    };
  }

  const currentPagesCount = Math.max(
    5,
    params.currentMarkdown.split(/\n\s*---\s*\n/).filter(Boolean).length
  );

  let targetPages = 25;
  if (params.lengthOption === "expand_2x") {
    targetPages = Math.min(300, Math.max(15, currentPagesCount * 2));
  } else if (params.lengthOption === "shorten_2x") {
    targetPages = Math.max(5, Math.round(currentPagesCount / 2));
  } else if (params.lengthOption === "10_15") {
    targetPages = 15;
  } else if (params.lengthOption === "20_25") {
    targetPages = 25;
  } else if (params.lengthOption === "30_plus") {
    targetPages = 35;
  } else if (
    params.lengthOption === "50" ||
    params.lengthOption === "100" ||
    params.lengthOption === "200" ||
    params.lengthOption === "300"
  ) {
    targetPages = parseInt(params.lengthOption, 10);
  } else if (params.lengthOption === "custom") {
    const parsed = parseInt(params.customPages || "25", 10);
    targetPages = !isNaN(parsed) && parsed >= 5 ? Math.min(300, parsed) : 25;
  }

  const topic = params.topic || "Akademik tadqiqot";
  const subject = params.subject || "Mutaxassislik fani";
  const workTypeLabel = params.workType || "Kurs ishi";

  try {
    const gen = await generateMultiPageAcademicMarkdown({
      topic,
      subject,
      studentName: "DocNova talabasi",
      pageCount: targetPages,
      workTypeTitle: workTypeLabel.toUpperCase(),
      language: "uz",
    });

    await deductUserAiCredit(params.userId);
    await trackAIUsage({
      userId: params.userId,
      plan: params.userPlan,
      feature: "REWRITE",
      model: gen.modelUsed,
      status: "SUCCESS",
      inputTokens: gen.inputTokens,
      outputTokens: gen.outputTokens,
      requestDurationMs: Date.now() - startTime,
    });

    const buffer = generateWordDocumentBuffer({
      title: topic,
      bodyContent: gen.markdown,
      workType: workTypeLabel,
      subject,
    });

    const safeTopic = topic.replace(/[^a-zA-Z0-9\u0400-\u04FF]/g, "_").slice(0, 30);
    const fileName = `${workTypeLabel.replace(/\s+/g, "_")}_${safeTopic}_${gen.pagesCount}bet.doc`;

    return {
      success: true,
      docBuffer: buffer,
      fileName,
      markdownContent: gen.markdown,
      summaryText: `📏 *Hujjat hajmi ${gen.pagesCount} betga moslashtirildi!*\n\n📌 *Mavzu:* ${topic}\n📄 *Yangi hajm:* ${gen.pagesCount} bet (to'liq sahifalangan)\n⏱ *Vaqt:* ${Math.round((Date.now() - startTime) / 1000)} soniya`,
    };
  } catch (err) {
    console.error("[TELEGRAM_ADJUST_LENGTH_ERR]", err);
    return {
      success: false,
      error: "Hujjat hajmini o'zgartirishda xatolik yuz berdi.",
    };
  }
}

/**
 * Section 9.F: Expand academic content with facts, data, tables, cases
 */
export async function expandAcademicContent(params: {
  userId: string;
  userPlan: string;
  currentMarkdown: string;
  workType?: string;
  topic?: string;
  subject?: string;
  customNote?: string;
}): Promise<AcademicGenResult> {
  const instruction = `Ushbu ilmiy hujjat mazmunini yanada boyiting:
- 2024-2026 yillardagi O'zbekiston va xalqaro rasmiy statistik ma'lumotlarni kiriting;
- Har bir asosiy bobga kamida bitta qiyosiy Markdown jadval (Table) qo'shing;
- Amaliy keyslar, muammoli vaziyatlar va ularning innovatsion yechimlarini batafsil tahlil qiling;
- Ilmiy asoslar va adabiyotlar manbalarini kengaytiring.${params.customNote ? `\nQo'shimcha eslatma: ${params.customNote}` : ""}`;

  return rewriteAcademicDoc({
    userId: params.userId,
    userPlan: params.userPlan,
    currentMarkdown: params.currentMarkdown,
    instruction,
    workType: params.workType,
    topic: params.topic,
    subject: params.subject,
  });
}

/**
 * Section 9.G: Condense academic content (eliminate redundancy, keep core science)
 */
export async function condenseAcademicContent(params: {
  userId: string;
  userPlan: string;
  currentMarkdown: string;
  workType?: string;
  topic?: string;
  subject?: string;
}): Promise<AcademicGenResult> {
  const instruction = `Ushbu ilmiy ishni ixchamlashtiring:
- Asosiy ilmiy mohiyat, ilmiy apparat, boblarning asosiy xulosalari va adabiyotlarni qat'iy saqlang;
- Barcha ortiqcha gaplar, umumiy jumlalar va takrorlangan fikrlarni olib tashlang;
- Har bir fikrni lo'nda, ravon va ilmiy jihatdan qat'iy bayon qiling.`;

  return rewriteAcademicDoc({
    userId: params.userId,
    userPlan: params.userPlan,
    currentMarkdown: params.currentMarkdown,
    instruction,
    workType: params.workType,
    topic: params.topic,
    subject: params.subject,
  });
}

/**
 * Section 9.H: Improve academic and scientific style according to OAK / MOVSO RUz
 */
export async function improveAcademicStyle(params: {
  userId: string;
  userPlan: string;
  currentMarkdown: string;
  workType?: string;
  topic?: string;
  subject?: string;
}): Promise<AcademicGenResult> {
  const instruction = `Ushbu ishning butun matnini O'zbekiston Respublikasi OAK (Oliy attestatsiya komissiyasi) va Oliy ta'lim vazirligi talablariga mos yuqori ilmiy-akademik uslubga o'tkazing:
- Barcha noilmiy, so'zlashuv yoki umumiy ifodalarni aniq ilmiy terminlarga almashtiring;
- Fikrlar o'rtasidagi mantiqiy bog'liqlik va ilmiy apparat (dolzarblik, obyekt, predmet, maqsad, vazifalar) izchilligini mukammallashtiring;
- Takroriy jumlalarni yo'qoting;
- Foydalanilgan adabiyotlar ro'yxatini GOST 7.0.5 talablariga to'liq moslashtiring.`;

  return rewriteAcademicDoc({
    userId: params.userId,
    userPlan: params.userPlan,
    currentMarkdown: params.currentMarkdown,
    instruction,
    workType: params.workType,
    topic: params.topic,
    subject: params.subject,
  });
}

/**
 * Section 9.C: Full regeneration from scratch with same parameters
 */
export async function regenerateAcademicDoc(params: {
  userId: string;
  userPlan: string;
  type: string;
  topic: string;
  subject?: string;
  specialty?: string;
  lengthOption?: "short" | "standard" | "extended";
  slidesCount?: number;
}): Promise<AcademicGenResult> {
  if (params.type === "coursework") {
    return generateCourseworkDoc({
      userId: params.userId,
      userPlan: params.userPlan,
      topic: params.topic,
      subject: params.subject,
    });
  } else if (params.type === "referat") {
    return generateReferatDoc({
      userId: params.userId,
      userPlan: params.userPlan,
      topic: params.topic,
      subject: params.subject,
      lengthOption: params.lengthOption,
    });
  } else if (params.type === "bmi") {
    return generateBmiDoc({
      userId: params.userId,
      userPlan: params.userPlan,
      topic: params.topic,
      specialty: params.specialty,
    });
  } else if (params.type === "presentation") {
    return generatePresentationDoc({
      userId: params.userId,
      userPlan: params.userPlan,
      topic: params.topic,
      slidesCount: params.slidesCount,
    });
  } else if (params.type === "essay") {
    return generateEssayDoc({
      userId: params.userId,
      userPlan: params.userPlan,
      topic: params.topic,
    });
  } else if (params.type === "exam") {
    return generateExamDoc({
      userId: params.userId,
      userPlan: params.userPlan,
      topic: params.topic,
    });
  }

  return {
    success: false,
    error: "Noma'lum akademik ish turi.",
  };
}

/**
 * Unified generation entrypoint with guaranteed task state tracking and lock release.
 */
export async function generateAcademicDocument(params: {
  workType: "coursework" | "referat" | "bmi" | "presentation" | "essay" | "exam";
  userId: string;
  userPlan: string;
  topic: string;
  subject?: string;
  specialty?: string;
  lengthOption?: "short" | "standard" | "extended" | string;
  pageCount?: string;
  slidesCount?: number;
  studentName?: string;
  taskId?: string;
  telegramId?: string | number;
  releaseLockOnExit?: boolean;
}): Promise<AcademicGenResult> {
  const { telegramId, releaseLockOnExit = true } = params;
  let activeTaskId = params.taskId;
  let acquiredInternally = false;
  let taskCompleted = false;

  if (!activeTaskId && telegramId !== undefined) {
    const lock = await acquireUserLock(telegramId);
    if (!lock.acquired || !lock.jobId) {
      return {
        success: false,
        error: "PARALLEL_SUPPRESSED",
      };
    }
    activeTaskId = lock.jobId;
    acquiredInternally = true;
  }

  try {
    if (activeTaskId && telegramId !== undefined) {
      await createAcademicTask({
        taskId: activeTaskId,
        telegramId,
        userId: params.userId,
        workType: params.workType,
        topic: params.topic,
        subject: params.subject || params.specialty,
      });
      await updateAcademicTaskStage(activeTaskId, "GEMINI_GEN");
    }

    const runGeneration = async (): Promise<AcademicGenResult> => {
      switch (params.workType) {
        case "coursework":
          return generateCourseworkDoc({
            userId: params.userId,
            userPlan: params.userPlan,
            topic: params.topic,
            subject: params.subject,
            studentName: params.studentName,
            pageCount: params.pageCount,
          });
        case "referat":
          return generateReferatDoc({
            userId: params.userId,
            userPlan: params.userPlan,
            topic: params.topic,
            subject: params.subject,
            lengthOption: params.lengthOption,
            pageCount: params.pageCount,
            studentName: params.studentName,
          });
        case "bmi":
          return generateBmiDoc({
            userId: params.userId,
            userPlan: params.userPlan,
            topic: params.topic,
            specialty: params.specialty || params.subject || "Umumiy",
            studentName: params.studentName,
            pageCount: params.pageCount,
          });
        case "presentation":
          return generatePresentationDoc({
            userId: params.userId,
            userPlan: params.userPlan,
            topic: params.topic,
            slidesCount: params.slidesCount || 10,
          });
        case "essay":
          return generateEssayDoc({
            userId: params.userId,
            userPlan: params.userPlan,
            topic: params.topic,
          });
        case "exam":
          return generateExamDoc({
            userId: params.userId,
            userPlan: params.userPlan,
            topic: params.topic,
          });
        default:
          throw new Error(`Noma'lum akademik ish turi: ${params.workType}`);
      }
    };

    const timeoutPromise = new Promise<AcademicGenResult>((_, reject) =>
      setTimeout(() => reject(new Error("GEMINI_GENERATION_TIMEOUT")), 45_000)
    );

    const result = await Promise.race([runGeneration(), timeoutPromise]);

    if (result.success) {
      taskCompleted = true;
    } else if (activeTaskId) {
      await failAcademicTask(activeTaskId, result.error || "Generatsiya muvaffaqiyatsiz bo'ldi");
    }

    return result;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[GENERATE_ACADEMIC_DOCUMENT_ERR]", err);
    if (activeTaskId) {
      await failAcademicTask(activeTaskId, errorMsg);
    }
    return {
      success: false,
      error: "Hujjatni yaratishda xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.",
    };
  } finally {
    if (!taskCompleted) {
      if (activeTaskId) {
        try {
          await failAcademicTask(activeTaskId, "Jarayon to'xtatildi yoki Gemini javob bermadi");
        } catch (e) {
          console.error("[FINALLY_FAIL_TASK_ERR]", e);
        }
      }
      if (telegramId !== undefined && activeTaskId) {
        await releaseUserLock(telegramId, activeTaskId);
      }
    } else if (
      (releaseLockOnExit || acquiredInternally) &&
      telegramId !== undefined &&
      activeTaskId
    ) {
      await releaseUserLock(telegramId, activeTaskId);
    }
  }
}
