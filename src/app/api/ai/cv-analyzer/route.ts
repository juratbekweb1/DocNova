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

    const limitCheck = await checkUserLimit(userId, "resume_analysis");
    if (!limitCheck.allowed) {
      await trackAIUsage({ userId, organizationId, plan, feature: "RESUME_ANALYSIS", status: "QUOTA_EXCEEDED", errorCode: "LIMIT_EXCEEDED" });
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
    let resultData: any = {};
    let inputTokens = 0;
    let outputTokens = 0;

    try {
      const model = getGeminiModel(process.env.GEMINI_MODEL || "gemini-1.5-flash");
      const response = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
        },
      });

      const res = await response.response;
      const text = res.text();
      resultData = JSON.parse(text || "{}");

      if (res.usageMetadata) {
        inputTokens = res.usageMetadata.promptTokenCount || 0;
        outputTokens = res.usageMetadata.candidatesTokenCount || 0;
      } else {
        inputTokens = Math.ceil(prompt.length / 4);
        outputTokens = Math.ceil((text || "").length / 4);
      }
    } catch (apiError: any) {
      console.error("Gemini CV Analyzer API Error:", apiError);
      status = "FAILED";
      errorCode = "API_ERROR";
      return NextResponse.json({ error: "ERROR: " + (apiError.message || apiError.toString()) }, { status: 503 });
    } finally {
      const duration = Date.now() - startTime;
      await trackAIUsage({
        userId,
        organizationId,
        plan,
        feature: "RESUME_ANALYSIS",
        status,
        inputTokens,
        outputTokens,
        requestDurationMs: duration,
        errorCode
      });
    }

    return NextResponse.json({
      ...resultData,
      warningMessage: limitCheck.error || undefined,
    });
  } catch (error) {
    console.error("CV Analyzer error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
