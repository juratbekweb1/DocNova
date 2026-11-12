/**
 * DOCNOVA AI — ACADEMIC CONTENT ARCHITECT & VOLUME CONTROL ENGINE
 *
 * Vazifasi:
 * 1. Foydalanuvchi tanlagan sahifalar soniga (A4, Times New Roman 14pt, 1.5 interval, GOST hoshiyalar)
 *    mos keladigan aniq so'zlar, belgilar, abzaslar va Gemini tokenlar byudjetini hisoblash.
 * 2. Har bir akademik modul (Kurs ishi, Diplom/BMI, Referat, Mustaqil ish) uchun
 *    mavzudan chetga chiqmaslik (Topic Lock) va takroriy jumlalarni yozmaslikni (Anti-Repetition)
 *    ta'minlovchi tizimli prompt shablonlarini shakllantirish.
 * 3. AI qaytargan matnning sifatini, hajmini va takrorlanish darajasini tekshirish hamda tozalash.
 */

export type AcademicModuleType =
  | "COURSEWORK" // Kurs ishi (15 - 45 bet)
  | "DIPLOMA_BMI" // Bitiruv malakaviy ishi / Magistrlik dissertatsiyasi (50 - 90+ bet)
  | "REFERAT" // Referat (5 - 15 bet)
  | "INDEPENDENT_WORK"; // Mustaqil ish (5 - 20 bet)

export interface SectionVolumeSpec {
  key: string;
  label: string;
  allocatedPages: number;
  minWords: number;
  targetWords: number;
  maxWords: number;
  targetCharsWithSpaces: number;
  minParagraphs: number;
}

export interface AcademicVolumeBudget {
  moduleType: AcademicModuleType;
  targetTotalPages: number;
  fixedStructuralPages: number; // Titul (1) + Mundarija (1) + Adabiyotlar (1-2)
  netContentPages: number;
  wordsPerPageStandard: number; // 1 bet A4 14pt 1.5 interval = ~265 so'z (250-300 oralig'i)
  charsPerPageStandard: number; // 1 bet A4 = ~1900 belgi (probellar bilan)
  totalTargetWords: number;
  totalMinWords: number;
  totalMaxWords: number;
  totalTargetChars: number;
  requiredReferencesCount: number;
  recommendedGeminiMaxTokens: number;
  sections: Record<string, SectionVolumeSpec>;
}

export interface AcademicQualityAuditReport {
  isValid: boolean;
  totalWords: number;
  totalChars: number;
  estimatedPages: number;
  volumeFulfillmentPercent: number;
  topicRelevanceScore: number; // 0..100%
  maxCrossSectionSimilarity: number; // 0..1 (Jaccard)
  duplicateSentencesFound: number;
  issues: string[];
  cleanedText?: string;
}

/**
 * Standart GOST A4 (Times New Roman 14pt, 1.5 qator oralig'i,
 * Chap: 30mm, O'ng: 15mm, Yuqori/Past: 20mm) o'lchov konstantalari
 */
export const GOST_PAGE_METRICS = {
  WORDS_PER_PAGE_MIN: 250,
  WORDS_PER_PAGE_AVG: 265,
  WORDS_PER_PAGE_MAX: 300,
  CHARS_PER_PAGE_AVG: 1900,
  WORDS_PER_PARAGRAPH_AVG: 85, // 1 sahifada o'rtacha 3 ta to'liq ilmiy abzas
  TOKENS_PER_WORD_UZ_RU: 1.85, // O'zbek va rus tillarida agglyutinativ qo'shimchalar hisobiga 1 so'z ≈ 1.85 token
} as const;

/**
 * Foydalanuvchi kiritgan sahifa matni ("15-20 bet", "25", "5-8 bet (Klassik)") dan
 * aniq maqsadli sahifalar sonini ajratib olish.
 */
