import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { checkApiLimit, increaseApiLimit } from "@/lib/ai-limit";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limitCheck = await checkApiLimit(session.user.id);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: "Limit reached", requireUpgrade: true, upgradeMessage: limitCheck.upgradeMessage },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, role, company, skills, tone } = body;

    const prompt = `You are a professional career coach. Write a highly converting cover letter.
Name: ${name || "The Candidate"}
Applying for Role: ${role || "Software Engineer"}
Company Name: ${company || "the company"}
Key Skills/Experience: ${skills || "relevant skills"}
Tone: ${tone || "Professional and confident"}

Instructions:
Write a cover letter that is 3-4 paragraphs long. It should be engaging, highlight the skills provided, and match the specified tone. Do not include placeholders like "[Your Phone Number]" - just write the body of the letter. Return plain text only.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    await increaseApiLimit(session.user.id);

    return NextResponse.json({ result: response.text, warningMessage: limitCheck.warningMessage });
  } catch (error) {
    console.error("Cover Letter AI error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
