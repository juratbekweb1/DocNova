/**
 * DOCNOVA — Academic Sample Document Intelligence & PII Isolation Engine
 *
 * Vazifasi:
 * 1. Yuklangan namuna faylni (.docx, .pdf, .txt) xavfsiz tekshirish (magic bytes, hajm, MIME).
 * 2. Hujjat ichidagi prompt-injection va zararli buyruqlarni neytrallash.
 * 3. Namunadan tuzilmani (hujjat turi, boblar, kichik bo'limlar, kirish, xulosa, adabiyotlar, til, taxminiy bet) aniqlash.
 * 4. SHAXSIY MA'LUMOTLARNI AJRATISH (PII Isolation): Namunadagi eski talaba ismi, guruh, rahbar, OTM va eski mavzuni
 *    aniqlab, ularni yangi hujjat matniga ko'chib ketishdan bloklash.
 * 5. Yangi hujjat generatsiyasi uchun faqat "Tuzilma qolipi" (Structural Blueprint) yaratish.
 * 6. "Noldan yaratish" rejimida tabiiy tildagi so'rovlarni ("Menga marketing fanidan raqamli marketing haqida 20 betlik kurs ishi kerak") tahlil qilish.
 */

export type ConfidenceStatus = "Aniqlandi" | "Tekshirish kerak" | "Aniqlanmadi";

export interface DetectedField<T = string> {
  value: T;
  status: ConfidenceStatus;
}

export interface IsolatedSampleMetadata {
  oldStudentName: string | null;
  oldTeacherName: string | null;
  oldUniversity: string | null;
  oldFaculty: string | null;
  oldGroup: string | null;
  oldTopic: string | null;
  oldSubject: string | null;
  oldYear: string | null;
}

export interface DetectedSampleStructure {
  hasTitlePage: boolean;
  hasToc: boolean;
  hasIntroduction: boolean;
  hasConclusion: boolean;
  hasReferences: boolean;
  hasTables: boolean;
  hasAppendices: boolean;
  chapters: Array<{
    title: string;
    subsections: string[];
  }>;
  referencesCount: number;
  headingHierarchySummary: string;
}

export interface SampleDocumentAnalysis {
  fileName: string;
  fileSize: number;
  charCount: number;
  wordCount: number;
  estimatedPages: number;
  language: DetectedField<"uz" | "ru" | "uz-cyrl">;
  documentType: DetectedField<
    | "Kurs ishi"
    | "Mustaqil ish"
    | "Bakalavr Bitiruv Malakaviy Ishi (BMI)"
    | "Magistrlik Dissertatsiyasi"
    | "Referat"
    | "Ilmiy maqola / Tezis"
  >;
  subject: DetectedField<string>;
  sampleTopic: DetectedField<string>;
  structureSummary: string;
  structure: DetectedSampleStructure;
  /**
   * Namunadan ajratib olingan eski shaxsiy/titul ma'lumotlari.
   * QAT'IY QOIDA: Bular yangi hujjatga avtomatik ko'chirilmaydi!
   */
  isolatedOldMetadata: IsolatedSampleMetadata;
  /**
   * AI generatorga uzatiladigan TOZALANGAN tuzilma qolipi (eski ism, rahbar va eski mavzu matnisiz).
   */
  structuralBlueprint: string;
}

const DANGEROUS_EXTENSIONS = [
  ".exe",
  ".bat",
  ".cmd",
  ".sh",
  ".php",
  ".js",
  ".mjs",
  ".cjs",
  ".vbs",
  ".zip",
  ".tar",
  ".gz",
  ".rar",
  ".7z",
  ".py",
  ".jar",
  ".msi",
  ".scr",
  ".dll",
  ".com",
  ".ps1",
  ".html",
  ".htm",
  ".svg",
];

const ALLOWED_EXTENSIONS = [".docx", ".pdf", ".txt"];

export const MAX_SAMPLE_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Fayl nomini xavfsiz tozalash (Path traversal va maxsus belgilardan himoya)
 */
