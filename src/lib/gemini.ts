import { GoogleGenerativeAI, GenerativeModel, UsageMetadata } from "@google/generative-ai";

/**
 * Supported Gemini candidate models with automatic failover
 */
export const CANDIDATE_MODELS: string[] = [
  process.env.GEMINI_MODEL,
  "gemini-1.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-pro",
  "gemini-pro",
].filter(Boolean) as string[];

const apiKey = process.env.GEMINI_API_KEY || "";
export const genAI = new GoogleGenerativeAI(apiKey);

export interface GeminiGenerateOptions {
  modelName?: string;
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
  systemInstruction?: string;
  maxRetries?: number;
  jsonMode?: boolean;
}

export interface GeminiUsageMetadata {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
  durationMs: number;
}

export interface GeminiGenerateResult {
  text: string;
  modelUsed: string;
  usage: GeminiUsageMetadata;
}

/**
 * Custom error types for Gemini operations
 */
export class GeminiError extends Error {
  constructor(
    message: string,
    public code:
      | "NO_API_KEY"
      | "RATE_LIMITED"
      | "TIMEOUT"
      | "QUOTA_EXCEEDED"
      | "PARSE_ERROR"
      | "GENERATION_FAILED",
    public originalError?: unknown
  ) {
    super(message);
    this.name = "GeminiError";
  }
}

/**
 * In-memory sliding-window rate limiter to protect API quotas
 */
class GeminiRateLimiter {
  private timestamps: number[] = [];
  private maxRequestsPerMinute: number = 30;

  public async acquire(): Promise<void> {
    const now = Date.now();
    // Keep timestamps from the last 60 seconds
    this.timestamps = this.timestamps.filter((ts) => now - ts < 60_000);

    if (this.timestamps.length >= this.maxRequestsPerMinute) {
      const oldest = this.timestamps[0];
      const waitTime = Math.max(100, 60_000 - (now - oldest));
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.timestamps.push(Date.now());
  }
}

const rateLimiter = new GeminiRateLimiter();

/**
 * Returns a generative model instance for a specific model name.
 * Provides backwards compatibility for existing imports across the codebase.
 */
export const getGeminiModel = (modelName: string = "gemini-1.5-flash"): GenerativeModel => {
  return genAI.getGenerativeModel({ model: modelName });
};

/**
 * Helper to wrap promises with a timeout
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operationName: string
): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new GeminiError(`${operationName} timed out after ${timeoutMs}ms`, "TIMEOUT"));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timer!);
    return result;
  } catch (err) {
    clearTimeout(timer!);
    throw err;
  }
}

/**
 * Sleep utility for exponential backoff retries
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Core text generation with candidate model failover, rate limiting, timeout, and exponential backoff.
 */
export async function generateGeminiContent(
  prompt: string,
  options: GeminiGenerateOptions = {}
): Promise<GeminiGenerateResult> {
  const currentApiKey = process.env.GEMINI_API_KEY || "";
  if (!currentApiKey || currentApiKey.trim().length === 0 || currentApiKey.startsWith("AQ")) {
    throw new GeminiError(
      "Valid GEMINI_API_KEY environment variable is not configured.",
      "NO_API_KEY"
    );
  }

  const {
    modelName: preferredModel,
    temperature = 0.3,
    maxOutputTokens = 8192,
    timeoutMs = 50_000,
    systemInstruction,
    maxRetries = 2,
    jsonMode = false,
  } = options;

  const modelsToTry = preferredModel
    ? [preferredModel, ...CANDIDATE_MODELS.filter((m) => m !== preferredModel)]
    : CANDIDATE_MODELS;

  const startTime = Date.now();
  let lastError: unknown = null;

  for (const modelCandidate of modelsToTry) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await rateLimiter.acquire();

        const model = genAI.getGenerativeModel({
          model: modelCandidate,
          systemInstruction: systemInstruction
            ? { role: "system", parts: [{ text: systemInstruction }] }
            : undefined,
          generationConfig: {
            temperature,
            maxOutputTokens,
            responseMimeType: jsonMode ? "application/json" : undefined,
          },
        });

        const generatePromise = model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        const apiResponse = await withTimeout(
          generatePromise,
          timeoutMs,
          `Gemini generation with ${modelCandidate}`
        );

        const response = await apiResponse.response;
        const text = response.text();

        if (text && text.trim().length > 0) {
          const durationMs = Date.now() - startTime;
          const usageMetadata: UsageMetadata | undefined = response.usageMetadata;

          const promptTokenCount = usageMetadata?.promptTokenCount || Math.ceil(prompt.length / 4);
          const candidatesTokenCount =
            usageMetadata?.candidatesTokenCount || Math.ceil(text.length / 4);
          const totalTokenCount =
            usageMetadata?.totalTokenCount || promptTokenCount + candidatesTokenCount;

          return {
            text: text.trim(),
            modelUsed: modelCandidate,
            usage: {
              promptTokenCount,
              candidatesTokenCount,
              totalTokenCount,
              durationMs,
            },
          };
        }
      } catch (err: unknown) {
        lastError = err;
        const errMsg = err instanceof Error ? err.message : String(err);
        const isRateLimit = errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED");
        const isTimeout = err instanceof GeminiError && err.code === "TIMEOUT";

        if (isRateLimit && attempt < maxRetries) {
          const backoffDelay = (attempt + 1) * 1500 + Math.random() * 500;
          console.warn(
            `[GeminiRateLimit] Retrying ${modelCandidate} in ${Math.round(backoffDelay)}ms...`
          );
          await sleep(backoffDelay);
          continue;
        }

        if (isTimeout) {
          console.warn(
            `[GeminiTimeout] Model ${modelCandidate} timed out after ${timeoutMs}ms. Moving to next candidate.`
          );
          break; // Try next candidate model immediately
        }

        console.warn(
          `[GeminiAttemptFailed] Model ${modelCandidate} attempt ${attempt + 1} failed: ${errMsg}`
        );
        // If not a retryable error on same model, break to try next model
        if (!isRateLimit) {
          break;
        }
      }
    }
  }

  throw new GeminiError(
    `All candidate Gemini models failed. Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
    "GENERATION_FAILED",
    lastError
  );
}

/**
 * Structured JSON generation helper that safely parses and sanitizes Gemini output
 */
export async function generateGeminiJson<T>(
  prompt: string,
  options: GeminiGenerateOptions = {}
): Promise<{ data: T; modelUsed: string; usage: GeminiUsageMetadata }> {
  const result = await generateGeminiContent(prompt, {
    ...options,
    jsonMode: true,
  });

  const raw = result.text;
  const cleanJson = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleanJson) as T;
    return {
      data: parsed,
      modelUsed: result.modelUsed,
      usage: result.usage,
    };
  } catch (parseError) {
    console.error("[GeminiJsonParseError] Raw content was not valid JSON:", raw);
    throw new GeminiError(
      "Failed to parse Gemini output as structured JSON",
      "PARSE_ERROR",
      parseError
    );
  }
}
