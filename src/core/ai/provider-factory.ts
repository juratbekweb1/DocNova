import type { IAIProvider, AIProviderMessage } from "./ai-provider";
import { GeminiProvider } from "./gemini-provider";
import { FallbackProvider } from "./fallback-provider";

class ResilientProvider implements IAIProvider {
  readonly name = "resilient";
  private gemini?: GeminiProvider;
  private fallback = new FallbackProvider();

  constructor(apiKey?: string) {
    if (apiKey && apiKey.length > 0) {
      this.gemini = new GeminiProvider(apiKey);
    }
  }

  async complete(prompt: string, options?: Record<string, unknown>): Promise<string> {
    if (this.gemini) {
      try {
        const res = await this.gemini.complete(prompt, options);
        if (res && res.trim().length > 0) return res;
      } catch (err) {
        console.warn("GeminiProvider failed, seamlessly falling back to FallbackProvider:", err);
      }
    }
    return this.fallback.complete(prompt, options);
  }

  async stream(
    prompt: string,
    onChunk: (chunk: string) => void,
    options?: Record<string, unknown>
  ): Promise<void> {
    if (this.gemini && typeof this.gemini.stream === "function") {
      try {
        await this.gemini.stream(prompt, onChunk, options);
        return;
      } catch (err) {
        console.warn("GeminiProvider stream failed, seamlessly falling back to FallbackProvider:", err);
      }
    }
    return this.fallback.stream(prompt, onChunk, options);
  }

  async chat(messages: AIProviderMessage[], options?: Record<string, unknown>): Promise<string> {
    if (this.gemini) {
      try {
        const res = await this.gemini.chat(messages, options);
        if (res && res.trim().length > 0) return res;
      } catch (err) {
        console.warn("GeminiProvider chat failed, seamlessly falling back to FallbackProvider:", err);
      }
    }
    return this.fallback.chat(messages, options);
  }
}

/**
 * Returns the appropriate AI provider based on environment configuration.
 * Automatically falls back to deterministic provider if upstream AI fails.
 */
export function getAIProvider(): IAIProvider {
  const apiKey = process.env.GEMINI_API_KEY;
  return new ResilientProvider(apiKey);
}
