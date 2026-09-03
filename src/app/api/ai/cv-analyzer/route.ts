import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { checkCvLimit, increaseCvLimit } from "@/lib/ai-limit";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limitCheck = await checkCvLimit(session.user.id);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: "Limit reached", requireUpgrade: true, upgradeMessage: limitCheck.upgradeMessage },
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

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    await increaseCvLimit(session.user.id);

    return NextResponse.json({
      ...JSON.parse(response.text || "{}"),
      warningMessage: limitCheck.warningMessage,
    });
  } catch (error) {
    console.error("CV Analyzer error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
