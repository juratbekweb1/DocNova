import { z } from "zod";
import { normalizeAcademicLanguageValue, type AcademicLanguage } from "./topic-fidelity";

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
] as const;

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

export const MAX_TOPIC_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB decoded binary cap
export const MAX_TOPICS_PER_IMAGE = 50;

export const PAGE_COUNT_PATTERN = /^\d{1,3}(?:\s*[-–—]\s*\d{1,3})?$/;

export function normalizePageCountInput(value?: string | number | null): string | undefined {
  if (value === undefined || value === null) return undefined;
  const raw = String(value)
    .trim()
    .replace(/\s*(?:bet|betlik|sahifa|sahifalar|pages?|p\.?)\s*$/i, "")
    .replace(/\s*[–—]\s*/g, "-")
    .replace(/\s+/g, "");
  if (!raw) return undefined;
  if (!PAGE_COUNT_PATTERN.test(raw)) return undefined;
  const parts = raw.split("-").map((n) => parseInt(n, 10));
  if (parts.some((n) => Number.isNaN(n) || n < 1 || n > 100)) return undefined;
  if (parts.length === 2 && parts[1] < parts[0]) {
    return `${parts[1]}-${parts[0]}`;
  }
  return parts.length === 2 && parts[0] === parts[1] ? String(parts[0]) : parts.join("-");
}

export function estimateAveragePageCount(pageLabel?: string | number | null): number {
  const normalized = normalizePageCountInput(pageLabel) ?? "2-3";
  const parts = normalized.split("-").map((n) => parseInt(n, 10));
  if (parts.length === 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
    return (parts[0] + parts[1]) / 2;
  }
  return parts[0] && !Number.isNaN(parts[0]) ? parts[0] : 2.5;
}

const pageCountValueSchema = z
  .union([z.number().int().min(1).max(100), z.string().trim().max(30)])
  .refine(
    (val) => {
      const trimmed = String(val).trim();
      if (!trimmed) return true;
      return Boolean(normalizePageCountInput(trimmed));
    },
    { message: "Sahifa soni 1 dan 100 gacha bo'lishi kerak (masalan: 2-3, 5, 10)" }
  )
  .transform((val) => {
    const trimmed = String(val).trim();
    return trimmed ? normalizePageCountInput(trimmed) : undefined;
  });

export const parsedTopicSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Mavzu sarlavhasi bo'sh bo'lmasligi kerak")
    .max(300, "Mavzu sarlavhasi 300 belgidan oshmasligi kerak"),
  content: z.string().trim().max(25000, "Mavzu matni 25 000 belgidan oshmasligi kerak").default(""),
  pageCount: pageCountValueSchema.optional(),
});

export type ParsedTopic = z.infer<typeof parsedTopicSchema>;

export const parseTopicsRequestSchema = z
  .object({
    image: z.string().min(1).optional(),
    imageBase64: z.string().min(1).optional(),
    mimeType: z.string().trim().max(100).optional(),
    fileName: z.string().trim().max(255).optional(),
  })
  .refine((value) => Boolean(value.image || value.imageBase64), {
    message: "Rasm base64 ma'lumoti yuborilishi shart",
  });

export const academicLanguageSchema = z.enum(["uz", "uz-cyrl", "ru", "en"]);

export const parseTopicsResponseSchema = z.object({
  topics: z.array(parsedTopicSchema).max(MAX_TOPICS_PER_IMAGE),
  subject: z.string().trim().max(200).optional(),
  language: academicLanguageSchema.optional(),
});

export const saveAcademicTopicsSchema = z.object({
  documentTitle: z.string().trim().max(200).optional(),
  sourceFileName: z.string().trim().max(200).optional(),
  pagesPerTopic: pageCountValueSchema.optional(),
  workType: z
    .enum([
      "general",
      "referat",
      "independent",
      "coursework",
      "diplom-bmi",
      "presentation",
      "amaliy-ish",
      "essay",
    ])
    .optional(),
  topics: z
    .array(parsedTopicSchema)
    .min(1, "Saqlash uchun kamida bitta mavzu bo'lishi kerak")
    .max(MAX_TOPICS_PER_IMAGE, "Bir martada ko'pi bilan 50 ta mavzu saqlash mumkin"),
});

export type SaveAcademicTopicsInput = z.infer<typeof saveAcademicTopicsSchema>;

