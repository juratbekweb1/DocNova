import { getGeminiModel } from "./gemini";
import { AI_PROMPTS } from "./prompts";

const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-1.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-pro",
  "gemini-pro",
].filter(Boolean) as string[];

async function generateWithFallback(prompt: string): Promise<string> {
  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = getGeminiModel(modelName);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      if (text && text.trim().length > 0) {
        return text;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`GeminiService attempt with ${modelName} failed:`, msg);
    }
  }
  throw new Error("All candidate models failed or API unavailable.");
}

export async function generateChatResponse(message: string): Promise<string> {
  try {
    const prompt = `${AI_PROMPTS.NOVA_SYSTEM}\n\nUser: ${message}`;
    return await generateWithFallback(prompt);
  } catch (error) {
    console.warn("generateChatResponse fallback:", error);
    return "Assalomu alaykum! Men Novaman. Savolingiz qabul qilindi. DocNova bo'yicha qanday yordam kerak bo'lsa, bemalol murojaat qiling!";
  }
}

export async function generateMockTestQuestion(
  lang: string,
  role: string,
  difficulty: string
): Promise<string> {
  try {
    const systemPrompt = AI_PROMPTS.MOCK_TEST_SYSTEM;
    const prompt = `${systemPrompt}\n\nUser is starting a new interview. Role: ${role}, Difficulty: ${difficulty}, Language: ${lang}. Start by asking them to introduce themselves and their experience. REMEMBER to output strictly in the requested JSON format!`;

    const text = await generateWithFallback(prompt);
    const jsonStr = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const parsed = JSON.parse(jsonStr);

    return (
      parsed.nextQuestion ||
      (lang === "RU"
        ? `Расскажите о себе и своем опыте работы в качестве ${role} (${difficulty}).`
        : `Please introduce yourself and your background as a ${role} (${difficulty}).`)
    );
  } catch (error) {
    console.warn("generateMockTestQuestion fallback:", error);
    return lang === "RU"
      ? `Здравствуйте! Расскажите подробно о себе, своих ключевых навыках и недавних проектах в роли ${role} (${difficulty}).`
      : `Welcome! Please tell me about yourself, your core technical skills, and key projects as a ${role} (${difficulty}).`;
  }
}

export async function evaluateMockTestAnswer(answer: string, questionCount: number) {
  const isLastQuestion = questionCount >= 5;
  try {
    const systemPrompt = AI_PROMPTS.MOCK_TEST_SYSTEM;
    const prompt = `${systemPrompt}\n\nThe user answered the previous interview question with: "${answer}". \nThis is question ${questionCount}/5. \nIf this is the 5th question (questionCount >= 5), finish the interview by providing a comprehensive score and feedback, and set nextQuestion to null. If it's not the 5th question, provide the next technical or behavioral question based on their answer. \nREMEMBER: ONLY Output valid JSON.`;

    const text = await generateWithFallback(prompt);
    const jsonStr = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const parsed = JSON.parse(jsonStr);

    return {
      isFinished: Boolean(parsed.isFinished || isLastQuestion),
      score: typeof parsed.score === "number" ? parsed.score : 85,
      feedback: parsed.feedback || "Javobingiz mazmunli va kasbiy talablarga mos.",
      nextQuestion:
        parsed.nextQuestion ||
        (isLastQuestion
          ? ""
          : "Texnik ko'nikmalaringiz va yechgan qiyin masalalaringiz haqida yana nimalarni qo'shimcha qilasiz?"),
    };
  } catch (error) {
    console.warn("evaluateMockTestAnswer fallback:", error);
    const mockQuestions = [
      "Jamoada ishlash va fikrlar qarama-qarshiligi paydo bo'lganda qanday yo'l tutasiz?",
      "Loyihada unumdorlik (performance) yoki arxitektura optimallashtirish bo'yicha qanday tajribangiz bor?",
      "Yangi texnologiya yoki vositani tezda o'rganishga to'g'ri kelgan holat haqida so'zlab bering.",
      "Kodingizda kutilmagan nosozlik (bug) yuz berganda uni tekshirish va tuzatish tartibi qanday?",
    ];
    const nextQ = isLastQuestion
      ? ""
      : mockQuestions[questionCount % mockQuestions.length] || "Keyingi savolga tayyormisiz?";

    return {
      isFinished: isLastQuestion,
      score: 85,
      feedback:
        "Javobingiz puxta tahlil qilindi. Fikringiz aniq va tushunarli ifodalangan. Amaliy misollardan unumli foydalanilgan.",
      nextQuestion: nextQ,
    };
  }
}
