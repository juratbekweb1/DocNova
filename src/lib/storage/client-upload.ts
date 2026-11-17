"use client";

import { upload } from "@vercel/blob/client";
import {
  DIRECT_UPLOAD_MAX_BYTES,
  type DirectStorageProvider,
  type DirectUploadFolder,
  sanitizeStorageFileName,
  type UploadedStorageFile,
} from "./direct-upload-shared";

export interface DirectUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface StorageCapabilityResponse {
  available: boolean;
  provider: DirectStorageProvider | null;
  maxBytes?: number;
}

let cachedCapability: StorageCapabilityResponse | null = null;

export function resetDirectStorageCapabilityCache() {
  cachedCapability = null;
}

export async function getDirectStorageCapability(): Promise<StorageCapabilityResponse> {
  if (cachedCapability) return cachedCapability;

  try {
    const res = await fetch("/api/storage/upload", {
      method: "GET",
      cache: "no-store",
    });
    if (!res.ok) {
      return { available: false, provider: null };
    }
    const data = (await res.json()) as StorageCapabilityResponse;
    if (typeof data?.available === "boolean") {
      cachedCapability = data;
      return data;
    }
  } catch {
    // Ignore capability probe failures and allow fallback for small files
  }

  return { available: false, provider: null };
}

function uploadViaXhrPut(
  url: string,
  file: File,
  contentType: string,
  onProgress?: (progress: DirectUploadProgress) => void,
  signal?: AbortSignal
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    const onAbort = () => {
      xhr.abort();
      reject(new DOMException("Yuklash bekor qilindi", "AbortError"));
    };

    if (signal) {
      if (signal.aborted) {
        reject(new DOMException("Yuklash bekor qilindi", "AbortError"));
        return;
      }
      signal.addEventListener("abort", onAbort, { once: true });
    }

    xhr.upload.onprogress = (event) => {
      if (!onProgress) return;
      const total = event.lengthComputable && event.total > 0 ? event.total : file.size;
      const loaded = Math.min(event.loaded, total);
      const percentage = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0;
      onProgress({ loaded, total, percentage });
    };

    xhr.onload = () => {
      signal?.removeEventListener("abort", onAbort);
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.({ loaded: file.size, total: file.size, percentage: 100 });
        resolve();
      } else {
        reject(new Error(`Bulutga yuklashda xatolik (HTTP ${xhr.status}).`));
      }
    };

    xhr.onerror = () => {
      signal?.removeEventListener("abort", onAbort);
      reject(
        new Error("Bulut xotirasi bilan aloqa uzildi. Internetni tekshirib qayta urinib ko'ring.")
      );
    };

    xhr.open("PUT", url, true);
    xhr.setRequestHeader("Content-Type", contentType || "application/octet-stream");
    xhr.setRequestHeader("x-upsert", "true");
    xhr.send(file);
  });
}

/**
 * Uploads a file directly from the user's browser to cloud storage (Supabase Storage Signed URL
 * or Vercel Blob Private Storage), completely bypassing Vercel's 4.5 MB Serverless Function body limit.
 *
 * Returns `null` if cloud storage is not configured in the current environment (e.g. unit tests),
 * allowing callers to fall back for small files <= 4 MB.
 */
export async function uploadFileDirectlyToStorage(
  file: File,
  options: {
    folder: DirectUploadFolder;
    onProgress?: (progress: DirectUploadProgress) => void;
    signal?: AbortSignal;
  }
): Promise<UploadedStorageFile | null> {
  if (file.size > DIRECT_UPLOAD_MAX_BYTES) {
    throw new Error(
      `Fayl hajmi maksimal ruxsat etilgan chegaradan (${(DIRECT_UPLOAD_MAX_BYTES / (1024 * 1024)).toFixed(0)} MB) katta.`
    );
  }

  const capability = await getDirectStorageCapability();
  if (!capability.available || !capability.provider) {
    return null;
  }

  options.onProgress?.({ loaded: 0, total: file.size, percentage: 2 });

  if (capability.provider === "supabase") {
    const signRes = await fetch("/api/storage/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: options.signal,
      body: JSON.stringify({
        action: "create-signed-url",
        folder: options.folder,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || "application/octet-stream",
      }),
    });

    const signData = (await signRes.json().catch(() => ({}))) as {
      signedUrl?: string;
      path?: string;
      url?: string;
      error?: string;
    };

    if (!signRes.ok || !signData.signedUrl || !signData.path) {
      throw new Error(signData.error || "Yuklash havolasini yaratib bo'lmadi.");
    }

    await uploadViaXhrPut(
      signData.signedUrl,
      file,
      file.type || "application/octet-stream",
      options.onProgress,
      options.signal
    );

    return {
      provider: "supabase",
      path: signData.path,
      url: signData.url || "",
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || "application/octet-stream",
    };
  }

  // Vercel Blob direct client upload (multipart automatically enabled for >4 MB files)
  const safeName = sanitizeStorageFileName(file.name);
  const stamp = Date.now().toString(36);
  const pathname = `uploads/${options.folder}/${stamp}-${safeName}`;

  const blob = await upload(pathname, file, {
    access: "private",
    handleUploadUrl: "/api/storage/upload",
    contentType: file.type || undefined,
    multipart: file.size > 4 * 1024 * 1024,
    abortSignal: options.signal,
    onUploadProgress: (evt) => {
      options.onProgress?.({
        loaded: evt.loaded,
        total: evt.total || file.size,
        percentage: Math.min(100, Math.round(evt.percentage)),
      });
    },
  });

  options.onProgress?.({ loaded: file.size, total: file.size, percentage: 100 });

  return {
    provider: "vercel-blob",
    path: blob.pathname,
    url: blob.url,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type || blob.contentType || "application/octet-stream",
  };
}