export function sanitizeSafeFileName(rawName: string): string {
  const base = (rawName || "namuna_fayl").replace(/\\/g, "/").split("/").pop() || "namuna_fayl";
  return base.replace(/[\x00-\x1F\x7F<>:"|?*]/g, "_").slice(0, 180);
}

/**
 * Server va kliyent uchun fayl formati, hajmi va Magic Bytes (haqiqiy fayl imzosi) tekshiruvi
 */
export function validateSampleFileBuffer(params: {
  fileName: string;
  fileSize: number;
  mimeType?: string;
  buffer: Buffer | Uint8Array;
  maxSizeBytes?: number;
}): { valid: true; ext: ".docx" | ".pdf" | ".txt" } | { valid: false; error: string } {
  const maxBytes = params.maxSizeBytes ?? MAX_SAMPLE_FILE_BYTES;
  const safeName = sanitizeSafeFileName(params.fileName);
  const lowerName = safeName.toLowerCase();

  if (params.fileSize <= 0 || params.buffer.byteLength <= 0) {
    return {
      valid: false,
      error:
        "Yuklangan fayl bo'sh (0 bayt). Iltimos, matni bor boshqa fayl tanlang yoki noldan yarating.",
    };
  }

  if (params.fileSize > maxBytes || params.buffer.byteLength > maxBytes) {
    const mb = (maxBytes / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `Fayl hajmi ruxsat etilgan me'yordan (${mb} MB) katta. Kichikroq fayl yuklang.`,
    };
  }

  for (const danger of DANGEROUS_EXTENSIONS) {
    if (lowerName.endsWith(danger)) {
      return {
        valid: false,
        error: `Xavfsizlik cheklovi: «${danger}» formatidagi fayllar qabul qilinmaydi. Faqat .DOCX, .PDF yoki .TXT yuklang.`,
      };
    }
  }

  const matchedExt = ALLOWED_EXTENSIONS.find((ext) => lowerName.endsWith(ext)) as
    ".docx" | ".pdf" | ".txt" | undefined;

  if (!matchedExt) {
    return {
      valid: false,
      error:
        "Qo'llab-quvvatlanmaydigan fayl formati. Faqat .DOCX, .PDF va .TXT fayllarni yuklash mumkin.",
    };
  }

  const bytes = params.buffer;

  // 1. MZ (Windows Executable) yoki ELF imzosini darhol bloklash
  if (
    (bytes.byteLength >= 2 && bytes[0] === 0x4d && bytes[1] === 0x5a) || // MZ (.exe/.dll)
    (bytes.byteLength >= 4 &&
      bytes[0] === 0x7f &&
      bytes[1] === 0x45 &&
      bytes[2] === 0x4c &&
      bytes[3] === 0x46) // ELF binary
  ) {
    return {
      valid: false,
      error: "Fayl tarkibi xavfsizlik tekshiruvidan o'tmadi (bajariluvchi dastur kodi aniqlandi).",
    };
  }

  // 2. .PDF magic bytes tekshiruvi: "%PDF-" (0x25 0x50 0x44 0x46 0x2D)
  if (matchedExt === ".pdf") {
    const headerStr = Buffer.from(bytes.slice(0, 8)).toString("ascii");
    if (!headerStr.startsWith("%PDF-")) {
      return {
        valid: false,
        error:
          "Fayl haqiqiy PDF hujjat emas yoki shikastlangan. Iltimos, to'g'ri PDF yoki DOCX yuklang.",
      };
    }
    // Parol bilan himoyalangan (/Encrypt) PDF ni tekshirish
    const sampleChunk = Buffer.from(bytes.slice(0, Math.min(bytes.byteLength, 65536))).toString(
      "latin1"
    );
    if (/\/Encrypt\b/.test(sampleChunk)) {
      return {
        valid: false,
        error:
          "Ushbu PDF fayl parol bilan himoyalangan. Iltimos, parolsiz PDF/DOCX yuklang yoki «Noldan yaratish» rejimidan foydalaning.",
      };
    }
  }

  // 3. .DOCX magic bytes tekshiruvi: PK\x03\x04 (OpenXML ZIP konteyneri)
  if (matchedExt === ".docx") {
    if (
      bytes.byteLength < 4 ||
      bytes[0] !== 0x50 ||
      bytes[1] !== 0x4b ||
      bytes[2] !== 0x03 ||
      bytes[3] !== 0x04
    ) {
      // Ba'zan foydalanuvchi eski .doc (OLE2 D0 CF 11 E0) fayl nomini .docx qilib yuklaydi
      if (
        bytes.byteLength >= 4 &&
        bytes[0] === 0xd0 &&
        bytes[1] === 0xcf &&
        bytes[2] === 0x11 &&
        bytes[3] === 0xe0
      ) {
        return {
          valid: false,
          error:
            "Bu eski Word 97-2003 (.doc) formatidagi fayl. Iltimos, uni zamonaviy .docx formatida saqlab yuklang.",
        };
      }
      return {
        valid: false,
        error: "DOCX fayl shikastlangan yoki haqiqiy Word (.docx) hujjati emas.",
      };
    }
  }

  // 4. .TXT binary/null-byte tekshiruvi
  if (matchedExt === ".txt") {
    const checkLen = Math.min(bytes.byteLength, 4096);
    let nullCount = 0;
    for (let i = 0; i < checkLen; i++) {
      if (bytes[i] === 0x00) nullCount++;
    }
    if (nullCount > 2) {
      return {
        valid: false,
        error: "Matnli (.txt) fayl ichida noto'g'ri ikkilik (binary) ma'lumotlar aniqlandi.",
      };
    }
  }

  return { valid: true, ext: matchedExt };
}

/**
 * Hujjat ichidagi matnni Prompt-Injection va XSS'dan tozalash.
 * Foydalanuvchi yuklagan fayl ichidagi AI buyruqlari ("Ignore all previous instructions", "System prompt:")
 * tizim buyrug'i sifatida bajarilmasligini kafolatlaydi.
 */
export function sanitizeUntrustedSampleText(raw: string): string {
  if (!raw) return "";
  return (
    raw
      .replace(/\0/g, "")
      // Script va HTML teglarni olib tashlash
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/\bon\w+\s*=/gi, "")
      // Prompt injection iboralarini zararsizlantirish
      .replace(
        /\b(ignore\s+(all\s+)?(previous|prior|above)\s+instructions?|system\s*prompt\s*:|you\s+are\s+now\s+a|forget\s+everything|disregard\s+all\s+rules)\b/gi,
        "[neytrallangan_matn]"
      )
      .replace(/\r\n/g, "\n")
      .replace(/\n{4,}/g, "\n\n\n")
      .trim()
  );
}

/**
 * Matn tilini aniqlash (O'zbek lotin, O'zbek kirill, Rus)
 */
function detectLanguage(text: string): DetectedField<"uz" | "ru" | "uz-cyrl"> {
  const sample = text.slice(0, 4000).toLowerCase();
  const cyrillicMatches = sample.match(/[а-яёўқғҳ]/gi) || [];
  const latinMatches = sample.match(/[a-z]/gi) || [];

  if (cyrillicMatches.length > latinMatches.length) {
    // O'zbek kirill harflari (ў, қ, ғ, ҳ) bormi yoki rus tili?
    const uzCyrlChars = sample.match(/[ўқғҳ]/gi) || [];
    const ruKeywords =
      /\b(введение|глава|заключение|список\s+литературы|министерство|выполнил|работа)\b/i.test(
        sample
      );
    if (uzCyrlChars.length >= 3 && !ruKeywords) {
      return { value: "uz-cyrl", status: "Aniqlandi" };
    }
    return { value: "ru", status: "Aniqlandi" };
  }

  if (latinMatches.length > 50) {
    return { value: "uz", status: "Aniqlandi" };
  }

  return { value: "uz", status: "Tekshirish kerak" };
}

/**
 * Namunadan hujjat turini aniqlash
 */
function detectDocumentType(
  text: string,
  wordCount: number
): SampleDocumentAnalysis["documentType"] {
  const header = text.slice(0, 2500);

  if (/magistrlik\s+dissertatsiya|магистерск(ая|ой)\s+диссертац/i.test(header)) {
    return { value: "Magistrlik Dissertatsiyasi", status: "Aniqlandi" };
  }
  if (
    /bitiruv\s+malakaviy\s+ish|diplom\s+ish|дипломн(ая|ой)\s+работ|выпускн(ая|ой)\s+квалификационн|\bBMI\b|\bВКР\b/i.test(
      header
    )
  ) {
    return { value: "Bakalavr Bitiruv Malakaviy Ishi (BMI)", status: "Aniqlandi" };
  }
  if (/kurs\s+ishi|курсов(ая|ой)\s+работ/i.test(header)) {
    return { value: "Kurs ishi", status: "Aniqlandi" };
  }
  if (/mustaqil\s+ish|самостоятельн(ая|ой)\s+работ/i.test(header)) {
    return { value: "Mustaqil ish", status: "Aniqlandi" };
  }
  if (/\breferat\b|реферат/i.test(header)) {
    return { value: "Referat", status: "Aniqlandi" };
  }
  if (/maqola|tezis|статья|тезис/i.test(header)) {
    return { value: "Ilmiy maqola / Tezis", status: "Tekshirish kerak" };
  }

  // Agar sarlavhada yozilmagan bo'lsa, hajmi va boblari bo'yicha taxmin qilish ("Tekshirish kerak")
  if (wordCount > 9000) {
    return { value: "Bakalavr Bitiruv Malakaviy Ishi (BMI)", status: "Tekshirish kerak" };
  }
  if (wordCount >= 3200) {
    return { value: "Kurs ishi", status: "Tekshirish kerak" };
  }
  return { value: "Referat", status: "Tekshirish kerak" };
}

/**
 * Namunadagi eski shaxsiy ma'lumotlarni (PII) va titul ma'lumotlarini ajratib olish
 */
export function extractIsolatedOldMetadata(text: string): IsolatedSampleMetadata {
  const head = text.slice(0, 3500);
  const lines = head
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  let oldStudentName: string | null = null;
  let oldTeacherName: string | null = null;
  let oldUniversity: string | null = null;
  let oldFaculty: string | null = null;
  let oldGroup: string | null = null;
  let oldTopic: string | null = null;
  let oldSubject: string | null = null;
  let oldYear: string | null = null;

  for (let i = 0; i < Math.min(lines.length, 45); i++) {
    const line = lines[i].replace(/\*\*/g, "").trim();

    // OTM
    if (
      !oldUniversity &&
      /(universiteti|instituti|akademiyasi|университет|институт|академия)/i.test(line) &&
      !/vazirligi|министерство/i.test(line) &&
      line.length < 160
    ) {
      oldUniversity = line;
    }

    // Fakultet / Kafedra
    if (!oldFaculty && /(fakultet|kafedra|факультет|кафедра)/i.test(line) && line.length < 150) {
      oldFaculty =
        line.replace(/^(fakultet|kafedra|факультет|кафедра)\s*[:\-]?\s*/i, "").trim() || line;
    }

    // Guruh
    const groupMatch = line.match(
      /(?:guruh|kurs\s+guruhi|группа)\s*[:\-]?\s*([A-Za-z0-9\-_/\s]{2,25})/i
    );
    if (!oldGroup && groupMatch) {
      oldGroup = groupMatch[1].trim();
    } else if (!oldGroup && /\b\d{2,4}[-\s]?[a-zA-Zа-яА-Я]{1,4}\s+guruh/i.test(line)) {
      oldGroup = line.slice(0, 40);
    }

    // Bajaruvchi / Talaba F.I.Sh.
    const studentMatch = line.match(
      /(?:bajaruvchi|bajardi|talaba|tayyorladi|выполнил(?:а)?|студент(?:ка)?)\s*[:\-]?\s*(.+)$/i
    );
    if (!oldStudentName && studentMatch && studentMatch[1].trim().length >= 3) {
      oldStudentName = studentMatch[1].trim().slice(0, 90);
    }

    // Ilmiy rahbar / O'qituvchi
    const teacherMatch = line.match(
      /(?:ilmiy\s+rahbar|rahbar|tekshirdi|o'qituvchi|o‘qituvchi|научный\s+руководитель|проверил(?:а)?|преподаватель)\s*[:\-]?\s*(.+)$/i
    );
    if (!oldTeacherName && teacherMatch && teacherMatch[1].trim().length >= 3) {
      oldTeacherName = teacherMatch[1].trim().slice(0, 90);
    }

    // Fan
    const subjectMatch = line.match(
      /(?:fan|fani|fanidan|дисциплина|предмет|по\s+дисциплине|по\s+предмету)\s*[:\-]?\s*[«"']?([^»"'\n]{3,110})[»"']?/i
    );
    if (!oldSubject && subjectMatch) {
      oldSubject = subjectMatch[1].trim();
    } else if (!oldSubject && /«([^»]{3,80})»\s*fanidan/i.test(line)) {
      const m = line.match(/«([^»]{3,80})»\s*fanidan/i);
      if (m) oldSubject = m[1].trim();
    }

    // Mavzu
    const topicMatch = line.match(
      /(?:mavzu|на\s+тему|тема)\s*[:\-]?\s*[«"']?([^»"'\n]{5,200})[»"']?/i
    );
    if (!oldTopic && topicMatch) {
      oldTopic = topicMatch[1].trim();
    } else if (!oldTopic && /[«"]([^»"]{8,180})[»"]\s*mavzusida/i.test(line)) {
      const m = line.match(/[«"]([^»"]{8,180})[»"]\s*mavzusida/i);
      if (m) oldTopic = m[1].trim();
    }

    // Yil
    const yearMatch = line.match(/\b(20[12]\d)\b/);
    if (!oldYear && yearMatch) {
      oldYear = yearMatch[1];
    }
  }

  return {
    oldStudentName,
    oldTeacherName,
    oldUniversity,
    oldFaculty,
    oldGroup,
    oldTopic,
    oldSubject,
    oldYear,
  };
}

/**
 * Hujjat tuzilmasini (Kirish, Boblar, Kichik bo'limlar, Xulosa, Adabiyotlar, Jadvallar) tahlil qilish
 */
export function extractSampleStructure(text: string): DetectedSampleStructure {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const headChunk = text.slice(0, 3000);
  const hasTitlePage =
    /(vazirligi|universiteti|instituti|bajaruvchi|ilmiy\s+rahbar|министерство|университет|выполнил)/i.test(
      headChunk
    );
  const hasToc = /(mundarija|reja|содержание|оглавление|\.\s*\.\s*\.\s*\d+)/i.test(
    text.slice(0, 6000)
  );
  const hasIntroduction = /\b(kirish|введение|кириш)\b/i.test(text);
  const hasConclusion = /\b(xulosa|заключение|хулоса)\b/i.test(text);
  const hasReferences =
    /(foydalanilgan\s+adabiyot|adabiyotlar\s+ro'yxati|adabiyotlar|manbalar|список\s+использованной\s+литературы|список\s+литературы)/i.test(
      text
    );
  const hasTables = /(\d+[-\s]*jadval|таблица\s*№?\s*\d+|\|.+\|.+\|)/i.test(text);
  const hasAppendices = /\b(ilova|ilovalar|приложение|приложения)\b/i.test(text);

  const chaptersMap = new Map<string, { title: string; subsections: string[] }>();
  let currentChapterKey: string | null = null;

  for (const rawLine of lines) {
    const clean = rawLine
      .replace(/^#{1,4}\s*/, "")
      .replace(/\s*(?:[\.·…\-]\s*){2,}\s*\d+\s*$/, "") // TOC nuqtalarini olib tashlash
      .replace(/\*\*/g, "")
      .trim();

    if (clean.length < 4 || clean.length > 160) continue;

    // Bob sarlavhasi: "I BOB. ...", "1-BOB. ...", "ГЛАВА 1. ...", "ГЛАВА I. ..."
    const chapterMatch = clean.match(
      /^(?:([I|V|X]{1,4}|\d)\s*[-\s]?\s*(?:BOB|БОБ)|(?:ГЛАВА|BOB)\s*([I|V|X]{1,4}|\d))[\.\:\-\s]+(.+)$/i
    );
    if (chapterMatch) {
      const chNum = (chapterMatch[1] || chapterMatch[2] || "1").toUpperCase();
      const chTitle = chapterMatch[3].trim();
      const key = `CH_${chNum}`;
      if (!chaptersMap.has(key)) {
        chaptersMap.set(key, {
          title: `${chNum} BOB. ${chTitle}`,
          subsections: [],
        });
      }
      currentChapterKey = key;
      continue;
    }

    // Paragraf / kichik bo'lim: "1.1. ...", "2.3. ..."
    const subMatch = clean.match(/^([1-5])\.([1-6])[\.\)\s]+(.+)$/);
    if (subMatch) {
      const major = subMatch[1];
      const minor = subMatch[2];
      const subTitle = subMatch[3].trim();
      // Agar bu adabiyot qatori yoki oddiy raqam bo'lmasa
      if (subTitle.length >= 5 && !/^\d/.test(subTitle)) {
        const romanMap: Record<string, string> = {
          "1": "I",
          "2": "II",
          "3": "III",
          "4": "IV",
          "5": "V",
        };
        const roman = romanMap[major] || major;
        const key =
          currentChapterKey && chaptersMap.has(currentChapterKey)
            ? currentChapterKey
            : `CH_${roman}`;

        if (!chaptersMap.has(key)) {
          chaptersMap.set(key, {
            title: `${roman} BOB`,
            subsections: [],
          });
        }
        const ch = chaptersMap.get(key)!;
        const formattedSub = `${major}.${minor}. ${subTitle}`;
        if (!ch.subsections.includes(formattedSub) && ch.subsections.length < 6) {
          ch.subsections.push(formattedSub);
        }
      }
    }
  }

  // Adabiyotlar sonini taxminiy sanash
  let referencesCount = 0;
  const refSectionMatch = text.match(
    /(?:foydalanilgan\s+adabiyotlar|adabiyotlar\s+ro'yxati|список\s+использованной\s+литературы|список\s+литературы)([\s\S]{50,8000})$/i
  );
  if (refSectionMatch) {
    const refLines = refSectionMatch[1]
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => /^\d+[\.\)]\s+.{10,}/.test(l));
    referencesCount = refLines.length;
  }

  const chapters = Array.from(chaptersMap.values());

  const parts: string[] = [];
  if (hasTitlePage) parts.push("Titul varaq");
  if (hasToc) parts.push("Mundarija");
  if (hasIntroduction) parts.push("Kirish");
  if (chapters.length > 0) {
    parts.push(`${chapters.length} ta bob`);
  } else {
    parts.push("Asosiy qism");
  }
  if (hasTables) parts.push("Jadvallar");
  if (hasConclusion) parts.push("Xulosa");
  if (hasReferences) {
    parts.push(referencesCount > 0 ? `Adabiyotlar (${referencesCount} ta)` : "Adabiyotlar");
  }

  return {
    hasTitlePage,
    hasToc,
    hasIntroduction,
    hasConclusion,
    hasReferences,
    hasTables,
    hasAppendices,
    chapters,
    referencesCount,
    headingHierarchySummary: parts.join(", "),
  };
}

/**
 * SHAXSIY MA'LUMOTLARDAN VA ESKI MAVZUDAN TOZALANGAN "STRUCTURAL BLUEPRINT" YARATISH (5 va 6-bo'lim qoidalari).
 *
 * Bu funksiya AI generatorga namuna faylning ichidagi eski ism-familiya, rahbar va eski mavzu matnini
 * YUBORMAYDI. Faqat hujjatning arxitekturasi (necha bob, har bobda nechta paragraf, kirish/xulosa formati,
 * jadval va adabiyotlar uslubi) haqida xavfsiz qolip beradi.
 */
export function buildPrivacySafeStructuralBlueprint(params: {
  structure: DetectedSampleStructure;
  estimatedPages: number;
  detectedType: string;
}): string {
  const { structure, estimatedPages, detectedType } = params;
  const chapterCount = structure.chapters.length;

  const chapterPatternLines =
    chapterCount > 0
      ? structure.chapters.map(
          (ch, idx) =>
            `- ${idx + 1}-bob tuzilmasi: ${ch.subsections.length || 3} ta kichik bo'lim (paragraf) dan iborat.`
        )
      : ["- Asosiy qism: Mantiqiy ketma-ketlikda 3 ta bob (har birida 2-3 tadan paragraf)."];

  return [
    `[NAMUNA HUJJATNING TUZILMA VA FORMAT QOLIPI — SHAXSIY MA'LUMOTLARDAN TOZALANGAN]`,
    `- Namuna hujjat shakli: ${detectedType} (~${estimatedPages} sahifa maketi)`,
    `- Qismlar ketma-ketligi: ${structure.headingHierarchySummary}`,
    `- Kirish qismi: ${structure.hasIntroduction ? "Mavjud (dolzarblik, maqsad va vazifalar bloki bilan)" : "Standart akademik kirish talab etiladi"}`,
    ...chapterPatternLines,
    `- Jadval va tahliliy uslub: ${structure.hasTables ? "Amaliy bobda qiyosiy tahliliy jadval mavjud" : "Matnli-tahliliy uslub"}`,
    `- Xulosa qismi: ${structure.hasConclusion ? "Mavjud (umumlashtirilgan xulosalar va amaliy tavsiyalar)" : "Standart xulosa"}`,
    `- Adabiyotlar formati: GOST bo'yicha raqamlangan ro'yxat (${structure.referencesCount > 0 ? `namunada ~${structure.referencesCount} ta manba` : "standart OTM ro'yxati"}).`,
    `QAT'IY QOIDA: Yuqoridagi qolipdan FAQAT tuzilma, sarlavha iyerarxiyasi va formatlash uslubi olinsin. Barcha matn, tahlillar va dalillar 100% FOYDALANUVCHI TASDIQLAGAN YANGI MAVZU va YANGI SHAXSIY MA'LUMOTLAR asosida yozilsin!`,
  ].join("\n");
}

/**
 * Asosiy tahlil funksiyasi: matndan to'liq `SampleDocumentAnalysis` qaytaradi
 */
export function analyzeSampleDocument(params: {
  rawText: string;
  fileName: string;
  fileSize: number;
}): SampleDocumentAnalysis {
  const sanitized = sanitizeUntrustedSampleText(params.rawText);
  const words = sanitized.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  // GOST A4 (Times New Roman 14pt, 1.5 interval) da 1 bet ~ 260-270 so'z
  const estimatedPages = Math.max(1, Math.round(wordCount / 265));

  const language = detectLanguage(sanitized);
  const documentType = detectDocumentType(sanitized, wordCount);
  const isolatedOldMetadata = extractIsolatedOldMetadata(sanitized);
  const structure = extractSampleStructure(sanitized);

  const subjectField: DetectedField<string> = isolatedOldMetadata.oldSubject
    ? { value: isolatedOldMetadata.oldSubject, status: "Aniqlandi" }
    : { value: "", status: "Aniqlanmadi" };

  const topicField: DetectedField<string> = isolatedOldMetadata.oldTopic
    ? { value: isolatedOldMetadata.oldTopic, status: "Aniqlandi" }
    : { value: "", status: "Tekshirish kerak" };

  const structuralBlueprint = buildPrivacySafeStructuralBlueprint({
    structure,
    estimatedPages,
    detectedType: documentType.value,
  });

  return {
    fileName: sanitizeSafeFileName(params.fileName),
    fileSize: params.fileSize,
    charCount: sanitized.length,
    wordCount,
    estimatedPages,
    language,
    documentType,
    subject: subjectField,
    sampleTopic: topicField,
    structureSummary: structure.headingHierarchySummary,
    structure,
    isolatedOldMetadata,
    structuralBlueprint,
  };
}

/**
 * 3.B-BO'LIM: "Noldan yaratish" rejimida foydalanuvchining oddiy tildagi gapidan
 * fan, mavzu, sahifa soni va ish turini ajratib olish.
 *
 * Misol: "Menga marketing fanidan raqamli marketing haqida 20 betlik kurs ishi kerak."
 * -> { subject: "Marketing", topic: "Raqamli marketing", pageCount: "20", workType: "Kurs ishi", missingFields: [] }
 */
export interface ParsedNaturalAcademicPrompt {
  topic?: string;
  subject?: string;
  pageCount?: string;
  workType?: "Kurs ishi" | "Mustaqil ish" | "Referat" | "Bakalavr Bitiruv Malakaviy Ishi (BMI)";
  language?: "uz" | "ru";
  missingFields: Array<"topic" | "subject">;
}

export function parseNaturalAcademicRequest(rawInput: string): ParsedNaturalAcademicPrompt {
  const input = (rawInput || "").trim();
  if (!input) {
    return { missingFields: ["topic", "subject"] };
  }

  let pageCount: string | undefined;
  let subject: string | undefined;
  let topic: string | undefined;
  let workType: ParsedNaturalAcademicPrompt["workType"];
  let language: "uz" | "ru" | undefined;

  // 1. Sahifa soni: "20 betlik", "25 bet", "30 sahifa", "15 стр"
  const pageMatch = input.match(
    /\b(\d{1,3})\s*[-\s]?(?:bet(?:lik)?|sahifa(?:lik)?|стр(?:аниц)?)\b/i
  );
  if (pageMatch) {
    const num = Math.min(500, Math.max(3, parseInt(pageMatch[1], 10)));
    pageCount = String(num);
  }

  // 2. Ish turi
  if (/diplom|bmi|bitiruv\s+malakaviy|диплом/i.test(input)) {
    workType = "Bakalavr Bitiruv Malakaviy Ishi (BMI)";
  } else if (/mustaqil\s+ish|самостоятельн/i.test(input)) {
    workType = "Mustaqil ish";
  } else if (/\breferat\b|реферат/i.test(input)) {
    workType = "Referat";
  } else if (/kurs\s+ishi|курсов/i.test(input)) {
    workType = "Kurs ishi";
  }

  // 3. Til
  if (/rus\s+tilida|на\s+русском|[а-яё]{5,}/i.test(input)) {
    language = "ru";
  }

  // 4. Fan: "... fanidan" yoki "по предмету ..."
  const subjMatch = input.match(
    /(?:menga\s+|bizga\s+)?([a-zA-Z0-9\u0400-\u04FF'‘`ʻ\s\-]{3,60}?)\s+fanidan\b/i
  );
  if (subjMatch) {
    const cleanSubj = subjMatch[1].replace(/^(menga|bizga|iltimos|tezkor)\s+/i, "").trim();
    if (cleanSubj.length >= 2) {
      subject = cleanSubj.charAt(0).toUpperCase() + cleanSubj.slice(1);
    }
  }

  // 5. Mavzu: "... haqida" yoki "... mavzusida" yoki qolgan mazmunli qism
  const working = input
    .replace(/^(menga|bizga|iltimos)\s+/i, "")
    .replace(/\b([a-zA-Z0-9\u0400-\u04FF'‘`ʻ\s\-]{3,60}?)\s+fanidan\b/i, "")
    .replace(/\b\d{1,3}\s*[-\s]?(?:bet(?:lik)?|sahifa(?:lik)?|стр(?:аниц)?)\b/gi, "")
    .replace(
      /\b(kurs\s+ishi|mustaqil\s+ish|referat|diplom\s+ishi|bitiruv\s+malakaviy\s+ishi|bmi)\b/gi,
      ""
    )
    .replace(/\b(kerak|tayyorlab\s+ber(?:ing)?|yozib\s+ber(?:ing)?|yaratib\s+ber(?:ing)?)\b/gi, "")
    .replace(/\b(haqida|mavzusida|bo'yicha|bo‘yicha)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/^[,\.\-\s]+|[,\.\-\s]+$/g, "")
    .trim();

  if (working.length >= 4) {
    topic = working.charAt(0).toUpperCase() + working.slice(1);
  }

  const missingFields: Array<"topic" | "subject"> = [];
  if (!topic) missingFields.push("topic");
  if (!subject) missingFields.push("subject");

  return {
    topic,
    subject,
    pageCount,
    workType,
    language,
    missingFields,
  };
}
