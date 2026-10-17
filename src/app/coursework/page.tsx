"use client";

import React, { useState, useRef, useMemo } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import {
  GraduationCap,
  Sparkles,
  FileDown,
  Printer,
  Copy,
  Check,
  Lightbulb,
  Presentation,
  ArrowRight,
  ArrowLeft,
  Edit3,
  RotateCcw,
  BookOpen,
  CheckCircle2,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Zap,
  Plus,
  Trash2,
} from "lucide-react";
import { StudentSubNav } from "@/components/academic/student-sub-nav";
import { useToast } from "@/hooks/use-toast";
import type { CourseworkOutline, CourseworkPage } from "@/app/api/generate-coursework/route";
import { UpgradeModal } from "@/components/modals/upgrade-modal";

const FACULTIES_AND_SUBJECTS: {
  category: string;
  subjects: string[];
  topics: string[];
}[] = [
  {
    category: "Axborot texnologiyalari va Dasturlash (IT)",
    subjects: [
      "Informatika va Axborot texnologiyalari",
      "Dasturiy ta'minot muhandisligi",
      "Kiberxavfsizlik va axborot himoyasi",
      "Sun'iy intellekt va ma'lumotlar tahlili",
      "Kompyuter tarmoqlari va bulutli tizimlar",
    ],
    topics: [
      "Sun'iy intellekt va mashinaviy o'rganish modellarining tibbiy diagnostikadagi amaliy samaradorligi",
      "Bulutli hisoblashlar arxitekturasida ma'lumotlar xavfsizligini ta'minlash usullari va algoritmlari",
      "Katta hajmli ma'lumotlarni (Big Data) qayta ishlashda taqsimlangan tizimlarning tahlili",
      "Web-ilovalarni mikroservis arxitekturasi asosida loyihalash va optimallashtirish tamoyillari",
      "Blokcheyn texnologiyasi asosida raqamli hujjat aylanishi xavfsizligini oshirish mexanizmlari",
    ],
  },
  {
    category: "Iqtisodiyot va Moliya",
    subjects: [
      "Iqtisodiyot nazariyasi",
      "Bank ishi va pul muomalasi",
      "Korporativ moliya va investitsiyalar",
      "Raqamli iqtisodiyot va biznes tahlil",
      "Buxgalteriya hisobi va audit",
    ],
    topics: [
      "Raqamli iqtisodiyot sharoitida tijorat banklari xizmatlarini modernizatsiya qilish yo'llari",
      "O'zbekistonda kichik biznes va xususiy tadbirkorlikni soliq mexanizmlari orqali rag'batlantirish",
      "Inflyatsion targetlash sharoitida milliy valyuta barqarorligini ta'minlash istiqbollari",
      "Xalqaro moliya bozorlari integratsiyasi va xorijiy investitsiyalarni jalb etish mexanizmlari",
      "Elektron tijorat (E-commerce) bozorining rivojlanishi va uning iqtisodiy samaradorligi",
    ],
  },
  {
    category: "Huquqshunoslik va Davlat boshqaruvi",
    subjects: [
      "Davlat va huquq nazariyasi",
      "Fuqarolik huquqi va jarayoni",
      "Ma'muriy huquq va davlat xizmati",
      "Xalqaro huquq va inson huquqlari",
      "Kiberxavfsizlik huquqiy asoslari",
    ],
    topics: [
      "Inson huquqlarini himoya qilishning xalqaro-huquqiy mexanizmlari va O'zbekiston qonunchiligi",
      "Raqamli muhitda intellektual mulk va mualliflik huquqini himoya qilishning dolzarb masalalari",
      "Davlat xizmati tizimida korrupsiyaga qarshi kurashishning huquqiy asoslarini takomillashtirish",
      "Fuqarolik-huquqiy munosabatlarda elektron shartnomalar tuzishning yuridik oqibatlari",
      "Ma'muriy sud ishlarini yuritishda odil sudlov kafolatlarini kuchaytirish istiqbollari",
    ],
  },
  {
    category: "Pedagogika va Psixologiya",
    subjects: [
      "Umumiy pedagogika nazariyasi",
      "O'qitishning innovatsion metodlari",
      "Yosh davrlari psixologiyasi",
      "Maxsus va inklyuziv pedagogika",
    ],
    topics: [
      "Oliy ta'lim muassasalarida masofaviy ta'lim texnologiyalarini qo'llashning pedagogik asoslari",
      "Talabalarda tanqidiy va kreativ fikrlash qobiliyatlarini rivojlantirishning interfaol metodikasi",
      "O'quv jarayonida raqamli texnologiyalar va geymifikatsiya vositalaridan foydalanish samaradorligi",
      "O'smirlar psixologiyasida stress va hissiy zo'riqishlarni korreksiya qilish yo'llari",
      "Inklyuziv ta'lim muhitini tashkil etishning zamonaviy psixologik-pedagogik talablari",
    ],
  },
  {
    category: "Filologiya va Tilshunoslik",
    subjects: [
      "Qiyosiy tilshunoslik",
      "Tarjima nazariyasi va amaliyoti",
      "Zamonaviy o'zbek adabiy tili",
      "Amaliy ingliz tili leksikasi",
    ],
    topics: [
      "Ingliz va o'zbek tillaridagi maqol va matallarning lingvomadaniy va qiyosiy tahlili",
      "Badiiy matnlarni tarjima qilishda soha atamalari va frazeologizmlarning berilishi xususiyatlari",
      "Zamonaviy ommaviy axborot vositalari nutqida neologizmlar va o'zlashma so'zlarning o'rni",
      "Kompyuter lingvistikasi va matnlarni avtomatik tahlil qilish tizimlarining lingvistik asoslari",
    ],
  },
  {
    category: "Muhandislik va Texnika fanlari",
    subjects: [
      "Avtomatlashtirilgan loyihalash tizimlari (CAD/CAM)",
      "Muqobil va qayta tiklanuvchi energiya manbalari",
      "Elektronika va mikrotizimlar",
      "Materialshunoslik va konstruksion materiallar",
    ],
    topics: [
      "Qayta tiklanuvchi energiya manbalarini sanoat korxonalariga integratsiya qilish samaradorligi",
      "Avtomatlashtirilgan ishlab chiqarish jarayonlarida datchiklar va IoT tizimlaridan foydalanish",
      "Zamonaviy kompozit materiallarning mustahkamlik ko'rsatkichlarini matematik modellashtirish",
    ],
  },
];

type MDProps = { children?: React.ReactNode };

function extractText(c: unknown): string {
  if (typeof c === "string") return c;
  if (typeof c === "number") return (c as number).toString();
  if (Array.isArray(c)) return c.map(extractText).join("");
  if (c && typeof c === "object" && "props" in c) {
    const props = (c as { props?: { children?: unknown } }).props;
    if (props && props.children) {
      return extractText(props.children);
    }
  }
  return "";
}

function parseTocLine(text: string): { title: string; page: string; isSub: boolean } | null {
  if (!text) return null;
  const clean = text.trim();
  const match = clean.match(/^([^\n]+?)\s*(?:[\.·…\-]\s*){2,}\s*(\d+)\s*$/);
  if (match) {
    const rawTitle = match[1]
      .replace(/^\s*[-*•]\s*/, "")
      .replace(/\*/g, "")
      .trim();
    const page = match[2].trim();
    if (rawTitle.length > 0 && page.length > 0) {
      const isSub = /^\d+\.\d+/.test(rawTitle);
      return { title: rawTitle, page, isSub };
    }
  }
  return null;
}

