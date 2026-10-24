"use client";

/**
 * Universal, mobile-safe PDF export utilities.
 *
 * Why this exists:
 *  - `html2pdf.js` bundles the original `html2canvas@1.x`, which throws
 *    "Attempting to parse an unsupported color function 'oklch'" on every
 *    Tailwind CSS v4 page (Tailwind v4 emits all colors as oklch()).
 *  - Capturing a whole multi-page document in a single canvas exhausts
 *    mobile GPU/memory limits and crashes the tab.
 *  - Blob downloads silently fail inside in-app browsers (Telegram, Instagram...).
 *  - After a new deployment, old open tabs fail to lazy-load renamed chunks.
 *
 * This module captures pages one-by-one with `html2canvas-pro` (oklch/oklab aware),
 * caps the canvas size per device, assembles the PDF with `jsPDF`, and delivers the
 * file with the best available mechanism for the current browser.
 */

export type PdfOrientation = "portrait" | "landscape";

export interface ExportElementsOptions {
  filename: string;
  orientation?: PdfOrientation;
  /** Page margin in mm. */
  margin?: number;
  /**
   * "page"  → each element is scaled to fit entirely on one page (slides, CV).
   * "width" → each element fills the page width, tall content is sliced onto
   *           multiple pages (long documents).
   * "auto"  → "page" for page-sized elements, "width" for taller ones.
   */
  fit?: "page" | "width" | "auto";
  /** Force the captured element to this CSS pixel width (desktop-like layout on phones). */
  captureWidth?: number;
  backgroundColor?: string;
  /** Progress callback: (currentPage, totalPages). */
  onProgress?: (current: number, total: number) => void;
}

const CHUNK_ERROR_RE =
  /Loading chunk|ChunkLoadError|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i;

export class StaleBuildError extends Error {
  constructor() {
    super("Sayt yangilangan. Sahifani yangilang (refresh) va qayta urinib ko'ring.");
    this.name = "StaleBuildError";
  }
}

export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.innerWidth < 768 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );
}

export function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const w = window as unknown as {
    Telegram?: { WebApp?: unknown };
    TelegramWebviewProxy?: unknown;
  };
  return (
    Boolean(w.TelegramWebviewProxy || w.Telegram?.WebApp) ||
    /Telegram|Instagram|FBAN|FBAV|FB_IAB|Line\/|MicroMessenger|; wv\)/i.test(ua)
  );
}

/** Dynamic import with retry; converts stale-deployment chunk errors into StaleBuildError. */
export async function importWithRetry<T>(loader: () => Promise<T>, retries = 2): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await loader();
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }
  const msg = lastErr instanceof Error ? `${lastErr.name} ${lastErr.message}` : String(lastErr);
  if (CHUNK_ERROR_RE.test(msg)) throw new StaleBuildError();
  throw lastErr;
}

const nextFrame = () => new Promise<void>((r) => setTimeout(r, 0));

