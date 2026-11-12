import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { GoogleGenAI } from "@google/genai";
import { authOptions } from "@/lib/auth-options";
import { getUserSubscription, trackAIUsage } from "@/lib/limits";
import { aiDemoRateLimiter } from "@/lib/security/rate-limiter";
import {
  estimateAveragePageCount,
  generateWorksRequestSchema,
  type ParsedTopic,
} from "@/lib/academic/topic-parser";
import {
  detectAcademicLanguage,
  evaluateGeneratedWorkFidelity,
  extractTopicKeywords,
  type AcademicLanguage,
} from "@/lib/academic/topic-fidelity";

export const maxDuration = 60;

const GEMINI_TEXT_MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash";
const GEMINI_FALLBACK_TEXT_MODEL = "gemini-3.1-flash-lite";
const GEMINI_EMERGENCY_TEXT_MODEL = "gemini-flash-latest";
const MAX_CONCURRENT_TOPIC_GENERATIONS = 4;
const WORK_TIMEOUT_MS = 45_000;
const ROUTE_DEADLINE_BUFFER_MS = 53_000;

function raceWithTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label}_TIMEOUT`));
    }, timeoutMs);
    Promise.resolve(promise).then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

interface TopicGenerationResult {
  topic: ParsedTopic;
  effectivePages: string;
  inputTokens: number;
  outputTokens: number;
  usedFallback: boolean;
  relevanceScore: number;
  language: AcademicLanguage;
  modelUsed: string;
}

function getWordRangeForPages(pagesPerTopic: string): string {
  if (pagesPerTopic === "2-3") return "700-950";
  if (pagesPerTopic === "3-4") return "950-1250";
  if (pagesPerTopic === "5") return "1300-1600";
  const avgPages = estimateAveragePageCount(pagesPerTopic);
  const minWords = Math.max(300, Math.round(avgPages * 250));
  const maxWords = Math.max(minWords + 200, Math.round(avgPages * 310));
  return `${minWords}-${maxWords}`;
}

function getLanguageDisplayName(lang: AcademicLanguage): string {
  switch (lang) {
    case "ru":
      return "Русский (rus tilida)";
    case "en":
      return "English (ingliz tilida)";
    case "uz-cyrl":
      return "Ўзбек тили (кирилл алифбосида)";
    case "uz":
    default:
      return "O'zbek tili (lotin alifbosida)";
  }
}

function buildSystemInstructionForLanguage(
  lang: AcademicLanguage,
  effectivePages: string,
  topicTitle: string
): string {
  switch (lang) {
    case "ru":
      return `Вы — профессор высшей школы и научный эксперт. Напишите полноценную академическую работу объёмом ${effectivePages} страниц А4 строго по теме «${topicTitle}». Отклонение от темы, общие шаблонные фразы и смена языка запрещены.`;
    case "en":
      return `You are a university professor and academic research expert. Write a complete, strictly on-topic academic paper (${effectivePages} A4 pages) solely focused on "${topicTitle}". Do not digress into unrelated domains or switch languages.`;
    case "uz-cyrl":
      return `Сиз олий таълим профессори ва илмий экспертсиз. Фақат «${topicTitle}» мавзуси доирасида ўзбек кирилл алифбосида ${effectivePages} А4 бетлик тўлиқ, мазмунли академик иш ёзинг. Мавзудан четга чиқиш ва тилни алмаштириш тақиқланади.`;
    case "uz":
    default:
      return `Siz oliy ta'lim professori va ilmiy ishlar tayyorlash bo'yicha ekspertsiz. Faqat "${topicTitle}" mavzusiga 100% sodiq qolgan holda ${effectivePages} A4 betlik chuqur, tugallangan akademik ish yozing. Mavzudan chalg'ish, umumiy shablon gaplar va tilni o'zgartirish qat'iyan man etiladi.`;
  }
}

