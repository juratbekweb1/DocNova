export const maxDuration = 60;
import { NextResponse } from "next/server";
import { checkUserLimit, trackAIUsage } from "@/lib/limits";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getGeminiModel } from "@/lib/ai/gemini";
import { AI_PROMPTS } from "@/lib/ai/prompts";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    const plan = (user?.plan as string) || "FREE";

    const limitCheck = await checkUserLimit(userId, "chat");
    if (limitCheck.limitExceeded) {
      await trackAIUsage({
        userId,
        plan,
        feature: "CHAT",
        status: "QUOTA_EXCEEDED",
        errorCode: "LIMIT_EXCEEDED",
      });
      return NextResponse.json({ error: limitCheck.error, code: limitCheck.code }, { status: 429 });
    }

    const { message } = await req.json();

    if (!message || message.length > 8000) {
      return NextResponse.json({ error: "Invalid or too long message" }, { status: 400 });
    }

    const startTime = Date.now();
    let reply = "Kechirasiz, men hozir javob bera olmayman.";
    let status: "SUCCESS" | "FAILED" = "SUCCESS";
    let errorCode: string | undefined = undefined;
    let inputTokens = 0;
    let outputTokens = 0;

    // Supported candidate models to try in order
    const candidateModels = [
      process.env.GEMINI_MODEL,
      "gemini-1.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-pro",
      "gemini-pro",
    ].filter(Boolean) as string[];

    let success = false;
    const prompt = `${AI_PROMPTS.NOVA_SYSTEM}\n\nUser: ${message}`;

    for (const modelName of candidateModels) {
      try {
        const model = getGeminiModel(modelName);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        if (text && text.trim().length > 0) {
          reply = text;
          success = true;

          if (response.usageMetadata) {
            inputTokens = response.usageMetadata.promptTokenCount || 0;
            outputTokens = response.usageMetadata.candidatesTokenCount || 0;
          } else {
            inputTokens = Math.ceil(prompt.length / 4);
            outputTokens = Math.ceil(reply.length / 4);
          }
          break;
        }
      } catch (err: unknown) {
        const errMessage = err instanceof Error ? err.message : String(err);
        console.warn(`Gemini model ${modelName} failed in chat:`, errMessage);
      }
    }

    if (!success) {
      status = "FAILED";
      errorCode = "API_ERROR";

      // Resilient fallback assistant response based on context
      const lower = message.toLowerCase();
      if (
        lower.includes("salom") ||
        lower.includes("assalomu") ||
        lower.includes("qalaysiz") ||
        lower.includes("hello") ||
        lower.includes("privet")
      ) {
        reply =
          "Assalomu alaykum! Men Novaman — DocNova platformasining aqlli karyera va o'quv yordamchisiman. Sizga rezyume yaratish, ATS tahlili, kurs ishi yoki mock-testlar bo'yicha qanday yordam bera olaman?";
      } else if (lower.includes("rezyume") || lower.includes("cv")) {
        reply =
          "Rezyume tayyorlash uchun DocNova'ning 'CV & Resume Hub' bo'limiga o'tishingiz mumkin. U yerda 8 ta professional dizayn shablonlari va A4 formatda PDF yuklab olish imkoniyati mavjud.";
      } else if (
        lower.includes("kurs") ||
        lower.includes("referat") ||
        lower.includes("akademik")
      ) {
        reply =
          "Kurs ishi va referatlar yaratish uchun 'Akademik' bo'limimizdan foydalanishingiz mumkin. Tizim reja, kirish, boblar va xulosalarni standart talablarga mos tuzib beradi.";
      } else {
        reply =
          "Savolingiz qabul qilindi. AI xizmati serverda yangilanmoqda. Agar platforma funksiyalari (CV Builder, Kurs ishi, ATS tahlil) bo'yicha savollaringiz bo'lsa, bemalol murojaat qilishingiz mumkin!";
      }
    }

    const duration = Date.now() - startTime;

    await trackAIUsage({
      userId,
      plan,
      feature: "CHAT",
      status,
      inputTokens,
      outputTokens,
      requestDurationMs: duration,
      errorCode,
    });

    // Return the response to the user smoothly
    return NextResponse.json({
      reply,
      remaining: Math.max(0, limitCheck.remaining - 1),
      limit: limitCheck.totalLimit,
    });
  } catch (error: unknown) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
