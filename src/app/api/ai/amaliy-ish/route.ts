import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { generateGeminiJson } from "@/lib/gemini";
import { trackAIUsage } from "@/lib/limits";
import {
  AmaliyIshFormInput,
  generateDeterministicAmaliyIsh,
  renderAmaliyIshToMarkdown,
} from "@/lib/amaliy-ish-generator";

export const maxDuration = 60;

interface AiAmaliyEnrichment {
  problem1Condition?: string;
  problem1Interpretation?: string;
  problem2Condition?: string;
  problem2Interpretation?: string;
  problem3Condition?: string;
  problem3Interpretation?: string;
  problem4Condition?: string;
  problem4Interpretation?: string;
  conclusions?: string[];
  practicalRecommendations?: string[];
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = (await req.json().catch(() => ({}))) as Partial<AmaliyIshFormInput>;

    const subject = String(body.subject || "").trim();
    const topic = String(body.topic || "").trim();

    if (!subject && !topic) {
      return NextResponse.json(
        {
          error: "Iltimos, fan nomi va amaliy ish mavzusini kiriting.",
        },
        { status: 400 }
      );
    }

    const rawCount = Number(body.problemCount || 4);
    const problemCount: 2 | 3 | 4 = rawCount === 2 ? 2 : rawCount === 3 ? 3 : 4;

    const cleanInput: Partial<AmaliyIshFormInput> = {
      university: String(body.university || "Toshkent to'qimachilik va yengil sanoat instituti")
        .trim()
        .slice(0, 220),
      department: String(body.department || "Iqtisodiyot va raqamli texnologiyalar kafedrasi")
        .trim()
        .slice(0, 220),
      subject: (subject || "Iqtisodiyotda ma'lumotlar tahlili").slice(0, 200),
      topic: (topic || "Bir omilli va ikki omilli dispersion tahlil").slice(0, 250),
      situation: String(body.situation || "Ishlab chiqarish smenalari va xodimlar so'rovi")
        .trim()
        .slice(0, 300),
      variant: String(body.variant || "18-variant")
        .trim()
        .slice(0, 40),
      problemCount,
      studentName: String(body.studentName || "Karimov Sardorbek Anvar o'g'li")
        .trim()
        .slice(0, 150),
      studentGroup: String(body.studentGroup || "IQT-22-18")
        .trim()
        .slice(0, 60),
      teacherName: String(body.teacherName || "dots. Raximov B.SH.")
        .trim()
        .slice(0, 150),
      city: String(body.city || "Toshkent")
        .trim()
        .slice(0, 80),
      year: String(body.year || new Date().getFullYear())
        .trim()
        .slice(0, 10),
      language: body.language === "ru" || body.language === "en" ? body.language : "uz",
      customProblemText: body.customProblemText
        ? String(body.customProblemText).trim().slice(0, 2000)
        : undefined,
    };

    const document = generateDeterministicAmaliyIsh(cleanInput);

    // Optional AI enrichment for custom topics/subjects/languages while keeping 100% verified ANOVA math
    const isDefault18 =
      (cleanInput.language || "uz") === "uz" &&
      cleanInput.topic?.toLowerCase().includes("bir omilli va ikki omilli dispersion tahlil") &&
      cleanInput.situation?.toLowerCase().includes("ishlab chiqarish smenalari") &&
      !cleanInput.customProblemText;

