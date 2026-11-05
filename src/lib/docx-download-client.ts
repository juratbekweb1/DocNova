"use client";

import { isInAppBrowser } from "@/lib/pdf-export";

export interface DocxClientDownloadParams {
  topic: string;
  markdownContent?: string;
  pages?: Array<{
    pageNumber: number;
    type?: string;
    title?: string;
    content: string;
  }>;
  workType?: string;
  subject?: string;
  university?: string;
  faculty?: string;
  studentName?: string;
  teacherName?: string;
  language?: "uz" | "uz-cyrl" | "ru";
  year?: string | number;
  qrOnSeparatePage?: boolean;
}

export interface DocxClientDownloadResult {
  fileName: string;
  verificationCode: string;
  verificationUrl: string;
  deliveryMethod: "downloaded" | "shared" | "telegram_native" | "direct_url" | "cancelled";
}

interface TelegramWebAppWindow {
  Telegram?: {
    WebApp?: {
      downloadFile?: (
        params: { url: string; file_name: string },
        callback?: (accepted: boolean) => void
      ) => void;
      openLink?: (url: string, options?: { try_instant_view?: boolean }) => void;
    };
  };
}

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/**
 * Serverdagi `/api/academic/export-docx` API orqali haqiqiy OpenXML (.docx)
 * va QR-kodli hujjatni generatsiya qilib, barcha mobil qurilmalarda
 * (Telegram WebApp, Instagram In-App, iOS Safari, Android Chrome) va kompyuterda
 * 100% xatosiz yuklab beruvchi 4-bosqichli kliyent funksiyasi.
 */
export async function downloadAcademicDocx(
  params: DocxClientDownloadParams
): Promise<DocxClientDownloadResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 35_000);

  let response: Response;
  try {
    response = await fetch("/api/academic/export-docx", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(
        "Internet aloqasi sekinligi sababli so'rov vaqti tugadi. Qayta urinib ko'ring."
      );
    }
    throw new Error("Tarmoq xatosi. Internet aloqasini tekshirib, qayta urinib ko'ring.");
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    let errMsg = "Word (.docx) faylni yuklab olishda xatolik yuz berdi";
    try {
      const errData = await response.json();
      if (errData?.error) errMsg = errData.error;
    } catch {
      // JSON emas
    }
    throw new Error(errMsg);
  }

  const verificationCode =
    response.headers.get("X-DocNova-Verification-Code") || "DN-VERIFIED";
  const verificationUrl =
    response.headers.get("X-DocNova-Verification-Url") || "";
  const downloadToken = response.headers.get("X-DocNova-Download-Token") || "";

  // Content-Disposition dan fayl nomini ajratib olish
  const disposition = response.headers.get("Content-Disposition") || "";
  let fileName = `DocNova_${verificationCode}.docx`;
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  const asciiMatch = disposition.match(/filename="([^"]+)"/i);
  if (utf8Match?.[1]) {
    try {
      fileName = decodeURIComponent(utf8Match[1]);
    } catch {
      fileName = utf8Match[1];
    }
  } else if (asciiMatch?.[1]) {
    fileName = asciiMatch[1];
  }

  if (!fileName.toLowerCase().endsWith(".docx")) {
    fileName = `${fileName}.docx`;
  }

  const arrayBuffer = await response.arrayBuffer();
  const blob = new Blob([arrayBuffer], { type: DOCX_MIME });

  const directDownloadUrl =
    downloadToken && typeof window !== "undefined"
      ? `${window.location.origin}/api/academic/export-docx?dl=${encodeURIComponent(downloadToken)}`
      : "";

  // 1-BOSQICH: Telegram Mini App / WebApp Native `downloadFile` API (Bot API 8.0+)
  if (typeof window !== "undefined" && directDownloadUrl) {
    const tgWebApp = (window as unknown as TelegramWebAppWindow).Telegram?.WebApp;
    if (typeof tgWebApp?.downloadFile === "function") {
      try {
        tgWebApp.downloadFile({
          url: directDownloadUrl,
          file_name: fileName,
        });
        return {
          fileName,
          verificationCode,
          verificationUrl,
          deliveryMethod: "telegram_native",
        };
      } catch {
        // Keyingi bosqichga o'tish
      }
    }
  }

  // 2-BOSQICH: Mobil In-App brauzerlar (Telegram / Instagram WebView) uchun Web Share API (File Share)
  if (isInAppBrowser() && typeof navigator !== "undefined" && "share" in navigator) {
    try {
      const file = new File([blob], fileName, { type: DOCX_MIME });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: fileName,
        });
        return {
          fileName,
          verificationCode,
          verificationUrl,
          deliveryMethod: "shared",
        };
      }
    } catch (shareErr) {
      if (shareErr instanceof Error && shareErr.name === "AbortError") {
        return {
          fileName,
          verificationCode,
          verificationUrl,
          deliveryMethod: "cancelled",
        };
      }
      // Agar `NotAllowedError` bo'lsa (async fetch sabab user gesture yo'qolsa), 3-bosqichga o'tadi
    }
  }

  // 3-BOSQICH: In-App Brauzerda `blob:` bloklanganda haqiqiy HTTPS GET URL orqali native yuklash
  if (isInAppBrowser() && directDownloadUrl && typeof window !== "undefined") {
    const tgWebApp = (window as unknown as TelegramWebAppWindow).Telegram?.WebApp;
    if (typeof tgWebApp?.openLink === "function") {
      tgWebApp.openLink(directDownloadUrl);
    } else {
      window.location.assign(directDownloadUrl);
    }
    return {
      fileName,
      verificationCode,
      verificationUrl,
      deliveryMethod: "direct_url",
    };
  }

  // 4-BOSQICH: Standart kompyuter va mobil brauzerlar (iOS Safari, Android Chrome, Desktop)
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  // Mobil Safari va Chrome fayl oqimini o'qib ulgurishi uchun 60 soniya kutib tozalaymiz
  setTimeout(() => URL.revokeObjectURL(url), 60_000);

  return {
    fileName,
    verificationCode,
    verificationUrl,
    deliveryMethod: "downloaded",
  };
}
