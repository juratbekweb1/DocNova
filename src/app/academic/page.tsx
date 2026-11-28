"use client";

import React from "react";
import Link from "next/link";
import {
  GraduationCap,
  Award,
  FileText,
  CheckSquare,
  Globe2,
  ArrowRight,
  Sparkles,
  BookOpen,
  CheckCircle2,
  FileCheck2,
  Layers,
  Clock,
  Presentation,
  Sliders,
  FileDown,
  Palette,
  Files,
  Minimize2,
  FileCode2,
  Calculator,
  QrCode,
  KeyRound,
  Wrench,
  ArrowUpRight,
  FileImage,
  Coins,
} from "lucide-react";
import { StudentSubNav } from "@/components/academic/student-sub-nav";
import { AcademicBackground3D } from "@/components/marketing/academic-background-3d";

export default function AcademicHubPage() {
  const studentModules = [
    {
      id: "coursework",
      title: "Kurs ishi yordamchisi",
      subtitle: "15-30 betlik to'liq akademik kurs ishlari",
      description:
        "Titul varag'i, avtomatik mundarija, kirish, 3 ta asosiy bob, xulosa va OTM talablariga mos adabiyotlar ro'yxati.",
      href: "/academic/coursework",
      secondaryHref: "/academic/coursework?mode=image",
      secondaryCta: "Rasm tashlash",
      icon: GraduationCap,
      badge: "Eng ommabop",
      badgeStyle: "bg-sky-500/15 text-sky-400 border-sky-500/30",
      stats: "15, 19, 25, 30 bet • A4 PDF & Word",
      cta: "Kurs ishini boshlash",
      gridSpan: "col-span-1",
      theme: {
        borderHover: "dark:group-hover:border-sky-400 group-hover:border-sky-500",
        glowPrimary: "from-sky-500/40 via-blue-600/20 to-transparent",
        glowSecondary: "from-blue-500/30 via-indigo-700/15 to-transparent",
        topBeam: "via-sky-400",
        overlayGrad:
          "dark:from-sky-950/40 dark:via-transparent dark:to-blue-950/25 from-sky-50/60 to-transparent",
        cardGlow: "hover:shadow-[0_25px_60px_rgba(14,165,233,0.35),0_0_30px_rgba(56,189,248,0.25)]",
        iconBox:
          "border-sky-500/40 bg-gradient-to-br from-sky-500/25 to-blue-600/15 text-sky-400 shadow-[0_0_25px_rgba(14,165,233,0.35)] group-hover:border-sky-300 group-hover:shadow-[0_0_35px_rgba(56,189,248,0.6)]",
        titleHover: "group-hover:text-sky-400 dark:group-hover:text-sky-300",
        subColor: "text-sky-400 group-hover:text-sky-300 transition-colors",
        btnStyle:
          "bg-gradient-to-r from-blue-600 via-sky-500 to-blue-500 hover:from-blue-500 hover:to-sky-400 text-white shadow-lg shadow-sky-500/30 border border-sky-400/40",
      },
    },
    {
      id: "diplom-bmi",
      title: "Diplom ishi va BMI",
      subtitle: "Bakalavr BMI va Magistrlik dissertatsiyalari",
      description:
        "Ilmiy muammoning dolzarbligi, obyekti, predmeti, metodologiyasi, amaliy tahlillar hamda 3 boblik to'liq ilmiy apparat.",
      href: "/academic/diplom-bmi",
      secondaryHref: "/academic/diplom-bmi?mode=image",
      secondaryCta: "Rasm tashlash",
      icon: Award,
      badge: "Ilmiy daraja",
      badgeStyle: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      stats: "40-80 bet • Ilmiy yangilik & Reja",
      cta: "BMI tuzishni boshlash",
      gridSpan: "col-span-1",
      theme: {
        borderHover: "dark:group-hover:border-amber-400 group-hover:border-amber-500",
        glowPrimary: "from-amber-500/40 via-orange-600/20 to-transparent",
        glowSecondary: "from-yellow-500/30 via-amber-700/15 to-transparent",
        topBeam: "via-amber-400",
        overlayGrad:
          "dark:from-amber-950/40 dark:via-transparent dark:to-orange-950/25 from-amber-50/60 to-transparent",
        cardGlow: "hover:shadow-[0_25px_60px_rgba(245,158,11,0.35),0_0_30px_rgba(251,191,36,0.25)]",
        iconBox:
          "border-amber-500/40 bg-gradient-to-br from-amber-500/25 to-orange-600/15 text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.35)] group-hover:border-amber-300 group-hover:shadow-[0_0_35px_rgba(245,158,11,0.6)]",
        titleHover: "group-hover:text-amber-400 dark:group-hover:text-amber-300",
        subColor: "text-amber-400/90 group-hover:text-amber-300 transition-colors",
        btnStyle:
          "bg-gradient-to-r from-amber-600 via-orange-500 to-amber-500 hover:from-amber-500 hover:to-orange-400 text-white shadow-lg shadow-amber-500/30 border border-amber-400/40",
      },
    },
    {
      id: "referat",
      title: "Mustaqil ish va Referat",
      subtitle: "Tezkor referatlar va mustaqil ta'lim hisobotlari",
      description:
        "Universitet fani bo'yicha mustaqil topshiriqlar, esse, referat va ilmiy tezislar. 2 daqiqada tayyorlanadi.",
      href: "/academic/referat",
      secondaryHref: "/academic/referat?mode=image",
      secondaryCta: "Rasm tashlash",
      icon: FileText,
      badge: "Tezkor (2 min)",
      badgeStyle: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      stats: "3-15 bet • Word (.doc) eksport",
      cta: "Referat tayyorlash",
      gridSpan: "col-span-1",
      theme: {
        borderHover: "dark:group-hover:border-emerald-400 group-hover:border-emerald-500",
        glowPrimary: "from-emerald-500/40 via-teal-600/20 to-transparent",
        glowSecondary: "from-green-500/30 via-emerald-700/15 to-transparent",
        topBeam: "via-emerald-400",
        overlayGrad:
          "dark:from-emerald-950/40 dark:via-transparent dark:to-teal-950/25 from-emerald-50/60 to-transparent",
        cardGlow: "hover:shadow-[0_25px_60px_rgba(16,185,129,0.35),0_0_30px_rgba(52,211,153,0.25)]",
        iconBox:
          "border-emerald-500/40 bg-gradient-to-br from-emerald-500/25 to-teal-600/15 text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.35)] group-hover:border-emerald-300 group-hover:shadow-[0_0_35px_rgba(16,185,129,0.6)]",
        titleHover: "group-hover:text-emerald-400 dark:group-hover:text-emerald-300",
        subColor: "text-emerald-400/90 group-hover:text-emerald-300 transition-colors",
        btnStyle:
          "bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/30 border border-emerald-400/40",
      },
    },
    {
      id: "image-topics",
      title: "Rasm orqali mavzular",
      subtitle: "Konspekt yoki darslik rasmidan avtomatik ajratish",
      description:
        "Yuklangan rasm ichidagi 1 ta yoki 10+ mavzuni AI o'qib, alohida bloklarga ajratadi va har biriga nechta bet yozilishini so'raydi.",
      href: "/academic/image-topics",
      icon: FileImage,
      badge: "AI Vision (Yangi)",
      badgeStyle: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
      stats: "Galereyadan rasm -> Nechta bet -> Tayyor ish",
      cta: "Rasm tashlash",
      gridSpan: "col-span-1",
      theme: {
        borderHover: "dark:group-hover:border-cyan-400 group-hover:border-cyan-500",
        glowPrimary: "from-cyan-500/40 via-sky-600/20 to-transparent",
        glowSecondary: "from-sky-500/30 via-blue-700/15 to-transparent",
        topBeam: "via-cyan-400",
        overlayGrad:
          "dark:from-cyan-950/40 dark:via-transparent dark:to-sky-950/25 from-cyan-50/60 to-transparent",
        cardGlow: "hover:shadow-[0_25px_60px_rgba(6,182,212,0.35),0_0_30px_rgba(56,189,248,0.25)]",
        iconBox:
          "border-cyan-500/40 bg-gradient-to-br from-cyan-500/25 to-sky-600/15 text-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.35)] group-hover:border-cyan-300 group-hover:shadow-[0_0_35px_rgba(6,182,212,0.6)]",
        titleHover: "group-hover:text-cyan-400 dark:group-hover:text-cyan-300",
        subColor: "text-cyan-400/90 group-hover:text-cyan-300 transition-colors",
        btnStyle:
          "bg-gradient-to-r from-cyan-600 via-sky-500 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/30 border border-cyan-400/40",
      },
    },
    {
      id: "presentation",
      title: "Prezentatsiya va Slaydlar",
      subtitle: "PowerPoint (.pptx) va Ma'ruzachi nutqi (Speaker Notes)",
      description:
        "Kurs ishi, diplom (BMI) yoki referat himoyasi uchun professional taqdimot slaydlari. Har bir slayd uchun asosiy tezislar va komissiya oldida so'zlash uchun ma'ruzachi nutqi avtomatik shakllantiriladi.",
      href: "/academic/presentation",
      secondaryHref: "/academic/presentation?mode=image",
      secondaryCta: "Rasm tashlash",
      icon: Presentation,
      badge: "PPTX & AI",
      badgeStyle: "bg-orange-500/15 text-orange-400 border-orange-500/30",
      stats: "8-100 slayd • PowerPoint (.pptx) & Speaker Notes • 1-bosishda eksport",
      cta: "Slaydlar yaratish",
      isWide: true,
      badges: [
        { text: "PPTX & AI", style: "border-orange-500/30 bg-orange-500/15 text-orange-400" },
        {
          text: "1 dan 100 tagacha slayd",
          style: "border-amber-500/30 bg-amber-500/15 text-amber-300",
        },
        {
          text: "Kengaytirilgan format",
          style: "border-emerald-500/30 bg-emerald-500/15 text-emerald-400",
        },
      ],
      features: [
        {
          icon: Sliders,
          title: "Aqlli tuzilma",
          desc: "Kirish, 3 ta bob, tahliliy jadvallar va xulosalar",
          color: "text-orange-400",
        },
        {
          icon: "🎙️",
          title: "Speaker Notes",
          desc: "Har bir slayd uchun ma'ruzachi nutqi matni",
          color: "text-amber-400",
        },
        {
          icon: Palette,
          title: "3 xil dizayn",
          desc: "Academic, Modern va Minimalist uslublar",
          color: "text-sky-400",
        },
        {
          icon: FileDown,
          title: "PPTX & PDF",
          desc: "PowerPoint (.pptx) va PDF formatga tezkor eksport",
          color: "text-emerald-400",
        },
      ],
      theme: {
        borderHover: "dark:group-hover:border-orange-400 group-hover:border-orange-500",
        glowPrimary: "from-orange-500/40 via-amber-600/20 to-transparent",
        glowSecondary: "from-amber-500/30 via-red-600/15 to-transparent",
        topBeam: "via-orange-400",
        overlayGrad:
          "dark:from-orange-950/40 dark:via-transparent dark:to-amber-950/25 from-orange-50/60 to-transparent",
        cardGlow: "hover:shadow-[0_25px_60px_rgba(249,115,22,0.35),0_0_30px_rgba(251,146,60,0.25)]",
        iconBox:
          "border-orange-500/40 bg-gradient-to-br from-orange-500/25 to-amber-600/15 text-orange-400 shadow-[0_0_25px_rgba(249,115,22,0.35)] group-hover:border-orange-300 group-hover:shadow-[0_0_35px_rgba(249,115,22,0.6)]",
        titleHover: "group-hover:text-orange-400 dark:group-hover:text-orange-300",
        subColor: "text-orange-400/90 group-hover:text-orange-300 transition-colors",
        btnStyle:
          "bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 hover:from-orange-500 hover:to-amber-400 text-white shadow-lg shadow-orange-500/30 border border-orange-400/40",
      },
    },
    {
      id: "amaliy-ish",
      title: "Amaliy ish va Masalalar yechimi",
      subtitle: "Variantli masalalar, ANOVA jadvallar, grafik va Excel",
      description:
        "Iqtisodiyot, statistika, ekonometrika va aniq fanlardan variantli amaliy ishlar: a), b), c), d), e) bosqichli yechim, hisob-kitob jadvallari, ustunli diagramma va Excel (EN/RU) formulalari.",
      href: "/academic/amaliy-ish",
      secondaryHref: "/academic/amaliy-ish?mode=image",
      secondaryCta: "Rasm tashlash",
      icon: Calculator,
      badge: "Hisob-kitob & Jadvallar",
      badgeStyle: "bg-indigo-500/15 text-indigo-300 border-indigo-500/35",
      stats: "1-4 masala • Jadval, Grafik & Excel • Word/PDF",
      cta: "Amaliy ish tayyorlash",
      gridSpan: "col-span-1",
      theme: {
        borderHover: "dark:group-hover:border-indigo-400 group-hover:border-indigo-500",
        glowPrimary: "from-indigo-500/40 via-blue-600/20 to-transparent",
        glowSecondary: "from-sky-500/30 via-indigo-700/15 to-transparent",
        topBeam: "via-indigo-400",
        overlayGrad:
          "dark:from-indigo-950/40 dark:via-transparent dark:to-blue-950/25 from-indigo-50/60 to-transparent",
        cardGlow:
          "hover:shadow-[0_25px_60px_rgba(99,102,241,0.35),0_0_30px_rgba(129,140,248,0.25)]",
        iconBox:
          "border-indigo-500/40 bg-gradient-to-br from-indigo-500/25 to-blue-600/15 text-indigo-400 shadow-[0_0_25px_rgba(99,102,241,0.35)] group-hover:border-indigo-300 group-hover:shadow-[0_0_35px_rgba(99,102,241,0.6)]",
        titleHover: "group-hover:text-indigo-400 dark:group-hover:text-indigo-300",
        subColor: "text-indigo-400/90 group-hover:text-indigo-300 transition-colors",
        btnStyle:
          "bg-gradient-to-r from-indigo-600 via-blue-500 to-indigo-500 hover:from-indigo-500 hover:to-blue-400 text-white shadow-lg shadow-indigo-500/30 border border-indigo-400/40",
      },
    },
    {
      id: "exam-prep",
      title: "Test va Imtihonlarga tayyorgarlik",
      subtitle: "Bilet savollari yechimlari va interaktiv testlar",
      description:
        "Fanlar bo'yicha imtihon biletlari, 10 talik variantli testlar (MCQ) va tushuntirishli yechimlar orqali sessiyaga 100% tayyorlaning.",
      href: "/academic/exam-prep",
      secondaryHref: "/academic/exam-prep?mode=image",
      secondaryCta: "Rasm tashlash",
      icon: CheckSquare,
      badge: "Interaktiv",
      badgeStyle: "bg-purple-500/15 text-purple-300 border-purple-500/35",
      stats: "Biletlar • Testlar • Shpargalkalar",
      cta: "Imtihonga tayyorlanish",
      gridSpan: "col-span-1",
      theme: {
        borderHover: "dark:group-hover:border-purple-400 group-hover:border-purple-500",
        glowPrimary: "from-purple-500/40 via-fuchsia-600/20 to-transparent",
        glowSecondary: "from-indigo-500/30 via-purple-700/15 to-transparent",
        topBeam: "via-purple-400",
        overlayGrad:
          "dark:from-purple-950/40 dark:via-transparent dark:to-fuchsia-950/25 from-purple-50/60 to-transparent",
        cardGlow:
          "hover:shadow-[0_25px_60px_rgba(168,85,247,0.35),0_0_30px_rgba(192,132,252,0.25)]",
        iconBox:
          "border-purple-500/40 bg-gradient-to-br from-purple-500/25 to-fuchsia-600/15 text-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.35)] group-hover:border-purple-300 group-hover:shadow-[0_0_35px_rgba(168,85,247,0.6)]",
        titleHover: "group-hover:text-purple-400 dark:group-hover:text-purple-300",
        subColor: "text-purple-400/90 group-hover:text-purple-300 transition-colors",
        btnStyle:
          "bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-500 hover:from-purple-500 hover:to-fuchsia-400 text-white shadow-lg shadow-purple-500/30 border border-purple-400/40",
      },
    },
    {
      id: "mock-test",
      title: "Mock Test (Chet tillari)",
      subtitle: "IELTS, TRKI va TÖMER xalqaro simulyatori",
      description:
        "Ingliz, Rus va Turk tillari bo'yicha test topshiring va AI orqali darajangiz (Band / CEFR) hisobotini oling.",
      href: "/academic/mock-test",
      icon: Globe2,
      badge: "3 ta til • AI Baholash",
      badgeStyle: "bg-cyan-500/15 text-cyan-300 border-cyan-500/35",
      stats: "Ingliz • Rus • Turk tillari",
      cta: "Tillarni tanlash",
      gridSpan: "col-span-1 lg:col-span-2",
      languages: [
        {
          code: "GB",
          name: "Ingliz tili",
          desc: "IELTS • CEFR",
          border: "border-sky-500/30 hover:border-sky-400",
        },
        {
          code: "RU",
          name: "Rus tili",
          desc: "ТРКИ • B1/B2",
          border: "border-blue-500/30 hover:border-blue-400",
        },
        {
          code: "TR",
          name: "Turk tili",
          desc: "TÖMER • C1",
          border: "border-red-500/30 hover:border-red-400",
        },
      ],
      theme: {
        borderHover: "dark:group-hover:border-cyan-400 group-hover:border-cyan-500",
        glowPrimary: "from-cyan-500/40 via-blue-600/20 to-transparent",
        glowSecondary: "from-sky-500/30 via-indigo-700/15 to-transparent",
        topBeam: "via-cyan-400",
        overlayGrad:
          "dark:from-cyan-950/40 dark:via-transparent dark:to-blue-950/25 from-cyan-50/60 to-transparent",
        cardGlow: "hover:shadow-[0_25px_60px_rgba(6,182,212,0.35),0_0_30px_rgba(56,189,248,0.25)]",
        iconBox:
          "border-cyan-500/40 bg-gradient-to-br from-cyan-500/25 to-sky-600/15 text-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.35)] group-hover:border-cyan-300 group-hover:shadow-[0_0_35px_rgba(6,182,212,0.6)]",
        titleHover: "group-hover:text-cyan-400 dark:group-hover:text-cyan-300",
        subColor: "text-cyan-400/90 group-hover:text-cyan-300 transition-colors",
        btnStyle:
          "bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-500 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/30 border border-cyan-400/40",
      },
    },
    {
      id: "tokens",
      title: "Token sotib olish",
      subtitle: "1 ta akademik ish = 1 ta token (3 000 so'mdan)",
      description:
        "Bepul 3 ta tokeningiz tugadimi? Oylik obunasiz, faqat kerakli miqdorda token sotib olib foydalaning.",
      href: "/academic/tokens",
      icon: Coins,
      badge: "3 ta bepul token",
      badgeStyle: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      stats: "PayX • Uzcard • Humo • Visa",
      cta: "Token sotib olish",
      gridSpan: "col-span-1",
      theme: {
        borderHover: "dark:group-hover:border-amber-400 group-hover:border-amber-500",
        glowPrimary: "from-amber-500/40 via-yellow-600/20 to-transparent",
        glowSecondary: "from-orange-500/30 via-amber-700/15 to-transparent",
        topBeam: "via-amber-400",
        overlayGrad:
          "dark:from-amber-950/40 dark:via-transparent dark:to-yellow-950/25 from-amber-50/60 to-transparent",
        cardGlow: "hover:shadow-[0_25px_60px_rgba(245,158,11,0.35),0_0_30px_rgba(251,191,36,0.25)]",
        iconBox:
          "border-amber-500/40 bg-gradient-to-br from-amber-500/25 to-yellow-600/15 text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.35)] group-hover:border-amber-300 group-hover:shadow-[0_0_35px_rgba(245,158,11,0.6)]",
        titleHover: "group-hover:text-amber-400 dark:group-hover:text-amber-300",
        subColor: "text-amber-400/90 group-hover:text-amber-300 transition-colors",
        btnStyle:
          "bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-bold shadow-lg shadow-amber-500/30 border border-amber-400/40",
      },
    },
  ];

  const utilityTools = [
    {
      id: "merge-pdf",
      title: "PDF Birlashtirish",
      description: "Bir nechta PDF hujjatlarni bitta tartibli faylga tezkor birlashtirish.",
      href: "/tools/merge-pdf",
      icon: Files,
      badge: "Fayllar",
      theme: {
        borderHover: "hover:border-blue-400/70",
        iconBox: "border-blue-500/30 bg-blue-500/10 text-blue-400",
      },
    },
    {
      id: "compress-pdf",
      title: "PDF Siqish",
      description: "Sifatini saqlagan holda PDF hajmini kichraytirish va optimallashtirish.",
      href: "/tools/compress-pdf",
      icon: Minimize2,
      badge: "Hajm",
      theme: {
        borderHover: "hover:border-emerald-400/70",
        iconBox: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
      },
    },
    {
      id: "pdf-to-word",
      title: "PDF dan Word ga",
      description: "PDF formatidagi fayllarni tahrirlanadigan Word (.docx) formatiga o'tkazish.",
      href: "/tools/pdf-to-word",
      icon: FileCode2,
      badge: "Konvertatsiya",
      theme: {
        borderHover: "hover:border-sky-400/70",
        iconBox: "border-sky-500/30 bg-sky-500/10 text-sky-400",
      },
    },
    {
      id: "word-counter",
      title: "So'z Hisoblagich",
      description: "Matndagi so'zlar, belgilar, o'qish vaqti va hajmni real vaqtda hisoblash.",
      href: "/tools/word-counter",
      icon: Calculator,
      badge: "Matn tahlili",
      theme: {
        borderHover: "hover:border-purple-400/70",
        iconBox: "border-purple-500/30 bg-purple-500/10 text-purple-400",
      },
    },
    {
      id: "qr-generator",
      title: "QR Generator",
      description: "Havolalar, Wi-Fi va matnlar uchun maxsus dizayndagi tezkor QR-kodlar yaratish.",
      href: "/tools/qr-generator",
      icon: QrCode,
      badge: "Ulashish",
      theme: {
        borderHover: "hover:border-amber-400/70",
        iconBox: "border-amber-500/30 bg-amber-500/10 text-amber-400",
      },
    },
    {
      id: "password-generator",
      title: "Parol Generator",
      description: "Talabalar akkauntlari va himoyalangan hujjatlar uchun mustahkam parollar.",
      href: "/tools/password-generator",
      icon: KeyRound,
      badge: "Xavfsizlik",
      theme: {
        borderHover: "hover:border-rose-400/70",
        iconBox: "border-rose-500/30 bg-rose-500/10 text-rose-400",
      },
    },
  ];

  return (
    <div className="relative min-h-screen w-full overflow-x-clip bg-[#f8fafc] text-slate-900 selection:bg-cyan-500/30 selection:text-white dark:bg-[#020817] dark:text-white">
      {/* 1. 3D Kosmik & Arxitekturaviy Fon (Nova Flare & Perspective Rings) */}
      <AcademicBackground3D />

      <div className="relative z-10 w-full overflow-x-clip">
        {/* Sub-nav */}
        <StudentSubNav />

        {/* 2. Hero 3D Floating Stage */}
        <section className="relative mx-auto mt-6 max-w-7xl px-4 sm:mt-8 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white/80 p-8 shadow-2xl backdrop-blur-xl sm:p-12 md:py-16 dark:border-sky-500/25 dark:bg-[#070e24]/85 dark:shadow-[0_20px_50px_rgba(0,0,0,0.7)]">
            {/* Top Specular Light Line */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />
            <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[600px] -translate-x-1/2 rounded-full bg-cyan-500/15 blur-3xl dark:bg-cyan-500/25" />

            <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-50 px-4 py-1.5 text-xs font-semibold text-sky-700 shadow-sm dark:border-sky-500/35 dark:bg-sky-950/70 dark:text-sky-300">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                <span>DocNova Talabalar Portali 2026</span>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
              </div>

              {/* Title */}
              <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white">
                Talabalar va Ilmiy Izlanuvchilar{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-600 bg-clip-text text-transparent">
                  Markazi
                </span>
              </h1>

              {/* Subtitle */}
              <p className="max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base lg:text-lg dark:text-slate-300">
                Kurs ishlari, diplom loyihalari (BMI), mustaqil ishlar, taqdimot slaydlari, imtihon
                biletlari va chet tillari bo&apos;yicha xalqaro mock testlar — barchasi bitta qulay
                va intuitiv 3D platformada.
              </p>

              {/* Quick Feature Badges with 3D Bevels */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs font-medium">
                <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 font-semibold text-emerald-400 shadow-sm backdrop-blur-md">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>OTM standartlariga 100% mos</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3.5 py-1.5 font-semibold text-sky-400 shadow-sm backdrop-blur-md">
                  <FileCheck2 className="h-4 w-4" />
                  <span>Word (.docx) va PDF format</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5 font-semibold text-amber-400 shadow-sm backdrop-blur-md">
                  <Clock className="h-4 w-4" />
                  <span>Tezkor 24/7 AI generatsiya</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Main Modules Grid */}
        <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {/* 3D TOKEN BALANCE & SOTIB OLISH MODULI */}
          <div className="relative mb-8 overflow-hidden rounded-2xl border border-amber-500/35 bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-indigo-500/10 p-5 shadow-lg backdrop-blur-xl dark:from-[#1c1400]/80 dark:via-[#091533]/85 dark:to-[#050f24]/90 dark:shadow-[0_10px_30px_rgba(245,158,11,0.15)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
            <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-400 via-orange-500 to-yellow-600 text-white shadow-md shadow-amber-500/30">
                  <Coins className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-base font-bold text-slate-900 sm:text-lg dark:text-white">
                      Akademik Ishlar Balansi & Tokenlar
                    </h4>
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2.5 py-0.5 text-xs font-extrabold text-emerald-400">
                      3 TA BEPUL TOKEN
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-600 sm:text-sm dark:text-slate-300">
                    1 ta to&apos;liq kurs ishi, referat, diplom BMI yoki amaliy ish = 1 ta token.
                    Istalgan miqdorda (1 tadan 500 tagacha) xarid qiling!
                  </p>
                </div>
              </div>

              <div className="flex w-full flex-wrap items-center gap-2.5 sm:w-auto">
                <Link
                  href="/academic/tokens"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/30 transition-all hover:scale-105 active:scale-95 sm:w-auto sm:text-sm"
                >
                  <Coins className="h-4 w-4" />
                  <span>Token sotib olish</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* TOP HEADER: "Talabalar uchun asosiy bo'limlar" */}
          <div className="mb-8 flex flex-col justify-between gap-4 rounded-2xl border border-sky-500/25 bg-white/80 p-5 shadow-lg backdrop-blur-xl sm:flex-row sm:items-center dark:border-sky-500/20 dark:bg-[#070e24]/85">
            <div className="flex items-start gap-3 sm:items-center">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-400/30 bg-sky-500/10 text-sky-400 shadow-sm">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
                  Talabalar uchun asosiy bo&apos;limlar
                </h2>
                <p className="mt-0.5 text-xs text-slate-600 sm:text-sm dark:text-slate-400">
                  O&apos;zingizga kerakli bo&apos;limni tanlang yoki telefon galereyasidan mavzular
                  rasmini tashlab, nechta bet yozilishini belgilang
                </p>
              </div>
            </div>
            <Link
              href="/academic/referat?mode=image"
              className="inline-flex min-h-[44px] w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-2.5 text-xs font-bold whitespace-nowrap text-white shadow-md shadow-sky-500/25 transition-all hover:scale-[1.02] hover:from-sky-400 hover:to-blue-500 sm:w-auto sm:text-sm"
            >
              <FileImage className="h-4 w-4 shrink-0" />
              <span>Rasm tashlash</span>
            </Link>
          </div>

          {/* 3D Multi-Layered Responsive Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {studentModules.map((module) => {
              const Icon = module.icon;

              // WIDE CARD LAYOUT FOR PREZENTATSIYA VA SLAYDLAR (COL-SPAN-FULL)
              if (module.isWide) {
                return (
                  <div key={module.id} className="group relative col-span-full flex">
                    <div
                      className={`relative flex h-full w-full flex-col justify-between overflow-hidden rounded-[26px] border border-slate-200/90 dark:border-slate-800/80 ${module.theme.borderHover} bg-white p-6 shadow-md transition-all duration-300 ease-out hover:-translate-y-2.5 hover:scale-[1.01] sm:p-8 dark:bg-gradient-to-b dark:from-[#0a142f]/95 dark:via-[#060c1e]/98 dark:to-[#020612] dark:shadow-[0_15px_35px_rgba(0,0,0,0.5)] ${module.theme.cardGlow}`}
                    >
                      {/* Ambient 3D Neon Orbs & Top Light Beam */}
                      <div
                        className={`pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] ${module.theme.glowPrimary} opacity-25 transition-all duration-500 group-hover:scale-115 group-hover:opacity-90`}
                      />
                      <div
                        className={`pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] ${module.theme.glowSecondary} opacity-15 transition-all duration-500 group-hover:scale-115 group-hover:opacity-80`}
                      />
                      <div
                        className={`pointer-events-none absolute inset-x-0 top-0 h-[2.5px] bg-gradient-to-r from-transparent ${module.theme.topBeam} to-transparent opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:shadow-[0_0_15px_rgba(249,115,22,0.9)]`}
                      />
                      <div
                        className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${module.theme.overlayGrad} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                      />

                      <div className="relative z-10 flex h-full flex-col justify-between">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
                          {/* Left 7 cols: info */}
                          <div className="space-y-3 lg:col-span-7">
                            <div className="flex flex-wrap items-center gap-2">
                              <div
                                className={`flex h-12 w-12 items-center justify-center rounded-xl border ${module.theme.iconBox} shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3`}
                              >
                                <Icon className="h-6 w-6 text-orange-400" />
                              </div>
                              {module.badges?.map((b) => (
                                <span
                                  key={b.text}
                                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${b.style}`}
                                >
                                  {b.text}
                                </span>
                              ))}
                            </div>

                            <div>
                              <h3
                                className={`text-xl font-bold text-slate-900 transition-colors sm:text-2xl dark:text-white ${module.theme.titleHover}`}
                              >
                                {module.title}
                              </h3>
                              <p
                                className={`mt-0.5 text-xs font-semibold sm:text-sm ${module.theme.subColor}`}
                              >
                                {module.subtitle}
                              </p>
                            </div>

                            <p className="max-w-2xl text-xs leading-relaxed text-slate-600 sm:text-sm dark:text-slate-300">
                              {module.description}
                            </p>
                          </div>

                          {/* Right 5 cols: visual feature highlights */}
                          <div className="grid grid-cols-2 gap-2.5 lg:col-span-5">
                            {module.features?.map((feat) => {
                              const FeatIcon = feat.icon;
                              return (
                                <div
                                  key={feat.title}
                                  className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/50 hover:bg-orange-500/10 hover:shadow-md dark:border-slate-800/80 dark:bg-[#0a1226]/80 dark:hover:border-orange-400/40 dark:hover:bg-[#0e1738]"
                                >
                                  <div
                                    className={`flex items-center gap-1.5 text-xs font-bold ${feat.color}`}
                                  >
                                    {typeof FeatIcon === "string" ? (
                                      <span>{FeatIcon}</span>
                                    ) : (
                                      <FeatIcon className="h-3.5 w-3.5" />
                                    )}
                                    <span>{feat.title}</span>
                                  </div>
                                  <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                    {feat.desc}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Wide card bottom bar */}
                        <div className="mt-6 flex flex-col items-start justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center dark:border-slate-800/80">
                          <span className="flex items-center gap-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-orange-400" />
                            <span>{module.stats}</span>
                          </span>
                          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                            {"secondaryHref" in module && module.secondaryHref && (
                              <Link
                                href={module.secondaryHref}
                                className="inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-500/10 px-4 py-2.5 text-xs font-semibold whitespace-nowrap text-sky-600 transition-all duration-200 hover:scale-105 hover:border-sky-400 hover:bg-sky-500/25 active:scale-95 sm:w-auto dark:text-sky-300"
                              >
                                <FileImage className="h-3.5 w-3.5 shrink-0" />
                                <span>{module.secondaryCta || "Rasm tashlash"}</span>
                              </Link>
                            )}
                            <Link
                              href={module.href}
                              className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white transition-all duration-200 hover:scale-105 active:scale-95 sm:w-auto ${module.theme.btnStyle}`}
                            >
                              <span>{module.cta}</span>
                              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              // STANDARD CARDS (Kurs ishi, Diplom, Referat, Rasm orqali, Amaliy ish, Imtihon, Mock Test, Tokenlar)
              return (
                <div key={module.id} className={`group relative flex ${module.gridSpan}`}>
                  <div
                    className={`relative flex h-full w-full flex-col justify-between overflow-hidden rounded-[26px] border border-slate-200/90 dark:border-slate-800/80 ${module.theme.borderHover} bg-white p-6 shadow-md transition-all duration-300 ease-out hover:-translate-y-2.5 hover:scale-[1.015] sm:p-7 dark:bg-gradient-to-b dark:from-[#0a142f]/95 dark:via-[#060c1e]/98 dark:to-[#020612] dark:shadow-[0_15px_35px_rgba(0,0,0,0.5)] ${module.theme.cardGlow}`}
                  >
                    {/* Ambient 3D Neon Orbs & Top Light Beam */}
                    <div
                      className={`pointer-events-none absolute -top-16 -right-16 h-52 w-52 rounded-full bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] ${module.theme.glowPrimary} opacity-25 transition-all duration-500 group-hover:scale-115 group-hover:opacity-90`}
                    />
                    <div
                      className={`pointer-events-none absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] ${module.theme.glowSecondary} opacity-15 transition-all duration-500 group-hover:scale-115 group-hover:opacity-80`}
                    />
                    <div
                      className={`pointer-events-none absolute inset-x-0 top-0 h-[2.5px] bg-gradient-to-r from-transparent ${module.theme.topBeam} to-transparent opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:shadow-[0_0_15px_rgba(56,189,248,0.9)]`}
                    />
                    <div
                      className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${module.theme.overlayGrad} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                    />

                    <div className="relative z-10 flex h-full flex-col justify-between">
                      <div>
                        <div className="mb-4 flex items-center justify-between gap-2">
                          <div
                            className={`flex h-12 w-12 items-center justify-center rounded-xl border ${module.theme.iconBox} shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3`}
                          >
                            <Icon className="h-6 w-6" />
                          </div>
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${module.badgeStyle}`}
                          >
                            {module.badge}
                          </span>
                        </div>

                        <h3
                          className={`text-lg font-bold text-slate-900 transition-colors sm:text-xl dark:text-white ${module.theme.titleHover}`}
                        >
                          {module.title}
                        </h3>
                        <p className={`mt-0.5 mb-2.5 text-xs font-medium ${module.theme.subColor}`}>
                          {module.subtitle}
                        </p>
                        <p className="text-xs leading-relaxed text-slate-600 sm:text-sm dark:text-slate-300">
                          {module.description}
                        </p>

                        {/* Mock test languages visual preview */}
                        {module.id === "mock-test" && "languages" in module && (
                          <div className="my-5 grid grid-cols-3 gap-3">
                            {module.languages?.map((lang) => (
                              <div
                                key={lang.code}
                                className={`rounded-xl border ${lang.border} bg-slate-50/90 p-3 text-center transition-all duration-200 hover:scale-105 dark:bg-[#07122b]/80`}
                              >
                                <div className="text-sm font-extrabold tracking-wider text-slate-900 sm:text-base dark:text-white">
                                  {lang.code}
                                </div>
                                <div className="mt-0.5 text-xs font-bold text-sky-500 dark:text-cyan-400">
                                  {lang.name}
                                </div>
                                <div className="text-[10px] text-slate-500 sm:text-[11px] dark:text-slate-400">
                                  {lang.desc}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-6 flex flex-col items-start justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:flex-wrap sm:items-center dark:border-slate-800/80">
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          {module.stats}
                        </span>
                        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                          {"secondaryHref" in module && module.secondaryHref && (
                            <Link
                              href={module.secondaryHref}
                              className="inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-500/10 px-3.5 py-2 text-xs font-semibold whitespace-nowrap text-sky-600 transition-all duration-200 hover:scale-105 hover:border-sky-400 hover:bg-sky-500/25 active:scale-95 sm:w-auto dark:text-sky-300"
                            >
                              <FileImage className="h-3.5 w-3.5 shrink-0" />
                              <span>{module.secondaryCta || "Rasm tashlash"}</span>
                            </Link>
                          )}
                          <Link
                            href={module.href}
                            className={`inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all duration-200 hover:scale-105 active:scale-95 sm:w-auto ${module.theme.btnStyle}`}
                          >
                            <span>{module.cta}</span>
                            <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-1.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 4. Subtle Visual Divider */}
          <div className="relative my-14">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-200/90 dark:border-slate-800/80" />
            </div>
            <div className="relative flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-white px-4 py-1.5 text-xs font-bold tracking-wider text-sky-500 uppercase shadow-md dark:border-sky-500/35 dark:bg-[#070e24] dark:text-cyan-400">
                <Wrench className="h-3.5 w-3.5" />
                <span>Yordamchi Mikro-xizmatlar</span>
              </span>
            </div>
          </div>

          {/* 5. Dedicated Quick Tools Section */}
          <div className="mb-14 space-y-6">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <div>
                <h2 className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
                  <span>🛠 Talabalar uchun tezkor asboblar</span>
                </h2>
                <p className="mt-1 text-xs text-slate-600 sm:text-sm dark:text-slate-400">
                  Kundalik o&apos;qish va hujjatlar bilan ishlash uchun qulay mikro-servislar
                </p>
              </div>
              <Link
                href="/tools"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-500 transition-colors hover:underline dark:text-cyan-400"
              >
                <span>Barcha asboblar ({">"}20)</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {utilityTools.map((tool) => {
                const ToolIcon = tool.icon;
                return (
                  <Link
                    key={tool.id}
                    href={tool.href}
                    className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800/80 ${tool.theme.borderHover} bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg dark:bg-gradient-to-b dark:from-[#0a142f]/95 dark:via-[#060c1e]/98 dark:to-[#020612]`}
                  >
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:scale-110 ${tool.theme.iconBox}`}
                        >
                          <ToolIcon className="h-5 w-5" />
                        </div>
                        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:border-slate-700/60 dark:bg-slate-800/60 dark:text-slate-300">
                          {tool.badge}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 transition-colors group-hover:text-cyan-400 sm:text-base dark:text-white">
                        {tool.title}
                      </h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                        {tool.description}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-semibold dark:border-slate-800/60">
                      <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                        Bepul foydalanish
                      </span>
                      <span className="inline-flex items-center gap-1 text-sky-500 group-hover:underline dark:text-cyan-400">
                        <span>Ochish</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* 6. Academic Standard Banner (MOVSO RUz) */}
          <div className="relative flex flex-col items-center justify-between gap-6 overflow-hidden rounded-3xl border border-slate-200/90 bg-white/90 p-8 shadow-2xl backdrop-blur-xl sm:p-10 md:flex-row dark:border-sky-500/30 dark:bg-gradient-to-r dark:from-[#0a1636]/95 dark:via-[#070e24]/98 dark:to-[#04091a]">
            {/* Top light beam */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />
            <div className="pointer-events-none absolute -top-20 -left-20 hidden h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.25)_0%,transparent_70%)] md:block" />
            <div className="pointer-events-none absolute -right-20 -bottom-20 hidden h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.2)_0%,transparent_70%)] md:block" />

            <div className="relative z-10 max-w-2xl space-y-2 text-left">
              <div className="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-cyan-400 uppercase">
                <BookOpen className="h-4 w-4" />
                <span>Davlat ta&apos;lim standarti (MOVSO RUz)</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 sm:text-2xl dark:text-white">
                Barcha ilmiy ishlar OTM va GOST talablariga mos tuziladi
              </h3>
              <p className="text-xs leading-relaxed text-slate-600 sm:text-sm dark:text-slate-300">
                Har bir yaratilgan kurs ishi, diplom (BMI) va referat standart akademik hoshiyalarga
                (chapdan 30mm, yuqori/pastdan 20mm, o&apos;ngdan 15mm), Times New Roman 14pt,
                avtomatik mundarijaga va rasmiy adabiyotlar bazasiga ega bo&apos;ladi.
              </p>
            </div>
            <div className="relative z-10 flex w-full shrink-0 flex-wrap items-center gap-3 sm:w-auto">
              <Link
                href="/academic/coursework"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-sky-500/25 transition-all hover:scale-105 active:scale-95 sm:w-auto sm:text-sm"
              >
                <span>Kurs ishi yaratish</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/academic/diplom-bmi"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-6 py-3 text-xs font-semibold text-amber-400 transition-colors hover:bg-amber-500/20 sm:w-auto sm:text-sm"
              >
                <span>Diplom (BMI)</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
