import crypto from "crypto";
import { del, get, issueSignedToken, presignUrl, put } from "@vercel/blob";
import {
  DIRECT_UPLOAD_MAX_BYTES,
  type DirectStorageProvider,
  type DirectUploadFolder,
  isAllowedDirectUploadFile,
  isValidDirectStoragePath,
  sanitizeStorageFileName,
  type UploadedStorageFile,
} from "./direct-upload-shared";

interface SupabaseConfig {
  url: string;
  serviceRoleKey: string;
  bucket: string;
}

function getSupabaseConfig(): SupabaseConfig | null {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "")
    .trim()
    .replace(/\/+$/, "");
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!url || !serviceRoleKey) return null;
  const bucket = (process.env.SUPABASE_STORAGE_BUCKET || "docnova-uploads").trim();
  return { url, serviceRoleKey, bucket };
}

function hasVercelBlobConfig(): boolean {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN?.trim() ||
    (process.env.VERCEL_OIDC_TOKEN?.trim() && process.env.BLOB_STORE_ID?.trim())
  );
}

export function getActiveDirectStorageProvider(): DirectStorageProvider | null {
  if (getSupabaseConfig()) return "supabase";
  if (hasVercelBlobConfig()) return "vercel-blob";
  return null;
}

export function buildDirectStoragePath(folder: DirectUploadFolder, fileName: string): string {
  const safeName = sanitizeStorageFileName(fileName);
  const stamp = Date.now().toString(36);
  const rand = crypto.randomBytes(6).toString("hex");
  return `uploads/${folder}/${stamp}-${rand}-${safeName}`;
}

export interface SupabaseSignedUploadResult {
  provider: "supabase";
  signedUrl: string;
  token: string;
  path: string;
  url: string;
  bucket: string;
}

export async function createSupabaseSignedUploadUrl(params: {
  folder: DirectUploadFolder;
  fileName: string;
  fileSize: number;
  mimeType?: string;
}): Promise<SupabaseSignedUploadResult> {
  const cfg = getSupabaseConfig();
  if (!cfg) {
    throw new Error("Supabase Storage sozlanmagan (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  }

  if (params.fileSize <= 0 || params.fileSize > DIRECT_UPLOAD_MAX_BYTES) {
    throw new Error(
      `Fayl hajmi 1 baytdan ${(DIRECT_UPLOAD_MAX_BYTES / (1024 * 1024)).toFixed(0)} MB gacha bo'lishi kerak.`
    );
  }

  if (!isAllowedDirectUploadFile(params.fileName, params.mimeType)) {
    throw new Error("Ushbu fayl formati xavfsizlik sababli qo'llab-quvvatlanmaydi.");
  }

  const objectPath = buildDirectStoragePath(params.folder, params.fileName);
  const encodedPath = objectPath
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");

  const signEndpoint = `${cfg.url}/storage/v1/object/upload/sign/${encodeURIComponent(cfg.bucket)}/${encodedPath}`;
  const res = await fetch(signEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.serviceRoleKey}`,
      apikey: cfg.serviceRoleKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(
      `Supabase Signed Upload URL yaratishda xatolik (${res.status}): ${errBody.slice(0, 160)}`
    );
  }

  const data = (await res.json()) as { url?: string; signedURL?: string; token?: string };
  const relativeSigned = data.url || data.signedURL || "";
  if (!relativeSigned) {
    throw new Error("Supabase Signed Upload URL javobi noto'g'ri formatda.");
  }

  const signedUrl = relativeSigned.startsWith("http")
    ? relativeSigned
    : `${cfg.url}/storage/v1${relativeSigned.startsWith("/") ? "" : "/"}${relativeSigned}`;

  return {
    provider: "supabase",
    signedUrl,
    token: data.token || "",
    path: objectPath,
    url: `${cfg.url}/storage/v1/object/authenticated/${encodeURIComponent(cfg.bucket)}/${encodedPath}`,
    bucket: cfg.bucket,
  };
}

async function readStreamToBuffer(
  stream: ReadableStream<Uint8Array>,
  maxBytes: number
): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        throw new Error(
          `Fayl hajmi ruxsat etilgan chegaradan (${(maxBytes / (1024 * 1024)).toFixed(0)} MB) oshib ketdi.`
        );
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  return Buffer.concat(chunks.map((c) => Buffer.from(c)));
}

/**
 * Downloads an uploaded temporary file from configured cloud storage.
 * Strictly prevents SSRF by validating path prefixes and only reading from configured providers.
 */
export async function downloadUploadedStorageFile(
  ref: Pick<UploadedStorageFile, "provider" | "path"> & { url?: string },
  maxBytes: number = DIRECT_UPLOAD_MAX_BYTES
): Promise<{ buffer: Buffer; mimeType: string }> {
  if (!isValidDirectStoragePath(ref.path)) {
    throw new Error("Noto'g'ri yoki ruxsat etilmagan fayl yo'li (storagePath).");
  }

  if (ref.provider === "supabase") {
    const cfg = getSupabaseConfig();
    if (!cfg) {
      throw new Error("Supabase Storage konfiguratsiyasi topilmadi.");
    }

    const encodedPath = ref.path
      .split("/")
      .map((seg) => encodeURIComponent(seg))
      .join("/");
    const downloadEndpoint = `${cfg.url}/storage/v1/object/authenticated/${encodeURIComponent(cfg.bucket)}/${encodedPath}`;

    const res = await fetch(downloadEndpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${cfg.serviceRoleKey}`,
        apikey: cfg.serviceRoleKey,
      },
    });

    if (!res.ok || !res.body) {
      throw new Error(`Bulutdan faylni o'qib bo'lmadi (HTTP ${res.status}).`);
    }

    const buffer = await readStreamToBuffer(res.body, maxBytes);
    const mimeType = res.headers.get("content-type") || "application/octet-stream";
    return { buffer, mimeType };
  }

  if (ref.provider === "vercel-blob") {
    if (!hasVercelBlobConfig()) {
      throw new Error("Vercel Blob Storage konfiguratsiyasi topilmadi.");
    }

    const result = await get(ref.path, { access: "private", useCache: false });
    if (!result || result.statusCode !== 200 || !result.stream) {
      throw new Error("Yuklangan fayl bulut omborida topilmadi yoki muddati tugagan.");
    }

    const buffer = await readStreamToBuffer(result.stream, maxBytes);
    return {
      buffer,
      mimeType: result.blob.contentType || "application/octet-stream",
    };
  }

  throw new Error("Noma'lum storage provayderi.");
}