export const MAX_WORKS_PER_BATCH = 20;

export const generateWorksRequestSchema = z.object({
  topics: z
    .array(parsedTopicSchema)
    .min(1, "Kamida bitta mavzu bo'lishi kerak")
    .max(MAX_WORKS_PER_BATCH, "Bir martada ko'pi bilan 20 ta mavzuga ish yozish mumkin"),
  workType: z.string().trim().max(100).optional(),
  subject: z.string().trim().max(200).optional(),
  pagesPerTopic: pageCountValueSchema.optional().transform((val) => val ?? "2-3"),
  language: z.enum(["uz", "uz-cyrl", "ru", "en", "auto"]).default("auto"),
});

export type GenerateWorksRequestInput = z.infer<typeof generateWorksRequestSchema>;

export type ExtractedBase64ImageResult =
  | {
      ok: true;
      data: string;
      mimeType: AllowedImageMimeType;
      sizeBytes: number;
    }
  | {
      ok: false;
      error: string;
      status: number;
    };

function normalizeImageMimeType(rawMime?: string): AllowedImageMimeType | null {
  if (!rawMime) return null;
  const cleaned = rawMime.trim().toLowerCase().split(";")[0];
  if (cleaned === "image/jpg" || cleaned === "image/pjpeg") {
    return "image/jpeg";
  }
  if (cleaned === "image/x-png") {
    return "image/png";
  }
  return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(cleaned)
    ? (cleaned as AllowedImageMimeType)
    : null;
}

function sniffMimeFromBase64Prefix(base64: string): AllowedImageMimeType | null {
  if (base64.startsWith("iVBORw0KGgo")) return "image/png";
  if (base64.startsWith("/9j/")) return "image/jpeg";
  if (base64.startsWith("UklGR")) return "image/webp";
  if (base64.startsWith("R0lGOD")) return "image/gif";
  return null;
}

/**
 * Validates and normalizes either a `data:image/...;base64,...` Data URL
 * or a raw base64 payload into clean base64 bytes + normalized MIME type.
 */
export function extractBase64Image(
  rawInput: string,
  providedMimeType?: string
): ExtractedBase64ImageResult {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { ok: false, error: "Rasm ma'lumoti bo'sh", status: 400 };
  }

  let rawMimeFromDataUrl: string | undefined;
  let base64Body = trimmed;

  if (trimmed.startsWith("data:")) {
    const match = /^data:([^;,]+)(?:;[^,]*)?;base64,([\s\S]+)$/i.exec(trimmed);
    if (!match) {
      return {
        ok: false,
        error: "Rasm Data URL formati noto'g'ri (base64 kutilmoqda)",
        status: 400,
      };
    }
    rawMimeFromDataUrl = match[1];
    base64Body = match[2];
  }

  const cleanBase64 = base64Body.replace(/\s+/g, "");
  if (!cleanBase64 || !/^[A-Za-z0-9+/=_-]+$/.test(cleanBase64)) {
    return {
      ok: false,
      error: "Base64 rasm ma'lumoti yaroqsiz",
      status: 400,
    };
  }

  let resolvedMime: AllowedImageMimeType | null = null;
  const cleanedDataUrlMime = rawMimeFromDataUrl?.trim().toLowerCase().split(";")[0];
  if (cleanedDataUrlMime && cleanedDataUrlMime !== "application/octet-stream") {
    resolvedMime = normalizeImageMimeType(cleanedDataUrlMime);
  } else if (providedMimeType && providedMimeType.trim()) {
    resolvedMime =
      normalizeImageMimeType(providedMimeType) ?? sniffMimeFromBase64Prefix(cleanBase64);
  } else {
    resolvedMime = sniffMimeFromBase64Prefix(cleanBase64);
  }

  if (!resolvedMime) {
    return {
      ok: false,
      error: "Faqat JPEG, PNG, WEBP, GIF yoki HEIC formatidagi rasmlar qo'llab-quvvatlanadi",
      status: 400,
    };
  }

  const paddingLength = cleanBase64.endsWith("==") ? 2 : cleanBase64.endsWith("=") ? 1 : 0;
  const estimatedBytes = Math.floor((cleanBase64.length * 3) / 4) - paddingLength;

  if (estimatedBytes <= 0) {
    return { ok: false, error: "Rasm hajmi bo'sh", status: 400 };
  }

  if (estimatedBytes > MAX_TOPIC_IMAGE_BYTES) {
    return {
      ok: false,
      error: "Rasm hajmi juda katta (maksimal 10 MB). Iltimos kichikroq rasm yuklang.",
      status: 413,
    };
  }

  return {
    ok: true,
    data: cleanBase64,
    mimeType: resolvedMime,
    sizeBytes: estimatedBytes,
  };
}