/** Captures each element separately and returns a ready PDF Blob. */
export async function exportElementsToPdf(
  elements: HTMLElement[],
  opts: ExportElementsOptions
): Promise<Blob> {
  const targets = elements.filter(Boolean);
  if (targets.length === 0) throw new Error("Eksport qilinadigan sahifa topilmadi");

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    importWithRetry(() => import("html2canvas-pro")),
    importWithRetry(() => import("jspdf")),
  ]);

  const orientation = opts.orientation ?? "portrait";
  const margin = opts.margin ?? 0;
  const fit = opts.fit ?? "page";
  const mobile = isMobileDevice();

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation, compress: true });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const contentW = pageW - margin * 2;
  const contentH = pageH - margin * 2;

  // Max canvas pixel area per capture (iOS Safari hard limit ≈ 16.7M px).
  const maxArea = mobile ? 6_000_000 : 14_000_000;
  const baseScale = mobile ? 1.5 : 2;

  let firstPage = true;

  for (let i = 0; i < targets.length; i++) {
    opts.onProgress?.(i + 1, targets.length);
    const el = targets[i];

    const width = opts.captureWidth ?? Math.max(el.scrollWidth, el.offsetWidth, 1);
    const estHeight =
      Math.max(el.scrollHeight, el.offsetHeight, 1) * (width / Math.max(el.offsetWidth, 1));
    const scale = Math.max(0.75, Math.min(baseScale, Math.sqrt(maxArea / (width * estHeight))));

    const canvas = await html2canvas(el, {
      scale,
      useCORS: true,
      logging: false,
      backgroundColor: opts.backgroundColor ?? "#ffffff",
      windowWidth: opts.captureWidth ? Math.max(opts.captureWidth + 40, 1024) : undefined,
      scrollX: 0,
      scrollY: 0,
      onclone: (_doc: Document, cloned: HTMLElement) => {
        cloned.classList.remove("hidden");
        cloned.style.display = cloned.style.display === "none" ? "block" : cloned.style.display;
        if (opts.captureWidth) {
          cloned.style.width = `${opts.captureWidth}px`;
          cloned.style.maxWidth = "none";
        }
        cloned.style.boxShadow = "none";
        // Expand scroll containers so the full content is captured.
        cloned.style.maxHeight = "none";
        cloned.style.overflowY = "visible";
      },
    });

    const imgWmm = contentW;
    const pxPerMm = canvas.width / imgWmm;
    // "auto": keep near-page-sized elements on one page, slice genuinely tall ones.
    const fitsOnePage = canvas.height / canvas.width <= (contentH / contentW) * 1.15;
    const mode = fit === "auto" ? (fitsOnePage ? "page" : "width") : fit;

    if (mode === "page") {
      const ratio = Math.min(contentW / canvas.width, contentH / canvas.height);
      const w = canvas.width * ratio;
      const h = canvas.height * ratio;
      if (!firstPage) pdf.addPage("a4", orientation);
      pdf.addImage(
        canvas.toDataURL("image/jpeg", 0.92),
        "JPEG",
        margin + (contentW - w) / 2,
        margin + (contentH - h) / 2,
        w,
        h,
        undefined,
        "FAST"
      );
      firstPage = false;
    } else {
      // Slice tall canvas into page-height strips, cutting on blank rows (between text lines).
      const sliceHpx = Math.floor(contentH * pxPerMm);
      const slice = document.createElement("canvas");
      const sctx = slice.getContext("2d");
      if (!sctx) throw new Error("Canvas 2D konteksti yaratilmadi");
      slice.width = canvas.width;
      const srcCtx = canvas.getContext("2d", { willReadFrequently: true });

      const findSafeCut = (target: number): number => {
        if (!srcCtx || target >= canvas.height) return Math.min(target, canvas.height);
        const minY = target - Math.floor(sliceHpx * 0.15);
        for (let y = target; y > minY; y--) {
          const row = srcCtx.getImageData(0, y, canvas.width, 1).data;
          let blank = true;
          for (let p = 0; p < row.length; p += 16) {
            if (row[p] < 235 || row[p + 1] < 235 || row[p + 2] < 235) {
              blank = false;
              break;
            }
          }
          if (blank) return y;
        }
        return target;
      };

      for (let y = 0; y < canvas.height;) {
        const cut = findSafeCut(y + sliceHpx);
        const h = Math.max(1, cut - y);
        if (h < 4) break;
        slice.height = h;
        sctx.fillStyle = opts.backgroundColor ?? "#ffffff";
        sctx.fillRect(0, 0, slice.width, h);
        sctx.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
        if (!firstPage) pdf.addPage("a4", orientation);
        pdf.addImage(
          slice.toDataURL("image/jpeg", 0.9),
          "JPEG",
          margin,
          margin,
          imgWmm,
          h / pxPerMm,
          undefined,
          "FAST"
        );
        firstPage = false;
        y = cut;
        await nextFrame();
      }
      slice.width = 0;
      slice.height = 0;
    }

    // Free GPU memory immediately (important on phones).
    canvas.width = 0;
    canvas.height = 0;
    await nextFrame();
  }

  return pdf.output("blob");
}

export type DeliveryResult = "downloaded" | "shared" | "cancelled";

/** Delivers a PDF blob using the most reliable method for the current browser. */
export async function deliverPdf(blob: Blob, filename: string): Promise<DeliveryResult> {
  const safeName = filename.toLowerCase().endsWith(".pdf") ? filename : `${filename}.pdf`;

  // In-app browsers (Telegram/Instagram) block blob downloads → use native share sheet.
  if (isInAppBrowser() && typeof navigator !== "undefined" && "share" in navigator) {
    try {
      const file = new File([blob], safeName, { type: "application/pdf" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: safeName });
        return "shared";
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return "cancelled";
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = safeName;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return "downloaded";
}

/** Uzbek user-facing description for any PDF export error. */
export function describePdfError(err: unknown): string {
  if (err instanceof StaleBuildError) return err.message;
  const msg = err instanceof Error ? err.message : String(err);
  if (/memory|allocation|too large|exceeds/i.test(msg)) {
    return "Qurilma xotirasi yetmadi. Kompyuterda yoki 'Chop etish → PDF sifatida saqlash' orqali urinib ko'ring.";
  }
  return "PDF yaratib bo'lmadi. Chop etish oynasi orqali 'PDF sifatida saqlash'ni tanlang.";
}

/** Toast text helper for successful delivery inside in-app browsers. */
export function inAppHint(): string | null {
  return isInAppBrowser()
    ? "Agar fayl yuklanmasa: yuqori o'ng burchakdagi ⋮ menyudan 'Brauzerda ochish' (Chrome/Safari) ni tanlang."
    : null;
}
