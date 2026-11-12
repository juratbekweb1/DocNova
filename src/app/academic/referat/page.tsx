"use client";

import React, { useState, useRef, useMemo } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import {
  FileText,
  Sparkles,
  Loader2,
  FileDown,
  Copy,
  Check,
  Printer,
  PencilRuler,
  Layers,
  Presentation,
  Plus,
  Minus,
  RotateCcw,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { StudentSubNav } from "@/components/academic/student-sub-nav";
import { useToast } from "@/hooks/use-toast";
import { CreationModeSelector } from "@/components/academic/creation-mode-selector";
import { GalleryTopicTriggerButton } from "@/components/academic/image-topic-parser";
import {
  StaleBuildError,
  deliverPdf,
  describePdfError,
  exportElementsToPdf,
  inAppHint,
} from "@/lib/pdf-export";
import { downloadAcademicDocx } from "@/lib/docx-download-client";
import { formatImageTopicsTemplateContext } from "@/lib/academic/topic-fidelity";

const REFERAT_PROGRESS_STEPS = [
  "Mavzu va ilmiy reja shakllantirilmoqda...",
  "Kirish: dolzarblik, maqsad va vazifalar yozilmoqda...",
  "Asosiy bo'limlar va qiyosiy tahliliy jadval tayyorlanmoqda...",
  "Xulosa va GOST adabiyotlar ro'yxati tekshirilmoqda...",
];

export default function AcademicReferatPage() {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    workType: "Referat",
    subject: "",
    topic: "",
    studentName: "",
    teacherName: "",
    length: "5-8 bet (Klassik)",
    templateText: "",
  });

  const [loading, setLoading] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressStepIdx, setProgressStepIdx] = useState(0);
  const [generationError, setGenerationError] = useState<{
    message: string;
    creditRefunded?: boolean;
  } | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [slidesCount, setSlidesCount] = useState<number>(8);
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);
  const resultPreviewRef = useRef<HTMLDivElement>(null);

  const renderedMarkdown = useMemo(
    () => (result ? <ReactMarkdown>{result}</ReactMarkdown> : null),
    [result]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.topic.trim()) {
      toast({
        title: "Mavzuni kiriting",
        description: "Referat yoki mustaqil ish mavzusi kiritilishi shart.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setGenerationError(null);
    setResult(null);
    setProgressStepIdx(0);
    setProgressPercent(15);

    const stepTimer = setInterval(() => {
      setProgressStepIdx((prev) => {
        const next = prev < REFERAT_PROGRESS_STEPS.length - 1 ? prev + 1 : prev;
        setProgressPercent(
          Math.min(92, Math.round(((next + 1) / REFERAT_PROGRESS_STEPS.length) * 92))
        );
        return next;
      });
    }, 1800);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45_000);

    try {
      const res = await fetch("/api/ai/academic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate-referat",
          ...formData,
        }),
        signal: controller.signal,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401 || data.requireLogin) {
          toast({
            title: "Tizimga kirish zarur 🔒",
            description: "Referat tayyorlash uchun profilingizga kiring yoki ro'yxatdan o'ting.",
            variant: "destructive",
          });
          window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
          return;
        }
        if (res.status === 403 || data.requireUpgrade) {
          toast({
            title: "Oylik limitingiz tugadi ⚠️",
            description:
              data.upgradeMessage || "Ko'proq foydalanish uchun Pro yoki Premium tarifga o'ting.",
            variant: "destructive",
          });
          return;
        }
        const errObj = new Error(data.error || "Generatsiyada xatolik yuz berdi") as Error & {
          creditRefunded?: boolean;
        };
        errObj.creditRefunded = Boolean(data.creditRefunded);
        throw errObj;
      }

      setProgressPercent(100);
      setResult(data.result);
      toast({
        title: "Hujjat muvaffaqiyatli tayyorlandi!",
        description: "Matnni Word (.docx) yoki PDF formatida yuklab olishingiz mumkin.",
      });
    } catch (err: unknown) {
      const e = err as Error & { creditRefunded?: boolean };
      const isTimeout = e?.name === "AbortError";
      const friendlyMessage = isTimeout
        ? "Server javob berishi kutilganidan ko'proq vaqt oldi (Timeout). Limitingiz saqlab qolindi — 'Qayta urinish' tugmasini bosing."
        : e.message || "Tarmoq yoki server xatoligi yuz berdi. Qayta urinib ko'ring.";

      setGenerationError({
        message: friendlyMessage,
        creditRefunded: isTimeout ? true : Boolean(e.creditRefunded ?? true),
      });
      toast({
        title: isTimeout ? "Vaqt tugadi (Timeout)" : "Xatolik yuz berdi",
        description: friendlyMessage,
        variant: "destructive",
      });
    } finally {
      clearInterval(stepTimer);
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast({ title: "Nusxalandi!", description: "Matn xotiraga olindi." });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadDoc = async () => {
    if (!result || isDownloadingDocx) return;
    setIsDownloadingDocx(true);
    try {
      const exported = await downloadAcademicDocx({
        topic: formData.topic,
        markdownContent: result,
        workType: formData.workType,
        subject: formData.subject,
        studentName: formData.studentName,
        teacherName: formData.teacherName,
      });

      if (exported.deliveryMethod !== "cancelled") {
        toast({
          title: "Word (.docx) yuklab olindi! 📄",
          description: "GOST A4 standartlariga mos toza .docx hujjat saqlandi.",
        });
      }
    } catch (err) {
      console.error("[REFERAT_DOCX_EXPORT_ERR]", err);
      toast({
        title: "Word (.docx) yuklashda xatolik",
        description: err instanceof Error ? err.message : "Iltimos, qayta urinib ko'ring.",
        variant: "destructive",
      });
    } finally {
      setIsDownloadingDocx(false);
    }
  };

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const documentRef = useRef<HTMLDivElement>(null);

  // Real PDF file download (html2canvas-pro + jsPDF), print dialog only as fallback
  const handleDownloadPdf = async () => {
    if (!documentRef.current || !result) return;
    setIsExportingPdf(true);
    const cleanTopic = formData.topic.slice(0, 30).replace(/[^a-zA-Z0-9]/g, "_") || "Referat";
    const filename = `${formData.workType.replace(/[^a-zA-Z0-9]/g, "_")}_${cleanTopic}.pdf`;
    try {
      const blob = await exportElementsToPdf([documentRef.current], {
        filename,
        orientation: "portrait",
        margin: 10,
        fit: "width",
        captureWidth: 794,
      });
      const delivered = await deliverPdf(blob, filename);
      if (delivered !== "cancelled") {
        toast({
          title: "PDF yuklab olindi! 📄",
          description: inAppHint() ?? "Hujjat A4 PDF formatida saqlandi.",
        });
      }
    } catch (err) {
      console.error("[PDF_EXPORT_ERROR]", err);
      if (err instanceof StaleBuildError) {
        toast({ title: "Sahifani yangilang 🔄", description: err.message, variant: "destructive" });
        return;
      }
      toast({ title: "Chop etish orqali PDF saqlash", description: describePdfError(err) });
      handlePrint();
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrint = () => {
    const isMobile =
      typeof window !== "undefined" &&
      (window.innerWidth < 640 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));

    if (isMobile) {
      toast({
        title: "PDFni saqlash / chop etish 📱",
        description:
          "Chop etish oynasida printerni 'PDF sifatida saqlash' (Save as PDF) ga o'zgartiring va Saqlash tugmasini bosing.",
      });
    }
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="bg-background text-foreground min-h-screen pb-20 print:bg-white print:pb-0">
      <div className="print:hidden">
        <StudentSubNav activeTab="referat" />
      </div>

      {/* Top Banner */}
      <div className="border-border bg-surface/30 border-b px-4 py-8 sm:px-6 lg:px-8 print:hidden">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
              <PencilRuler className="h-3.5 w-3.5" />
              <span>Mustaqil Ta&apos;lim & Referatlar</span>
            </div>
            <h1 className="text-foreground text-2xl font-extrabold sm:text-3xl">
              Mustaqil ish va Referat generatori
            </h1>
            <p className="text-foreground-secondary mt-1 max-w-2xl text-xs sm:text-sm">
              Universitet fani bo&apos;yicha mustaqil topshiriqlar, referatlar, insho va
              hisobotlarni reja, kirish va xulosasi bilan 2 daqiqada tayyorlang.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8 print:p-0">
        <div className="grid grid-cols-1 items-start gap-6 sm:gap-8 lg:grid-cols-12 print:block">
          {/* Left Form */}
          <div className="border-border bg-surface min-w-0 rounded-2xl border p-4 shadow-sm sm:p-6 lg:col-span-5 print:hidden">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-foreground flex items-center gap-2 text-lg font-bold break-words">
                <FileText className="h-5 w-5 shrink-0 text-emerald-400" />
                <span>Ish ma&apos;lumotlari</span>
              </h2>
              <GalleryTopicTriggerButton accentColor="emerald" label="Rasm tashlash" />
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              {/* Ikki xil hujjat yaratish yo'li: Noldan yaratish / Namuna faylim bor */}
              <CreationModeSelector
                moduleType={formData.workType === "Mustaqil ish" ? "independent" : "referat"}
                accentColor="emerald"
                autoGeneratePerTopicWorks={false}
                defaultPagesPerTopic="2-3"
                subjectHint={formData.subject}
                onSampleBlueprintReady={(blueprint) => {
                  setFormData((prev) => ({
                    ...prev,
                    templateText: blueprint,
                  }));
                }}
                onSampleCleared={() => setFormData((prev) => ({ ...prev, templateText: "" }))}
                onApplySampleStructureHint={(hint) => {
                  setFormData((prev) => ({
                    ...prev,
                    length: hint.pageCount ? `${hint.pageCount} bet` : prev.length,
                    subject: prev.subject || hint.subject || prev.subject,
                  }));
                  toast({
                    title: "Namuna tuzilmasi qo'llanildi!",
                    description: "Hajm va fan formaga moslandi. O'z mavzungizni tasdiqlang.",
                  });
                }}
                onNaturalPromptParsed={(parsed) => {
                  setFormData((prev) => ({
                    ...prev,
                    workType:
                      parsed.workType === "Mustaqil ish"
                        ? "Mustaqil ish"
                        : parsed.workType === "Referat"
                          ? "Referat"
                          : prev.workType,
                    topic: parsed.topic || prev.topic,
                    subject: parsed.subject || prev.subject,
                    length: parsed.pageCount ? `${parsed.pageCount} bet` : prev.length,
                  }));
                  toast({
                    title: "So'rov tahlil qilindi ✨",
                    description:
                      parsed.missingFields.length > 0
                        ? `Iltimos, yetishmayotgan maydonlarni to'ldiring: ${parsed.missingFields.join(", ")}`
                        : "Barcha asosiy parametrlar shaklga kiritildi!",
                  });
                }}
                onImageMetadataDetected={(meta) => {
                  setFormData((prev) => ({
                    ...prev,
                    subject: prev.subject.trim() ? prev.subject : meta.subject || prev.subject,
                  }));
                }}
                onApplyTopicsToForm={(topics) => {
                  if (topics.length === 0) return;
                  setFormData((prev) => ({
                    ...prev,
                    topic: topics[0].title || prev.topic,
                    length: topics[0].pageCount ? `${topics[0].pageCount} bet` : prev.length,
                    templateText: formatImageTopicsTemplateContext(topics, {
                      subject: prev.subject,
                    }),
                  }));
                  toast({
                    title: "Rasmdan olingan mavzular qo'llanildi!",
                    description: `${topics.length} ta mavzu shaklga yuklandi.`,
                  });
                }}
                onWorksGenerated={(works) => {
                  if (works.length === 0) return;
                  const combinedMarkdown = works
                    .map((w, idx) => `# ${idx + 1}. ${w.title}\n\n${w.content}`)
                    .join("\n\n---\n\n");
                  const distinctPages = new Set(
                    works.map((w) => w.pageCount).filter((v): v is string => Boolean(v))
                  );
                  const syncedPage =
                    distinctPages.size === 1 ? Array.from(distinctPages)[0] : works[0]?.pageCount;
                  const pagesLabel =
                    distinctPages.size === 1
                      ? `${Array.from(distinctPages)[0]} bet`
                      : "tanlangan betlarda";
                  setResult(combinedMarkdown);
                  setFormData((prev) => ({
                    ...prev,
                    topic: works[0]?.title?.trim() || prev.topic,
                    length: syncedPage ? `${syncedPage} bet` : prev.length,
                    templateText: formatImageTopicsTemplateContext(
                      works.map((w) => ({
                        title: w.title,
                        content: "",
                        pageCount: w.pageCount,
                      })),
                      { subject: prev.subject }
                    ),
                  }));
                  toast({
                    title: `Har bir mavzuga ${pagesLabel} mustaqil ish tayyor!`,
                    description: `${works.length} ta mavzu bo'yicha to'liq ishlar ko'rish oynasida tayyor.`,
                  });
                  if (typeof window !== "undefined") {
                    window.setTimeout(() => {
                      resultPreviewRef.current?.scrollIntoView?.({
                        behavior: "smooth",
                        block: "start",
                      });
                    }, 80);
                  }
                }}
              />

              <div>
                <label className="text-foreground-secondary mb-1 block text-xs font-semibold">
                  Ish formati
                </label>
                <select
                  name="workType"
                  value={formData.workType}
                  onChange={handleChange}
                  className="border-border bg-background text-foreground min-h-[44px] w-full rounded-xl border px-3.5 py-2.5 text-base focus:border-emerald-400 focus:outline-none sm:text-sm"
                >
                  <option value="Referat">Referat (OTM standarti)</option>
                  <option value="Mustaqil ish">Mustaqil ish (Amaliy topshiriq)</option>
                  <option value="Ilmiy tezis / Maqola">Ilmiy tezis / Maqola</option>
                  <option value="Taqriz va Insho">Taqriz va Akademik Insho</option>
                </select>
              </div>

              <div>
                <label className="text-foreground-secondary mb-1 block text-xs font-semibold">
                  Fan nomi *
                </label>
                <input
                  type="text"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Masalan: Falsafa, Iqtisodiyot nazariyasi, Fizika..."
                  className="border-border bg-background text-foreground min-h-[44px] w-full rounded-xl border px-3.5 py-2.5 text-base focus:border-emerald-400 focus:outline-none sm:text-sm"
                />
              </div>

              <div>
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                  <label className="text-foreground-secondary block text-xs font-semibold">
                    Mavzu *
                  </label>
                  <GalleryTopicTriggerButton accentColor="emerald" label="Rasm tashlash" />
                </div>
                <input
                  type="text"
                  name="topic"
                  required
                  value={formData.topic}
                  onChange={handleChange}
                  placeholder="Masalan: Yashil energetika va quyosh panellari istiqbollari..."
                  className="border-border bg-background text-foreground min-h-[44px] w-full rounded-xl border px-3.5 py-2.5 text-base focus:border-emerald-400 focus:outline-none sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-foreground-secondary mb-1 block text-xs font-semibold">
                    Talaba F.I.Sh.
                  </label>
                  <input
                    type="text"
                    name="studentName"
                    value={formData.studentName}
                    onChange={handleChange}
                    placeholder="Aliyev Vali"
                    className="border-border bg-background text-foreground min-h-[44px] w-full rounded-xl border px-3.5 py-2.5 text-base focus:border-emerald-400 focus:outline-none sm:text-sm"
                  />
                </div>
                <div>
                  <label className="text-foreground-secondary mb-1 block text-xs font-semibold">
                    O&apos;qituvchi
                  </label>
                  <input
                    type="text"
                    name="teacherName"
                    value={formData.teacherName}
                    onChange={handleChange}
                    placeholder="dots. Karimov A."
                    className="border-border bg-background text-foreground min-h-[44px] w-full rounded-xl border px-3.5 py-2.5 text-base focus:border-emerald-400 focus:outline-none sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-foreground-secondary mb-1.5 block text-xs font-semibold">
                  Kutilayotgan hajm (Sahifalar soni: 1 — 500 betgacha)
                </label>
                <div className="mb-2 grid grid-cols-4 gap-1.5 sm:flex sm:flex-wrap">
                  {[
                    { label: "5 bet", val: "3-5 bet (Qisqa hisobot)" },
                    { label: "10 bet", val: "5-8 bet (Klassik)" },
                    { label: "15 bet", val: "10-15 bet (Kengaytirilgan)" },
                    { label: "30 bet", val: "30 bet" },
                    { label: "50 bet", val: "50 bet" },
                    { label: "100 bet", val: "100 bet" },
                    { label: "200 bet", val: "200 bet" },
                    { label: "300 bet", val: "300 bet" },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, length: preset.val }))}
                      className={`flex min-h-[40px] cursor-pointer items-center justify-center rounded-xl border px-2 py-1.5 text-xs font-bold whitespace-nowrap transition-all sm:px-3 ${
                        formData.length === preset.val
                          ? "border-emerald-500 bg-emerald-600 text-white shadow-sm"
                          : "border-border bg-background text-foreground-secondary hover:text-foreground hover:border-emerald-500/50"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  name="length"
                  value={formData.length}
                  onChange={handleChange}
                  placeholder="Yoki o'zingiz xohlagan sahifa sonini yozing (masalan: 75 bet, 150 bet)..."
                  className="border-border bg-background text-foreground min-h-[44px] w-full rounded-xl border px-3.5 py-2.5 text-base focus:border-emerald-400 focus:outline-none sm:text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.01] hover:bg-emerald-500 disabled:opacity-50 sm:text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Referat tuzilmoqda...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Referatni generatsiya qilish</span>
                  </>
                )}
              </button>

              {/* REFERAT TAQDIMOTI: FOYDALANUVCHI O'ZI XOHLAGANCHA SLAYD QO'SHADI */}
              <div className="mt-4 space-y-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Presentation className="h-4 w-4 text-emerald-400" />
                    <span className="text-foreground text-xs font-bold">
                      Referat taqdimoti (Slaydlar)
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">{slidesCount} ta slayd</span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-foreground-secondary text-[11px] font-medium">
                      Slayd soni:
                    </span>
                    <button
                      type="button"
                      onClick={() => setSlidesCount((prev) => Math.max(1, prev - 1))}
                      className="border-border bg-background hover:bg-surface-elevated flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border text-xs font-bold transition-colors"
                      title="1 ta kamaytirish"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={slidesCount}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) setSlidesCount(Math.min(100, Math.max(1, val)));
                      }}
                      className="border-border bg-background text-foreground h-7 w-12 rounded-lg border text-center text-xs font-bold focus:border-emerald-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setSlidesCount((prev) => Math.min(100, prev + 1))}
                      className="border-border bg-background hover:bg-surface-elevated flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border text-xs font-bold transition-colors"
                      title="1 ta qo'shish"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="flex max-w-full flex-wrap items-center gap-1 overflow-x-auto py-0.5">
                    {[5, 10, 15, 20, 50, 100].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setSlidesCount(cnt)}
                        className={`shrink-0 cursor-pointer rounded-lg border px-2 py-0.5 text-[11px] font-semibold transition-all ${
                          slidesCount === cnt
                            ? "border-emerald-600 bg-emerald-600 font-bold text-white shadow-sm"
                            : "bg-background border-border text-foreground hover:bg-surface-elevated"
                        }`}
                      >
                        {cnt}
                      </button>
                    ))}
                  </div>
                </div>

                <Link
                  href={`/academic/presentation?topic=${encodeURIComponent(
                    formData.topic || "Referat"
                  )}&slides=${slidesCount}&type=referat`}
                  className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-600/20 px-3 py-2 text-xs font-bold text-emerald-300 transition-all hover:bg-emerald-600/30"
                >
                  <Presentation className="h-3.5 w-3.5" />
                  <span>{slidesCount} ta slaydli referat taqdimoti yaratish →</span>
                </Link>
              </div>
            </form>
            {result && (
              <button
                type="button"
                onClick={() =>
                  resultPreviewRef.current?.scrollIntoView?.({
                    behavior: "smooth",
                    block: "start",
                  })
                }
                className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-500 lg:hidden"
              >
                <span>Tayyor natijaga o&apos;tish ↓</span>
              </button>
            )}
          </div>

          {/* Right Preview */}
          <div ref={resultPreviewRef} className="flex min-w-0 flex-col lg:col-span-7">
            {loading ? (
              <div className="border-border bg-surface animate-in fade-in space-y-5 rounded-2xl border p-5 shadow-lg sm:p-8 print:hidden">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Loader2 className="h-5 w-5 shrink-0 animate-spin text-emerald-400" />
                    <span className="text-foreground text-sm font-bold break-words sm:text-base">
                      Sun&apos;iy intellekt referat tayyorlamoqda...
                    </span>
                  </div>
                  <span className="shrink-0 font-mono text-sm font-bold text-emerald-400">
                    {progressPercent}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="bg-surface-elevated h-2.5 w-full overflow-hidden rounded-full">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Step Checklist */}
                <div className="space-y-2.5">
                  {REFERAT_PROGRESS_STEPS.map((step, idx) => {
                    const isDone = idx < progressStepIdx;
                    const isCurrent = idx === progressStepIdx;
                    return (
                      <div
                        key={idx}
                        className={`flex items-center gap-2.5 text-xs ${
                          isCurrent
                            ? "font-bold text-emerald-400"
                            : isDone
                              ? "font-medium text-emerald-300/80"
                              : "text-foreground-muted opacity-60"
                        }`}
                      >
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                            isCurrent
                              ? "animate-pulse bg-emerald-500 text-white"
                              : isDone
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-surface-elevated text-foreground-muted"
                          }`}
                        >
                          {isDone ? "✓" : idx + 1}
                        </div>
                        <span className="break-words">{step}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Skeleton A4 Sheet */}
                <div className="border-border/60 bg-surface-elevated/40 animate-pulse space-y-3 rounded-xl border p-5">
                  <div className="bg-surface-elevated mx-auto h-4 w-3/4 rounded" />
                  <div className="bg-surface-elevated mx-auto h-3 w-1/2 rounded" />
                  <div className="bg-surface-elevated mt-4 h-2.5 w-full rounded" />
                  <div className="bg-surface-elevated h-2.5 w-full rounded" />
                  <div className="bg-surface-elevated h-2.5 w-5/6 rounded" />
                  <div className="bg-surface-elevated/60 my-3 h-12 w-full rounded" />
                  <div className="bg-surface-elevated h-2.5 w-full rounded" />
                  <div className="bg-surface-elevated h-2.5 w-4/5 rounded" />
                </div>
              </div>
            ) : generationError ? (
              <div className="space-y-4 rounded-2xl border border-red-500/40 bg-red-500/5 p-5 sm:p-7 print:hidden">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-red-500/15 p-2.5 text-red-400">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="text-foreground text-base font-bold break-words">
                      Generatsiyada xatolik yuz berdi
                    </h3>
                    <p className="text-foreground-secondary text-xs leading-relaxed break-words sm:text-sm">
                      {generationError.message}
                    </p>
                  </div>
                </div>

                {generationError.creditRefunded && (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-semibold text-emerald-300">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span className="break-words">
                      Sarflangan AI limitingiz (kreditingiz) avtomatik tarzda hisobingizga
                      qaytarildi.
                    </span>
                  </div>
                )}

                <div className="flex flex-col gap-2.5 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => handleGenerate()}
                    className="flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-emerald-500 sm:text-sm"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Qayta urinish (Retry)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenerationError(null)}
                    className="border-border bg-surface text-foreground-secondary hover:text-foreground flex min-h-[44px] cursor-pointer items-center justify-center rounded-xl border px-4 py-2.5 text-xs font-semibold transition-colors"
                  >
                    Yopish
                  </button>
                </div>
              </div>
            ) : result ? (
              <div className="space-y-4">
                {/* Cross-Sell Slides Banner */}
                <Link
                  href={`/academic/presentation?topic=${encodeURIComponent(
                    formData.topic
                  )}&slides=${slidesCount}&type=referat`}
                  className="group flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-500/40 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent p-3.5 transition-all hover:border-emerald-500/70 print:hidden"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="shrink-0 rounded-lg bg-emerald-500/20 p-2 text-emerald-400">
                      <Presentation className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-foreground flex flex-wrap items-center gap-2 text-xs font-bold sm:text-sm">
                        <span className="break-words">
                          Referat taqdimoti (PPTX) tayyorlaysizmi?
                        </span>
                        <span className="shrink-0 rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                          {slidesCount} ta slayd
                        </span>
                      </div>
                      <div className="text-foreground-secondary text-[11px] break-words">
                        Referat matni asosida auditoriya oldida namoyish etish uchun slaydlar
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 text-xs font-bold text-emerald-400 transition-transform group-hover:translate-x-1">
                    <span>Slaydlar yaratish</span>
                    <span>→</span>
                  </div>
                </Link>

                <div className="border-border bg-surface flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between print:hidden">
                  <div className="text-foreground flex flex-wrap items-center gap-2 text-xs font-semibold">
                    <span>📄 {formData.workType} tayyor</span>
                    <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-400">
                      Taxminiy hajm: ~
                      {Math.max(
                        1,
                        Math.round((result.split(/\s+/).filter(Boolean).length || 0) / 270)
                      )}{" "}
                      bet ({result.split(/\s+/).filter(Boolean).length.toLocaleString()} so&apos;z)
                    </span>
                  </div>
                  <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
                    <button
                      onClick={handleDownloadDoc}
                      disabled={isDownloadingDocx}
                      className="flex min-h-[42px] cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-500 disabled:opacity-50"
                    >
                      {isDownloadingDocx ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <FileDown className="h-3.5 w-3.5" />
                      )}
                      <span>{isDownloadingDocx ? "Yuklanmoqda..." : "Word (.docx)"}</span>
                    </button>
                    <button
                      onClick={handleDownloadPdf}
                      disabled={isExportingPdf}
                      className="flex min-h-[42px] cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-red-500 disabled:opacity-50"
                      title="PDF faylni yuklab olish"
                    >
                      <FileDown className="h-3.5 w-3.5" />
                      <span>{isExportingPdf ? "PDF..." : "PDF (.pdf)"}</span>
                    </button>
                    <button
                      onClick={handleCopy}
                      className="border-border bg-surface-elevated text-foreground hover:bg-border/60 flex min-h-[42px] cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span>{copied ? "Nusxalandi" : "Nusxa"}</span>
                    </button>
                    <button
                      onClick={handlePrint}
                      className="border-border bg-surface-elevated text-foreground hover:bg-border/60 flex min-h-[42px] cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors"
                      title="Chop etish yoki PDF sifatida saqlash"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Chop etish</span>
                    </button>
                  </div>
                </div>

                <div
                  ref={documentRef}
                  className="border-border max-h-[800px] overflow-x-auto overflow-y-auto rounded-2xl border bg-white p-4 font-serif text-sm leading-relaxed break-words text-slate-900 shadow-xl sm:p-12 print:m-0 print:max-h-none print:overflow-visible print:border-0 print:p-0 print:text-black print:shadow-none"
                >
                  <div className="prose prose-slate max-w-none break-words text-slate-900 print:text-black">
                    {renderedMarkdown}
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-border bg-surface/40 flex min-h-[400px] flex-col items-center justify-center space-y-3 rounded-2xl border border-dashed p-6 text-center sm:p-12 print:hidden">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                  <Layers className="h-7 w-7" />
                </div>
                <h3 className="text-foreground text-base font-bold">
                  Referat matni shu yerda paydo bo&apos;ladi
                </h3>
                <p className="text-foreground-secondary max-w-md text-xs sm:text-sm">
                  Fan nomi va mavzuni kiriting, generatsiya tugmasini bosing. Tayyor hujjatni Word
                  yoki PDF sifatida yuklab oling.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print Specific CSS */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 20mm 20mm 20mm 25mm;
          }
          body {
            background-color: white !important;
            color: black !important;
          }
          header,
          nav,
          footer,
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