export function parseTargetPageCount(
  rawInput: string | number | undefined,
  moduleType: AcademicModuleType = "COURSEWORK"
): number {
  const defaults: Record<AcademicModuleType, number> = {
    COURSEWORK: 25,
    DIPLOMA_BMI: 70,
    REFERAT: 10,
    INDEPENDENT_WORK: 12,
  };

  if (typeof rawInput === "number" && !Number.isNaN(rawInput)) {
    return Math.max(3, Math.min(500, Math.round(rawInput)));
  }

  if (!rawInput || typeof rawInput !== "string") {
    return defaults[moduleType];
  }

  // Agar "10-15 bet" kabi oraliq berilgan bo'lsa, yuqori chegarani yoki o'rtachasini olamiz
  const rangeMatch = rawInput.match(/(\d+)\s*[-–—]\s*(\d+)/);
  if (rangeMatch) {
    const low = parseInt(rangeMatch[1], 10);
    const high = parseInt(rangeMatch[2], 10);
    return Math.max(3, Math.min(500, Math.round((low + high) / 2)));
  }

  const singleMatch = rawInput.match(/(\d+)/);
  if (singleMatch) {
    return Math.max(3, Math.min(500, parseInt(singleMatch[1], 10)));
  }

  return defaults[moduleType];
}

/**
 * 1-VAZIFA: Sahifalar soniga mos so'zlar, belgilar, abzaslar va bo'limlar taqsimotini
 * matematik aniqlikda hisoblab beruvchi funksiya.
 */
export function calculateAcademicVolumeBudget(
  pageCountInput: string | number | undefined,
  moduleType: AcademicModuleType = "COURSEWORK"
): AcademicVolumeBudget {
  const targetTotalPages = parseTargetPageCount(pageCountInput, moduleType);

  // Titul (1 bet) + Mundarija (1 bet) + Adabiyotlar (hajmga qarab 1 yoki 2 bet)
  const refPages = targetTotalPages >= 22 ? 2 : 1;
  const fixedStructuralPages = 1 + 1 + refPages;
  const netContentPages = Math.max(2, targetTotalPages - fixedStructuralPages);

  const wordsPerPage = GOST_PAGE_METRICS.WORDS_PER_PAGE_AVG;
  const charsPerPage = GOST_PAGE_METRICS.CHARS_PER_PAGE_AVG;

  const buildSpec = (key: string, label: string, pagesFloat: number): SectionVolumeSpec => {
    const allocatedPages = Math.max(0.5, Number(pagesFloat.toFixed(1)));
    const targetWords = Math.round(allocatedPages * wordsPerPage);
    const minWords = Math.round(allocatedPages * GOST_PAGE_METRICS.WORDS_PER_PAGE_MIN);
    const maxWords = Math.round(allocatedPages * GOST_PAGE_METRICS.WORDS_PER_PAGE_MAX);
    const targetCharsWithSpaces = Math.round(allocatedPages * charsPerPage);
    const minParagraphs = Math.max(
      2,
      Math.round(targetWords / GOST_PAGE_METRICS.WORDS_PER_PARAGRAPH_AVG)
    );

    return {
      key,
      label,
      allocatedPages,
      minWords,
      targetWords,
      maxWords,
      targetCharsWithSpaces,
      minParagraphs,
    };
  };

  const sections: Record<string, SectionVolumeSpec> = {};

  if (moduleType === "REFERAT" || moduleType === "INDEPENDENT_WORK") {
    // Referat / Mustaqil ish tuzilmasi: Kirish (15%), 3 ta asosiy bo'lim (70%), Xulosa (15%)
    const introPages = Math.max(1, netContentPages * 0.15);
    const conclusionPages = Math.max(1, netContentPages * 0.15);
    const bodyPages = Math.max(1.5, netContentPages - introPages - conclusionPages);
    const perPart = bodyPages / 3;

    sections.kirish = buildSpec("kirish", "Kirish", introPages);
    sections.part1 = buildSpec("part1", "1-bo'lim (Nazariy asoslar)", perPart);
    sections.part2 = buildSpec("part2", "2-bo'lim (Amaliy tahlil va ko'rsatkichlar)", perPart);
    sections.part3 = buildSpec("part3", "3-bo'lim (Muammolar va yechimlar)", perPart);
    sections.xulosa = buildSpec("xulosa", "Xulosa va tavsiyalar", conclusionPages);
  } else {
    // Kurs ishi va Diplom (BMI) tuzilmasi: Kirish (11%), 9 ta fasl (3 bob x 3 fasl = 78%), Xulosa (11%)
    const introPages = Math.max(1.5, netContentPages * 0.11);
    const conclusionPages = Math.max(1.5, netContentPages * 0.11);
    const chaptersPages = Math.max(4.5, netContentPages - introPages - conclusionPages);

    // 1-bob (30%), 2-bob tahliliy jadval bilan (38%), 3-bob (32%)
    const ch1Sub = (chaptersPages * 0.3) / 3;
    const ch2Sub = (chaptersPages * 0.38) / 3;
    const ch3Sub = (chaptersPages * 0.32) / 3;

    sections.kirishContent = buildSpec("kirishContent", "KIRISH", introPages);
    sections.sub1_1 = buildSpec("sub1_1", "1.1-fasl (Nazariy-konseptual asoslar)", ch1Sub);
    sections.sub1_2 = buildSpec("sub1_2", "1.2-fasl (Metodologik tamoyillar va modellar)", ch1Sub);
    sections.sub1_3 = buildSpec("sub1_3", "1.3-fasl (Xorijiy tajriba qiyosiy tahlili)", ch1Sub);
    sections.sub2_1 = buildSpec("sub2_1", "2.1-fasl (O'zbekistondagi joriy amaliy holat)", ch2Sub);
    sections.sub2_2 = buildSpec("sub2_2", "2.2-fasl (Tizimli muammolar diagnostikasi)", ch2Sub);
    sections.sub2_3 = buildSpec(
      "sub2_3",
      "2.3-fasl (Samaradorlik ko'rsatkichlari tahlili)",
      ch2Sub
    );
    sections.sub3_1 = buildSpec("sub3_1", "3.1-fasl (Istiqbolli mexanizmlar)", ch3Sub);
    sections.sub3_2 = buildSpec("sub3_2", "3.2-fasl (Tatbiq etish «Yo'l xaritasi»)", ch3Sub);
    sections.sub3_3 = buildSpec(
      "sub3_3",
      "3.3-fasl (Kutilayotgan ijtimoiy-iqtisodiy samara)",
      ch3Sub
    );
    sections.xulosaContent = buildSpec("xulosaContent", "XULOSA VA TAKLIFLAR", conclusionPages);
  }

  const totalTargetWords = Object.values(sections).reduce((acc, s) => acc + s.targetWords, 0);
  const totalMinWords = Object.values(sections).reduce((acc, s) => acc + s.minWords, 0);
  const totalMaxWords = Object.values(sections).reduce((acc, s) => acc + s.maxWords, 0);
  const totalTargetChars = Object.values(sections).reduce(
    (acc, s) => acc + s.targetCharsWithSpaces,
    0
  );

  const requiredReferencesCount =
    moduleType === "DIPLOMA_BMI" ? 25 : moduleType === "COURSEWORK" ? 16 : 8;

  const recommendedGeminiMaxTokens = Math.min(
    16384,
    Math.max(4096, Math.ceil(totalTargetWords * GOST_PAGE_METRICS.TOKENS_PER_WORD_UZ_RU * 1.25))
  );

  return {
    moduleType,
    targetTotalPages,
    fixedStructuralPages,
    netContentPages,
    wordsPerPageStandard: wordsPerPage,
    charsPerPageStandard: charsPerPage,
    totalTargetWords,
    totalMinWords,
    totalMaxWords,
    totalTargetChars,
    requiredReferencesCount,
    recommendedGeminiMaxTokens,
    sections,
  };
}

