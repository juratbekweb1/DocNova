export const maxDuration = 60;
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { getGeminiModel } from "@/lib/ai/gemini";
import { checkUserLimit, trackAIUsage } from "@/lib/limits";
import { SubscriptionTier } from "@prisma/client";

import { z } from "zod";
import xss from "xss";

const atsSchema = z.object({
  resumeText: z.string().min(10, "Resume text is too short").max(50000, "Resume text is too long"),
  jobDescription: z.string().max(20000).optional().default(""),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jsonBody = await req.json();
    const parsed = atsSchema.safeParse(jsonBody);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.format() }, { status: 400 });
    }

    const resumeText = xss(parsed.data.resumeText);
    const jobDescription = xss(parsed.data.jobDescription);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, plan: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = user.id;
    let organizationId: string | undefined = undefined;
    if (false) {
       organizationId = (user as any).organizationId;
    }
    const plan = (user.plan as any as string) || 'FREE';

    const limitCheck = await checkUserLimit(userId, "resume_analysis");
    if (limitCheck.limitExceeded) {
      await trackAIUsage({ userId, organizationId, plan, feature: "RESUME_ANALYSIS", status: "QUOTA_EXCEEDED", errorCode: "LIMIT_EXCEEDED" });
      return NextResponse.json({ error: limitCheck.error, code: limitCheck.code }, { status: 429 });
    }

    const prompt = `You are a strict and highly accurate Applicant Tracking System (ATS) simulator. 
Your job is to analyze the provided resume text against standard ATS compliance rules. 
If a job description is provided, analyze the resume specifically for that role.
Return the analysis strictly as a JSON object matching this schema without any markdown formatting or markdown wrappers like \`\`\`json:
{
  "overallScore": number (0-100),
  "keywordScore": number (0-100),
  "formatScore": number (0-100),
  "completenessScore": number (0-100),
  "summary": "string",
  "missingKeywords": ["string"],
  "criticalFixes": ["string"],
  "strengths": ["string"],
  "improvementSuggestions": ["string"]
}

--- RESUME TEXT ---
${resumeText}

--- JOB DESCRIPTION ---
${jobDescription || "None provided. Analyze for general best practices."}
`;

    const startTime = Date.now();
    let status: "SUCCESS" | "FAILED" = "SUCCESS";
    let errorCode: string | undefined = undefined;
    let resultData: any;
    let inputTokens = 0;
    let outputTokens = 0;

    try {
      const model = getGeminiModel(process.env.GEMINI_MODEL || "gemini-3.8-flash");
      const response = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
        },
      });

      const res = await response.response;
      const outputText = res.text();
      
      if (res.usageMetadata) {
        inputTokens = res.usageMetadata.promptTokenCount || 0;
        outputTokens = res.usageMetadata.candidatesTokenCount || 0;
      } else {
        inputTokens = Math.ceil(prompt.length / 4);
        outputTokens = Math.ceil((outputText || "").length / 4);
      }
      
      if (!outputText) {
          throw new Error("Failed to get a response from Gemini.");
      }

      resultData = JSON.parse(outputText);
    } catch (apiError: any) {
      console.error("Gemini ATS API Error:", apiError);
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

    const atsAnalysis = await prisma.atsAnalysis.create({
      data: {
        userId: user.id,
        resumeText,
        jobDescription,
        overallScore: resultData.overallScore || 0,
        keywordScore: resultData.keywordScore || 0,
        formatScore: resultData.formatScore || 0,
        completenessScore: resultData.completenessScore || 0,
        feedback: resultData,
      },
    });

    return NextResponse.json({ success: true, data: atsAnalysis });

  } catch (error: unknown) {
    console.error("[ATS_ANALYZER_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
