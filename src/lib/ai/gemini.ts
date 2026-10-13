import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
export const genAI = new GoogleGenerativeAI(apiKey);

export const getGeminiModel = (modelName: string = "gemini-1.5-flash") => {
  return genAI.getGenerativeModel({ model: modelName });
};
