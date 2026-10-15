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
} from "lucide-react";
import { StudentSubNav } from "@/components/academic/student-sub-nav";
import { useToast } from "@/hooks/use-toast";

interface CourseworkPage {
  pageNumber: number;
  type: string;
  title: string;
  content: string;
}

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
  "Titul varag'i va Mundarija (reja) shakllantirilmoqda...",
  "Kirish va I Bob (Nazariy-metodologik asoslar) yozilmoqda...",
  "II Bob (Amaliy tahlil, empirik statistika va jadvallar) hisoblanmoqda...",
  "III Bob, Xulosa va GOST adabiyotlar ro'yxati tekshirilmoqda...",
  "A4 formatdagi sahifalar yig'ilmoqda...",
];

export default function CourseworkGenerator() {
  const { toast } = useToast();
  const documentRef = useRef<HTMLDivElement>(null);

  const [selectedCategoryIdx, setSelectedCategoryIdx] = useState(0);
  const [formData, setFormData] = useState({
    subject: "Informatika va Axborot texnologiyalari",
    topic:
      "Sun'iy intellekt va mashinaviy o'rganish modellarining tibbiy diagnostikadagi amaliy samaradorligi",
    faculty: "Axborot texnologiyalari fakulteti",
    university: "O'zbekiston Milliy Universiteti",
    studentName: "",
    teacherName: "",
    year: new Date().getFullYear().toString(),
    pageCount: "19",
    language: "uz" as "uz" | "uz-cyrl" | "ru",
  });

  const [loading, setLoading] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);

  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [pages, setPages] = useState<CourseworkPage[]>([]);
  const [copied, setCopied] = useState(false);

  const activeCategory = FACULTIES_AND_SUBJECTS[selectedCategoryIdx] || FACULTIES_AND_SUBJECTS[0];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectTopicSuggestion = (topic: string) => {
    setFormData((prev) => ({ ...prev, topic }));
    toast({
      title: "Mavzu tanlandi",
      description: topic,
    });
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.topic.trim() || !formData.subject.trim()) {
      toast({
        title: "Maydonlarni to'ldiring",
        description: "Fan nomi va mavzu kiritilishi shart.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);
    setPages([]);
    setCurrentStepIdx(0);
    setProgressPercent(10);

    // Simulated progress steps during fetch
    const stepInterval = setInterval(() => {
      setCurrentStepIdx((prev) => {
        const next = prev < GENERATION_STEPS.length - 1 ? prev + 1 : prev;
        setProgressPercent(Math.min(92, Math.round(((next + 1) / GENERATION_STEPS.length) * 90)));
        return next;
      });
    }, 1400);

    try {
      const res = await fetch("/api/generate-coursework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      clearInterval(stepInterval);

      if (!res.ok) {
        throw new Error(data.error || "Kurs ishini generatsiya qilishda xatolik yuz berdi");
      }

      setProgressPercent(100);
      setResult(data.result);
      if (data.pages && Array.isArray(data.pages) && data.pages.length > 0) {
        setPages(data.pages);
      }

      toast({
        title: "Kurs ishi muvaffaqiyatli tayyorlandi! 🎓",
        description: `${data.pages?.length || formData.pageCount} sahifalik to'liq akademik hujjat shakllantirildi.`,
      });
    } catch (err: unknown) {
      clearInterval(stepInterval);
      const e = err as Error;
      toast({
        title: "Generatsiyada xatolik",
        description: e.message || "Iltimos, qayta urinib ko'ring.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Word (.doc / .docx compatible) generator with exact Word margins & typography
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
          ${p.content
            .replace(/^# (.*$)/gim, "<h1>$1</h1>")
            .replace(/^## (.*$)/gim, "<h2>$1</h2>")
            .replace(/^### (.*$)/gim, "<h3>$1</h3>")
            .replace(/\n\n/g, "</p><p>")
            .replace(/\n/g, "<br/>")}
          ${p.pageNumber > 1 ? `<div class="footer-page-num">${p.pageNumber}</div>` : ""}
        </div>
      `
            )
            .join("\n")
        : (result || "")
            .replace(/^# (.*$)/gim, "<h1>$1</h1>")
            .replace(/^## (.*$)/gim, "<h2>$1</h2>")
            .replace(/^### (.*$)/gim, "<h3>$1</h3>")
            .replace(/\n\n/g, "</p><p>");

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
        "Hujjat GOST talablariga mos Times New Roman 14pt va standart hoshiyalar bilan saqlandi.",
    });
  };

  const handleDownloadPDF = async () => {
    if (!documentRef.current) return;
    setDownloading(true);
    setDownloadProgress("PDF tayyorlanmoqda...");

    try {
      const { jsPDF } = await import("jspdf");
      const html2canvasModule = await import("html2canvas");
      const html2canvas = html2canvasModule.default || html2canvasModule;

      const pageElements = documentRef.current.querySelectorAll<HTMLElement>(".coursework-page");
      const cleanStudentName =
        formData.studentName?.trim().replace(/[^a-zA-Z0-9\-_]/g, "_") || "DocNova";

      if (pageElements && pageElements.length > 0) {
        const total = pageElements.length;
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
          compress: true,
        });

        for (let i = 0; i < total; i++) {
          setDownloadProgress(`Sahifa (${i + 1}/${total}) saqlanmoqda...`);
          const el = pageElements[i];

          const canvas = await html2canvas(el, {
            scale: 1.5,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
          });

          const imgData = canvas.toDataURL("image/jpeg", 0.92);
          if (i > 0) {
            pdf.addPage("a4", "portrait");
          }
          pdf.addImage(imgData, "JPEG", 0, 0, 210, 297, undefined, "FAST");
        }

        pdf.save(`Kurs_ishi_${cleanStudentName}_${total}sahifa.pdf`);
      } else {
        const canvas = await html2canvas(documentRef.current, {
          scale: 1.5,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
        });
        const imgData = canvas.toDataURL("image/jpeg", 0.92);
        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        pdf.addImage(imgData, "JPEG", 0, 0, 210, 297, undefined, "FAST");
        pdf.save(`Kurs_ishi_${cleanStudentName}.pdf`);
      }

      toast({
        title: "PDF yuklandi!",
        description: "Hujjat kompyuteringizga saqlandi.",
      });
    } catch (err: unknown) {
      console.error(err);
      toast({
        title: "PDF yaratishda xatolik",
        description: "Iltimos, 'Chop etish' tugmasi orqali PDF sifatida saqlang.",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
      setDownloadProgress(null);
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

  return (
    <div className="bg-background text-foreground min-h-screen pb-20">
      {/* Top Student Navigation */}
      <StudentSubNav activeTab="coursework" />

      {/* Top Banner */}
      <div className="border-border bg-surface/30 border-b px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
              <GraduationCap className="h-3.5 w-3.5" />
              <span>O&apos;zbekiston OTM Standartlari</span>
            </div>
            <h1 className="text-foreground text-2xl font-extrabold sm:text-3xl">
              Kurs ishi yordamchisi va Generatori
            </h1>
            <p className="text-foreground-secondary mt-1 max-w-2xl text-xs sm:text-sm">
              Titul varag&apos;i, reja (mundarija), kirish, 3 ta bob, xulosa va 20 ta adabiyotlar
              ro&apos;yxati bilan 15–30 sahifalik tayyor kurs ishlari.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-foreground-muted text-xs font-medium">Hajm:</span>
            {["15", "19", "25", "30"].map((cnt) => (
              <button
                key={cnt}
                type="button"
                onClick={() => setFormData({ ...formData, pageCount: cnt })}
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
                max={60}
                value={formData.pageCount}
                onChange={(e) => setFormData({ ...formData, pageCount: e.target.value })}
                placeholder="Boshqa"
                className="border-border bg-background text-foreground h-7 w-16 rounded border text-center text-xs font-bold"
                title="O'zingiz xohlagan sahifalar sonini kiriting"
              />
              <span className="text-foreground-muted text-[11px]">bet</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* Left: Input Wizard Form */}
          <div className="border-border bg-surface sticky top-24 rounded-2xl border p-6 shadow-sm lg:col-span-5">
            <div className="border-border mb-4 flex items-center justify-between border-b pb-3">
              <h2 className="text-foreground flex items-center gap-2 text-base font-bold">
                <Sparkles className="text-primary h-4 w-4" />
                <span>Parametrlarni kiritish</span>
              </h2>
              <span className="text-primary bg-primary/10 rounded px-2 py-0.5 text-xs font-semibold">
                {formData.pageCount || "19"} sahifa
              </span>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              {/* Soha / Kafedra */}
              <div>
                <label className="text-foreground-secondary mb-1 block text-xs font-semibold">
                  Yo&apos;nalish va Kafedra
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
                        topic: cat.topics[0] || prev.topic,
                        faculty: `${cat.category.split("(")[0].trim()} fakulteti`,
                      }));
                    }
                  }}
                  className="border-border bg-background text-foreground focus:border-primary w-full rounded-xl border px-3 py-2 text-xs focus:outline-none sm:text-sm"
                >
                  {FACULTIES_AND_SUBJECTS.map((item, idx) => (
                    <option key={idx} value={idx}>
                      {item.category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fan nomi */}
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
                  placeholder="Masalan: Axborot texnologiyalari..."
                  className="border-border bg-background text-foreground focus:border-primary w-full rounded-xl border px-3.5 py-2 text-xs focus:outline-none sm:text-sm"
                />
              </div>

              {/* Mavzu + Idea generator */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-foreground-secondary text-xs font-semibold">
                    Kurs ishi mavzusi *
                  </label>
                </div>
                <textarea
                  rows={2}
                  name="topic"
                  required
                  value={formData.topic}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData({ ...formData, topic: e.target.value })
                  }
                  placeholder="Masalan: Raqamli iqtisodiyot sharoitida bank xizmatlarini modernizatsiya qilish..."
                  className="border-border bg-background text-foreground focus:border-primary w-full rounded-xl border px-3.5 py-2 text-xs leading-snug focus:outline-none sm:text-sm"
                />

                {/* Topic Suggestions Chips */}
                <div className="mt-2 space-y-1.5">
                  <span className="text-foreground-muted flex items-center gap-1 text-[11px] font-semibold">
                    <Lightbulb className="h-3 w-3 text-amber-400" />
                    <span>Kafedra bo&apos;yicha tavsiya etilgan mavzular:</span>
                  </span>
                  <div className="space-y-1">
                    {activeCategory.topics.slice(0, 3).map((item, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectTopicSuggestion(item)}
                        className="border-border/70 bg-surface-elevated/70 hover:bg-primary/10 hover:border-primary/40 text-foreground-secondary hover:text-foreground block w-full cursor-pointer truncate rounded-lg border px-2.5 py-1.5 text-left text-[11px] transition-all"
                        title={item}
                      >
                        → {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Til tanlash */}
              <div>
                <label className="text-foreground-secondary mb-1 block text-xs font-semibold">
                  Yozish tili
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "uz" as const, label: "O'zbek (Lotin)", flag: "🇺🇿" },
                    { id: "uz-cyrl" as const, label: "Ўзбек (Кирилл)", flag: "🇺🇿" },
                    { id: "ru" as const, label: "Русский", flag: "🇷🇺" },
                  ].map((lang) => (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, language: lang.id })}
                      className={`flex cursor-pointer items-center justify-center gap-1 rounded-xl border px-1 py-2 text-xs font-semibold transition-all ${
                        formData.language === lang.id
                          ? "bg-primary border-primary text-white shadow-sm"
                          : "bg-background border-border text-foreground hover:bg-surface-elevated"
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span className="truncate">{lang.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* OTM va Talaba / Rahbar */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-foreground-secondary mb-1 block text-xs font-semibold">
                    OTM nomi
                  </label>
                  <input
                    type="text"
                    name="university"
                    value={formData.university}
                    onChange={handleChange}
                    placeholder="O'zbekiston Milliy Universiteti"
                    className="border-border bg-background text-foreground focus:border-primary w-full rounded-xl border px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-foreground-secondary mb-1 block text-xs font-semibold">
                    Yil
                  </label>
                  <input
                    type="text"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className="border-border bg-background text-foreground focus:border-primary w-full rounded-xl border px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
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
                    className="border-border bg-background text-foreground focus:border-primary w-full rounded-xl border px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-foreground-secondary mb-1 block text-xs font-semibold">
                    Ilmiy rahbar
                  </label>
                  <input
                    type="text"
                    name="teacherName"
                    value={formData.teacherName}
                    onChange={handleChange}
                    placeholder="dots. Karimov A."
                    className="border-border bg-background text-foreground focus:border-primary w-full rounded-xl border px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20 mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-xs font-bold shadow-lg transition-all hover:scale-[1.01] disabled:opacity-50 sm:text-sm"
              >
                {loading ? (
                  <>
                    <svg
                      className="text-primary-foreground mr-2 h-4 w-4 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Generatsiya qilinmoqda...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Kurs ishini yaratish ({formData.pageCount || "19"} bet) 🚀</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right: Preview & A4 Rendering */}
          <div className="flex flex-col lg:col-span-7">
            {/* Loading Wizard Stepper */}
            {loading && (
              <div className="border-primary/30 bg-surface animate-in fade-in mb-6 rounded-2xl border p-6 shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-primary flex items-center gap-2 text-xs font-bold tracking-wider uppercase">
                    <Sparkles className="h-4 w-4 animate-spin" />
                    <span>Kurs ishi generatsiyasi jarayoni</span>
                  </span>
                  <span className="text-primary font-mono text-xs font-bold">
                    {progressPercent}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="bg-surface-elevated mb-5 h-2 w-full overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Step indicators */}
                <div className="space-y-2.5">
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
                              : "text-foreground-muted"
                        }`}
                      >
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
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
              </div>
            )}

            {/* Actions Bar (when result is ready) */}
            {(pages.length > 0 || cleanResult) && (
              <div className="border-border bg-surface mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5 shadow-sm print:hidden">
                <div className="text-foreground flex items-center gap-2 text-xs font-semibold sm:text-sm">
                  <span>📄 Jami hajm:</span>
                  <span className="text-primary font-bold">
                    {pages.length > 0
                      ? `${pages.length} sahifa`
                      : `${formData.pageCount || "19"} sahifa`}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Word Download */}
                  <button
                    onClick={handleDownloadWord}
                    className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all hover:scale-105 hover:bg-blue-500"
                  >
                    <FileDown className="h-3.5 w-3.5" />
                    <span>Word (.doc)</span>
                  </button>

                  {/* PDF Download */}
                  <button
                    onClick={handleDownloadPDF}
                    disabled={downloading}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground flex cursor-pointer items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold shadow-sm transition-all hover:scale-105 disabled:opacity-50"
                  >
                    <span>{downloading ? "⏳" : "📥"}</span>
                    <span>{downloading ? downloadProgress || "Yuklanmoqda..." : "PDF"}</span>
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

                  {/* Print */}
                  <button
                    onClick={() => window.print()}
                    className="border-border bg-surface-elevated text-foreground hover:bg-border/60 flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Chop etish</span>
                  </button>
                </div>
              </div>
            )}

            {/* Presentation Cross-sell Banner */}
            {(pages.length > 0 || cleanResult) && (
              <Link
                href={`/academic/presentation?topic=${encodeURIComponent(formData.topic)}`}
                className="group mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-orange-500/30 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent p-3.5 transition-all hover:border-orange-500/60 print:hidden"
              >
                <div className="flex items-center gap-3">
                  <div className="shrink-0 rounded-lg bg-orange-500/20 p-2 text-orange-400">
                    <Presentation className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-foreground flex items-center gap-2 text-xs font-bold sm:text-sm">
                      <span>Himoya uchun taqdimot (PPTX) kerakmi?</span>
                      <span className="rounded bg-orange-500/20 px-2 py-0.5 text-[10px] font-semibold text-orange-300">
                        1-bosishda
                      </span>
                    </div>
                    <div className="text-foreground-secondary text-[11px] sm:text-xs">
                      Ushbu kurs ishingiz asosida slaydlar va ma&apos;ruzachi nutqini (Speaker
                      Notes) tayyorlang
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-orange-400 transition-transform group-hover:translate-x-1">
                  <span>Slaydlar yaratish</span>
                  <span>→</span>
                </div>
              </Link>
            )}

            {/* A4 Paper Container */}
            <div className="flex w-full max-w-full justify-center overflow-x-auto p-2 print:block print:w-full print:p-0">
              {pages.length > 0 ? (
                <div
                  ref={documentRef}
                  id="coursework-document"
                  className="coursework-document flex w-[210mm] shrink-0 flex-col items-center print:block print:w-full"
                >
                  {pages.map((p) => (
                    <div
                      key={p.pageNumber}
                      className="coursework-page-card mb-6 overflow-hidden rounded-sm border border-slate-200/90 bg-white shadow-2xl print:m-0 print:mb-0 print:border-0 print:shadow-none"
                    >
                      <div
                        className="coursework-page relative flex flex-col justify-between bg-white font-serif text-black"
                        style={{
                          width: "210mm",
                          minHeight: "297mm",
                          maxHeight: "297mm",
                          boxSizing: "border-box",
                          padding: "20mm 20mm 20mm 25mm", // GOST: chap 25mm, yuqori/o'ng/past 20mm
                          overflow: "hidden",
                        }}
                      >
                        <div className="coursework-page-content prose prose-slate max-w-none flex-grow text-black">
                          <ReactMarkdown components={markdownComponents}>{p.content}</ReactMarkdown>
                        </div>

                        {/* Page number footer */}
                        {p.pageNumber > 1 ? (
                          <div className="coursework-page-footer mt-auto pt-3 text-center font-serif text-xs text-slate-700">
                            {p.pageNumber}
                          </div>
                        ) : (
                          <div className="h-4" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : cleanResult ? (
                <div
                  ref={documentRef}
                  className="a4-document prose prose-slate max-w-full shrink-0 bg-white p-6 font-serif text-black shadow-2xl sm:p-10 md:p-[25mm]"
                  style={{
                    width: "210mm",
                    minHeight: "297mm",
                    maxWidth: "100%",
                  }}
                >
                  <ReactMarkdown components={markdownComponents}>{cleanResult}</ReactMarkdown>
                </div>
              ) : (
                !loading && (
                  <div className="flex h-full flex-col items-center justify-center space-y-4 pt-32 pb-32 text-center text-slate-400 opacity-60">
                    <div className="mb-2 text-6xl">📄</div>
                    <h3 className="text-foreground text-base font-bold">
                      A4 formatdagi kurs ishi shu yerda shakllanadi
                    </h3>
                    <p className="text-foreground-secondary max-w-sm text-xs">
                      Kafedra, fan va mavzuni tanlang hamda &quot;Kurs ishini yaratish&quot;
                      tugmasini bosing.
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .coursework-page-card {
            page-break-after: always !important;
            break-after: page !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          .coursework-page {
            width: 210mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            box-sizing: border-box !important;
            padding: 20mm 20mm 20mm 25mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
}
