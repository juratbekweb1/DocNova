import type { IAIProvider, AIProviderMessage } from "./ai-provider";
import { AppError } from "@/core/shared/errors";
import { PromptLibrary } from "./prompt-library";

const GEMINI_API_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
const TIMEOUT_MS = 60_000;

export class GeminiProvider implements IAIProvider {
  readonly name = "gemini";

  constructor(private readonly apiKey: string) {}

  async complete(prompt: string, _options?: Record<string, unknown>): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(`${GEMINI_API_BASE}?key=${this.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1024,
          },
        }),
        signal: controller.signal,
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new AppError(
          "AI xizmatida vaqtinchalik muammo yuz berdi. Qayta urinib ko'ring.",
          504,
          "AI_TIMEOUT"
        );
      }
      throw new AppError(
        "AI xizmatiga ulanishda xatolik yuz berdi.",
        503,
        "AI_CONNECTION_ERROR"
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      if (response.status === 429) {
        throw new AppError(
          "So'rovlar cheklovi oshib ketdi. Biroz kutib, qayta urinib ko'ring.",
          429,
          "AI_RATE_LIMIT"
        );
      }
      throw new AppError(
        "AI xizmatida vaqtinchalik muammo yuz berdi. Qayta urinib ko'ring.",
        502,
        "AI_UPSTREAM_ERROR"
      );
    }

    let json: unknown;
    try {
      json = await response.json();
    } catch {
      throw new AppError(
        "Javobni qayta ishlashda xatolik yuz berdi.",
        502,
        "AI_PARSE_ERROR"
      );
    }

    const text = extractGeminiText(json);
    if (!text) {
      throw new AppError(
        "Javobni qayta ishlashda xatolik yuz berdi.",
        502,
        "AI_EMPTY_RESPONSE"
      );
    }

    return text;
  }

  async stream(
    prompt: string,
    onChunk: (chunk: string) => void,
    options?: Record<string, unknown>
  ): Promise<void> {
    // Fallback: use complete() and emit as single chunk
    const result = await this.complete(prompt, options);
    onChunk(result);
  }

  async chat(
    messages: AIProviderMessage[],
    _options?: Record<string, unknown>
  ): Promise<string> {
    // Build a single prompt from the message history
    const prompt = messages
      .map((m) => `${m.role === "system" ? "System" : m.role === "assistant" ? "Assistant" : "User"}: ${m.content}`)
      .join("\n\n");
    return this.complete(prompt);
  }
}

// Extract text from Gemini's response envelope
function extractGeminiText(json: unknown): string | null {
  if (
    typeof json !== "object" ||
    json === null ||
    !("candidates" in json) ||
    !Array.isArray((json as Record<string, unknown>).candidates)
  ) {
    return null;
  }

  const candidates = (json as { candidates: unknown[] }).candidates;
  if (candidates.length === 0) return null;

  const first = candidates[0];
  if (
    typeof first !== "object" ||
    first === null ||
    !("content" in first)
  ) {
    return null;
  }

  const content = (first as { content: unknown }).content;
  if (
    typeof content !== "object" ||
    content === null ||
    !("parts" in content) ||
    !Array.isArray((content as Record<string, unknown>).parts)
  ) {
    return null;
  }

  const parts = (content as { parts: unknown[] }).parts;
  if (parts.length === 0) return null;

  const part = parts[0];
  if (typeof part !== "object" || part === null || !("text" in part)) {
    return null;
  }

  const text = (part as { text: unknown }).text;
  return typeof text === "string" ? text : null;
}

// Re-export the PromptLibrary for convenience
export { PromptLibrary };
