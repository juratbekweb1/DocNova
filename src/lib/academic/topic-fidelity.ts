import type { ParsedTopic } from "./topic-parser";

export type AcademicLanguage = "uz" | "uz-cyrl" | "ru" | "en";

export interface TopicKeywordProfile {
  titleKeywords: string[];
  noteKeywords: string[];
  subjectKeywords: string[];
  numericOrFormulaTokens: string[];
}

export interface WorkFidelityEvaluationInput {
  topicTitle: string;
  subject?: string;
  notes?: string;
  generatedText: string;
  expectedLanguage: AcademicLanguage;
  expectedMinWords?: number;
}

export interface WorkFidelityEvaluation {
  isOnTopic: boolean;
  relevanceScore: number;
  wordCount: number;
  detectedLanguage: AcademicLanguage;
  languageMatches: boolean;
  isTooShortOrStub: boolean;
  isFallbackLike: boolean;
  titleKeywordCoverage: number;
  noteKeywordCoverage: number;
  matchedTitleKeywords: string[];
  missingTitleKeywords: string[];
  matchedNoteKeywords: string[];
  missingNoteKeywords: string[];
  issues: string[];
}

export const IMAGE_TOPICS_CONTEXT_MARKER = "[RASMDAN OLINGAN MAVZU VA TALABLAR]";

const SHORT_TECHNICAL_TOKENS = new Set([
  "ai",
  "it",
  "ml",
  "dl",
  "nlp",
  "llm",
  "cv",
  "vr",
  "ar",
  "ui",
  "ux",
  "db",
  "os",
  "io",
  "ip",
  "tcp",
  "dns",
  "http",
  "rest",
  "api",
  "sql",
  "nosql",
  "orm",
  "jwt",
  "sso",
  "qc",
  "ph",
  "c++",
  "c#",
  ".net",
  "go",
  "js",
  "ts",
  "2d",
  "3d",
  "4g",
  "5g",
  "bmi",
  "otm",
  "qqs",
  "yaid",
  "gdp",
  "cpi",
  "roi",
  "kpi",
  "roe",
  "roa",
  "dna",
  "rnk",
  "dnk",
  "rna",
  "atp",
  "co2",
  "h2o",
  "lsd",
]);

const GENERIC_ACADEMIC_STOPWORDS = new Set([
  // Uzbek Latin
  "va",
  "yoki",
  "ham",
  "hamda",
  "bilan",
  "uchun",
  "haqida",
  "asosida",
  "boyicha",
  "bo'yicha",
  "bolgan",
  "bo'lgan",
  "kabi",
  "orqali",
  "doirasida",
  "sharoitida",
  "mavzu",
  "mavzusi",
  "mavzular",
  "reja",
  "kirish",
  "xulosa",
  "adabiyotlar",
  "foydalanilgan",
  "mustaqil",
  "ish",
  "ishi",
  "referat",
  "kurs",
  "diplom",
  "amaliy",
  "nazariy",
  "zamonaviy",
  "bob",
  "fasl",
  "savol",
  "savollar",
  "masala",
  "masalalar",
  "masalalari",
  "usullari",
  "usuli",
  "asoslari",
  "asosi",
  "tahlili",
  "tahlil",
  "mohiyati",
  "ahamiyati",
  "tizimi",
  "tizimlari",
  "rol",
  "roli",
  "orni",
  "o'rni",
  "rivojlantirish",
  "rivoji",
  "oshirish",
  "takomillashtirish",
  "muammolari",
  "muammosi",
  "yechimlari",
  "istiqbollari",
  "xususiyatlari",
  "tamoyillari",
  "fan",
  "fani",
  "talaba",
  "guruh",
  "oqituvchi",
  "o'qituvchi",
  "bet",
  "sahifa",
  "tayyor",
  "berilgan",
  "yozish",
  "yozildi",
  "umumiy",
  "qisqa",
  "toliq",
  "to'liq",
  // Uzbek Cyrillic
  "ва",
  "ёки",
  "ҳам",
  "ҳамда",
  "билан",
  "учун",
  "ҳақида",
  "асосида",
  "бўйича",
  "бўлган",
  "каби",
  "орқали",
  "доирасида",
  "шароитида",
  "мавзу",
  "мавзуси",
  "режа",
  "кириш",
  "хулоса",
  "адабиётлар",
  "мустақил",
  "иш",
  "иши",
  "реферат",
  "курс",
  "амалий",
  "назарий",
  "замонавий",
  "боб",
  "фасл",
  "савол",
  "масала",
  "усуллари",
  "асослари",
  "таҳлили",
  "таҳлил",
  "моҳияти",
  "аҳамияти",
  "тизими",
  "роли",
  "ўрни",
  "ривожлантириш",
  "фан",
  "фани",
  // Russian
  "и",
  "или",
  "в",
  "во",
  "на",
  "по",
  "для",
  "о",
  "об",
  "с",
  "со",
  "из",
  "к",
  "от",
  "до",
  "при",
  "как",
  "что",
  "тема",
  "план",
  "введение",
  "заключение",
  "список",
  "литературы",
  "анализ",
  "основы",
  "теория",
  "практика",
  "роль",
  "значение",
  "методы",
  "проблемы",
  "пути",
  "современные",
  "современный",
  "развитие",
  "система",
  "системы",
  "работа",
  "реферат",
  "самостоятельная",
  "предмет",
  "вопрос",
  "глава",
  // English
  "the",
  "a",
  "an",
  "and",
  "or",
  "of",
  "in",
  "on",
  "at",
  "for",
  "with",
  "to",
  "by",
  "from",
  "about",
  "into",
  "role",
  "analysis",
  "study",
  "methods",
  "method",
  "modern",
  "introduction",
  "conclusion",
  "references",
  "theory",
  "practice",
  "system",
  "systems",
  "topic",
  "essay",
  "paper",
  "report",
  "overview",
  "principles",
  "fundamentals",
]);

