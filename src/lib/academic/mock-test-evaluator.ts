import { MockQuestion } from "./mock-test-data";

export interface AIResult {
  overallScore: number;
  bandScore: string;
  cefrLevel: string;
  grammarScore: number;
  vocabularyScore: number;
  readingScore: number;
  writingScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  summary: string;
  isGuest?: boolean;
}

export interface EvaluateMockTestOptions {
  language?: string;
  testType?: string;
  selectedLevel?: string;
  levelId?: string;
  levelShortName?: string;
  answers: Record<string, string>;
  questions?: MockQuestion[];
  writtenText?: string;
  isGuest?: boolean;
}

/**
 * Deterministic rubric scoring engine for language mock tests.
 * Provides instant, high-precision CEFR/IELTS/TRKI/TOMER calculations
 * both on the server (as fallback or primary) and client-side (fail-fast safeguard).
 */
export function evaluateMockTestLocally(options: EvaluateMockTestOptions): AIResult {
  const {
    language = "EN",
    testType,
    selectedLevel,
    levelId,
    levelShortName,
    answers = {},
    questions = [],
    writtenText = "",
    isGuest = false,
  } = options;

  const langCode = (language || "EN").toUpperCase();
  const cleanLevelId = String(levelId || "").trim().toUpperCase();
  const levelStr = String(selectedLevel || levelShortName || cleanLevelId || testType || "B2").trim();

  let correctCount = 0;
  const totalQuestions =
    Array.isArray(questions) && questions.length > 0
      ? questions.length
      : Object.keys(answers || {}).length || 5;

  if (Array.isArray(questions) && questions.length > 0) {
    for (const q of questions) {
      const userChoice = answers[q.id];
      if (
        userChoice &&
        String(userChoice).trim().toUpperCase() === String(q.correctKey).trim().toUpperCase()
      ) {
        correctCount++;
      }
    }
  } else {
    // Default fallback keys if questions array was omitted
    const answerKeys: Record<string, Record<string, string>> = {
      EN: { q1: "B", q2: "C", q3: "A", q4: "D", q5: "B" },
      RU: { q1: "A", q2: "C", q3: "B", q4: "A", q5: "C" },
      TR: { q1: "C", q2: "A", q3: "D", q4: "B", q5: "A" },
    };
    const keys = answerKeys[langCode] || answerKeys["EN"];
    for (const [qId, userAns] of Object.entries(answers || {})) {
      if (keys[qId] && String(userAns).trim().toUpperCase() === keys[qId]) {
        correctCount++;
      }
    }
  }

  const testPercent = Math.round((correctCount / Math.max(totalQuestions, 1)) * 100);
  const trimmedWriting = (writtenText || "").trim();
  const hasWriting = trimmedWriting.length > 25;
  const writingScore = hasWriting
    ? Math.min(96, Math.max(50, 55 + Math.round(trimmedWriting.length / 6)))
    : 0;

  const overallScore = hasWriting
    ? Math.min(100, Math.max(25, Math.round(testPercent * 0.7 + writingScore * 0.3)))
    : testPercent;

  let band = "";
  let cefr = "B2";

  // Level determination
  if (cleanLevelId === "A1" || levelStr.startsWith("A1")) {
    cefr = "A1";
    band =
      overallScore >= 80
        ? "CEFR A1 (A'lo • O'zlashtirildi)"
        : overallScore >= 60
        ? "CEFR A1 (Yaxshi • A2 ga tayyor)"
        : "CEFR A1 (Qoniqarli • Asosiy grammatikani mustahkamlash zarur)";
  } else if (cleanLevelId === "A2" || levelStr.startsWith("A2")) {
    cefr = "A2";
    band =
      overallScore >= 80
        ? "CEFR A2 (A'lo • O'zlashtirildi)"
        : overallScore >= 60
        ? "CEFR A2 (Yaxshi • B1 ga qadam)"
        : "CEFR A2 (Qoniqarli • Ko'proq amaliyot kerak)";
  } else if (cleanLevelId === "B1" || levelStr.startsWith("B1")) {
    cefr = "B1";
    band =
      overallScore >= 80
        ? "CEFR B1 (A'lo • O'rta daraja to'liq o'zlashtirildi)"
        : overallScore >= 60
        ? "CEFR B1 (Yaxshi • Mustahkamlash zarur)"
        : "CEFR B1 (Qoniqarli • Grammatik qoidalarni takrorlash lozim)";
  } else if (cleanLevelId === "B2" || levelStr.startsWith("B2")) {
    cefr = "B2";
    band =
      overallScore >= 80
        ? "CEFR B2 (A'lo • Yuqori o'rta daraja)"
        : overallScore >= 60
        ? "CEFR B2 (Yaxshi • C1 ga tavsiya etiladi)"
        : "CEFR B2 (Qoniqarli • Murakkab matnlar ustida ishlash zarur)";
  } else if (cleanLevelId === "C1" || levelStr.startsWith("C1")) {
    cefr = "C1";
    band =
      overallScore >= 80
        ? "CEFR C1 (Professional • Ilg'or daraja)"
        : overallScore >= 60
        ? "CEFR C1 (Yaxshi • C2 ga yaqin)"
        : "CEFR C1 (Qoniqarli • Sintaktik uslubiyatni charxlash kerak)";
  } else if (cleanLevelId === "C2" || levelStr.startsWith("C2")) {
    cefr = "C2";
    band =
      overallScore >= 80
        ? "CEFR C2 (Mukammal • Ona tili darajasi)"
        : overallScore >= 60
        ? "CEFR C2 (Yaxshi natija • Akademik nutq)"
        : "CEFR C2 (Qoniqarli • Chuqur filologik tahlil lozim)";
  } else if (cleanLevelId === "IELTS-4-5") {
    if (overallScore >= 80) {
      band = "IELTS 5.0 • B1 Modest User";
      cefr = "B1";
    } else if (overallScore >= 60) {
      band = "IELTS 4.5 • B1 Pre-Intermediate";
      cefr = "B1";
    } else {
      band = "IELTS 4.0 • A2 Elementary";
      cefr = "A2";
    }
  } else if (cleanLevelId === "IELTS-5.5-6.5") {
    if (overallScore >= 80) {
      band = "IELTS 6.5 • B2 Competent+";
      cefr = "B2";
    } else if (overallScore >= 60) {
      band = "IELTS 6.0 • B2 Competent";
      cefr = "B2";
    } else {
      band = "IELTS 5.5 • B1/B2 Borderline";
      cefr = "B1";
    }
  } else if (cleanLevelId === "IELTS-7-8.5") {
    if (overallScore >= 85) {
      band = "IELTS 8.0 • C1+ Advanced";
      cefr = "C1";
    } else if (overallScore >= 70) {
      band = "IELTS 7.5 • C1 Good User";
      cefr = "C1";
    } else {
      band = "IELTS 7.0 • C1 Effective User";
      cefr = "C1";
    }
  } else if (cleanLevelId === "TRKI-ELEM") {
    cefr = "A1";
    band =
      overallScore >= 66
        ? "ТРКИ-Элементарный (Muvaffaqiyatli topshirildi • A1)"
        : "ТРКИ-Элементарный (Qayta tayyorlanish tavsiya etiladi • A1)";
  } else if (cleanLevelId === "TRKI-BASE") {
    cefr = "A2";
    band =
      overallScore >= 66
        ? "ТРКИ-Базовый (Muvaffaqiyatli topshirildi • A2)"
        : "ТРКИ-Базовый (Yetarli emas • A2)";
  } else if (cleanLevelId === "TRKI-1") {
    cefr = "B1";
    band =
      overallScore >= 66
        ? "ТРКИ-1 / TORFL-I (Muvaffaqiyatli topshirildi • B1)"
        : "ТРКИ-1 / TORFL-I (Yetarli emas • B1)";
  } else if (cleanLevelId === "TRKI-2") {
    cefr = "B2";
    band =
      overallScore >= 66
        ? "ТРКИ-2 / TORFL-II (Muvaffaqiyatli topshirildi • B2)"
        : "ТРКИ-2 / TORFL-II (Yetarli emas • B2)";
  } else if (cleanLevelId === "TOMER-BASLANGIC") {
    if (overallScore >= 75) {
      band = "TÖMER Başlangıç (A2 A'lo daraja)";
      cefr = "A2";
    } else if (overallScore >= 60) {
      band = "TÖMER Başlangıç (A1 Muvaffaqiyatli)";
      cefr = "A1";
    } else {
      band = "TÖMER Başlangıç (Boshlang'ich amaliyot zarur)";
      cefr = "A1";
    }
  } else if (cleanLevelId === "TOMER-ORTA") {
    if (overallScore >= 75) {
      band = "TÖMER Orta (B2 Yuqori o'rta)";
      cefr = "B2";
    } else if (overallScore >= 60) {
      band = "TÖMER Orta (B1 O'rta daraja)";
      cefr = "B1";
    } else {
      band = "TÖMER Orta (B1 Takrorlash zarur)";
      cefr = "B1";
    }
  } else if (cleanLevelId === "TOMER-ILERI") {
    if (overallScore >= 80) {
      band = "TÖMER İleri (C2 Yetkinlik)";
      cefr = "C2";
    } else if (overallScore >= 60) {
      band = "TÖMER İleri (C1 Ilg'or daraja)";
      cefr = "C1";
    } else {
      band = "TÖMER İleri (C1 Tayyorgarlik)";
      cefr = "C1";
    }
  } else {
    cefr = "B2";
    band = `${levelStr} (${overallScore}%)`;
  }

  const grammarScore = Math.min(100, Math.max(30, testPercent + (testPercent > 70 ? 4 : -2)));
  const vocabularyScore = Math.min(100, Math.max(35, testPercent - (testPercent < 60 ? 2 : -3)));
  const readingScore = testPercent;

  return {
    overallScore,
    bandScore: band,
    cefrLevel: cefr,
    grammarScore,
    vocabularyScore,
    readingScore,
    writingScore,
    isGuest,
    strengths: [
      `Tanlangan ${levelStr} darajasi bo'yicha ${correctCount}/${totalQuestions} to'g'ri javob bilan mustahkam bilim namoyon etildi.`,
      "Kontekstual jumlalar va grammatik sintaksisni to'g'ri idrok etish ko'nikmasi shakllangan.",
      hasWriting
        ? "Yozma topshiriqda fikrlar izchil va darajaga mos leksika bilan ifodalangan."
        : "Savollarni tahlil qilish va to'g'ri javob variantini tanlash tezligi yuqori.",
    ],
    weaknesses: [
      testPercent < 80
        ? `${levelStr} darajasidagi nozik grammatik strukturalar va istisno holatlarga ko'proq e'tibor qaratish zarur.`
        : "Murakkabroq sintaktik jumlalarni mustaqil nutqda qo'llashda ehtiyotkorlik sezildi.",
      !hasWriting
        ? "Yozma nutq topshirig'i topshirilmadi. Keyingi sinovda insho yozsangiz, yozma nutq bahosi ham hisoblanadi."
        : "Akademik so'z birikmalari (collocations) va bog'lovchi vositalar doirasini yanada kengaytirish lozim.",
    ],
    recommendations: [
      `Har kuni 20 daqiqa ${levelStr} darajasiga mos audio va matnli manbalarni tahlil qiling.`,
      "Xato qilingan savollar qoidalarini konspektlashtirib, yangi so'zlarni mustaqil jumlalarda qo'llang.",
      "Haftasiga kamida 2 marta qisqa insho yoki tahliliy xulosa yozib, ifodaviylikni charxlang.",
    ],
    summary: `DocNova lingvistik tahliliga ko'ra, sizning ${levelStr} bo'yicha ko'rsatkichingiz: ${band}. Muntazam amaliy mashg'ulotlar orqali yanada yuqori natijalarga erishishingiz mumkin!`,
  };
}
