"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Presentation,
  Sparkles,
  Download,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  FileText,
  Volume2,
  RotateCcw,
  Palette,
  Layers,
  Lightbulb,
  FileCheck2,
  Plus,
  Trash2,
  Edit3,
  Minus,
  GraduationCap,
  Award,
  CheckSquare,
  Save,
  X,
  Globe2,
} from "lucide-react";
import { StudentSubNav } from "@/components/academic/student-sub-nav";
import { useToast } from "@/hooks/use-toast";
import { SlideItem } from "@/app/api/academic/presentation/route";
import { UpgradeModal } from "@/components/modals/upgrade-modal";

type PresentationStyle = "academic" | "modern" | "minimalist";

interface StyleOption {
  id: PresentationStyle;
  title: string;
  desc: string;
  bgPreview: string;
  cardClass: string;
  canvasBg: string;
  textColor: string;
  accentColor: string;
  badgeClass: string;
  pptxBg: string;
  pptxText: string;
  pptxAccent: string;
}

const STYLE_OPTIONS: StyleOption[] = [
  {
    id: "academic",
    title: "Akademik (Standart)",
    desc: "OTM himoyasi va ilmiy komissiya uchun qat'iy va nufuzli uslub",
    bgPreview: "from-[#0B192C] to-[#1E3E62]",
    cardClass: "border-amber-500/30 hover:border-amber-500",
    canvasBg: "bg-gradient-to-br from-[#0B192C] via-[#102A43] to-[#1E3E62]",
    textColor: "text-slate-100",
    accentColor: "text-amber-400",
    badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    pptxBg: "0B192C",
    pptxText: "F1F5F9",
    pptxAccent: "F59E0B",
  },
  {
    id: "modern",
    title: "Zamonaviy (Modern)",
    desc: "Konferensiyalar, xalqaro forumlar va startaplar uchun zamonaviy dizayn",
    bgPreview: "from-[#0F172A] to-[#312E81]",
    cardClass: "border-indigo-500/30 hover:border-indigo-500",
    canvasBg: "bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#312E81]",
    textColor: "text-white",
    accentColor: "text-cyan-400",
    badgeClass: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    pptxBg: "0F172A",
    pptxText: "FFFFFF",
    pptxAccent: "06B6D4",
  },
  {
    id: "minimalist",
    title: "Minimalist (Lakonik)",
    desc: "Monoxrom, qora-oq yuqori kontrast va maksimal aniqlik",
    bgPreview: "from-[#18181B] to-[#27272A]",
    cardClass: "border-slate-600/40 hover:border-slate-400",
    canvasBg: "bg-zinc-950",
    textColor: "text-zinc-100",
    accentColor: "text-emerald-400",
    badgeClass: "bg-zinc-800 text-zinc-300 border-zinc-700",
    pptxBg: "18181B",
    pptxText: "FAFAFA",
    pptxAccent: "10B981",
  },
];

// Bo'limlar ro'yxati (2-rasmdagi barcha bo'limlar)
const ACADEMIC_MODULE_OPTIONS = [
  {
    id: "coursework",
    label: "Kurs ishi",
    icon: GraduationCap,
    defaultSlides: 10,
    desc: "Kurs ishi himoyasi uchun 8-15 ta slayd",
  },
  {
    id: "diplom",
    label: "Diplom (BMI)",
    icon: Award,
    defaultSlides: 15,
    desc: "BMI va magistrlik dissertatsiyasi himoyasi",
  },
  {
    id: "referat",
    label: "Referat & Mustaqil",
    icon: FileText,
    defaultSlides: 8,
    desc: "Mustaqil ta'lim va referatlar taqdimoti",
  },
  {
    id: "exam",
    label: "Imtihon & Test",
    icon: CheckSquare,
    defaultSlides: 12,
    desc: "Bilet savollari va vizual ko'rgazmalar",
  },
  {
    id: "mock",
    label: "Mock Test & Tillar",
    icon: Globe2,
    defaultSlides: 10,
    desc: "IELTS / CEFR taqdimotlari",
  },
];

const SUGGESTED_TOPICS = [
  "Raqamli iqtisodiyot sharoitida bank xizmatlarini transformatsiya qilish",
  "Sun'iy intellekt va mashinali o'rganish texnologiyalarini ta'limga tatbiq etish",
  "O'zbekistonda yashil energetikani rivojlantirishning iqtisodiy samaradorligi",
  "Kiberxavfsizlik tahdidlari va axborot tizimlarini himoyalash mexanizmlari",
  "Zamonaviy korporativ boshqaruvda moliyaviy barqarorlikni ta'minlash",
];

const GENERATION_STEPS = [
  "Tadqiqot mavzusi va ilmiy apparati tahlil qilinmoqda...",
  "Slaydlar ketma-ketligi va reja tuzilmoqda...",
  "Har bir slayd uchun asosiy ilmiy tezislar shakllantirilmoqda...",
  "Ma'ruzachi nutqi (Speaker Notes - nutq matni) yozilmoqda...",
  "PowerPoint (.pptx) va grafik bloklar integratsiyasi tayyorlanmoqda...",
];

function PresentationContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Wizard state
  const [topic, setTopic] = useState(() => searchParams.get("topic") || "");
  const [sourceText, setSourceText] = useState("");
  const [showSourceText, setShowSourceText] = useState(false);
  const [slidesCount, setSlidesCount] = useState<number>(10);
  const [selectedStyle, setSelectedStyle] = useState<PresentationStyle>("academic");
  const [presentationType, setPresentationType] = useState<string>(
    () => searchParams.get("type") || "coursework"
  );
  const [language, setLanguage] = useState<"uz" | "uz-cyrl" | "ru" | "en">("uz");

  // Output & viewer state
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [slides, setSlides] = useState<SlideItem[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isExportingPptx, setIsExportingPptx] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [presentationViewMode, setPresentationViewMode] = useState<"single" | "all">("single");
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeErrorMsg, setUpgradeErrorMsg] = useState("");

  // Slide inline editor state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editSubtitle, setEditSubtitle] = useState("");
  const [editBulletPoints, setEditBulletPoints] = useState("");
  const [editSpeakerNotes, setEditSpeakerNotes] = useState("");

  const slideRef = useRef<HTMLDivElement>(null);
  const deckExportRef = useRef<HTMLDivElement>(null);

  // Animated progress tracker
  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      setActiveStepIndex((prev) => (prev < GENERATION_STEPS.length - 1 ? prev + 1 : prev));
    }, 2500);
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Keyboard navigation
  useEffect(() => {
    if (slides.length === 0 || isEditing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        setCurrentSlideIndex((prev) => (prev < slides.length - 1 ? prev + 1 : prev));
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : prev));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [slides.length, isEditing]);

  const activeStyleConfig = STYLE_OPTIONS.find((s) => s.id === selectedStyle) || STYLE_OPTIONS[0];
  const currentSlide = slides[currentSlideIndex];

  // Generate presentation
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast({
        title: "Mavzu kiritilmadi",
        description: "Iltimos, taqdimot mavzusini kiriting.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setSlides([]);
    setIsEditing(false);

    try {
      const response = await fetch("/api/academic/presentation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          sourceText: sourceText.trim(),
          slidesCount,
          style: selectedStyle,
          language,
          presentationType,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        if (response.status === 403 || data.requireUpgrade) {
          const quotaMsg =
            data.upgradeMessage ||
            "Prezentatsiya yaratish bo'yicha bepul limitingiz tugadi. Pro yoki Premium tarifga o'ting.";
          setUpgradeErrorMsg(quotaMsg);
          setIsUpgradeModalOpen(true);
          toast({
            title: "AI limitingiz tugadi ⚡",
            description: quotaMsg,
            variant: "destructive",
          });
          return;
        }
        throw new Error(
          data.upgradeMessage || data.error || "Prezentatsiya yaratishda xatolik yuz berdi."
        );
      }

      setSlides(data.slides);
      setCurrentSlideIndex(0);
      toast({
        title: "Prezentatsiya tayyor! 🎓",
        description: `${data.slides.length} ta slayd va ma'ruzachi nutqlari muvaffaqiyatli yaratildi.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Xatolik yuz berdi";
      toast({
        title: "Xatolik yuz berdi",
        description:
          msg.includes("fetch") || msg.includes("network")
            ? "Tarmoqda uzilish yuz berdi. Internet aloqasini tekshirib, qayta urinib ko'ring."
            : msg,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Add a new custom slide dynamically
  const handleAddNewSlide = () => {
    const newSlideNum = slides.length + 1;
    const newSlide: SlideItem = {
      slideNumber: newSlideNum,
      type: "content",
      title: `Yangi ilmiy slayd #${newSlideNum}`,
      subtitle: "Amaliy tahlil yoki qo'shimcha ilmiy ma'lumot",
      badge: `0${newSlideNum} / Qo'shimcha`,
      bulletPoints: [
        "Yangi asosiy ilmiy tezis va tahliliy dalil",
        "Amaliyotdagi muammolar va statistik ko'rsatkichlar",
        "Taklif etilayotgan yondashuv va natijalar",
      ],
      speakerNotes:
        "Hurmatli komissiya a'zolari! Ushbu qo'shimcha slaydda tadqiqotimizning muhim amaliy natijalarini ko'rib chiqamiz...",
      highlightMetric: `#${newSlideNum}`,
    };

    setSlides((prev) => [...prev, newSlide]);
    setCurrentSlideIndex(slides.length);
    toast({
      title: "Yangi slayd qo'shildi!",
      description: `Slayd ${newSlideNum} muvaffaqiyatli qo'shildi. Matnlarni tahrirlashingiz mumkin.`,
    });
  };

  // Delete current slide
  const handleDeleteCurrentSlide = () => {
    if (slides.length <= 1) {
      toast({
        title: "O'chirib bo'lmaydi",
        description: "Prezentatsiyada kamida 1 ta slayd bo'lishi kerak.",
        variant: "destructive",
      });
      return;
    }

    setSlides((prev) => {
      const filtered = prev.filter((_, idx) => idx !== currentSlideIndex);
      return filtered.map((s, idx) => ({ ...s, slideNumber: idx + 1 }));
    });
    setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
    setIsEditing(false);
    toast({
      title: "Slayd o'chirildi",
    });
  };

  // Start Editing Slide
  const handleStartEdit = () => {
    if (!currentSlide) return;
    setEditTitle(currentSlide.title);
    setEditSubtitle(currentSlide.subtitle || "");
    setEditBulletPoints(currentSlide.bulletPoints.join("\n"));
    setEditSpeakerNotes(currentSlide.speakerNotes || "");
    setIsEditing(true);
  };

  // Save Edited Slide
  const handleSaveEdit = () => {
    if (!currentSlide) return;
    const points = editBulletPoints
      .split("\n")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    setSlides((prev) =>
      prev.map((s, idx) =>
        idx === currentSlideIndex
          ? {
              ...s,
              title: editTitle.trim() || s.title,
              subtitle: editSubtitle.trim() || undefined,
              bulletPoints: points.length > 0 ? points : s.bulletPoints,
              speakerNotes: editSpeakerNotes.trim() || s.speakerNotes,
            }
          : s
      )
    );
    setIsEditing(false);
    toast({
      title: "Slayd yangilandi!",
      description: "O'zgarishlar muvaffaqiyatli saqlandi.",
    });
  };

  // Export genuine PowerPoint (.pptx)
  const handleExportPptx = async () => {
    if (slides.length === 0) return;
    setIsExportingPptx(true);

    try {
      const pptxgen = (await import("pptxgenjs")).default;
      const pres = new pptxgen();

      pres.layout = "LAYOUT_16x9";
      pres.author = "DocNova Academic Studio";
      pres.title = topic;

      const styleConf = activeStyleConfig;

      slides.forEach((s) => {
        const slide = pres.addSlide();
        slide.background = { color: styleConf.pptxBg };

        // Header Category Badge
        slide.addText(s.badge || `SLAYD ${s.slideNumber}`, {
          x: 0.8,
          y: 0.5,
          w: 4.0,
          h: 0.35,
          fontSize: 10,
          color: styleConf.pptxAccent,
          bold: true,
          fontFace: "Calibri",
        });

        // Main Slide Title
        slide.addText(s.title, {
          x: 0.8,
          y: 0.9,
          w: 8.4,
          h: 0.8,
          fontSize: s.type === "title" ? 26 : 22,
          color: styleConf.pptxText,
          bold: true,
          fontFace: "Arial",
          wrap: true,
        });

        // Subtitle if available
        if (s.subtitle) {
          slide.addText(s.subtitle, {
            x: 0.8,
            y: 1.7,
            w: 8.4,
            h: 0.4,
            fontSize: 13,
            color: "94A3B8",
            italic: true,
            fontFace: "Calibri",
          });
        }

        // Bullet Points
        const bulletData = s.bulletPoints.map((text) => ({
          text: `  ${text}`,
          options: {
            bullet: { type: "bullet" as const },
            breakLine: true,
            fontSize: 14,
            color: "E2E8F0",
            paraSpaceAfter: 12,
            fontFace: "Calibri",
          },
        }));

        slide.addText(bulletData, {
          x: 0.8,
          y: s.subtitle ? 2.2 : 1.9,
          w: 8.4,
          h: 2.8,
          valign: "top",
        });

        // Highlight Metric Badge (Right Corner)
        if (s.highlightMetric) {
          slide.addText(s.highlightMetric, {
            x: 7.2,
            y: 0.5,
            w: 2.0,
            h: 0.35,
            fontSize: 11,
            color: styleConf.pptxAccent,
            align: "right",
            bold: true,
          });
        }

        // Footer info
        slide.addText(`DocNova.uz • ${s.slideNumber} / ${slides.length}`, {
          x: 0.8,
          y: 5.1,
          w: 8.4,
          h: 0.3,
          fontSize: 9,
          color: "64748B",
          fontFace: "Calibri",
        });

        // Native PowerPoint Speaker Notes
        if (s.speakerNotes) {
          slide.addNotes(s.speakerNotes);
        }
      });

      const cleanFilename = topic.replace(/[^a-zA-Z0-9_\-]/g, "_").slice(0, 40);
      await pres.writeFile({ fileName: `Prezentatsiya_${cleanFilename}.pptx` });

      toast({
        title: "PowerPoint yuklandi!",
        description: ".pptx fayli ma'ruzachi eslatmalari bilan birga tayyorlandi.",
      });
    } catch (err: unknown) {
      console.error("[PPTX_EXPORT_ERROR]", err);
      toast({
        title: "Eksportda xatolik",
        description: "PowerPoint faylini yuklab olishda muammo yuz berdi.",
        variant: "destructive",
      });
    } finally {
      setIsExportingPptx(false);
    }
  };

  // Export genuine Presentation PDF (All slides with speaker notes in A4 landscape)
  const handleExportPdf = async () => {
    if (slides.length === 0) return;
    setIsExportingPdf(true);

    const prevMode = presentationViewMode;
    try {
      if (prevMode !== "all") {
        setPresentationViewMode("all");
        await new Promise((resolve) => setTimeout(resolve, 250));
      }

      const html2pdfModule = await import("html2pdf.js");
      const html2pdf = html2pdfModule.default || html2pdfModule;

      const element = deckExportRef.current;
      if (!element) throw new Error("Slaydlar maydoni topilmadi");

      element.classList.add("presentation-pdf-mode");

      const cleanFilename = topic.replace(/[^a-zA-Z0-9_\-]/g, "_").slice(0, 40) || "Prezentatsiya";

      const opt = {
        margin: 0,
        filename: `Prezentatsiya_${cleanFilename}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          scrollY: 0,
        },
        jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "landscape" as const },
        pagebreak: { mode: ["css", "legacy"], after: ".presentation-pdf-slide" },
      };

      await html2pdf().from(element).set(opt).save();

      element.classList.remove("presentation-pdf-mode");

      toast({
        title: "PDF muvaffaqiyatli yuklab olindi! 📄",
        description: `Barcha ${slides.length} ta slayd va ma'ruzachi nutqi A4 Landscape formatida saqlandi.`,
      });
    } catch (err: unknown) {
      console.error("[PDF_EXPORT_ERROR]", err);
      toast({
        title: "PDF yaratishda xatolik",
        description: "Prezentatsiya PDF faylini saqlashda muammo yuz berdi.",
        variant: "destructive",
      });
    } finally {
      if (prevMode !== "all") {
        setPresentationViewMode(prevMode);
      }
      setIsExportingPdf(false);
    }
  };

  // Copy All Slides to Clipboard
  const handleCopyAll = async () => {
    if (slides.length === 0) return;
    const text = slides
      .map(
        (s) =>
          `=== SLAYD ${s.slideNumber}: ${s.title.toUpperCase()} ===\n` +
          (s.subtitle ? `Qism: ${s.subtitle}\n` : "") +
          `Tezislar:\n${s.bulletPoints.map((b) => `• ${b}`).join("\n")}\n\n` +
          `🎤 Ma'ruzachi nutqi (Speaker Notes):\n${s.speakerNotes}\n`
      )
      .join("\n" + "-".repeat(40) + "\n\n");

    await navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    toast({
      title: "Nusxalandi!",
      description: "Barcha slaydlar va ma'ruzachi nutqlari buferga olindi.",
    });
  };

  // Browser Fullscreen presentation mode
  const handleToggleFullscreen = () => {
    if (!slideRef.current) return;
    if (!document.fullscreenElement) {
      slideRef.current.requestFullscreen().catch((err) => {
        console.error(err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.error(err);
      });
    }
  };

  return (
    <div className="bg-background text-foreground min-h-screen pb-20">
      {/* Sub Nav */}
      <StudentSubNav activeTab="presentation" />

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-primary/10 border-primary/20 text-primary mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold">
            <Presentation className="h-4 w-4" />
            <span>PowerPoint (.pptx) & AI Generator</span>
          </div>
          <h1 className="text-foreground flex items-center gap-3 text-2xl font-bold tracking-tight sm:text-3xl">
            Prezentatsiya va Slaydlar Yaratuvchi
            <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
              Istalgancha slayd
            </span>
          </h1>
          <p className="text-foreground-secondary mt-2 max-w-3xl text-sm sm:text-base">
            Kurs ishi, diplom (BMI), referat yoki imtihonlar uchun o&apos;zingiz xohlagancha slayd
            qo&apos;shing, har bir slayd uchun ilmiy tezislar va ma&apos;ruzachi nutqini (Speaker
            Notes) 1-bosishda tayyorlang.
          </p>
        </div>

        {/* Studio Grid: Left Form & Right Deck */}
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* LEFT: Parameters Form */}
          <div
            className={`${slides.length > 0 ? "lg:col-span-4" : "lg:col-span-7"} transition-all duration-300`}
          >
            <div className="border-border bg-surface-card rounded-2xl border p-5 shadow-sm sm:p-6">
              <form onSubmit={handleGenerate} className="space-y-5">
                {/* 2-RASMDAGI BARCHA BO'LIMLAR TANLOVI */}
                <div>
                  <label className="text-foreground-secondary mb-1.5 block text-xs font-semibold">
                    Qaysi akademik bo&apos;lim uchun slaydlar tayyorlanmoqda?
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {ACADEMIC_MODULE_OPTIONS.map((mod) => (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => {
                          setPresentationType(mod.id);
                          setSlidesCount(mod.defaultSlides);
                        }}
                        className={`flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 text-left text-xs font-semibold transition-all ${
                          presentationType === mod.id
                            ? "border-primary bg-primary/10 text-primary ring-primary shadow-sm ring-1"
                            : "border-border bg-background text-foreground-secondary hover:bg-surface-elevated"
                        }`}
                      >
                        <mod.icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{mod.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Topic Input */}
                <div>
                  <label className="text-foreground-secondary mb-1 block text-xs font-semibold">
                    Prezentatsiya mavzusi *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Masalan: Raqamli iqtisodiyot sharoitida bank xizmatlarini transformatsiya qilish..."
                    className="border-border bg-background text-foreground focus:border-primary w-full rounded-xl border px-3.5 py-2.5 text-xs leading-snug focus:outline-none sm:text-sm"
                  />

                  {/* Topic Suggestions Chips */}
                  <div className="mt-2">
                    <span className="text-foreground-muted mb-1.5 flex items-center gap-1 text-[11px] font-semibold">
                      <Lightbulb className="h-3 w-3 text-amber-400" />
                      <span>Tavsiya etilgan mavzular:</span>
                    </span>
                    <div className="space-y-1">
                      {SUGGESTED_TOPICS.slice(0, 3).map((item, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setTopic(item)}
                          className="border-border/70 bg-surface-elevated/70 hover:bg-primary/10 hover:border-primary/40 text-foreground-secondary hover:text-foreground block w-full cursor-pointer truncate rounded-lg border px-2.5 py-1.5 text-left text-[11px] transition-all"
                        >
                          → {item}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* SLAYDLAR SONI: FOYDALANUVCHI O'ZI XOHLAGANCHA QO'SHADI */}
                <div className="border-primary/20 bg-primary/5 space-y-3 rounded-xl border p-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-foreground block text-xs font-bold">
                        Slaydlar soni
                      </label>
                      <span className="text-foreground-muted text-[11px]">
                        Istalgancha slayd belgilashingiz mumkin (1 dan 100 tagacha)
                      </span>
                    </div>
                    <span className="text-primary bg-primary/10 border-primary/30 rounded-lg border px-3 py-1 text-sm font-extrabold">
                      {slidesCount} ta slayd
                    </span>
                  </div>

                  {/* Stepper & Direct Custom Number Input */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSlidesCount((prev) => Math.max(1, prev - 1))}
                      className="border-border bg-background hover:bg-surface-elevated text-foreground flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border text-sm font-bold transition-all"
                      title="1 ta kamaytirish"
                    >
                      <Minus className="h-4 w-4" />
                    </button>

                    <div className="relative flex-1">
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={slidesCount}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val)) {
                            setSlidesCount(Math.min(100, Math.max(1, val)));
                          }
                        }}
                        className="border-border bg-background text-foreground focus:border-primary h-9 w-full rounded-lg border px-3 text-center text-sm font-bold focus:outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setSlidesCount((prev) => Math.min(100, prev + 1))}
                      className="border-border bg-background hover:bg-surface-elevated text-foreground flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border text-sm font-bold transition-all"
                      title="1 ta qo'shish"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Quick Preset Pills */}
                  <div>
                    <span className="text-foreground-muted mb-1.5 block text-[10px] font-bold tracking-wider uppercase">
                      Tezkor parametrlar:
                    </span>
                    <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-8">
                      {[5, 10, 15, 20, 25, 30, 50, 100].map((cnt) => (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => setSlidesCount(cnt)}
                          className={`cursor-pointer rounded-lg border py-1.5 text-xs font-semibold transition-all ${
                            slidesCount === cnt
                              ? "bg-primary border-primary text-white shadow-sm"
                              : "bg-background border-border text-foreground hover:bg-surface-elevated"
                          }`}
                        >
                          {cnt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Optional Raw Coursework Text Accordion */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowSourceText(!showSourceText)}
                    className="text-primary flex cursor-pointer items-center gap-1.5 text-xs font-semibold hover:underline"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>
                      {showSourceText
                        ? "Kurs ishi yoki diplom matnini yashirish"
                        : "+ Kurs ishi, diplom yoki referat matnini kiritish (ixtiyoriy)"}
                    </span>
                  </button>

                  {showSourceText && (
                    <div className="mt-2">
                      <textarea
                        rows={4}
                        value={sourceText}
                        onChange={(e) => setSourceText(e.target.value)}
                        placeholder="Kurs ishingiz yoki referatingizdan parcha nusxalang. AI slaydlar va ma'ruzachi nutqini ushbu matnga to'liq asoslab beradi..."
                        className="border-border bg-background text-foreground focus:border-primary w-full rounded-xl border px-3 py-2 text-xs focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Design Style Selector */}
                <div>
                  <label className="text-foreground-secondary mb-2 block flex items-center gap-1.5 text-xs font-semibold">
                    <Palette className="text-primary h-3.5 w-3.5" />
                    <span>Dizayn va Ranglar uslubi</span>
                  </label>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    {STYLE_OPTIONS.map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setSelectedStyle(style.id)}
                        className={`relative cursor-pointer rounded-xl border p-3 text-left transition-all ${
                          selectedStyle === style.id
                            ? "border-primary bg-primary/10 ring-primary shadow-sm ring-1"
                            : "border-border bg-background hover:bg-surface-elevated"
                        }`}
                      >
                        <div
                          className={`h-2 w-full rounded-full bg-gradient-to-r ${style.bgPreview} mb-2`}
                        />
                        <div className="text-foreground text-xs font-bold">{style.title}</div>
                        <div className="text-foreground-muted mt-0.5 line-clamp-2 text-[10px] leading-snug">
                          {style.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language Selection */}
                <div>
                  <label className="text-foreground-secondary mb-1 block text-xs font-semibold">
                    Yozish tili
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { id: "uz" as const, label: "O'zbek", flag: "🇺🇿" },
                      { id: "ru" as const, label: "Русский", flag: "🇷🇺" },
                      { id: "en" as const, label: "English", flag: "🇬🇧" },
                    ].map((lang) => (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => setLanguage(lang.id)}
                        className={`flex cursor-pointer items-center justify-center gap-1 rounded-lg border py-2 text-xs font-semibold transition-all ${
                          language === lang.id
                            ? "bg-primary border-primary text-white"
                            : "bg-background border-border text-foreground hover:bg-surface-elevated"
                        }`}
                      >
                        <span className="text-xs">{lang.flag}</span>
                        <span className="truncate">{lang.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="bg-primary hover:bg-primary-hover flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold text-white shadow-md transition-all disabled:opacity-50 sm:text-sm"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>
                    {isGenerating
                      ? "Slaydlar yaratilmoqda..."
                      : `Prezentatsiyani Generatsiya Qilish (${slidesCount} ta slayd)`}
                  </span>
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT: Slide Deck Preview & Actions */}
          <div
            className={`${slides.length > 0 ? "lg:col-span-8" : "lg:col-span-5"} transition-all duration-300`}
          >
            {isGenerating && (
              <div className="border-border bg-surface-card space-y-6 rounded-2xl border p-8 text-center">
                <div className="bg-primary/10 border-primary/20 text-primary inline-flex animate-pulse rounded-2xl border p-4">
                  <Presentation className="h-10 w-10 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-foreground text-lg font-bold">
                    Prezentatsiya va Ma&apos;ruzachi nutqi yaratilmoqda...
                  </h3>
                  <p className="text-foreground-secondary mt-1 text-xs">
                    Google Gemini AI {slidesCount} ta slayd va har bir slayd uchun nutq matnini
                    tayyorlamoqda
                  </p>
                </div>

                {/* Generation Steps */}
                <div className="mx-auto max-w-md space-y-2 text-left">
                  {GENERATION_STEPS.map((step, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 rounded-lg border p-2 text-xs transition-all ${
                        idx === activeStepIndex
                          ? "bg-primary/10 border-primary text-primary font-bold shadow-sm"
                          : idx < activeStepIndex
                            ? "border-emerald-500/30 bg-emerald-500/10 font-medium text-emerald-400"
                            : "bg-surface-elevated/40 border-border/40 text-foreground-muted"
                      }`}
                    >
                      {idx < activeStepIndex ? (
                        <FileCheck2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      ) : (
                        <div
                          className={`h-2 w-2 shrink-0 rounded-full ${
                            idx === activeStepIndex ? "bg-primary animate-ping" : "bg-border"
                          }`}
                        />
                      )}
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isGenerating && slides.length === 0 && (
              <div className="border-border/80 bg-surface-card/40 space-y-4 rounded-2xl border border-dashed p-10 text-center">
                <div className="bg-surface-elevated text-foreground-muted mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
                  <Layers className="h-7 w-7" />
                </div>
                <h3 className="text-foreground text-base font-bold">
                  Prezentatsiya maydoni bo&apos;sh
                </h3>
                <p className="text-foreground-secondary mx-auto max-w-sm text-xs leading-relaxed">
                  Chap tomondagi maydonga mavzuni kiriting va o&apos;zingiz xohlagancha slayd sonini
                  belgilang (masalan: 8, 10, 15 yoki 30 ta). AI sizga PowerPoint (.pptx) formati va
                  ma&apos;ruzachi nutqini tayyorlab beradi.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <span className="bg-surface-elevated border-border text-foreground-secondary rounded-full border px-2.5 py-1 text-[11px]">
                    PowerPoint (.pptx)
                  </span>
                  <span className="bg-surface-elevated border-border text-foreground-secondary rounded-full border px-2.5 py-1 text-[11px]">
                    Speaker Notes (Nutq)
                  </span>
                  <span className="bg-surface-elevated border-border text-foreground-secondary rounded-full border px-2.5 py-1 text-[11px]">
                    Istalgancha slayd qo&apos;shish
                  </span>
                </div>
              </div>
            )}

            {!isGenerating && slides.length > 0 && currentSlide && (
              <div className="space-y-4">
                {/* Actions Toolbar */}
                <div className="border-border bg-surface-card flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-foreground text-xs font-semibold">
                      Slayd {currentSlideIndex + 1} / {slides.length}
                    </span>
                    <span className="text-foreground-muted text-xs">
                      • {activeStyleConfig.title}
                    </span>

                    {/* View Mode Toggle */}
                    <div className="border-border bg-surface-elevated/80 flex items-center rounded-lg border p-0.5">
                      <button
                        type="button"
                        onClick={() => setPresentationViewMode("single")}
                        className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                          presentationViewMode === "single"
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-foreground-secondary hover:text-foreground"
                        }`}
                      >
                        Bitta slayd
                      </button>
                      <button
                        type="button"
                        onClick={() => setPresentationViewMode("all")}
                        className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                          presentationViewMode === "all"
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-foreground-secondary hover:text-foreground"
                        }`}
                      >
                        Barcha slaydlar ({slides.length})
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Add Slide Button */}
                    <button
                      type="button"
                      onClick={handleAddNewSlide}
                      className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/30 flex cursor-pointer items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-all"
                      title="Yangi slayd qo'shish"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>+ Slayd qo&apos;shish</span>
                    </button>

                    {/* Edit Slide Button */}
                    <button
                      type="button"
                      onClick={() => (isEditing ? setIsEditing(false) : handleStartEdit())}
                      className={`flex cursor-pointer items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all ${
                        isEditing
                          ? "border-amber-500/40 bg-amber-500/20 text-amber-300"
                          : "bg-surface-elevated border-border text-foreground-secondary"
                      }`}
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>{isEditing ? "Yopish" : "Tahrirlash"}</span>
                    </button>

                    {/* Delete Slide Button */}
                    {slides.length > 1 && (
                      <button
                        type="button"
                        onClick={handleDeleteCurrentSlide}
                        className="flex cursor-pointer items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1.5 text-xs font-semibold text-red-400 transition-all hover:bg-red-500/20"
                        title="Ushbu slaydni o'chirish"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}

                    {/* Speaker Notes Toggle */}
                    <button
                      type="button"
                      onClick={() => setShowSpeakerNotes(!showSpeakerNotes)}
                      className={`flex cursor-pointer items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all ${
                        showSpeakerNotes
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                          : "bg-surface-elevated border-border text-foreground-secondary"
                      }`}
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                      <span>Nutq matni</span>
                    </button>

                    {/* Copy All */}
                    <button
                      type="button"
                      onClick={handleCopyAll}
                      className="border-border bg-surface-elevated hover:bg-surface-elevated/80 text-foreground flex cursor-pointer items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold"
                    >
                      {isCopied ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span>{isCopied ? "Nusxalandi" : "Nusxa"}</span>
                    </button>

                    {/* Fullscreen Preview */}
                    <button
                      type="button"
                      onClick={handleToggleFullscreen}
                      className="border-border bg-surface-elevated hover:bg-surface-elevated/80 text-foreground flex cursor-pointer items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold"
                      title="To'liq ekranda ko'rish"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                    </button>

                    {/* Export PDF */}
                    <button
                      type="button"
                      onClick={handleExportPdf}
                      disabled={isExportingPdf}
                      className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-red-500 disabled:opacity-50"
                      title="Barcha slaydlarni PDF formatida yuklab olish"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>{isExportingPdf ? "PDF..." : "PDF (.pdf)"}</span>
                    </button>

                    {/* Export PowerPoint (.pptx) */}
                    <button
                      type="button"
                      onClick={handleExportPptx}
                      disabled={isExportingPptx}
                      className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-500 disabled:opacity-50"
                      title="PowerPoint faylini yuklab olish"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>{isExportingPptx ? "Eksport..." : "PowerPoint (.pptx)"}</span>
                    </button>
                  </div>
                </div>

                {/* INLINE SLIDE EDITOR (When Edit Mode is Active) */}
                {isEditing && (
                  <div className="border-primary/30 bg-surface-card space-y-3 rounded-2xl border p-4 shadow-lg">
                    <div className="border-border flex items-center justify-between border-b pb-2">
                      <span className="text-primary flex items-center gap-1.5 text-xs font-bold">
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Slayd #{currentSlide.slideNumber} matnini tahrirlash</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="border-border hover:bg-surface-elevated text-foreground-secondary flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-xs"
                        >
                          <X className="h-3 w-3" />
                          <span>Bekor qilish</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveEdit}
                          className="bg-primary hover:bg-primary-hover flex cursor-pointer items-center gap-1 rounded-md px-3 py-1 text-xs font-bold text-white"
                        >
                          <Save className="h-3 w-3" />
                          <span>Saqlash</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-foreground-secondary mb-1 block text-[11px] font-semibold">
                          Slayd sarlavhasi
                        </label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="border-border bg-background text-foreground focus:border-primary w-full rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-foreground-secondary mb-1 block text-[11px] font-semibold">
                          Kichik sarlavha (subtitle)
                        </label>
                        <input
                          type="text"
                          value={editSubtitle}
                          onChange={(e) => setEditSubtitle(e.target.value)}
                          className="border-border bg-background text-foreground focus:border-primary w-full rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-foreground-secondary mb-1 block text-[11px] font-semibold">
                        Asosiy tezislar (har bir qator alohida nuqta bo&apos;ladi)
                      </label>
                      <textarea
                        rows={3}
                        value={editBulletPoints}
                        onChange={(e) => setEditBulletPoints(e.target.value)}
                        className="border-border bg-background text-foreground focus:border-primary w-full rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-foreground-secondary mb-1 block text-[11px] font-semibold">
                        Ma&apos;ruzachi nutqi (Speaker Notes)
                      </label>
                      <textarea
                        rows={2}
                        value={editSpeakerNotes}
                        onChange={(e) => setEditSpeakerNotes(e.target.value)}
                        className="border-border bg-background text-foreground focus:border-primary w-full rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* VIEW MODE: ALL SLIDES (Grid / Printable Stack with deckExportRef) */}
                {presentationViewMode === "all" ? (
                  <div ref={deckExportRef} className="presentation-pdf-deck space-y-6">
                    {slides.map((s, idx) => (
                      <div
                        key={idx}
                        className={`presentation-pdf-slide border-border/80 relative flex aspect-[16/9] w-full flex-col justify-between overflow-hidden rounded-2xl border p-6 shadow-xl sm:p-8 ${activeStyleConfig.canvasBg}`}
                        style={{ pageBreakAfter: "always", breakAfter: "page" }}
                      >
                        {/* Top Bar */}
                        <div className="relative z-10 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-md border px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase sm:text-xs ${activeStyleConfig.badgeClass}`}
                            >
                              {s.badge || `0${s.slideNumber} / Modul`}
                            </span>
                            {s.subtitle && (
                              <span className="text-[11px] font-medium text-slate-300/80 italic sm:text-xs">
                                • {s.subtitle}
                              </span>
                            )}
                          </div>

                          {s.highlightMetric && (
                            <span
                              className={`rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-xs font-extrabold backdrop-blur-md sm:text-sm ${activeStyleConfig.accentColor}`}
                            >
                              {s.highlightMetric}
                            </span>
                          )}
                        </div>

                        {/* Slide Content */}
                        <div className="relative z-10 my-auto py-3">
                          <h2
                            className={`text-lg font-extrabold tracking-tight sm:text-2xl ${activeStyleConfig.textColor} mb-3 leading-tight`}
                          >
                            {s.title}
                          </h2>

                          <div className="space-y-2">
                            {s.bulletPoints.map((point, pIdx) => (
                              <div key={pIdx} className="flex items-start gap-2.5">
                                <span
                                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                                    selectedStyle === "academic"
                                      ? "bg-amber-400"
                                      : selectedStyle === "modern"
                                        ? "bg-cyan-400"
                                        : "bg-emerald-400"
                                  }`}
                                />
                                <p className="text-xs leading-relaxed font-normal text-slate-200/95 sm:text-sm">
                                  {point}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Speaker Notes */}
                        {showSpeakerNotes && s.speakerNotes && (
                          <div className="relative z-10 mt-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[11px] text-amber-200/90 italic">
                            <span className="font-bold text-amber-300 not-italic">
                              🎤 Nutq matni:{" "}
                            </span>
                            &quot;{s.speakerNotes}&quot;
                          </div>
                        )}

                        {/* Footer */}
                        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-2.5 text-[10px] text-slate-400">
                          <span>DocNova Academic Studio • {topic.slice(0, 45)}</span>
                          <span>
                            Slayd {s.slideNumber} / {slides.length}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {/* ACTIVE SLIDE CANVAS (16:9 Aspect Ratio) */}
                    <div
                      ref={slideRef}
                      className={`border-border/80 relative flex aspect-[16/9] w-full flex-col justify-between overflow-hidden rounded-2xl border p-6 shadow-2xl sm:p-10 ${activeStyleConfig.canvasBg}`}
                    >
                      {/* Decorative backdrop shapes */}
                      <div className="pointer-events-none absolute top-0 right-0 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
                      <div className="bg-primary/10 pointer-events-none absolute bottom-0 left-0 h-60 w-60 rounded-full blur-2xl" />

                      {/* Top Bar of Slide */}
                      <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-md border px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase sm:text-xs ${activeStyleConfig.badgeClass}`}
                          >
                            {currentSlide.badge || `0${currentSlide.slideNumber} / Modul`}
                          </span>
                          {currentSlide.subtitle && (
                            <span className="hidden text-[11px] font-medium text-slate-300/80 italic sm:inline sm:text-xs">
                              • {currentSlide.subtitle}
                            </span>
                          )}
                        </div>

                        {currentSlide.highlightMetric && (
                          <span
                            className={`rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-xs font-extrabold backdrop-blur-md sm:text-sm ${activeStyleConfig.accentColor}`}
                          >
                            {currentSlide.highlightMetric}
                          </span>
                        )}
                      </div>

                      {/* Center Content */}
                      <div className="relative z-10 my-auto py-2">
                        <h2
                          className={`text-lg font-extrabold tracking-tight sm:text-2xl md:text-3xl ${activeStyleConfig.textColor} mb-4 leading-tight`}
                        >
                          {currentSlide.title}
                        </h2>

                        {/* Bullet Points */}
                        <div className="space-y-2.5">
                          {currentSlide.bulletPoints.map((point, pIdx) => (
                            <div key={pIdx} className="flex items-start gap-2.5">
                              <span
                                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                                  selectedStyle === "academic"
                                    ? "bg-amber-400"
                                    : selectedStyle === "modern"
                                      ? "bg-cyan-400"
                                      : "bg-emerald-400"
                                }`}
                              />
                              <p className="text-xs leading-relaxed font-normal text-slate-200/95 sm:text-sm md:text-base">
                                {point}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Bottom Footer */}
                      <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-3 text-[10px] text-slate-400 sm:text-xs">
                        <span>DocNova Academic Studio</span>
                        <span>
                          Slayd {currentSlideIndex + 1} / {slides.length}
                        </span>
                      </div>
                    </div>

                    {/* Navigation Arrows */}
                    <div className="flex items-center justify-between gap-4">
                      <button
                        type="button"
                        onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
                        disabled={currentSlideIndex === 0}
                        className="border-border bg-surface-card hover:bg-surface-elevated text-foreground flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all disabled:opacity-40"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span>Oldingi slayd</span>
                      </button>

                      <div className="text-foreground-muted px-2 text-xs font-bold">
                        {currentSlideIndex + 1} / {slides.length}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1))
                        }
                        disabled={currentSlideIndex === slides.length - 1}
                        className="border-border bg-surface-card hover:bg-surface-elevated text-foreground flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all disabled:opacity-40"
                      >
                        <span>Keyingi slayd</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>

                    {/* SPEAKER NOTES SECTION (Ma'ruzachi Nutqi) */}
                    {showSpeakerNotes && currentSlide.speakerNotes && (
                      <div className="space-y-2 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 shadow-sm sm:p-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                            <Volume2 className="h-4 w-4" />
                            <span>
                              Ma&apos;ruzachi nutqi (Speaker Speech) — Komissiya oldida
                              so&apos;zlash uchun:
                            </span>
                          </div>
                          <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                            ~1.5 daqiqa
                          </span>
                        </div>
                        <p className="text-foreground/90 border-l-2 border-amber-400 pl-3 text-xs leading-relaxed italic sm:text-sm">
                          &quot;{currentSlide.speakerNotes}&quot;
                        </p>
                      </div>
                    )}

                    {/* SLIDES THUMBNAIL CAROUSEL WITH DYNAMIC ADD BUTTON */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-foreground-secondary flex items-center gap-1.5 text-xs font-semibold">
                          <Layers className="text-primary h-3.5 w-3.5" />
                          <span>Barcha slaydlar ({slides.length} ta):</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddNewSlide}
                          className="text-primary flex cursor-pointer items-center gap-1 text-[11px] font-bold hover:underline"
                        >
                          <Plus className="h-3 w-3" />
                          <span>+ Slayd qo&apos;shish</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-4 gap-2 overflow-x-auto pb-1 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
                        {slides.map((s, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setCurrentSlideIndex(idx);
                              setIsEditing(false);
                            }}
                            className={`relative cursor-pointer overflow-hidden rounded-xl border p-2 text-left transition-all ${
                              currentSlideIndex === idx
                                ? "border-primary bg-primary/20 ring-primary shadow-md ring-2"
                                : "border-border bg-surface-card hover:bg-surface-elevated"
                            }`}
                          >
                            <div className="text-foreground-secondary mb-1 flex items-center justify-between text-[10px] font-bold">
                              <span>#{s.slideNumber}</span>
                              <span className="text-foreground-muted max-w-[50%] truncate text-[9px] uppercase">
                                {s.type}
                              </span>
                            </div>
                            <div className="text-foreground truncate text-[10px] font-semibold">
                              {s.title}
                            </div>
                          </button>
                        ))}

                        {/* DYNAMIC "+ QO'SHISH" CARD AT THE END */}
                        <button
                          type="button"
                          onClick={handleAddNewSlide}
                          className="border-primary/40 bg-primary/5 hover:bg-primary/15 text-primary flex min-h-[60px] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed p-2 transition-all"
                          title="Yangi slayd qo'shish"
                        >
                          <Plus className="h-4 w-4" />
                          <span className="text-[10px] font-bold">+ Qo&apos;shish</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Reset or New Presentation */}
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setSlides([]);
                      setTopic("");
                      setSourceText("");
                      setIsEditing(false);
                    }}
                    className="text-foreground-muted hover:text-foreground inline-flex cursor-pointer items-center gap-1 text-xs font-semibold"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Yangi mavzu bo&apos;yicha prezentatsiya yaratish</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print & PDF Export Global CSS */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 0;
          }
          body {
            background-color: #0b192c !important;
            color: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .presentation-pdf-slide {
            box-shadow: none !important;
            border: none !important;
            page-break-after: always !important;
            break-after: page !important;
          }
        }
        .presentation-pdf-mode .presentation-pdf-slide {
          box-shadow: none !important;
          border-radius: 0 !important;
          page-break-after: always !important;
          break-after: page !important;
        }
      `}</style>

      {/* Quota Exhaustion / Upgrade Modal */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        customTitle="AI Limitingiz Tugadi"
        customMessage={
          upgradeErrorMsg ||
          "Prezentatsiya yaratish bo'yicha bepul limitingiz tugadi. Cheksiz slaydlar va ma'ruzachi nutqlari uchun tarifingizni oshiring."
        }
      />
    </div>
  );
}

export default function PresentationGeneratorPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background text-foreground flex min-h-screen items-center justify-center">
          <div className="text-foreground-secondary animate-pulse text-sm font-medium">
            Yuklanmoqda...
          </div>
        </div>
      }
    >
      <PresentationContent />
    </Suspense>
  );
}
