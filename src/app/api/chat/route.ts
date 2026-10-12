export const maxDuration = 60;
import { NextResponse } from "next/server";
import { checkUserLimit, trackAIUsage } from "@/lib/limits";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getGeminiModel } from "@/lib/ai/gemini";
import { AI_PROMPTS } from "@/lib/ai/prompts";
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
    
    // Fallback if organizationId is not directly on user but through OrganizationUser
    let organizationId: string | undefined = undefined;
    if (false) {
       organizationId = (user as any).organizationId;
    }

    const plan = (user?.plan as any as string) || "FREE";

    const limitCheck = await checkUserLimit(userId, "chat");
    if (limitCheck.limitExceeded) {
      await trackAIUsage({
        userId,
        organizationId,
        plan,
        feature: "CHAT",
        status: "QUOTA_EXCEEDED",
        errorCode: "LIMIT_EXCEEDED"
      });
      return NextResponse.json(
        { error: limitCheck.error, code: limitCheck.code },
        { status: 429 }
      );
    }

    const { message } = await req.json();

    if (!message || message.length > 8000) {
      return NextResponse.json({ error: "Invalid or too long message" }, { status: 400 });
    }

    const startTime = Date.now();
    let reply = "Xatolik yuz berdi.";
    let status: "SUCCESS" | "FAILED" = "SUCCESS";
    let errorCode: string | undefined = undefined;
    let inputTokens = 0;
    let outputTokens = 0;

    try {
      const model = getGeminiModel(process.env.GEMINI_MODEL || "gemini-3.8-flash");
      const prompt = `${AI_PROMPTS.NOVA_SYSTEM}\n\nUser: ${message}`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      reply = response.text() || "Kechirasiz, men hozir javob bera olmayman.";
      
      if (response.usageMetadata) {
        inputTokens = response.usageMetadata.promptTokenCount || 0;
        outputTokens = response.usageMetadata.candidatesTokenCount || 0;
      } else {
        // Fallback estimation
        inputTokens = Math.ceil(prompt.length / 4);
        outputTokens = Math.ceil(reply.length / 4);
      }
    } catch (apiError: any) {
      console.error("Gemini Chat API Error:", apiError);
      status = "FAILED";
      errorCode = "API_ERROR";
      reply = "ERROR: " + (apiError.message || apiError.toString());
    }

    const duration = Date.now() - startTime;

    await trackAIUsage({
      userId,
      organizationId,
      plan,
      feature: "CHAT",
      status,
      inputTokens,
      outputTokens,
      requestDurationMs: duration,
      errorCode
    });

    if (status === "FAILED") {
      return NextResponse.json({ reply, error: reply }, { status: 503 });
    }

    return NextResponse.json({ reply, remaining: limitCheck.remaining - 1, limit: limitCheck.totalLimit });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