/**
 * 2-VAZIFA: Mavzudan chetga chiqmaslik (Topic Lock), takroriy gaplar yozmaslik (Anti-Repetition)
 * va aniq hajm (so'z/abzas) talablarini Gemini promptiga joylashtiruvchi quruvchi funksiya.
 */
export function buildControlledAcademicPrompt(params: {
  moduleType: AcademicModuleType;
  topic: string;
  subject: string;
  faculty?: string;
  university?: string;
  studentName?: string;
  teacherName?: string;
  pageCount?: string | number;
  language?: "uz" | "uz-cyrl" | "ru";
  templateText?: string;
}): {
  systemInstruction: string;
  userPrompt: string;
  budget: AcademicVolumeBudget;
} {
  const budget = calculateAcademicVolumeBudget(params.pageCount, params.moduleType);
  const lang = params.language || "uz";
  const isRu = lang === "ru";

  const sectionConstraintsList = Object.values(budget.sections)
    .map(
      (s) =>
        `  • [${s.key}] (${s.label}): kamida ${s.minParagraphs} ta to'liq abzas, ${s.minWords}–${s.maxWords} so'z (~${s.targetCharsWithSpaces} belgi, ~${s.allocatedPages} bet A4).`
    )
    .join("\n");

  const systemInstruction = isRu
    ? `Вы — ведущий профессор и эксперт Министерства высшего образования, науки и инноваций Республики Узбекистан (МОВСО РУз).
ВАШИ ЖЕСТКИЕ ПРАВИЛА ГЕНЕРАЦИИ:
1. СТРОГОЕ СООТВЕТСТВИЕ ТЕМЕ (TOPIC LOCK): Весь текст, термины, таблицы и выводы должны на 100% относиться исключительно к теме «${params.topic}» по дисциплине «${params.subject}». Любое отклонение в общие шаблонные фразы запрещено.
2. ЗАПРЕТ ПОВТОРОВ (ZERO REPETITION): Ни одно предложение, абзац или формулировка не должны повторяться между Введением, Главами 1, 2, 3 и Заключением. Каждый раздел раскрывает строго свой аналитический срез.
3. КОНТРОЛЬ ОБЪЕМА (GOST A4 14pt, 1.5 интервал = 265 слов/стр.): Вы обязаны выполнить целевой объем слов и абзацев для каждого раздела. Никогда не обрывайте предложение на полуслове.`
    : `Siz O'zbekiston Respublikasi Oliy ta'lim, fan va innovatsiyalar vazirligi (OTFIV / MOVSO RUz) standartlari bo'yicha yetakchi professor va akademik arhitektorsiz.
QAT'IY GENERATSIYA QOIDALARI:
1. MAVZUGA 100% BOG'LIQLIK (STRICT TOPIC LOCK): Barcha boblar, paragraflar, jadvallar va xulosalar FAQAT VA FAQAT «${params.topic}» mavzusiga («${params.subject}» fani doirasida) bag'ishlanishi shart. Mavzudan chetga chiqish yoki umumiy "suv" gaplar yozish qat'iyan taqiqlanadi.
2. TAKRORLANISHGA QARSHI NAZORAT (ANTI-REPETITION GUARD): Kirish, 1-bob, 2-bob, 3-bob va Xulosa qismlarida aynan bir xil jumlalar yoki abzaslarni qayta ishlatish QAT'IYAN MAN ETILADI:
   - I BOB: Faqat nazariy-konseptual asoslar, atamalar tahlili, olimlar qarashlari va xorijiy modellar.
   - II BOB: Faqat O'zbekistondagi amaliy holat, empirik ko'rsatkichlar, qiyosiy jadval va tizimli muammolar diagnostikasi.
   - III BOB: Faqat aniq yechimlar, 3 bosqichli «Yo'l xaritasi» va kutilayotgan samaradorlik hisobi.
   - XULOSA: Asosiy matndagi gaplarni ko'chirib yozmasdan (no copy-paste), sintez qilingan ilmiy xulosalar va aniq amaliy tavsiyalar.
3. HAJM VA SAHIFA STANDARTI (GOST A4, Times New Roman 14pt, 1.5 interval = 1 betda 250–300 so'z): Har bir bo'lim uchun belgilangan so'zlar va abzaslar me'yorini to'liq bajaring. Jumlalarni yarim so'zda uzib qo'ymang.`;

  const userPrompt = `HUJJAT PARAMETRLARI:
- Modul turi: ${params.moduleType}
- Fan / Yo'nalish: "${params.subject}"
- Tadqiqot mavzusi: "${params.topic}"
- Tanlangan umumiy hajm: ${budget.targetTotalPages} bet A4 (Asosiy matn: ${budget.netContentPages} bet, jami ~${budget.totalTargetWords} so'z / ~${budget.totalTargetChars} belgi)
- Til: "${lang}"
${params.templateText ? `${params.templateText.startsWith("[RASMDAN OLINGAN MAVZU VA TALABLAR]") ? "- Rasmdan olingan foydalanuvchi mavzulari, reja bandlari va qat'iy talablar (HAR BIRINI to'liq saqlang va chuqur yoriting):" : "- Foydalanuvchi yuklagan namuna matni:"}\n"""\n${params.templateText.slice(0, 8000)}\n"""\n` : ""}

BO'LIMLAR BO'YICHA QAT'IY HAJM ME'YORI (1 bet A4 = 250-300 so'z hisobida):
${sectionConstraintsList}
  • [references]: «${params.topic}» mavzusiga bevosita aloqador ${budget.requiredReferencesCount} ta real GOST manbalar (O'zR Qonunlari, Prezident Farmonlari, darsliklar, ilmiy maqolalar, lex.uz, edu.uz, stat.uz).

SIFAT TALABLARI:
- Har bir abzas kamida 4-5 ta mukammal ilmiy gapdan (80-110 so'z) iborat bo'lsin.
- So'z boyligi va ilmiy terminologiya yuqori darajada bo'lsin, bir fikrni ikki marta turli so'z bilan qayta yozmang.
- II Bobda (sub2_table) «${params.topic}» bo'yicha 5 ustunli va kamida 4 qatorli qiyosiy tahliliy jadval hamda uning manbasi (sourceNote) bo'lsin.`;

  return {
    systemInstruction,
    userPrompt,
    budget,
  };
}

