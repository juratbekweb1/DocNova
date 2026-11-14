"use client";

import React, { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertCircle,
  Camera,
  Check,
  CheckCircle2,
  Copy,
  Database,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileImage,
  FolderOpen,
  Loader2,
  LogIn,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { downloadAcademicDocx } from "@/lib/docx-download-client";
import { normalizePageCountInput, type ParsedTopic } from "@/lib/academic/topic-parser";
import type { AcademicLanguage } from "@/lib/academic/topic-fidelity";

export interface EditableTopicBlock extends ParsedTopic {
  id: string;
  originalNotes?: string;
  hasGeneratedWork?: boolean;
  usedFallback?: boolean;
}

const DEFAULT_PAGE_PRESETS = ["2-3", "3-4", "5", "8", "10", "15", "20", "30"] as const;

function getWorkTypeLabels(workType: NonNullable<ImageTopicParserProps["workType"]>) {
  switch (workType) {
    case "referat":
      return { apiLabel: "Referat", display: "Referat", lower: "referat" };
    case "coursework":
      return { apiLabel: "Kurs ishi", display: "Kurs ishi", lower: "kurs ishi" };
    case "diplom-bmi":
      return { apiLabel: "Diplom ishi", display: "Diplom ishi", lower: "diplom ishi" };
    case "amaliy-ish":
      return { apiLabel: "Amaliy ish", display: "Amaliy ish", lower: "amaliy ish" };
    case "essay":
      return { apiLabel: "Akademik insho", display: "Akademik insho", lower: "akademik insho" };
    case "presentation":
      return {
        apiLabel: "Prezentatsiya matni",
        display: "Prezentatsiya matni",
        lower: "prezentatsiya matni",
      };
    case "independent":
    case "general":
    default:
      return { apiLabel: "Mustaqil ish", display: "Mustaqil ish", lower: "mustaqil ish" };
  }
}

export interface ImageTopicParserProps {
  workType?:
    | "general"
    | "referat"
    | "independent"
    | "coursework"
    | "diplom-bmi"
    | "presentation"
    | "amaliy-ish"
    | "essay";
  accentColor?: "blue" | "emerald" | "amber";
  onApplyTopicsToForm?: (topics: ParsedTopic[]) => void;
  onWorksGenerated?: (works: ParsedTopic[]) => void;
  onImageMetadataDetected?: (meta: { subject?: string; language?: AcademicLanguage }) => void;
  onImageSelected?: () => void;
  onImageFileSelected?: (base64OrDataUrl: string, fileName?: string) => void;
  onImageCleared?: () => void;
  autoGeneratePerTopicWorks?: boolean;
  defaultPagesPerTopic?: string;
  subjectHint?: string;
  fileInputId?: string;
  compact?: boolean;
}

interface SaveResultState {
  documentId: string;
  title: string;
  sectionCount: number;
  editorUrl: string;
}

const DRAFT_STORAGE_KEY = "docnova_academic_image_topics_draft_v1";
const MAX_RAW_UPLOAD_BYTES = 15 * 1024 * 1024;
const COMPRESS_THRESHOLD_BYTES = 1 * 1024 * 1024;
const SAFE_BASE64_DATAURL_MAX_CHARS = 2_800_000;
const HARD_VERCEL_BASE64_MAX_CHARS = 4_100_000;
const WORK_CHUNK_SIZE = 4;

function createBlockId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `topic-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Rasm faylini o'qib bo'lmadi"));
      }
    };
    reader.onerror = () => {
      reject(new Error("Rasm faylini o'qishda xatolik yuz berdi"));
    };
    reader.readAsDataURL(file);
  });
}

async function maybeCompressLargeImageDataUrl(
  dataUrl: string,
  fileSize: number,
  mimeType: string
): Promise<{ dataUrl: string; mimeType: string }> {
  const cleanMime = mimeType.trim().toLowerCase();
  const isDirectlySupported =
    cleanMime === "image/jpeg" ||
    cleanMime === "image/jpg" ||
    cleanMime === "image/png" ||
    cleanMime === "image/webp" ||
    cleanMime === "image/gif" ||
    cleanMime === "image/heic" ||
    cleanMime === "image/heif";

  if (
    (fileSize <= COMPRESS_THRESHOLD_BYTES && isDirectlySupported) ||
    typeof window === "undefined" ||
    typeof document === "undefined" ||
    cleanMime === "image/gif"
  ) {
    return { dataUrl, mimeType };
  }

  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      try {
        const srcWidth = img.width;
        const srcHeight = img.height;
        if (srcWidth <= 0 || srcHeight <= 0) {
          resolve({ dataUrl, mimeType });
          return;
        }

        const encodeSteps: Array<{ maxSide: number; quality: number }> = [
          { maxSide: 2048, quality: 0.86 },
          { maxSide: 1800, quality: 0.74 },
          { maxSide: 1440, quality: 0.62 },
          { maxSide: 1080, quality: 0.52 },
        ];

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({ dataUrl, mimeType });
          return;
        }

        let bestEncoded = dataUrl;
        for (const step of encodeSteps) {
          let width = srcWidth;
          let height = srcHeight;
          if (width > step.maxSide || height > step.maxSide) {
            if (width >= height) {
              height = Math.round((height * step.maxSide) / width);
              width = step.maxSide;
            } else {
              width = Math.round((width * step.maxSide) / height);
              height = step.maxSide;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          const candidate = canvas.toDataURL("image/jpeg", step.quality);
          if (candidate.startsWith("data:image/")) {
            bestEncoded = candidate;
            if (candidate.length <= SAFE_BASE64_DATAURL_MAX_CHARS) {
              resolve({ dataUrl: candidate, mimeType: "image/jpeg" });
              return;
            }
          }
        }

        resolve(
          bestEncoded.startsWith("data:image/") && bestEncoded !== dataUrl
            ? { dataUrl: bestEncoded, mimeType: "image/jpeg" }
            : { dataUrl, mimeType }
        );
      } catch {
        resolve({ dataUrl, mimeType });
      }
    };
    img.onerror = () => resolve({ dataUrl, mimeType });
    img.src = dataUrl;
  });
}

const emptySubscribe = () => () => {};
const getIsAndroidClient = () =>
  typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);
const getIsAndroidServer = () => false;

export function ImageTopicParser({
  workType = "general",
  accentColor = "blue",
  onApplyTopicsToForm,
  onWorksGenerated,
  onImageMetadataDetected,
  onImageSelected,
  onImageFileSelected,
  onImageCleared,
  autoGeneratePerTopicWorks = false,
  defaultPagesPerTopic = "2-3",
  subjectHint,
  fileInputId = "image-upload-input",
  compact = false,
}: ImageTopicParserProps) {
  const inputId = useId();
  const isAndroidClient = useSyncExternalStore(
    emptySubscribe,
    getIsAndroidClient,
    getIsAndroidServer
  );
  const pathname = usePathname() || "/academic/image-topics";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewSectionRef = useRef<HTMLDivElement>(null);
  const workLabels = getWorkTypeLabels(workType);

  const normalizedInitialPages = normalizePageCountInput(defaultPagesPerTopic) ?? "2-3";
  const [topics, setTopics] = useState<EditableTopicBlock[]>([]);
  const [documentTitle, setDocumentTitle] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isWritingWorks, setIsWritingWorks] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [autoWriteWorks, setAutoWriteWorks] = useState<boolean>(autoGeneratePerTopicWorks);
  const [pagesPerTopic, setPagesPerTopic] = useState<string>(normalizedInitialPages);
  const [customPagesInput, setCustomPagesInput] = useState<string>(
    DEFAULT_PAGE_PRESETS.includes(normalizedInitialPages as (typeof DEFAULT_PAGE_PRESETS)[number])
      ? ""
      : normalizedInitialPages
  );
  const [topicPageDrafts, setTopicPageDrafts] = useState<Record<string, string>>({});
  const [customPageTopics, setCustomPageTopics] = useState<Record<string, boolean>>({});
  const [worksReadyCount, setWorksReadyCount] = useState<number | null>(null);
  const [worksReadyPagesLabel, setWorksReadyPagesLabel] = useState<string | null>(null);
  const [detectedSubject, setDetectedSubject] = useState<string>("");
  const [detectedLanguage, setDetectedLanguage] = useState<AcademicLanguage | undefined>(undefined);
  const [generationProgress, setGenerationProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [fallbackWarningCount, setFallbackWarningCount] = useState<number>(0);
  const [retryingTopicId, setRetryingTopicId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [requiresLogin, setRequiresLogin] = useState<boolean>(false);
  const [loginCallbackUrl, setLoginCallbackUrl] = useState<string>(pathname);
  const [saveSuccess, setSaveSuccess] = useState<SaveResultState | null>(null);
  const [appliedToForm, setAppliedToForm] = useState<boolean>(false);
  const [showInlinePreview, setShowInlinePreview] = useState<boolean>(false);
  const [isExportingDocx, setIsExportingDocx] = useState<boolean>(false);
  const [copiedWorks, setCopiedWorks] = useState<boolean>(false);

  // Restore unsaved draft asynchronously after hydration when returning from login
  useEffect(() => {
    if (typeof window === "undefined") return;
    const timerId = window.setTimeout(() => {
      try {
        const saved = window.sessionStorage.getItem(DRAFT_STORAGE_KEY);
        if (!saved) return;
        const parsed = JSON.parse(saved) as {
          topics?: EditableTopicBlock[];
          documentTitle?: string;
          fileName?: string | null;
          pagesPerTopic?: string;
          customPagesInput?: string;
        };
        if (Array.isArray(parsed.topics) && parsed.topics.length > 0) {
          setTopics(parsed.topics);
          if (typeof parsed.documentTitle === "string") {
            setDocumentTitle(parsed.documentTitle);
          }
          if (typeof parsed.fileName === "string") {
            setFileName(parsed.fileName);
          }
          if (typeof parsed.pagesPerTopic === "string") {
            const normalizedSavedPages = normalizePageCountInput(parsed.pagesPerTopic);
            if (normalizedSavedPages) {
              setPagesPerTopic(normalizedSavedPages);
            }
          }
          if (typeof parsed.customPagesInput === "string") {
            setCustomPagesInput(parsed.customPagesInput);
          }
          window.sessionStorage.removeItem(DRAFT_STORAGE_KEY);
        }
      } catch {
        // Ignore corrupt session draft
      }
    }, 0);
    return () => window.clearTimeout(timerId);
  }, []);

  const accentClasses =
    accentColor === "emerald"
      ? {
          ring: "border-emerald-500/40 bg-emerald-500/5",
          badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
          btn: "bg-emerald-600 hover:bg-emerald-700 text-white",
          focus: "focus:border-emerald-500 focus:ring-emerald-500/20",
        }
      : accentColor === "amber"
        ? {
            ring: "border-amber-500/40 bg-amber-500/5",
            badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
            btn: "bg-amber-600 hover:bg-amber-700 text-white",
            focus: "focus:border-amber-500 focus:ring-amber-500/20",
          }
        : {
            ring: "border-sky-500/40 bg-sky-500/5",
            badge: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
            btn: "bg-sky-600 hover:bg-sky-700 text-white",
            focus: "focus:border-sky-500 focus:ring-sky-500/20",
          };

  const processSelectedFile = async (file: File, inputEl?: HTMLInputElement | null) => {
    setErrorMessage(null);
    setRequiresLogin(false);
    setSaveSuccess(null);

    const hasExplicitNonImageExt =
      /\.[a-z0-9]{2,6}$/i.test(file.name) &&
      !/\.(jpe?g|png|webp|gif|heic|heif|bmp|avif)$/i.test(file.name);
    const isImageFile =
      file.type.startsWith("image/") ||
      /\.(jpe?g|png|webp|gif|heic|heif|bmp|avif)$/i.test(file.name) ||
      ((!file.type || file.type === "application/octet-stream") && !hasExplicitNonImageExt);
    if (!isImageFile) {
      setErrorMessage(
        "Faqat galereyadan rasm fayllari (JPG, PNG, WEBP, HEIC, GIF) tanlanishi mumkin."
      );
      if (inputEl) inputEl.value = "";
      return;
    }

    if (file.size > MAX_RAW_UPLOAD_BYTES) {
      setErrorMessage("Rasm hajmi 15 MB dan oshmasligi kerak.");
      if (inputEl) inputEl.value = "";
      return;
    }

    onImageSelected?.();
    setIsAnalyzing(true);
    setFileName(file.name);

    try {
      const rawDataUrl = await readFileAsDataUrl(file);
      const optimized = await maybeCompressLargeImageDataUrl(
        rawDataUrl,
        file.size,
        file.type || "image/jpeg"
      );
      if (optimized.dataUrl.length > HARD_VERCEL_BASE64_MAX_CHARS) {
        throw new Error(
          "Tanlangan rasm hajmi juda katta (4.5 MB chegarasidan oshdi). Iltimos rasmni skrinshot qilib yoki kichikroq JPEG/PNG ko'rinishida yuklang."
        );
      }
      setPreviewUrl(optimized.dataUrl);
      onImageFileSelected?.(optimized.dataUrl, file.name);

      const controller = new AbortController();
      const abortTimer = window.setTimeout(() => controller.abort(), 52_000);
      let response: Response;
      try {
        response = await fetch("/api/parse-topics", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          signal: controller.signal,
          body: JSON.stringify({
            image: optimized.dataUrl,
            mimeType: optimized.mimeType,
            fileName: file.name,
          }),
        });
      } catch (networkErr) {
        if (networkErr instanceof DOMException && networkErr.name === "AbortError") {
          throw new Error(
            "Rasmni tahlil qilish vaqti tugadi. Iltimos internet aloqasini tekshirib, qayta urinib ko'ring."
          );
        }
        throw new Error(
          "Server bilan aloqa uzildi yoki internet sekinlashdi. Iltimos qayta urinib ko'ring."
        );
      } finally {
        window.clearTimeout(abortTimer);
      }

      const data = (await response.json().catch(() => ({}))) as {
        topics?: ParsedTopic[];
        subject?: string;
        language?: AcademicLanguage;
        error?: string;
      };

      if (!response.ok) {
        if (response.status === 413) {
          throw new Error(
            "Rasm hajmi juda katta (4.5 MB chegarasidan oshdi). Iltimos kichikroq rasm yuklang."
          );
        }
        throw new Error(data.error || "Rasmni tahlil qilishda xatolik yuz berdi.");
      }

      const extracted = Array.isArray(data.topics) ? data.topics : [];
      if (extracted.length === 0) {
        setTopics([]);
        setErrorMessage(
          "Rasmda o'qiladigan mavzular topilmadi. Iltimos yozuvlari aniqroq ko'ringan rasm yuklang."
        );
        return;
      }

      const cleanSubject = typeof data.subject === "string" ? data.subject.trim() : "";
      const cleanLang = data.language;
      setDetectedSubject(cleanSubject);
      setDetectedLanguage(cleanLang);
      if (cleanSubject || cleanLang) {
        onImageMetadataDetected?.({
          ...(cleanSubject ? { subject: cleanSubject } : {}),
          ...(cleanLang ? { language: cleanLang } : {}),
        });
      }

      const mappedBlocks: EditableTopicBlock[] = extracted.map((item) => ({
        id: createBlockId(),
        title: item.title ?? "",
        content: item.content ?? "",
        originalNotes: item.content ?? "",
        hasGeneratedWork: false,
        usedFallback: false,
      }));

      setTopics(mappedBlocks);
      setTopicPageDrafts({});
      setCustomPageTopics({});
      setShowInlinePreview(false);
      setAppliedToForm(false);
      setCopiedWorks(false);
      setWorksReadyCount(null);
      setWorksReadyPagesLabel(null);
      setFallbackWarningCount(0);
      setGenerationProgress(null);
      setDocumentTitle(
        mappedBlocks.length === 1
          ? mappedBlocks[0].title
          : `${mappedBlocks[0].title} (${mappedBlocks.length} ta mavzu)`
      );

      if (autoWriteWorks) {
        setIsAnalyzing(false);
        await generateWorksForTopics(mappedBlocks);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Rasmni tahlil qilishda kutilmagan xatolik yuz berdi."
      );
    } finally {
      setIsAnalyzing(false);
      // Reset input value after reading completes so mobile WebViews never lose the File handle
      if (inputEl) {
        inputEl.value = "";
      }
    }
  };

  const getEffectivePagesLabel = (blocks: EditableTopicBlock[]): string | null => {
    const valid = blocks.filter((b) => b.title.trim().length > 0);
    if (valid.length === 0) return pagesPerTopic;
    const distinct = new Set(valid.map((b) => b.pageCount || pagesPerTopic));
    if (distinct.size === 1) {
      return Array.from(distinct)[0] || pagesPerTopic;
    }
    return null;
  };

  const generateWorksForTopics = async (sourceBlocks: EditableTopicBlock[]) => {
    const validBlocks = sourceBlocks
      .map((block) => {
        // Use preserved originalNotes during regeneration so prior generated prose does not pollute prompts
        const promptNotes = block.hasGeneratedWork
          ? (block.originalNotes ?? "").trim()
          : block.content.trim();
        return {
          ...block,
          title: block.title.trim(),
          content: promptNotes,
          originalNotes: block.hasGeneratedWork
            ? (block.originalNotes ?? "")
            : block.content.trim(),
          pageCount: block.pageCount ? normalizePageCountInput(block.pageCount) : undefined,
        };
      })
      .filter((block) => block.title.length > 0);

    if (validBlocks.length === 0) {
      setErrorMessage(
        `${workLabels.display} yozish uchun kamida bitta mavzu sarlavhasi bo'lishi kerak.`
      );
      return;
    }

    setErrorMessage(null);
    setWorksReadyCount(null);
    setWorksReadyPagesLabel(null);
    setFallbackWarningCount(0);
    setGenerationProgress({ done: 0, total: validBlocks.length });
    setIsWritingWorks(true);

    const normalizedGlobalPages = normalizePageCountInput(pagesPerTopic) ?? "2-3";
    const resolvedUniformPages = getEffectivePagesLabel(validBlocks);
    const resolvedSubject = subjectHint?.trim() || detectedSubject || undefined;
    const resolvedLanguage = detectedLanguage || "auto";

    try {
      const updatedBlocks: EditableTopicBlock[] = [];
      let totalFallbackCount = 0;

      for (let start = 0; start < validBlocks.length; start += WORK_CHUNK_SIZE) {
        const chunk = validBlocks.slice(start, start + WORK_CHUNK_SIZE);
        const response = await fetch("/api/academic/topics/generate-works", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topics: chunk.map(({ title, content, pageCount }) => ({
              title,
              content,
              ...(pageCount ? { pageCount } : {}),
            })),
            workType: workLabels.apiLabel,
            ...(resolvedSubject ? { subject: resolvedSubject } : {}),
            pagesPerTopic: normalizedGlobalPages,
            language: resolvedLanguage,
          }),
        });

        const data = (await response.json().catch(() => ({}))) as {
          works?: ParsedTopic[];
          pageCounts?: string[];
          fallbackIndices?: number[];
          usedFallbackCount?: number;
          error?: string;
        };

        if (!response.ok || !Array.isArray(data.works)) {
          throw new Error(
            data.error || `Har bir mavzuga ${workLabels.lower} yozishda xatolik yuz berdi.`
          );
        }

        const chunkFallbacks = new Set<number>(
          Array.isArray(data.fallbackIndices) ? data.fallbackIndices : []
        );

        data.works.forEach((work, chunkIdx) => {
          const src = chunk[chunkIdx];
          const usedFallback = chunkFallbacks.has(chunkIdx);
          if (usedFallback) totalFallbackCount += 1;
          updatedBlocks.push({
            id: src?.id || createBlockId(),
            title: work.title,
            content: work.content,
            originalNotes: src?.originalNotes ?? "",
            hasGeneratedWork: true,
            usedFallback,
            pageCount: src?.pageCount || data.pageCounts?.[chunkIdx],
          });
        });

        setGenerationProgress({
          done: Math.min(validBlocks.length, start + chunk.length),
          total: validBlocks.length,
        });
      }

      setTopics(updatedBlocks);
      setWorksReadyCount(updatedBlocks.length);
      setWorksReadyPagesLabel(resolvedUniformPages);
      setFallbackWarningCount(totalFallbackCount);
      setCopiedWorks(false);
      if (!onWorksGenerated) {
        setShowInlinePreview(true);
        if (typeof window !== "undefined") {
          window.setTimeout(() => {
            previewSectionRef.current?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
          }, 80);
        }
      }
      onWorksGenerated?.(
        updatedBlocks.map(({ title, content, pageCount }) => ({
          title: title.trim(),
          content: content.trim(),
          ...(pageCount ? { pageCount } : {}),
        }))
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : `Har bir mavzuga ${pagesPerTopic} bet ${workLabels.lower} yozishda xatolik yuz berdi.`
      );
    } finally {
      setIsWritingWorks(false);
      setGenerationProgress(null);
    }
  };

  const handleRetrySingleTopic = async (blockId: string) => {
    const targetIndex = topics.findIndex((t) => t.id === blockId);
    if (targetIndex === -1 || isWritingWorks || isAnalyzing || retryingTopicId) return;
    const targetBlock = topics[targetIndex];
    const cleanTitle = targetBlock.title.trim();
    if (!cleanTitle) return;

    setErrorMessage(null);
    setRetryingTopicId(blockId);
    const normalizedGlobalPages = normalizePageCountInput(pagesPerTopic) ?? "2-3";
    const resolvedSubject = subjectHint?.trim() || detectedSubject || undefined;
    const promptNotes = targetBlock.hasGeneratedWork
      ? (targetBlock.originalNotes ?? "").trim()
      : targetBlock.content.trim();

    try {
      const response = await fetch("/api/academic/topics/generate-works", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topics: [
            {
              title: cleanTitle,
              content: promptNotes,
              ...(targetBlock.pageCount ? { pageCount: targetBlock.pageCount } : {}),
            },
          ],
          workType: workLabels.apiLabel,
          ...(resolvedSubject ? { subject: resolvedSubject } : {}),
          pagesPerTopic: targetBlock.pageCount || normalizedGlobalPages,
          language: detectedLanguage || "auto",
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        works?: ParsedTopic[];
        fallbackIndices?: number[];
        error?: string;
      };
      if (!response.ok || !Array.isArray(data.works) || data.works.length === 0) {
        throw new Error(data.error || "Mavzuni qayta yozishda xatolik yuz berdi.");
      }

      const regenerated = data.works[0];
      const stillFallback = Array.isArray(data.fallbackIndices) && data.fallbackIndices.includes(0);
      const nextTopics = topics.map((b) =>
        b.id === blockId
          ? {
              ...b,
              title: regenerated.title,
              content: regenerated.content,
              hasGeneratedWork: true,
              usedFallback: stillFallback,
            }
          : b
      );
      setTopics(nextTopics);
      setFallbackWarningCount(nextTopics.filter((b) => b.usedFallback).length);
      onWorksGenerated?.(
        nextTopics.map(({ title, content, pageCount }) => ({
          title: title.trim(),
          content: content.trim(),
          ...(pageCount ? { pageCount } : {}),
        }))
      );
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Mavzuni qayta yozishda xatolik yuz berdi."
      );
    } finally {
      setRetryingTopicId(null);
    }
  };

  const openGalleryPicker = () => {
    if (isAnalyzing || isSaving || isWritingWorks) return;
    const inputEl =
      (document.getElementById(fileInputId) as HTMLInputElement | null) ?? fileInputRef.current;
    inputEl?.click();
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const targetInput = event.currentTarget;
    const file = targetInput.files?.[0];
    if (file) {
      void processSelectedFile(file, targetInput);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      void processSelectedFile(file);
    }
  };

  const handleTopicFieldChange = (id: string, field: "title" | "content", value: string) => {
    setSaveSuccess(null);
    setAppliedToForm(false);
    setTopics((prev) =>
      prev.map((block) => {
        if (block.id !== id) return block;
        if (field === "content" && !block.hasGeneratedWork) {
          return { ...block, content: value, originalNotes: value };
        }
        return { ...block, [field]: value };
      })
    );
  };

  const handleTopicPageCountChange = (id: string, rawValue: string) => {
    setSaveSuccess(null);
    setAppliedToForm(false);
    setWorksReadyCount(null);
    const normalized = rawValue.trim() ? normalizePageCountInput(rawValue) : undefined;
    setTopics((prev) =>
      prev.map((block) => (block.id === id ? { ...block, pageCount: normalized } : block))
    );
  };

  const handleSelectGlobalPreset = (preset: string) => {
    setPagesPerTopic(preset);
    setCustomPagesInput("");
    setWorksReadyCount(null);
  };

  const handleCustomGlobalPagesChange = (raw: string) => {
    setWorksReadyCount(null);
    const trimmed = raw.trim();
    if (!trimmed) {
      setCustomPagesInput("");
      return;
    }
    const parsed = parseInt(trimmed, 10);
    if (!Number.isNaN(parsed)) {
      const clamped = Math.min(100, Math.max(1, parsed));
      const clampedStr = String(clamped);
      setCustomPagesInput(clampedStr);
      setPagesPerTopic(clampedStr);
    }
  };

  const handleRemoveTopic = (id: string) => {
    setSaveSuccess(null);
    setAppliedToForm(false);
    setTopics((prev) => prev.filter((block) => block.id !== id));
    setTopicPageDrafts((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setCustomPageTopics((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleAddEmptyTopic = () => {
    setSaveSuccess(null);
    setAppliedToForm(false);
    setTopics((prev) => [
      ...prev,
      {
        id: createBlockId(),
        title: `${prev.length + 1}-mavzu`,
        content: "",
      },
    ]);
  };

  const handleReset = () => {
    setTopics([]);
    setDocumentTitle("");
    setPreviewUrl(null);
    setFileName(null);
    setErrorMessage(null);
    setRequiresLogin(false);
    setLoginCallbackUrl(pathname);
    setSaveSuccess(null);
    setAppliedToForm(false);
    setWorksReadyCount(null);
    setWorksReadyPagesLabel(null);
    setDetectedSubject("");
    setDetectedLanguage(undefined);
    setGenerationProgress(null);
    setFallbackWarningCount(0);
    setRetryingTopicId(null);
    setShowInlinePreview(false);
    setCopiedWorks(false);
    setTopicPageDrafts({});
    setCustomPageTopics({});
    onImageCleared?.();
  };

  const handleSaveAllTopics = async () => {
    setErrorMessage(null);
    setRequiresLogin(false);
    setSaveSuccess(null);

    const hasGlobalPageOverride = pagesPerTopic !== normalizedInitialPages;
    const sanitizedTopics = topics
      .map((t) => {
        const resolvedPageCount =
          t.pageCount || (hasGlobalPageOverride ? pagesPerTopic : undefined);
        return {
          title: t.title.trim(),
          content: t.content.trim(),
          ...(resolvedPageCount ? { pageCount: resolvedPageCount } : {}),
        };
      })
      .filter((t) => t.title.length > 0 || t.content.length > 0);

    if (sanitizedTopics.length === 0) {
      setErrorMessage("Saqlash uchun kamida bitta mavzu sarlavhasini kiriting.");
      return;
    }

    const hasBlankTitle = sanitizedTopics.some((t) => !t.title);
    if (hasBlankTitle) {
      setErrorMessage("Har bir mavzu blokining sarlavhasi to'ldirilishi shart.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/academic/topics/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentTitle: documentTitle.trim() || undefined,
          sourceFileName: fileName || undefined,
          ...(hasGlobalPageOverride ? { pagesPerTopic } : {}),
          workType,
          topics: sanitizedTopics,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        requireLogin?: boolean;
        error?: string;
        documentId?: string;
        title?: string;
        sectionCount?: number;
        editorUrl?: string;
      };

      if (response.status === 401 || data.requireLogin) {
        setRequiresLogin(true);
        if (typeof window !== "undefined") {
          setLoginCallbackUrl(
            `${window.location.pathname || pathname}${window.location.search || ""}`
          );
          try {
            window.sessionStorage.setItem(
              DRAFT_STORAGE_KEY,
              JSON.stringify({
                topics,
                documentTitle,
                fileName,
                pagesPerTopic,
                customPagesInput,
              })
            );
          } catch {
            // Ignore storage quota errors
          }
        }
        setErrorMessage(
          data.error ||
            "Mavzularni bazaga saqlash uchun tizimga kiring. Tahrirlangan mavzularingiz saqlab qolindi."
        );
        return;
      }

      if (!response.ok || !data.documentId) {
        throw new Error(data.error || "Mavzularni bazaga saqlashda xatolik yuz berdi.");
      }

      setSaveSuccess({
        documentId: data.documentId,
        title: data.title || documentTitle || "Akademik mavzular",
        sectionCount: data.sectionCount ?? sanitizedTopics.length,
        editorUrl: data.editorUrl || `/dashboard/editor/${data.documentId}`,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Bazaga saqlash vaqtida kutilmagan xatolik yuz berdi."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const buildCombinedWorksMarkdown = () => {
    const valid = topics.filter((t) => t.title.trim().length > 0 || t.content.trim().length > 0);
    if (valid.length === 0) return "";
    return valid
      .map((t, idx) => {
        const headingTitle = t.title.trim() || `${idx + 1}-mavzu`;
        const resolvedPages = t.pageCount || pagesPerTopic;
        const pageTag = resolvedPages ? ` (${resolvedPages} bet)` : "";
        const body = t.content.trim();
        return `# ${idx + 1}. ${headingTitle}${pageTag}${body ? `\n\n${body}` : ""}`;
      })
      .join("\n\n---\n\n");
  };

  const handleCopyWorks = async () => {
    const combined = buildCombinedWorksMarkdown();
    if (!combined) return;
    setErrorMessage(null);
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(combined);
      } else if (typeof document !== "undefined") {
        const textarea = document.createElement("textarea");
        textarea.value = combined;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedWorks(true);
      if (typeof window !== "undefined") {
        window.setTimeout(() => setCopiedWorks(false), 2500);
      }
    } catch {
      setErrorMessage("Matnni nusxalashda xatolik yuz berdi.");
    }
  };

  const handleDownloadWorksDocx = async () => {
    const combined = buildCombinedWorksMarkdown();
    if (!combined || isExportingDocx) return;
    setErrorMessage(null);
    setIsExportingDocx(true);
    try {
      const valid = topics.filter((t) => t.title.trim().length > 0);
      const exportTitle =
        documentTitle.trim() ||
        (valid.length === 1
          ? valid[0].title.trim()
          : valid[0]?.title.trim()
            ? `${valid[0].title.trim()} (${valid.length} ta mavzu)`
            : `${workLabels.display} ishlari`);

      await downloadAcademicDocx({
        topic: exportTitle,
        markdownContent: combined,
        workType: workLabels.apiLabel,
        subject: subjectHint?.trim() || detectedSubject || undefined,
        language: detectedLanguage || "uz",
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Word (.docx) faylni yuklab olishda xatolik yuz berdi."
      );
    } finally {
      setIsExportingDocx(false);
    }
  };

  return (
    <div
      className={`border-border bg-surface text-foreground rounded-2xl border ${
        compact ? "p-4 sm:p-5" : "p-5 sm:p-6"
      } space-y-5 shadow-sm`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="bg-surface-elevated border-border text-foreground-secondary inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide uppercase shadow-xs">
            <FileImage className="h-3.5 w-3.5 text-sky-500" />
            <span>Rasm orqali mavzu va sahifalar</span>
          </div>
          <h3 className="text-foreground text-base font-bold sm:text-lg">
            Rasm yuklang — AI barcha mavzularni avtomatik ajratib beradi
          </h3>
          <p className="text-foreground-secondary max-w-2xl text-xs sm:text-sm">
            Darslik, konspekt, mavzular ro&apos;yxati yoki slayd rasmini yuklang. Gemini 2.5 Flash
            ichidagi barcha mavzularni alohida tahrirlanadigan bloklarga ajratadi.
          </p>
        </div>

        {(topics.length > 0 || previewUrl) && (
          <button
            type="button"
            onClick={handleReset}
            disabled={isAnalyzing || isSaving}
            className="border-border bg-surface-elevated text-foreground-secondary hover:text-foreground hover:border-border-hover inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Tozalash
          </button>
        )}
      </div>

      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={openGalleryPicker}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all ${
          isDragging
            ? accentClasses.ring
            : "border-border hover:border-border-strong bg-surface-elevated/60"
        } p-4 sm:p-6`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={isAndroidClient ? undefined : "image/*"}
          onChange={handleImageUpload}
          disabled={isAnalyzing || isSaving || isWritingWorks}
          aria-label="Mavzular rasmini yuklash"
          className="sr-only"
          id={fileInputId}
        />
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageUpload}
          disabled={isAnalyzing || isSaving || isWritingWorks}
          aria-label="Kamera orqali rasmga olish"
          className="sr-only"
          id={`${fileInputId}-camera`}
        />
        <input
          type="file"
          onChange={handleImageUpload}
          disabled={isAnalyzing || isSaving || isWritingWorks}
          aria-label="Barcha fayllardan rasm tanlash"
          className="sr-only"
          id={`${fileInputId}-all-files`}
        />

        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <label
            htmlFor={fileInputId}
            onClick={(e) => e.stopPropagation()}
            className="flex flex-1 cursor-pointer flex-col items-center gap-4 sm:flex-row"
          >
            {previewUrl ? (
              <div className="border-border bg-background relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt={fileName || "Yuklangan rasm"}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="border-border bg-surface flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border text-sky-500 shadow-xs">
                <Upload className="h-6 w-6" />
              </div>
            )}

            <div className="flex-1 space-y-1 text-center sm:text-left">
              <p className="text-foreground text-sm font-semibold">
                {fileName ? `Yuklangan rasm: ${fileName}` : "Telefon galereyasidan rasm tanlang"}
              </p>
              <p className="text-foreground-muted text-xs">
                Faqat rasm (PNG, JPG, WEBP, HEIC) tanlanadi — tanlanishi bilanoq Gemini AI tahlil
                qiladi.
              </p>
            </div>
          </label>

          <label
            htmlFor={fileInputId}
            role="button"
            tabIndex={0}
            aria-disabled={isAnalyzing || isSaving || isWritingWorks}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                openGalleryPicker();
              }
            }}
            className={`inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-xs transition ${
              isAnalyzing || isSaving || isWritingWorks ? "pointer-events-none opacity-60" : ""
            } ${accentClasses.btn}`}
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileImage className="h-4 w-4" />
            )}
            <span>{previewUrl ? "Boshqa rasm tashlash" : "Rasm tashlash"}</span>
          </label>
        </div>

        {/* Mobil brauzerlarda galereya ko'rinmay qolgan holatlar uchun muqobil tugmalar */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="border-border/70 mt-4 flex flex-col gap-2 border-t pt-3"
        >
          <div className="flex flex-wrap items-center gap-2">
            <label
              htmlFor={`${fileInputId}-all-files`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  (
                    document.getElementById(`${fileInputId}-all-files`) as HTMLInputElement | null
                  )?.click();
                }
              }}
              className={`border-border bg-surface text-foreground hover:border-border-strong inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                isAnalyzing || isSaving || isWritingWorks ? "pointer-events-none opacity-60" : ""
              }`}
            >
              <FolderOpen className="h-3.5 w-3.5 text-sky-500" />
              <span>Barcha fayllardan tanlash</span>
            </label>

            <label
              htmlFor={`${fileInputId}-camera`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  (
                    document.getElementById(`${fileInputId}-camera`) as HTMLInputElement | null
                  )?.click();
                }
              }}
              className={`border-border bg-surface text-foreground hover:border-border-strong inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                isAnalyzing || isSaving || isWritingWorks ? "pointer-events-none opacity-60" : ""
              }`}
            >
              <Camera className="h-3.5 w-3.5 text-emerald-500" />
              <span>Kamera bilan tushirish</span>
            </label>
          </div>
          <p className="text-foreground-muted text-[11px] leading-relaxed">
            Agar ekranda bo&apos;sh oq{" "}
            <strong className="text-foreground-secondary">«Suratlar | Termalar»</strong> oynasi
            chiqsa: o&apos;sha oynaning tepa o&apos;ngidagi{" "}
            <strong className="text-foreground-secondary">⋮ → Ko&apos;rib chiqish</strong> ni bosing
            yoki yuqoridagi{" "}
            <strong className="text-foreground-secondary">Barcha fayllardan tanlash</strong>{" "}
            tugmasini ishlating. Telegram ichida ochgan bo&apos;lsangiz,{" "}
            <strong className="text-foreground-secondary">⋮ → Chrome&apos;da ochish</strong> ni
            tanlang.
          </p>
        </div>
      </div>

      {/* Nechta bet yozib berishni so'rash paneli (har doim ko'rinadi) */}
      <div className="border-border bg-surface-elevated/50 space-y-2.5 rounded-xl border p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-foreground text-xs font-bold sm:text-sm">
              Har bir mavzuga nechta bet yozib berilsin?
            </p>
            <p className="text-foreground-muted text-[11px]">
              Rasmdan chiqqan har bir mavzu uchun standart sahifa sonini tanlang (pastda alohida har
              bir mavzu uchun ham sozlash mumkin).
            </p>
          </div>
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${accentClasses.badge}`}
          >
            Tanlangan: {pagesPerTopic} bet
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {DEFAULT_PAGE_PRESETS.map((preset) => {
            const isSelected = pagesPerTopic === preset && !customPagesInput.trim();
            return (
              <button
                key={preset}
                type="button"
                onClick={() => handleSelectGlobalPreset(preset)}
                disabled={isAnalyzing || isWritingWorks}
                className={`inline-flex min-h-[36px] cursor-pointer items-center justify-center rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                  isSelected
                    ? `${accentClasses.btn} border-transparent shadow-xs`
                    : "border-border bg-surface text-foreground-secondary hover:border-border-strong hover:text-foreground"
                }`}
              >
                {preset} bet
              </button>
            );
          })}

          <div className="flex w-full items-center gap-1.5 sm:w-auto">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={100}
              aria-label="Har bir mavzuga nechta bet"
              value={customPagesInput}
              onChange={(e) => handleCustomGlobalPagesChange(e.target.value)}
              onBlur={() => {
                if (
                  !customPagesInput.trim() &&
                  !DEFAULT_PAGE_PRESETS.includes(
                    pagesPerTopic as (typeof DEFAULT_PAGE_PRESETS)[number]
                  )
                ) {
                  setPagesPerTopic(normalizedInitialPages);
                }
              }}
              disabled={isAnalyzing || isWritingWorks}
              placeholder="Boshqa bet (1-100)"
              className={`border-border bg-surface text-foreground placeholder:text-foreground-muted min-h-[38px] w-full rounded-lg border px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:outline-none sm:w-44 ${accentClasses.focus}`}
            />
          </div>
        </div>
      </div>

      {/* Auto-write toggle */}
      <label className="border-border bg-surface-elevated/50 flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-xs">
        <div>
          <span className="text-foreground block font-semibold">
            Har bir mavzuga {pagesPerTopic} bet {workLabels.display} yozish
          </span>
          <span className="text-foreground-muted text-[11px]">
            Yoqilgan bo&apos;lsa, rasmdan topilgan har bir mavzu uchun alohida {pagesPerTopic}{" "}
            betlik matn avtomatik tayyorlanadi.
          </span>
        </div>
        <input
          type="checkbox"
          checked={autoWriteWorks}
          onChange={(e) => setAutoWriteWorks(e.target.checked)}
          className="h-4 w-4 shrink-0 rounded accent-emerald-600"
        />
      </label>

      {/* Loading Status */}
      {isAnalyzing && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-3 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sm font-medium text-sky-700 dark:text-sky-300"
        >
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-sky-500" />
          <div>
            <p className="font-semibold">Rasm tahlil qilinmoqda...</p>
            <p className="text-xs opacity-80">
              AI rasmdagi mavzular va matnlarni alohida bloklarga ajratmoqda, iltimos kuting.
            </p>
          </div>
        </div>
      )}

      {isWritingWorks && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-300"
        >
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-emerald-500" />
          <div>
            <p className="font-semibold">
              Har bir mavzuga {getEffectivePagesLabel(topics) || pagesPerTopic} bet{" "}
              {workLabels.lower} yozilmoqda...
              {generationProgress && generationProgress.total > WORK_CHUNK_SIZE
                ? ` (${generationProgress.done}/${generationProgress.total})`
                : ""}
            </p>
            <p className="text-xs opacity-80">
              {topics.length} ta mavzuning har biri uchun mavzuga qat&apos;iy mos reja, kirish,
              asosiy qism va xulosa tayyorlanmoqda.
            </p>
          </div>
        </div>
      )}

      {worksReadyCount !== null && !isWritingWorks && (
        <div className="space-y-2">
          <div
            role="status"
            className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold text-emerald-700 sm:text-sm dark:text-emerald-300"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>
                {worksReadyPagesLabel
                  ? `${worksReadyCount} ta mavzuning har biri uchun ${worksReadyPagesLabel} betlik ${workLabels.lower} tayyorlandi!`
                  : `${worksReadyCount} ta mavzu uchun tanlangan betlarda ${workLabels.lower} tayyorlandi!`}
              </span>
            </div>
            {!onWorksGenerated && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowInlinePreview((prev) => !prev)}
                  className="bg-background/80 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-emerald-500/40 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-500/15 dark:text-emerald-200"
                >
                  {showInlinePreview ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5" />
                      <span>Previewni yopish</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5" />
                      <span>Ko&apos;rib chiqish</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => void handleDownloadWorksDocx()}
                  disabled={isExportingDocx}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white transition hover:bg-emerald-500 disabled:opacity-60"
                >
                  {isExportingDocx ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  <span>Word (.docx)</span>
                </button>
              </div>
            )}
          </div>

          {fallbackWarningCount > 0 && (
            <div
              role="alert"
              className="flex items-center gap-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-xs font-medium text-amber-800 dark:text-amber-300"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
              <span>
                {fallbackWarningCount} ta mavzu uchun AI vaqtinchalik qisqa qolip qaytardi. Pastda
                o&apos;sha mavzudagi &ldquo;Qayta yozish&rdquo; tugmasi orqali chuqurroq matn
                olishingiz mumkin.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div
          role="alert"
          className="flex flex-col justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center dark:text-red-300"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
          {requiresLogin && (
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(loginCallbackUrl)}`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700"
            >
              <LogIn className="h-3.5 w-3.5" />
              Tizimga kirish
            </Link>
          )}
        </div>
      )}

      {/* Editable Topic Blocks */}
      {topics.length > 0 && (
        <div className="space-y-4 pt-1">
          <div className="border-border bg-surface-elevated/70 flex flex-col justify-between gap-3 rounded-xl border p-3.5 sm:flex-row sm:items-end sm:p-4">
            <div className="flex-1 space-y-1.5">
              <label
                htmlFor={`${inputId}-doc-title`}
                className="text-foreground-secondary block text-xs font-semibold tracking-wide uppercase"
              >
                Saqlanadigan hujjat sarlavhasi
              </label>
              <input
                id={`${inputId}-doc-title`}
                type="text"
                value={documentTitle}
                onChange={(e) => {
                  setSaveSuccess(null);
                  setDocumentTitle(e.target.value);
                }}
                placeholder="Masalan: Falsafa fanidan 10 ta mavzu"
                className={`border-border bg-surface text-foreground placeholder:text-foreground-muted w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none ${accentClasses.focus}`}
              />
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${accentClasses.badge}`}
              >
                {topics.length} ta mavzu topildi
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {topics.map((topic, index) => (
              <div
                key={topic.id}
                data-testid={`topic-block-${index}`}
                className="border-border bg-surface-elevated/50 hover:border-border-hover space-y-3 rounded-xl border p-4 transition"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold ${accentClasses.badge}`}
                  >
                    {index + 1}-mavzu (Sahifa {index + 1})
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    <label
                      htmlFor={`${inputId}-pages-${topic.id}`}
                      className="text-foreground-secondary text-[11px] font-semibold whitespace-nowrap"
                    >
                      Nechta bet?
                    </label>
                    {(() => {
                      const effectivePageValue = topic.pageCount ?? pagesPerTopic;
                      const isPresetValue = DEFAULT_PAGE_PRESETS.includes(
                        effectivePageValue as (typeof DEFAULT_PAGE_PRESETS)[number]
                      );
                      const isCustomMode = Boolean(customPageTopics[topic.id]) || !isPresetValue;
                      const displayedInputValue =
                        topic.id in topicPageDrafts
                          ? topicPageDrafts[topic.id]
                          : /^\d+$/.test(effectivePageValue)
                            ? effectivePageValue
                            : "";

                      return (
                        <>
                          <select
                            id={`${inputId}-pages-${topic.id}`}
                            aria-label={`${index + 1}-mavzu uchun betlar soni`}
                            value={isCustomMode ? "custom" : effectivePageValue}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "custom") {
                                setCustomPageTopics((prev) => ({ ...prev, [topic.id]: true }));
                                const hasCustomInt =
                                  /^\d+$/.test(effectivePageValue) && !isPresetValue;
                                setTopicPageDrafts((prev) => {
                                  const next = { ...prev };
                                  if (hasCustomInt) {
                                    next[topic.id] = effectivePageValue;
                                  } else {
                                    delete next[topic.id];
                                  }
                                  return next;
                                });
                                if (!hasCustomInt) {
                                  handleTopicPageCountChange(topic.id, "7");
                                }
                              } else {
                                setCustomPageTopics((prev) => {
                                  if (!(topic.id in prev)) return prev;
                                  const next = { ...prev };
                                  delete next[topic.id];
                                  return next;
                                });
                                setTopicPageDrafts((prev) => {
                                  if (!(topic.id in prev)) return prev;
                                  const next = { ...prev };
                                  delete next[topic.id];
                                  return next;
                                });
                                handleTopicPageCountChange(topic.id, val);
                              }
                            }}
                            className="border-border bg-surface text-foreground min-h-[38px] rounded-lg border px-2 py-1 text-xs font-semibold focus:outline-none"
                          >
                            {DEFAULT_PAGE_PRESETS.map((preset) => (
                              <option key={preset} value={preset}>
                                {preset} bet
                              </option>
                            ))}
                            <option value="custom">Boshqa...</option>
                          </select>
                          <input
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={100}
                            aria-label={`${index + 1}-mavzu uchun aniq bet soni`}
                            value={displayedInputValue}
                            placeholder="Bet"
                            onChange={(e) => {
                              const raw = e.target.value.trim();
                              if (!raw) {
                                setTopicPageDrafts((prev) => ({ ...prev, [topic.id]: "" }));
                                return;
                              }
                              const parsed = parseInt(raw, 10);
                              if (!Number.isNaN(parsed)) {
                                const clamped = Math.min(100, Math.max(1, parsed));
                                const clampedStr = String(clamped);
                                setTopicPageDrafts((prev) => {
                                  if (!(topic.id in prev)) return prev;
                                  const next = { ...prev };
                                  delete next[topic.id];
                                  return next;
                                });
                                if (
                                  !DEFAULT_PAGE_PRESETS.includes(
                                    clampedStr as (typeof DEFAULT_PAGE_PRESETS)[number]
                                  )
                                ) {
                                  setCustomPageTopics((prev) => ({ ...prev, [topic.id]: true }));
                                } else {
                                  setCustomPageTopics((prev) => {
                                    if (!(topic.id in prev)) return prev;
                                    const next = { ...prev };
                                    delete next[topic.id];
                                    return next;
                                  });
                                }
                                handleTopicPageCountChange(topic.id, clampedStr);
                              }
                            }}
                            onBlur={() => {
                              if (topicPageDrafts[topic.id] === "") {
                                setTopicPageDrafts((prev) => {
                                  const next = { ...prev };
                                  delete next[topic.id];
                                  return next;
                                });
                              }
                            }}
                            className="border-border bg-surface text-foreground placeholder:text-foreground-muted min-h-[38px] w-20 rounded-lg border px-2.5 py-1 text-xs font-semibold focus:outline-none"
                          />
                        </>
                      );
                    })()}
                    {topic.usedFallback && (
                      <button
                        type="button"
                        onClick={() => void handleRetrySingleTopic(topic.id)}
                        disabled={Boolean(retryingTopicId) || isWritingWorks}
                        aria-label={`${index + 1}-mavzuni qayta yozish`}
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-500/20 disabled:opacity-50 dark:text-amber-300"
                      >
                        {retryingTopicId === topic.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="h-3.5 w-3.5" />
                        )}
                        Qayta yozish
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveTopic(topic.id)}
                      aria-label={`${index + 1}-mavzuni o'chirish`}
                      className="text-foreground-muted inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition hover:bg-red-500/10 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      O&apos;chirish
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor={`${inputId}-title-${topic.id}`}
                    className="text-foreground-secondary block text-xs font-medium"
                  >
                    Mavzu sarlavhasi
                  </label>
                  <input
                    id={`${inputId}-title-${topic.id}`}
                    type="text"
                    value={topic.title}
                    onChange={(e) => handleTopicFieldChange(topic.id, "title", e.target.value)}
                    placeholder="Mavzu sarlavhasini kiriting..."
                    className={`border-border bg-surface text-foreground placeholder:text-foreground-muted w-full rounded-lg border px-3 py-2 text-sm font-medium focus:ring-2 focus:outline-none ${accentClasses.focus}`}
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor={`${inputId}-content-${topic.id}`}
                    className="text-foreground-secondary block text-xs font-medium"
                  >
                    Mavzu matni / Sahifa mazmuni
                  </label>
                  <textarea
                    id={`${inputId}-content-${topic.id}`}
                    rows={4}
                    value={topic.content}
                    onChange={(e) => handleTopicFieldChange(topic.id, "content", e.target.value)}
                    placeholder="Mavzuga oid matn yoki reja bandlari..."
                    className={`border-border bg-surface text-foreground placeholder:text-foreground-muted w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none ${accentClasses.focus} resize-y`}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Actions Footer */}
          <div className="border-border flex flex-wrap items-center justify-between gap-3 border-t pt-2">
            <button
              type="button"
              onClick={handleAddEmptyTopic}
              disabled={isSaving || isAnalyzing}
              className="border-border bg-surface-elevated text-foreground hover:border-border-hover inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition disabled:opacity-50 sm:text-sm"
            >
              <Plus className="h-4 w-4" />
              Yana mavzu qo&apos;shish
            </button>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => void generateWorksForTopics(topics)}
                disabled={isSaving || isAnalyzing || isWritingWorks || topics.length === 0}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-500/20 disabled:opacity-50 sm:text-sm dark:text-emerald-300"
              >
                {isWritingWorks ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                <span>
                  {(() => {
                    const uniformLabel = getEffectivePagesLabel(topics);
                    return uniformLabel
                      ? `${uniformLabel} bet ${workLabels.display} yozish`
                      : `Tanlangan betlarda ${workLabels.display} yozish`;
                  })()}
                </span>
              </button>

              {onApplyTopicsToForm && (
                <button
                  type="button"
                  onClick={() => {
                    onApplyTopicsToForm(
                      topics
                        .map(({ title, content, originalNotes, hasGeneratedWork, pageCount }) => {
                          const resolvedPageCount =
                            pageCount ||
                            (pagesPerTopic !== normalizedInitialPages ? pagesPerTopic : undefined);
                          const resolvedContent = hasGeneratedWork
                            ? (originalNotes ?? "").trim()
                            : content.trim();
                          return {
                            title: title.trim(),
                            content: resolvedContent,
                            ...(resolvedPageCount ? { pageCount: resolvedPageCount } : {}),
                          };
                        })
                        .filter((t) => t.title.length > 0)
                    );
                    setAppliedToForm(true);
                  }}
                  disabled={isSaving || isAnalyzing || isWritingWorks}
                  className="border-border bg-surface-elevated text-foreground hover:border-border-strong inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition disabled:opacity-50 sm:text-sm"
                >
                  <Sparkles className="h-4 w-4 text-sky-500" />
                  {appliedToForm ? "Formaga qo'llandi ✓" : "Formaga qo'llash"}
                </button>
              )}

              {!onWorksGenerated && topics.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowInlinePreview((prev) => !prev)}
                    disabled={isAnalyzing || isWritingWorks}
                    className="border-border bg-surface-elevated text-foreground hover:border-border-strong inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition disabled:opacity-50 sm:text-sm"
                  >
                    {showInlinePreview ? (
                      <>
                        <EyeOff className="h-4 w-4 text-sky-500" />
                        <span>Previewni yopish</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 text-sky-500" />
                        <span>Ko&apos;rib chiqish</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleCopyWorks()}
                    disabled={isAnalyzing || isWritingWorks}
                    className="border-border bg-surface-elevated text-foreground hover:border-border-strong inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition disabled:opacity-50 sm:text-sm"
                  >
                    {copiedWorks ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-500" />
                        <span>Nusxalandi ✓</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Nusxalash</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleDownloadWorksDocx()}
                    disabled={isAnalyzing || isWritingWorks || isExportingDocx}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-500/10 px-3.5 py-2.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-500/20 disabled:opacity-50 sm:text-sm dark:text-sky-300"
                  >
                    {isExportingDocx ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    <span>
                      {isExportingDocx ? "Word tayyorlanmoqda..." : "Word (.docx) yuklab olish"}
                    </span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={handleSaveAllTopics}
                disabled={isSaving || isAnalyzing || isWritingWorks || topics.length === 0}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold shadow-sm transition disabled:opacity-50 sm:text-sm ${accentClasses.btn}`}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Database className="h-4 w-4" />
                )}
                <span>{isSaving ? "Saqlanmoqda..." : "Barcha mavzularni saqlash"}</span>
              </button>
            </div>
          </div>

          {/* Instant Markdown Preview & Direct Download (No Login Required) */}
          {!onWorksGenerated && showInlinePreview && (
            <div
              ref={previewSectionRef}
              aria-label="Tayyor ishlar ko'rinishi"
              className="border-border bg-background/80 space-y-4 rounded-2xl border p-4 shadow-inner sm:p-6"
            >
              <div className="border-border flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                <div>
                  <h4 className="text-foreground text-sm font-bold sm:text-base">
                    {documentTitle.trim() || `${workLabels.display} natijalari`}
                  </h4>
                  <p className="text-foreground-muted text-xs">
                    Tizimga kirmasdan turib natijani ko&apos;ring, nusxalang yoki Word (.docx)
                    shaklida yuklab oling.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleCopyWorks()}
                    className="border-border bg-surface-elevated text-foreground hover:border-border-strong inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition"
                  >
                    {copiedWorks ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        <span>Nusxalandi</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Matnni nusxalash</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDownloadWorksDocx()}
                    disabled={isExportingDocx}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-sky-500 disabled:opacity-60"
                  >
                    {isExportingDocx ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    <span>Word (.docx) yuklash</span>
                  </button>
                </div>
              </div>
              <div className="prose prose-sm dark:prose-invert border-border/60 bg-surface max-h-[520px] max-w-none overflow-y-auto rounded-xl border p-4 text-sm leading-relaxed">
                <ReactMarkdown>{buildCombinedWorksMarkdown()}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Database Save Success Banner */}
      {saveSuccess && (
        <div
          role="status"
          className="space-y-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-800 dark:text-emerald-200"
        >
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
            <div>
              <p className="font-bold">
                Muvaffaqiyatli saqlandi! ({saveSuccess.sectionCount} ta mavzu va sahifa)
              </p>
              <p className="text-xs opacity-90">
                &ldquo;{saveSuccess.title}&rdquo; hujjati PostgreSQL bazasiga saqlandi. Endi uni
                hujjat muharririda ko&apos;rishingiz yoki tahrirlashingiz mumkin.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pl-7">
            <Link
              href={saveSuccess.editorUrl}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Muharrirda ochish
            </Link>
            <Link
              href="/dashboard/documents"
              className="bg-surface inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-500/10 dark:text-emerald-300"
            >
              Mening hujjatlarim
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Mobile-friendly shortcut button ("Rasm tashlash") that directly triggers
 * `#image-upload-input` so phone users jump straight to their Photo Gallery.
 */
export function GalleryTopicTriggerButton({
  inputId = "image-upload-input",
  accentColor = "blue",
  label = "Rasm tashlash",
}: {
  inputId?: string;
  accentColor?: "blue" | "emerald" | "amber";
  label?: string;
}) {
  const colorClasses =
    accentColor === "emerald"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
      : accentColor === "amber"
        ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
        : "border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20";

  return (
    <label
      htmlFor={inputId}
      role="button"
      tabIndex={0}
      onClick={() => {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("docnova:open-image-mode", { detail: { inputId } }));
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("docnova:open-image-mode", { detail: { inputId } })
            );
          }
          const inputEl = document.getElementById(inputId) as HTMLInputElement | null;
          inputEl?.click();
        }
      }}
      className={`inline-flex min-h-[34px] cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition sm:text-xs ${colorClasses}`}
      title="Telefon galereyasidan mavzu rasmini tanlash"
    >
      <FileImage className="h-3.5 w-3.5 shrink-0" />
      <span>{label}</span>
    </label>
  );
}
