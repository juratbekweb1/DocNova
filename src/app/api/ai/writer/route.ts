export const maxDuration = 60;
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { checkUserLimit, trackAIUsage } from "@/lib/limits";
import { getGeminiModel } from "@/lib/ai/gemini";
import { prisma } from "@/lib/prisma";
import { SubscriptionTier } from "@prisma/client";

export async function POST(req: NextRequest) {
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

    let organizationId: string | undefined = undefined;
    if (false) {
       organizationId = (user as any).organizationId;
    }
    const plan = (user?.plan as any as string) || "FREE";

    const limitCheck = await checkUserLimit(userId, "rewrite");
    if (!limitCheck.allowed) {
      await trackAIUsage({ userId, organizationId, plan, feature: "REWRITE", status: "QUOTA_EXCEEDED", errorCode: "LIMIT_EXCEEDED" });
      return NextResponse.json(
        { error: "Limit reached", requireUpgrade: true, upgradeMessage: limitCheck.error },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { prompt: userPrompt, action } = body;

    let systemInstruction = "You are a professional AI writer.";
    if (action === "improve") {
      systemInstruction =
        "Improve the following text. Make it more professional, grammatically correct, and engaging. Only return the improved text.";
    } else if (action === "summarize") {
      systemInstruction =
        "Summarize the following text in a concise and clear manner. Only return the summary.";
    }

    const prompt = `${systemInstruction}\n\nUser Input: ${userPrompt}`;

    const startTime = Date.now();
    let status: "SUCCESS" | "FAILED" = "SUCCESS";
    let errorCode: string | undefined = undefined;
    let result = "";
    let inputTokens = 0;
    let outputTokens = 0;

    try {
      const model = getGeminiModel(process.env.GEMINI_MODEL || "gemini-1.5-flash");
      const response = await model.generateContent(prompt);
      const res = await response.response;
      result = res.text() || "";
      
      if (res.usageMetadata) {
        inputTokens = res.usageMetadata.promptTokenCount || 0;
        outputTokens = res.usageMetadata.candidatesTokenCount || 0;
      } else {
        inputTokens = Math.ceil(prompt.length / 4);
        outputTokens = Math.ceil(result.length / 4);
      }
    } catch (apiError: any) {
      console.error("Gemini Writer API Error:", apiError);
      status = "FAILED";
      errorCode = "API_ERROR";
      return NextResponse.json({ error: "ERROR: " + (apiError.message || apiError.toString()) }, { status: 503 });
    } finally {
      const duration = Date.now() - startTime;
      await trackAIUsage({
        userId,
        organizationId,
        plan,
        feature: "REWRITE",
        status,
        inputTokens,
        outputTokens,
        requestDurationMs: duration,
        errorCode
      });
    }

    return NextResponse.json({ result, warningMessage: limitCheck.error || undefined });
  } catch (error) {
    console.error("AI Writer error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
