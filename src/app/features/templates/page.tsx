"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutTemplate,
  X,
  Check,
  Eye,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Crown,
} from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import { useRouter } from "next/navigation";

export interface TemplateItem {
  id: string;
  name: string;
  categories: string[];
  tag: string;
  isPro?: boolean;
  isPremium?: boolean;
  accent: string;
  bg: string;
  border: string;
  preview: string;
  features: string[];
}

const TEMPLATES_LIST: TemplateItem[] = [
  // IT & Dasturchilar
  {
    id: "modern",
    name: "Modern Slate",
    categories: ["IT", "Dasturchilar"],
    tag: "Tavsiya etiladi",
    accent: "from-sky-500 to-blue-600",
    bg: "from-sky-500/10 to-blue-500/5",
    border: "border-sky-500/30",
    preview: "Sodda va zamonaviy chiziqlar, ATS tizimlari uchun 100% mos va xalqaro standart.",
    features: ["100% ATS Pass", "Minimalist tartib", "Tezkor skanerlash"],
  },
  {
    id: "tech",
    name: "Tech Sidebar",
    categories: ["IT", "Dasturchilar"],
    tag: "IT & Dasturchi",
    isPro: true,
    accent: "from-slate-700 to-slate-900",
    bg: "from-slate-700/10 to-slate-900/5",
    border: "border-slate-600/30",
    preview: "Chap qorong'i yon panel va o'ng tajriba bloki bilan 2 ustunli muhandislik formati.",
    features: ["2 ustunli tizim", "Texnologiyalar paneli", "GitHub & LeetCode"],
  },
  {
    id: "cyber",
    name: "Cyber Dark Pro",
    categories: ["IT", "Dasturchilar"],
    tag: "Security / DevOps",
    isPro: true,
    accent: "from-cyan-600 to-blue-700",
    bg: "from-cyan-600/10 to-blue-700/5",
    border: "border-cyan-500/30",
    preview: "Kiberxavfsizlik, tarmoq va DevOps muhandislari uchun jiddiy texnologik uslub.",
    features: ["DevOps stack", "Sertifikatlar bloki", "Yuqori kontrast"],
  },
  {
    id: "terminal",
    name: "DevOps Terminal",
    categories: ["IT", "Dasturchilar"],
    tag: "Backend & Cloud",
    isPremium: true,
    accent: "from-emerald-600 to-teal-700",
    bg: "from-emerald-600/10 to-teal-700/5",
    border: "border-emerald-500/30",
    preview: "Terminal va Linux konsol estetikasiga asoslangan yuqori aniqlikdagi texnik dizayn.",
    features: ["Terminal uslubi", "Backend metrics", "CLI monospaced"],
  },
  {
    id: "cloud",
    name: "Cloud Architect",
    categories: ["IT", "Dasturchilar"],
    tag: "Arxitektor",
    isPro: true,
    accent: "from-indigo-600 to-violet-700",
    bg: "from-indigo-600/10 to-violet-700/5",
    border: "border-indigo-500/30",
    preview: "AWS, Azure va Cloud arxitektorlariga mos keng qamrovli tizim va loyihalar tartibi.",
    features: ["Arxitektura sxemasi", "Microservices", "Katta loyihalar"],
  },
  {
    id: "fullstack",
    name: "Full Stack Master",
    categories: ["IT", "Dasturchilar"],
    tag: "Lead Dev",
    isPremium: true,
    accent: "from-blue-600 to-sky-500",
    bg: "from-blue-600/10 to-sky-500/5",
    border: "border-blue-500/30",
    preview:
      "Frontend va backend tajribalarini teng vizualizatsiya qiluvchi to'liq quvvatli shablon.",
    features: ["Frontend + Backend", "Portfolio havolalari", "Jamoa boshqaruvi"],
  },

  // Boshqaruvchilar
  {
    id: "executive",
    name: "Executive Navy",
    categories: ["Boshqaruvchilar"],
    tag: "Mashhur",
    isPro: true,
    accent: "from-blue-900 to-indigo-900",
    bg: "from-blue-900/10 to-indigo-900/5",
    border: "border-blue-800/30",
    preview: "Boshqaruvchilar, departament rahbarlari va top-menejerlar uchun to'q ko'k dizayn.",
    features: ["Rahbariyat formati", "KPI ko'rsatkichlari", "C-Level nufuz"],
  },
  {
    id: "director",
    name: "Managing Director",
    categories: ["Boshqaruvchilar"],
    tag: "C-Level",
    isPremium: true,
    accent: "from-zinc-800 to-zinc-950",
    bg: "from-zinc-800/10 to-zinc-950/5",
    border: "border-zinc-700/30",
    preview: "Bosh direktor (CEO), operatsion direktor va strategik rahbarlar uchun premium uslub.",
    features: ["CEO & Founder", "Moliyaviy natijalar", "Strategik yutuqlar"],
  },
  {
    id: "corporate",
    name: "Corporate Classic",
    categories: ["Boshqaruvchilar", "Shifokorlar"],
    tag: "ATS Standart",
    accent: "from-gray-700 to-gray-900",
    bg: "from-gray-700/10 to-gray-900/5",
    border: "border-gray-600/30",
    preview: "An'anaviy markazlashgan sarlavha va klassik qora/oq format. 100% qat'iy mezon.",
    features: ["Universal ATS", "Klassik tipografiya", "Barcha sohalar"],
  },
  {
    id: "consultant",
    name: "McKinsey Strategy",
    categories: ["Boshqaruvchilar"],
    tag: "Konsalting",
    isPro: true,
    accent: "from-slate-800 to-blue-900",
    bg: "from-slate-800/10 to-blue-900/5",
    border: "border-slate-700/30",
    preview:
      "Strategik konsalting, Big4 va biznes analitika talablariga mos yuqori zichlikdagi matn.",
    features: ["Case study formati", "Biznes analitika", "ROI ko'rsatkichlar"],
  },
  {
    id: "banking",
    name: "Wall Street Finance",
    categories: ["Boshqaruvchilar"],
    tag: "Moliya & Bank",
    isPremium: true,
    accent: "from-emerald-900 to-teal-950",
    bg: "from-emerald-900/10 to-teal-950/5",
    border: "border-emerald-800/30",
    preview: "Investitsiya, audit, bank va xalqaro moliya sohasi yetakchilari uchun qat'iy format.",
    features: ["Moliyaviy audit", "Risk management", "Bank andozasi"],
  },
  {
    id: "luxe",
    name: "Monaco Elite",
    categories: ["Boshqaruvchilar"],
    tag: "VIP Executive",
    isPremium: true,
    accent: "from-amber-700 to-yellow-800",
    bg: "from-amber-700/10 to-yellow-800/5",
    border: "border-amber-600/30",
    preview:
      "Oltin va to'q kulrang urg'ular bilan boyitilgan, xalqaro korporatsiyalar uchun nufuzli dizayn.",
    features: ["VIP dizayn", "Prezident stipendiyasi", "Xalqaro e'tirof"],
  },

  // Talabalar
  {
    id: "harvard",
    name: "Harvard Standard",
    categories: ["Talabalar", "O'qituvchilar"],
    tag: "100% ATS Pass",
    accent: "from-gray-900 to-slate-900",
    bg: "from-gray-900/10 to-slate-900/5",
    border: "border-gray-800/30",
    preview:
      "Dunyoning yetakchi universitetlari va global ATS robotlari tavsiya etgan qat'iy standart.",
    features: ["Top Universitetlar", "Akademik sertifikat", "Xatolarsiz o'qish"],
  },
  {
    id: "oxford",
    name: "Oxford Serif",
    categories: ["Talabalar", "O'qituvchilar"],
    tag: "Akademik",
    isPro: true,
    accent: "from-slate-700 to-gray-800",
    bg: "from-slate-700/10 to-gray-800/5",
    border: "border-slate-600/30",
    preview:
      "Klassik serif shriftlar, ilmiy darajalar, magistratura va talabalar uchun oliyjanob format.",
    features: ["Nashrlar & BMI", "Serif shriftlar", "Ilmiy rahbar bloki"],
  },
  {
    id: "stanford",
    name: "Stanford Clean",
    categories: ["Talabalar", "Dasturchilar", "IT"],
    tag: "Silicon Valley",
    isPro: true,
    accent: "from-red-800 to-rose-900",
    bg: "from-red-800/10 to-rose-900/5",
    border: "border-red-700/30",
    preview: "Silikon vodiysi talabalari va xalqaro IT startaplar uchun toza, dinamik format.",
    features: ["Startap formati", "Amaliyotlar (Internships)", "GPA & Loyihalar"],
  },
  {
    id: "compact",
    name: "Compact Grid",
    categories: ["Talabalar"],
    tag: "1 Sahifali",
    accent: "from-amber-600 to-orange-700",
    bg: "from-amber-600/10 to-orange-700/5",
    border: "border-amber-500/30",
    preview: "Ko'p ma'lumotni 1 ta qog'oz varag'iga zich, saranjom va toza joylashtirish tartibi.",
    features: ["1 betga sig'ish", "Bo'shliqlarsiz", "Tez ko'zdan kechirish"],
  },

  // O'qituvchilar
  {
    id: "swiss",
    name: "Swiss Minimalist",
    categories: ["O'qituvchilar", "Shifokorlar", "Talabalar"],
    tag: "Minimalism",
    accent: "from-neutral-800 to-neutral-950",
    bg: "from-neutral-800/10 to-neutral-950/5",
    border: "border-neutral-700/30",
    preview:
      "Shveytsariya uslubidagi qat'iy geometriya, o'qituvchilar va pedagoglar uchun eng toza o'qilish darajasi.",
    features: ["Pedagogik faoliyat", "Dars soatlari", "Toza ierarxiya"],
  },
  {
    id: "burgundy",
    name: "Burgundy Luxe",
    categories: ["O'qituvchilar"],
    tag: "Eksklyuziv",
    isPremium: true,
    accent: "from-rose-900 to-red-950",
    bg: "from-rose-900/10 to-red-950/5",
    border: "border-rose-800/30",
    preview:
      "Nafis to'q qizil uslub va dotsentlar, fan nomzodlari va professorlar uchun akademik andoza.",
    features: ["Ilmiy maqolalar", "Monografiyalar", "Magistr darajasi"],
  },

  // Shifokorlar
  {
    id: "mint",
    name: "Nordic Mint",
    categories: ["Shifokorlar"],
    tag: "Tibbiyot & Shifokor",
    accent: "from-teal-500 to-emerald-600",
    bg: "from-teal-500/10 to-emerald-600/5",
    border: "border-teal-400/30",
    preview:
      "Tibbiyot xodimlari, shifokorlar va farmatsevtika sohasi mutaxassislari uchun xotirjam va ishonchli uslub.",
    features: ["Klinik tajriba", "Tibbiy litsenziyalar", "Kasalxona amaliyoti"],
  },
  {
    id: "emerald",
    name: "Creative Emerald",
    categories: ["Shifokorlar"],
    tag: "Klinik Rezident",
    accent: "from-emerald-600 to-teal-700",
    bg: "from-emerald-600/10 to-teal-700/5",
    border: "border-emerald-500/30",
    preview:
      "Klinik mutaxassislar va shifokorlar uchun vertikal timeline tuzilishi va sertifikatlar bloki.",
    features: ["Vertikal timeline", "Qabul statistikasi", "Sertifikatlar"],
  },

  // Kreativ & Dizayn
  {
    id: "portfolio",
    name: "Design Lead UI/UX",
    categories: ["Dasturchilar", "IT"],
    tag: "UI/UX",
    isPro: true,
    accent: "from-violet-600 to-purple-700",
    bg: "from-violet-600/10 to-purple-700/5",
    border: "border-violet-500/30",
    preview:
      "Interfeys dizaynerlari uchun portfolioga yo'naltirilgan zamonaviy bloklar va vizual ko'rgazma.",
    features: ["Portfolio havolalari", "Dribbble/Behance", "Dizayn tizimlari"],
  },
  {
    id: "violet",
    name: "Vibrant Violet",
    categories: ["IT"],
    tag: "Dizayn & Startup",
    isPremium: true,
    accent: "from-purple-600 to-fuchsia-700",
    bg: "from-purple-600/10 to-fuchsia-700/5",
    border: "border-purple-500/30",
    preview: "Jonli binafsha urg'ular va zamonaviy teglarga boy zamonaviy texnologik interfeys.",
    features: ["Vizual teglar", "Zamonaviy shriftlar", "Kreativ yo'nalish"],
  },
  {
    id: "sunset",
    name: "Sunset Coral",
    categories: ["IT"],
    tag: "Marketing & SMM",
    isPro: true,
    accent: "from-orange-500 to-rose-600",
    bg: "from-orange-500/10 to-rose-600/5",
    border: "border-orange-400/30",
    preview: "Marketing, brending, PR va SMM mutaxassislari uchun iliq, e'tibor tortuvchi ranglar.",
    features: ["Kampaniya natijalari", "Ijtimoiy tarmoqlar", "Konversiya o'sishi"],
  },
  {
    id: "pastel",
    name: "Studio Rose",
    categories: ["Talabalar"],
    tag: "Art & Media",
    isPremium: true,
    accent: "from-pink-500 to-rose-600",
    bg: "from-pink-500/10 to-rose-600/5",
    border: "border-pink-400/30",
    preview:
      "Ijodiy loyihalar, kopirayterlik va media sohasi mutaxassislari uchun mayin nafis dizayn.",
    features: ["Kreativ yozuvlar", "Media loyihalar", "Nafis tipografiya"],
  },
];