const markdownComponents = {
  h1: ({ children }: MDProps) => (
    <h1 className="my-4 text-center text-lg font-bold tracking-wide text-black uppercase sm:text-xl">
      {children}
    </h1>
  ),
  h2: ({ children }: MDProps) => (
    <h2 className="mt-5 mb-2 text-base font-bold tracking-normal text-black uppercase sm:text-lg">
      {children}
    </h2>
  ),
  h3: ({ children }: MDProps) => (
    <h3 className="mt-4 mb-1 text-sm font-semibold text-black sm:text-base">{children}</h3>
  ),
  ul: ({ children }: MDProps) => (
    <ul className="my-1 w-full list-none space-y-1 p-0 text-black">{children}</ul>
  ),
  li: ({ children }: MDProps) => {
    const text = extractText(children);
    const toc = parseTocLine(text);
    if (toc) {
      return (
        <li className={`m-0 w-full list-none p-0 ${toc.isSub ? "pl-5" : ""}`}>
          <div className="toc-item my-0.5 flex w-full items-baseline">
            <span className="toc-title max-w-[85%] truncate pr-1 text-xs font-semibold whitespace-nowrap text-black sm:text-sm">
              {toc.title}
            </span>
            <span className="toc-dots mx-1 mb-1 flex-grow border-b border-dotted border-black" />
            <span className="toc-page shrink-0 pl-1 text-xs font-bold whitespace-nowrap text-black sm:text-sm">
              {toc.page}
            </span>
          </div>
        </li>
      );
    }
    return (
      <li className="my-0.5 ml-5 list-disc text-xs leading-normal text-black sm:text-sm">
        {children}
      </li>
    );
  },
  p: ({ children }: MDProps) => {
    const text = extractText(children);
    const toc = parseTocLine(text);
    if (toc) {
      return (
        <div className={`toc-item my-0.5 flex w-full items-baseline ${toc.isSub ? "pl-5" : ""}`}>
          <span className="toc-title max-w-[85%] truncate pr-1 text-xs font-semibold whitespace-nowrap text-black sm:text-sm">
            {toc.title}
          </span>
          <span className="toc-dots mx-1 mb-1 flex-grow border-b border-dotted border-black" />
          <span className="toc-page shrink-0 pl-1 text-xs font-bold whitespace-nowrap text-black sm:text-sm">
            {toc.page}
          </span>
        </div>
      );
    }
    return (
      <p className="mb-2 text-justify indent-6 text-xs leading-relaxed text-black sm:text-[13px]">
        {children}
      </p>
    );
  },
  table: ({ children }: MDProps) => (
    <div className="my-3 w-full overflow-x-auto">
      <table className="w-full border-collapse border border-black text-[11px] text-black sm:text-xs">
        {children}
      </table>
    </div>
  ),
  th: ({ children }: MDProps) => (
    <th className="border border-black bg-slate-100 p-1.5 text-center text-[11px] font-bold text-black sm:text-xs">
      {children}
    </th>
  ),
  td: ({ children }: MDProps) => (
    <td className="border border-black p-1.5 text-[11px] text-black sm:text-xs">{children}</td>
  ),
  hr: () => <hr className="my-3 border-t border-slate-300" />,
};

const GENERATION_STEPS = [
  "Mavzuning dolzarbligi va ilmiy apparati tahlil qilinmoqda...",
  "Titul varag'i va tasdiqlangan reja (mundarija) sahifalanmoqda...",
  "Kirish qismi: dolzarblik, ob'ekt, predmet va metodologiya yozilmoqda...",
  "I Bob: Nazariy-uslubiy asoslar va fundamental tushunchalar shakllanmoqda...",
  "II Bob: Amaliy tadqiqot, empirik tahlil va qiyosiy jadvallar hisoblanmoqda...",
  "III Bob: Mavjud muammolar va ilmiy-amaliy takliflar tizimi ishlab chiqilmoqda...",
  "Xulosa, tavsiyalar va GOST bo'yicha 15-20 ta adabiyotlar ro'yxati tekshirilmoqda...",
  "A4 formatidagi sahifalar (Times New Roman, 14pt, 1.5 interval) yig'ilmoqda...",
];

