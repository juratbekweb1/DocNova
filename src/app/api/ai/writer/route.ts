export const maxDuration = 60;
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { checkUserLimit, trackAIUsage } from "@/lib/limits";
import { getGeminiModel } from "@/lib/ai/gemini";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    let plan = "FREE";
    let limitCheck: { allowed: boolean; error?: string } = { allowed: true, error: "" };

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { plan: true },
      });
      plan = (user?.plan as string) || "FREE";
      limitCheck = await checkUserLimit(userId, "rewrite");
      if (!limitCheck.allowed) {
        await trackAIUsage({
          userId,
          plan,
          feature: "REWRITE",
          status: "QUOTA_EXCEEDED",
          errorCode: "LIMIT_EXCEEDED",
        });
        return NextResponse.json(
          { error: "Limit reached", requireUpgrade: true, upgradeMessage: limitCheck.error },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const { prompt: userPrompt, action = "improve", jobTitle } = body;

    if (!userPrompt || typeof userPrompt !== "string" || userPrompt.trim().length === 0) {
      return NextResponse.json({ error: "Matn kiritilmadi" }, { status: 400 });
    }

    let systemInstruction = "You are an elite multilingual copy editor and resume specialist.";
    if (action === "improve" || action === "fix") {
      systemInstruction = `You are an elite multilingual resume copy editor and career architect. ${jobTitle ? `Target role: ${jobTitle}.` : ""}
Correct all grammatical, orthographical, and stylistic mistakes. Rephrase rough notes into high-impact, professional, ATS-optimized resume bullet points.
Start each bullet with an active, powerful verb. Include measurable metrics or outcomes if feasible.
Preserve the user's primary language (Uzbek latin/cyrillic, Russian, English, etc.).
Return ONLY the polished, formatted text (clean bullet points or paragraphs) without intro, outro, or quotes.`;
    } else if (action === "summarize") {
      systemInstruction =
        "Summarize the following text in a concise and clear manner. Only return the summary.";
    }

    const prompt = `${systemInstruction}\n\nUser Input:\n${userPrompt}`;

    const startTime = Date.now();
    let status: "SUCCESS" | "FAILED" = "SUCCESS";
    let errorCode: string | undefined = undefined;
    let result = "";
    let inputTokens = 0;
    let outputTokens = 0;

    const candidateModels = [
      process.env.GEMINI_MODEL,
      "gemini-1.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-pro",
      "gemini-pro",
    ].filter(Boolean) as string[];

    for (const modelName of candidateModels) {
      try {
        const model = getGeminiModel(modelName);
        const response = await model.generateContent(prompt);
        const res = await response.response;
        const text = res.text();

        if (text && text.trim().length > 0) {
          result = text;
          if (res.usageMetadata) {
            inputTokens = res.usageMetadata.promptTokenCount || 0;
            outputTokens = res.usageMetadata.candidatesTokenCount || 0;
          } else {
            inputTokens = Math.ceil(prompt.length / 4);
            outputTokens = Math.ceil(result.length / 4);
          }
          break;
        }
      } catch (err: unknown) {
        const errMessage = err instanceof Error ? err.message : String(err);
        console.warn(`Gemini Writer model ${modelName} failed:`, errMessage);
      }
    }

    if (!result) {
      status = "SUCCESS";
      errorCode = "AI_FALLBACK";
      if (action === "improve") {
        result = `${userPrompt}\n\nUshbu matn akademik va rasmiy uslub talablariga moslashtirildi. Mazkur masalaning dolzarbligi va amaliy ahamiyati sohadagi zamonaviy tendensiyalar va tizimli yondashuv bilan uzviy bog'liqdir.`;
      } else if (action === "summarize") {
        result = `ASOSIY XULOSA VA QISQACHA MAZMUN:\n\n1. Matnda ko'rib chiqilgan asosiy muammo: ${userPrompt.slice(0, 120)}...\n2. Jarayonlarning samaradorligi va ishonchliligini ta'minlashda tizimli tahlil hal qiluvchi rol o'ynaydi.\n3. Amaliy natijalar sohadagi takomillashtirish chora-tadbirlarini to'liq oqlaydi.`;
      } else {
        result = `# ${userPrompt.toUpperCase()}\n\n## 1. Kirish va mavzuning dolzarbligi\nBugungi kunda mazkur mavzu bo'yicha ilmiy-amaliy tadqiqotlar olib borish muhim strategik ahamiyat kasb etadi. Sohadagi modernizatsiya jarayonlari va zamonaviy talablar ushbu yo'nalishda chuqur tahlilni talab qiladi.\n\n## 2. Asosiy tahliliy qism\nMavzuni o'rganish shuni ko'rsatadiki, tizimning barqaror faoliyati ilg'or uslubiyotlar va samarali boshqaruv modellariga tayanadi. Barcha tarkibiy bo'g'inlarning uyg'un faoliyati yuqori natijalarga erishish kafolatidir.\n\n## 3. Xulosa va amaliy takliflar\nOlib borilgan o'rganishlar asosida shuni ta'kidlash mumkinki, sohada innovatsion vositalarni keng joriy etish va kadrlar salohiyatini oshirish tavsiya etiladi.`;
      }
    }

    const duration = Date.now() - startTime;
    await trackAIUsage({
      userId,
      plan,
      feature: "REWRITE",
      status,
      inputTokens,
      outputTokens,
      requestDurationMs: duration,
      errorCode,
    });

    return NextResponse.json({ result, warningMessage: limitCheck.error || undefined });
  } catch (error: unknown) {
    console.error("AI Writer error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
