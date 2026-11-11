"use client";

import React, { Suspense, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { Sparkles, UploadCloud, Wand2, CheckCircle2, FileImage } from "lucide-react";
import { SecureFileUploadZone } from "@/components/ui/secure-file-upload-zone";
import { ImageTopicParser } from "@/components/academic/image-topic-parser";
import type { ParsedTopic } from "@/lib/academic/topic-parser";
import {
  SampleDocumentAnalysis,
  parseNaturalAcademicRequest,
  ParsedNaturalAcademicPrompt,
} from "@/lib/academic-sample-intelligence";
import { cn } from "@/lib/utils";

export interface CreationModeSelectorProps {
  moduleType: "coursework" | "diplom-bmi" | "referat" | "independent" | "amaliy-ish";
  onSampleBlueprintReady: (
    structuralBlueprint: string,
    fileName: string,
    analysis?: SampleDocumentAnalysis
  ) => void;
  onSampleCleared: () => void;
  onNaturalPromptParsed?: (parsed: ParsedNaturalAcademicPrompt) => void;
  onApplySampleStructureHint?: (hint: { subject?: string; pageCount?: string }) => void;
  onApplyTopicsToForm?: (topics: ParsedTopic[]) => void;
  autoGeneratePerTopicWorks?: boolean;
  defaultPagesPerTopic?: string;
  initialMode?: "scratch" | "sample" | "image";
  subjectHint?: string;
  onWorksGenerated?: (works: ParsedTopic[]) => void;
  galleryInputId?: string;
  accentColor?: "blue" | "emerald" | "amber";
}

function subscribeToUrlMode(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("popstate", callback);
  window.addEventListener("docnova:url-mode-change", callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener("docnova:url-mode-change", callback);
  };
}

export function clearImageModeFromUrl() {
  if (typeof window === "undefined") return;
  try {
    const currentUrl = new URL(window.location.href);
    if (currentUrl.searchParams.get("mode") === "image") {
      currentUrl.searchParams.delete("mode");
      window.history.replaceState(
        null,
        "",
        `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`
      );
    }
  } catch {
    // Ignore history mutation errors in restricted test environments
  }
}

export function UrlImageModeSync() {
  const searchParams = useSearchParams();
  const modeParam = searchParams?.get("mode") ?? null;
  const prevEffectiveModeRef = useRef<"image" | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const windowModeParam = new URLSearchParams(window.location.search).get("mode");
    const effectiveMode: "image" | null =
      modeParam === "image" || windowModeParam === "image" ? "image" : null;
    const prevMode = prevEffectiveModeRef.current;
    prevEffectiveModeRef.current = effectiveMode;
    if (effectiveMode !== "image" && prevMode !== "image") return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        window.dispatchEvent(
          new CustomEvent("docnova:url-mode-change", { detail: { mode: effectiveMode } })
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [modeParam]);

  return null;
}

export function CreationModeSelector({
  moduleType,
  onSampleBlueprintReady,
  onSampleCleared,
  onNaturalPromptParsed,
  onApplySampleStructureHint,
  onApplyTopicsToForm,
  autoGeneratePerTopicWorks = false,
  defaultPagesPerTopic = "2-3",
  initialMode = "scratch",
  subjectHint,
  onWorksGenerated,
  galleryInputId = "image-upload-input",
  accentColor = "blue",
}: CreationModeSelectorProps) {
  const imagePanelRef = useRef<HTMLDivElement>(null);
  const isImageFromUrl = useSyncExternalStore(
    subscribeToUrlMode,
    () =>
      initialMode === "image" ||
      (typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("mode") === "image"),
    () => initialMode === "image"
  );
  const [selectedMode, setSelectedMode] = useState<"scratch" | "sample" | "image" | null>(null);
  const mode = selectedMode ?? (isImageFromUrl ? "image" : initialMode);
  const setMode = (nextMode: "scratch" | "sample" | "image") => {
    setSelectedMode(nextMode);
    if (nextMode !== "image" && typeof window !== "undefined") {
      try {
        const currentUrl = new URL(window.location.href);
        if (currentUrl.searchParams.get("mode") === "image") {
          currentUrl.searchParams.delete("mode");
          window.history.replaceState(
            null,
            "",
            `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`
          );
        }
      } catch {
        // Ignore history mutation errors in restricted test environments
      }
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const scrollToImagePanel = () => {
      window.setTimeout(() => {
        imagePanelRef.current?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
      }, 40);
    };
    const handleOpenImageMode = (event: Event) => {
      const customEvent = event as CustomEvent<{ inputId?: string }>;
      if (!customEvent.detail?.inputId || customEvent.detail.inputId === galleryInputId) {
        setSelectedMode("image");
        scrollToImagePanel();
      }
    };
    const handleUrlModeChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ mode?: string | null }>;
      const nextUrlMode =
        customEvent.detail && "mode" in customEvent.detail
          ? customEvent.detail.mode
          : new URLSearchParams(window.location.search).get("mode");
      if (nextUrlMode === "image") {
        setSelectedMode("image");
        scrollToImagePanel();
      } else {
        setSelectedMode((prev) => (prev === "image" ? null : prev));
      }
    };
    const handlePopState = () => {
      if (new URLSearchParams(window.location.search).get("mode") === "image") {
        setSelectedMode("image");
        scrollToImagePanel();
      } else {
        setSelectedMode((prev) => (prev === "image" ? null : prev));
      }
    };
    window.addEventListener("docnova:open-image-mode", handleOpenImageMode);
    window.addEventListener("docnova:url-mode-change", handleUrlModeChange);
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("docnova:open-image-mode", handleOpenImageMode);
      window.removeEventListener("docnova:url-mode-change", handleUrlModeChange);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [galleryInputId]);
  const [naturalText, setNaturalText] = useState("");
  const [naturalFeedback, setNaturalFeedback] = useState<string | null>(null);
  const [sampleAnalysis, setSampleAnalysis] = useState<SampleDocumentAnalysis | null>(null);

  const placeholderByModule: Record<CreationModeSelectorProps["moduleType"], string> = {
    coursework:
      "Masalan: Menga marketing fanidan raqamli marketing haqida 20 betlik kurs ishi kerak",
    "diplom-bmi":
      "Masalan: Menga bank ishi fanidan tijorat banklarida kredit risklari haqida 70 betlik diplom ishi kerak",
    referat:
      "Masalan: Menga falsafa fanidan yashil energetika istiqbollari haqida 10 betlik referat kerak",
    independent:
      "Masalan: Menga iqtisodiyot fanidan kichik biznesni rivojlantirish haqida 12 betlik mustaqil ish kerak",
    "amaliy-ish":
      "Masalan: Menga statistika fanidan korrelyatsiya tahlili bo'yicha 8 betlik amaliy ish kerak",
  };

  const handleApplyNaturalText = () => {
    if (!naturalText.trim()) return;
    const parsed = parseNaturalAcademicRequest(naturalText);
    onNaturalPromptParsed?.(parsed);

    const appliedParts: string[] = [];
    if (parsed.subject) appliedParts.push(`Fan: «${parsed.subject}»`);
    if (parsed.topic) appliedParts.push(`Mavzu: «${parsed.topic}»`);
    if (parsed.pageCount) appliedParts.push(`Hajm: ${parsed.pageCount} bet`);

    if (appliedParts.length > 0) {
      const missingMsg =
        parsed.missingFields.length > 0
          ? ` Endi pastdan ${parsed.missingFields.includes("topic") ? "mavzuni" : "fan nomini"} tekshirib tasdiqlang.`
          : " Barcha asosiy maydonlar to'ldirildi!";
      setNaturalFeedback(`${appliedParts.join(" • ")}.${missingMsg}`);
    } else {
      setNaturalFeedback("Matn mavzu maydoniga o'tkazildi. Fan nomini tekshirib tasdiqlang.");
    }
  };

  const activeBorder =
    accentColor === "emerald"
      ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
      : accentColor === "amber"
        ? "border-amber-500 bg-amber-500/10 text-amber-300"
        : "border-primary bg-primary/10 text-primary";

  return (
    <div className="space-y-3">
      <Suspense fallback={null}>
        <UrlImageModeSync />
      </Suspense>
      {/* Ikki xil hujjat yaratish yo'li tanlovi (3-bo'lim talabi) */}
      <div>
        <label className="text-foreground-secondary mb-1.5 block text-xs font-bold">
          Yaratish usulini tanlang
        </label>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => setMode("scratch")}
            className={cn(
              "flex min-h-[52px] cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition-all",
              mode === "scratch"
                ? activeBorder
                : "border-border bg-surface-elevated/40 text-foreground-secondary hover:text-foreground"
            )}
          >
            <div className="bg-background/80 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-current/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-foreground text-xs font-bold sm:text-sm">Noldan yaratish</div>
              <div className="text-foreground-muted truncate text-[11px]">
                Mavzu va fan bo&apos;yicha tezkor AI generatsiya
              </div>
            </div>
          </button>

          <label
            htmlFor={galleryInputId}
            role="button"
            tabIndex={0}
            onClick={() => {
              setMode("image");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setMode("image");
                const galleryInput = document.getElementById(
                  galleryInputId
                ) as HTMLInputElement | null;
                galleryInput?.click();
              }
            }}
            className={cn(
              "flex min-h-[52px] cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition-all",
              mode === "image"
                ? activeBorder
                : "border-border bg-surface-elevated/40 text-foreground-secondary hover:text-foreground"
            )}
          >
            <div className="bg-background/80 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-current/20">
              <FileImage className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-foreground text-xs font-bold sm:text-sm">Rasm tashlash</div>
              <div className="text-foreground-muted truncate text-[11px]">
                Galereyadan rasm tashlash
              </div>
            </div>
          </label>

          <button
            type="button"
            onClick={() => setMode("sample")}
            className={cn(
              "flex min-h-[52px] cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition-all",
              mode === "sample"
                ? activeBorder
                : "border-border bg-surface-elevated/40 text-foreground-secondary hover:text-foreground"
            )}
          >
            <div className="bg-background/80 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-current/20">
              <UploadCloud className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-foreground text-xs font-bold sm:text-sm">
                Namuna fayl (DOCX / PDF)
              </div>
              <div className="text-foreground-muted truncate text-[11px]">
                Word / PDF tuzilmasini o&apos;rganib yangi ish yozish
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* B. Noldan yaratish: Oddiy tilda so'rov yozish yordamchisi */}
      {mode === "scratch" && onNaturalPromptParsed && (
        <div className="border-border/70 bg-surface-elevated/30 space-y-2 rounded-xl border p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-foreground-secondary flex items-center gap-1.5 text-[11px] font-semibold">
              <Wand2 className="text-primary h-3.5 w-3.5 shrink-0" />
              <span>
                Oddiy tilda yozing (ixtiyoriy — tizim fan, mavzu va hajmni o&apos;zi ajratadi):
              </span>
            </span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={naturalText}
              onChange={(e) => setNaturalText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleApplyNaturalText();
                }
              }}
              placeholder={placeholderByModule[moduleType]}
              className="border-border bg-background text-foreground min-h-[40px] flex-1 rounded-lg border px-3 py-1.5 text-base focus:outline-none sm:text-xs"
            />
            <button
              type="button"
              onClick={handleApplyNaturalText}
              className="border-border bg-surface-elevated text-foreground hover:bg-border/60 min-h-[40px] shrink-0 cursor-pointer rounded-lg border px-3.5 py-1.5 text-xs font-bold transition-colors"
            >
              Shaklga to&apos;ldirish
            </button>
          </div>
          {naturalFeedback && (
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>{naturalFeedback}</span>
            </div>
          )}
        </div>
      )}

      {/* A. Namuna faylim bor: Hujjat yuklash va AI tahlili */}
      {mode === "sample" && (
        <div className="border-border/80 bg-surface-elevated/40 space-y-2.5 rounded-xl border p-3.5">
          <div className="border-primary/20 bg-primary/5 rounded-lg border px-3 py-2 text-[11px] leading-relaxed">
            <strong className="text-foreground">Eslatma:</strong> Namuna fayl hujjatning tuzilishi
            va formatini tushunish uchun ishlatiladi. Yangi hujjat siz tasdiqlagan mavzu va
            ma&apos;lumotlar asosida tayyorlanadi.
          </div>

          <SecureFileUploadZone
            onTextExtracted={(blueprint, fileName, analysis) => {
              setSampleAnalysis(analysis || null);
              onSampleBlueprintReady(blueprint, fileName, analysis);
            }}
            onClear={() => {
              setSampleAnalysis(null);
              onSampleCleared();
            }}
            title="Namuna faylni tanlang yoki shu yerga tashlang (.DOCX, .PDF, .TXT)"
            description="Maksimal 10 MB. Namunadagi eski ism-familiya va eski mavzu yangi hujjatga avtomatik ko'chirilmaydi."
          />

          {/* Agar namunadan fan yoki sahifa soni topilgan bo'lsa, foydalanuvchi xohlasa 1 klikda tasdiqlashi mumkin */}
          {sampleAnalysis &&
            onApplySampleStructureHint &&
            (sampleAnalysis.subject.value || sampleAnalysis.estimatedPages > 3) && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-700/50 bg-slate-900/40 px-3 py-2 text-[11px]">
                <span className="text-foreground-secondary">
                  Namunadagi hajm (~{sampleAnalysis.estimatedPages} bet)
                  {sampleAnalysis.subject.value
                    ? ` va fanni («${sampleAnalysis.subject.value}»)`
                    : ""}{" "}
                  shaklga qo&apos;llashni xohlaysizmi?
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onApplySampleStructureHint({
                      subject: sampleAnalysis.subject.value || undefined,
                      pageCount: String(sampleAnalysis.estimatedPages),
                    })
                  }
                  className="text-primary hover:bg-primary/10 shrink-0 cursor-pointer rounded-md border border-current/30 px-2.5 py-1 text-[11px] font-bold transition-colors"
                >
                  Hajm va fanni qo&apos;llash
                </button>
              </div>
            )}
        </div>
      )}

      {/* Mobil va tez rasm tashlash tugmasi (.DOCX/.PDF/.TXT yoki noldan yaratish bo'limi ostida) */}
      {mode !== "image" && (
        <div className="flex flex-col gap-3 rounded-xl border border-sky-500/30 bg-sky-500/5 p-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5 text-left">
            <p className="text-foreground text-xs font-bold sm:text-sm">
              Mavzular rasm ko&apos;rinishida bormi?
            </p>
            <p className="text-foreground-muted text-[11px] leading-relaxed">
              Telefon galereyasidan rasm tashlang — har bir mavzuga nechta bet yozishni
              o&apos;zingiz tanlaysiz.
            </p>
          </div>
          <label
            htmlFor={galleryInputId}
            role="button"
            tabIndex={0}
            onClick={() => {
              setMode("image");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setMode("image");
                const galleryInput = document.getElementById(
                  galleryInputId
                ) as HTMLInputElement | null;
                galleryInput?.click();
              }
            }}
            className="inline-flex min-h-[44px] w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-sky-600 active:scale-[0.99] sm:w-auto"
          >
            <FileImage className="h-4 w-4 shrink-0" />
            <span>Rasm tashlash</span>
          </label>
        </div>
      )}

      {/* D. Rasm orqali avtomatik mavzular va sahifalar qo'shish (sr-only display:none siz DOM da doim tayyor turadi) */}
      <div
        ref={imagePanelRef}
        className={mode === "image" ? "block" : "sr-only"}
        aria-hidden={mode !== "image"}
      >
        <ImageTopicParser
          workType={moduleType === "independent" ? "independent" : moduleType}
          accentColor={accentColor}
          fileInputId={galleryInputId}
          autoGeneratePerTopicWorks={autoGeneratePerTopicWorks}
          defaultPagesPerTopic={defaultPagesPerTopic}
          subjectHint={subjectHint}
          onImageSelected={() => {
            setMode("image");
            imagePanelRef.current?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
          }}
          onApplyTopicsToForm={onApplyTopicsToForm}
          onWorksGenerated={onWorksGenerated}
          compact
        />
      </div>
    </div>
  );
}