    if (!isDefault18) {
      try {
        const langName =
          cleanInput.language === "ru"
            ? "rus tilida (на русском языке)"
            : cleanInput.language === "en"
              ? "ingliz tilida (in English)"
              : "o'zbek tilida";
        const prompt = `Siz OTM professori va statistik-iqtisodiy tahlil ekspertisiz.
Quyidagi amaliy ish uchun masalalar sharti va iqtisodiy talqinlarini ${langName} mazmunan boyitib JSON formatda qaytaring:
- Fan: "${cleanInput.subject}"
- Mavzu: "${cleanInput.topic}"
- Vaziyat: "${cleanInput.situation}"
- Variant: "${cleanInput.variant}"
- Til: "${cleanInput.language || "uz"}"
${cleanInput.customProblemText ? `- Talaba kiritgan masala sharti: "${cleanInput.customProblemText}"` : ""}

Quyidagi JSON sxemasida javob qaytaring (faqat JSON):
{
  "problem1Condition": "1-masala sharti (bir omilli tahlil, 3 guruh x 5 kuzatuv)",
  "problem1Interpretation": "1-masala yakuniy iqtisodiy-amaliy talqini",
  "problem2Condition": "2-masala sharti (yig'ma statistikalar bo'yicha tahlil, teng bo'lmagan 3 ta guruh: 5, 4, 5 kuzatuv)",
  "problem2Interpretation": "2-masala yakuniy talqini",
  "problem3Condition": "3-masala sharti (ikki omilli tahlil: 3x4 jadval)",
  "problem3Interpretation": "3-masala yakuniy talqini",
  "problem4Condition": "4-masala sharti (qisman to'ldirilgan ANOVA jadvalini to'ldirish va Fisher LSD juftlik tahlili)",
  "problem4Interpretation": "4-masala yakuniy talqini",
  "conclusions": ["1-xulosa", "2-xulosa", "3-xulosa"],
  "practicalRecommendations": ["1-tavsiya", "2-tavsiya", "3-tavsiya"]
}`;

        const aiRes = await generateGeminiJson<AiAmaliyEnrichment>(prompt, {
          temperature: 0.3,
          maxOutputTokens: 2048,
          timeoutMs: 14_000,
        });

        const data = aiRes.data;
        if (data) {
          if (data.problem1Condition && document.problems[0]) {
            document.problems[0].condition = data.problem1Condition;
          }
          if (data.problem1Interpretation && document.problems[0]) {
            document.problems[0].stepE.economicInterpretation = data.problem1Interpretation;
          }
          if (data.problem2Condition && document.problems[1]) {
            document.problems[1].condition = data.problem2Condition;
          }
          if (data.problem2Interpretation && document.problems[1]) {
            document.problems[1].stepE.economicInterpretation = data.problem2Interpretation;
          }
          if (data.problem3Condition && document.problems[2]) {
            document.problems[2].condition = data.problem3Condition;
          }
          if (data.problem3Interpretation && document.problems[2]) {
            document.problems[2].stepE.economicInterpretation = data.problem3Interpretation;
          }
          if (data.problem4Condition && document.problems[3]) {
            document.problems[3].condition = data.problem4Condition;
          }
          if (data.problem4Interpretation && document.problems[3]) {
            document.problems[3].stepE.economicInterpretation = data.problem4Interpretation;
          }
          if (Array.isArray(data.conclusions) && data.conclusions.length >= 2) {
            document.summarySection.conclusions = data.conclusions;
          }
          if (
            Array.isArray(data.practicalRecommendations) &&
            data.practicalRecommendations.length >= 2
          ) {
            document.summarySection.practicalRecommendations = data.practicalRecommendations;
          }
          document.markdown = renderAmaliyIshToMarkdown(document);
        }
      } catch {
        // Fallback to deterministic mathematical document seamlessly
      }
    }

    // Track usage if logged in (non-blocking)
    try {
      const session = await getServerSession(authOptions).catch(() => null);
      if (session?.user?.id) {
        await trackAIUsage({
          userId: session.user.id,
          plan: "FREE",
          feature: "AMALIY_ISH",
          status: "SUCCESS",
          requestDurationMs: Date.now() - startTime,
        });
      }
    } catch {
      // Ignore tracking errors
    }

    return NextResponse.json({
      success: true,
      document,
    });
  } catch (error) {
    console.error("[AMALIY_ISH_API_ERR]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Amaliy ish generatsiyasida xatolik yuz berdi.",
      },
      { status: 500 }
    );
  }
}
