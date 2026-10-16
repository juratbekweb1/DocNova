"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import {
  Award,
  BookOpen,
  FileDown,
  Printer,
  Copy,
  Check,
  Sparkles,
  Presentation,
  Plus,
  Minus,
  Lightbulb,
  GraduationCap,
  Scale,
  Cpu,
  TrendingUp,
  Stethoscope,
  Compass,
} from "lucide-react";
import { StudentSubNav } from "@/components/academic/student-sub-nav";
import { useToast } from "@/hooks/use-toast";

interface SpecialtyOption {
  id: string;
  name: string;
  faculty: string;
  icon: React.ComponentType<{ className?: string }>;
  topics: string[];
}

const SPECIALTIES: SpecialtyOption[] = [
  {
    id: "it",
    name: "Axborot texnologiyalari va dasturiy injiniring",
    faculty: "Kompyuter injiniringi va Axborot texnologiyalari fakulteti",
    icon: Cpu,
    topics: [
      "Sun'iy intellekt va mashinaviy o'rganish modellarining tibbiy diagnostikadagi amaliy samaradorligi",
      "Katta hajmdagi ma'lumotlarni qayta ishlashda taqsimlangan bulutli tizimlar arxitekturasi va xavfsizligi",
      "Korporativ tarmoqlarda kiberxavfsizlik tahdidlarini neyron tarmoqlar yordamida prognozlash tizimi",
      "Mikroxizmatlar arxitekturasi asosida yuqori yuklamali veb-platformalarni loyihalash va optimallashtirish",
    ],
  },
  {
    id: "economics",
    name: "Iqtisodiyot, moliya va bank ishi",
    faculty: "Iqtisodiyot va Moliya fakulteti",
    icon: TrendingUp,
    topics: [
      "Raqamli iqtisodiyot sharoitida tijorat banklarida fintex xizmatlarini modernizatsiya qilish strategiyasi",
      "O'zbekiston Respublikasida kichik biznes subyektlarini soliqqa tortish mexanizmini takomillashtirish",
      "Korxonalarda moliyaviy barqarorlikni ta'minlash va inqirozga qarshi boshqaruv tizimini modellashtirish",
      "Xalqaro moliya bozorlariga integratsiyalashuv sharoitida investitsion jozibadorlikni oshirish yo'llari",
    ],
  },
  {
    id: "law",
    name: "Huquqshunoslik va davlat boshqaruvi",
    faculty: "Yuridik fakultet",
    icon: Scale,
    topics: [
      "Elektron hukumat tizimida fuqarolarning shaxsiy ma'lumotlarini himoya qilishning huquqiy asoslari",
      "Fuqarolik-huquqiy munosabatlarda raqamli bitimlar va aqlli shartnomalar (smart contracts)ni tartibga solish",
      "Tadbirkorlik faoliyatida shartnomaviy majburiyatlarni buzganlik uchun fuqarolik javobgarligi mexanizmlari",
      "Xalqaro tijorat arbitrajida nizolarni hal qilish tartibining qiyosiy-huquqiy tahlili",
    ],
  },
  {
    id: "pedagogy",
    name: "Pedagogika va ta'lim texnologiyalari",
    faculty: "Pedagogika va Psixologiya fakulteti",
    icon: GraduationCap,
    topics: [
      "Oliy ta'lim tizimida kredit-modul tizimi sharoitida talabalarning mustaqil ta'limini tashkil etish metodikasi",
      "Raqamli ta'lim muhitida gamifikatsiya texnologiyalaridan foydalanishning didaktik imkoniyatlari",
      "Bo'lajak mutaxassislarda kasbiy-ijodiy kompetensiyalarni rivojlantirishning innovatsion texnologiyalari",
      "Gibrid ta'lim shaklida talabalar bilimini baholash tizimini avtomatlashtirish usullari",
    ],
  },
  {
    id: "engineering",
    name: "Muhandislik va sanoat texnologiyalari",
    faculty: "Mexanika-mashinasozlik va Muhandislik fakulteti",
    icon: Compass,
    topics: [
      "Sanoat korxonalarida avtomatlashtirilgan boshqaruv tizimlari (SCADA) samaradorligini oshirish",
      "Quyosh va shamol energetikasi qurilmalarini milliy energetika tizimiga integratsiyalash texnologiyalari",
      "Mashinasozlikda detallarga ishlov berish aniqligini CNC dastgohlarida optimallashtirish",
      "Logistika va transport jarayonlarini intellektual optimallashtirish modellari",
    ],
  },
  {
    id: "medicine",
    name: "Tibbiyot va farmatsevtika",
    faculty: "Davolash va Farmatsevtika fakulteti",
    icon: Stethoscope,
    topics: [
      "Birlamchi tibbiy-sanitariya yordami tizimida surunkali kasalliklarni erta skrining qilishning samarali usullari",
      "Farmatsevtika sanoatida mahalliy dorivor o'simliklar asosida import o'rnini bosuvchi preparatlar yaratish",
      "Teletibbiyot tizimlarini chekka hududlar poliklinikalarida qo'llashning amaliy natijalari",
      "Yurak-qon tomir kasalliklarini kompyuter tomografiyasi yordamida tashxislashning zamonaviy yutuqlari",
    ],
  },
];

