import { NextResponse } from "next/server";
import { checkUserLimit, incrementFeatureUsage } from "@/lib/limits";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { generateMockTestQuestion, evaluateMockTestAnswer } from "@/lib/ai/geminiService";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || "mock-user-id";
    const { action, role, difficulty, lang, answer, questionCount } = await req.json();

    if (action === "start") {
      if (session?.user?.id) {
        const limitCheck = await checkUserLimit(userId, "mock_test");
        if (limitCheck.limitExceeded) {
          return NextResponse.json({ error: limitCheck.error }, { status: 429 });
        }
      }
      const nextQuestion = await generateMockTestQuestion(lang, role, difficulty);
      
      if (session?.user?.id) {
        await incrementFeatureUsage(userId, "mock_test");
      }
      
      return NextResponse.json({ nextQuestion });
    }

    if (action === "answer") {
      const result = await evaluateMockTestAnswer(answer, questionCount);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Mock Test API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