/**
 * Best-effort cleanup of a temporary uploaded file after processing finishes.
 */
export async function deleteUploadedStorageFile(
  ref: Pick<UploadedStorageFile, "provider" | "path"> & { url?: string }
): Promise<void> {
  if (!isValidDirectStoragePath(ref.path)) return;

  try {
    if (ref.provider === "supabase") {
      const cfg = getSupabaseConfig();
      if (!cfg) return;
      const encodedPath = ref.path
        .split("/")
        .map((seg) => encodeURIComponent(seg))
        .join("/");
      await fetch(`${cfg.url}/storage/v1/object/${encodeURIComponent(cfg.bucket)}/${encodedPath}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${cfg.serviceRoleKey}`,
          apikey: cfg.serviceRoleKey,
        },
      });
      return;
    }

    if (ref.provider === "vercel-blob" && hasVercelBlobConfig()) {
      await del(ref.url || ref.path);
    }
  } catch (err) {
    console.warn("[DIRECT_STORAGE_CLEANUP_WARN]", err);
  }
}

/**
 * Stores a large processed output (e.g. >3.5 MB compressed/merged PDF) in cloud storage
 * and returns a short-lived direct download URL to bypass Vercel's 4.5 MB response body cap.
 */
export async function storeProcessedOutputAndGetDownloadUrl(params: {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
}): Promise<{ downloadUrl: string; path: string } | null> {
  const provider = getActiveDirectStorageProvider();
  if (!provider) return null;

  const objectPath = buildDirectStoragePath("outputs", params.fileName);

  if (provider === "supabase") {
    const cfg = getSupabaseConfig();
    if (!cfg) return null;
    const encodedPath = objectPath
      .split("/")
      .map((seg) => encodeURIComponent(seg))
      .join("/");

    const uploadRes = await fetch(
      `${cfg.url}/storage/v1/object/${encodeURIComponent(cfg.bucket)}/${encodedPath}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cfg.serviceRoleKey}`,
          apikey: cfg.serviceRoleKey,
          "Content-Type": params.mimeType,
          "x-upsert": "true",
        },
        body: new Uint8Array(params.buffer),
      }
    );

    if (!uploadRes.ok) {
      throw new Error(`Natijani Supabase'ga saqlab bo'lmadi (${uploadRes.status}).`);
    }

    const signRes = await fetch(
      `${cfg.url}/storage/v1/object/sign/${encodeURIComponent(cfg.bucket)}/${encodedPath}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cfg.serviceRoleKey}`,
          apikey: cfg.serviceRoleKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          expiresIn: 900,
          download: sanitizeStorageFileName(params.fileName),
        }),
      }
    );

    if (!signRes.ok) {
      throw new Error(`Yuklab olish havolasini yaratib bo'lmadi (${signRes.status}).`);
    }

    const signData = (await signRes.json()) as { signedURL?: string; signedUrl?: string };
    const rel = signData.signedURL || signData.signedUrl || "";
    if (!rel) return null;

    const downloadUrl = rel.startsWith("http")
      ? rel
      : `${cfg.url}/storage/v1${rel.startsWith("/") ? "" : "/"}${rel}`;
    return { downloadUrl, path: objectPath };
  }

  // Vercel Blob Private Storage with 1-day TTL + 15-minute presigned GET URL
  const saved = await put(objectPath, params.buffer, {
    access: "private",
    contentType: params.mimeType,
    addRandomSuffix: true,
    ttlDays: 1,
  });

  const validUntil = Date.now() + 15 * 60 * 1000;
  const signedToken = await issueSignedToken({
    pathname: saved.pathname,
    operations: ["get"],
    validUntil,
  });

  const presigned = await presignUrl(signedToken, {
    access: "private",
    operation: "get",
    pathname: saved.pathname,
    validUntil: signedToken.validUntil,
  });

  return {
    downloadUrl: presigned.presignedUrl,
    path: saved.pathname,
  };
}
