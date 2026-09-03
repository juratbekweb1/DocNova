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
    const { prompt: userPrompt, action } = body;
    // action could be 'write', 'improve', 'summarize'

    let systemInstruction = "You are a professional AI writer.";
    if (action === "improve") {
      systemInstruction =
        "Improve the following text. Make it more professional, grammatically correct, and engaging. Only return the improved text.";
    } else if (action === "summarize") {
      systemInstruction =
        "Summarize the following text in a concise and clear manner. Only return the summary.";
    }

    const prompt = `${systemInstruction}\n\nUser Input: ${userPrompt}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    await increaseApiLimit(session.user.id);

    return NextResponse.json({ result: response.text, warningMessage: limitCheck.warningMessage });
  } catch (error) {
    console.error("AI Writer error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
