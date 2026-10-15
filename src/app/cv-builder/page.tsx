"use client";

import React, { useState, useRef } from "react";
import {
  Download,
  Printer,
  LayoutTemplate,
  Star,
  Crown,
  Plus,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Briefcase,
  GraduationCap,
  Code2,
  Languages,
  Check,
  Sparkles,
  FileText,
  User,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Experience {
  id: string;
  company: string;
  role: string;
  period: string;
  description: string;
}

interface Education {
  id: string;
  school: string;
  degree: string;
  year: string;
}

interface LanguageItem {
  id: string;
  name: string;
  level: string;
}

interface TemplateConfig {
  id: string;
  name: string;
  tag: string;
  isPro?: boolean;
  isPremium?: boolean;
  colorScheme: string;
  accentBg: string;
  description: string;
}

const TEMPLATES: TemplateConfig[] = [
  {
    id: "modern",
    name: "Modern Slate",
    tag: "Tavsiya etiladi",
    colorScheme: "border-sky-500",
    accentBg: "bg-sky-500",
    description: "Sodda va zamonaviy chiziqlar, ATS tizimlari uchun 100% mos.",
  },
  {
    id: "executive",
    name: "Executive Navy",
    tag: "Mashhur",
    isPro: true,
    colorScheme: "border-blue-900",
    accentBg: "bg-blue-900",
    description: "Boshqaruvchilar va rahbarlar uchun jiddiy to'q ko'k dizayn.",
  },
  {
    id: "tech",
    name: "Tech Sidebar",
    tag: "IT & Dasturchi",
    isPro: true,
    colorScheme: "border-slate-800",
    accentBg: "bg-slate-800",
    description: "Chap qorong'i yon panel va o'ng tajriba bloki bilan 2 ustunli.",
  },
  {
    id: "emerald",
    name: "Creative Emerald",
    tag: "Yangi",
    colorScheme: "border-emerald-600",
    accentBg: "bg-emerald-600",
    description: "Zamonaviy zumrad yashil rang va vertikal timeline tuzilishi.",
  },
  {
    id: "corporate",
    name: "Corporate Classic",
    tag: "ATS Standart",
    colorScheme: "border-gray-700",
    accentBg: "bg-gray-700",
    description: "An'anaviy markazlashgan sarlavha va klassik qora/oq format.",
  },
  {
    id: "violet",
    name: "Vibrant Violet",
    tag: "Dizayn & Startup",
    isPremium: true,
    colorScheme: "border-purple-600",
    accentBg: "bg-purple-600",
    description: "Jonli binafsha urg'ular va zamonaviy teglarga boy interfeys.",
  },
  {
    id: "burgundy",
    name: "Burgundy Luxe",
    tag: "Eksklyuziv",
    isPremium: true,
    colorScheme: "border-rose-900",
    accentBg: "bg-rose-900",
    description: "Nafis to'q qizil uslub va akademik/biznes darajadagi ko'rinish.",
  },
  {
    id: "compact",
    name: "Compact Grid",
    tag: "1 Sahifali",
    colorScheme: "border-amber-600",
    accentBg: "bg-amber-600",
    description: "Ko'p ma'lumotni 1 varaqqa zich va toza joylashtirish tartibi.",
  },
];

export default function CvBuilderPage() {
  const { toast } = useToast();
  const resumeRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"templates" | "editor">("templates");
  const [activeTemplate, setActiveTemplate] = useState<string>("modern");
  const [isExporting, setIsExporting] = useState(false);

  // Resume State
  const [personalInfo, setPersonalInfo] = useState({
    fullName: "Alex Johnson",
    role: "Senior Full Stack & AI Muhandis",
    email: "alex.johnson@example.com",
    phone: "+998 (90) 123-45-67",
    location: "Toshkent, O'zbekiston",
    website: "linkedin.com/in/alex-johnson",
    summary:
      "5+ yillik tajribaga ega Full-Stack dasturchi. Next.js, React, Node.js, PostgreSQL va Cloud arxitekturasi bo'yicha yuqori malakali mutaxassis. Yuqori yuklamali FinTech va SaaS loyihalarini noldan loyihalash, optimallashtirish va xavfsiz tizimlarni joriy etish bo'yicha boy amaliy tajribaga ega.",
  });

  const [experiences, setExperiences] = useState<Experience[]>([
    {
      id: "exp-1",
      company: "FinTech Innovations LLC",
      role: "Lead Full Stack Muhandis",
      period: "2022 - Hozirgacha",
      description:
        "• 500,000+ faol foydalanuvchiga ega to'lov tizimining server javob tezligini 45% ga oshirildi.\n• Micro-frontend arxitekturasini yaratib, jamoaviy deploy tezligini 3 baravarga tezlashtirildi.\n• 8 nafar dasturchilar guruhiga texnik rahbarlik va kod tahlili o'tkazildi.",
    },
    {
      id: "exp-2",
      company: "Global Tech Solutions",
      role: "Middle Frontend Dasturchi",
      period: "2020 - 2022",
      description:
        "• Next.js va Tailwind CSS yordamida korporativ SaaS boshqaruv paneli ishlab chiqildi.\n• WebSocket orqali real-vaqt rejimida tranzaksiyalar oqimini vizualizatsiya qiluvchi tizim yaratildi.",
    },
  ]);

  const [education, setEducation] = useState<Education[]>([
    {
      id: "edu-1",
      school: "Toshkent Axborot Texnologiyalari Universiteti (TATU)",
      degree: "Dasturiy injiniring (Bakalavr)",
      year: "2016 - 2020",
    },
  ]);

  const [skills, setSkills] = useState<string[]>([
    "TypeScript",
    "React / Next.js",
    "Node.js",
    "PostgreSQL / Prisma",
    "Tailwind CSS",
    "Docker / CI-CD",
    "REST & GraphQL",
    "AI / LLM API Integration",
  ]);

  const [newSkill, setNewSkill] = useState("");

  const [languages, setLanguages] = useState<LanguageItem[]>([
    { id: "lang-1", name: "O'zbek tili", level: "Ona tili" },
    { id: "lang-2", name: "Ingliz tili", level: "Professional (C1 / IELTS 7.5)" },
    { id: "lang-3", name: "Rus tili", level: "Erkin so'zlashuv" },
  ]);

  // Skill Handlers
  const handleAddSkill = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newSkill.trim()) return;
    if (skills.includes(newSkill.trim())) {
      toast({ title: "Ko'nikma mavjud", description: "Ushbu ko'nikma allaqachon qo'shilgan." });
      return;
    }
    setSkills([...skills, newSkill.trim()]);
    setNewSkill("");
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  // Experience Handlers
  const handleAddExperience = () => {
    const newExp: Experience = {
      id: "exp-" + Date.now(),
      company: "Yangi Kompaniya",
      role: "Dasturchi / Mutaxassis",
      period: "2023 - Hozirgacha",
      description: "• Asosiy vazifalar va erishilgan natijalar haqida qisqacha ma'lumot.",
    };
    setExperiences([newExp, ...experiences]);
  };

  const handleRemoveExperience = (id: string) => {
    setExperiences(experiences.filter((exp) => exp.id !== id));
  };

  const handleUpdateExperience = (id: string, field: keyof Experience, val: string) => {
    setExperiences(experiences.map((exp) => (exp.id === id ? { ...exp, [field]: val } : exp)));
  };

  // Education Handlers
  const handleAddEducation = () => {
    const newEdu: Education = {
      id: "edu-" + Date.now(),
      school: "Oliy ta'lim muassasasi",
      degree: "Mutaxassislik yo'nalishi",
      year: "2020 - 2024",
    };
    setEducation([...education, newEdu]);
  };

  const handleRemoveEducation = (id: string) => {
    setEducation(education.filter((edu) => edu.id !== id));
  };

  const handleUpdateEducation = (id: string, field: keyof Education, val: string) => {
    setEducation(education.map((edu) => (edu.id === id ? { ...edu, [field]: val } : edu)));
  };

  // Export PDF with html2pdf.js
  const handleDownloadPdf = async () => {
    if (!resumeRef.current) return;
    setIsExporting(true);
    toast({
      title: "PDF tayyorlanmoqda...",
      description: "Rezyumeyingiz yuklab olishga generatsiya qilinmoqda.",
    });

    try {
      const html2pdfModule = await import("html2pdf.js");
      const html2pdf = html2pdfModule.default as () => {
        set: (options: Record<string, unknown>) => {
          from: (element: HTMLElement) => {
            save: () => Promise<void>;
          };
        };
      };

      const opt = {
        margin: [6, 6, 6, 6],
        filename: `${personalInfo.fullName.replace(/\s+/g, "_") || "DocNova"}_Resume.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          logging: false,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      await html2pdf().set(opt).from(resumeRef.current).save();

      toast({
        title: "Muvaffaqiyatli yuklab olindi! 🎉",
        description: "Rezyume A4 PDF formatida saqlandi.",
      });
    } catch (err) {
      console.error("PDF Export Error:", err);
      toast({
        title: "Xatolik yuz berdi",
        description:
          "PDF yaratishda xatolik bo'ldi. 'Chop etish' tugmasi orqali PDF sifatida saqlashingiz mumkin.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Scoped CSS for seamless printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #resume-preview, #resume-preview * {
            visibility: visible;
          }
          #resume-preview {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 15mm !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>

      <div className="bg-background flex h-[calc(100vh-80px)] overflow-hidden">
        {/* Left Sidebar: Tabs for Templates & Editor */}
        <div className="border-border bg-surface z-10 flex h-full w-[420px] min-w-[360px] flex-col border-r shadow-lg">
          {/* Header */}
          <div className="border-border bg-surface/90 flex items-center justify-between border-b p-4 backdrop-blur">
            <div>
              <h2 className="text-foreground flex items-center gap-2 text-base font-bold">
                <FileText className="text-primary h-5 w-5" /> CV & Resume Hub
              </h2>
              <p className="text-foreground-secondary mt-0.5 text-xs">
                Professional A4 Rezyume Konstruktori
              </p>
            </div>

            {/* Export Actions */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrint}
                title="Chop etish / Print"
                className="border-border hover:bg-surface-elevated text-foreground-secondary hover:text-foreground rounded-lg border p-2 transition-colors"
              >
                <Printer className="h-4 w-4" />
              </button>
              <button
                onClick={handleDownloadPdf}
                disabled={isExporting}
                className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Yuklanmoqda...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    <span>PDF Export</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="bg-surface-elevated border-border grid grid-cols-2 border-b p-1.5 text-xs font-medium">
            <button
              onClick={() => setActiveTab("templates")}
              className={`flex items-center justify-center gap-2 rounded-md py-2 transition-all ${
                activeTab === "templates"
                  ? "bg-surface text-primary font-semibold shadow-sm"
                  : "text-foreground-secondary hover:text-foreground"
              }`}
            >
              <LayoutTemplate className="h-3.5 w-3.5" />
              Shablonlar ({TEMPLATES.length})
            </button>
            <button
              onClick={() => setActiveTab("editor")}
              className={`flex items-center justify-center gap-2 rounded-md py-2 transition-all ${
                activeTab === "editor"
                  ? "bg-surface text-primary font-semibold shadow-sm"
                  : "text-foreground-secondary hover:text-foreground"
              }`}
            >
              <User className="h-3.5 w-3.5" />
              Ma&apos;lumotlarni tahrirlash
            </button>
          </div>

          {/* Sidebar Body */}
          <div className="flex-1 space-y-6 overflow-y-auto p-4">
            {/* TAB 1: TEMPLATES GRID */}
            {activeTab === "templates" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-foreground flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
                    <Sparkles className="text-primary h-3.5 w-3.5" /> Dizayn Shablonini Tanlang
                  </h3>
                  <span className="text-foreground-secondary text-[11px]">Jonli almashinuv</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {TEMPLATES.map((tpl) => {
                    const isSelected = activeTemplate === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        onClick={() => {
                          setActiveTemplate(tpl.id);
                          toast({
                            title: `Shablon tanlandi: ${tpl.name}`,
                            description: "O'ng tomonda ko'rinish yangilandi.",
                          });
                        }}
                        className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border-2 p-2.5 text-left transition-all duration-200 ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-primary/10 ring-primary shadow-md ring-1"
                            : "border-border bg-surface hover:border-primary/50 hover:bg-surface-elevated"
                        }`}
                      >
                        {/* Mini visual mockup of the layout */}
                        <div className="border-border/80 relative mb-2 flex aspect-[1/1.2] w-full flex-col gap-1.5 overflow-hidden rounded-md border bg-white p-2 shadow-inner">
                          {/* Layout Mockup depending on template */}
                          {tpl.id === "modern" && (
                            <>
                              <div className="h-2.5 w-2/3 rounded-sm bg-sky-600" />
                              <div className="h-1 w-1/2 rounded-sm bg-gray-300" />
                              <div className="my-0.5 h-[1px] w-full bg-sky-200" />
                              <div className="h-1 w-full rounded-sm bg-gray-200" />
                              <div className="h-1 w-4/5 rounded-sm bg-gray-200" />
                              <div className="mt-1 h-1.5 w-1/3 rounded-sm bg-slate-700" />
                              <div className="h-4 w-full rounded border border-gray-200 bg-gray-100" />
                            </>
                          )}

                          {tpl.id === "executive" && (
                            <>
                              <div className="flex h-4 w-full flex-col justify-center rounded-sm bg-blue-950 p-0.5">
                                <div className="h-1 w-2/3 rounded-sm bg-white" />
                                <div className="mt-0.5 h-0.5 w-1/3 rounded-sm bg-amber-300" />
                              </div>
                              <div className="flex flex-1 gap-1">
                                <div className="flex w-1/3 flex-col gap-1 rounded-sm bg-gray-100 p-1">
                                  <div className="h-1 w-full rounded-sm bg-gray-400" />
                                  <div className="h-1 w-3/4 rounded-sm bg-gray-300" />
                                </div>
                                <div className="flex flex-1 flex-col gap-1">
                                  <div className="h-1 w-full rounded-sm bg-gray-300" />
                                  <div className="h-1 w-5/6 rounded-sm bg-gray-200" />
                                  <div className="mt-1 h-1 w-2/3 rounded-sm bg-blue-800" />
                                </div>
                              </div>
                            </>
                          )}

                          {tpl.id === "tech" && (
                            <div className="flex h-full gap-1">
                              <div className="flex w-1/3 flex-col gap-1 rounded-sm bg-slate-900 p-1">
                                <div className="mx-auto h-4 w-4 rounded-full bg-slate-700" />
                                <div className="h-0.5 w-full rounded-sm bg-sky-400" />
                                <div className="h-0.5 w-4/5 rounded-sm bg-slate-500" />
                              </div>
                              <div className="flex flex-1 flex-col gap-1">
                                <div className="h-2 w-3/4 rounded-sm bg-slate-900" />
                                <div className="h-1 w-1/2 rounded-sm bg-sky-600" />
                                <div className="my-0.5 h-[1px] w-full bg-gray-200" />
                                <div className="h-2 w-full rounded-sm bg-gray-100" />
                                <div className="h-2 w-4/5 rounded-sm bg-gray-100" />
                              </div>
                            </div>
                          )}

                          {tpl.id === "emerald" && (
                            <>
                              <div className="h-2.5 w-3/4 rounded-sm bg-emerald-700" />
                              <div className="h-1 w-1/2 rounded-sm bg-gray-400" />
                              <div className="h-0.5 w-full bg-emerald-500" />
                              <div className="mt-1 flex items-center gap-1">
                                <div className="h-3 w-1 rounded-full bg-emerald-600" />
                                <div className="h-1.5 w-2/3 rounded-sm bg-gray-700" />
                              </div>
                              <div className="h-3 w-full rounded-sm border border-emerald-200 bg-emerald-50/70" />
                            </>
                          )}

                          {tpl.id === "corporate" && (
                            <div className="flex flex-col items-center gap-1">
                              <div className="h-2 w-2/3 rounded-sm bg-gray-900" />
                              <div className="h-0.5 w-3/4 rounded-sm bg-gray-400" />
                              <div className="my-0.5 h-[1px] w-full bg-gray-400" />
                              <div className="flex w-full flex-col gap-1 text-left">
                                <div className="h-1 w-1/2 rounded-sm bg-gray-800" />
                                <div className="h-1 w-full rounded-sm bg-gray-200" />
                                <div className="h-1 w-4/5 rounded-sm bg-gray-200" />
                              </div>
                            </div>
                          )}

                          {tpl.id === "violet" && (
                            <>
                              <div className="h-1.5 w-full rounded-sm bg-gradient-to-r from-purple-600 to-indigo-600" />
                              <div className="h-2 w-2/3 rounded-sm bg-purple-900" />
                              <div className="h-1 w-1/2 rounded-sm bg-purple-400" />
                              <div className="mt-1 h-1 w-full rounded-sm bg-gray-200" />
                              <div className="mt-1 flex gap-1">
                                <div className="h-2 w-6 rounded-full bg-purple-100" />
                                <div className="h-2 w-6 rounded-full bg-purple-100" />
                              </div>
                            </>
                          )}

                          {tpl.id === "burgundy" && (
                            <>
                              <div className="h-2.5 w-3/4 rounded-sm bg-rose-950" />
                              <div className="h-1 w-1/2 rounded-sm bg-rose-600" />
                              <div className="h-[1px] w-full bg-rose-900" />
                              <div className="h-1 w-full rounded-sm bg-gray-200" />
                              <div className="h-1 w-4/5 rounded-sm bg-gray-200" />
                            </>
                          )}

                          {tpl.id === "compact" && (
                            <div className="grid h-full grid-cols-2 gap-1">
                              <div className="flex flex-col gap-1 border border-gray-200 bg-gray-50 p-1">
                                <div className="h-1 w-full rounded-sm bg-amber-600" />
                                <div className="h-0.5 w-full rounded-sm bg-gray-300" />
                                <div className="h-0.5 w-3/4 rounded-sm bg-gray-300" />
                              </div>
                              <div className="flex flex-col gap-1 border border-gray-200 bg-gray-50 p-1">
                                <div className="h-1 w-full rounded-sm bg-slate-700" />
                                <div className="h-0.5 w-full rounded-sm bg-gray-300" />
                              </div>
                            </div>
                          )}

                          {/* Selected Checkmark overlay */}
                          {isSelected && (
                            <div className="bg-primary absolute top-1 right-1 rounded-full p-1 text-white shadow">
                              <Check className="h-3 w-3 stroke-[3]" />
                            </div>
                          )}
                        </div>

                        {/* Title and tags */}
                        <div>
                          <div className="mb-1 flex items-center justify-between gap-1">
                            <span className="text-foreground truncate text-xs font-semibold">
                              {tpl.name}
                            </span>
                            {tpl.isPro && (
                              <span className="flex items-center gap-0.5 rounded bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-bold text-violet-500">
                                <Star className="h-2.5 w-2.5 fill-current" /> PRO
                              </span>
                            )}
                            {tpl.isPremium && (
                              <span className="flex items-center gap-0.5 rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-500">
                                <Crown className="h-2.5 w-2.5 fill-current" /> VIP
                              </span>
                            )}
                          </div>
                          <p className="text-foreground-secondary line-clamp-2 text-[10px] leading-tight">
                            {tpl.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: LIVE RESUME EDITOR */}
            {activeTab === "editor" && (
              <div className="space-y-6">
                {/* 1. Shaxsiy ma'lumotlar */}
                <div className="space-y-3">
                  <h4 className="text-foreground border-border flex items-center gap-1.5 border-b pb-1 text-xs font-bold tracking-wider uppercase">
                    <User className="text-primary h-3.5 w-3.5" /> Shaxsiy Ma&apos;lumotlar
                  </h4>

                  <div className="space-y-2.5">
                    <div>
                      <label className="text-foreground-secondary mb-1 block text-[11px] font-medium">
                        To&apos;liq Ism Familiya
                      </label>
                      <input
                        type="text"
                        value={personalInfo.fullName}
                        onChange={(e) =>
                          setPersonalInfo({ ...personalInfo, fullName: e.target.value })
                        }
                        className="bg-background border-border text-foreground focus:border-primary w-full rounded-lg border px-3 py-1.5 text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-foreground-secondary mb-1 block text-[11px] font-medium">
                        Mutaxassislik / Lavozim
                      </label>
                      <input
                        type="text"
                        value={personalInfo.role}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, role: e.target.value })}
                        className="bg-background border-border text-foreground focus:border-primary w-full rounded-lg border px-3 py-1.5 text-xs focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-foreground-secondary mb-1 block text-[11px] font-medium">
                          Email
                        </label>
                        <input
                          type="email"
                          value={personalInfo.email}
                          onChange={(e) =>
                            setPersonalInfo({ ...personalInfo, email: e.target.value })
                          }
                          className="bg-background border-border text-foreground focus:border-primary w-full rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-foreground-secondary mb-1 block text-[11px] font-medium">
                          Telefon
                        </label>
                        <input
                          type="text"
                          value={personalInfo.phone}
                          onChange={(e) =>
                            setPersonalInfo({ ...personalInfo, phone: e.target.value })
                          }
                          className="bg-background border-border text-foreground focus:border-primary w-full rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-foreground-secondary mb-1 block text-[11px] font-medium">
                          Manzil
                        </label>
                        <input
                          type="text"
                          value={personalInfo.location}
                          onChange={(e) =>
                            setPersonalInfo({ ...personalInfo, location: e.target.value })
                          }
                          className="bg-background border-border text-foreground focus:border-primary w-full rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-foreground-secondary mb-1 block text-[11px] font-medium">
                          LinkedIn / Havola
                        </label>
                        <input
                          type="text"
                          value={personalInfo.website}
                          onChange={(e) =>
                            setPersonalInfo({ ...personalInfo, website: e.target.value })
                          }
                          className="bg-background border-border text-foreground focus:border-primary w-full rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-foreground-secondary mb-1 block text-[11px] font-medium">
                        Professional Xulosa (Summary)
                      </label>
                      <textarea
                        value={personalInfo.summary}
                        onChange={(e) =>
                          setPersonalInfo({ ...personalInfo, summary: e.target.value })
                        }
                        rows={3}
                        className="bg-background border-border text-foreground focus:border-primary w-full resize-none rounded-lg border px-3 py-1.5 text-xs leading-relaxed focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Ish Tajribalari */}
                <div className="space-y-3">
                  <div className="border-border flex items-center justify-between border-b pb-1">
                    <h4 className="text-foreground flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
                      <Briefcase className="text-primary h-3.5 w-3.5" /> Ish Tajribasi
                    </h4>
                    <button
                      onClick={handleAddExperience}
                      className="text-primary hover:text-primary/80 flex items-center gap-1 text-[11px] font-semibold"
                    >
                      <Plus className="h-3.5 w-3.5" /> Tajriba qo&apos;shish
                    </button>
                  </div>

                  <div className="space-y-3">
                    {experiences.map((exp) => (
                      <div
                        key={exp.id}
                        className="bg-surface-elevated border-border group relative space-y-2 rounded-lg border p-3"
                      >
                        <button
                          onClick={() => handleRemoveExperience(exp.id)}
                          className="text-foreground-secondary absolute top-2 right-2 rounded p-1 transition-colors hover:text-red-500"
                          title="O'chirish"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>

                        <div className="grid grid-cols-2 gap-2 pr-6">
                          <div>
                            <label className="text-foreground-secondary block text-[10px]">
                              Kompaniya
                            </label>
                            <input
                              type="text"
                              value={exp.company}
                              onChange={(e) =>
                                handleUpdateExperience(exp.id, "company", e.target.value)
                              }
                              className="bg-background border-border text-foreground w-full rounded border px-2 py-1 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-foreground-secondary block text-[10px]">
                              Davr
                            </label>
                            <input
                              type="text"
                              value={exp.period}
                              onChange={(e) =>
                                handleUpdateExperience(exp.id, "period", e.target.value)
                              }
                              className="bg-background border-border text-foreground w-full rounded border px-2 py-1 text-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-foreground-secondary block text-[10px]">
                            Lavozim
                          </label>
                          <input
                            type="text"
                            value={exp.role}
                            onChange={(e) => handleUpdateExperience(exp.id, "role", e.target.value)}
                            className="bg-background border-border text-foreground w-full rounded border px-2 py-1 text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-foreground-secondary block text-[10px]">
                            Vazifalar & Yutuqlar
                          </label>
                          <textarea
                            value={exp.description}
                            onChange={(e) =>
                              handleUpdateExperience(exp.id, "description", e.target.value)
                            }
                            rows={3}
                            className="bg-background border-border text-foreground w-full resize-none rounded border px-2 py-1 text-xs leading-relaxed"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Ko'nikmalar */}
                <div className="space-y-3">
                  <h4 className="text-foreground border-border flex items-center gap-1.5 border-b pb-1 text-xs font-bold tracking-wider uppercase">
                    <Code2 className="text-primary h-3.5 w-3.5" /> Ko&apos;nikmalar (Skills)
                  </h4>

                  <form onSubmit={handleAddSkill} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Yangi ko'nikma (masalan: Docker)..."
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      className="bg-background border-border text-foreground focus:border-primary flex-1 rounded-lg border px-3 py-1.5 text-xs focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-3 py-1.5 text-xs font-medium"
                    >
                      Qo&apos;shish
                    </button>
                  </form>

                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((skill) => (
                      <span
                        key={skill}
                        className="bg-surface-elevated border-border text-foreground inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="text-foreground-secondary ml-0.5 hover:text-red-500"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* 4. Ta'lim */}
                <div className="space-y-3">
                  <div className="border-border flex items-center justify-between border-b pb-1">
                    <h4 className="text-foreground flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
                      <GraduationCap className="text-primary h-3.5 w-3.5" /> Ta&apos;lim (Education)
                    </h4>
                    <button
                      onClick={handleAddEducation}
                      className="text-primary hover:text-primary/80 flex items-center gap-1 text-[11px] font-semibold"
                    >
                      <Plus className="h-3.5 w-3.5" /> Qo&apos;shish
                    </button>
                  </div>

                  <div className="space-y-2">
                    {education.map((edu) => (
                      <div
                        key={edu.id}
                        className="bg-surface-elevated border-border group relative space-y-1.5 rounded-lg border p-2.5"
                      >
                        <button
                          onClick={() => handleRemoveEducation(edu.id)}
                          className="text-foreground-secondary absolute top-2 right-2 rounded p-1 hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <div>
                          <label className="text-foreground-secondary block text-[10px]">
                            Oliy o&apos;quv yurti
                          </label>
                          <input
                            type="text"
                            value={edu.school}
                            onChange={(e) =>
                              handleUpdateEducation(edu.id, "school", e.target.value)
                            }
                            className="bg-background border-border text-foreground w-full rounded border px-2 py-1 text-xs"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-foreground-secondary block text-[10px]">
                              Daraja / Yo&apos;nalish
                            </label>
                            <input
                              type="text"
                              value={edu.degree}
                              onChange={(e) =>
                                handleUpdateEducation(edu.id, "degree", e.target.value)
                              }
                              className="bg-background border-border text-foreground w-full rounded border px-2 py-1 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-foreground-secondary block text-[10px]">
                              Yil
                            </label>
                            <input
                              type="text"
                              value={edu.year}
                              onChange={(e) =>
                                handleUpdateEducation(edu.id, "year", e.target.value)
                              }
                              className="bg-background border-border text-foreground w-full rounded border px-2 py-1 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. Tillar */}
                <div className="space-y-3">
                  <h4 className="text-foreground border-border flex items-center gap-1.5 border-b pb-1 text-xs font-bold tracking-wider uppercase">
                    <Languages className="text-primary h-3.5 w-3.5" /> Tillar
                  </h4>
                  <div className="space-y-2">
                    {languages.map((lang) => (
                      <div key={lang.id} className="flex gap-2">
                        <input
                          type="text"
                          value={lang.name}
                          onChange={(e) =>
                            setLanguages(
                              languages.map((l) =>
                                l.id === lang.id ? { ...l, name: e.target.value } : l
                              )
                            )
                          }
                          className="bg-background border-border text-foreground w-1/2 rounded border px-2 py-1 text-xs"
                        />
                        <input
                          type="text"
                          value={lang.level}
                          onChange={(e) =>
                            setLanguages(
                              languages.map((l) =>
                                l.id === lang.id ? { ...l, level: e.target.value } : l
                              )
                            )
                          }
                          className="bg-background border-border text-foreground w-1/2 rounded border px-2 py-1 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Live A4 Resume Preview (0ms latency dynamic rendering) */}
        <div className="bg-surface-elevated/80 flex flex-1 flex-col items-center overflow-y-auto p-6 md:p-10">
          {/* Top Preview Bar */}
          <div className="text-foreground-secondary mb-4 flex w-full max-w-[210mm] items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <span className="text-foreground font-medium">
                Jonli A4 Prevyu:{" "}
                <span className="text-primary font-bold">
                  {TEMPLATES.find((t) => t.id === activeTemplate)?.name}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span>Hajm: 210 × 297 mm (Standart A4)</span>
              <button
                onClick={() => {
                  setPersonalInfo({
                    fullName: "Alex Johnson",
                    role: "Senior Full Stack & AI Muhandis",
                    email: "alex.johnson@example.com",
                    phone: "+998 (90) 123-45-67",
                    location: "Toshkent, O'zbekiston",
                    website: "linkedin.com/in/alex-johnson",
                    summary:
                      "5+ yillik tajribaga ega Full-Stack dasturchi. Next.js, React, Node.js, PostgreSQL va Cloud arxitekturasi bo'yicha yuqori malakali mutaxassis. Yuqori yuklamali FinTech va SaaS loyihalarini noldan loyihalash, optimallashtirish va xavfsiz tizimlarni joriy etish bo'yicha boy amaliy tajribaga ega.",
                  });
                  toast({
                    title: "Namuna tiklandi",
                    description: "Boshlang'ich ma'lumotlar yuklandi.",
                  });
                }}
                className="text-foreground-secondary hover:text-foreground flex items-center gap-1 text-[11px] hover:underline"
              >
                <RotateCcw className="h-3 w-3" /> Qayta tiklash
              </button>
            </div>
          </div>

          {/* A4 Resume Sheet Container */}
          <div
            id="resume-preview"
            ref={resumeRef}
            className="box-border min-h-[297mm] w-full max-w-[210mm] overflow-hidden rounded-sm bg-white text-black shadow-2xl transition-all duration-200"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {/* ========================================================== */}
            {/* TEMPLATE 1: MODERN SLATE */}
            {/* ========================================================== */}
            {activeTemplate === "modern" && (
              <div className="space-y-7 p-10">
                {/* Header */}
                <div className="border-b-2 border-slate-900 pb-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-3xl font-black tracking-tight text-slate-900">
                        {personalInfo.fullName || "To'liq Ismingiz"}
                      </h1>
                      <p className="mt-1 text-base font-semibold text-sky-600">
                        {personalInfo.role || "Mutaxassisligingiz"}
                      </p>
                    </div>
                  </div>

                  {/* Contact row */}
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 pt-3 text-xs text-slate-600">
                    {personalInfo.email && (
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-sky-600" /> {personalInfo.email}
                      </span>
                    )}
                    {personalInfo.phone && (
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-sky-600" /> {personalInfo.phone}
                      </span>
                    )}
                    {personalInfo.location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-sky-600" /> {personalInfo.location}
                      </span>
                    )}
                    {personalInfo.website && (
                      <span className="flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5 text-sky-600" /> {personalInfo.website}
                      </span>
                    )}
                  </div>
                </div>

                {/* Summary */}
                {personalInfo.summary && (
                  <div>
                    <h2 className="mb-2 flex items-center gap-2 text-xs font-bold tracking-widest text-slate-900 uppercase">
                      <span className="h-2 w-2 rounded-full bg-sky-600" /> Professional Xulosa
                    </h2>
                    <p className="text-xs leading-relaxed whitespace-pre-line text-slate-700">
                      {personalInfo.summary}
                    </p>
                  </div>
                )}

                {/* Experience */}
                <div>
                  <h2 className="mb-3 flex items-center gap-2 text-xs font-bold tracking-widest text-slate-900 uppercase">
                    <span className="h-2 w-2 rounded-full bg-sky-600" /> Ish Tajribasi
                  </h2>
                  <div className="space-y-4">
                    {experiences.map((exp) => (
                      <div key={exp.id} className="relative border-l-2 border-slate-200 pl-3">
                        <div className="flex items-baseline justify-between">
                          <h3 className="text-sm font-bold text-slate-900">{exp.role}</h3>
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                            {exp.period}
                          </span>
                        </div>
                        <p className="mb-1.5 text-xs font-semibold text-sky-700">{exp.company}</p>
                        <p className="text-xs leading-relaxed whitespace-pre-line text-slate-700">
                          {exp.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <h2 className="mb-2.5 flex items-center gap-2 text-xs font-bold tracking-widest text-slate-900 uppercase">
                    <span className="h-2 w-2 rounded-full bg-sky-600" /> Texnik Ko&apos;nikmalar
                  </h2>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Education & Languages 2 cols */}
                <div className="grid grid-cols-2 gap-6 pt-2">
                  <div>
                    <h2 className="mb-2.5 flex items-center gap-2 text-xs font-bold tracking-widest text-slate-900 uppercase">
                      <span className="h-2 w-2 rounded-full bg-sky-600" /> Ta&apos;lim
                    </h2>
                    {education.map((edu) => (
                      <div key={edu.id} className="text-xs">
                        <h4 className="font-bold text-slate-900">{edu.school}</h4>
                        <p className="text-slate-700">{edu.degree}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">{edu.year}</p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <h2 className="mb-2.5 flex items-center gap-2 text-xs font-bold tracking-widest text-slate-900 uppercase">
                      <span className="h-2 w-2 rounded-full bg-sky-600" /> Tillar
                    </h2>
                    <div className="space-y-1.5 text-xs">
                      {languages.map((l) => (
                        <div key={l.id} className="flex justify-between">
                          <span className="font-medium text-slate-800">{l.name}</span>
                          <span className="text-[11px] text-slate-500">{l.level}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================== */}
            {/* TEMPLATE 2: EXECUTIVE NAVY */}
            {/* ========================================================== */}
            {activeTemplate === "executive" && (
              <div>
                {/* Deep Navy Top Banner */}
                <div className="bg-[#0f172a] px-10 py-8 text-white">
                  <h1 className="text-3xl font-extrabold tracking-tight text-white uppercase">
                    {personalInfo.fullName || "To'liq Ismingiz"}
                  </h1>
                  <p className="mt-1 text-base font-medium tracking-wide text-amber-400">
                    {personalInfo.role || "Mutaxassisligingiz"}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-slate-700 pt-3 text-xs text-slate-300">
                    {personalInfo.email && <span>{personalInfo.email}</span>}
                    {personalInfo.phone && <span>• {personalInfo.phone}</span>}
                    {personalInfo.location && <span>• {personalInfo.location}</span>}
                    {personalInfo.website && <span>• {personalInfo.website}</span>}
                  </div>
                </div>

                {/* 2-Column Body */}
                <div className="grid grid-cols-12 gap-6 p-8">
                  {/* Left Column (4 cols) */}
                  <div className="col-span-4 space-y-6 border-r border-slate-200 pr-4">
                    <div>
                      <h3 className="mb-2 border-b-2 border-amber-500 pb-1 text-xs font-bold tracking-wider text-[#0f172a] uppercase">
                        Ko&apos;nikmalar
                      </h3>
                      <div className="space-y-1.5">
                        {skills.map((s) => (
                          <div
                            key={s}
                            className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-800"
                          >
                            {s}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-2 border-b-2 border-amber-500 pb-1 text-xs font-bold tracking-wider text-[#0f172a] uppercase">
                        Ta&apos;lim
                      </h3>
                      {education.map((e) => (
                        <div key={e.id} className="mb-2 text-xs">
                          <p className="font-bold text-slate-900">{e.school}</p>
                          <p className="text-slate-700">{e.degree}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500">{e.year}</p>
                        </div>
                      ))}
                    </div>

                    <div>
                      <h3 className="mb-2 border-b-2 border-amber-500 pb-1 text-xs font-bold tracking-wider text-[#0f172a] uppercase">
                        Tillar
                      </h3>
                      <div className="space-y-1 text-xs">
                        {languages.map((l) => (
                          <div key={l.id}>
                            <p className="font-bold text-slate-800">{l.name}</p>
                            <p className="text-[11px] text-slate-600">{l.level}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column (8 cols) */}
                  <div className="col-span-8 space-y-6">
                    {personalInfo.summary && (
                      <div>
                        <h3 className="mb-2 border-b-2 border-[#0f172a] pb-1 text-xs font-bold tracking-wider text-[#0f172a] uppercase">
                          Professional Xulosa
                        </h3>
                        <p className="text-xs leading-relaxed text-slate-700">
                          {personalInfo.summary}
                        </p>
                      </div>
                    )}

                    <div>
                      <h3 className="mb-3 border-b-2 border-[#0f172a] pb-1 text-xs font-bold tracking-wider text-[#0f172a] uppercase">
                        Ish Faoliyati & Tajriba
                      </h3>
                      <div className="space-y-4">
                        {experiences.map((exp) => (
                          <div key={exp.id}>
                            <div className="flex items-baseline justify-between">
                              <h4 className="text-sm font-bold text-slate-900">{exp.role}</h4>
                              <span className="text-[11px] font-semibold text-slate-500">
                                {exp.period}
                              </span>
                            </div>
                            <p className="mb-1 text-xs font-semibold text-blue-900">
                              {exp.company}
                            </p>
                            <p className="text-xs leading-relaxed whitespace-pre-line text-slate-700">
                              {exp.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================== */}
            {/* TEMPLATE 3: TECH SIDEBAR */}
            {/* ========================================================== */}
            {activeTemplate === "tech" && (
              <div className="flex min-h-[297mm]">
                {/* Left Dark Sidebar */}
                <div className="flex w-[34%] flex-col justify-between space-y-6 bg-slate-900 p-7 text-white">
                  <div className="space-y-6">
                    {/* Initials badge */}
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500 text-2xl font-black text-slate-900 shadow-lg">
                      {personalInfo.fullName
                        ? personalInfo.fullName
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")
                        : "CV"}
                    </div>

                    {/* Contact */}
                    <div className="space-y-2.5 text-xs text-slate-300">
                      <h3 className="border-b border-slate-700 pb-1 text-[11px] font-bold tracking-widest text-sky-400 uppercase">
                        Aloqa
                      </h3>
                      {personalInfo.email && (
                        <p className="flex items-center gap-2 break-all">
                          <Mail className="h-3.5 w-3.5 shrink-0 text-sky-400" />{" "}
                          {personalInfo.email}
                        </p>
                      )}
                      {personalInfo.phone && (
                        <p className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 shrink-0 text-sky-400" />{" "}
                          {personalInfo.phone}
                        </p>
                      )}
                      {personalInfo.location && (
                        <p className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-sky-400" />{" "}
                          {personalInfo.location}
                        </p>
                      )}
                      {personalInfo.website && (
                        <p className="flex items-center gap-2 break-all">
                          <Globe className="h-3.5 w-3.5 shrink-0 text-sky-400" />{" "}
                          {personalInfo.website}
                        </p>
                      )}
                    </div>

                    {/* Skills */}
                    <div>
                      <h3 className="mb-2 border-b border-slate-700 pb-1 text-[11px] font-bold tracking-widest text-sky-400 uppercase">
                        Texnologiyalar
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {skills.map((s) => (
                          <span
                            key={s}
                            className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[11px] text-slate-200"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Education */}
                    <div>
                      <h3 className="mb-2 border-b border-slate-700 pb-1 text-[11px] font-bold tracking-widest text-sky-400 uppercase">
                        Ta&apos;lim
                      </h3>
                      {education.map((e) => (
                        <div key={e.id} className="mb-2 text-xs">
                          <p className="font-semibold text-white">{e.school}</p>
                          <p className="text-[11px] text-slate-400">{e.degree}</p>
                          <p className="mt-0.5 text-[10px] text-sky-400">{e.year}</p>
                        </div>
                      ))}
                    </div>

                    {/* Languages */}
                    <div>
                      <h3 className="mb-2 border-b border-slate-700 pb-1 text-[11px] font-bold tracking-widest text-sky-400 uppercase">
                        Tillar
                      </h3>
                      <div className="space-y-1 text-xs">
                        {languages.map((l) => (
                          <div key={l.id} className="flex justify-between">
                            <span className="text-slate-300">{l.name}</span>
                            <span className="text-[11px] text-slate-500">{l.level}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Content */}
                <div className="w-[66%] space-y-6 p-8">
                  <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">
                      {personalInfo.fullName || "To'liq Ismingiz"}
                    </h1>
                    <p className="mt-0.5 text-base font-semibold text-sky-600">
                      {personalInfo.role || "Mutaxassisligingiz"}
                    </p>
                  </div>

                  {personalInfo.summary && (
                    <div>
                      <h2 className="mb-1.5 border-b border-slate-200 pb-1 text-xs font-bold tracking-widest text-slate-900 uppercase">
                        Profil haqida
                      </h2>
                      <p className="text-xs leading-relaxed text-slate-700">
                        {personalInfo.summary}
                      </p>
                    </div>
                  )}

                  <div>
                    <h2 className="mb-3 border-b border-slate-200 pb-1 text-xs font-bold tracking-widest text-slate-900 uppercase">
                      Ish Tajribasi
                    </h2>
                    <div className="space-y-4">
                      {experiences.map((exp) => (
                        <div key={exp.id} className="border-l-2 border-sky-500 pl-3">
                          <div className="flex items-baseline justify-between">
                            <h3 className="text-sm font-bold text-slate-900">{exp.role}</h3>
                            <span className="text-[11px] font-medium text-slate-500">
                              {exp.period}
                            </span>
                          </div>
                          <p className="mb-1 text-xs font-semibold text-sky-700">{exp.company}</p>
                          <p className="text-xs leading-relaxed whitespace-pre-line text-slate-700">
                            {exp.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================== */}
            {/* TEMPLATE 4: CREATIVE EMERALD */}
            {/* ========================================================== */}
            {activeTemplate === "emerald" && (
              <div className="space-y-7 p-10">
                {/* Header */}
                <div className="flex items-end justify-between border-b-2 border-emerald-600 pb-4">
                  <div>
                    <span className="text-xs font-bold tracking-widest text-emerald-600 uppercase">
                      Rezyume
                    </span>
                    <h1 className="text-3xl font-black text-slate-900">{personalInfo.fullName}</h1>
                    <p className="mt-0.5 text-sm font-medium text-slate-600">{personalInfo.role}</p>
                  </div>

                  <div className="space-y-0.5 text-right text-xs text-slate-600">
                    <p>{personalInfo.email}</p>
                    <p>{personalInfo.phone}</p>
                    <p>{personalInfo.location}</p>
                  </div>
                </div>

                {/* Summary */}
                {personalInfo.summary && (
                  <div>
                    <h2 className="mb-2 border-l-4 border-emerald-600 pl-2 text-xs font-bold tracking-wider text-emerald-800 uppercase">
                      Professional Tavsif
                    </h2>
                    <p className="rounded border border-emerald-100 bg-emerald-50/50 p-3 text-xs leading-relaxed text-slate-700">
                      {personalInfo.summary}
                    </p>
                  </div>
                )}

                {/* Experience */}
                <div>
                  <h2 className="mb-3 border-l-4 border-emerald-600 pl-2 text-xs font-bold tracking-wider text-emerald-800 uppercase">
                    Ish Tajribasi
                  </h2>
                  <div className="space-y-4">
                    {experiences.map((exp) => (
                      <div key={exp.id} className="relative border-l-2 border-emerald-300 pl-4">
                        <div className="absolute top-1.5 -left-[5px] h-2 w-2 rounded-full bg-emerald-600" />
                        <div className="flex items-baseline justify-between">
                          <h3 className="text-sm font-bold text-slate-900">{exp.role}</h3>
                          <span className="text-[11px] font-semibold text-emerald-700">
                            {exp.period}
                          </span>
                        </div>
                        <p className="mb-1 text-xs font-medium text-slate-600">{exp.company}</p>
                        <p className="text-xs leading-relaxed whitespace-pre-line text-slate-700">
                          {exp.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills as emerald badges */}
                <div>
                  <h2 className="mb-2.5 border-l-4 border-emerald-600 pl-2 text-xs font-bold tracking-wider text-emerald-800 uppercase">
                    Ko&apos;nikmalar
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((s) => (
                      <span
                        key={s}
                        className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Education & Languages */}
                <div className="grid grid-cols-2 gap-6 pt-2">
                  <div>
                    <h2 className="mb-2 border-l-4 border-emerald-600 pl-2 text-xs font-bold tracking-wider text-emerald-800 uppercase">
                      Ta&apos;lim
                    </h2>
                    {education.map((e) => (
                      <div key={e.id} className="text-xs">
                        <p className="font-bold text-slate-900">{e.school}</p>
                        <p className="text-slate-600">{e.degree}</p>
                        <p className="text-[11px] text-emerald-700">{e.year}</p>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h2 className="mb-2 border-l-4 border-emerald-600 pl-2 text-xs font-bold tracking-wider text-emerald-800 uppercase">
                      Tillar
                    </h2>
                    <div className="space-y-1 text-xs">
                      {languages.map((l) => (
                        <div key={l.id} className="flex justify-between">
                          <span className="font-semibold text-slate-800">{l.name}</span>
                          <span className="text-[11px] text-slate-600">{l.level}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================== */}
            {/* TEMPLATE 5: CORPORATE CLASSIC (ATS Standard) */}
            {/* ========================================================== */}
            {activeTemplate === "corporate" && (
              <div className="space-y-6 p-10">
                {/* Centered Classic Header */}
                <div className="border-b border-black pb-4 text-center">
                  <h1 className="font-serif text-2xl font-bold tracking-wider text-black uppercase">
                    {personalInfo.fullName}
                  </h1>
                  <p className="mt-1 font-serif text-sm text-gray-700 italic">
                    {personalInfo.role}
                  </p>
                  <p className="mt-2 text-xs text-gray-600">
                    {[
                      personalInfo.location,
                      personalInfo.phone,
                      personalInfo.email,
                      personalInfo.website,
                    ]
                      .filter(Boolean)
                      .join("  •  ")}
                  </p>
                </div>

                {/* Summary */}
                {personalInfo.summary && (
                  <div>
                    <h2 className="mb-2 border-b border-gray-300 pb-1 text-xs font-bold tracking-widest text-black uppercase">
                      Professional Profile
                    </h2>
                    <p className="text-justify text-xs leading-relaxed text-gray-800">
                      {personalInfo.summary}
                    </p>
                  </div>
                )}

                {/* Experience */}
                <div>
                  <h2 className="mb-3 border-b border-gray-300 pb-1 text-xs font-bold tracking-widest text-black uppercase">
                    Professional Experience
                  </h2>
                  <div className="space-y-4">
                    {experiences.map((exp) => (
                      <div key={exp.id}>
                        <div className="flex items-baseline justify-between text-xs font-bold text-black">
                          <span>
                            {exp.company} — <span className="font-normal italic">{exp.role}</span>
                          </span>
                          <span className="text-[11px] font-normal">{exp.period}</span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed whitespace-pre-line text-gray-700">
                          {exp.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <h2 className="mb-2 border-b border-gray-300 pb-1 text-xs font-bold tracking-widest text-black uppercase">
                    Key Competencies & Technical Skills
                  </h2>
                  <p className="text-xs leading-relaxed text-gray-800">{skills.join(" • ")}</p>
                </div>

                {/* Education */}
                <div>
                  <h2 className="mb-2 border-b border-gray-300 pb-1 text-xs font-bold tracking-widest text-black uppercase">
                    Education & Credentials
                  </h2>
                  {education.map((e) => (
                    <div key={e.id} className="mb-1 flex justify-between text-xs text-black">
                      <div>
                        <span className="font-bold">{e.school}</span> — <span>{e.degree}</span>
                      </div>
                      <span className="text-[11px] text-gray-600">{e.year}</span>
                    </div>
                  ))}
                </div>

                {/* Languages */}
                <div>
                  <h2 className="mb-2 border-b border-gray-300 pb-1 text-xs font-bold tracking-widest text-black uppercase">
                    Languages
                  </h2>
                  <p className="text-xs text-gray-800">
                    {languages.map((l) => `${l.name} (${l.level})`).join(" • ")}
                  </p>
                </div>
              </div>
            )}

            {/* ========================================================== */}
            {/* TEMPLATE 6: VIBRANT VIOLET */}
            {/* ========================================================== */}
            {activeTemplate === "violet" && (
              <div className="space-y-7 p-10">
                {/* Purple Gradient Top Bar */}
                <div className="h-2 w-full rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500" />

                <div className="flex items-start justify-between pt-2">
                  <div>
                    <h1 className="text-3xl font-extrabold text-slate-900">
                      {personalInfo.fullName}
                    </h1>
                    <p className="mt-0.5 text-sm font-bold text-purple-600">{personalInfo.role}</p>
                  </div>
                  <div className="space-y-0.5 text-right text-xs text-slate-600">
                    <p className="font-medium">{personalInfo.email}</p>
                    <p>{personalInfo.phone}</p>
                    <p>{personalInfo.location}</p>
                  </div>
                </div>

                {/* Summary */}
                {personalInfo.summary && (
                  <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-4">
                    <p className="text-xs leading-relaxed text-slate-700">{personalInfo.summary}</p>
                  </div>
                )}

                {/* Experience */}
                <div>
                  <h2 className="mb-3 flex items-center gap-2 text-xs font-black tracking-widest text-purple-900 uppercase">
                    <Briefcase className="h-4 w-4 text-purple-600" /> Ish Tajribasi
                  </h2>
                  <div className="space-y-4">
                    {experiences.map((exp) => (
                      <div
                        key={exp.id}
                        className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm"
                      >
                        <div className="mb-1 flex items-baseline justify-between">
                          <h3 className="text-sm font-bold text-slate-900">{exp.role}</h3>
                          <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-bold text-purple-700">
                            {exp.period}
                          </span>
                        </div>
                        <p className="mb-2 text-xs font-semibold text-slate-600">{exp.company}</p>
                        <p className="text-xs leading-relaxed whitespace-pre-line text-slate-700">
                          {exp.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <h2 className="mb-2.5 flex items-center gap-2 text-xs font-black tracking-widest text-purple-900 uppercase">
                    <Code2 className="h-4 w-4 text-purple-600" /> Ko&apos;nikmalar
                  </h2>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((s) => (
                      <span
                        key={s}
                        className="rounded-md border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-900"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Education & Languages */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <h3 className="mb-2 text-xs font-bold text-slate-900 uppercase">Ta&apos;lim</h3>
                    {education.map((e) => (
                      <div key={e.id} className="text-xs">
                        <p className="font-bold text-slate-900">{e.school}</p>
                        <p className="text-slate-600">{e.degree}</p>
                        <p className="text-[11px] font-medium text-purple-600">{e.year}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <h3 className="mb-2 text-xs font-bold text-slate-900 uppercase">Tillar</h3>
                    <div className="space-y-1 text-xs">
                      {languages.map((l) => (
                        <div key={l.id} className="flex justify-between">
                          <span className="font-medium text-slate-800">{l.name}</span>
                          <span className="text-[11px] text-slate-500">{l.level}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================== */}
            {/* TEMPLATE 7: BURGUNDY LUXE */}
            {/* ========================================================== */}
            {activeTemplate === "burgundy" && (
              <div className="space-y-6 p-10">
                <div className="flex items-baseline justify-between border-b-4 border-rose-950 pb-4">
                  <div>
                    <h1 className="font-serif text-3xl font-black tracking-tight text-rose-950 uppercase">
                      {personalInfo.fullName}
                    </h1>
                    <p className="mt-0.5 text-sm font-medium text-rose-800">{personalInfo.role}</p>
                  </div>
                  <div className="text-right text-xs text-slate-700">
                    <p>{personalInfo.email}</p>
                    <p>{personalInfo.phone}</p>
                    <p>{personalInfo.location}</p>
                  </div>
                </div>

                {personalInfo.summary && (
                  <div>
                    <h2 className="mb-1.5 border-b border-rose-200 pb-1 font-serif text-xs font-bold tracking-wider text-rose-950 uppercase">
                      Ijroiya Profil
                    </h2>
                    <p className="text-xs leading-relaxed text-slate-800">{personalInfo.summary}</p>
                  </div>
                )}

                <div>
                  <h2 className="mb-3 border-b border-rose-200 pb-1 font-serif text-xs font-bold tracking-wider text-rose-950 uppercase">
                    Tajriba va Yutuqlar
                  </h2>
                  <div className="space-y-4">
                    {experiences.map((exp) => (
                      <div key={exp.id}>
                        <div className="flex items-baseline justify-between">
                          <h3 className="text-sm font-bold text-slate-900">{exp.role}</h3>
                          <span className="text-[11px] font-bold text-rose-900">{exp.period}</span>
                        </div>
                        <p className="mb-1 text-xs font-semibold text-rose-800">{exp.company}</p>
                        <p className="text-xs leading-relaxed whitespace-pre-line text-slate-700">
                          {exp.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="mb-2 border-b border-rose-200 pb-1 font-serif text-xs font-bold tracking-wider text-rose-950 uppercase">
                    Malaka va Tajriba Sohalari
                  </h2>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((s) => (
                      <span
                        key={s}
                        className="rounded border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-950"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-2">
                  <div>
                    <h2 className="mb-1 border-b border-rose-200 pb-1 font-serif text-xs font-bold tracking-wider text-rose-950 uppercase">
                      Ta&apos;lim
                    </h2>
                    {education.map((e) => (
                      <div key={e.id} className="text-xs">
                        <p className="font-bold text-slate-900">{e.school}</p>
                        <p className="text-slate-600">{e.degree}</p>
                        <p className="text-[11px] font-medium text-rose-800">{e.year}</p>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h2 className="mb-1 border-b border-rose-200 pb-1 font-serif text-xs font-bold tracking-wider text-rose-950 uppercase">
                      Til Bilish Darajasi
                    </h2>
                    <div className="space-y-1 text-xs">
                      {languages.map((l) => (
                        <div key={l.id} className="flex justify-between">
                          <span className="font-medium text-slate-800">{l.name}</span>
                          <span className="text-[11px] font-medium text-rose-900">{l.level}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================== */}
            {/* TEMPLATE 8: COMPACT GRID */}
            {/* ========================================================== */}
            {activeTemplate === "compact" && (
              <div className="space-y-5 p-8">
                <div className="flex items-center justify-between border-b-2 border-amber-600 pb-3">
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 uppercase">
                      {personalInfo.fullName}
                    </h1>
                    <p className="text-xs font-bold text-amber-700">{personalInfo.role}</p>
                  </div>
                  <div className="text-right text-[11px] text-slate-600">
                    <p>
                      {personalInfo.email} • {personalInfo.phone}
                    </p>
                    <p>
                      {personalInfo.location} • {personalInfo.website}
                    </p>
                  </div>
                </div>

                {personalInfo.summary && (
                  <div>
                    <h2 className="mb-1 text-[11px] font-black tracking-wider text-slate-900 uppercase">
                      Professional Xulosa
                    </h2>
                    <p className="text-xs leading-relaxed text-slate-700">{personalInfo.summary}</p>
                  </div>
                )}

                <div className="grid grid-cols-12 gap-5">
                  <div className="col-span-7 space-y-4">
                    <h2 className="border-b border-slate-300 pb-1 text-[11px] font-black tracking-wider text-slate-900 uppercase">
                      Ish Tajribasi
                    </h2>
                    <div className="space-y-3">
                      {experiences.map((exp) => (
                        <div key={exp.id}>
                          <div className="flex items-baseline justify-between">
                            <h3 className="text-xs font-bold text-slate-900">{exp.role}</h3>
                            <span className="text-[10px] font-semibold text-slate-500">
                              {exp.period}
                            </span>
                          </div>
                          <p className="text-[11px] font-semibold text-amber-800">{exp.company}</p>
                          <p className="mt-1 text-[11px] leading-snug whitespace-pre-line text-slate-700">
                            {exp.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="col-span-5 space-y-4 border-l border-slate-200 pl-4">
                    <div>
                      <h2 className="mb-2 border-b border-slate-300 pb-1 text-[11px] font-black tracking-wider text-slate-900 uppercase">
                        Ko&apos;nikmalar
                      </h2>
                      <div className="flex flex-wrap gap-1">
                        {skills.map((s) => (
                          <span
                            key={s}
                            className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-800"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h2 className="mb-2 border-b border-slate-300 pb-1 text-[11px] font-black tracking-wider text-slate-900 uppercase">
                        Ta&apos;lim
                      </h2>
                      {education.map((e) => (
                        <div key={e.id} className="mb-1.5 text-xs">
                          <p className="text-[11px] font-bold text-slate-900">{e.school}</p>
                          <p className="text-[10px] text-slate-600">{e.degree}</p>
                          <p className="text-[10px] text-amber-700">{e.year}</p>
                        </div>
                      ))}
                    </div>

                    <div>
                      <h2 className="mb-2 border-b border-slate-300 pb-1 text-[11px] font-black tracking-wider text-slate-900 uppercase">
                        Tillar
                      </h2>
                      <div className="space-y-1 text-xs">
                        {languages.map((l) => (
                          <div key={l.id} className="flex justify-between text-[11px]">
                            <span className="font-medium text-slate-800">{l.name}</span>
                            <span className="text-slate-500">{l.level}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
