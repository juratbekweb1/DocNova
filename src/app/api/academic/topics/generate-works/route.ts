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

export const maxDuration = 60;

const GEMINI_TEXT_MODEL = "gemini-2.5-flash";
const MAX_CONCURRENT_TOPIC_GENERATIONS = 4;
const WORK_TIMEOUT_MS = 45_000;

function raceWithTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label}_TIMEOUT`));
    }, timeoutMs);
    promise.then(
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

function buildPerTopicPrompt(params: {
  topicTitle: string;
  topicHint: string;
  workTypeLabel: string;
  subjectLabel: string;
  pagesPerTopic: string;
  language: "uz" | "ru" | "en";
}): string {
  const targetWordRange = getWordRangeForPages(params.pagesPerTopic);
  const avgPages = estimateAveragePageCount(params.pagesPerTopic);
  const scaleFactor = Math.max(1, avgPages / 2.5);
  const introWords = Math.round(120 * scaleFactor);
  const sectionWords = Math.round(240 * scaleFactor);
  const conclusionWords = Math.round(110 * scaleFactor);

  if (params.language === "ru") {
    return `Напишите качественную самостоятельную работу (${params.pagesPerTopic} страницы А4, примерно ${targetWordRange} слов) строго по теме:
Тема: "${params.topicTitle}"
Предмет: "${params.subjectLabel}"
${params.topicHint && params.topicHint !== params.topicTitle ? `Дополнительные заметки из изображения:\n"""\n${params.topicHint}\n"""\n` : ""}
Структура ответа (чистый Markdown без лишних предисловий):
## План работы
1. ...
2. ...
3. ...

### Введение
(Актуальность, цель и задачи исследования — не менее ${introWords} слов)

### 1. Теоретические основы темы
(Подробный академический анализ, определения и классификация — не менее ${sectionWords} слов)

### 2. Практический анализ и современные подходы
(Конкретные примеры, механизмы и сравнительный анализ — не менее ${sectionWords} слов)

### Заключение
(Основные выводы и рекомендации — не менее ${conclusionWords} слов)

### Список использованной литературы
1. ...
2. ...
3. ...`;
  }

  return `Oliy ta'lim standartlariga mos to'liq "${params.workTypeLabel}" (${params.pagesPerTopic} A4 betlik, taxminan ${targetWordRange} so'z hajmida) yozib bering.
- Mavzu: "${params.topicTitle}"
- Fan: "${params.subjectLabel}"
${params.topicHint && params.topicHint !== params.topicTitle ? `- Rasmdan olingan qo'shimcha ma'lumot / reja:\n"""\n${params.topicHint}\n"""\n` : ""}
QAT'IY TALABLAR:
1. Matn FAQAT va FAQAT "${params.topicTitle}" mavzusiga chuqur va ilmiy asoslangan holda bag'ishlansin (mavzuning asl tilini saqlang).
2. Har bir bo'limda tugallangan, ravon ilmiy abzaslar va aniq misollar bo'lsin. Umumiy va quruq gaplardan qoching.
3. Javobni FAQAT quyidagi toza Markdown tuzilmasida bering (boshiga ortiqcha salomlashuv yoki izoh yozmang):

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

function buildFallbackWork(title: string, subject: string, workTypeLabel: string): string {
  return `## Reja
1. ${title} tushunchasi va nazariy asoslari
2. ${subject} doirasida mavzuning amaliy tahlili
3. Xulosa va amaliy tavsiyalar

### Kirish
Ushbu ${workTypeLabel.toLowerCase()} "${title}" mavzusiga bag'ishlangan bo'lib, ${subject} fani doirasida mavzuning nazariy ahamiyati va amaliy qo'llanilish jihatlarini yoritib beradi.

### 1. Nazariy asoslar
"${title}" yo'nalishini o'rganishda asosiy tushunchalar, tamoyillar va ilmiy yondashuvlarni tizimli ko'rib chiqish muhim ahamiyat kasb etadi.

### 2. Amaliy tahlil
Zamonaviy sharoitda ushbu mavzuga oid jarayonlarni tahlil qilish samarali yechimlar ishlab chiqish imkonini beradi.

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

  try {
    const ai = new GoogleGenAI({ apiKey });

    const generatedResults = await runWithConcurrency<ParsedTopic, TopicGenerationResult>(
      topics,
      MAX_CONCURRENT_TOPIC_GENERATIONS,
      async (topic) => {
        const effectivePages = topic.pageCount || pagesPerTopic;
        const avgPages = estimateAveragePageCount(effectivePages);
        const prompt = buildPerTopicPrompt({
          topicTitle: topic.title,
          topicHint: topic.content,
          workTypeLabel,
          subjectLabel,
          pagesPerTopic: effectivePages,
          language,
        });

        try {
          const remainingBudgetMs = Math.max(5_000, 52_000 - (Date.now() - startedAt));
          const response = await raceWithTimeout(
            ai.models.generateContent({
              model: GEMINI_TEXT_MODEL,
              contents: prompt,
              config: {
                temperature: 0.3,
                maxOutputTokens: Math.min(16384, Math.max(2500, Math.round(avgPages * 850))),
                systemInstruction: `Siz oliy ta'lim professori va ilmiy ishlar tayyorlash bo'yicha ekspertsiz. Har bir mavzuga so'ralgan hajmda (${effectivePages} betlik) tugallangan akademik ish matnini yozing.`,
              },
            }),
            Math.min(WORK_TIMEOUT_MS, remainingBudgetMs),
            "GENERATE_WORK"
          );

          const text = (response.text ?? "").trim();
          return {
            topic: {
              title: topic.title,
              content: text || buildFallbackWork(topic.title, subjectLabel, workTypeLabel),
            },
            effectivePages,
            inputTokens: response.usageMetadata?.promptTokenCount ?? Math.ceil(prompt.length / 4),
            outputTokens:
              response.usageMetadata?.candidatesTokenCount ?? Math.ceil(text.length / 4),
            usedFallback: !text,
          };
        } catch (err) {
          console.warn(`[GENERATE_WORK_TOPIC_FALLBACK] "${topic.title}":`, err);
          const fallback = buildFallbackWork(topic.title, subjectLabel, workTypeLabel);
          return {
            topic: {
              title: topic.title,
              content: fallback,
            },
            effectivePages,
            inputTokens: Math.ceil(prompt.length / 4),
            outputTokens: Math.ceil(fallback.length / 4),
            usedFallback: true,
          };
        }
      }
    );

    const totalInputTokens = generatedResults.reduce((acc, item) => acc + item.inputTokens, 0);
    const totalOutputTokens = generatedResults.reduce((acc, item) => acc + item.outputTokens, 0);
    const works = generatedResults.map((item) => item.topic);
    const pageCounts = generatedResults.map((item) => item.effectivePages);

    await trackAIUsage({
      userId,
      plan: userPlan,
      feature: "ACADEMIC_GENERATION",
      provider: "gemini",
      model: GEMINI_TEXT_MODEL,
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