function buildPerTopicPrompt(params: {
  topicTitle: string;
  topicHint: string;
  workTypeLabel: string;
  subjectLabel: string;
  pagesPerTopic: string;
  language: AcademicLanguage;
  correctionNotes?: string;
}): string {
  const targetWordRange = getWordRangeForPages(params.pagesPerTopic);
  const avgPages = estimateAveragePageCount(params.pagesPerTopic);
  const scaleFactor = Math.max(1, avgPages / 2.5);
  const introWords = Math.round(120 * scaleFactor);
  const sectionWords = Math.round(240 * scaleFactor);
  const conclusionWords = Math.round(110 * scaleFactor);

  const profile = extractTopicKeywords(params.topicTitle, params.subjectLabel, params.topicHint);
  const mandatoryConcepts = Array.from(
    new Set([
      ...profile.titleKeywords,
      ...profile.noteKeywords.slice(0, 5),
      ...profile.numericOrFormulaTokens,
    ])
  ).slice(0, 12);
  const conceptsLine =
    mandatoryConcepts.length > 0 ? mandatoryConcepts.join(", ") : params.topicTitle;
  const hasRealHint =
    Boolean(params.topicHint.trim()) &&
    params.topicHint.trim().toLowerCase() !== params.topicTitle.trim().toLowerCase();

  if (params.language === "ru") {
    return `Напишите качественную работу (${params.workTypeLabel}, ${params.pagesPerTopic} страницы А4, примерно ${targetWordRange} слов) строго и исключительно по указанной теме.
- ТЕМА (СТРОГО СОБЛЮДАТЬ): "${params.topicTitle}"
- ПРЕДМЕТ / ДИСЦИПЛИНА: "${params.subjectLabel}"
- ЯЗЫК РАБОТЫ: строго на русском языке
- КЛЮЧЕВЫЕ ТЕРМИНЫ И ПОНЯТИЯ (ОБЯЗАТЕЛЬНО РАСКРЫТЬ): ${conceptsLine}
${hasRealHint ? `- ДОПОЛНИТЕЛЬНЫЕ ТРЕБОВАНИЯ И ЗАМЕТКИ С ИЗОБРАЖЕНИЯ:\n"""\n${params.topicHint}\n"""\n` : ""}${params.correctionNotes ? `- ВНИМАНИЕ — ИСПРАВЛЕНИЕ ПРЕДЫДУЩЕЙ ПОПЫТКИ (ОБЯЗАТЕЛЬНО ВЫПОЛНИТЬ): ${params.correctionNotes}\n` : ""}
СТРОГИЕ ПРАВИЛА:
1. Пишите ТОЛЬКО о теме «${params.topicTitle}». Не подменяйте предмет и не добавляйте посторонние темы.
2. Раскройте все указанные заметки, формулы и пункты плана с реальными академическими примерами.
3. Верните ТОЛЬКО чистый Markdown без вводных комментариев:

## План работы
1. ...
2. ...
3. ...

### Введение
(Актуальность, цель, задачи и объект темы «${params.topicTitle}» — не менее ${introWords} слов)

### 1. Теоретические основы
(Подробный академический анализ и терминология — не менее ${sectionWords} слов)

### 2. Практический анализ и современные решения
(Конкретные примеры, механизмы и сравнительный анализ — не менее ${sectionWords} слов)

### Заключение
(Основные выводы и рекомендации по теме — не менее ${conclusionWords} слов)

### Список использованной литературы
1. ...
2. ...
3. ...
4. ...`;
  }

  if (params.language === "en") {
    return `Write a comprehensive, university-level "${params.workTypeLabel}" (${params.pagesPerTopic} A4 pages, approximately ${targetWordRange} words) strictly focused on the exact topic below.
- EXACT TOPIC (DO NOT DEVIATE): "${params.topicTitle}"
- SUBJECT / DISCIPLINE: "${params.subjectLabel}"
- LANGUAGE: Strictly English
- MANDATORY CONCEPTS TO COVER IN DEPTH: ${conceptsLine}
${hasRealHint ? `- USER NOTES / REQUIREMENTS FROM UPLOADED IMAGE:\n"""\n${params.topicHint}\n"""\n` : ""}${params.correctionNotes ? `- CORRECTION REQUIRED FROM PREVIOUS ATTEMPT: ${params.correctionNotes}\n` : ""}
STRICT RULES:
1. Stay 100% faithful to "${params.topicTitle}". Never substitute an unrelated topic or write generic filler.
2. Address every subpoint, formula, and detail from the uploaded image notes with rigorous scholarly evidence and examples.
3. Output ONLY clean Markdown (no conversational preamble):

## Outline
1. ...
2. ...
3. ...

### Introduction
(Significance, objective, scope, and research tasks — at least ${introWords} words)

### 1. Theoretical Foundations
(Core definitions, scholarly frameworks, and theoretical depth — at least ${sectionWords} words)

### 2. Practical Analysis and Applications
(Concrete mechanisms, case examples, and comparative evaluation — at least ${sectionWords} words)

### Conclusion
(Key synthesis and actionable recommendations — at least ${conclusionWords} words)

### References
1. ...
2. ...
3. ...
4. ...`;
  }

  if (params.language === "uz-cyrl") {
    return `Олий таълим стандартларига мос тўлиқ «${params.workTypeLabel}» (${params.pagesPerTopic} А4 бетлик, тахминан ${targetWordRange} сўз ҳажмида) фақат ўзбек кирилл алифбосида ёзиб беринг.
- АНИҚ МАВЗУ (ЧЕТГА ЧИҚИЛМАСИН): "${params.topicTitle}"
- ФАН: "${params.subjectLabel}"
- ТИЛ ВА АЛИФБО: Қатъий ЎЗБЕК КИРИЛЛ алифбосида
- МАЖБУРИЙ ЁРИТИЛАДИГАН ТУШУНЧАЛАР: ${conceptsLine}
${hasRealHint ? `- РАСМДАН ОЛИНГАН ҚЎШИМЧА ТАЛАБ ВА РЕЖА:\n"""\n${params.topicHint}\n"""\n` : ""}${params.correctionNotes ? `- ОЛДИНГИ УРИНИШДАГИ ХАТОНИ ТУЗАТИШ ШАРТ: ${params.correctionNotes}\n` : ""}
ҚАТЪИЙ ТАЛАБЛАР:
1. Матн ФАҚАТ ва ФАҚАТ «${params.topicTitle}» мавзусига 100% боғланган бўлсин. Бегона мавзуга ўтиб кетиш мутлақо тақиқланади.
2. Расмдаги барча банд, формула ва талабларни аниқ мисоллар билан чуқур очиб беринг.
3. Жавобни ФАҚАТ қуйидаги тоза Markdown тузилмасида беринг:

## Режа
1. ...
2. ...
3. ...

### Кириш
(Мавзунинг долзарблиги, мақсади, вазифалари — камида ${introWords} сўз)

### 1. Мавзунинг назарий асослари
(Илмий тушунчалар ва назарий таҳлил — камида ${sectionWords} сўз)

### 2. Амалий таҳлил ва замонавий ечимлар
(Аниқ мисоллар, механизмлар ва қиёсий таҳлил — камида ${sectionWords} сўз)

### Хулоса
(Асосий илмий хулосалар ва амалий тавсиялар — камида ${conclusionWords} сўз)

### Фойдаланилган адабиётлар
1. ...
2. ...
3. ...`;
  }

  return `Oliy ta'lim standartlariga mos to'liq "${params.workTypeLabel}" (${params.pagesPerTopic} A4 betlik, taxminan ${targetWordRange} so'z hajmida) yozib bering.
- ANIQ MAVZU (CHETGA CHIQILMASIN): "${params.topicTitle}"
- FAN: "${params.subjectLabel}"
- TIL VA ALIFBO: Qat'iy ravishda O'zbek tili (lotin alifbosida)
- MAJBURIY QAMRASH KERAK BO'LGAN TUSHUNCHALAR: ${conceptsLine}
${hasRealHint ? `- RASMDAN OLINGAN QO'SHIMCHA MA'LUMOT / REJA / SHARTLAR (HAMMASI BAJARILSIN):\n"""\n${params.topicHint}\n"""\n` : ""}${params.correctionNotes ? `- DIQQAT — OLDINGI URINISHDAGI XATONI TUZATISH SHART: ${params.correctionNotes}\n` : ""}
QAT'IY TALABLAR:
1. Matn FAQAT va FAQAT "${params.topicTitle}" mavzusiga va "${params.subjectLabel}" faniga chuqur bog'langan holda yozilsin. Boshqa begona sohaga yoki umumiy mavzuga chalg'ish mutlaqo taqiqlanadi!
2. Yuqorida ko'rsatilgan barcha majburiy tushunchalar va rasmdagi izoh/shartlarning har biri aniq ilmiy faktlar, formulalar yoki hayotiy misollar bilan yoritilsin.
3. Umumiy va quruq shablon gaplardan qoching. Javobni FAQAT quyidagi toza Markdown tuzilmasida bering:

## Reja
1. ...
2. ...
3. ...

### Kirish
(Mavzuning dolzarbligi, maqsadi, vazifalari va obyektini kamida ${introWords} so'z bilan yoritib bering)

### 1. Mavzuning nazariy asoslari va tushunchalari
(Nazariy qarashlar, asosiy tushunchalar va ilmiy tahlil — kamida ${sectionWords} so'z)

### 2. Amaliy tahlil, mexanizmlar va zamonaviy yechimlar
(Hayotiy/amaliy misollar, qiyosiy tahlil va rivojlanish yo'nalishlari — kamida ${sectionWords} so'z)

### Xulosa
(Asosiy ilmiy xulosalar va amaliy takliflar — kamida ${conclusionWords} so'z)

### Foydalanilgan adabiyotlar
1. ...
2. ...
3. ...
4. ...`;
}

