import { generateGeminiContent } from "@/lib/gemini";
import { checkUserLimit, deductUserAiCredit, trackAIUsage } from "@/lib/limits";
import { generateWordDocumentBuffer } from "@/lib/telegram-docnova-ai";

export interface AcademicGenResult {
  success: boolean;
  docBuffer?: Buffer;
  fileName?: string;
  summaryText?: string;
  error?: string;
  requireUpgrade?: boolean;
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

  const prompt = `Siz O'zbekiston Respublikasi Oliy ta'lim, fan va innovatsiyalar vazirligi (MOVSO RUz) talablariga to'liq javob beradigan professor va ilmiy ekspertsiz.
Quyidagi parametrlar bo'yicha eng yuqori darajadagi KURs ISHIni to'liq matn sifatida yozib bering:
- Fan: "${subjectName}"
- Kurs ishi mavzusi: "${params.topic}"
- Bajaruvchi: "${authorName}"
- Yil: ${currentYear}

QAT'IY STRUKTURA VA TALABLAR:
1. TITUL VARAG'I (Vazirlik, OTM, Kafedra, Fan, Mavzu, Bajaruvchi, Ilmiy rahbar, Toshkent - ${currentYear})
2. MUNDARIJA (Kirish, I Bob 3 ta fasl bilan, II Bob 3 ta fasl bilan, III Bob 3 ta fasl bilan, Xulosa, Foydalanilgan adabiyotlar)
3. KIRISH:
   - Mavzuning dolzarbligi ("O'zbekiston - 2030" strategiyasi bilan bog'langan);
   - Muammoning ilmiy o'rganilganlik darajasi;
   - Tadqiqot obyekti va predmeti;
   - Tadqiqot maqsadi va 4 ta ilmiy vazifasi;
   - Tadqiqot usullari va amaliy ahamiyati.
4. I BOB. MAVZUNING NAZARIY-METODOLOGIK ASOSLARI:
   - 1.1, 1.2, 1.3 fasllari (nazariy tahlil, asosiy tushunchalar).
5. II BOB. MAVZUNI AMALIY VA STATISTIK TAHLIL QILISH:
   - 2.1, 2.2, 2.3 fasllari;
   - Qat'iy talab: II Bobda kamida bitta batafsil qiyosiy Markdown jadval (Table) bo'lishi shart!
6. III BOB. MAVZUNI RIVOJLANTIRISH BO'YICHA TAKLIFLAR VA TAVSIYALAR:
   - 3.1, 3.2, 3.3 fasllari (innovatsion yechimlar va amaliy tavsiyalar).
7. XULOSA: Barcha boblar bo'yicha aniq xulosalar va amaliy natijalar.
8. FOYDALANILGAN ADABIYOTLAR: Kamida 15 ta real GOST manbasi (O'zbekiston qonunlari, Prezident farmonlari, darsliklar, ilmiy maqolalar).

Matnni to'liq, qisqartirmasdan, Markdown formatida sarlavhalar (#, ##, ###) bilan yozing. Mavzudan chetga chiqmang!`;