const UZBEK_CYRILLIC_SPECIFIC_REGEX = /[ўқғҳЎҚҒҲ]/g;
const RUSSIAN_SPECIFIC_REGEX = /[ыэёщъЫЭЁЩЪ]/g;
const CYRILLIC_CHAR_REGEX = /[\u0400-\u04FF]/g;
const LATIN_CHAR_REGEX = /[A-Za-z]/g;

const UZBEK_LATIN_MARKERS = new Set([
  "va",
  "uchun",
  "bilan",
  "hamda",
  "haqida",
  "asosida",
  "bo'yicha",
  "boyicha",
  "tizimi",
  "asoslari",
  "nazariyasi",
  "tahlili",
  "mavzu",
  "kirish",
  "xulosa",
  "iqtisodiyot",
  "jamiyat",
  "rivojlantirish",
  "o'zbekiston",
  "mustaqil",
  "ishda",
  "orqali",
]);

const ENGLISH_MARKERS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "which",
  "their",
  "these",
  "between",
  "analysis",
  "theory",
  "system",
  "systems",
  "research",
  "introduction",
  "conclusion",
  "management",
  "development",
  "overview",
  "impact",
  "principles",
]);

function normalizeApostrophes(input: string): string {
  return input
    .replace(/[\u2018\u2019\u02BB\u02BC\u2032`]/g, "'")
    .replace(/oʻ|o'|o`/gi, (m) => (m[0] === "O" ? "O'" : "o'"))
    .replace(/gʻ|g'|g`/gi, (m) => (m[0] === "G" ? "G'" : "g'"));
}

function stripMarkdownAndReferencesForLanguage(text: string): string {
  // Ignore trailing bibliography/references block so foreign book titles do not skew prose language
  const bodyBeforeRefs = text.split(
    /\n+#{1,3}\s*(?:foydalanilgan adabiyotlar|adabiyotlar ro'yxati|список использованной литературы|references|bibliography)\b/i
  )[0];

  return (bodyBeforeRefs || text)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/[#*|>_`~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Detects whether an academic title/text is written in Uzbek Latin, Uzbek Cyrillic, Russian, or English.
 */
export function detectAcademicLanguage(text: string, hint?: AcademicLanguage): AcademicLanguage {
  const clean = normalizeApostrophes(stripMarkdownAndReferencesForLanguage(text));
  if (!clean) return hint ?? "uz";

  const cyrillicMatches = clean.match(CYRILLIC_CHAR_REGEX) ?? [];
  const latinMatches = clean.match(LATIN_CHAR_REGEX) ?? [];

  if (cyrillicMatches.length > 0 && cyrillicMatches.length >= latinMatches.length * 0.45) {
    const uzCyrlSpecific = (clean.match(UZBEK_CYRILLIC_SPECIFIC_REGEX) ?? []).length;
    const ruSpecific = (clean.match(RUSSIAN_SPECIFIC_REGEX) ?? []).length;

    if (uzCyrlSpecific > 0 && uzCyrlSpecific >= ruSpecific) {
      return "uz-cyrl";
    }
    if (ruSpecific > 0) {
      return "ru";
    }
    if (hint === "uz-cyrl" || hint === "ru") {
      return hint;
    }
    if (/\b(?:мавзу|кириш|хулоса|асослари|таҳлили|тизими|мустақил)\b/i.test(clean)) {
      return "uz-cyrl";
    }
    return "ru";
  }

  const lower = clean.toLowerCase();
  const hasUzbekApostrophe = /\b(?:o'|g')[a-z]{1,}/i.test(lower);
  const words = lower.match(/[a-z']+/g) ?? [];

  let uzScore = hasUzbekApostrophe ? 2 : 0;
  let enScore = 0;

  for (const word of words) {
    if (UZBEK_LATIN_MARKERS.has(word)) uzScore += 2;
    if (ENGLISH_MARKERS.has(word)) enScore += 2;
    if (/(?:lash|lar|ning|dagi|chilik|lik|ishi|ishda)$/.test(word) && word.length >= 6) {
      uzScore += 1;
    }
    if (/(?:tion|ment|ness|ance|ence|izing|ized)$/.test(word) && word.length >= 6) {
      enScore += 1;
    }
  }

  if (enScore > uzScore + 1) return "en";
  if (uzScore > enScore) return "uz";

  if (hint === "en" || hint === "uz") return hint;
  return "uz";
}

export function normalizeAcademicLanguageValue(raw: unknown): AcademicLanguage | undefined {
  if (typeof raw !== "string") return undefined;
  const normalized = raw.trim().toLowerCase();
  if (!normalized) return undefined;
  if (
    normalized === "uz" ||
    normalized === "uz-latn" ||
    /o['‘ʻ]?zbek.*lot|uzbek/.test(normalized)
  ) {
    return "uz";
  }
  if (normalized === "uz-cyrl" || /kirill|кирилл|cyrl/.test(normalized)) {
    return "uz-cyrl";
  }
  if (normalized === "ru" || normalized === "rus" || /russ|рус/.test(normalized)) {
    return "ru";
  }
  if (normalized === "en" || normalized === "eng" || /english|ingliz/.test(normalized)) {
    return "en";
  }
  return undefined;
}

/**
 * Computes a morphological stem for Uzbek (Latin/Cyrillic), Russian, and English tokens
 * so inflected word forms still count as strong topical matches.
 */
export function stemAcademicToken(rawToken: string): string {
  const token = normalizeApostrophes(rawToken).toLowerCase().trim();
  if (token.length <= 4) return token;

  // Uzbek Latin agglutinative suffixes (longest first)
  const uzLatinSuffixes = [
    "lashtirish",
    "lashtiril",
    "lanish",
    "chilik",
    "larning",
    "larida",
    "lariga",
    "lardan",
    "larni",
    "larda",
    "larga",
    "ining",
    "sining",
    "ining",
    "ning",
    "dagi",
    "tagi",
    "lik",
    "liq",
    "chi",
    "lar",
    "ler",
    "dan",
    "tan",
    "da",
    "de",
    "ta",
    "te",
    "ga",
    "ka",
    "qa",
    "ni",
    "si",
  ];
  for (const suffix of uzLatinSuffixes) {
    if (token.endsWith(suffix) && token.length - suffix.length >= 4) {
      return token.slice(0, token.length - suffix.length);
    }
  }

  // Uzbek Cyrillic & Russian suffixes
  const cyrillicSuffixes = [
    "ларнинг",
    "ларида",
    "лардан",
    "ларни",
    "нинг",
    "даги",
    "лик",
    "лар",
    "дан",
    "ость",
    "ение",
    "ание",
    "ции",
    "ция",
    "ных",
    "ным",
    "ной",
    "ого",
    "ами",
    "ями",
    "ов",
    "ев",
    "ий",
    "ый",
    "ой",
    "ая",
    "ое",
    "ые",
    "ни",
    "га",
    "да",
  ];
  for (const suffix of cyrillicSuffixes) {
    if (token.endsWith(suffix) && token.length - suffix.length >= 4) {
      return token.slice(0, token.length - suffix.length);
    }
  }

  // English suffixes
  if (token.endsWith("ies") && token.length > 5) return `${token.slice(0, -3)}y`;
  if (token.endsWith("tion") && token.length > 6) return token.slice(0, -4);
  if (token.endsWith("ing") && token.length > 6) return token.slice(0, -3);
  if (token.endsWith("ed") && token.length > 5) return token.slice(0, -2);
  if (token.endsWith("es") && token.length > 5) return token.slice(0, -2);
  if (token.endsWith("s") && !token.endsWith("ss") && token.length > 4) return token.slice(0, -1);

  return token;
}

function stripTitleNumberingPrefix(title: string): string {
  return title
    .replace(/^\s*(?:№\s*)?\d+\s*[-–.)]?\s*(?:mavzu|bob|fasl|savol|tema|topic)?\s*[:.)-]?\s*/i, "")
    .replace(/^\s*(?:mavzu|тема|topic)\s*(?:№?\s*\d+)?\s*[:.-]?\s*/i, "")
    .trim();
}

function tokenizeField(raw: string, allowStopwordsFallback = false): string[] {
  const cleaned = normalizeApostrophes(raw);
  const rawTokens =
    cleaned.match(
      /(?:c\+\+|c#|\.net|[A-Za-z0-9\u0400-\u04FF]+(?:[+'#./-][A-Za-z0-9\u0400-\u04FF]+)*)/gi
    ) ?? [];

  const meaningful: string[] = [];
  const seen = new Set<string>();

  for (const rawTok of rawTokens) {
    const rawLower = rawTok.toLowerCase();
    const cleanTok = SHORT_TECHNICAL_TOKENS.has(rawLower)
      ? rawTok
      : rawTok.replace(/^[./-]+|[./-]+$/g, "");
    const lower = cleanTok.toLowerCase();
    if (!lower) continue;

    // Skip pure small list index numbers
    if (/^\d{1,2}$/.test(lower)) continue;

    const isShortTech = SHORT_TECHNICAL_TOKENS.has(lower);
    const strippedForStop = lower.replace(/['’ʻ]/g, "");
    if (!isShortTech && lower.length < 3) continue;
    if (
      !allowStopwordsFallback &&
      (GENERIC_ACADEMIC_STOPWORDS.has(lower) || GENERIC_ACADEMIC_STOPWORDS.has(strippedForStop))
    ) {
      continue;
    }

    if (!seen.has(lower)) {
      seen.add(lower);
      meaningful.push(cleanTok);
    }
  }

  return meaningful;
}

function extractNumericAndCodeTokens(text: string): string[] {
  const matches =
    text.match(/\b(?:[A-Za-z]{1,4}[-–]?\d{2,5}|(?:19|20)\d{2}|[A-Za-z]\d+|\d+-\d+)\b/g) ?? [];
  return Array.from(new Set(matches.map((m) => m.trim())));
}

/**
 * Extracts prioritized keywords from topic title, optional subject, and user notes/subpoints.
 */
export function extractTopicKeywords(
  topicTitle: string,
  subject?: string,
  notes?: string
): TopicKeywordProfile {
  const cleanTitle = stripTitleNumberingPrefix(topicTitle) || topicTitle;
  let titleKeywords = tokenizeField(cleanTitle, false);
  if (titleKeywords.length === 0) {
    titleKeywords = tokenizeField(cleanTitle, true);
  }

  const titleLowerSet = new Set(titleKeywords.map((t) => stemAcademicToken(t)));

  const noteKeywords = tokenizeField(notes || "", false)
    .filter((tok) => !titleLowerSet.has(stemAcademicToken(tok)))
    .slice(0, 12);

  const subjectKeywords = tokenizeField(subject || "", false)
    .filter((tok) => !titleLowerSet.has(stemAcademicToken(tok)))
    .slice(0, 6);

  const numericOrFormulaTokens = extractNumericAndCodeTokens(`${cleanTitle} ${notes || ""}`).slice(
    0,
    8
  );

  return {
    titleKeywords,
    noteKeywords,
    subjectKeywords,
    numericOrFormulaTokens,
  };
}

function buildStemmedWordSet(text: string): {
  exactLower: string;
  stems: Set<string>;
} {
  const exactLower = normalizeApostrophes(text).toLowerCase();
  const tokens =
    exactLower.match(
      /(?:c\+\+|c#|\.net|[A-Za-z0-9\u0400-\u04FF]+(?:[+'#./-][A-Za-z0-9\u0400-\u04FF]+)*)/gi
    ) ?? [];
  const stems = new Set<string>();
  for (const tok of tokens) {
    stems.add(tok);
    stems.add(stemAcademicToken(tok));
  }
  return { exactLower, stems };
}

function doesKeywordMatchCorpus(
  keyword: string,
  corpus: { exactLower: string; stems: Set<string> }
): boolean {
  const lower = normalizeApostrophes(keyword).toLowerCase();
  if (corpus.stems.has(lower)) return true;

  const stem = stemAcademicToken(lower);
  if (corpus.stems.has(stem)) return true;

  // Substring stem check for compound words or agglutinative variants (tokens >= 4 chars)
  if (stem.length >= 4) {
    if (corpus.exactLower.includes(stem)) return true;
  } else if (SHORT_TECHNICAL_TOKENS.has(lower)) {
    const escaped = lower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, "i").test(corpus.exactLower)) {
      return true;
    }
  }
  return false;
}

const FALLBACK_OR_REFUSAL_PATTERNS = [
  /tushunchasi va nazariy asoslari[\s\S]{0,180}doirasida mavzuning amaliy tahlili/i,
  /nazariy ahamiyati va amaliy qo['‘ʻ]?llanilish jihatlarini yoritib beradi[\s\S]{0,300}nazariy bilimlarni amaliyot bilan bog['‘ʻ]?lashda/i,
  /\bas an ai(?: language model)?\b/i,
  /\bi cannot fulfill\b|\bi['’]?m unable to\b|\bsorry,\s*i cannot\b/i,
  /\bkechirasiz,\s*men\b[\s\S]{0,60}(?:olmayman|imkonim yo['‘ʻ]?q)/i,
  /\bизвините,\s*я не могу\b/i,
  /\bкак языковая модель\b/i,
];

/**
 * Detects known boilerplate fallback text, AI refusals, or severely stubbed outputs.
 */
export function isLikelyFallbackOrStub(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (FALLBACK_OR_REFUSAL_PATTERNS.some((rx) => rx.test(trimmed))) {
    return true;
  }
  return false;
}

export function countAcademicWords(text: string): number {
  const stripped = text.replace(/[#*|>`~_-]+/g, " ").trim();
  if (!stripped) return 0;
  return stripped.split(/\s+/).filter(Boolean).length;
}

/**
 * Evaluates whether a generated academic response faithfully covers the exact topic,
 * optional subpoints/notes, subject domain, expected language, and non-stub quality.
 */
export function evaluateGeneratedWorkFidelity(
  input: WorkFidelityEvaluationInput
): WorkFidelityEvaluation {
  const trimmedText = input.generatedText.trim();
  const wordCount = countAcademicWords(trimmedText);
  const detectedLanguage = detectAcademicLanguage(trimmedText, input.expectedLanguage);
  const languageMatches = detectedLanguage === input.expectedLanguage;
  const isFallbackLike = isLikelyFallbackOrStub(trimmedText);

  const minWordsThreshold = input.expectedMinWords ?? 80;
  const isTooShortOrStub = wordCount < minWordsThreshold || isFallbackLike;

  const profile = extractTopicKeywords(input.topicTitle, input.subject, input.notes);
  const corpus = buildStemmedWordSet(trimmedText);

  const matchedTitleKeywords: string[] = [];
  const missingTitleKeywords: string[] = [];
  for (const kw of profile.titleKeywords) {
    if (doesKeywordMatchCorpus(kw, corpus)) {
      matchedTitleKeywords.push(kw);
    } else {
      missingTitleKeywords.push(kw);
    }
  }

  const matchedNoteKeywords: string[] = [];
  const missingNoteKeywords: string[] = [];
  for (const kw of profile.noteKeywords) {
    if (doesKeywordMatchCorpus(kw, corpus)) {
      matchedNoteKeywords.push(kw);
    } else {
      missingNoteKeywords.push(kw);
    }
  }

  const matchedSubjectCount = profile.subjectKeywords.filter((kw) =>
    doesKeywordMatchCorpus(kw, corpus)
  ).length;
  const subjectCoverage =
    profile.subjectKeywords.length > 0 ? matchedSubjectCount / profile.subjectKeywords.length : 1;

  const titleKeywordCoverage =
    profile.titleKeywords.length > 0
      ? matchedTitleKeywords.length / profile.titleKeywords.length
      : 1;

  const noteKeywordCoverage =
    profile.noteKeywords.length > 0 ? matchedNoteKeywords.length / profile.noteKeywords.length : 1;

  // Title coverage gate
  let titleTopicPassed = true;
  if (profile.titleKeywords.length === 1) {
    titleTopicPassed = matchedTitleKeywords.length === 1;
  } else if (profile.titleKeywords.length === 2) {
    titleTopicPassed = matchedTitleKeywords.length >= 1 && titleKeywordCoverage >= 0.5;
  } else if (profile.titleKeywords.length >= 3) {
    titleTopicPassed = titleKeywordCoverage >= 0.45 && matchedTitleKeywords.length >= 2;
  }

  // User notes/subpoints gate when explicit distinctive notes exist
  const noteTopicPassed =
    profile.noteKeywords.length < 2 ||
    matchedNoteKeywords.length >= 1 ||
    titleKeywordCoverage >= 0.75;

  const issues: string[] = [];
  if (isFallbackLike) {
    issues.push("Umumiy shablon yoki rad javobi aniqlandi");
  }
  if (wordCount < minWordsThreshold) {
    issues.push(
      `Matn hajmi juda qisqa (${wordCount} so'z, kamida ${minWordsThreshold} so'z kutilgan)`
    );
  }
  if (!languageMatches) {
    issues.push(
      `Til mos kelmadi (kutilgan: ${input.expectedLanguage}, topilgan: ${detectedLanguage})`
    );
  }
  if (!titleTopicPassed && missingTitleKeywords.length > 0) {
    issues.push(
      `Mavzu asosiy atamalari yetishmayapti: ${missingTitleKeywords.slice(0, 5).join(", ")}`
    );
  }
  if (!noteTopicPassed && missingNoteKeywords.length > 0) {
    issues.push(
      `Rasmdagi reja/izoh talablari yoritilmadi: ${missingNoteKeywords.slice(0, 4).join(", ")}`
    );
  }

  const isOnTopic = !isTooShortOrStub && languageMatches && titleTopicPassed && noteTopicPassed;

  // Compute deterministic 0..100 relevance score
  let rawScore =
    titleKeywordCoverage * 60 +
    (profile.noteKeywords.length > 0 ? noteKeywordCoverage * 20 : subjectCoverage * 20) +
    (isTooShortOrStub ? 0 : 20);
  if (!languageMatches) rawScore *= 0.45;
  if (isFallbackLike) rawScore = Math.min(rawScore, 25);

  const relevanceScore = Math.max(0, Math.min(100, Math.round(rawScore)));

  return {
    isOnTopic,
    relevanceScore,
    wordCount,
    detectedLanguage,
    languageMatches,
    isTooShortOrStub,
    isFallbackLike,
    titleKeywordCoverage,
    noteKeywordCoverage,
    matchedTitleKeywords,
    missingTitleKeywords,
    matchedNoteKeywords,
    missingNoteKeywords,
    issues,
  };
}

/**
 * Formats extracted photo topics into a privacy-safe, non-strippable blueprint context
 * for academic generation routes (referat, coursework, diplom-bmi, exam-prep).
 */
export function formatImageTopicsTemplateContext(
  topics: ParsedTopic[],
  metadata?: { subject?: string; language?: string }
): string {
  const headerLines = [IMAGE_TOPICS_CONTEXT_MARKER];
  if (metadata?.subject?.trim()) {
    headerLines.push(`Fan: ${metadata.subject.trim()}`);
  }
  if (metadata?.language?.trim()) {
    headerLines.push(`Asl til: ${metadata.language.trim()}`);
  }

  const body = topics
    .map((topic, index) => {
      const cleanTitle = topic.title.trim();
      const cleanContent = topic.content.trim();
      const pagePart = topic.pageCount ? ` [${topic.pageCount} bet]` : "";
      if (cleanContent && cleanContent !== cleanTitle) {
        return `${index + 1}. ${cleanTitle}${pagePart}\nTalab/izoh: ${cleanContent}`;
      }
      return `${index + 1}. ${cleanTitle}${pagePart}`;
    })
    .join("\n\n");

  return `${headerLines.join("\n")}\n\n${body}`.trim();
}