function buildFallbackWork(
  title: string,
  subject: string,
  workTypeLabel: string,
  lang: AcademicLanguage = "uz"
): string {
  if (lang === "ru") {
    return `## План работы
1. Теоретические основы темы «${title}»
2. Практический анализ по предмету «${subject}»
3. Заключение и рекомендации

### Введение
Данная работа (${workTypeLabel}) посвящена теме «${title}» в рамках дисциплины «${subject}».

### 1. Теоретические основы
При изучении темы «${title}» ключевое значение имеют базовые понятия, закономерности и научные подходы.

### 2. Практический анализ
Анализ процессов по направлению «${title}» позволяет выработать эффективные практические решения.

### Заключение
Глубокое изучение темы «${title}» служит основой для связи теоретических знаний с практикой.

### Список использованной литературы
1. Учебные пособия по дисциплине «${subject}».`;
  }

  if (lang === "en") {
    return `## Outline
1. Theoretical Foundations of ${title}
2. Practical Analysis in ${subject}
3. Conclusion and Recommendations

### Introduction
This ${workTypeLabel.toLowerCase()} examines "${title}" within the scope of ${subject}.

### 1. Theoretical Foundations
Systematic analysis of core principles and conceptual frameworks is essential for understanding "${title}".

### 2. Practical Analysis
Applying modern analytical methodologies to "${title}" supports effective problem solving in ${subject}.

### Conclusion
Mastering "${title}" bridges foundational theory and practical application.

### References
1. Academic textbooks and lecture materials on ${subject}.`;
  }

  return `## Reja
1. ${title} tushunchasi va nazariy asoslari
2. ${subject} doirasida mavzuning amaliy tahlili
3. Xulosa va amaliy tavsiyalar

### Kirish
Ushbu ${workTypeLabel.toLowerCase()} "${title}" mavzusiga bag'ishlangan bo'lib, ${subject} fani doirasida mavzuning nazariy ahamiyati va amaliy qo'llanilish jihatlarini yoritib beradi.

### 1. Nazariy asoslar
"${title}" yo'nalishini o'rganishda asosiy tushunchalar, tamoyillar va ilmiy yondashuvlarni tizimli ko'rib chiqish muhim ahamiyat kasb etadi.

### 2. Amaliy tahlil
Zamonaviy sharoitda "${title}" mavzusiga oid jarayonlarni tahlil qilish samarali yechimlar ishlab chiqish imkonini beradi.

### Xulosa
Tahlil natijalariga ko'ra, "${title}" mavzusini chuqur o'zlashtirish nazariy bilimlarni amaliyot bilan bog'lashda muhim asos bo'lib xizmat qiladi.

### Foydalanilgan adabiyotlar
1. O'zbekiston Respublikasi Oliy ta'lim o'quv qo'llanmalari.
2. ${subject} fanidan ma'ruzalar to'plami.`;
}

