export type DirectStorageProvider = "supabase" | "vercel-blob";

export type DirectUploadFolder = "samples" | "topics" | "pdf" | "outputs";

export interface UploadedStorageFile {
  provider: DirectStorageProvider;
  path: string;
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export const DIRECT_UPLOAD_MAX_BYTES = 50 * 1024 * 1024; // 50 MB max client-to-storage upload
export const SERVERLESS_SAFE_BODY_BYTES = 3.5 * 1024 * 1024; // Keep serverless req/res safely below Vercel's 4.5 MB cap

export const ALLOWED_DIRECT_UPLOAD_MIME_TYPES: string[] = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "application/octet-stream",
];

export const ALLOWED_DIRECT_UPLOAD_EXTENSIONS = [
  ".pdf",
  ".docx",
  ".doc",
  ".txt",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".heic",
  ".heif",
] as const;

export function sanitizeStorageFileName(rawName: string): string {
  const base = (rawName || "file").replace(/\\/g, "/").split("/").pop() || "file";
  const cleaned = base
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120);
  return cleaned || "file";
}

export function isAllowedDirectUploadFile(fileName: string, mimeType?: string): boolean {
  const lowerName = (fileName || "").toLowerCase();
  const hasAllowedExt = ALLOWED_DIRECT_UPLOAD_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  if (hasAllowedExt) return true;

  const cleanMime = (mimeType || "").trim().toLowerCase().split(";")[0];
  if (cleanMime && ALLOWED_DIRECT_UPLOAD_MIME_TYPES.includes(cleanMime)) {
    // Reject explicitly dangerous extensions even if mime is octet-stream
    if (/\.(exe|bat|cmd|sh|php|js|mjs|cjs|vbs|html|htm|svg|ps1|dll|msi)$/i.test(lowerName)) {
      return false;
    }
    return true;
  }

  return false;
}

export function isValidDirectStoragePath(storagePath: string): boolean {
  if (!storagePath || typeof storagePath !== "string") return false;
  if (storagePath.length > 512) return false;
  if (storagePath.includes("..") || storagePath.includes("\\") || storagePath.includes("\0")) {
    return false;
  }
  return /^uploads\/(samples|topics|pdf|outputs)\/[a-zA-Z0-9._\-/]+$/.test(storagePath);
}

export function formatBytesCompact(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
