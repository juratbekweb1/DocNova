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

export const maxDuration = 60;

const GEMINI_VISION_MODEL = "gemini-2.5-flash";
const PARSE_TIMEOUT_MS = 40_000;

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

const TOPIC_EXTRACTION_PROMPT = `Sen talabalar va akademik materiallar bo'yicha mutaxassis OCR hamda tuzilmalashtiruvchi AI yordamchisisan.
Yuklangan rasmni diqqat bilan tahlil qil (bu darslik sahifasi, daftar/konspekt rasmi, mavzular ro'yxati, slaydda berilgan reja, syllabus yoki imtihon savollari bo'lishi mumkin).

VAZIFA:
1. Rasm ichidagi BARCHA mavzular, bo'limlar yoki bandlarni tartib bilan o'qib chiq (1 ta bo'lsa 1 ta, 10 ta yoki undan ko'p bo'lsa hammasini alohida ajrat).
2. Matn qaysi tilda yozilgan bo'lsa (o'zbek, rus, ingliz va h.k.), o'sha asl tilini va atamalarini saqlagan holda tozalab yoz.
3. Har bir topilgan mavzuni quyidagi JSON tuzilmasida qaytar:
   - "title": Mavzu sarlavhasi (raqami bilan bo'lsa tartibini saqlash mumkin, aniq va tushunarli sarlavha).
   - "content": Ushbu mavzuga tegishli rasmdagi barcha matn, izoh, formulalar, asosiy fikrlar yoki reja bandlari. Agar rasmda faqat mavzular ro'yxati (izohsiz sarlavhalar) berilgan bo'lsa, "content" maydoniga shu mavzuni yoritish uchun qisqa akademik reja/tavsif yozib ber.
4. Agar rasmda o'qib bo'ladigan birorta ham mavzu yoki matn topilmasa, bo'sh massiv qaytar: {"topics": []}.
5. Faqat toza JSON qaytar, boshqa izoh qo'shma.`;

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

    const response = await raceWithTimeout(
      ai.models.generateContent({
        model: GEMINI_VISION_MODEL,
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
          temperature: 0.1,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              topics: {
                type: Type.ARRAY,
                description: "Rasmdan ajratib olingan barcha mavzular ro'yxati",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: {
                      type: Type.STRING,
                      description: "Mavzu sarlavhasi",
                    },
                    content: {
                      type: Type.STRING,
                      description: "Mavzuga oid to'liq matn yoki qisqa reja/tavsif",
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
      PARSE_TIMEOUT_MS,
      "PARSE_TOPICS"
    );

    const rawText = response.text ?? "";
    const parsedTopics = parseGeminiTopicsPayload(rawText);

    await trackAIUsage({
      userId,
      plan: userPlan,
      feature: "ACADEMIC_GENERATION",
      provider: "gemini",
      model: GEMINI_VISION_MODEL,
      status: "SUCCESS",
      inputTokens: response.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
      requestDurationMs: Date.now() - startedAt,
    });

    return NextResponse.json({ topics: parsedTopics.topics }, { status: 200 });
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