const METADATA_HEADER_ONLY_REGEX =
  /^(?:t\/r|№(?:\s*п\/п)?|tartib\s+raqami|mavzu(?:\s+nomi)?|mavzular(?:\s+ro['‘ʻ]?yxati)?|savollar(?:\s+ro['‘ʻ]?yxati)?|reja|fan(?:\s+nomi)?|guruh|kurs|talaba(?:\s+f\.?i\.?sh\.?)?|o['‘ʻ]?qituvchi|sana|soat(?:i)?|ball|imzo|изоҳ|мавзу\s+номи|предмет|тема|группа|курс|студент|преподаватель|дата|часы|подпись|topic|subject|date|hours|grade)$/i;

function isTableHeaderOnlyText(raw: string): boolean {
  const parts = raw
    .split(/[|\t,;]+/)
    .map((part) => part.replace(/[:.-]+$/g, "").trim())
    .filter(Boolean);
  if (parts.length === 0) return false;
  return parts.every((part) => METADATA_HEADER_ONLY_REGEX.test(part));
}

/**
 * Cleans markdown code fences (if any) and validates Gemini's structured topic payload.
 */
export function parseGeminiTopicsPayload(rawText: string): {
  topics: ParsedTopic[];
  subject?: string;
  language?: AcademicLanguage;
} {
  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  if (!cleaned) {
    return { topics: [] };
  }

  const parsed: unknown = JSON.parse(cleaned);
  const rawList: unknown[] = Array.isArray(parsed)
    ? parsed
    : typeof parsed === "object" &&
        parsed !== null &&
        "topics" in parsed &&
        Array.isArray((parsed as { topics: unknown }).topics)
      ? (parsed as { topics: unknown[] }).topics
      : [];

  let detectedSubject: string | undefined;
  let detectedLanguage: AcademicLanguage | undefined;

  if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
    const obj = parsed as { subject?: unknown; language?: unknown };
    if (typeof obj.subject === "string" && obj.subject.trim().length >= 2) {
      detectedSubject = obj.subject.trim().slice(0, 200);
    }
    detectedLanguage = normalizeAcademicLanguageValue(obj.language);
  }

  const normalized: ParsedTopic[] = [];

  for (const item of rawList) {
    if (typeof item !== "object" || item === null) continue;
    const candidate = item as { title?: unknown; content?: unknown };
    const title = typeof candidate.title === "string" ? candidate.title.trim() : "";
    const contentRaw = typeof candidate.content === "string" ? candidate.content.trim() : "";

    if (!title && !contentRaw) continue;

    // Skip spurious table column headers / metadata rows mistakenly emitted as topics
    const isHeaderTitle = Boolean(title) && isTableHeaderOnlyText(title);
    const isEmptyOrHeaderContent = !contentRaw || isTableHeaderOnlyText(contentRaw);
    if (isHeaderTitle && isEmptyOrHeaderContent) {
      continue;
    }

    normalized.push({
      title: (title || contentRaw.slice(0, 80)).slice(0, 300),
      content: contentRaw.slice(0, 25000),
    });

    if (normalized.length >= MAX_TOPICS_PER_IMAGE) break;
  }

  return parseTopicsResponseSchema.parse({
    topics: normalized,
    ...(detectedSubject ? { subject: detectedSubject } : {}),
    ...(detectedLanguage ? { language: detectedLanguage } : {}),
  });
}

export function buildDocumentSlug(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 48);

  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || "mavzular"}-${Date.now().toString(36)}-${suffix}`;
}

export function formatTopicsAsBlueprint(topics: ParsedTopic[]): string {
  return topics
    .map((topic, index) => {
      const cleanTitle = topic.title.trim();
      const cleanContent = topic.content.trim();
      return cleanContent
        ? `${index + 1}. ${cleanTitle}\n${cleanContent}`
        : `${index + 1}. ${cleanTitle}`;
    })
    .join("\n\n");
}