/**
 * Matn ichidagi takroriy gaplarni avtomatik tozalovchi va sifat/hajm ko'rsatkichlarini
 * tekshiruvchi post-processing funksiyasi.
 */
export function auditAndSanitizeAcademicContent(
  rawText: string,
  topic: string,
  budget: AcademicVolumeBudget
): AcademicQualityAuditReport {
  const issues: string[] = [];
  if (!rawText || !rawText.trim()) {
    return {
      isValid: false,
      totalWords: 0,
      totalChars: 0,
      estimatedPages: 0,
      volumeFulfillmentPercent: 0,
      topicRelevanceScore: 0,
      maxCrossSectionSimilarity: 0,
      duplicateSentencesFound: 0,
      issues: ["AI tomonidan matn qaytarilmadi."],
    };
  }

  // 1. Paragraflardagi takroriy gaplarni aniqlash va olib tashlash
  const seenNormalizedSentences = new Set<string>();
  let duplicateSentencesFound = 0;

  const paragraphs = rawText.split(/\n\n+/);
  const cleanedParagraphs = paragraphs.map((para) => {
    const trimmed = para.trim();
    // Sarlavha, jadval yoki ro'yxat elementlariga tegmaymiz
    if (
      trimmed.startsWith("#") ||
      trimmed.startsWith("|") ||
      trimmed === "---" ||
      /^\d+\./.test(trimmed) ||
      /^[-*•]/.test(trimmed)
    ) {
      return para;
    }

    const sentences = trimmed.match(/[^.!?]+[.!?]+/g);
    if (!sentences || sentences.length <= 1) return para;

    const uniqueSentences: string[] = [];
    for (const sentence of sentences) {
      const norm = sentence
        .toLowerCase()
        .replace(/[^a-z0-9\u0400-\u04FF\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();

      // 35 belgidan uzun gaplar takrorlansa filtrlanadi
      if (norm.length > 35 && seenNormalizedSentences.has(norm)) {
        duplicateSentencesFound++;
        continue;
      }
      if (norm.length > 35) {
        seenNormalizedSentences.add(norm);
      }
      uniqueSentences.push(sentence.trim());
    }

    return uniqueSentences.join(" ");
  });

  const cleanedText = cleanedParagraphs.filter(Boolean).join("\n\n");

  // 2. So'zlar va belgilar sonini hisoblash
  const words = cleanedText
    .replace(/[#*|_\-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0);
  const totalWords = words.length;
  const totalChars = cleanedText.length;
  const estimatedPages = Math.max(
    1,
    Math.round(totalWords / GOST_PAGE_METRICS.WORDS_PER_PAGE_AVG + budget.fixedStructuralPages)
  );

  const volumeFulfillmentPercent = Math.min(
    100,
    Math.round((totalWords / Math.max(1, budget.totalMinWords)) * 100)
  );

  // 3. Mavzuga moslik (Topic Keyword Density) tekshiruvi
  const topicKeywords = topic
    .toLowerCase()
    .replace(/[^a-z0-9\u0400-\u04FF\s']/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);

  const lowerText = cleanedText.toLowerCase();
  const matchedKeywords = topicKeywords.filter((kw) => lowerText.includes(kw));
  const topicRelevanceScore =
    topicKeywords.length > 0
      ? Math.round((matchedKeywords.length / topicKeywords.length) * 100)
      : 100;

  if (topicRelevanceScore < 60) {
    issues.push(`Mavzu kalit so'zlarining matnda uchrash darajasi past (${topicRelevanceScore}%).`);
  }

  if (duplicateSentencesFound > 0) {
    issues.push(`${duplicateSentencesFound} ta takroriy jumla aniqlandi va avtomatik tozalandi.`);
  }

  return {
    isValid: topicRelevanceScore >= 60,
    totalWords,
    totalChars,
    estimatedPages,
    volumeFulfillmentPercent,
    topicRelevanceScore,
    maxCrossSectionSimilarity: 0,
    duplicateSentencesFound,
    issues,
    cleanedText,
  };
}
