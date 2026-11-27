"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  GraduationCap,
  Presentation,
  FileText,
  Award,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Coins,
  Cpu,
  FileCheck,
} from "lucide-react";

interface ShowcaseDoc {
  id: string;
  name: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  pageCount: string;
  plagiarism: string;
  standard: string;
  targetHref: string;
  btnLabel: string;
  accentColor: string;
  accentBg: string;
  badgeBorder: string;
  title: string;
  ministry: string;
  subject: string;
  sections: Array<{ num: string; title: string; pages: string }>;
  statsPill: string;
  typeBadge: string;
}

const SHOWCASE_DOCS: ShowcaseDoc[] = [
  {
    id: "coursework",
    name: "Kurs ishi",
    category: "Akademik ish",
    icon: GraduationCap,
    pageCount: "25-30 bet",
    plagiarism: "99.1% Toza",
    standard: "OTM & GOST 2026",
    targetHref: "/academic/coursework",
    btnLabel: "Kurs ishini yaratish",
    accentColor: "from-sky-400 via-cyan-400 to-blue-500",
    accentBg: "bg-sky-500/10 text-sky-400 border-sky-500/30",
    badgeBorder: "border-sky-400/40 shadow-[0_0_20px_rgba(56,189,248,0.3)]",
    ministry: "O'ZBEKISTON RESPUBLIKASI OLIY TA'LIM, FAN VA INNOVATSIYALAR VAZIRLIGI",
    subject: "Moliya va Bank ishi kafedrasi",
    title:
      "Tijorat banklarining investitsion faoliyatini boshqarish va uning samaradorligini oshirish",
    typeBadge: "KURS ISHI • MUNDARIJA BILAN",
    statsPill: "3 Bob • 9 Paragraf • 22 Adabiyotlar",
    sections: [
      {
        num: "I BOB.",
        title: "Bank investitsion faoliyatining nazariy-uslubiy asoslari",
        pages: "6-12 bet",
      },
      {
        num: "II BOB.",
        title: "O'zbekistonda tijorat banklari faoliyatining moliyaviy tahlili",
        pages: "13-22 bet",
      },
      {
        num: "III BOB.",
        title: "Investitsion portfelni optimallashtirish va xulosalar",
        pages: "23-28 bet",
      },
    ],
  },
  {
    id: "presentation",
    name: "Taqdimot (PPTX)",
    category: "Slaydlar to'plami",
    icon: Presentation,
    pageCount: "18 slayd",
    plagiarism: "100% Vizual",
    standard: "16:9 HD & Speaker Notes",
    targetHref: "/academic/presentation",
    btnLabel: "Slaydlar yaratish",
    accentColor: "from-orange-400 via-amber-400 to-red-500",
    accentBg: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    badgeBorder: "border-orange-400/40 shadow-[0_0_20px_rgba(249,115,22,0.3)]",
    ministry: "POWERPOINT (.PPTX) • SLAYDLAR VA MA'RUZACHI NUTQI",
    subject: "Biznes tahlil va Marketing strategiyasi",
    title: "Yangi startap loyihalarini moliyalashtirish va bozorga olib chiqish strategiyasi",
    typeBadge: "16:9 PREZENTATSIYA • 18 SLAYD",
    statsPill: "Speaker Notes • Smart Diagrammalar • PPTX yuklash",
    sections: [
      {
        num: "Slayd 01-04",
        title: "Muammo, Bozor tahlili (TAM/SAM/SOM) va Taklif etilayotgan yechim",
        pages: "4 slayd",
      },
      {
        num: "Slayd 05-12",
        title: "Biznes model, Moliyaviy prognozlar (Unit Economics) va Raqobat",
        pages: "8 slayd",
      },
      {
        num: "Slayd 13-18",
        title: "Go-to-market rejasi, Investitsiya so'rovi va Xulosa",
        pages: "6 slayd",
      },
    ],
  },
  {
    id: "diplom",
    name: "Diplom ishi (BMI)",
    category: "Bitiruv ishi",
    icon: Award,
    pageCount: "60-75 bet",
    plagiarism: "98.7% Toza",
    standard: "Bakalavr / Magistratura",
    targetHref: "/academic/diplom-bmi",
    btnLabel: "BMI tuzishni boshlash",
    accentColor: "from-amber-400 via-yellow-400 to-orange-500",
    accentBg: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    badgeBorder: "border-amber-400/40 shadow-[0_0_20px_rgba(245,158,11,0.3)]",
    ministry: "BITIRUV MALAKAVIY ISHI (BMI) • ILMIY DIPLOM",
    subject: "Axborot xavfsizligi va Sun'iy intellekt yo'nalishi",
    title:
      "Katta ma'lumotlar tahlilida kiberxavfsizlik tahdidlarini mashinali o'rganish orqali aniqlash",
    typeBadge: "BMI DIPLOM ISHI • 65 BET",
    statsPill: "Ilmiy apparat • Algoritmlar • 35+ Adabiyot",
    sections: [
      {
        num: "I BOB.",
        title: "Kiberxavfsizlikda anomaliyalarni aniqlashning ilmiy-nazariy tahlili",
        pages: "10-25 bet",
      },
      {
        num: "II BOB.",
        title: "Neyrotarmoq modellarini o'rgatish va eksperimental tadqiqotlar",
        pages: "26-48 bet",
      },
      {
        num: "III BOB.",
        title: "Taklif etilgan modelning amaliy samaradorligi va iqtisodiy bahosi",
        pages: "49-62 bet",
      },
    ],
  },
  {
    id: "referat",
    name: "Mustaqil ish / Referat",
    category: "Tezkor topshiriq",
    icon: FileText,
    pageCount: "12-15 bet",
    plagiarism: "99.4% Toza",
    standard: "OTM Standart 2026",
    targetHref: "/academic/referat",
    btnLabel: "Referat tayyorlash",
    accentColor: "from-emerald-400 via-teal-400 to-cyan-500",
    accentBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    badgeBorder: "border-emerald-400/40 shadow-[0_0_20px_rgba(16,185,129,0.3)]",
    ministry: "MUSTAQIL TA'LIM TOPSHIRIG'I VA ILMIY REFERAT",
    subject: "Zamonaviy Falsafa va Madaniyatshunoslik",
    title: "Raqamli jamiyatda inson tafakkuri va ma'naviy qadriyatlar transformasiyasi",
    typeBadge: "REFERAT • 2 DAQIQADA TAYYOR",
    statsPill: "Kirish • Reja • Xulosa • Adabiyotlar",
    sections: [
      {
        num: "REJA 1.",
        title: "Raqamlashtirish davrida madaniy va ma'naviy jarayonlar",
        pages: "3-5 bet",
      },
      {
        num: "REJA 2.",
        title: "Ijtimoiy tarmoqlar va yoshlar ongiga ta'sir ko'rsatish omillari",
        pages: "6-10 bet",
      },
      {
        num: "XULOSA",
        title: "Umumiy xulosalar va milliy qadriyatlarni asrash bo'yicha tavsiyalar",
        pages: "11-13 bet",
      },
    ],
  },
  {
    id: "cv",
    name: "AI Rezyume (CV)",
    category: "Karyera hujjati",
    icon: Sparkles,
    pageCount: "ATS Format",
    plagiarism: "ATS 98%",
    standard: "Xalqaro HR Standart",
    targetHref: "/cv-builder",
    btnLabel: "Rezyume yaratish",
    accentColor: "from-purple-400 via-fuchsia-400 to-pink-500",
    accentBg: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    badgeBorder: "border-purple-400/40 shadow-[0_0_20px_rgba(168,85,247,0.3)]",
    ministry: "XALQARO FORMATDAGI PROFESSIONAL REZYUME (CV)",
    subject: "Karyera va Ishga joylashish",
    title: "Senior Full Stack Software Engineer & AI System Architect",
    typeBadge: "ATS-FRIENDLY • 20+ SHABLON",
    statsPill: "HR tekshiruvidan 98% muvaffaqiyatli o'tish",
    sections: [
      {
        num: "TAJRIBA",
        title: "Texnologik kompaniyalarda 4+ yillik muhandislik amaliyoti",
        pages: "Karyera",
      },
      {
        num: "KO'NIKMALAR",
        title: "React, Next.js, Node.js, AI LLM integratsiyalari va Bulutli tizimlar",
        pages: "Skills",
      },
      {
        num: "TA'LIM",
        title: "TATU Kompyuter Injiniringi va Xalqaro sertifikatlar",
        pages: "Diploma",
      },
    ],
  },
];

