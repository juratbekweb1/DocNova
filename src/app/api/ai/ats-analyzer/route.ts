import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { GoogleGenAI } from "@google/genai";

import { z } from "zod";
import xss from "xss";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

    // 1. Get the user to decrement AI limits
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { apiLimit: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Checking if user has reached limit
    if (user.role === "USER") {
      const limit = user.apiLimit?.count ?? 0;
      if (limit >= 20) { // arbitrary limit for free tier
        return NextResponse.json({ error: "AI Generation limit reached. Upgrade to Pro." }, { status: 403 });
      }
    }

    // Construct the prompt
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

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const outputText = response.text;
    if (!outputText) {
        throw new Error("Failed to get a response from Gemini.");
    }

    const resultData = JSON.parse(outputText);

    // Save ATS Analysis
    const atsAnalysis = await prisma.atsAnalysis.create({
      data: {
        userId: user.id,
        resumeText,
        jobDescription,
        overallScore: resultData.overallScore,
        keywordScore: resultData.keywordScore,
        formatScore: resultData.formatScore,
        completenessScore: resultData.completenessScore,
        feedback: resultData,
      },
    });

    // Increment usage
    await prisma.userApiLimit.upsert({
      where: { userId: user.id },
      update: { count: { increment: 1 } },
      create: { userId: user.id, count: 1 },
    });

    return NextResponse.json({ success: true, data: atsAnalysis });

  } catch (error: unknown) {
    console.error("[ATS_ANALYZER_ERROR]", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
