"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  ShieldAlert,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SampleDocumentAnalysis,
  analyzeSampleDocument,
  sanitizeSafeFileName,
  sanitizeUntrustedSampleText,
  validateSampleFileBuffer,
} from "@/lib/academic-sample-intelligence";

export interface SecureFileUploadZoneProps {
  onTextExtracted: (
    extractedText: string,
    fileName: string,
    analysis?: SampleDocumentAnalysis
  ) => void;
  onSampleAnalyzed?: (analysis: SampleDocumentAnalysis) => void;
  onClear?: () => void;
  className?: string;
  maxSizeBytes?: number; // Default 10MB
  title?: string;
  description?: string;
  showAnalysisCard?: boolean;
}

const MAX_SIZE_DEFAULT = 10 * 1024 * 1024; // 10 MB

/**
 * Sanitize extracted text to prevent script & prompt injection before passing to AI prompts
 */
export function sanitizePromptText(raw: string): string {
  return sanitizeUntrustedSampleText(raw);
}

export function SecureFileUploadZone({
  onTextExtracted,
  onSampleAnalyzed,
  onClear,
  className,
  maxSizeBytes = MAX_SIZE_DEFAULT,
  title = "Namuna faylni tanlang yoki shu yerga tashlang",
  description = "Namuna fayl hujjatning tuzilishi va formatini tushunish uchun ishlatiladi. Yangi hujjat siz tasdiqlagan mavzu va ma'lumotlar asosida tayyorlanadi.",
  showAnalysisCard = true,
}: SecureFileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [fileSizeStr, setFileSizeStr] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<SampleDocumentAnalysis | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const processFile = async (file: File) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setAnalysis(null);

    if (file.size <= 0) {
      setErrorMessage(
        "Yuklangan fayl bo'sh (0 bayt). Iltimos, matni bor boshqa fayl yuklang yoki «Noldan yaratish» rejimini tanlang."
      );
      return;
    }

    if (file.size > maxSizeBytes) {
      setErrorMessage(
        `Fayl hajmi ruxsat etilgan me'yordan (${formatFileSize(maxSizeBytes)}) katta. Kichikroq fayl tanlang.`
      );
      return;
    }

    setIsProcessing(true);
    const safeName = sanitizeSafeFileName(file.name);
    setCurrentFileName(safeName);
    setFileSizeStr(formatFileSize(file.size));

    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);

      const validation = validateSampleFileBuffer({
        fileName: safeName,
        fileSize: file.size,
        mimeType: file.type,
        buffer: uint8,
        maxSizeBytes,
      });

      if (!validation.valid) {
        throw new Error(validation.error);
      }

      let extractedText = "";
      let serverAnalysis: SampleDocumentAnalysis | undefined;

      if (validation.ext === ".txt") {
        extractedText = new TextDecoder("utf-8").decode(uint8);
      } else if (validation.ext === ".docx") {
        try {
          const mammothModule = await import("mammoth");
          const mammoth =
            (mammothModule as unknown as { default?: typeof mammothModule }).default ||
            mammothModule;
          const result = await mammoth.extractRawText({ arrayBuffer });
          extractedText = result.value || "";
        } catch {
          // Server fallback
          const formData = new FormData();
          formData.append("file", file);
          const res = await fetch("/api/academic/analyze-sample", {
            method: "POST",
            body: formData,
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            throw new Error(
              data.error ||
                "DOCX faylni o'qib bo'lmadi. Fayl shikastlangan bo'lishi mumkin — boshqa fayl tanlang."
            );
          }
          extractedText = data.text || "";
          serverAnalysis = data.analysis;
        }
      } else if (validation.ext === ".pdf") {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/academic/analyze-sample", {
          method: "POST",
          body: formData,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            data.error ||
              "PDF fayldan matn ajratib olinmadi. Parol bilan himoyalangan yoki skanerlangan rasm bo'lishi mumkin."
          );
        }
        extractedText = data.text || "";
        serverAnalysis = data.analysis;
      }

      const sanitized = sanitizeUntrustedSampleText(extractedText);
      if (!sanitized || sanitized.replace(/\s+/g, "").length < 20) {
        throw new Error(
          "Fayldan matn ajratib olinmadi yoki fayl bo'sh. Boshqa DOCX/PDF fayl yuklang yoki «Noldan yaratish» rejimidan foydalaning."
        );
      }

      const finalAnalysis =
        serverAnalysis ||
        analyzeSampleDocument({
          rawText: sanitized,
          fileName: safeName,
          fileSize: file.size,
        });

      setAnalysis(finalAnalysis);
      onSampleAnalyzed?.(finalAnalysis);
      // MUHIM (5-bo'lim qoidasi): Generatorga xom matn emas, balki shaxsiy ma'lumotlardan va eski mavzudan
      // tozalangan `structuralBlueprint` uzatiladi!
      onTextExtracted(finalAnalysis.structuralBlueprint, safeName, finalAnalysis);
      setSuccessMessage(
        `«${safeName}» tahlil qilindi: tuzilma olindi, eski shaxsiy ma'lumotlar ajratildi.`
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Faylni o'qishda xatolik yuz berdi. Boshqa fayl yuklang yoki noldan yarating.";
      setErrorMessage(msg);
      setCurrentFileName(null);
      setFileSizeStr(null);
      setAnalysis(null);
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
      void processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      void processFile(files[0]);
    }
  };

  const handleRemove = () => {
    setCurrentFileName(null);
    setFileSizeStr(null);
    setErrorMessage(null);
    setSuccessMessage(null);
    setAnalysis(null);
    if (inputRef.current) inputRef.current.value = "";
    onClear?.();
  };

  const hasIsolatedPii = Boolean(
    analysis &&
      (analysis.isolatedOldMetadata.oldStudentName ||
        analysis.isolatedOldMetadata.oldTeacherName ||
        analysis.isolatedOldMetadata.oldGroup ||
        analysis.isolatedOldMetadata.oldTopic)
  );

  return (
    <div className={cn("w-full space-y-3", className)}>
      <input
        ref={inputRef}
        type="file"
        accept=".docx,.pdf,.txt,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf,text/plain"
        onChange={handleFileChange}
        className="hidden"
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && inputRef.current?.click()}
        className={cn(
          "group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-4 text-center transition-all sm:p-5",
          isDragging
            ? "border-primary bg-primary/10 scale-[0.99]"
            : "border-border/80 bg-surface/30 hover:border-primary/50 hover:bg-surface-elevated/60",
          isProcessing && "pointer-events-none opacity-60"
        )}
      >
        <div className="bg-primary/10 text-primary border-primary/20 mb-2 flex h-10 w-10 items-center justify-center rounded-xl border transition-transform group-hover:scale-105">
          {isProcessing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <UploadCloud className="h-5 w-5" />
          )}
        </div>

        <div className="text-foreground text-xs font-bold sm:text-sm">
          {isProcessing ? "Namuna fayl tuzilmasi tahlil qilinmoqda..." : title}
        </div>
        <p className="text-foreground-muted mt-1 max-w-lg text-[11px] leading-relaxed">
          {description}
        </p>

        <div className="text-foreground-secondary mt-2.5 inline-flex flex-wrap items-center justify-center gap-1.5 text-[10px] font-medium">
          <span className="border-border bg-surface-elevated rounded-md border px-2 py-0.5 font-semibold">
            .DOCX (Word)
          </span>
          <span className="border-border bg-surface-elevated rounded-md border px-2 py-0.5 font-semibold">
            .PDF (Matnli)
          </span>
          <span className="border-border bg-surface-elevated rounded-md border px-2 py-0.5">
            .TXT
          </span>
          <span className="text-foreground-muted">
            • Maksimal hajm: {formatFileSize(maxSizeBytes)}
          </span>
        </div>
      </div>

      {/* Active File Loaded Banner with Replace & Remove buttons */}
      {currentFileName && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-400">
          <div className="flex min-w-0 items-center gap-2">
            <FileText className="h-4 w-4 shrink-0" />
            <span className="truncate font-semibold">{currentFileName}</span>
            {fileSizeStr && (
              <span className="shrink-0 text-[10px] text-emerald-300/80">({fileSizeStr})</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
              className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/20"
              title="Boshqa fayl tanlash"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Almashtirish</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-[11px] font-semibold text-red-300 transition-colors hover:bg-red-500/20"
              title="Faylni olib tashlash"
            >
              <X className="h-3 w-3" />
              <span>O&apos;chirish</span>
            </button>
          </div>
        </div>
      )}

      {/* AI Sample Analysis & PII Isolation Report Card */}
      {showAnalysisCard && analysis && !errorMessage && (
        <div className="border-border bg-surface-elevated/60 space-y-3 rounded-2xl border p-4 text-xs shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/40 pb-2.5">
            <div className="text-foreground flex items-center gap-1.5 font-bold">
              <Sparkles className="text-primary h-4 w-4" />
              <span>Namuna tahlili</span>
            </div>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
              Tuzilma o&apos;rganildi
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="border-border/60 bg-background/60 flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
              <div>
                <span className="text-foreground-muted block text-[10px]">Hujjat turi:</span>
                <span className="text-foreground font-semibold">{analysis.documentType.value}</span>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold",
                  analysis.documentType.status === "Aniqlandi"
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-amber-500/15 text-amber-400"
                )}
              >
                {analysis.documentType.status}
              </span>
            </div>

            <div className="border-border/60 bg-background/60 flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
              <div>
                <span className="text-foreground-muted block text-[10px]">Taxminiy hajm:</span>
                <span className="text-foreground font-semibold">
                  ~{analysis.estimatedPages} bet ({analysis.wordCount.toLocaleString()} so&apos;z)
                </span>
              </div>
              <span className="shrink-0 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                Aniqlandi
              </span>
            </div>

            <div className="border-border/60 bg-background/60 flex items-center justify-between gap-2 rounded-lg border px-3 py-2 sm:col-span-2">
              <div className="min-w-0">
                <span className="text-foreground-muted block text-[10px]">Aniqlangan tuzilma:</span>
                <span className="text-foreground block font-semibold break-words">
                  {analysis.structureSummary}
                </span>
              </div>
              <span className="shrink-0 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                Aniqlandi
              </span>
            </div>

            {analysis.subject.value && (
              <div className="border-border/60 bg-background/60 flex items-center justify-between gap-2 rounded-lg border px-3 py-2 sm:col-span-2">
                <div className="min-w-0">
                  <span className="text-foreground-muted block text-[10px]">Namunadagi fan:</span>
                  <span className="text-foreground block font-semibold break-words">
                    {analysis.subject.value}
                  </span>
                </div>
                <span className="shrink-0 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                  Tekshirish kerak
                </span>
              </div>
            )}
          </div>

          {/* Shaxsiy ma'lumotlarni ajratish haqida ogohlantirish (5-bo'lim talabi) */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[11px] leading-relaxed text-amber-200">
            <div className="mb-1 flex items-center gap-1.5 font-bold text-amber-300">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>Eski shaxsiy ma&apos;lumotlar va eski mavzu bloklandi (Himoyalangan)</span>
            </div>
            <p className="text-amber-100/90">
              Namunadan <strong>faqat tuzilma, boblar iyerarxiyasi va format</strong> olindi.
              {hasIsolatedPii ? (
                <>
                  {" "}
                  Fayl ichidagi eski ma&apos;lumotlar (
                  {[
                    analysis.isolatedOldMetadata.oldStudentName
                      ? `talaba: ${analysis.isolatedOldMetadata.oldStudentName}`
                      : null,
                    analysis.isolatedOldMetadata.oldTeacherName
                      ? `rahbar: ${analysis.isolatedOldMetadata.oldTeacherName}`
                      : null,
                    analysis.isolatedOldMetadata.oldTopic
                      ? `eski mavzu: «${analysis.isolatedOldMetadata.oldTopic.slice(0, 45)}...»`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                  ) yangi hujjatga <strong>ko&apos;chirilmaydi</strong>.
                </>
              ) : (
                " Yangi hujjat faqat siz pastda kiritgan mavzu va ism-familiya asosida yoziladi."
              )}
            </p>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1 break-words">{errorMessage}</div>
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
      {successMessage && !errorMessage && !showAnalysisCard && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-[11px] text-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
          <span className="truncate">{successMessage}</span>
        </div>
      )}
    </div>
  );
}