export function Hero3DShowcase() {
  const [activeTab, setActiveTab] = useState<string>("coursework");
  const currentDoc = SHOWCASE_DOCS.find((d) => d.id === activeTab) || SHOWCASE_DOCS[0];

  return (
    <div className="relative mx-auto mt-10 w-full max-w-6xl px-2 sm:px-4">
      {/* 1. Category Switcher Tabs (Glassmorphic 3D Nav) */}
      <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 sm:gap-2.5">
        {SHOWCASE_DOCS.map((doc) => {
          const Icon = doc.icon;
          const isActive = doc.id === activeTab;
          return (
            <button
              key={doc.id}
              onClick={() => setActiveTab(doc.id)}
              className={`group relative flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-semibold transition-all duration-300 sm:px-4 sm:py-2.5 sm:text-sm ${
                isActive
                  ? "bg-slate-900/90 text-white shadow-[0_10px_25px_rgba(14,165,233,0.35)] ring-1 ring-sky-400/50 dark:bg-slate-800/90 dark:text-cyan-300 dark:ring-cyan-400/60"
                  : "bg-white/80 text-slate-700 hover:bg-white hover:text-slate-900 dark:bg-[#071026]/75 dark:text-slate-300 dark:hover:bg-[#0c1a3b] dark:hover:text-white"
              } border border-slate-200/80 backdrop-blur-md dark:border-slate-800/80`}
            >
              <Icon
                className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                  isActive ? "text-cyan-400" : "text-slate-500 dark:text-slate-400"
                }`}
              />
              <span>{doc.name}</span>
              {isActive && (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 2. Main 3D Stage Container with Real Perspective */}
      <div className="relative mt-6 [perspective:1400px]">
        {/* Ambient Halo Behind Stage */}
        <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[40px] bg-gradient-to-r from-cyan-500/15 via-sky-500/10 to-indigo-500/15 blur-3xl dark:from-cyan-500/20 dark:via-blue-600/15 dark:to-purple-600/15" />

        {/* 3D Tilted Interactive Card Platform */}
        <motion.div
          key={currentDoc.id}
          initial={{ opacity: 0, scale: 0.96, rotateX: 12, rotateY: -6 }}
          animate={{ opacity: 1, scale: 1, rotateX: 6, rotateY: -3 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="group relative transform-gpu rounded-3xl border border-slate-200/90 bg-white/95 p-4 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:[transform:rotateX(2deg)_rotateY(0deg)_translateY(-4px)] sm:p-7 dark:border-sky-500/30 dark:bg-[#060c22]/95 dark:shadow-[0_25px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(14,165,233,0.15)]"
        >
          {/* Top Holographic Specular Light Line */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />

          {/* Laser AI Scanner Sweep Bar (Simulating live generation) */}
          <div className="pointer-events-none absolute inset-x-4 top-0 z-20 h-[3px] animate-[pulse_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-70 shadow-[0_0_15px_rgba(56,189,248,0.9)]" />

          {/* Floating 3D Depth Badges (Top Row) */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800/80">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${currentDoc.accentBg}`}
              >
                <FileCheck className="h-3.5 w-3.5" />
                <span>{currentDoc.typeBadge}</span>
              </span>

              <span className="hidden items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 sm:inline-flex">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>{currentDoc.plagiarism}</span>
              </span>

              <span className="hidden items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-400 md:inline-flex">
                <Cpu className="h-3.5 w-3.5" />
                <span>{currentDoc.standard}</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Format:
              </span>
              <span className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                Word (.docx)
              </span>
              <span className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                PDF
              </span>
            </div>
          </div>

          {/* Live Document Preview Canvas (Looks like an authentic A4 official paper) */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/80 p-5 shadow-inner sm:p-8 dark:border-slate-800 dark:bg-gradient-to-b dark:from-[#0a122c] dark:to-[#050b1e]">
            {/* Watermark Logo in Background */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.04] dark:opacity-[0.06]">
              <span className="text-7xl font-black tracking-widest text-slate-900 sm:text-9xl dark:text-white">
                DOCNOVA
              </span>
            </div>

            {/* Document Header Text */}
            <div className="relative text-center">
              <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase sm:text-xs dark:text-slate-400">
                {currentDoc.ministry}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-600 sm:text-sm dark:text-slate-300">
                {currentDoc.subject}
              </p>

              {/* Document Main Heading Title */}
              <h2 className="mt-4 text-lg leading-snug font-black tracking-tight text-slate-900 sm:text-2xl lg:text-3xl dark:text-white">
                &ldquo;{currentDoc.title}&rdquo;
              </h2>

              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-medium text-cyan-500 dark:text-cyan-300">
                <Sparkles className="h-3 w-3" />
                <span>{currentDoc.statsPill}</span>
              </div>
            </div>

            {/* Document Table of Contents / Outline Preview */}
            <div className="relative mt-6 space-y-2.5 rounded-xl border border-slate-200/80 bg-white/70 p-4 sm:p-5 dark:border-slate-800/80 dark:bg-[#070e24]/70">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs font-bold text-slate-500 uppercase dark:border-slate-800 dark:text-slate-400">
                <span>Mundarija va Tuzilishi</span>
                <span>Hajm</span>
              </div>

              {currentDoc.sections.map((sec, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 text-xs text-slate-700 transition-colors hover:text-cyan-500 sm:text-sm dark:text-slate-300 dark:hover:text-cyan-300"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="shrink-0 font-mono font-bold text-sky-500">{sec.num}</span>
                    <span className="truncate font-medium">{sec.title}</span>
                  </div>
                  <div className="shrink-0 font-mono text-xs text-slate-400 dark:text-slate-500">
                    {sec.pages}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Actions Bar inside 3D Canvas */}
            <div className="relative mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4 dark:border-slate-800/80">
              {/* Token & Free Trial Callout */}
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-amber-500/30">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 sm:text-sm dark:text-white">
                    <span>Yangi foydalanuvchilar uchun</span>
                    <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[11px] font-extrabold text-emerald-400">
                      3 TA BEPUL TOKEN
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    1 ta to&apos;liq kurs ishi yoki referat = 1 ta token
                  </p>
                </div>
              </div>

              {/* Action Button: Create this document */}
              <div className="flex w-full items-center gap-2.5 sm:w-auto">
                <Link
                  href={currentDoc.targetHref}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-600 px-6 py-3 text-xs font-bold text-white shadow-[0_0_25px_rgba(14,165,233,0.45)] transition-all hover:scale-105 hover:shadow-[0_0_35px_rgba(14,165,233,0.7)] sm:w-auto sm:text-sm"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{currentDoc.btnLabel}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  href="/academic/tokens"
                  className="hidden items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs font-semibold text-amber-400 transition-colors hover:bg-amber-500/20 sm:inline-flex"
                  title="Token sotib olish"
                >
                  <Coins className="h-3.5 w-3.5" />
                  <span>Tokenlar</span>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