const GENERATION_STEPS = [
  "Mavzuning dolzarbligi va «O'zbekiston — 2030» strategiyasi tahlil qilinmoqda...",
  "Titul varag'i va Mundarija (reja sahifalari bilan) tuzilmoqda...",
  "Kirish ilmiy apparati (obyekt, predmet, maqsad, vazifalar, yangilik) shakllantirilmoqda...",
  "I va II Boblar (statistik qiyosiy jadvallar va hisoblar bilan) yozilmoqda...",
  "III Bob, Xulosa va 25–30 ta GOST adabiyotlar ro'yxati tekshirilmoqda...",
  "A4 formatdagi rasmiy diplom hujjati yakunlanmoqda...",
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
  hr: () => <hr className="my-4 border-t-2 border-slate-300" />,
};

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

export default function DiplomBmiPage() {
  const { toast } = useToast();
  const documentRef = useRef<HTMLDivElement>(null);

  const [selectedSpecialtyIdx, setSelectedSpecialtyIdx] = useState<number>(0);
  const activeSpecialty = SPECIALTIES[selectedSpecialtyIdx];

  const [formData, setFormData] = useState({
    workType: "Bakalavr Bitiruv Malakaviy Ishi (BMI)",
    specialty: activeSpecialty.name,
    faculty: activeSpecialty.faculty,
    topic: activeSpecialty.topics[0],
    university: "O'zbekiston Milliy Universiteti",
    studentName: "",
    teacherName: "",
    language: "uz" as "uz" | "ru",
    part: "To'liq BMI majmuasi (Barcha boblar va 30 ta adabiyot)",
  });

  const [loading, setLoading] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [slidesCount, setSlidesCount] = useState<number>(15);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSpecialtyChange = (idx: number) => {
    setSelectedSpecialtyIdx(idx);
    const spec = SPECIALTIES[idx];
    if (spec) {
      setFormData((prev) => ({
        ...prev,
        specialty: spec.name,
        faculty: spec.faculty,
        topic: spec.topics[0] || prev.topic,
      }));
    }
  };

  const handleSelectTopicSuggestion = (topicName: string) => {
    setFormData((prev) => ({ ...prev, topic: topicName }));
    toast({
      title: "Mavzu tanlandi!",
      description: `"${topicName.slice(0, 45)}..." shaklga kiritildi.`,
    });
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.topic.trim()) {
      toast({
        title: "Mavzuni kiriting",
        description: "Diplom yoki BMI mavzusi kiritilishi shart.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);
    setCurrentStepIdx(0);
    setProgressPercent(12);

    const stepInterval = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev >= 95) return 95;
        const next = prev + Math.floor(Math.random() * 12) + 6;
        const nextStep = Math.min(
          GENERATION_STEPS.length - 1,
          Math.floor((next / 100) * GENERATION_STEPS.length)
        );
        setCurrentStepIdx(nextStep);
        return Math.min(next, 95);
      });
    }, 1100);

    try {
      const res = await fetch("/api/ai/academic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate-bmi",
          ...formData,
        }),
      });

      clearInterval(stepInterval);
      setProgressPercent(100);
      setCurrentStepIdx(GENERATION_STEPS.length - 1);

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Generatsiyada xatolik yuz berdi");
      }

      setResult(data.result);
      toast({
        title: "Diplom (BMI) muvaffaqiyatli tayyorlandi! 🎓",
        description:
          "Vazirlik talablariga mos ilmiy apparat, mundarija, boblar va 25-30 ta adabiyot shakllandi.",
      });
    } catch (err: unknown) {
      clearInterval(stepInterval);
      const e = err as Error;
      toast({
        title: "Xatolik yuz berdi",
        description: e.message || "Iltimos, qayta urinib ko'ring.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast({ title: "Nusxalandi!", description: "Matn to'liq xotiraga olindi." });
    setTimeout(() => setCopied(false), 2000);
  };

  // Professional Word export with exact MOVSO RUz margins & real tables
  const handleDownloadDoc = () => {
    if (!result) return;
    const cleanTopic = formData.topic.slice(0, 30).replace(/[^a-zA-Z0-9]/g, "_") || "Diplom_BMI";
    const formattedHtml = formatMarkdownToWordHTML(result);

    const wordDocHTML = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${formData.topic}</title>
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
            margin: 20mm 20mm 20mm 25mm; /* GOST: chapdan 25mm, yuqori/o'ng/past 20mm */
            mso-header-margin: 15mm;
            mso-footer-margin: 15mm;
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
            margin-bottom: 8pt;
            line-height: 1.5;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 14pt;
            margin-bottom: 14pt;
          }
          th, td {
            border: 1pt solid #000000;
            padding: 6pt;
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
        </style>
      </head>
      <body>
        <div class="Section1">
          ${formattedHtml}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([wordDocHTML], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `BMI_${cleanTopic}.doc`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Word (.doc) yuklandi!",
      description: "Hujjat GOST standartlariga to'liq mos holda saqlandi.",
    });
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
        <StudentSubNav activeTab="diplom-bmi" />
      </div>

      {/* Top Banner */}
      <div className="border-border bg-surface/30 border-b px-4 py-8 sm:px-6 lg:px-8 print:hidden">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
              <Award className="h-3.5 w-3.5" />
              <span>O&apos;zbekiston OTM Standartlari (MOVSO RUz)</span>
            </div>
            <h1 className="text-foreground text-2xl font-extrabold sm:text-3xl">
              Diplom ishi va BMI yordamchisi
            </h1>
            <p className="text-foreground-secondary mt-1 max-w-2xl text-xs sm:text-sm">
              «O&apos;zbekiston — 2030» strategiyasiga asoslangan dolzarblik, ilmiy apparat, 3 ta
              bob, qiyosiy jadvallar va 25–30 ta GOST adabiyotlar bilan tayyor akademik
              dissertatsiya materiallari.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-foreground-muted text-xs font-medium">Yo&apos;nalish:</span>
            <span className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-300">
              {formData.workType}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 print:p-0">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 print:block">
          {/* Left Form */}
          <div className="border-border bg-surface sticky top-24 rounded-2xl border p-6 shadow-sm lg:col-span-5 print:hidden">
            <div className="border-border mb-4 flex items-center justify-between border-b pb-3">
              <h2 className="text-foreground flex items-center gap-2 text-base font-bold">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>Tadqiqot parametrlari</span>
              </h2>
              <span className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400">
                GOST 2025
              </span>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              {/* Yo'nalish va Kafedra */}
              <div>
                <label className="text-foreground-secondary mb-1 block text-xs font-semibold">
                  Soha va Mutaxassislik *
                </label>
                <select
                  value={selectedSpecialtyIdx}
                  onChange={(e) => handleSpecialtyChange(parseInt(e.target.value, 10))}
                  className="border-border bg-background text-foreground w-full rounded-xl border px-3.5 py-2.5 text-xs focus:border-amber-400 focus:outline-none sm:text-sm"
                >
                  {SPECIALTIES.map((spec, i) => (
                    <option key={spec.id} value={i}>
                      {spec.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ish turi */}
              <div>
                <label className="text-foreground-secondary mb-1 block text-xs font-semibold">
                  Akademik ish turi
                </label>
                <select
                  name="workType"
                  value={formData.workType}
                  onChange={handleChange}
                  className="border-border bg-background text-foreground w-full rounded-xl border px-3.5 py-2.5 text-xs focus:border-amber-400 focus:outline-none sm:text-sm"
                >
                  <option value="Bakalavr Bitiruv Malakaviy Ishi (BMI)">
                    Bakalavr Bitiruv Malakaviy Ishi (BMI)
                  </option>
                  <option value="Magistrlik Dissertatsiyasi">Magistrlik Dissertatsiyasi</option>
                  <option value="Diplom Loyihasi (Muhandislik)">
                    Diplom Loyihasi (Muhandislik)
                  </option>
                </select>
              </div>

              {/* Mavzu + Tavsiyalar */}
              <div>
                <label className="text-foreground-secondary mb-1 block text-xs font-semibold">
                  Tadqiqot mavzusi (Aniq va to&apos;liq) *
                </label>
                <textarea
                  rows={2}
                  name="topic"
                  required
                  value={formData.topic}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData({ ...formData, topic: e.target.value })
                  }
                  placeholder="Masalan: Raqamli iqtisodiyot sharoitida bank xizmatlarini modernizatsiya qilish..."
                  className="border-border bg-background text-foreground w-full rounded-xl border px-3.5 py-2.5 text-xs focus:border-amber-400 focus:outline-none sm:text-sm"
                />

                {/* Topic Suggestions */}
                <div className="mt-2 space-y-1.5">
                  <span className="text-foreground-muted flex items-center gap-1 text-[11px] font-semibold">
                    <Lightbulb className="h-3 w-3 text-amber-400" />
                    <span>Kafedra tavsiya etgan dolzarb mavzular:</span>
                  </span>
                  <div className="space-y-1">
                    {activeSpecialty.topics.slice(0, 3).map((item, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectTopicSuggestion(item)}
                        className="border-border/70 bg-surface-elevated/70 text-foreground-secondary hover:text-foreground block w-full cursor-pointer truncate rounded-lg border px-2.5 py-1.5 text-left text-[11px] transition-all hover:border-amber-400/40 hover:bg-amber-500/10"
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
                  Tadqiqot tili
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, language: "uz" })}
                    className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold transition-all ${
                      formData.language === "uz"
                        ? "border-amber-500 bg-amber-600 font-bold text-white shadow-sm"
                        : "bg-background border-border text-foreground hover:bg-surface-elevated"
                    }`}
                  >
                    <span>🇺🇿</span>
                    <span>O&apos;zbek tili (Lotin)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, language: "ru" })}
                    className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold transition-all ${
                      formData.language === "ru"
                        ? "border-amber-500 bg-amber-600 font-bold text-white shadow-sm"
                        : "bg-background border-border text-foreground hover:bg-surface-elevated"
                    }`}
                  >
                    <span>🇷🇺</span>
                    <span>Русский язык</span>
                  </button>
                </div>
              </div>

              {/* OTM va Fakultet */}
              <div>
                <label className="text-foreground-secondary mb-1 block text-xs font-semibold">
                  OTM va Fakultet
                </label>
                <input
                  type="text"
                  name="university"
                  value={formData.university}
                  onChange={handleChange}
                  placeholder="O'zbekiston Milliy Universiteti..."
                  className="border-border bg-background text-foreground w-full rounded-xl border px-3.5 py-2.5 text-xs focus:border-amber-400 focus:outline-none sm:text-sm"
                />
              </div>

              {/* Talaba va Rahbar */}
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
                    className="border-border bg-background text-foreground w-full rounded-xl border px-3.5 py-2.5 text-xs focus:border-amber-400 focus:outline-none sm:text-sm"
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
                    placeholder="dots. Karimov A.A."
                    className="border-border bg-background text-foreground w-full rounded-xl border px-3.5 py-2.5 text-xs focus:border-amber-400 focus:outline-none sm:text-sm"
                  />
                </div>
              </div>

              {/* Shakllantiriladigan qism */}
              <div>
                <label className="text-foreground-secondary mb-1 block text-xs font-semibold">
                  Shakllantiriladigan qism
                </label>
                <select
                  name="part"
                  value={formData.part}
                  onChange={handleChange}
                  className="border-border bg-background text-foreground w-full rounded-xl border px-3.5 py-2.5 text-xs focus:border-amber-400 focus:outline-none sm:text-sm"
                >
                  <option value="To'liq BMI majmuasi (Barcha boblar va 30 ta adabiyot)">
                    To&apos;liq BMI majmuasi (Barcha boblar va 30 ta adabiyot)
                  </option>
                  <option value="To'liq konsepsiya va Kirish apparati">
                    To&apos;liq konsepsiya, Mundarija va Kirish apparati
                  </option>
                  <option value="I Bob. Nazariy-metodologik asoslar">
                    I Bob. Nazariy-metodologik asoslar (3 ta fasl)
                  </option>
                  <option value="II Bob. Amaliy va tahliliy tadqiqot">
                    II Bob. Amaliy-tahliliy tadqiqot va jadvallar
                  </option>
                  <option value="III Bob. Ilmiy takliflar va yo'l xaritasi">
                    III Bob. Ilmiy takliflar va «Yo&apos;l xaritasi»
                  </option>
                  <option value="Xulosa va 25-30 ta GOST adabiyotlar">
                    Xulosa va 25–30 ta GOST adabiyotlar ro&apos;yxati
                  </option>
                </select>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3.5 text-xs font-bold text-white shadow-lg shadow-amber-600/20 transition-all hover:scale-[1.01] hover:bg-amber-500 disabled:opacity-50 sm:text-sm"
              >
                {loading ? (
                  <>
                    <svg
                      className="mr-2 h-4 w-4 animate-spin text-white"
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
                    <span>BMI generatsiya qilinmoqda...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>BMI materialini shakllantirish 🚀</span>
                  </>
                )}
              </button>

              {/* DIPLOM HIMOYASI SLAYDLARI: FOYDALANUVCHI O'ZI XOHLAGANCHA SLAYD QO'SHADI */}
              <div className="mt-4 space-y-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Presentation className="h-4 w-4 text-amber-400" />
                    <span className="text-foreground text-xs font-bold">
                      Diplom himoyasi uchun slaydlar (PPTX)
                    </span>
                  </div>
                  <span className="text-xs font-bold text-amber-400">{slidesCount} ta slayd</span>
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
                      className="border-border bg-background text-foreground h-7 w-12 rounded-lg border text-center text-xs font-bold focus:border-amber-500 focus:outline-none"
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
                    {[10, 15, 20, 30, 50, 100].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setSlidesCount(cnt)}
                        className={`shrink-0 cursor-pointer rounded-lg border px-2 py-0.5 text-[11px] font-semibold transition-all ${
                          slidesCount === cnt
                            ? "border-amber-600 bg-amber-600 font-bold text-white shadow-sm"
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
                    formData.topic || "Bitiruv Malakaviy Ishi"
                  )}&slides=${slidesCount}&type=diplom`}
                  className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-600/20 px-3 py-2 text-xs font-bold text-amber-300 transition-all hover:bg-amber-600/30"
                >
                  <Presentation className="h-3.5 w-3.5" />
                  <span>{slidesCount} ta slaydli himoya taqdimoti yaratish →</span>
                </Link>
              </div>
            </form>
          </div>

          {/* Right Preview */}
          <div className="flex flex-col lg:col-span-7">
            {/* Loading Wizard Stepper */}
            {loading && (
              <div className="border-border bg-surface mb-6 rounded-2xl border border-amber-500/30 p-6 shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-bold tracking-wider text-amber-400 uppercase">
                    <Sparkles className="h-4 w-4 animate-spin text-amber-400" />
                    <span>BMI generatsiyasi jarayoni</span>
                  </span>
                  <span className="font-mono text-xs font-bold text-amber-400">
                    {progressPercent}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="bg-surface-elevated mb-5 h-2 w-full overflow-hidden rounded-full">
                  <div
                    className="h-full bg-amber-500 transition-all duration-500 ease-out"
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
                            ? "font-bold text-amber-400"
                            : isDone
                              ? "font-medium text-emerald-400"
                              : "text-foreground-muted"
                        }`}
                      >
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                            isCurrent
                              ? "animate-pulse bg-amber-500 text-slate-950"
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

            {result ? (
              <div className="space-y-4">
                {/* Cross-Sell Slides Banner */}
                <Link
                  href={`/academic/presentation?topic=${encodeURIComponent(
                    formData.topic
                  )}&slides=${slidesCount}&type=diplom`}
                  className="group flex items-center justify-between rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent p-3.5 transition-all hover:border-amber-500/70"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-amber-500/20 p-2 text-amber-400">
                      <Presentation className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-foreground flex items-center gap-2 text-xs font-bold sm:text-sm">
                        <span>Himoya uchun taqdimot (PPTX) tayyormi?</span>
                        <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                          {slidesCount} ta slayd
                        </span>
                      </div>
                      <div className="text-foreground-secondary text-[11px]">
                        Diplom ishingiz asosida komissiya oldida so&apos;zlash uchun slaydlar va
                        ma&apos;ruzachi nutqi
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-400 transition-transform group-hover:translate-x-1">
                    <span>Slaydlar yaratish</span>
                    <span>→</span>
                  </div>
                </Link>

                {/* Actions bar */}
                <div className="border-border bg-surface flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3">
                  <div className="text-foreground flex items-center gap-2 text-xs font-semibold sm:text-sm">
                    <span>📄 BMI hujjati tayyor (MOVSO RUz)</span>
                    <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-400">
                      Taxminiy hajm: ~
                      {Math.max(
                        1,
                        Math.round((result.split(/\s+/).filter(Boolean).length || 0) / 270)
                      )}{" "}
                      bet ({result.split(/\s+/).filter(Boolean).length.toLocaleString()} so&apos;z)
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="border-border bg-surface-elevated text-foreground hover:bg-border/60 flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span>{copied ? "Nusxalandi" : "Nusxa"}</span>
                    </button>
                    <button
                      onClick={handleDownloadDoc}
                      className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-amber-500"
                    >
                      <FileDown className="h-3.5 w-3.5" />
                      <span>Word (.doc)</span>
                    </button>
                    <button
                      onClick={handlePrint}
                      className="border-border bg-surface-elevated text-foreground hover:bg-border/60 flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
                      title="Chop etish yoki PDF sifatida saqlash"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>PDFni chop etish / saqlash</span>
                    </button>
                  </div>
                </div>

                {/* A4 Paper view */}
                <div className="flex w-full justify-center overflow-x-auto p-2 print:p-0">
                  <div
                    ref={documentRef}
                    className="a4-document border-border prose prose-slate w-[210mm] max-w-full shrink-0 rounded-sm border bg-white p-8 font-serif text-sm leading-relaxed text-black shadow-2xl sm:p-12 print:border-0 print:p-0 print:shadow-none"
                    style={{
                      boxSizing: "border-box",
                      padding: "20mm 20mm 20mm 25mm", // GOST: chap 25mm, yuqori/o'ng/past 20mm
                      minHeight: "297mm",
                    }}
                  >
                    <ReactMarkdown components={markdownComponents}>{result}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ) : (
              !loading && (
                <div className="border-border bg-surface/40 flex min-h-[440px] flex-col items-center justify-center space-y-3 rounded-2xl border border-dashed p-12 text-center print:hidden">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
                    <BookOpen className="h-7 w-7" />
                  </div>
                  <h3 className="text-foreground text-base font-bold">
                    Diplom ishi va BMI materiali shu yerda shakllanadi
                  </h3>
                  <p className="text-foreground-secondary max-w-md text-xs sm:text-sm">
                    Chap tomondan mutaxassislik, tadqiqot mavzusi va OTMni tanlang. AI vazirlik
                    standartlariga mos to&apos;liq kirish apparati, mundarija, boblar va 25-30 ta
                    GOST adabiyotlarni tuzib beradi.
                  </p>
                </div>
              )
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
