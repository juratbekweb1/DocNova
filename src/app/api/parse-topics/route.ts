import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { GoogleGenAI, Type } from "@google/genai";
import { authOptions } from "@/lib/auth-options";
import { getUserSubscription, trackAIUsage } from "@/lib/limits";
import { aiDemoRateLimiter } from "@/lib/security/rate-limiter";
import {
  extractBase64Image,
  parseGeminiTopicsPayload,
  parseTopicsRequestSchema,
} from "@/lib/academic/topic-parser";
import { detectAcademicLanguage } from "@/lib/academic/topic-fidelity";

export const maxDuration = 60;

const GEMINI_VISION_MODEL =
  process.env.GEMINI_VISION_MODEL?.trim() || process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash";
const GEMINI_VISION_FALLBACK_MODEL = "gemini-3.1-flash-lite";
const GEMINI_VISION_EMERGENCY_MODEL = "gemini-flash-latest";
const PARSE_TIMEOUT_MS = 40_000;

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

const TOPIC_EXTRACTION_PROMPT = `Sen talabalar va akademik materiallar bo'yicha o'ta aniq OCR (rasmdan matn o'qish) va tuzilmalashtiruvchi AI yordamchisisan.
Yuklangan rasmni diqqat bilan tahlil qil (bu darslik sahifasi, daftar/konspekt rasmi, jadval, syllabus, mustaqil ish mavzulari ro'yxati, laboratoriya/amaliy topshiriq yoki imtihon bilet savollari bo'lishi mumkin).

MUTLAQ QOIDALAR (O'ZINGDAN TO'QIMA):
1. Rasmda yozilgan BARCHA mavzular, savollar, topshiriqlar yoki bandlarni yuqoridan pastga (ikki ustun bo'lsa chapdan o'ngga) qat'iy asl tartibda ANIQ va SO'ZMA-SO'Z o'qib chiq.
2. Mavzuning ASL TILI va ALIFBOSINI 100% saqla: O'zbek lotin -> lotinda ("uz"), Ўзбек кирилл -> кириллда ("uz-cyrl"), Русский -> русчада ("ru"), English -> inglizchada ("en"). Hech qachon tilni o'zgartirma yoki tarjima qilib yuborma.
3. Ilmiy atamalar, formulalar (masalan: E=mc², H₂SO₄, O(n log n)), yillar, PF/O'RQ hujjat raqamlari va shaxs/joy nomlarini o'zgartirmasdan aniq ko'chir.
4. QISQARUVCHISIZ SARLAVHA / JADVAL FILTRI:
   - Jadval sarlavhalari ("№", "T/r", "№ п/п", "Mavzu nomi", "Soat", "Sana", "Ball", "Izoh", "Imzo") yoki hujjat shapkasidagi texnik ma'lumotlarni ("Fakultet:", "Guruh:", "Talaba F.I.Sh.") alohida mavzu sifatida "topics" massiviga QO'SHMA!
   - Agar rasm tepasida fan nomi yozilgan bo'lsa (masalan: "Fan: Oliy matematika" yoki "Предмет: Физика"), uni alohida "subject" maydoniga yoz.
5. Har bir topilgan mavzu uchun:
   - "title": Mavzu sarlavhasi (raqami bilan bo'lsa raqamini saqla, masalan: "1. Kvant mexanikasi asoslari").
   - "content": FAQAT rasmda shu mavzu ostida yoki yonida ko'rsatilgan qo'shimcha matn, reja bandlari, shartlar, formulalar yoki soat/izohlar. AGAR rasmda faqat mavzular ro'yxati (qo'shimcha izohsiz sarlavhalar) berilgan bo'lsa, "content" maydonini BO'SH SATR ("") qoldir — o'zingdan reja yoki matn o'ylab topib to'ldirma!
6. Agar rasmda o'qib bo'ladigan birorta ham mavzu topilmasa, {"topics": []} qaytar.
7. Faqat toza JSON qaytar, boshqa izoh qo'shma.`;

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

  const parsedRequest = parseTopicsRequestSchema.safeParse(body);
  if (!parsedRequest.success) {
    const firstIssue = parsedRequest.error.issues[0]?.message || "Noto'g'ri so'rov ma'lumotlari";
    return NextResponse.json({ error: firstIssue }, { status: 400 });
  }

  const rawImage = parsedRequest.data.image ?? parsedRequest.data.imageBase64 ?? "";
  const imageResult = extractBase64Image(rawImage, parsedRequest.data.mimeType);
  if (!imageResult.ok) {
    return NextResponse.json({ error: imageResult.error }, { status: imageResult.status });
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY sozlanmagan. Server konfiguratsiyasini tekshiring." },
      { status: 503 }
    );
  }

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

    const callVisionModel = (model: string, timeoutMs: number) =>
      raceWithTimeout(
        ai.models.generateContent({
          model,
          contents: [
            {
              inlineData: {
                mimeType: imageResult.mimeType,
                data: imageResult.data,
              },
            },
            {
              text: TOPIC_EXTRACTION_PROMPT,
            },
          ],
          config: {
            temperature: 0.05,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                subject: {
                  type: Type.STRING,
                  description: "Rasmda ko'rsatilgan fan nomi (agar mavjud bo'lsa)",
                },
                language: {
                  type: Type.STRING,
                  description: "Asosiy hujjat tili: uz, uz-cyrl, ru yoki en",
                },
                topics: {
                  type: Type.ARRAY,
                  description: "Rasmdan ajratib olingan barcha mavzular ro'yxati",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: {
                        type: Type.STRING,
                        description: "Rasmdagi aniq mavzu sarlavhasi",
                      },
                      content: {
                        type: Type.STRING,
                        description:
                          "Rasmda shu mavzu ostidagi matn/reja/formula (agar bo'lmasa bo'sh satr)",
                      },
                    },
                    required: ["title", "content"],
                  },
                },
              },
              required: ["topics"],
            },
          },
        }),
        timeoutMs,
        "PARSE_TOPICS"
      );

    let modelUsed = GEMINI_VISION_MODEL;
    let response;
    try {
      response = await callVisionModel(GEMINI_VISION_MODEL, PARSE_TIMEOUT_MS);
    } catch (primaryErr) {
      const msg = primaryErr instanceof Error ? primaryErr.message : "";
      const remainingMs = PARSE_TIMEOUT_MS - (Date.now() - startedAt);
      if (msg.includes("PARSE_TOPICS_TIMEOUT") || remainingMs < 6_000) {
        throw primaryErr;
      }
      modelUsed = GEMINI_VISION_FALLBACK_MODEL;
      try {
        response = await callVisionModel(GEMINI_VISION_FALLBACK_MODEL, remainingMs);
      } catch (secondaryErr) {
        const secondaryMsg = secondaryErr instanceof Error ? secondaryErr.message : "";
        const secondRemainingMs = PARSE_TIMEOUT_MS - (Date.now() - startedAt);
        if (secondaryMsg.includes("PARSE_TOPICS_TIMEOUT") || secondRemainingMs < 6_000) {
          throw secondaryErr;
        }
        modelUsed = GEMINI_VISION_EMERGENCY_MODEL;
        response = await callVisionModel(GEMINI_VISION_EMERGENCY_MODEL, secondRemainingMs);
      }
    }

    const rawText = response.text ?? "";
    const parsedTopics = parseGeminiTopicsPayload(rawText);
    const sampleCombined = parsedTopics.topics
      .slice(0, 5)
      .map((t) => `${t.title} ${t.content}`.trim())
      .join("\n");
    const resolvedLanguage =
      parsedTopics.language ??
      (sampleCombined ? detectAcademicLanguage(sampleCombined) : undefined);

    await trackAIUsage({
      userId,
      plan: userPlan,
      feature: "ACADEMIC_GENERATION",
      provider: "gemini",
      model: modelUsed,
      status: "SUCCESS",
      inputTokens: response.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
      requestDurationMs: Date.now() - startedAt,
    });

    return NextResponse.json(
      {
        topics: parsedTopics.topics,
        ...(parsedTopics.subject ? { subject: parsedTopics.subject } : {}),
        ...(resolvedLanguage ? { language: resolvedLanguage } : {}),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[PARSE_TOPICS_ERROR]", error);
    const errorMessage = error instanceof Error ? error.message : "Noma'lum xatolik";
    const isTimeoutError = errorMessage.includes("PARSE_TOPICS_TIMEOUT");
    const isQuotaError =
      errorMessage.includes("429") ||
      errorMessage.toLowerCase().includes("quota") ||
      errorMessage.toLowerCase().includes("rate limit");

    await trackAIUsage({
      userId,
      plan: userPlan,
      feature: "ACADEMIC_GENERATION",
      provider: "gemini",
      model: GEMINI_VISION_MODEL,
      status: isQuotaError ? "RATE_LIMITED" : "FAILED",
      requestDurationMs: Date.now() - startedAt,
      errorCode: isTimeoutError
        ? "PARSE_TOPICS_TIMEOUT"
        : isQuotaError
          ? "GEMINI_RATE_LIMIT"
          : "PARSE_TOPICS_ERROR",
    });

    return NextResponse.json(
      {
        error: isTimeoutError
          ? "Rasmni tahlil qilish vaqti tugadi. Iltimos, aniqroq yoki kichikroq rasm bilan qayta urinib ko'ring."
          : isQuotaError
            ? "AI xizmati vaqtincha band (limit oshdi). Bir necha soniyadan so'ng qayta urinib ko'ring."
            : "Rasmni tahlil qilishda xatolik yuz berdi. Iltimos qayta urinib ko'ring.",
      },
      { status: isTimeoutError ? 504 : isQuotaError ? 429 : 500 }
    );
  }
}
