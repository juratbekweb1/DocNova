import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { generateGeminiJson } from "@/lib/gemini";
import {
  checkUserLimit,
  trackAIUsage,
  deductUserAiCredit,
  getUserSubscription,
} from "@/lib/limits";
import { evaluateMockTestLocally } from "@/lib/academic/mock-test-evaluator";

export async function POST(req: Request) {
  const startTime = Date.now();
  let userId: string | undefined;
  let plan = "FREE";
  let isGuest = false;

  try {
    const session = await getServerSession(authOptions);
    userId = session?.user?.id;

    if (!userId) {
      isGuest = true;
    } else {
      const sub = await getUserSubscription(userId);
      plan = sub.plan;

      const limitCheck = await checkUserLimit(userId, "mock_test");
      if (!limitCheck.allowed) {
        await trackAIUsage({
          userId,
          plan,
          feature: "MOCK_TEST",
          status: "QUOTA_EXCEEDED",
          errorCode: "LIMIT_EXCEEDED",
        });
        return NextResponse.json(
          {
            error: "Limit reached",
            requireUpgrade: true,
            upgradeMessage:
              limitCheck.error ||
              "Mock Test topshirish bo'yicha limitingiz tugadi. Pro yoki Premium tarifga o'ting.",
          },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const {
      language,
      answers,
      writtenText,
      testType,
      selectedLevel,
      levelId,
      levelShortName,
      questions,
    } = body;

    const langCode = (language || "EN").toUpperCase();
    const cleanLevelId = String(levelId || "")
      .trim()
      .toUpperCase();
    const levelStr = String(selectedLevel || levelShortName || cleanLevelId || "B2").trim();

    // Deterministic scoring on submitted answers
    let correctCount = 0;
    const totalQuestions =
      Array.isArray(questions) && questions.length > 0
        ? questions.length
        : Object.keys(answers || {}).length || 5;

    if (Array.isArray(questions) && questions.length > 0) {
      for (const q of questions) {
        const userChoice = answers?.[q.id];
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

    // Try Gemini AI if user is authenticated and not a guest
    if (!isGuest && userId) {
      const prompt = `You are an internationally certified senior linguistic examiner for official examinations (${testType || "CEFR, IELTS, TRKI, TÖMER"}).
Language tested: ${langCode}
Target Level / Standard: ${cleanLevelId || levelStr} - "${levelStr}" (${testType || ""})
Multiple choice result: ${correctCount} correct out of ${totalQuestions} questions.
Candidate's submitted writing response:
"""
${writtenText || "No written response submitted"}
"""

Evaluate this candidate's proficiency relative to the requested level "${cleanLevelId || levelStr}" (${testType || "Standard"}).
Return ONLY a valid JSON object strictly matching this schema:
{
  "overallScore": number (0-100),
  "bandScore": string (e.g. "IELTS 7.5 • CEFR C1" or "CEFR B2 (88%)" or "ТРКИ-2 • B2 (Сдан)" or "TÖMER İleri (C1)"),
  "cefrLevel": string ("A1" | "A2" | "B1" | "B2" | "C1" | "C2"),
  "grammarScore": number (0-100),
  "vocabularyScore": number (0-100),
  "readingScore": number (0-100),
  "writingScore": number (0-100),
  "strengths": string[] (exactly 3 bullet points in natural Uzbek highlighting exact grammatical or lexical achievements),
  "weaknesses": string[] (exactly 2 bullet points in natural Uzbek highlighting gaps to work on),
  "recommendations": string[] (exactly 3 actionable, high-impact study steps in natural Uzbek),
  "summary": string (A concise 2-3 sentence official academic evaluation in natural Uzbek)
}`;

      try {
        const geminiRes = await generateGeminiJson<Record<string, unknown>>(prompt, {
          temperature: 0.2,
          maxOutputTokens: 2048,
          timeoutMs: 3_500,
          maxRetries: 0,
          systemInstruction:
            "You are a certified senior linguistic examiner. Return ONLY a valid JSON object strictly matching the schema with authentic Uzbek feedback.",
        });

        if (geminiRes.data && geminiRes.data.bandScore) {
          try {
            await deductUserAiCredit(userId);
            await trackAIUsage({
              userId,
              plan,
              feature: "MOCK_TEST",
              provider: "gemini",
              model: geminiRes.modelUsed,
              status: "SUCCESS",
              inputTokens: geminiRes.usage.promptTokenCount,
              outputTokens: geminiRes.usage.candidatesTokenCount,
              requestDurationMs: Date.now() - startTime,
            });
          } catch (trackErr) {
            console.warn("[TRACK_AI_USAGE_WARN]", trackErr);
          }

          const data = geminiRes.data;
          const testPerc = Math.round((correctCount / Math.max(totalQuestions, 1)) * 100);

          return NextResponse.json({
            overallScore: typeof data.overallScore === "number" ? data.overallScore : testPerc,
            bandScore: String(data.bandScore),
            cefrLevel: String(data.cefrLevel || "B2"),
            grammarScore: typeof data.grammarScore === "number" ? data.grammarScore : testPerc,
            vocabularyScore:
              typeof data.vocabularyScore === "number" ? data.vocabularyScore : testPerc,
            readingScore: typeof data.readingScore === "number" ? data.readingScore : testPerc,
            writingScore: typeof data.writingScore === "number" ? data.writingScore : 0,
            strengths:
              Array.isArray(data.strengths) && data.strengths.length > 0 ? data.strengths : [],
            weaknesses:
              Array.isArray(data.weaknesses) && data.weaknesses.length > 0 ? data.weaknesses : [],
            recommendations:
              Array.isArray(data.recommendations) && data.recommendations.length > 0
                ? data.recommendations
                : [],
            summary: String(data.summary || ""),
            isGuest: false,
          });
        }
      } catch (geminiErr) {
        console.warn("[LANGUAGE_TEST_GEMINI_FALLBACK]", geminiErr);
      }
    }

    // High-precision rubric fallback scoring (Instant & Deterministic)
    const localResult = evaluateMockTestLocally({
      language,
      testType,
      selectedLevel,
      levelId,
      levelShortName,
      answers,
      questions,
      writtenText,
      isGuest,
    });

    if (userId) {
      try {
        await deductUserAiCredit(userId);
        await trackAIUsage({
          userId,
          plan,
          feature: "MOCK_TEST",
          provider: "fallback",
          model: "rubric-scoring",
          status: "SUCCESS",
          inputTokens: 500,
          outputTokens: 400,
          requestDurationMs: Date.now() - startTime,
          errorCode: "AI_FALLBACK",
        });
      } catch (trackErr) {
        console.warn("[TRACK_USAGE_ERROR]", trackErr);
      }
    }

    return NextResponse.json(localResult);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Language test API Error:", error);
    return NextResponse.json(
      { error: error.message || "Test baholashda xatolik yuz berdi" },
      { status: 500 }
    );
  }
}
