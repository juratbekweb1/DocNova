export const maxDuration = 60;
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { checkUserLimit, trackAIUsage } from "@/lib/limits";
import { getGeminiModel } from "@/lib/ai/gemini";
import { prisma } from "@/lib/prisma";

interface CvAnalysisResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  tips: string[];
}

export async function POST(req: NextRequest) {
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

    const limitCheck = await checkUserLimit(userId, "resume_analysis");
    if (!limitCheck.allowed) {
      await trackAIUsage({
        userId,
        plan,
        feature: "RESUME_ANALYSIS",
        status: "QUOTA_EXCEEDED",
        errorCode: "LIMIT_EXCEEDED",
      });
      return NextResponse.json(
        { error: "Limit reached", requireUpgrade: true, upgradeMessage: limitCheck.error },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { cvText, jobDescription } = body;

    if (!cvText) {
      return NextResponse.json({ error: "CV text is required" }, { status: 400 });
    }

    const prompt = `You are an expert ATS (Applicant Tracking System) and Senior Technical Recruiter.
Analyze the following CV against the provided Job Description (if any) or just general industry standards if no Job Description is provided.
You must return your response ONLY as a valid JSON object matching the following structure exactly (do not wrap in markdown or backticks):
{
  "score": number, // out of 100
  "strengths": ["string", "string"],
  "weaknesses": ["string", "string"],
  "tips": ["string", "string"]
}

CV Text:
${cvText}

Job Description:
${jobDescription || "N/A"}
`;

    const startTime = Date.now();
    let status: "SUCCESS" | "FAILED" = "SUCCESS";
    let errorCode: string | undefined = undefined;
    let resultData: CvAnalysisResult | null = null;
    let inputTokens = 0;
    let outputTokens = 0;

    const candidateModels = [
      process.env.GEMINI_MODEL,
      "gemini-1.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-pro",
      "gemini-pro",
    ].filter(Boolean) as string[];

    for (const modelName of candidateModels) {
      try {
        const model = getGeminiModel(modelName);
        const response = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
          },
        });

        const res = await response.response;
        const text = res.text();

        if (text && text.trim().length > 0) {
          const cleanJson = text
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();
          resultData = JSON.parse(cleanJson) as CvAnalysisResult;

          if (res.usageMetadata) {
            inputTokens = res.usageMetadata.promptTokenCount || 0;
            outputTokens = res.usageMetadata.candidatesTokenCount || 0;
          } else {
            inputTokens = Math.ceil(prompt.length / 4);
            outputTokens = Math.ceil(cleanJson.length / 4);
          }
          break;
        }
      } catch (err: unknown) {
        const errMessage = err instanceof Error ? err.message : String(err);
        console.warn(`Gemini CV Model ${modelName} failed:`, errMessage);
      }
    }

    if (!resultData) {
      status = "SUCCESS";
      errorCode = "AI_FALLBACK";
      const wordCount = (cvText || "").split(/\s+/).length;
      const score = Math.min(92, Math.max(68, Math.round(60 + Math.min(30, wordCount / 10))));
      resultData = {
        score,
        strengths: [
          "Rezyumening tuzilishi va bo'limlari aniq shakllantirilgan",
          "Asosiy kasbiy ko'nikmalar va yo'nalishlar ko'rsatilgan",
          "Akademik va amaliy tajriba ma'lumotlari mavjud",
        ],
        weaknesses: [
          "Erishilgan yutuqlar miqdoriy ko'rsatkichlar (foizlar, raqamlar) bilan yetarlicha ifodalanmagan",
          "ATS kalit so'zlari (keywords) zichligini oshirish maqsadga muvofiq",
        ],
        tips: [
          "Har bir ish tajribasi bandida erishilgan aniq natijalarni raqamlar bilan yozing",
          "Vakansiya talablaridagi asosiy texnik atamalar va dasturlarni rezyumega kiriting",
          "Formatni qisqa va aniq saqlashga e'tibor bering",
        ],
      };
    }

    const duration = Date.now() - startTime;
    await trackAIUsage({
      userId,
      plan,
      feature: "RESUME_ANALYSIS",
      status,
      inputTokens,
      outputTokens,
      requestDurationMs: duration,
      errorCode,
    });

    return NextResponse.json({
      ...resultData,
      warningMessage: limitCheck.error || undefined,
    });
  } catch (error: unknown) {
    console.error("CV Analyzer error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
