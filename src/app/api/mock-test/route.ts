import { NextResponse } from "next/server";
import { checkUserLimit, trackAIUsage } from "@/lib/limits";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { generateMockTestQuestion, evaluateMockTestAnswer } from "@/lib/ai/geminiService";
import { prisma } from "@/lib/prisma";
import { SubscriptionTier } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true }
    });
    const plan = (user?.plan as any as string) || "FREE";

    const limitCheck = await checkUserLimit(userId, "mock_test");
    if (limitCheck.limitExceeded) {
      await trackAIUsage({ userId, plan, feature: "MOCK_TEST", status: "QUOTA_EXCEEDED", errorCode: "LIMIT_EXCEEDED" });
      return NextResponse.json({ error: limitCheck.error, code: limitCheck.code }, { status: 429 });
    }

    const { action, lang, role, difficulty, answer, questionCount } = await req.json();

    const startTime = Date.now();
    let status: "SUCCESS" | "FAILED" = "SUCCESS";
    let errorCode: string | undefined = undefined;
    let resultData: any;

    try {
      if (action === "start") {
        const nextQuestion = await generateMockTestQuestion(lang, role, difficulty);
        resultData = { nextQuestion };
      } else if (action === "answer") {
        resultData = await evaluateMockTestAnswer(answer, questionCount);
      } else {
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
      }
    } catch (err: any) {
      status = "FAILED";
      errorCode = "API_ERROR";
      resultData = { error: "Xatolik yuz berdi" };
    }

    const duration = Date.now() - startTime;
    await trackAIUsage({
      userId,
      plan,
      feature: "MOCK_TEST",
      status,
      requestDurationMs: duration,
      errorCode
    });

    if (status === "FAILED") {
       return NextResponse.json(resultData, { status: 503 });
    }
    
    return NextResponse.json(resultData);
  } catch (error) {
    console.error("Mock Test API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
