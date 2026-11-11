import { GoogleGenerativeAI, GenerativeModel, type UsageMetadata } from "@google/generative-ai";

/**
 * Supported Gemini candidate models with automatic failover
 */
export const CANDIDATE_MODELS: string[] = [
  process.env.GEMINI_MODEL,
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash",
].filter(Boolean) as string[];

export function getGenAI(customApiKey?: string): GoogleGenerativeAI {
  const key = (customApiKey || process.env.GEMINI_API_KEY || "").trim();
  return new GoogleGenerativeAI(key);
}

export const genAI = {
  getGenerativeModel: (options: Parameters<GoogleGenerativeAI["getGenerativeModel"]>[0]) => {
    return getGenAI().getGenerativeModel(options);
  },
};

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
  code:
    | "NO_API_KEY"
    | "RATE_LIMITED"
    | "TIMEOUT"
    | "QUOTA_EXCEEDED"
    | "PARSE_ERROR"
    | "GENERATION_FAILED";
  originalError?: unknown;

  constructor(
    message: string,
    code:
      | "NO_API_KEY"
      | "RATE_LIMITED"
      | "TIMEOUT"
      | "QUOTA_EXCEEDED"
      | "PARSE_ERROR"
      | "GENERATION_FAILED",
    originalError?: unknown
  ) {
    super(message);
    this.name = "GeminiError";
    this.code = code;
    this.originalError = originalError;
  }
}

/**
 * Adaptive Auto-Scaling Rate Limiter & Multi-Model Load Balancer.
 * - Eliminates the fixed 30 RPM bottleneck that froze the 31st+ concurrent user.
 * - Tracks each candidate model independently and automatically scales RPM capacity
 *   (from 300 RPM/model up to 1,500 RPM/model on Pay-as-you-go tiers).
 * - Automatically spills over / load-balances burst traffic across healthy candidate
 *   models and routes around any model experiencing 429/503 responses with 0ms freeze.
 */
interface ModelBucket {
  timestamps: number[];
  inFlight: number;
  dynamicRpmLimit: number;
  cooldownUntil: number;
}

export class GeminiRateLimiter {
  private buckets = new Map<string, ModelBucket>();
  private readonly initialRpmPerModel: number;
  private readonly minRpmPerModel = 30;
  private readonly maxRpmPerModel = 1500;

  constructor(initialRpm?: number) {
    const envRpm = Number(process.env.GEMINI_MAX_RPM);
    this.initialRpmPerModel = initialRpm ?? (Number.isFinite(envRpm) && envRpm > 0 ? envRpm : 300);
  }

  private getBucket(model: string): ModelBucket {
    let bucket = this.buckets.get(model);
    if (!bucket) {
      bucket = {
        timestamps: [],
        inFlight: 0,
        dynamicRpmLimit: this.initialRpmPerModel,
        cooldownUntil: 0,
      };
      this.buckets.set(model, bucket);
    }
    return bucket;
  }

  private prune(bucket: ModelBucket, now: number): void {
    if (bucket.timestamps.length > 0 && now - bucket.timestamps[0] >= 60_000) {
      bucket.timestamps = bucket.timestamps.filter((ts) => now - ts < 60_000);
    }
  }

  /**
   * Ranks candidate models so that healthy, non-throttled models with the lowest
   * current load are tried first during traffic spikes (31st, 100th+ concurrent requests).
   */
  public rankModels(models: string[]): string[] {
    if (models.length <= 1) return models;
    const now = Date.now();

    return [...models].sort((a, b) => {
      const bucketA = this.getBucket(a);
      const bucketB = this.getBucket(b);
      this.prune(bucketA, now);
      this.prune(bucketB, now);

      const coolingA = bucketA.cooldownUntil > now ? 1 : 0;
      const coolingB = bucketB.cooldownUntil > now ? 1 : 0;
      if (coolingA !== coolingB) return coolingA - coolingB;

      const saturatedA = bucketA.timestamps.length >= bucketA.dynamicRpmLimit ? 1 : 0;
      const saturatedB = bucketB.timestamps.length >= bucketB.dynamicRpmLimit ? 1 : 0;
      if (saturatedA !== saturatedB) return saturatedA - saturatedB;

      // Keep preferred order unless one model has a heavy burst (e.g. >= 25 in-flight/recent)
      const loadRatioA =
        (bucketA.timestamps.length + bucketA.inFlight * 2) / bucketA.dynamicRpmLimit;
      const loadRatioB =
        (bucketB.timestamps.length + bucketB.inFlight * 2) / bucketB.dynamicRpmLimit;
      if (Math.abs(loadRatioA - loadRatioB) > 0.35) {
        return loadRatioA - loadRatioB;
      }
      return 0;
    });
  }

  public async acquire(model: string = "default"): Promise<void> {
    const now = Date.now();
    const bucket = this.getBucket(model);
    this.prune(bucket, now);

    // Never block the request thread for seconds/minutes; if a single model is at capacity,
    // apply at most a tiny 25ms micro-stagger so concurrent requests don't collide on the same ms.
    if (bucket.timestamps.length >= bucket.dynamicRpmLimit) {
      await new Promise((resolve) => setTimeout(resolve, 25));
    }

    bucket.timestamps.push(Date.now());
    bucket.inFlight += 1;
  }