  try {
    const res = await generateGeminiContent(prompt, {
      systemInstruction:
        "Siz O'zbekiston OTMlarining yetakchi ilmiy professori va metodistisiz. Kurs ishlarini MOVSO RUz standartida benuqson yozasiz.",
      temperature: 0.25,
      maxOutputTokens: 8192,
    });

    const content = res.text.trim();
    if (!content || content.length < 500) {
      throw new Error("AI tomonidan yaratilgan matn yetarli hajmda emas");
    }

    await deductUserAiCredit(params.userId);
    await trackAIUsage({
      userId: params.userId,
      plan: params.userPlan,
      feature: "COURSEWORK",
      model: res.modelUsed,
      status: "SUCCESS",
      inputTokens: res.usage.promptTokenCount,
      outputTokens: res.usage.candidatesTokenCount,
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

    const safeTopic = params.topic.replace(/[^a-zA-Z0-9\u0400-\u04FF]/g, "_").slice(0, 30);
    const fileName = `Kurs_Ishi_${safeTopic}_DocNova.doc`;

    return {
      success: true,
      docBuffer: buffer,
      fileName,
      summaryText: `📘 *Kurs ishi muvaffaqiyatli tayyorlandi!*\n\n📌 *Mavzu:* ${params.topic}\n📚 *Fan:* ${subjectName}\n📄 *Format:* Microsoft Word (.doc)\n🏛 *Standart:* MOVSO RUz / GOST\n⏱ *Vaqt:* ${Math.round((Date.now() - startTime) / 1000)} soniya`,
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
  lengthOption?: "short" | "standard" | "extended"; // 3-5, 5-8, 10-15
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

  let lengthGuide = "5-8 sahifaga mo'ljallangan to'liq akademik hajm (kamida 2500 so'z)";
  if (params.lengthOption === "short") {
    lengthGuide = "3-5 sahifaga mo'ljallangan ixcham hajm (kamida 1500 so'z)";
  } else if (params.lengthOption === "extended") {
    lengthGuide =
      "10-15 sahifaga mo'ljallangan kengaytirilgan batafsil hajm (kamida 4000-5000 so'z, chuqur tahlil)";
  }

  const prompt = isRu
    ? `Подготовьте академический реферат / самостоятельную работу высокого научного уровня:
- Тема: "${params.topic}"
- Предмет: "${subjectName}"
- Автор: "${authorName}"
- Объем: ${lengthGuide}
- Структура: Титульный лист, План, Введение, 2-3 основных раздела с анализом, Заключение, Список литературы (ГОСТ).
Формат: Markdown с заголовками (#, ##, ###) и таблицей при необходимости.`
    : `O'zbekiston OTMlari talablariga mos yuqori sifatli REFERAT / MUSTAQIL ISH tayyorlang:
- Mavzu: "${params.topic}"
- Fan: "${subjectName}"
- Bajaruvchi: "${authorName}"
- Hajm: ${lengthGuide}
- Qat'iy struktura: Titul varag'i, Reja, Kirish (dolzarbligi, maqsadi), Asosiy qism (2-3 ta band, chuqur tahliliy ma'lumotlar), Xulosa, Foydalanilgan adabiyotlar (kamida 8-10 ta manba).
Matnni Markdown formatida yozing.`;

  try {
    const res = await generateGeminiContent(prompt, {
      systemInstruction:
        "Siz referat va mustaqil ishlar bo'yicha ilmiy ekspertsiz. Belgilangan hajm va mavzuga qat'iy rioya qiling.",
      temperature: 0.25,
      maxOutputTokens: 8192,
    });

    const content = res.text.trim();
    if (!content || content.length < 400) {
      throw new Error("AI tomonidan yaratilgan matn yetarli hajmda emas");
    }

    await deductUserAiCredit(params.userId);
    await trackAIUsage({
      userId: params.userId,
      plan: params.userPlan,
      feature: "REFERAT",
      model: res.modelUsed,
      status: "SUCCESS",
      inputTokens: res.usage.promptTokenCount,
      outputTokens: res.usage.candidatesTokenCount,
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

    const safeTopic = params.topic.replace(/[^a-zA-Z0-9\u0400-\u04FF]/g, "_").slice(0, 30);
    const fileName = `Referat_${safeTopic}_DocNova.doc`;

    return {
      success: true,
      docBuffer: buffer,
      fileName,
      summaryText: `📑 *Referat / Mustaqil ish tayyorlandi!*\n\n📌 *Mavzu:* ${params.topic}\n📚 *Fan:* ${subjectName}\n📄 *Format:* Microsoft Word (.doc)\n🏛 *Standart:* MOVSO RUz / GOST\n⏱ *Vaqt:* ${Math.round((Date.now() - startTime) / 1000)} soniya`,
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

  const prompt = `Siz O'zbekiston Respublikasi Oliy ta'lim, fan va innovatsiyalar vazirligi standartlariga to'liq javob beradigan professor va dissertatsiya rahbari sifatida, quyidagi mavzuda eng yuqori ilmiy darajadagi BITIRUV MALAKAVIY ISHI (BMI) / DIPLOM ISHIning to'liq kompleksini yozib bering:
- Tadqiqot mavzusi: "${params.topic}"
- Mutaxassislik: "${specialtyName}"
- Bajaruvchi: "${authorName}"
- Yil: ${currentYear}

TALABLAR:
1. TITUL VARAG'I (To'liq rasmiy O'zbekiston OTM formati)
2. MUNDARIJA (Nuqtalar va sahifalar bilan)
3. KIRISH (To'liq ilmiy apparat: Dolzarblik, "O'zbekiston-2030" strategiyasi, O'rganilganlik darajasi, Obyekt, Predmet, Maqsad, 5 ta vazifa, Metodologiya, Ilmiy yangilik, Amaliy ahamiyat)
4. I BOB. NAZARIY-METODOLOGIK ASOSLAR (1.1, 1.2, 1.3 fasllar)
5. II BOB. AMALIY VA TAHLILIY TADQIQOT (2.1, 2.2, 2.3 fasllar + Kamida bitta qiyosiy tahliliy jadval)
6. III BOB. TAKLIFLAR, INNOVATSION MEXANIZMLAR VA YO'L XARITASI (3.1, 3.2, 3.3 fasllar)
7. XULOSA VA TAVSIYALAR
8. ADABIYOTLAR RO'YXATI (Kamida 25-30 ta dolzarb GOST manbasi: Qonunlar, Farmonlar, Scopus / Web of Science, Lex.uz).

Matnni Markdown formatida yozing.`;

  try {
    const res = await generateGeminiContent(prompt, {
      systemInstruction:
        "Siz bitiruv malakaviy ishlari va dissertatsiyalar bo'yicha bosh ekspertsiz. Ilmiy apparat va standartlarga qat'iy amal qiling.",
      temperature: 0.2,
      maxOutputTokens: 8192,
    });

    const content = res.text.trim();
    if (!content || content.length < 600) {
      throw new Error("AI tomonidan yaratilgan matn yetarli hajmda emas");
    }

    await deductUserAiCredit(params.userId);
    await trackAIUsage({
      userId: params.userId,
      plan: params.userPlan,
      feature: "BMI_DIPLOM",
      model: res.modelUsed,
      status: "SUCCESS",
      inputTokens: res.usage.promptTokenCount,
      outputTokens: res.usage.candidatesTokenCount,
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

    const safeTopic = params.topic.replace(/[^a-zA-Z0-9\u0400-\u04FF]/g, "_").slice(0, 30);
    const fileName = `BMI_${safeTopic}_DocNova.doc`;

    return {
      success: true,
      docBuffer: buffer,
      fileName,
      summaryText: `🎓 *Bitiruv malakaviy ishi (BMI) tayyorlandi!*\n\n📌 *Mavzu:* ${params.topic}\n🏛 *Yo'nalish:* ${specialtyName}\n📄 *Format:* Microsoft Word (.doc)\n📚 *Tarkib:* Titul, Mundarija, Kirish, 3 ta Bob, Jadval, Xulosa, 25+ Adabiyotlar\n⏱ *Vaqt:* ${Math.round((Date.now() - startTime) / 1000)} soniya`,
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
