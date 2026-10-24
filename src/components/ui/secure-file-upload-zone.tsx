"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SecureFileUploadZoneProps {
  onTextExtracted: (extractedText: string, fileName: string) => void;
  onClear?: () => void;
  className?: string;
  maxSizeBytes?: number; // Default 10MB
  title?: string;
  description?: string;
}

const ALLOWED_EXTENSIONS = [".txt", ".docx", ".pdf"];
const DANGEROUS_EXTENSIONS = [
  ".exe",
  ".bat",
  ".cmd",
  ".sh",
  ".php",
  ".js",
  ".vbs",
  ".zip",
  ".tar",
  ".gz",
  ".rar",
  ".7z",
  ".py",
  ".jar",
  ".msi",
  ".scr",
  ".dll",
];

const MAX_SIZE_DEFAULT = 10 * 1024 * 1024; // 10 MB

/**
 * Sanitize extracted text to prevent script injection before passing to AI prompts
 */
export function sanitizePromptText(raw: string): string {
  if (!raw) return "";
  return (
    raw
      // Strip null characters
      .replace(/\0/g, "")
      // Neutralize script tags
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "[script_removed]")
      // Neutralize html event handlers
      .replace(/\bon\w+\s*=/gi, "on_disabled=")
      // Normalize excessive consecutive blank lines
      .replace(/\n{4,}/g, "\n\n\n")
      .trim()
  );
}

export function SecureFileUploadZone({
  onTextExtracted,
  onClear,
  className,
  maxSizeBytes = MAX_SIZE_DEFAULT,
  title = "Namuna yoki tayyor matn faylini yuklash",
  description = "Faqat .TXT, .DOCX yoki .PDF (maksimal 10 MB). Fayl matni AI generatsiyasi uchun kontekst sifatida olinadi.",
}: SecureFileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [fileSizeStr, setFileSizeStr] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validateFile = (file: File): string | null => {
    const lowerName = file.name.toLowerCase();

    // Dangerous extension check
    for (const danger of DANGEROUS_EXTENSIONS) {
      if (lowerName.endsWith(danger)) {
        return `Xavfli fayl turi aniqlandi (${danger}). Faqat .txt, .docx yoki .pdf yuklang.`;
      }
    }

    // Allowed extension check
    const isAllowed = ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
    if (!isAllowed) {
      return "Faqat .txt, .docx va .pdf formatdagi fayllar qabul qilinadi.";
    }

    // Size check
    if (file.size > maxSizeBytes) {
      return `Fayl hajmi ruxsat etilgan limitdan (${formatFileSize(maxSizeBytes)}) katta.`;
    }

    return null;
  };

  const processFile = async (file: File) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const validationError = validateFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsProcessing(true);
    setCurrentFileName(file.name);
    setFileSizeStr(formatFileSize(file.size));

    try {
      const lowerName = file.name.toLowerCase();
      let extractedText = "";

      if (lowerName.endsWith(".txt")) {
        extractedText = await file.text();
      } else if (lowerName.endsWith(".docx")) {
        const mammothModule = await import("mammoth");
        const mammoth =
          (mammothModule as unknown as { default?: typeof mammothModule }).default || mammothModule;
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        extractedText = result.value || "";
      } else if (lowerName.endsWith(".pdf")) {
        // In-memory extraction via pdf-lib or client text stream
        const { PDFDocument } = await import("pdf-lib");
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const pageCount = pdfDoc.getPageCount();

        // Send to client-safe text extraction endpoint or parse text stream
        // Fallback: extract form fields or textual stream
        try {
          const formData = new FormData();
          formData.append("file", file);
          const res = await fetch("/api/pdf/extract-text", {
            method: "POST",
            body: formData,
          });
          if (res.ok) {
            const data = await res.json();
            extractedText = data.text || "";
          }
        } catch {
          // If serverless endpoint fails, note page count
          extractedText = `[PDF Hujjat: ${file.name}, Sahifalar soni: ${pageCount}]`;
        }

        if (!extractedText) {
          extractedText = `[PDF Hujjat: ${file.name}, Sahifalar soni: ${pageCount}]`;
        }
      }

      const sanitized = sanitizePromptText(extractedText);
      if (!sanitized) {
        throw new Error("Fayldan matn ajratib olinmadi yoki fayl bo'sh.");
      }

      onTextExtracted(sanitized, file.name);
      setSuccessMessage(
        `«${file.name}» muvaffaqiyatli yuklandi va matni ajratildi (~${sanitized.length.toLocaleString()} ta belgi).`
      );
    } catch (err: unknown) {
      console.error("[SECURE_FILE_UPLOAD_ERROR]", err);
      const msg = err instanceof Error ? err.message : "Faylni o'qishda xatolik yuz berdi.";
      setErrorMessage(msg);
      setCurrentFileName(null);
      setFileSizeStr(null);
    } finally {
      setIsProcessing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleRemove = () => {
    setCurrentFileName(null);
    setFileSizeStr(null);
    setErrorMessage(null);
    setSuccessMessage(null);
    if (inputRef.current) inputRef.current.value = "";
    onClear?.();
  };

  return (
    <div className={cn("w-full space-y-2.5", className)}>
      <input
        ref={inputRef}
        type="file"
        accept=".txt,.docx,.pdf,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleFileChange}
        className="hidden"
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && inputRef.current?.click()}
        className={cn(
          "group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-5 text-center transition-all",
          isDragging
            ? "border-primary bg-primary/10 scale-[0.99]"
            : "border-border/80 bg-surface/30 hover:border-primary/50 hover:bg-surface-elevated/60",
          isProcessing && "pointer-events-none opacity-60"
        )}
      >
        <div className="bg-primary/10 text-primary border-primary/20 mb-2.5 flex h-11 w-11 items-center justify-center rounded-xl border transition-transform group-hover:scale-105">
          {isProcessing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <UploadCloud className="h-5 w-5" />
          )}
        </div>

        <div className="text-foreground text-xs font-bold">
          {isProcessing ? "Fayl tahlil qilinmoqda..." : title}
        </div>
        <p className="text-foreground-muted mt-1 max-w-md text-[11px] leading-relaxed">
          {description}
        </p>

        <div className="text-foreground-secondary mt-2.5 inline-flex items-center gap-2 text-[10px] font-medium">
          <span className="border-border bg-surface-elevated rounded-md border px-2 py-0.5">
            .TXT
          </span>
          <span className="border-border bg-surface-elevated rounded-md border px-2 py-0.5">
            .DOCX
          </span>
          <span className="border-border bg-surface-elevated rounded-md border px-2 py-0.5">
            .PDF
          </span>
          <span className="text-foreground-muted">• Max: 10 MB</span>
        </div>
      </div>

      {/* Active File Loaded Banner */}
      {currentFileName && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-400">
          <div className="flex items-center gap-2 truncate">
            <FileText className="h-4 w-4 shrink-0" />
            <span className="truncate font-semibold">{currentFileName}</span>
            {fileSizeStr && (
              <span className="text-[10px] text-emerald-300/80">({fileSizeStr})</span>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleRemove();
            }}
            className="rounded-md p-1 text-emerald-300 transition-colors hover:bg-emerald-500/20"
            title="Faylni olib tashlash"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1">{errorMessage}</div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-red-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Success Notification */}
      {successMessage && !errorMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-[11px] text-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
          <span className="truncate">{successMessage}</span>
        </div>
      )}
    </div>
  );
}