async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < items.length) {
      const current = nextIndex++;
      results[current] = await worker(items[current], current);
    }
  }

  const workerCount = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => runWorker()));
  return results;
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const session = await getServerSession(authOptions).catch(() => null);
  const userId = session?.user?.id;

  if (!userId) {
    const rateLimitResponse = await aiDemoRateLimiter.middlewareAsync(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "So'rov tanasi yaroqli JSON formatida emas" },
      { status: 400 }
    );
  }

  const parsedRequest = generateWorksRequestSchema.safeParse(body);
  if (!parsedRequest.success) {
    const firstIssue = parsedRequest.error.issues[0]?.message || "Noto'g'ri so'rov ma'lumotlari";
    return NextResponse.json({ error: firstIssue }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY sozlanmagan. Server konfiguratsiyasini tekshiring." },
      { status: 503 }
    );
  }

  const { topics, workType, subject, pagesPerTopic, language } = parsedRequest.data;
  const workTypeLabel = workType?.trim() || "Mustaqil ish";
  const subjectLabel = subject?.trim() || "Mutaxassislik / Umumta'lim fani";

  let userPlan = "FREE";
  if (userId) {
    try {
      const sub = await getUserSubscription(userId);
      userPlan = sub.plan;
    } catch {
      userPlan = "FREE";
    }
  }

  const generateSingleTopicWithFidelity = async (
    ai: GoogleGenAI,
    topic: ParsedTopic
  ): Promise<TopicGenerationResult> => {
    const effectivePages = topic.pageCount || pagesPerTopic;
    const avgPages = estimateAveragePageCount(effectivePages);
    const topicLanguage: AcademicLanguage =
      language === "auto"
        ? detectAcademicLanguage(`${topic.title}\n${topic.content}`, "uz")
        : language;
    const minWordsRequired = Math.min(180, Math.max(40, Math.round(avgPages * 35)));
    const maxOutputTokens = Math.min(16384, Math.max(4096, Math.round(avgPages * 850)));

    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    const bestBox: {
      value: {
        text: string;
        model: string;
        evalResult: ReturnType<typeof evaluateGeneratedWorkFidelity>;
      } | null;
    } = { value: null };

    const invokeModelAttempt = async (
      model: string,
      temperature: number,
      correctionNotes?: string
    ) => {
      const remainingBudgetMs = Math.max(
        4_000,
        ROUTE_DEADLINE_BUFFER_MS - (Date.now() - startedAt)
      );
      const prompt = buildPerTopicPrompt({
        topicTitle: topic.title,
        topicHint: topic.content,
        workTypeLabel,
        subjectLabel,
        pagesPerTopic: effectivePages,
        language: topicLanguage,
        correctionNotes,
      });

      const response = await raceWithTimeout(
        ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            temperature,
            maxOutputTokens,
            systemInstruction: buildSystemInstructionForLanguage(
              topicLanguage,
              effectivePages,
              topic.title
            ),
          },
        }),
        Math.min(WORK_TIMEOUT_MS, remainingBudgetMs),
        "GENERATE_WORK"
      );

      const text = (response?.text ?? "").trim();
      totalInputTokens += response?.usageMetadata?.promptTokenCount ?? Math.ceil(prompt.length / 4);
      totalOutputTokens +=
        response?.usageMetadata?.candidatesTokenCount ?? Math.ceil(text.length / 4);

      if (!text) {
        return null;
      }

      const evalResult = evaluateGeneratedWorkFidelity({
        topicTitle: topic.title,
        subject: subjectLabel,
        notes: topic.content,
        generatedText: text,
        expectedLanguage: topicLanguage,
        expectedMinWords: minWordsRequired,
      });

      if (
        !bestBox.value ||
        (evalResult.isOnTopic ? 1 : 0) > (bestBox.value.evalResult.isOnTopic ? 1 : 0) ||
        evalResult.relevanceScore > bestBox.value.evalResult.relevanceScore
      ) {
        bestBox.value = { text, model, evalResult };
      }

      return { text, evalResult };
    };

    try {
      let attempt1 = null as Awaited<ReturnType<typeof invokeModelAttempt>>;
      try {
        attempt1 = await invokeModelAttempt(GEMINI_TEXT_MODEL, 0.25);
      } catch (primaryErr) {
        console.warn(`[GENERATE_WORK_PRIMARY_ERR] "${topic.title}":`, primaryErr);
        const remainingMs = ROUTE_DEADLINE_BUFFER_MS - (Date.now() - startedAt);
        if (remainingMs > 6_000) {
          attempt1 = await invokeModelAttempt(GEMINI_FALLBACK_TEXT_MODEL, 0.2).catch(() => null);
        }
        if (!attempt1 && ROUTE_DEADLINE_BUFFER_MS - (Date.now() - startedAt) > 6_000) {
          attempt1 = await invokeModelAttempt(GEMINI_EMERGENCY_TEXT_MODEL, 0.2).catch(() => null);
        }
      }

      // If output drifted off-topic, switched languages, or returned a tiny/stub response, self-correct
      if (attempt1 && !attempt1.evalResult.isOnTopic) {
        const remainingMs = ROUTE_DEADLINE_BUFFER_MS - (Date.now() - startedAt);
        if (remainingMs > 6_000) {
          const issuesSummary = attempt1.evalResult.issues.join("; ");
          const missingList = [
            ...attempt1.evalResult.missingTitleKeywords,
            ...attempt1.evalResult.missingNoteKeywords,
          ]
            .slice(0, 8)
            .join(", ");
          const correctionNotes = [
            issuesSummary,
            missingList ? `Majburiy kiritilishi kerak atamalar: ${missingList}` : "",
            `Til qat'iy: ${getLanguageDisplayName(topicLanguage)}`,
          ]
            .filter(Boolean)
            .join(". ");

          try {
            await invokeModelAttempt(GEMINI_TEXT_MODEL, 0.12, correctionNotes);
          } catch (retryErr) {
            console.warn(`[GENERATE_WORK_CORRECTION_ERR] "${topic.title}":`, retryErr);
          }
        }
      }

      const bestCandidate = bestBox.value;
      if (
        bestCandidate &&
        (bestCandidate.evalResult.isOnTopic ||
          (bestCandidate.evalResult.languageMatches &&
            bestCandidate.evalResult.relevanceScore >= 55 &&
            !bestCandidate.evalResult.isFallbackLike))
      ) {
        return {
          topic: {
            title: topic.title,
            content: bestCandidate.text,
          },
          effectivePages,
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
          usedFallback: false,
          relevanceScore: bestCandidate.evalResult.relevanceScore,
          language: topicLanguage,
          modelUsed: bestCandidate.model,
        };
      }
    } catch (err) {
      console.warn(`[GENERATE_WORK_TOPIC_FALLBACK] "${topic.title}":`, err);
    }

    const fallback = buildFallbackWork(topic.title, subjectLabel, workTypeLabel, topicLanguage);
    return {
      topic: {
        title: topic.title,
        content: fallback,
      },
      effectivePages,
      inputTokens: totalInputTokens || Math.ceil(topic.title.length / 4),
      outputTokens: Math.ceil(fallback.length / 4),
      usedFallback: true,
      relevanceScore: 30,
      language: topicLanguage,
      modelUsed: "template-fallback",
    };
  };

  try {
    const ai = new GoogleGenAI({ apiKey });

    const generatedResults = await runWithConcurrency<ParsedTopic, TopicGenerationResult>(
      topics,
      MAX_CONCURRENT_TOPIC_GENERATIONS,
      (topic) => generateSingleTopicWithFidelity(ai, topic)
    );

    const totalInputTokens = generatedResults.reduce((acc, item) => acc + item.inputTokens, 0);
    const totalOutputTokens = generatedResults.reduce((acc, item) => acc + item.outputTokens, 0);
    const works = generatedResults.map((item) => item.topic);
    const pageCounts = generatedResults.map((item) => item.effectivePages);
    const fallbackIndices = generatedResults
      .map((item, idx) => (item.usedFallback ? idx : -1))
      .filter((idx) => idx !== -1);
    const relevanceScores = generatedResults.map((item) => item.relevanceScore);
    const averageRelevanceScore =
      relevanceScores.length > 0
        ? Math.round(relevanceScores.reduce((a, b) => a + b, 0) / relevanceScores.length)
        : 0;
    const primaryUsedModel =
      generatedResults.find((item) => !item.usedFallback)?.modelUsed || GEMINI_TEXT_MODEL;

    await trackAIUsage({
      userId,
      plan: userPlan,
      feature: "ACADEMIC_GENERATION",
      provider: "gemini",
      model: primaryUsedModel,
      status: "SUCCESS",
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      requestDurationMs: Date.now() - startedAt,
    });

    return NextResponse.json(
      {
        works,
        pagesPerTopic,
        pageCounts,
        totalTopics: works.length,
        usedFallbackCount: fallbackIndices.length,
        fallbackIndices,
        relevanceScores,
        averageRelevanceScore,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GENERATE_WORKS_ERROR]", error);
    await trackAIUsage({
      userId,
      plan: userPlan,
      feature: "ACADEMIC_GENERATION",
      provider: "gemini",
      model: GEMINI_TEXT_MODEL,
      status: "FAILED",
      requestDurationMs: Date.now() - startedAt,
      errorCode: "GENERATE_WORKS_ERROR",
    });

    return NextResponse.json(
      { error: "Mavzular bo'yicha mustaqil ish yozishda xatolik yuz berdi. Qayta urinib ko'ring." },
      { status: 500 }
    );
  }
}