  public release(model: string = "default"): void {
    const bucket = this.getBucket(model);
    bucket.inFlight = Math.max(0, bucket.inFlight - 1);
  }

  public recordSuccess(model: string): void {
    const bucket = this.getBucket(model);
    bucket.cooldownUntil = 0;
    // Automatically scale up capacity on healthy traffic up to maxRpmPerModel (1,500 RPM)
    if (bucket.dynamicRpmLimit < this.maxRpmPerModel) {
      bucket.dynamicRpmLimit = Math.min(
        this.maxRpmPerModel,
        Math.ceil(bucket.dynamicRpmLimit * 1.15)
      );
    }
  }

  public recordThrottle(model: string, isDailyQuota = false, isServiceSpike = false): void {
    const bucket = this.getBucket(model);
    const now = Date.now();
    if (isDailyQuota) {
      // Cool down this specific model for 5 minutes so traffic routes to fallback models immediately
      bucket.cooldownUntil = now + 5 * 60_000;
      bucket.dynamicRpmLimit = this.minRpmPerModel;
    } else if (isServiceSpike) {
      bucket.cooldownUntil = now + 10_000;
    } else {
      bucket.cooldownUntil = now + 6_000;
      bucket.dynamicRpmLimit = Math.max(
        this.minRpmPerModel,
        Math.floor(bucket.dynamicRpmLimit * 0.7)
      );
    }
  }

  public getStats(model: string) {
    const bucket = this.getBucket(model);
    this.prune(bucket, Date.now());
    return {
      recentRequestsLastMinute: bucket.timestamps.length,
      inFlight: bucket.inFlight,
      dynamicRpmLimit: bucket.dynamicRpmLimit,
      isCoolingDown: bucket.cooldownUntil > Date.now(),
    };
  }
}

export const rateLimiter = new GeminiRateLimiter();

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
  const currentApiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!currentApiKey || currentApiKey.length < 10) {
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

  const rawModelsToTry = preferredModel
    ? [preferredModel, ...CANDIDATE_MODELS.filter((m) => m !== preferredModel)]
    : CANDIDATE_MODELS;
  const modelsToTry = rateLimiter.rankModels(rawModelsToTry);

  const startTime = Date.now();
  const hardDeadline = startTime + timeoutMs;
  let lastError: unknown = null;
  const aiClient = getGenAI(currentApiKey);

  for (const modelCandidate of modelsToTry) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const remainingMs = hardDeadline - Date.now();
      if (remainingMs <= 1200) {
        break;
      }

      try {
        await rateLimiter.acquire(modelCandidate);

        const attemptRemainingMs = Math.max(1500, hardDeadline - Date.now());
        // Cap individual model attempt so a single slow model doesn't consume 100% of budget when fallbacks exist
        const perAttemptTimeoutMs =
          modelsToTry.length > 1
            ? Math.min(attemptRemainingMs, Math.max(12_000, Math.floor(timeoutMs * 0.65)))
            : attemptRemainingMs;

        const model = aiClient.getGenerativeModel({
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
          perAttemptTimeoutMs,
          `Gemini generation with ${modelCandidate}`
        );

        const response = await apiResponse.response;
        const text = response.text();

        if (text && text.trim().length > 0) {
          rateLimiter.recordSuccess(modelCandidate);
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
        const is503 = errMsg.includes("503") || errMsg.includes("high demand");
        if (is503) {
          rateLimiter.recordThrottle(modelCandidate, false, true);
          console.warn(
            `[GeminiSpike] Model ${modelCandidate} is in high demand (503). Switching to next candidate model.`
          );
          break;
        }

        const isRateLimit = errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED");
        const isDailyQuotaExceeded =
          isRateLimit &&
          (errMsg.includes("PerDay") ||
            errMsg.includes("free_tier_requests") ||
            errMsg.includes("retryDelay") ||
            errMsg.includes("quotaId"));
        const isTimeout = err instanceof GeminiError && err.code === "TIMEOUT";

        if (isDailyQuotaExceeded) {
          rateLimiter.recordThrottle(modelCandidate, true, false);
          console.warn(
            `[GeminiDailyQuota] Model ${modelCandidate} daily quota exhausted. Switching immediately to next candidate.`
          );
          break;
        }

        if (isRateLimit) {
          rateLimiter.recordThrottle(modelCandidate, false, false);
          if (modelsToTry.length > 1) {
            console.warn(
              `[GeminiAutoBalance] Model ${modelCandidate} hit 429 rate limit. Routing immediately to next healthy model.`
            );
            break;
          }
          if (attempt < maxRetries) {
            const backoffDelay = (attempt + 1) * 1500 + Math.random() * 500;
            console.warn(
              `[GeminiRateLimit] Retrying ${modelCandidate} in ${Math.round(backoffDelay)}ms...`
            );
            await sleep(backoffDelay);
            continue;
          }
        }

        if (isTimeout) {
          rateLimiter.recordThrottle(modelCandidate, false, true);
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
      } finally {
        rateLimiter.release(modelCandidate);
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
  let cleanJson = raw.trim();

  // 1. Try markdown code block extraction
  const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    cleanJson = codeBlockMatch[1].trim();
  } else {
    // 2. Try outermost curly braces extraction
    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanJson = raw.slice(firstBrace, lastBrace + 1).trim();
    }
  }

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
