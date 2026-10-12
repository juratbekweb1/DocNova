import { NextRequest } from "next/server";
import { z } from "zod";
import { getAIProvider } from "@/core/ai/provider-factory";
import { PromptLibrary } from "@/core/ai/prompt-library";
import {
  GeneratedResumeSchema,
  type GeneratedResumeResponse,
} from "@/core/ai/resume-generation-schema";
import { successResponse, errorResponse } from "@/core/shared/api-response";
import { ValidationError, AppError } from "@/core/shared/errors";
import { aiDemoRateLimiter } from "@/lib/security/rate-limiter";

// ---------------------------------------------------------------------------
// Request schema
// ---------------------------------------------------------------------------
const RequestBodySchema = z.object({
  rawInput: z
    .string()
    .min(10, "Ma'lumot kiriting.")
    .max(1000, "Matn juda uzun. 1000 belgidan oshmasin."),
});

// ---------------------------------------------------------------------------
// Allowed origins for this public endpoint (origin check instead of CSRF cookie)
// ---------------------------------------------------------------------------
function isAllowedOrigin(request: NextRequest): boolean {
  // In development always allow (origin may be missing or localhost)
  if (process.env.NODE_ENV === "development") return true;

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  const check = origin ?? referer ?? "";
  if (!check) return false;

  // Allow same-origin and configured app URL
  const allowed = [appUrl, "http://localhost:3000", "https://localhost:3000"].filter(Boolean);
  return allowed.some((u) => check.startsWith(u));
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  // 1. Method is already POST by route convention; OPTIONS handled by Next.js

  // 2. Origin check (CSRF-equivalent for public endpoints)
  if (!isAllowedOrigin(request)) {
    return errorResponse(new AppError("Forbidden", 403, "FORBIDDEN_ORIGIN"));
  }

  // 3. Rate limiting — 5 req / 60 s / IP
  const rateLimitResult = aiDemoRateLimiter.middleware(request);
  if (rateLimitResult) return rateLimitResult;

  // 4. Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(new ValidationError("So'rov tanasi noto'g'ri formatda."));
  }

  const parsed = RequestBodySchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(new ValidationError(parsed.error.issues[0]?.message ?? "Noto'g'ri ma'lumot."));
  }

  const { rawInput } = parsed.data;

  // 5. Build prompt from shared PromptLibrary
  const prompt = PromptLibrary.getPrompt("generate-resume", { rawInput });

  // 6. Get AI provider (Gemini or fallback based on env)
  const provider = getAIProvider();

  // 7. Call provider — errors are thrown as AppError (with safe messages)
  let rawText: string;
  let status: "SUCCESS" | "FAILED" = "SUCCESS";
  let errorCode: string | undefined = undefined;
  const startTime = Date.now();
  try {
    rawText = await provider.complete(prompt);
  } catch (err: any) {
    status = "FAILED";
    errorCode = "API_ERROR";
    const duration = Date.now() - startTime;
    import("@/lib/limits").then(({ trackAIUsage }) => {
      trackAIUsage({
        plan: "FREE",
        feature: "DOCUMENT_GENERATION",
        status,
        requestDurationMs: duration,
        errorCode
      });
    });
    return errorResponse(err);
  }

  const duration = Date.now() - startTime;
  import("@/lib/limits").then(({ trackAIUsage }) => {
    trackAIUsage({
      plan: "FREE",
      feature: "DOCUMENT_GENERATION",
      status,
      inputTokens: Math.ceil(prompt.length / 4),
      outputTokens: Math.ceil((rawText || "").length / 4),
      requestDurationMs: duration
    });
  });

  // 8. Strip markdown code fences if the model returns them despite instructions
  const jsonText = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // 9. Parse JSON — handle malformed output gracefully
  let aiJson: unknown;
  try {
    aiJson = JSON.parse(jsonText);
  } catch {
    return errorResponse(
      new AppError("Javobni qayta ishlashda xatolik yuz berdi.", 502, "AI_PARSE_ERROR")
    );
  }

  // 10. Validate against the shared Zod schema
  const validation = GeneratedResumeSchema.safeParse(aiJson);
  if (!validation.success) {
    return errorResponse(
      new AppError("Javobni qayta ishlashda xatolik yuz berdi.", 502, "AI_VALIDATION_ERROR")
    );
  }

  // 11. Return normalized response with explicit provider field
  const data: GeneratedResumeResponse = {
    provider: provider.name as "gemini" | "fallback",
    ...validation.data,
  };

  return successResponse(data);
}

// Reject all other methods
export async function GET() {
  return errorResponse(new AppError("Method not allowed", 405, "METHOD_NOT_ALLOWED"));
}
