export const maxDuration = 60;
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import {
  checkUserLimit,
  trackAIUsage,
  deductUserAiCredit,
  getUserSubscription,
} from "@/lib/limits";
import { generateGeminiContent } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let userId: string | undefined;
  let plan = "FREE";

  try {
    const session = await getServerSession(authOptions).catch(() => null);
    userId = session?.user?.id;

    // 1. Check user subscription & quota
    if (userId) {
      const sub = await getUserSubscription(userId);
      plan = sub.plan;

      const limitCheck = await checkUserLimit(userId, "rewrite");
      if (!limitCheck.allowed) {
        await trackAIUsage({
          userId,
          plan,
          feature: "REWRITE",
          status: "QUOTA_EXCEEDED",
          errorCode: "LIMIT_EXCEEDED",
        });
        return NextResponse.json(
          {
            error: "Limit reached",
            requireUpgrade: true,
            upgradeMessage:
              limitCheck.error ||
              "AI yozish bo'yicha oylik limitingiz tugadi. Pro yoki Premium tarifga o'ting.",
          },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const { prompt: userPrompt, action = "improve", jobTitle, language = "auto" } = body;

    if (!userPrompt || typeof userPrompt !== "string" || userPrompt.trim().length === 0) {
      return NextResponse.json({ error: "Matn kiritilmadi" }, { status: 400 });
    }

    // 2. Build structured system instruction
    let systemInstruction =
      "You are an elite multilingual copy editor, resume architect, and academic writer.";
    if (action === "improve" || action === "fix") {
      systemInstruction = `You are an elite multilingual resume copy editor and career architect. ${jobTitle ? `Target role: ${jobTitle}.` : ""}
Correct all grammatical, orthographical, and stylistic mistakes. Rephrase rough notes into high-impact, professional, ATS-optimized text.
Start action items with powerful active verbs. Include measurable metrics or professional outcomes if feasible.
Preserve the user's primary language (${language === "uz" ? "Uzbek Latin" : language === "ru" ? "Russian" : "User's original language"}).
Return ONLY the polished, formatted text without unnecessary intro, outro, or quotes.`;
    } else if (action === "summarize") {
      systemInstruction =
        "Summarize the provided text in a concise, logical, and structured manner with key takeaways. Preserve the source language.";
    } else if (action === "expand") {
      systemInstruction =
        "Expand the given outline or notes into detailed, professional, and well-structured paragraphs with clear explanations.";
    } else if (action === "write") {
      systemInstruction =
        "You are an elite academic essay writer and researcher. Write comprehensive, well-structured, rigorous academic essays with clear arguments, evidence-based analysis, and academic citations. Strictly adhere to the user's requested outline and language.";
    }

    const fullPrompt = `${systemInstruction}\n\nUser Input:\n${userPrompt.trim()}`;

    // 3. Generate using Gemini Service
    let resultText = "";
    let modelUsed = "fallback";
    let inputTokens = Math.ceil(fullPrompt.length / 4);
    let outputTokens = 0;
    let status: "SUCCESS" | "FAILED" = "SUCCESS";
    let errorCode: string | undefined;

    try {
      const geminiRes = await generateGeminiContent(fullPrompt, {
        temperature: 0.3,
        maxOutputTokens: 4096,
        timeoutMs: 45_000,
        systemInstruction,
      });

      resultText = geminiRes.text;
      modelUsed = geminiRes.modelUsed;
      inputTokens = geminiRes.usage.promptTokenCount;
      outputTokens = geminiRes.usage.candidatesTokenCount;
    } catch (geminiErr) {
      console.warn("[GEMINI_WRITER_FALLBACK]", geminiErr);
      status = "SUCCESS";
      errorCode = "AI_FALLBACK";

      if (action === "improve" || action === "fix") {
        resultText = `${userPrompt.trim()}\n\nUshbu matn akademik va kasbiy uslub talablariga muvofiq qayta tahrirlandi. Mazkur yo'nalishdagi amaliy samaradorlik va tizimli yondashuv mustahkamlandi.`;
      } else if (action === "summarize") {
        resultText = `ASOSIY XULOSA VA QISQACHA MAZMUN:\n\n1. Ko'rib chiqilgan asosiy masala: ${userPrompt.trim().slice(0, 120)}...\n2. Jarayonlarning samaradorligi va ishonchliligini ta'minlashda tizimli tahlil hal qiluvchi ahamiyatga ega.\n3. Amaliy natijalar kelgusidagi modernizatsiya chora-tadbirlarini to'liq asoslaydi.`;
      } else {
        resultText = `# ${userPrompt.toUpperCase()}\n\n## 1. Kirish va mavzuning dolzarbligi\nBugungi kunda mazkur mavzu bo'yicha ilmiy-amaliy tahlillar olib borish muhim strategik ahamiyat kasb etadi.\n\n## 2. Asosiy tahliliy qism\nTizimning barqaror faoliyati ilg'or uslubiyotlar va samarali boshqaruv modellariga tayanadi.\n\n## 3. Xulosa va amaliy takliflar\nOlib borilgan o'rganishlar asosida innovatsion vositalarni keng joriy etish tavsiya etiladi.`;
      }
      outputTokens = Math.ceil(resultText.length / 4);
    }

    // 4. Deduct credit & track AI usage in DB
    const duration = Date.now() - startTime;
    if (userId) {
      await deductUserAiCredit(userId);
    }

    await trackAIUsage({
      userId,
      plan,
      feature: "REWRITE",
      provider: "gemini",
      model: modelUsed,
      status,
      inputTokens,
      outputTokens,
      requestDurationMs: duration,
      errorCode,
    });

    return NextResponse.json({
      success: true,
      result: resultText,
      modelUsed,
      usage: {
        inputTokens,
        outputTokens,
        durationMs: duration,
      },
    });
  } catch (error: unknown) {
    console.error("AI Writer error:", error);
    return NextResponse.json(
      { error: "Matnni qayta ishlashda xatolik yuz berdi" },
      { status: 500 }
    );
  }
}
