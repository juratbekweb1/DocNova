import { getGeminiModel } from "./gemini";
import { AI_PROMPTS } from "./prompts";

export async function generateChatResponse(message: string): Promise<string> {
  try {
    const model = getGeminiModel("gemini-3.8-flash");
    
    // In a real app we'd pass message history. For now, we prepend system prompt.
    const prompt = `${AI_PROMPTS.NOVA_SYSTEM}\n\nUser: ${message}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "Kechirasiz, men hozir javob bera olmayman.";
  } catch (error) {
    console.error("Gemini Chat API Error:", error);
    return "Xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.";
  }
}

export async function generateMockTestQuestion(lang: string, role: string, difficulty: string): Promise<string> {
  try {
    const model = getGeminiModel("gemini-3.8-flash");
    
    const systemPrompt = AI_PROMPTS.MOCK_TEST_SYSTEM;
    const prompt = `${systemPrompt}\n\nUser is starting a new interview. Role: ${role}, Difficulty: ${difficulty}, Language: ${lang}. Start by asking them to introduce themselves and their experience. REMEMBER to output strictly in the requested JSON format!`;
    
    const result = await model.generateContent(prompt);
    const text = await result.response.text();
    
    // Attempt to parse JSON from response
    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonStr);
    
    return parsed.nextQuestion || "Please introduce yourself.";
  } catch (error) {
    console.error("Gemini Mock API Error:", error);
    return lang === "RU" 
      ? `Расскажите о себе и своем опыте работы в качестве ${role} (${difficulty}).`
      : `Please introduce yourself and your experience as a ${role} (${difficulty}).`;
  }
}

export async function evaluateMockTestAnswer(answer: string, questionCount: number) {
  try {
    const model = getGeminiModel("gemini-3.8-flash");
    
    const systemPrompt = AI_PROMPTS.MOCK_TEST_SYSTEM;
    const isLastQuestion = questionCount >= 5;
    
    const prompt = `${systemPrompt}\n\nThe user answered the previous interview question with: "${answer}". \nThis is question ${questionCount}/5. \nIf this is the 5th question (questionCount >= 5), finish the interview by providing a comprehensive score and feedback, and set nextQuestion to null. If it's not the 5th question, provide the next technical or behavioral question based on their answer. \nREMEMBER: ONLY Output valid JSON.`;
    
    const result = await model.generateContent(prompt);
    const text = await result.response.text();
    
    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonStr);
    
    return {
      isFinished: parsed.isFinished || isLastQuestion,
      score: parsed.score || 0,
      feedback: parsed.feedback || "",
      nextQuestion: parsed.nextQuestion || ""
    };
  } catch (error) {
    console.error("Gemini Mock Evaluation Error:", error);
    return {
      isFinished: questionCount >= 5,
      score: 80,
      feedback: "Error evaluating response via AI. Here is a fallback feedback: Your answer was adequate.",
      nextQuestion: "Can you elaborate on your technical skills?"
    };
  }
}