export default function TemplatesPage() {
  const { t, lang } = useLanguage();
  const router = useRouter();

  const categoryOptions = [
    { id: "all", label: lang === "uz" ? "Barchasi (24)" : lang === "ru" ? "Все (24)" : "All (24)" },
    { id: "IT", label: "IT" },
    {
      id: "Dasturchilar",
      label: lang === "uz" ? "Dasturchilar" : lang === "ru" ? "Разработчики" : "Developers",
    },
    {
      id: "Talabalar",
      label: lang === "uz" ? "Talabalar" : lang === "ru" ? "Студенты" : "Students",
    },
    {
      id: "O'qituvchilar",
      label: lang === "uz" ? "O'qituvchilar" : lang === "ru" ? "Преподаватели" : "Teachers",
    },
    {
      id: "Shifokorlar",
      label: lang === "uz" ? "Shifokorlar" : lang === "ru" ? "Врачи / Медики" : "Doctors",
    },
    {
      id: "Boshqaruvchilar",
      label: lang === "uz" ? "Boshqaruvchilar" : lang === "ru" ? "Руководители" : "Executives",
    },
  ];

  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);

  const filteredTemplates =
    activeFilter === "all"
      ? TEMPLATES_LIST
      : TEMPLATES_LIST.filter((tpl) => tpl.categories.includes(activeFilter));

  const handleSelectTemplate = (templateId: string) => {
    router.push(`/cv-builder?template=${templateId}&tab=editor`);
  };

  return (
    <div className="min-h-screen bg-transparent pb-20">
      {/* Hero */}
      <div className="border-border relative overflow-hidden border-b">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-pink-500/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 py-12 sm:px-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-pink-400/30 bg-gradient-to-br from-pink-500/20 to-rose-500/10">
              <LayoutTemplate className="h-6 w-6 text-pink-400" />
            </div>
            <div>
              <div className="text-xs font-semibold tracking-widest text-pink-400 uppercase">
                {t.templatesFeature || "20+ Shablonlar"}
              </div>
              <h1 className="text-foreground text-2xl font-bold">
                Barcha kasblar uchun 20+ professional shablon
              </h1>
            </div>
          </div>
          <p className="text-foreground-secondary max-w-2xl">
            {t.templatesDesc ||
              "IT dasturchilar, talabalar, shifokorlar, o'qituvchilar va rahbarlar uchun ATS tizimlaridan 100% o'tuvchi xalqaro standartdagi andozalar."}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
        {/* Filter pills */}
        <div className="mb-8 flex flex-wrap gap-2.5">
          {categoryOptions.map((cat) => {
            const isSelected = activeFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveFilter(cat.id)}
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition-all sm:text-sm ${
                  isSelected
                    ? "border-pink-500 bg-pink-500/20 text-pink-300 shadow-lg shadow-pink-500/20"
                    : "border-border bg-surface text-foreground-secondary hover:text-foreground hover:border-slate-500"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Counter */}
        <div className="text-foreground-secondary mb-6 flex items-center justify-between text-xs">
          <span>
            Ko&apos;rsatilmoqda:{" "}
            <strong className="text-foreground font-semibold">{filteredTemplates.length} ta</strong>{" "}
            shablon
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="h-4 w-4" /> Barchasi ATS-ga 100% mos
          </span>
        </div>

        {/* Template Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredTemplates.map((tpl, i) => (
              <motion.div
                key={tpl.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, delay: i * 0.03 }}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border ${tpl.border} bg-surface-elevated/70 cursor-pointer p-6 backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-pink-500/10`}
                onClick={() => setSelectedTemplate(tpl)}
              >
                <div>
                  <div
                    className={`mb-4 h-36 rounded-xl bg-gradient-to-br ${tpl.accent} relative flex flex-col justify-between overflow-hidden p-4`}
                  >
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="relative z-10 flex items-center justify-between">
                      <span className="rounded-full border border-white/20 bg-black/50 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                        {tpl.tag}
                      </span>
                      {tpl.isPremium ? (
                        <span className="flex items-center gap-1 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-black text-black">
                          <Crown className="h-3 w-3" /> PREMIUM
                        </span>
                      ) : tpl.isPro ? (
                        <span className="flex items-center gap-1 rounded-full bg-blue-500/90 px-2 py-0.5 text-[10px] font-black text-white">
                          <Sparkles className="h-3 w-3" /> PRO
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-black text-white">
                          BEPUL
                        </span>
                      )}
                    </div>
                    <div className="relative z-10">
                      <p className="text-base font-bold tracking-tight text-white">{tpl.name}</p>
                      <p className="text-xs text-white/80">{tpl.categories.join(" • ")}</p>
                    </div>
                  </div>

                  <h3 className="text-foreground mb-1 flex items-center justify-between text-base font-bold">
                    <span>{tpl.name}</span>
                  </h3>
                  <p className="text-foreground-secondary mb-4 line-clamp-2 text-xs leading-relaxed">
                    {tpl.preview}
                  </p>

                  <div className="mb-5 flex flex-wrap gap-1.5">
                    {tpl.features.map((f) => (
                      <span
                        key={f}
                        className="bg-surface border-border rounded-md border px-2 py-0.5 text-[10px] text-slate-300"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-border mt-auto flex items-center gap-2 border-t pt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTemplate(tpl);
                    }}
                    className="border-border hover:text-foreground flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-semibold text-slate-300 transition-colors hover:border-slate-500"
                  >
                    <Eye className="h-3.5 w-3.5" /> Ko&apos;rish
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectTemplate(tpl.id);
                    }}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r py-2.5 text-xs font-bold text-white transition-all ${tpl.accent} shadow-md hover:opacity-90`}
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Tanlash
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Detail / Preview Modal */}
      <AnimatePresence>
        {selectedTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
            onClick={() => setSelectedTemplate(null)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              className={`relative w-full max-w-lg rounded-3xl border ${selectedTemplate.border} bg-surface-elevated p-8 shadow-2xl`}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedTemplate(null)}
                className="border-border text-foreground-secondary hover:text-foreground hover:bg-surface absolute top-5 right-5 rounded-full border p-2 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div
                className={`mb-6 h-48 rounded-2xl bg-gradient-to-br ${selectedTemplate.accent} relative flex flex-col justify-end overflow-hidden p-6 text-white shadow-inner`}
              >
                <div className="absolute inset-0 bg-black/25" />
                <div className="relative z-10">
                  <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
                    {selectedTemplate.tag}
                  </span>
                  <h2 className="mt-2 text-2xl font-black">{selectedTemplate.name}</h2>
                  <p className="text-xs text-white/80">{selectedTemplate.categories.join(" • ")}</p>
                </div>
              </div>

              <p className="text-foreground-secondary mb-5 text-sm leading-relaxed">
                {selectedTemplate.preview}
              </p>

              <div className="mb-6 space-y-2">
                <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Afzalliklari va imkoniyatlari:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {selectedTemplate.features.map((f) => (
                    <div
                      key={f}
                      className="border-border bg-surface text-foreground flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium"
                    >
                      <Check className="h-3.5 w-3.5 flex-shrink-0 text-emerald-400" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="border-border text-foreground-secondary hover:text-foreground hover:bg-surface flex-1 rounded-xl border py-3 text-xs font-semibold transition-colors"
                >
                  Yopish
                </button>
                <button
                  onClick={() => handleSelectTemplate(selectedTemplate.id)}
                  className={`flex flex-[2] items-center justify-center gap-2 rounded-xl bg-gradient-to-r py-3 text-sm font-bold text-white transition-all ${selectedTemplate.accent} shadow-lg hover:opacity-95`}
                >
                  Ushbu shablon bilan yaratish <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