export default function CourseworkGenerator() {
  const { toast } = useToast();
  const documentRef = useRef<HTMLDivElement>(null);

  // Multi-step Wizard State: 1 | 2 | 3 | 4
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  const [selectedCategoryIdx, setSelectedCategoryIdx] = useState(0);
  const [formData, setFormData] = useState({
    subject: "Informatika va Axborot texnologiyalari",
    topic: "",
    faculty: "Axborot texnologiyalari fakulteti",
    university: "",
    studentName: "",
    teacherName: "",
    year: new Date().getFullYear().toString(),
    pageCount: "19",
    language: "uz" as "uz" | "uz-cyrl" | "ru",
  });

  // Step 2: Outline state
  const [outline, setOutline] = useState<CourseworkOutline | null>(null);
  const [isOutlineLoading, setIsOutlineLoading] = useState(false);

  // Step 3: Generation progress state
  const [_loading, setLoading] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);

  // Step 4: Result state
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [pages, setPages] = useState<CourseworkPage[]>([]);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"pages" | "continuous">("pages");
  const [copied, setCopied] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeErrorMsg, setUpgradeErrorMsg] = useState("");

  const activeCategory = FACULTIES_AND_SUBJECTS[selectedCategoryIdx] || FACULTIES_AND_SUBJECTS[0];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleTopicChange = (newTopic: string) => {
    setFormData((prev) => ({ ...prev, topic: newTopic }));
    if (outline && outline.topic.trim().toLowerCase() !== newTopic.trim().toLowerCase()) {
      setOutline(null);
    }
  };

  const handleSelectTopicSuggestion = (selectedTopic: string) => {
    setFormData((prev) => ({ ...prev, topic: selectedTopic }));
    setOutline(null);
    toast({
      title: "Mavzu tanlandi",
      description: selectedTopic,
    });
  };

  const [showTitleDetails, setShowTitleDetails] = useState(false);
  const [isFastGenerating, setIsFastGenerating] = useState(false);

  // ------------------------------------------------------------------
  // STEP 1 FAST TRACK: One-Click Instant Full Coursework Generation
  // ------------------------------------------------------------------
  const handleOneClickGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanTopic = formData.topic.trim();
    if (!cleanTopic) {
      toast({
        title: "Mavzuni kiriting",
        description: "Kurs ishi mavzusini kiritishingiz shart.",
        variant: "destructive",
      });
      return;
    }

    const matchedOutline =
      outline && outline.topic.trim().toLowerCase() === cleanTopic.toLowerCase()
        ? outline
        : undefined;

    const payload = {
      ...formData,
      topic: cleanTopic,
      subject: formData.subject.trim() || activeCategory.subjects[0] || "Mutaxassislik fani",
      outline: matchedOutline,
    };

    setIsFastGenerating(true);
    setCurrentStep(3);
    setLoading(true);
    setResult(null);
    setPages([]);
    setCurrentStepIdx(0);
    setProgressPercent(10);

    const stepInterval = setInterval(() => {
      setCurrentStepIdx((prev) => {
        const next = prev < GENERATION_STEPS.length - 1 ? prev + 1 : prev;
        setProgressPercent(Math.min(94, Math.round(((next + 1) / GENERATION_STEPS.length) * 94)));
        return next;
      });
    }, 1300);

    try {
      const res = await fetch("/api/academic/coursework/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      clearInterval(stepInterval);

      if (!res.ok) {
        if (res.status === 401 || data.requireLogin) {
          toast({
            title: "Tizimga kirish zarur 🔒",
            description: "Kurs ishi yaratish uchun profilingizga kiring yoki ro'yxatdan o'ting.",
            variant: "destructive",
          });
          window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
          return;
        }

        if (res.status === 403 || data.requireUpgrade) {
          const quotaMsg =
            data.upgradeMessage ||
            "Kurs ishi yaratish bo'yicha bepul limitingiz tugadi. Pro yoki Premium tarifga o'ting.";
          setUpgradeErrorMsg(quotaMsg);
          setIsUpgradeModalOpen(true);
          setCurrentStep(1);
          setLoading(false);
          setIsFastGenerating(false);
          toast({
            title: "AI limitingiz tugadi ⚡",
            description: quotaMsg,
            variant: "destructive",
          });
          return;
        }
        throw new Error(data.error || "Kurs ishini yaratishda xatolik yuz berdi");
      }

      setProgressPercent(100);
      setResult(data.result);
      setPages(data.pages || []);
      if (data.outline) setOutline(data.outline);
      setCurrentStep(4);
      toast({
        title: "Kurs ishi to'liq tayyor! 🎓",
        description: `Barcha ${data.totalPages || formData.pageCount} sahifalik akademik kurs ishi shakllantirildi.`,
      });
    } catch (err: unknown) {
      clearInterval(stepInterval);
      setLoading(false);
      setIsFastGenerating(false);
      setCurrentStep(1);
      const e = err as Error;
      toast({
        title: "Generatsiyada xatolik",
        description:
          e.message?.includes("fetch") || e.message?.includes("network")
            ? "Tarmoqda uzilish yuz berdi. Internet aloqasini tekshirib, qayta urinib ko'ring."
            : e.message || "Iltimos, qayta urinib ko'ring.",
        variant: "destructive",
      });
    } finally {
      setIsFastGenerating(false);
    }
  };

  // ------------------------------------------------------------------
  // STEP 1 -> STEP 2: Generate Outline Preview
  // ------------------------------------------------------------------
  const handleProceedToOutline = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTopic = formData.topic.trim();
    if (!cleanTopic) {
      toast({
        title: "Mavzuni kiriting",
        description: "Kurs ishi mavzusi kiritilishi shart.",
        variant: "destructive",
      });
      return;
    }
    const cleanSubject =
      formData.subject.trim() || activeCategory.subjects[0] || "Mutaxassislik fani";

    setIsOutlineLoading(true);

    try {
      const res = await fetch("/api/academic/coursework/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "outline",
          ...formData,
          topic: cleanTopic,
          subject: cleanSubject,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401 || data.requireLogin) {
          toast({
            title: "Tizimga kirish zarur 🔒",
            description: "Kurs ishi rejasini shakllantirish uchun profilingizga kiring.",
            variant: "destructive",
          });
          window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
          return;
        }

        if (res.status === 403 || data.requireUpgrade) {
          const quotaMsg =
            data.upgradeMessage ||
            "Kurs ishi yaratish bo'yicha bepul limitingiz tugadi. Pro yoki Premium tarifga o'ting.";
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
          data.upgradeMessage || data.error || "Rejani shakllantirishda xatolik yuz berdi"
        );
      }

      setOutline(data.outline);
      setCurrentStep(2);
      toast({
        title: "Reja muvaffaqiyatli tuzildi! 📋",
        description: "Boblar va paragraflarni ko'rib chiqing va zarur bo'lsa tahrirlang.",
      });
    } catch (err: unknown) {
      const e = err as Error;
      toast({
        title: "Reja tuzishda xatolik",
        description: e.message || "Iltimos, qayta urinib ko'ring.",
        variant: "destructive",
      });
    } finally {
      setIsOutlineLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // STEP 2: Outline Inline Editing Handlers
  // ------------------------------------------------------------------
  const handleChapterTitleChange = (chapterIdx: number, newTitle: string) => {
    if (!outline) return;
    const updated = { ...outline };
    if (updated.chapters[chapterIdx]) {
      updated.chapters[chapterIdx].title = newTitle;
      setOutline(updated);
    }
  };

  const handleSubsectionChange = (chapterIdx: number, subIdx: number, newText: string) => {
    if (!outline) return;
    const updated = { ...outline };
    if (
      updated.chapters[chapterIdx] &&
      updated.chapters[chapterIdx].subsections[subIdx] !== undefined
    ) {
      updated.chapters[chapterIdx].subsections[subIdx] = newText;
      setOutline(updated);
    }
  };

  const handleAddSubsection = (chapterIdx: number) => {
    if (!outline) return;
    const updated = { ...outline };
    const ch = updated.chapters[chapterIdx];
    if (ch) {
      const nextNum = ch.subsections.length + 1;
      ch.subsections.push(`${ch.number}.${nextNum}. Yangi qo'shimcha paragraf tahlili`);
      setOutline(updated);
    }
  };

  const handleRemoveSubsection = (chapterIdx: number, subIdx: number) => {
    if (!outline) return;
    const updated = { ...outline };
    const ch = updated.chapters[chapterIdx];
    if (ch && ch.subsections.length > 2) {
      ch.subsections.splice(subIdx, 1);
      setOutline(updated);
    } else {
      toast({
        title: "Kamida 2 ta paragraf bo'lishi shart",
        description: "MOVSO standartiga binoan har bir bobda kamida 2 ta band bo'lishi kerak.",
        variant: "destructive",
      });
    }
  };

  // ------------------------------------------------------------------
  // STEP 2 -> STEP 3: Full Coursework Generation
  // ------------------------------------------------------------------
  const handleStartFullGeneration = async () => {
    const cleanTopic = formData.topic.trim();
    if (!cleanTopic) {
      toast({
        title: "Mavzuni kiriting",
        description: "Kurs ishi mavzusi kiritilishi shart.",
        variant: "destructive",
      });
      return;
    }

    const matchedOutline =
      outline && outline.topic.trim().toLowerCase() === cleanTopic.toLowerCase()
        ? outline
        : undefined;

    setCurrentStep(3);
    setLoading(true);
    setResult(null);
    setPages([]);
    setCurrentStepIdx(0);
    setProgressPercent(10);

    const stepInterval = setInterval(() => {
      setCurrentStepIdx((prev) => {
        const next = prev < GENERATION_STEPS.length - 1 ? prev + 1 : prev;
        setProgressPercent(Math.min(94, Math.round(((next + 1) / GENERATION_STEPS.length) * 94)));
        return next;
      });
    }, 1300);

    try {
      const res = await fetch("/api/academic/coursework/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          ...formData,
          topic: cleanTopic,
          outline: matchedOutline,
        }),
      });

      const data = await res.json();
      clearInterval(stepInterval);

      if (!res.ok) {
        if (res.status === 403 || data.requireUpgrade) {
          const quotaMsg =
            data.upgradeMessage ||
            "Kurs ishi yaratish bo'yicha bepul limitingiz tugadi. Pro yoki Premium tarifga o'ting.";
          setUpgradeErrorMsg(quotaMsg);
          setIsUpgradeModalOpen(true);
          setLoading(false);
          setCurrentStep(2);
          toast({
            title: "AI limitingiz tugadi ⚡",
            description: quotaMsg,
            variant: "destructive",
          });
          return;
        }
        throw new Error(
          data.upgradeMessage || data.error || "Kurs ishini generatsiya qilishda xatolik yuz berdi"
        );
      }

      setProgressPercent(100);
      setResult(data.result);
      if (data.pages && Array.isArray(data.pages) && data.pages.length > 0) {
        setPages(data.pages);
      }
      setActivePageIndex(0);

      setTimeout(() => {
        setLoading(false);
        setCurrentStep(4);
        toast({
          title: "Kurs ishi muvaffaqiyatli tayyorlandi! 🎓",
          description: `${data.pages?.length || formData.pageCount} sahifalik to'liq akademik hujjat shakllantirildi.`,
        });
      }, 500);
    } catch (err: unknown) {
      clearInterval(stepInterval);
      setLoading(false);
      setCurrentStep(2); // return to outline on error
      const e = err as Error;
      toast({
        title: "Generatsiyada xatolik",
        description:
          e.message?.includes("fetch") || e.message?.includes("network")
            ? "Tarmoqda uzilish yuz berdi. Internet aloqasini tekshirib, qayta urinib ko'ring."
            : e.message || "Iltimos, qayta urinib ko'ring.",
        variant: "destructive",
      });
    }
  };

  // ------------------------------------------------------------------
  // Word (.doc / .docx compatible) Export
  // ------------------------------------------------------------------
  function formatMarkdownToWordHTML(md: string): string {
    const lines = md.split("\n");
    const resultLines: string[] = [];
    let inTable = false;
    let tableRows: string[][] = [];

    const flushTable = () => {
      if (tableRows.length === 0) return;
      let tableHtml =
        "<table border='1' cellspacing='0' cellpadding='6' style='width:100%; border-collapse:collapse; margin-top:14pt; margin-bottom:14pt;'>";
      tableRows.forEach((row, rowIdx) => {
        tableHtml += "<tr>";
        row.forEach((cell) => {
          const tag = rowIdx === 0 ? "th" : "td";
          const style =
            rowIdx === 0
              ? "style='background-color:#f1f5f9; font-weight:bold; text-align:center; border:1pt solid #000; padding:6pt; font-size:12pt;'"
              : "style='text-align:left; border:1pt solid #000; padding:6pt; font-size:12pt;'";
          tableHtml += `<${tag} ${style}>${cell}</${tag}>`;
        });
        tableHtml += "</tr>";
      });
      tableHtml += "</table>";
      resultLines.push(tableHtml);
      tableRows = [];
      inTable = false;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("|") && line.endsWith("|")) {
        const isSeparator = /^\|[\s\-:|]+\|$/.test(line);
        if (isSeparator) continue;
        const cells = line
          .slice(1, -1)
          .split("|")
          .map((c) => c.trim());
        inTable = true;
        tableRows.push(cells);
      } else {
        if (inTable) flushTable();
        resultLines.push(lines[i]);
      }
    }
    if (inTable) flushTable();

    let html = resultLines.join("\n");
    html = html.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n");
    html = html
      .replace(/^# (.*$)/gim, "<h1>$1</h1>")
      .replace(/^## (.*$)/gim, "<h2>$1</h2>")
      .replace(/^### (.*$)/gim, "<h3>$1</h3>")
      .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
      .replace(/\*(.*?)\*/g, "<i>$1</i>")
      .replace(/^-\s+(.*$)/gim, "<li>$1</li>")
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br/>");

    return `<p>${html}</p>`;
  }

  const handleDownloadWord = () => {
    if (!result && pages.length === 0) return;

    const cleanTopic = formData.topic.slice(0, 30).replace(/[^a-zA-Z0-9]/g, "_") || "Kurs_Ishi";
    const titleText = formData.topic;

    const htmlContent =
      pages.length > 0
        ? pages
            .map(
              (p, idx) => `
        <div class="page-container ${idx > 0 ? "page-break" : ""}">
          ${formatMarkdownToWordHTML(p.content)}
          ${p.pageNumber > 1 ? `<div class="footer-page-num">${p.pageNumber}</div>` : ""}
        </div>
      `
            )
            .join("\n")
        : formatMarkdownToWordHTML(result || "");

    const wordDocHTML = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${titleText}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page Section1 {
            size: 210mm 297mm;
            margin: 20mm 20mm 20mm 25mm; /* Chapdan 25mm, qolgan hoshiyalar 20mm */
            mso-header-margin: 15mm;
            mso-footer-margin: 15mm;
            mso-paper-source: 0;
          }
          div.Section1 { page: Section1; }
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 14pt;
            line-height: 1.5;
            color: #000000;
            text-align: justify;
          }
          h1 {
            font-size: 16pt;
            font-weight: bold;
            text-align: center;
            text-transform: uppercase;
            margin-top: 24pt;
            margin-bottom: 18pt;
          }
          h2 {
            font-size: 14pt;
            font-weight: bold;
            margin-top: 18pt;
            margin-bottom: 12pt;
          }
          h3 {
            font-size: 14pt;
            font-weight: bold;
            margin-top: 12pt;
            margin-bottom: 6pt;
          }
          p {
            text-indent: 1.25cm;
            margin-top: 0;
            margin-bottom: 6pt;
            line-height: 1.5;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12pt;
            margin-bottom: 12pt;
          }
          th, td {
            border: 1pt solid #000000;
            padding: 5pt;
            font-size: 12pt;
          }
          th {
            background-color: #f1f5f9;
            font-weight: bold;
            text-align: center;
          }
          .page-break {
            page-break-before: always;
            mso-break-type: page-break;
          }
          .footer-page-num {
            text-align: center;
            font-size: 11pt;
            margin-top: 18pt;
          }
        </style>
      </head>
      <body>
        <div class="Section1">
          ${htmlContent}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([wordDocHTML], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Kurs_Ishi_${cleanTopic}.doc`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Word fayl yuklab olindi! 📄",
      description:
        "Hujjat MOVSO talablariga mos Times New Roman 14pt, 1.5 interval va standart hoshiyalar bilan saqlandi.",
    });
  };

  // ------------------------------------------------------------------
  // PDF Export (Full-Document: All 15-30 pages with MOVSO margins)
  // ------------------------------------------------------------------
  const handleDownloadPDF = async () => {
    if (!documentRef.current && pages.length === 0 && !result) return;

    // Mobile resilience: Mobile browsers crash or block massive 30-page html2canvas renders.
    // Native print engine produces vector-crisp PDF instantly without memory exhaustion.
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
      handlePrint();
      return;
    }

    setDownloading(true);
    setDownloadProgress("Barcha sahifalar tayyorlanmoqda...");

    const prevMode = viewMode;
    try {
      // Ensure all pages are rendered into the DOM before capturing
      if (prevMode !== "continuous") {
        setViewMode("continuous");
        await new Promise((resolve) => setTimeout(resolve, 250));
      }

      const html2pdfModule = await import("html2pdf.js");
      const html2pdf = html2pdfModule.default || html2pdfModule;

      const cleanTopic = formData.topic.slice(0, 30).replace(/[^a-zA-Z0-9]/g, "_") || "Kurs_Ishi";
      const element = documentRef.current;
      if (!element) throw new Error("Hujjat maydoni topilmadi");

      element.classList.add("pdf-export-mode");

      const opt = {
        margin: 0,
        filename: `Kurs_Ishi_${cleanTopic}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          scrollY: 0,
        },
        jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const },
        pagebreak: { mode: ["css", "legacy"], after: ".coursework-page-card" },
      };

      setDownloadProgress("PDF fayl yuklanmoqda...");
      await html2pdf().from(element).set(opt).save();

      element.classList.remove("pdf-export-mode");

      toast({
        title: "PDF muvaffaqiyatli yuklab olindi! 📄",
        description: `Barcha ${pages.length || formData.pageCount} sahifalik kurs ishi A4 formatida saqlandi.`,
      });
    } catch (err: unknown) {
      console.error("[PDF_EXPORT_ERROR]", err);
      toast({
        title: "Chop etish orqali PDF saqlash",
        description:
          "Brauzerning chop etish oynasi ochilmoqda. Undan 'PDF sifatida saqlash'ni tanlang.",
      });
      setTimeout(() => {
        handlePrint();
      }, 300);
    } finally {
      if (prevMode !== "continuous") {
        setViewMode(prevMode);
      }
      setDownloading(false);
      setDownloadProgress(null);
    }
  };

  // Browser Print handler that ensures full document is printed
  const handlePrint = () => {
    const prevMode = viewMode;
    if (prevMode !== "continuous") {
      setViewMode("continuous");
      setTimeout(() => {
        window.print();
        setTimeout(() => setViewMode(prevMode), 600);
      }, 200);
    } else {
      window.print();
    }
  };

  const handleCopy = () => {
    if (!result && pages.length === 0) return;
    const textToCopy =
      pages.length > 0 ? pages.map((p) => p.content).join("\n\n---\n\n") : result || "";
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast({ title: "Nusxalandi!", description: "Barcha sahifalar xotiraga olindi." });
    setTimeout(() => setCopied(false), 2000);
  };

  const cleanResult = useMemo(() => {
    if (!result) return "";
    return result.replace(/<br\s*\/?>/gi, "\n\n").replace(/<hr\s*\/?>/gi, "\n\n---\n\n");
  }, [result]);

  const activePage = pages[activePageIndex] || pages[0];

  return (
    <div className="bg-background text-foreground min-h-screen pb-20">
      {/* Top Student Navigation */}
      <div className="print:hidden">
        <StudentSubNav activeTab="coursework" />
      </div>

      {/* Top Banner */}
      <div className="border-border bg-surface/30 border-b px-4 py-8 sm:px-6 lg:px-8 print:hidden">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
              <GraduationCap className="h-3.5 w-3.5" />
              <span>O&apos;zbekiston OTM Standartlari (MOVSO)</span>
            </div>
            <h1 className="text-foreground text-2xl font-extrabold sm:text-3xl">
              Kurs ishi yordamchisi va Generatori
            </h1>
            <p className="text-foreground-secondary mt-1 max-w-2xl text-xs sm:text-sm">
              Titul varag&apos;i, tasdiqlangan reja (mundarija), kirish, 3 ta bob, tahliliy
              jadvallar, xulosa va 20 ta GOST adabiyotlar ro&apos;yxati bilan tayyor akademik kurs
              ishi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-foreground-muted text-xs font-medium">Hajm:</span>
            {["15", "19", "25", "30"].map((cnt) => (
              <button
                key={cnt}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, pageCount: cnt }))}
                className={`cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-bold transition-all ${
                  formData.pageCount === cnt
                    ? "bg-primary border-primary text-white shadow-sm"
                    : "bg-surface border-border text-foreground hover:border-primary/50"
                }`}
              >
                {cnt} bet
              </button>
            ))}
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={5}
                max={100}
                value={formData.pageCount}
                onChange={(e) => setFormData((prev) => ({ ...prev, pageCount: e.target.value }))}
                placeholder="Boshqa"
                className="border-border bg-background text-foreground h-7 w-16 rounded border text-center text-xs font-bold"
                title="O'zingiz xohlagan sahifalar sonini kiriting (100 tagacha)"
              />
              <span className="text-foreground-muted text-[11px]">bet</span>
            </div>
          </div>
        </div>
      </div>

      {/* Wizard Step Navigation Bar */}
      <div className="border-border bg-surface/50 border-b px-4 py-3 print:hidden">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          {[
            { id: 1, label: "Parametrlar", icon: FileText },
            { id: 2, label: "Reja va Mundarija", icon: Edit3 },
            { id: 3, label: "AI Generatsiya", icon: Sparkles },
            { id: 4, label: "Tayyor Kurs Ishi", icon: CheckCircle2 },
          ].map((s, idx) => {
            const isCompleted = currentStep > s.id;
            const isCurrent = currentStep === s.id;
            const Icon = s.icon;
            return (
              <React.Fragment key={s.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (s.id < currentStep) setCurrentStep(s.id as 1 | 2 | 3 | 4);
                  }}
                  disabled={s.id > currentStep}
                  className={`flex items-center gap-2 text-xs font-bold transition-all ${
                    isCurrent
                      ? "text-primary"
                      : isCompleted
                        ? "text-emerald-400 hover:opacity-80"
                        : "text-foreground-muted opacity-50"
                  }`}
                >
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      isCurrent
                        ? "bg-primary text-primary-foreground ring-primary/30 shadow-md ring-2"
                        : isCompleted
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-surface-elevated text-foreground-muted"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Icon className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <span className="hidden sm:inline">
                    {s.id}-bosqich: {s.label}
                  </span>
                </button>
                {idx < 3 && <div className="bg-border h-0.5 w-3 shrink-0 sm:w-16" />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ========================================================= */}
        {/* STEP 1: ULTRA-SIMPLE STUDENT-FRIENDLY WIZARD */}
        {/* ========================================================= */}
        {currentStep === 1 && (
          <div className="mx-auto max-w-3xl">
            <div className="border-border bg-surface rounded-2xl border p-5 shadow-sm sm:p-7">
              <div className="border-border mb-6 flex items-center justify-between border-b pb-4">
                <div>
                  <h2 className="text-foreground flex items-center gap-2 text-lg font-bold sm:text-xl">
                    <Sparkles className="text-primary h-5 w-5" />
                    <span>Kurs ishi generatori</span>
                  </h2>
                  <p className="text-foreground-secondary mt-0.5 text-xs sm:text-sm">
                    Mavzuni kiriting va bir klikda OTM talablariga mos to&apos;liq kurs ishiga ega
                    bo&apos;ling.
                  </p>
                </div>
                <span className="text-primary bg-primary/10 border-primary/20 rounded-full border px-3 py-1 text-xs font-bold">
                  {formData.pageCount || "19"} bet
                </span>
              </div>

              <div className="space-y-5">
                {/* 1. MAVZU (HERO INPUT) */}
                <div>
                  <label className="text-foreground mb-1.5 flex items-center justify-between text-xs font-bold sm:text-sm">
                    <span>Kurs ishi mavzusi *</span>
                    <span className="text-foreground-muted text-[11px] font-normal">
                      Aniq va to&apos;liq yozing
                    </span>
                  </label>
                  <textarea
                    rows={3}
                    name="topic"
                    required
                    value={formData.topic}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      handleTopicChange(e.target.value)
                    }
                    placeholder="Masalan: Sun'iy intellektning ta'lim sohasidagi o'rni va rivojlanish istiqbollari..."
                    className="border-primary/40 bg-background text-foreground focus:border-primary focus:ring-primary/20 w-full rounded-xl border p-3.5 text-xs leading-relaxed font-medium shadow-inner focus:ring-2 focus:outline-none sm:text-sm"
                  />

                  {/* QUICK TOPIC SUGGESTIONS */}
                  <div className="mt-2.5">
                    <span className="text-foreground-muted mb-1.5 flex items-center gap-1 text-[11px] font-semibold">
                      <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                      <span>Ommabop mavzulardan tezkor tanlash:</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "Sun'iy intellektning ta'lim sohasidagi o'rni va rivojlanish istiqbollari",
                        "Tibbiy diagnostikada sun'iy intellekt va mashinali o'rganish texnologiyalarini qo'llash",
                        "O'zbekiston iqtisodiyotida kichik biznes va xususiy tadbirkorlikni rivojlantirish yo'llari",
                        "Kiberxavfsizlik va axborot himoyasi tamoyillari",
                      ].map((item, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSelectTopicSuggestion(item)}
                          className="border-border bg-surface-elevated hover:bg-primary/10 hover:border-primary/50 text-foreground-secondary hover:text-foreground cursor-pointer rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all"
                        >
                          ⚡ {item}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. FAN NOMI (SUBJECT) */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-foreground mb-1.5 block text-xs font-bold">
                      Fan nomi yoki Yo&apos;nalish *
                    </label>
                    <input
                      type="text"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="Masalan: Bank ishi, Informatika, Iqtisodiyot..."
                      className="border-border bg-background text-foreground focus:border-primary w-full rounded-xl border px-3.5 py-2.5 text-xs focus:outline-none sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-foreground mb-1.5 block text-xs font-bold">
                      Yo&apos;nalish (Kafedra)
                    </label>
                    <select
                      value={selectedCategoryIdx}
                      onChange={(e) => {
                        const idx = parseInt(e.target.value, 10);
                        setSelectedCategoryIdx(idx);
                        const cat = FACULTIES_AND_SUBJECTS[idx];
                        if (cat) {
                          setFormData((prev) => ({
                            ...prev,
                            subject: cat.subjects[0] || prev.subject,
                            faculty: `${cat.category.split("(")[0].trim()} fakulteti`,
                          }));
                        }
                      }}
                      className="border-border bg-background text-foreground focus:border-primary w-full rounded-xl border px-3 py-2.5 text-xs focus:outline-none sm:text-sm"
                    >
                      {FACULTIES_AND_SUBJECTS.map((item, idx) => (
                        <option key={idx} value={idx}>
                          {item.category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3. HAJM VA TIL TANLASH */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Hajm */}
                  <div>
                    <label className="text-foreground mb-1.5 block text-xs font-bold">
                      Hajm (sahifalar soni)
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { cnt: "15", label: "15 bet" },
                        { cnt: "19", label: "19 bet" },
                        { cnt: "25", label: "25 bet" },
                        { cnt: "30", label: "30 bet" },
                      ].map((item) => (
                        <button
                          key={item.cnt}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, pageCount: item.cnt }))}
                          className={`flex cursor-pointer items-center justify-center rounded-xl border py-2.5 text-xs font-bold transition-all ${
                            formData.pageCount === item.cnt
                              ? "bg-primary border-primary ring-primary/40 text-white shadow-md ring-1"
                              : "bg-surface-elevated border-border text-foreground hover:border-primary/50"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Til */}
                  <div>
                    <label className="text-foreground mb-1.5 block text-xs font-bold">
                      Hujjat tili
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "uz" as const, label: "O'zbek (Lotin)", flag: "🇺🇿" },
                        { id: "ru" as const, label: "Русский", flag: "🇷🇺" },
                      ].map((lang) => (
                        <button
                          key={lang.id}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, language: lang.id }))}
                          className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-semibold transition-all ${
                            formData.language === lang.id
                              ? "bg-primary border-primary text-white shadow-sm"
                              : "bg-surface-elevated border-border text-foreground hover:bg-border/40"
                          }`}
                        >
                          <span>{lang.flag}</span>
                          <span>{lang.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. OPTIONAL TITUL DETAILS COLLAPSIBLE ACCORDION */}
                <div className="border-border/80 bg-surface-elevated/40 rounded-xl border">
                  <button
                    type="button"
                    onClick={() => setShowTitleDetails(!showTitleDetails)}
                    className="text-foreground-secondary hover:text-foreground flex w-full cursor-pointer items-center justify-between p-3.5 text-xs font-bold transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span>🏛️</span>
                      <span>Titul varaq ma&apos;lumotlari (OTM, Talaba, Rahbar) — ixtiyoriy</span>
                    </div>
                    {showTitleDetails ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>

                  {showTitleDetails && (
                    <div className="border-border/60 space-y-3 border-t p-4 pt-3">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="text-foreground-secondary mb-1 block text-[11px] font-semibold">
                            OTM nomi
                          </label>
                          <input
                            type="text"
                            name="university"
                            value={formData.university}
                            onChange={handleChange}
                            placeholder="O'zbekiston Milliy Universiteti"
                            className="border-border bg-background text-foreground focus:border-primary w-full rounded-lg border px-3 py-2 text-xs focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-foreground-secondary mb-1 block text-[11px] font-semibold">
                            Yil
                          </label>
                          <input
                            type="text"
                            name="year"
                            value={formData.year}
                            onChange={handleChange}
                            className="border-border bg-background text-foreground focus:border-primary w-full rounded-lg border px-3 py-2 text-xs focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="text-foreground-secondary mb-1 block text-[11px] font-semibold">
                            Talaba F.I.Sh.
                          </label>
                          <input
                            type="text"
                            name="studentName"
                            value={formData.studentName}
                            onChange={handleChange}
                            placeholder="Aliyev Vali G'aniyevich"
                            className="border-border bg-background text-foreground focus:border-primary w-full rounded-lg border px-3 py-2 text-xs focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-foreground-secondary mb-1 block text-[11px] font-semibold">
                            Ilmiy rahbar
                          </label>
                          <input
                            type="text"
                            name="teacherName"
                            value={formData.teacherName}
                            onChange={handleChange}
                            placeholder="dots. Karimov A.A."
                            className="border-border bg-background text-foreground focus:border-primary w-full rounded-lg border px-3 py-2 text-xs focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. ACTION BUTTONS: 1-CLICK FAST TRACK + OUTLINE EDIT */}
                <div className="space-y-2.5 pt-2">
                  {/* Primary 1-Click Fast Track Button */}
                  <button
                    type="button"
                    onClick={() => handleOneClickGenerate()}
                    disabled={isFastGenerating || isOutlineLoading}
                    className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 px-4 py-3.5 text-xs font-extrabold text-white shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.01] hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] disabled:opacity-50 sm:text-sm"
                  >
                    {isFastGenerating ? (
                      <>
                        <Sparkles className="h-4 w-4 animate-spin" />
                        <span>Kurs ishi yaratilmoqda...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 text-amber-300 transition-transform group-hover:scale-110" />
                        <span>
                          Bir klikda Kurs Ishini Yaratish ({formData.pageCount || "19"} bet)
                        </span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>

                  {/* Secondary: Preview & Edit Outline First */}
                  <button
                    type="button"
                    onClick={handleProceedToOutline}
                    disabled={isOutlineLoading || isFastGenerating}
                    className="border-border hover:bg-surface-elevated text-foreground-secondary hover:text-foreground flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all disabled:opacity-50"
                  >
                    {isOutlineLoading ? (
                      <>
                        <Sparkles className="h-3.5 w-3.5 animate-spin" />
                        <span>Reja tuzilmoqda...</span>
                      </>
                    ) : (
                      <>
                        <Edit3 className="text-primary h-3.5 w-3.5" />
                        <span>Rejani oldindan ko&apos;rish va tahrirlash (2-bosqich)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 2: REJA VA MUNDARIJANI KO'RISH VA TAHRIRLASH */}
        {/* ========================================================= */}
        {currentStep === 2 && outline && (
          <div className="mx-auto max-w-4xl space-y-6">
            <div className="border-border bg-surface rounded-2xl border p-6 shadow-sm">
              <div className="border-border mb-6 flex flex-col justify-between gap-3 border-b pb-4 sm:flex-row sm:items-center">
                <div>
                  <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-400">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>Mundarija tuzilmasi</span>
                  </div>
                  <h2 className="text-foreground text-lg font-bold sm:text-xl">
                    2-bosqich: Kurs ishi rejasini tasdiqlash va tahrirlash
                  </h2>
                  <p className="text-foreground-secondary text-xs">
                    Reja MOVSO talablari asosida shakllantirildi. Boblar va paragraflar nomini
                    o&apos;zingiz yoki rahbar talabiga ko&apos;ra tahrirlashingiz mumkin.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleProceedToOutline}
                  disabled={isOutlineLoading}
                  className="border-border bg-surface-elevated text-foreground hover:bg-border/60 flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors"
                >
                  <RotateCcw className={`h-3.5 w-3.5 ${isOutlineLoading ? "animate-spin" : ""}`} />
                  <span>Qayta tuzish (AI)</span>
                </button>
              </div>

              {/* Titul Varaq Preview Box */}
              <div className="border-border/60 bg-surface-elevated/40 mb-5 rounded-xl border p-3 text-xs">
                <span className="text-foreground-muted block font-semibold">
                  Titul varaq ma&apos;lumotlari:
                </span>
                <span className="text-foreground font-medium">
                  {formData.university} • {formData.subject} • {formData.pageCount} sahifa
                </span>
              </div>

              {/* Kirish Preview Card */}
              <div className="border-border/70 bg-surface-elevated/60 mb-5 rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-foreground text-sm font-bold">KIRISH</h3>
                  <span className="text-primary bg-primary/10 rounded px-2 py-0.5 text-[11px] font-semibold">
                    1-2 sahifa
                  </span>
                </div>
                <div className="mt-2.5 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                  <div className="text-foreground-secondary flex items-start gap-1.5">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    <span>Mavzuning dolzarbligi va ahamiyati</span>
                  </div>
                  <div className="text-foreground-secondary flex items-start gap-1.5">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    <span>Muammoning ilmiy o&apos;rganilganlik darajasi</span>
                  </div>
                  <div className="text-foreground-secondary flex items-start gap-1.5">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    <span>Tadqiqot maqsadi va vazifalari</span>
                  </div>
                  <div className="text-foreground-secondary flex items-start gap-1.5">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    <span>Tadqiqot obyekti, predmeti va metodologiyasi</span>
                  </div>
                </div>
              </div>

              {/* 3 Editable Chapters */}
              <div className="space-y-4">
                {outline.chapters.map((chapter, chIdx) => (
                  <div
                    key={chIdx}
                    className="border-border bg-surface-elevated/70 focus-within:border-primary/50 rounded-xl border p-4 transition-all"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-primary text-xs font-bold">
                        {chIdx === 0
                          ? "I BOB: Nazariy asoslar"
                          : chIdx === 1
                            ? "II BOB: Amaliy tahlil"
                            : "III BOB: Takliflar va yechimlar"}
                      </span>
                      <span className="text-foreground-muted text-[11px]">
                        {chapter.subsections.length} ta paragraf
                      </span>
                    </div>

                    {/* Chapter Title Input */}
                    <input
                      type="text"
                      value={chapter.title}
                      onChange={(e) => handleChapterTitleChange(chIdx, e.target.value)}
                      className="border-border bg-background text-foreground focus:border-primary mb-3 w-full rounded-lg border px-3 py-2 text-xs font-bold focus:outline-none sm:text-sm"
                      placeholder="Bob sarlavhasi..."
                    />

                    {/* Subsections list */}
                    <div className="space-y-2">
                      {chapter.subsections.map((sub, subIdx) => (
                        <div key={subIdx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={sub}
                            onChange={(e) => handleSubsectionChange(chIdx, subIdx, e.target.value)}
                            className="border-border bg-background text-foreground-secondary focus:text-foreground focus:border-primary w-full rounded-lg border px-3 py-1.5 text-xs focus:outline-none"
                            placeholder="Paragraf nomi..."
                          />
                          {chapter.subsections.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSubsection(chIdx, subIdx)}
                              className="text-foreground-muted p-1 transition-colors hover:text-red-400"
                              title="Paragrafni o'chirish"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddSubsection(chIdx)}
                      className="text-primary hover:text-primary/80 mt-2 flex cursor-pointer items-center gap-1 text-[11px] font-semibold transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Paragraf qo&apos;shish</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Xulosa va Adabiyotlar preview */}
              <div className="border-border/70 bg-surface-elevated/40 mt-5 space-y-2 rounded-xl border p-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-foreground font-semibold">XULOSA VA AMALIY TAVSIYALAR</span>
                  <span className="font-semibold text-emerald-400">1-2 sahifa</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground font-semibold">
                    FOYDALANILGAN ADABIYOTLAR RO&apos;YXATI (GOST bo&apos;yicha 20 ta manba)
                  </span>
                  <span className="font-semibold text-emerald-400">20 ta manba</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="border-border bg-surface-elevated text-foreground hover:bg-border/60 flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-4 py-3 text-xs font-semibold transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Ortga (Parametrlarni o&apos;zgartirish)</span>
                </button>

                <button
                  type="button"
                  onClick={handleStartFullGeneration}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20 flex cursor-pointer items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-xs font-bold shadow-lg transition-all hover:scale-[1.01] sm:text-sm"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>To&apos;liq kurs ishini yaratish ({formData.pageCount} bet) 🚀</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 3: SUN'IY INTELLEKT GENERATSIYASI VA SKELETON */}
        {/* ========================================================= */}
        {currentStep === 3 && (
          <div className="mx-auto max-w-2xl">
            <div className="border-primary/30 bg-surface animate-in fade-in rounded-2xl border p-8 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-primary h-5 w-5 animate-spin" />
                  <span className="text-foreground text-base font-bold">
                    Sun&apos;iy intellekt kurs ishini yaratmoqda...
                  </span>
                </div>
                <span className="text-primary font-mono text-sm font-bold">{progressPercent}%</span>
              </div>

              {/* Progress bar */}
              <div className="bg-surface-elevated mb-6 h-2.5 w-full overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Step indicators */}
              <div className="mb-8 space-y-3">
                {GENERATION_STEPS.map((step, idx) => {
                  const isDone = idx < currentStepIdx;
                  const isCurrent = idx === currentStepIdx;
                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 text-xs transition-colors ${
                        isCurrent
                          ? "text-primary font-bold"
                          : isDone
                            ? "font-medium text-emerald-400"
                            : "text-foreground-muted opacity-60"
                      }`}
                    >
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                          isCurrent
                            ? "bg-primary text-primary-foreground animate-pulse"
                            : isDone
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-surface-elevated text-foreground-muted"
                        }`}
                      >
                        {isDone ? "✓" : idx + 1}
                      </div>
                      <span>{step}</span>
                    </div>
                  );
                })}
              </div>

              {/* Animated Skeleton Loader mimicking A4 Page */}
              <div className="border-border/60 bg-surface-elevated/40 rounded-xl border p-5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-2 w-2 animate-ping rounded-full bg-emerald-400" />
                  <span className="text-foreground-muted text-[11px] font-semibold">
                    Hujjat strukturasi yig&apos;ilmoqda (A4 format, Times New Roman 14pt, 1.5
                    interval)...
                  </span>
                </div>
                <div className="animate-pulse space-y-2.5">
                  <div className="bg-surface-elevated mx-auto h-4 w-3/4 rounded" />
                  <div className="bg-surface-elevated mx-auto h-3 w-1/2 rounded" />
                  <div className="bg-surface-elevated mt-4 h-2 w-full rounded" />
                  <div className="bg-surface-elevated h-2 w-full rounded" />
                  <div className="bg-surface-elevated h-2 w-5/6 rounded" />
                  <div className="bg-surface-elevated/60 my-3 h-10 w-full rounded" />
                  <div className="bg-surface-elevated h-2 w-full rounded" />
                  <div className="bg-surface-elevated h-2 w-4/5 rounded" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 4: TAYYOR KURS ISHI VA EKSPORT DASHBOARD */}
        {/* ========================================================= */}
        {currentStep === 4 && (pages.length > 0 || cleanResult) && (
          <div className="flex flex-col items-center">
            {/* Top Export Toolbar */}
            <div className="border-border bg-surface mb-6 flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 shadow-sm print:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-foreground text-sm font-bold">
                    Kurs ishi tayyor (
                    {pages.length > 0 ? `${pages.length} sahifa` : `${formData.pageCount} sahifa`})
                  </h3>
                  <span className="text-foreground-secondary text-xs">
                    MOVSO standarti • Times New Roman 14pt • Chapdan 25mm
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Word Download */}
                <button
                  onClick={handleDownloadWord}
                  className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:scale-105 hover:bg-blue-500"
                >
                  <FileDown className="h-4 w-4" />
                  <span>Word (.doc)</span>
                </button>

                {/* PDF Download */}
                <button
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold shadow-sm transition-all hover:scale-105 disabled:opacity-50"
                >
                  <span>{downloading ? "⏳" : "📥"}</span>
                  <span>{downloading ? downloadProgress || "Yuklanmoqda..." : "PDF"}</span>
                </button>

                {/* Print */}
                <button
                  onClick={handlePrint}
                  className="border-border bg-surface-elevated text-foreground hover:bg-border/60 flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors"
                  title="Chop etish yoki PDF sifatida saqlash"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>PDFni chop etish / saqlash</span>
                </button>

                {/* Copy */}
                <button
                  onClick={handleCopy}
                  className="border-border bg-surface-elevated text-foreground hover:bg-border/60 flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span>{copied ? "Nusxalandi" : "Nusxa"}</span>
                </button>

                {/* Edit Outline */}
                <button
                  onClick={() => setCurrentStep(2)}
                  className="border-border bg-surface-elevated text-foreground hover:bg-border/60 flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors"
                  title="Rejani tahrirlash"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Rejani tahrirlash</span>
                </button>

                {/* New Coursework */}
                <button
                  onClick={() => setCurrentStep(1)}
                  className="border-border bg-surface-elevated text-foreground hover:bg-border/60 flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors"
                  title="Yangi mavzu kiritish"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Yangi mavzu</span>
                </button>

                {/* Presentation Maker */}
                <Link
                  href={`/academic/presentation?topic=${encodeURIComponent(formData.topic)}&type=coursework`}
                  className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-purple-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition-all hover:scale-105 hover:bg-purple-500"
                >
                  <Presentation className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Slayd yaratish</span>
                </Link>
              </div>
            </div>

            {/* View Mode & Page Navigator */}
            {pages.length > 0 && (
              <div className="mb-4 flex w-full max-w-5xl items-center justify-between print:hidden">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewMode("pages")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      viewMode === "pages"
                        ? "bg-primary text-primary-foreground shadow"
                        : "bg-surface text-foreground-secondary hover:text-foreground"
                    }`}
                  >
                    A4 Sahifalar ({pages.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("continuous")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      viewMode === "continuous"
                        ? "bg-primary text-primary-foreground shadow"
                        : "bg-surface text-foreground-secondary hover:text-foreground"
                    }`}
                  >
                    Barcha sahifalar ro&apos;yxati
                  </button>
                </div>

                {viewMode === "pages" && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={activePageIndex === 0}
                      onClick={() => setActivePageIndex((p) => Math.max(0, p - 1))}
                      className="border-border bg-surface text-foreground hover:bg-surface-elevated rounded-lg border p-1.5 transition-colors disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-foreground text-xs font-semibold">
                      Sahifa {activePageIndex + 1} / {pages.length}
                    </span>
                    <button
                      type="button"
                      disabled={activePageIndex === pages.length - 1}
                      onClick={() => setActivePageIndex((p) => Math.min(pages.length - 1, p + 1))}
                      className="border-border bg-surface text-foreground hover:bg-surface-elevated rounded-lg border p-1.5 transition-colors disabled:opacity-40"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Document Render Container */}
            <div className="flex w-full justify-center overflow-x-auto px-0 pb-10 sm:px-4">
              <div
                ref={documentRef}
                id="coursework-document"
                className="coursework-document flex w-full max-w-[210mm] flex-col items-center print:block print:w-full"
              >
                {pages.length > 0 ? (
                  viewMode === "pages" ? (
                    // Single Page View with pagination controls
                    <div
                      key={activePage.pageNumber}
                      className="coursework-page-card mb-6 w-full max-w-[210mm] overflow-hidden rounded-sm border border-slate-200/90 bg-white shadow-2xl print:m-0 print:mb-0 print:border-0 print:shadow-none"
                    >
                      <div
                        className="coursework-page relative flex flex-col justify-between bg-white font-serif text-black"
                        style={{
                          width: "100%",
                          maxWidth: "210mm",
                          minHeight: "297mm",
                          boxSizing: "border-box",
                          paddingTop: "20mm",
                          paddingBottom: "20mm",
                          paddingRight: "20mm",
                          paddingLeft: "25mm",
                        }}
                      >
                        <div className="coursework-page-content prose prose-slate max-w-none flex-grow text-black">
                          <ReactMarkdown components={markdownComponents}>
                            {activePage.content}
                          </ReactMarkdown>
                        </div>
                        {activePage.pageNumber > 1 && (
                          <div className="coursework-page-footer mt-auto pt-3 text-center font-serif text-xs text-slate-700">
                            {activePage.pageNumber}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    // Continuous all pages view
                    pages.map((p) => (
                      <div
                        key={p.pageNumber}
                        className="coursework-page-card mb-6 w-full max-w-[210mm] overflow-hidden rounded-sm border border-slate-200/90 bg-white shadow-2xl print:m-0 print:mb-0 print:border-0 print:shadow-none"
                      >
                        <div
                          className="coursework-page relative flex flex-col justify-between bg-white font-serif text-black"
                          style={{
                            width: "100%",
                            maxWidth: "210mm",
                            minHeight: "297mm",
                            boxSizing: "border-box",
                            paddingTop: "20mm",
                            paddingBottom: "20mm",
                            paddingRight: "20mm",
                            paddingLeft: "25mm",
                          }}
                        >
                          <div className="coursework-page-content prose prose-slate max-w-none flex-grow text-black">
                            <ReactMarkdown components={markdownComponents}>
                              {p.content}
                            </ReactMarkdown>
                          </div>
                          {p.pageNumber > 1 && (
                            <div className="coursework-page-footer mt-auto pt-3 text-center font-serif text-xs text-slate-700">
                              {p.pageNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  // Fallback continuous markdown view
                  <div className="coursework-page-card mb-6 w-full max-w-[210mm] overflow-hidden rounded-sm border border-slate-200/90 bg-white shadow-2xl print:m-0 print:mb-0 print:border-0 print:shadow-none">
                    <div
                      className="coursework-page relative flex flex-col justify-between bg-white font-serif text-black"
                      style={{
                        width: "100%",
                        maxWidth: "210mm",
                        minHeight: "297mm",
                        boxSizing: "border-box",
                        paddingTop: "20mm",
                        paddingBottom: "20mm",
                        paddingRight: "20mm",
                        paddingLeft: "25mm",
                      }}
                    >
                      <div className="coursework-page-content prose prose-slate max-w-none flex-grow text-black">
                        <ReactMarkdown components={markdownComponents}>{cleanResult}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Print Specific CSS */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
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
          .coursework-document {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .coursework-page-card {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            page-break-after: always !important;
            break-after: page !important;
          }
          .coursework-page {
            width: 210mm !important;
            min-height: 297mm !important;
            box-sizing: border-box !important;
            padding: 20mm 20mm 20mm 25mm !important;
            page-break-after: always !important;
            break-after: page !important;
          }
        }
        .pdf-export-mode .coursework-page-card {
          box-shadow: none !important;
          border: none !important;
          margin: 0 !important;
          padding: 0 !important;
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
          "Kurs ishi yaratish bo'yicha bepul limitingiz tugadi. Cheksiz akademik generatsiya va yangi mavzular uchun tarifingizni oshiring."
        }
      />
    </div>
  );
}
