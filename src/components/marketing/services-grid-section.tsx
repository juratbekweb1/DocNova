"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutTemplate,
  Brain,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Download,
  Eye,
  LayoutGrid,
  History,
  GraduationCap,
  ArrowRight,
  Zap,
  Award,
  FileText,
  Presentation,
  Sliders,
  Palette,
  FileDown,
  Layers,
  CheckSquare,
  Globe2,
  Wrench,
  ArrowUpRight,
  Files,
  Minimize2,
  FileCode2,
  Calculator,
  QrCode,
  KeyRound,
  BookOpen,
} from "lucide-react";

export function ServicesGridSection() {
  const [activeTab, setActiveTab] = useState<"services" | "students">("students");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const checkHash = () => {
        if (window.location.hash === "#students") {
          setActiveTab("students");
        } else if (window.location.hash === "#services") {
          setActiveTab("services");
        }
      };
      checkHash();
      window.addEventListener("hashchange", checkHash);
      return () => window.removeEventListener("hashchange", checkHash);
    }
  }, []);

  // 9 ta alohida 3D rang-barang mavzuga ega bo'limlar
  const nineServices = [
    {
      title: "AI Rezyume (CV) Yaratuvchi",
      description:
        "20+ zamonaviy shablonlar, qulay tahrirlagich va bir bosishda PDF yoki Word formatida yuklab olish imkoniyati.",
      icon: LayoutTemplate,
      badge: "Rezyume Shablonlar",
      stat: "20+",
      statLabel: "Dizaynlar",
      href: "/cv-builder",
      theme: {
        borderHover: "dark:group-hover:border-cyan-400/70 group-hover:border-cyan-400",
        glowPrimary: "from-cyan-500/35 via-blue-600/15 to-transparent",
        glowSecondary: "from-sky-500/25 via-indigo-600/10 to-transparent",
        topBeam: "via-cyan-400",
        overlayGrad:
          "dark:from-cyan-950/30 dark:via-transparent dark:to-blue-950/20 from-cyan-50/60 to-transparent",
        cardGlow: "hover:shadow-[0_15px_35px_rgba(6,182,212,0.2),0_0_15px_rgba(6,182,212,0.1)]",
        iconBox:
          "bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 text-white shadow-[0_10px_25px_rgba(6,182,212,0.45)] border-cyan-300/40",
        statGrad: "from-cyan-400 via-sky-300 to-blue-400",
        badgeStyle: "bg-cyan-500/15 text-cyan-300 border-cyan-500/35",
        btnGrad: "from-cyan-500 to-blue-600 shadow-[0_0_20px_rgba(6,182,212,0.5)]",
        titleHover: "group-hover:text-cyan-300",
      },
    },
    {
      title: "AI Karyera & Suhbat Maslahatchisi",
      description:
        "24/7 ishlaydigan aqlli yordamchi. Rezyumeni kuchaytirish, ish topish va suhbatlardan muvaffaqiyatli o'tish bo'yicha maslahatlar.",
      icon: Brain,
      badge: "AI Maslahatchi",
      stat: "24/7",
      statLabel: "Onlayn Yordam",
      href: "/chat",
      theme: {
        borderHover: "dark:group-hover:border-fuchsia-400/70 group-hover:border-purple-400",
        glowPrimary: "from-fuchsia-500/35 via-purple-600/15 to-transparent",
        glowSecondary: "from-purple-500/25 via-pink-600/10 to-transparent",
        topBeam: "via-fuchsia-400",
        overlayGrad:
          "dark:from-fuchsia-950/30 dark:via-transparent dark:to-purple-950/20 from-purple-50/60 to-transparent",
        cardGlow: "hover:shadow-[0_15px_35px_rgba(192,38,211,0.2),0_0_15px_rgba(168,85,247,0.1)]",
        iconBox:
          "bg-gradient-to-br from-purple-400 via-fuchsia-500 to-indigo-600 text-white shadow-[0_10px_25px_rgba(168,85,247,0.45)] border-purple-300/40",
        statGrad: "from-purple-400 via-fuchsia-300 to-pink-400",
        badgeStyle: "bg-purple-500/15 text-purple-300 border-purple-500/35",
        btnGrad:
          "from-purple-500 via-fuchsia-500 to-pink-600 shadow-[0_0_20px_rgba(192,38,211,0.5)]",
        titleHover: "group-hover:text-fuchsia-300",
      },
    },
    {
      title: "Xorijiy Tillar & Mock Test",
      description:
        "Ingliz, Rus va Turk tillarini o'rganish, IELTS/CEFR darajasini aniqlash va ish suhbatlariga AI bilan jonli tayyorgarlik.",
      icon: ShieldCheck,
      badge: "Til & Intervyu",
      stat: "AI",
      statLabel: "Test & Tahlil",
      href: "/mock-test",
      theme: {
        borderHover: "dark:group-hover:border-emerald-400/70 group-hover:border-emerald-400",
        glowPrimary: "from-emerald-500/35 via-teal-600/15 to-transparent",
        glowSecondary: "from-green-500/25 via-emerald-700/10 to-transparent",
        topBeam: "via-emerald-400",
        overlayGrad:
          "dark:from-emerald-950/30 dark:via-transparent dark:to-teal-950/20 from-emerald-50/60 to-transparent",
        cardGlow: "hover:shadow-[0_15px_35px_rgba(16,185,129,0.2),0_0_15px_rgba(16,185,129,0.1)]",
        iconBox:
          "bg-gradient-to-br from-emerald-400 via-teal-500 to-green-600 text-white shadow-[0_10px_25px_rgba(16,185,129,0.45)] border-emerald-300/40",
        statGrad: "from-emerald-400 via-teal-300 to-green-400",
        badgeStyle: "bg-emerald-500/15 text-emerald-300 border-emerald-500/35",
        btnGrad: "from-emerald-500 to-teal-600 shadow-[0_0_20px_rgba(16,185,129,0.5)]",
        titleHover: "group-hover:text-emerald-300",
      },
    },
    {
      title: "AI Yozuvchi va Tahrirchi",
      description:
        "Rezyume, motivatsion xatlar va ilmiy ishlaringiz uchun xatolarsiz, jozibador va ta'sirli professional matnlar generatsiyasi.",
      icon: Sparkles,
      badge: "AI Yordamchi",
      stat: "3x",
      statLabel: "Tezroq Yozish",
      href: "/features/ai-writing",
      theme: {
        borderHover: "dark:group-hover:border-amber-400/70 group-hover:border-amber-400",
        glowPrimary: "from-amber-500/35 via-orange-600/15 to-transparent",
        glowSecondary: "from-yellow-500/25 via-amber-700/10 to-transparent",
        topBeam: "via-amber-400",
        overlayGrad:
          "dark:from-amber-950/30 dark:via-transparent dark:to-orange-950/20 from-amber-50/60 to-transparent",
        cardGlow: "hover:shadow-[0_15px_35px_rgba(245,158,11,0.2),0_0_15px_rgba(245,158,11,0.1)]",
        iconBox:
          "bg-gradient-to-br from-amber-400 via-orange-500 to-yellow-600 text-white shadow-[0_10px_25px_rgba(245,158,11,0.45)] border-amber-300/40",
        statGrad: "from-amber-400 via-orange-300 to-yellow-400",
        badgeStyle: "bg-amber-500/15 text-amber-300 border-amber-500/35",
        btnGrad: "from-amber-500 to-orange-600 shadow-[0_0_20px_rgba(245,158,11,0.5)]",
        titleHover: "group-hover:text-amber-300",
      },
    },
    {
      title: "ATS Tizimlariga Moslashtirish",
      description:
        "Kompaniyalar va xalqaro korporatsiyalarning HR filteridan 98% muvaffaqiyat bilan o'tuvchi xalqaro formatlash.",
      icon: CheckCircle2,
      badge: "HR Standart",
      stat: "98%",
      statLabel: "O'tish ko'rsatkichi",
      href: "/features/ats-formatting",
      theme: {
        borderHover: "dark:group-hover:border-sky-400/70 group-hover:border-blue-400",
        glowPrimary: "from-blue-500/35 via-indigo-600/15 to-transparent",
        glowSecondary: "from-sky-500/25 via-blue-700/10 to-transparent",
        topBeam: "via-sky-400",
        overlayGrad:
          "dark:from-blue-950/30 dark:via-transparent dark:to-indigo-950/20 from-blue-50/60 to-transparent",
        cardGlow: "hover:shadow-[0_15px_35px_rgba(59,130,246,0.2),0_0_15px_rgba(59,130,246,0.1)]",
        iconBox:
          "bg-gradient-to-br from-blue-400 via-indigo-500 to-blue-700 text-white shadow-[0_10px_25px_rgba(59,130,246,0.45)] border-blue-300/40",
        statGrad: "from-blue-400 via-sky-300 to-indigo-300",
        badgeStyle: "bg-blue-500/15 text-blue-300 border-blue-500/35",
        btnGrad: "from-blue-600 to-indigo-600 shadow-[0_0_20px_rgba(59,130,246,0.5)]",
        titleHover: "group-hover:text-sky-300",
      },
    },
    {
      title: "Bir Bosishda Eksport Qilish",
      description:
        "Hujjatlaringizni yuqori sifatli PDF yoki tahrirlanadigan Word (.docx) formatlarida bir necha soniyada yuklab oling.",
      icon: Download,
      badge: "PDF va Word",
      stat: "2s",
      statLabel: "Tezkor Yuklash",
      href: "/features/exports",
      theme: {
        borderHover: "dark:group-hover:border-teal-400/70 group-hover:border-teal-400",
        glowPrimary: "from-teal-500/35 via-cyan-600/15 to-transparent",
        glowSecondary: "from-emerald-500/25 via-teal-700/10 to-transparent",
        topBeam: "via-teal-400",
        overlayGrad:
          "dark:from-teal-950/30 dark:via-transparent dark:to-cyan-950/20 from-teal-50/60 to-transparent",
        cardGlow: "hover:shadow-[0_15px_35px_rgba(20,184,166,0.2),0_0_15px_rgba(20,184,166,0.1)]",
        iconBox:
          "bg-gradient-to-br from-teal-400 via-emerald-500 to-cyan-600 text-white shadow-[0_10px_25px_rgba(20,184,166,0.45)] border-teal-300/40",
        statGrad: "from-teal-400 via-cyan-300 to-emerald-400",
        badgeStyle: "bg-teal-500/15 text-teal-300 border-teal-500/35",
        btnGrad: "from-teal-500 to-cyan-600 shadow-[0_0_20px_rgba(20,184,166,0.5)]",
        titleHover: "group-hover:text-teal-300",
      },
    },
    {
      title: "Jonli Natijani Ko'rish",
      description:
        "Har bir kiritilgan so'z va o'zgarishni real vaqt rejimida tayyor hujjat ko'rinishida kechikishsiz kuzatib boring.",
      icon: Eye,
      badge: "Real-Vaqt",
      stat: "0ms",
      statLabel: "Kechikishsiz",
      href: "/features/preview",
      theme: {
        borderHover: "dark:group-hover:border-rose-400/70 group-hover:border-rose-400",
        glowPrimary: "from-rose-500/35 via-pink-600/15 to-transparent",
        glowSecondary: "from-red-500/25 via-rose-700/10 to-transparent",
        topBeam: "via-rose-400",
        overlayGrad:
          "dark:from-rose-950/30 dark:via-transparent dark:to-red-950/20 from-rose-50/60 to-transparent",
        cardGlow: "hover:shadow-[0_15px_35px_rgba(244,63,94,0.2),0_0_15px_rgba(244,63,94,0.1)]",
        iconBox:
          "bg-gradient-to-br from-rose-400 via-pink-500 to-red-600 text-white shadow-[0_10px_25px_rgba(244,63,94,0.45)] border-rose-300/40",
        statGrad: "from-rose-400 via-pink-300 to-red-400",
        badgeStyle: "bg-rose-500/15 text-rose-300 border-rose-500/35",
        btnGrad: "from-rose-500 to-pink-600 shadow-[0_0_20px_rgba(244,63,94,0.5)]",
        titleHover: "group-hover:text-rose-300",
      },
    },
    {
      title: "20+ Professional Shablonlar",
      description:
        "Dasturchilar, menejerlar, talabalar va barcha sohalar uchun xalqaro darajadagi eksklyuziv andozalar to'plami.",
      icon: LayoutGrid,
      badge: "20+ Shablon",
      stat: "20+",
      statLabel: "Tayyor Dizayn",
      href: "/features/templates",
      theme: {
        borderHover: "dark:group-hover:border-fuchsia-400/70 group-hover:border-fuchsia-400",
        glowPrimary: "from-fuchsia-500/35 via-pink-600/15 to-transparent",
        glowSecondary: "from-purple-500/25 via-pink-700/10 to-transparent",
        topBeam: "via-fuchsia-400",
        overlayGrad:
          "dark:from-fuchsia-950/30 dark:via-transparent dark:to-pink-950/20 from-fuchsia-50/60 to-transparent",
        cardGlow: "hover:shadow-[0_15px_35px_rgba(217,70,239,0.2),0_0_15px_rgba(217,70,239,0.1)]",
        iconBox:
          "bg-gradient-to-br from-fuchsia-400 via-purple-500 to-pink-600 text-white shadow-[0_10px_25px_rgba(217,70,239,0.45)] border-fuchsia-300/40",
        statGrad: "from-fuchsia-400 via-purple-300 to-pink-400",
        badgeStyle: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/35",
        btnGrad: "from-fuchsia-500 to-purple-600 shadow-[0_0_20px_rgba(217,70,239,0.5)]",
        titleHover: "group-hover:text-fuchsia-300",
      },
    },
    {
      title: "Versiyalar Tarixi va Xavfsizlik",
      description:
        "Barcha yaratilgan hujjatlar xavfsiz bulutda avtomatik saqlanadi, istalgan oldingi tahrirni osongina qayta tiklash mumkin.",
      icon: History,
      badge: "Avto Saqlash",
      stat: "∞",
      statLabel: "Cheksiz Tarix",
      href: "/features/versions",
      theme: {
        borderHover: "dark:group-hover:border-indigo-400/70 group-hover:border-indigo-400",
        glowPrimary: "from-indigo-500/35 via-blue-600/15 to-transparent",
        glowSecondary: "from-sky-500/25 via-indigo-700/10 to-transparent",
        topBeam: "via-indigo-400",
        overlayGrad:
          "dark:from-indigo-950/30 dark:via-transparent dark:to-blue-950/20 from-indigo-50/60 to-transparent",
        cardGlow: "hover:shadow-[0_15px_35px_rgba(99,102,241,0.2),0_0_15px_rgba(99,102,241,0.1)]",
        iconBox:
          "bg-gradient-to-br from-indigo-400 via-blue-500 to-sky-600 text-white shadow-[0_10px_25px_rgba(99,102,241,0.45)] border-indigo-300/40",
        statGrad: "from-indigo-400 via-blue-300 to-sky-400",
        badgeStyle: "bg-indigo-500/15 text-indigo-300 border-indigo-500/35",
        btnGrad: "from-indigo-500 to-sky-600 shadow-[0_0_20px_rgba(99,102,241,0.5)]",
        titleHover: "group-hover:text-indigo-300",
      },
    },
  ];

  // 1-Rasmga 100% mos 4 ta akademik modul: 3 ta yuqori karta + 1 ta keng pastki karta
  const topStudentModules = [
    {
      id: "coursework",
      title: "Kurs ishi yordamchisi",
      subtitle: "15-30 betlik to'liq akademik kurs ishlari",
      description:
        "Titul varag'i, avtomatik mundarija, kirish, 3 ta asosiy bob, xulosa va OTM talablariga mos adabiyotlar ro'yxati.",
      href: "/academic/coursework",
      icon: GraduationCap,
      badge: "Eng ommabop",
      badgeStyle: "bg-blue-500/15 text-blue-400 border-blue-500/30",
      stats: "15, 19, 25, 30 bet • A4 PDF & Word",
      cta: "Kurs ishini boshlash",
      theme: {
        borderHover: "dark:group-hover:border-blue-400/70 group-hover:border-blue-400",
        glowPrimary: "from-blue-500/35 via-cyan-600/15 to-transparent",
        glowSecondary: "from-sky-500/25 via-blue-700/10 to-transparent",
        topBeam: "via-blue-400",
        overlayGrad:
          "dark:from-blue-950/30 dark:via-transparent dark:to-cyan-950/20 from-blue-50/60 to-transparent",
        cardGlow: "hover:shadow-[0_15px_35px_rgba(59,130,246,0.25),0_0_15px_rgba(59,130,246,0.1)]",
        iconBox:
          "border-blue-500/40 bg-gradient-to-br from-blue-500/20 to-sky-500/10 text-blue-400 shadow-[0_0_25px_rgba(59,130,246,0.35)]",
        titleHover: "group-hover:text-blue-300",
        btnStyle:
          "bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white shadow-md shadow-blue-500/25 border border-blue-400/30",
        subColor: "text-sky-400",
      },
    },
    {
      id: "diplom-bmi",
      title: "Diplom ishi va BMI",
      subtitle: "Bakalavr BMI va Magistrlik dissertatsiyalari",
      description:
        "Ilmiy muammoning dolzarbligi, obyekti, predmeti, metodologiyasi, amaliy tahlillar hamda 3 boblik to'liq ilmiy apparat.",
      href: "/academic/diplom-bmi",
      icon: Award,
      badge: "Ilmiy daraja",
      badgeStyle: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      stats: "40-80 bet • Ilmiy yangilik & Reja",
      cta: "BMI tuzishni boshlash",
      theme: {
        borderHover: "dark:group-hover:border-amber-400/70 group-hover:border-amber-400",
        glowPrimary: "from-amber-500/35 via-orange-600/15 to-transparent",
        glowSecondary: "from-yellow-500/25 via-amber-700/10 to-transparent",
        topBeam: "via-amber-400",
        overlayGrad:
          "dark:from-amber-950/30 dark:via-transparent dark:to-orange-950/20 from-amber-50/60 to-transparent",
        cardGlow: "hover:shadow-[0_15px_35px_rgba(245,158,11,0.25),0_0_15px_rgba(245,158,11,0.1)]",
        iconBox:
          "border-amber-500/40 bg-gradient-to-br from-amber-500/20 to-orange-500/10 text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.35)]",
        titleHover: "group-hover:text-amber-300",
        btnStyle:
          "bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white shadow-md shadow-amber-500/25 border border-amber-400/30",
        subColor: "text-amber-400/90",
      },
    },
    {
      id: "referat",
      title: "Mustaqil ish va Referat",
      subtitle: "Tezkor referatlar va mustaqil ta'lim hisobotlari",
      description:
        "Universitet fani bo'yicha mustaqil topshiriqlar, esse, referat va ilmiy tezislar. 2 daqiqada tayyorlanadi.",
      href: "/academic/referat",
      icon: FileText,
      badge: "Tezkor (2 min)",
      badgeStyle: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      stats: "3-15 bet • Word (.doc) eksport",
      cta: "Referat tayyorlash",
      theme: {
        borderHover: "dark:group-hover:border-emerald-400/70 group-hover:border-emerald-400",
        glowPrimary: "from-emerald-500/35 via-teal-600/15 to-transparent",
        glowSecondary: "from-green-500/25 via-emerald-700/10 to-transparent",
        topBeam: "via-emerald-400",
        overlayGrad:
          "dark:from-emerald-950/30 dark:via-transparent dark:to-teal-950/20 from-emerald-50/60 to-transparent",
        cardGlow: "hover:shadow-[0_15px_35px_rgba(16,185,129,0.25),0_0_15px_rgba(16,185,129,0.1)]",
        iconBox:
          "border-emerald-500/40 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.35)]",
        titleHover: "group-hover:text-emerald-300",
        btnStyle:
          "bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-md shadow-emerald-500/25 border border-emerald-400/30",
        subColor: "text-emerald-400/90",
      },
    },
    {
      id: "amaliy-ish",
      title: "Amaliy ish va Masalalar yechimi",
      subtitle: "Variantli masalalar, ANOVA jadvallar, grafik va Excel",
      description:
        "Iqtisodiyot, statistika, ekonometrika va aniq fanlardan variantli amaliy ishlar: a), b), c), d), e) bosqichli yechim, hisob-kitob jadvallari, ustunli diagramma va Excel (EN/RU) formulalari.",
      href: "/academic/amaliy-ish",
      icon: Calculator,
      badge: "Hisob-kitob & Jadvallar",
      badgeStyle: "bg-indigo-500/15 text-indigo-300 border-indigo-500/35",
      stats: "1-4 masala • Jadval, Grafik & Excel • Word/PDF",
      cta: "Amaliy ish tayyorlash",
      theme: {
        borderHover: "dark:group-hover:border-indigo-400/70 group-hover:border-indigo-400",
        glowPrimary: "from-indigo-500/35 via-blue-600/15 to-transparent",
        glowSecondary: "from-sky-500/25 via-indigo-700/10 to-transparent",
        topBeam: "via-indigo-400",
        overlayGrad:
          "dark:from-indigo-950/30 dark:via-transparent dark:to-blue-950/20 from-indigo-50/60 to-transparent",
        cardGlow: "hover:shadow-[0_15px_35px_rgba(99,102,241,0.25),0_0_15px_rgba(99,102,241,0.1)]",
        iconBox:
          "border-indigo-500/40 bg-gradient-to-br from-indigo-500/20 to-blue-500/10 text-indigo-400 shadow-[0_0_25px_rgba(99,102,241,0.35)]",
        titleHover: "group-hover:text-indigo-300",
        btnStyle:
          "bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400 text-white shadow-md shadow-indigo-500/25 border border-indigo-400/30",
        subColor: "text-indigo-400/90",
      },
    },
  ];

  const widePresentationModule = {
    id: "presentation",
    title: "Prezentatsiya va Slaydlar",
    subtitle: "PowerPoint (.pptx) va Ma'ruzachi nutqi (Speaker Notes)",
    description:
      "Kurs ishi, diplom (BMI) yoki referat himoyasi uchun professional taqdimot slaydlari. Har bir slayd uchun asosiy tezislar va komissiya oldida so'zlash uchun ma'ruzachi nutqi avtomatik shakllantiriladi.",
    href: "/academic/presentation",
    icon: Presentation,
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
    stats: "8-100 slayd • PowerPoint (.pptx) & Speaker Notes • 1-bosishda eksport",
    cta: "Slaydlar yaratish",
    theme: {
      borderHover: "dark:group-hover:border-orange-400/70 group-hover:border-orange-400",
      glowPrimary: "from-orange-500/35 via-amber-600/15 to-transparent",
      glowSecondary: "from-amber-500/25 via-red-600/10 to-transparent",
      topBeam: "via-orange-400",
      overlayGrad:
        "dark:from-orange-950/25 dark:via-transparent dark:to-amber-950/15 from-orange-50/50 to-transparent",
      cardGlow: "hover:shadow-[0_15px_35px_rgba(249,115,22,0.25),0_0_15px_rgba(249,115,22,0.1)]",
      iconBox:
        "border-orange-500/40 bg-gradient-to-br from-orange-500/20 to-amber-500/10 text-orange-400 shadow-[0_0_25px_rgba(249,115,22,0.35)]",
      btnGrad:
        "from-orange-500 via-amber-500 to-orange-600 shadow-[0_0_20px_rgba(249,115,22,0.45)]",
    },
  };

  // Test va Mock-Test modullari (Talabalar bo'limi 2-qator)
  const examModule = {
    id: "exam-prep",
    title: "Test va Imtihonlarga tayyorgarlik",
    subtitle: "Bilet savollari yechimlari va interaktiv testlar",
    description:
      "Fanlar bo'yicha imtihon biletlari, 10 talik variantli testlar (MCQ) va tushuntirishli yechimlar orqali sessiyaga 100% tayyorlaning.",
    href: "/academic/exam-prep",
    icon: CheckSquare,
    badge: "Interaktiv",
    badgeStyle: "bg-purple-500/15 text-purple-300 border-purple-500/35",
    stats: "Biletlar • Testlar • Shpargalkalar",
    cta: "Imtihonga tayyorlanish",
    theme: {
      borderHover: "dark:group-hover:border-purple-400/70 group-hover:border-purple-400",
      glowPrimary: "from-purple-500/35 via-fuchsia-600/15 to-transparent",
      glowSecondary: "from-indigo-500/25 via-purple-700/10 to-transparent",
      topBeam: "via-purple-400",
      overlayGrad:
        "dark:from-purple-950/30 dark:via-transparent dark:to-fuchsia-950/20 from-purple-50/60 to-transparent",
      cardGlow: "hover:shadow-[0_15px_35px_rgba(168,85,247,0.25),0_0_15px_rgba(168,85,247,0.1)]",
      iconBox:
        "border-purple-500/40 bg-gradient-to-br from-purple-500/20 to-fuchsia-500/10 text-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.35)]",
      titleHover: "group-hover:text-purple-300",
      btnStyle:
        "bg-gradient-to-r from-purple-600 to-fuchsia-500 hover:from-purple-500 hover:to-fuchsia-400 text-white shadow-md shadow-purple-500/25 border border-purple-400/30",
      subColor: "text-purple-400/90",
    },
  };

  const mockTestModule = {
    id: "mock-test",
    title: "Mock Test (Chet tillari)",
    subtitle: "IELTS, TRKI va TÖMER xalqaro simulyatori",
    description:
      "3 ta tildan birini tanlang: Ingliz, Rus va Turk tillari bo'yicha test topshiring va AI orqali darajangiz (Band / CEFR) hisobotini oling.",
    href: "/academic/mock-test",
    icon: Globe2,
    badge: "3 ta til • AI Baholash",
    badgeStyle: "bg-cyan-500/15 text-cyan-300 border-cyan-500/35",
    stats: "Ingliz • Rus • Turk tillari",
    cta: "Tillarni tanlash",
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
      borderHover: "dark:group-hover:border-cyan-400/70 group-hover:border-cyan-400",
      glowPrimary: "from-cyan-500/35 via-blue-600/15 to-transparent",
      glowSecondary: "from-sky-500/25 via-indigo-700/10 to-transparent",
      topBeam: "via-cyan-400",
      overlayGrad:
        "dark:from-cyan-950/30 dark:via-transparent dark:to-blue-950/20 from-cyan-50/60 to-transparent",
      cardGlow: "hover:shadow-[0_15px_35px_rgba(6,182,212,0.25),0_0_15px_rgba(6,182,212,0.1)]",
      iconBox:
        "border-cyan-500/40 bg-gradient-to-br from-cyan-500/20 to-sky-500/10 text-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.35)]",
      titleHover: "group-hover:text-cyan-300",
      btnStyle:
        "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-500/25 border border-cyan-400/30",
      subColor: "text-cyan-400/90",
    },
  };

  const studentUtilityTools = [
    {
      id: "merge-pdf",
      title: "PDF Birlashtirish",
      description: "Bir nechta PDF hujjatlarni bitta tartibli faylga tezkor birlashtirish.",
      href: "/tools/merge-pdf",
      icon: Files,
      badge: "Fayllar",
      theme: {
        iconBox: "border-blue-500/30 bg-blue-500/10 text-blue-400",
        borderHover: "hover:border-blue-400/60",
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
        iconBox: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
        borderHover: "hover:border-emerald-400/60",
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
        iconBox: "border-sky-500/30 bg-sky-500/10 text-sky-400",
        borderHover: "hover:border-sky-400/60",
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
        iconBox: "border-purple-500/30 bg-purple-500/10 text-purple-400",
        borderHover: "hover:border-purple-400/60",
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
        iconBox: "border-amber-500/30 bg-amber-500/10 text-amber-400",
        borderHover: "hover:border-amber-400/60",
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
        iconBox: "border-rose-500/30 bg-rose-500/10 text-rose-400",
        borderHover: "hover:border-rose-400/60",
      },
    },
  ];

  return (
    <section className="relative mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      {/* SECTION HEADER & TOGGLE SWITCHER */}
      <div className="flex flex-col items-center text-center">
        {/* Top Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-50 px-4 py-1.5 text-xs font-semibold text-sky-700 shadow-sm backdrop-blur-md dark:border-sky-500/35 dark:bg-sky-950/50 dark:text-sky-300">
          <Zap className="h-3.5 w-3.5 text-cyan-400" />
          <span>Platforma Imkoniyatlari</span>
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
        </div>

        {/* Section Heading */}
        <h2 className="mt-4 text-3xl leading-tight font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl dark:text-white">
          Hujjatlar va Ta’lim Uchun{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
            Barcha Bo‘limlar
          </span>
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">
          Rezyume, akademik ishlar, ilmiy tadqiqotlar va sun’iy intellekt xizmatlarining to‘liq
          majmuasi.
        </p>

        {/* INTERACTIVE TAB SWITCHER (Talabalar bo'limi / Asosiy xizmatlar) */}
        <div className="mt-8 inline-flex items-center rounded-full border border-slate-200 bg-slate-100 p-1.5 shadow-md dark:border-slate-800 dark:bg-[#070e24]">
          <button
            type="button"
            onClick={() => setActiveTab("students")}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold transition-all duration-300 sm:text-sm ${
              activeTab === "students"
                ? "scale-[1.02] bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-[0_0_20px_rgba(14,165,233,0.5)]"
                : "text-slate-700 hover:text-cyan-500 dark:text-slate-300 dark:hover:text-white"
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            <span>Talabalar uchun (5 ta bo‘lim)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("services")}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold transition-all duration-300 sm:text-sm ${
              activeTab === "services"
                ? "scale-[1.02] bg-gradient-to-r from-sky-500 via-purple-500 to-pink-600 text-white shadow-[0_0_25px_rgba(168,85,247,0.5)]"
                : "text-slate-700 hover:text-cyan-500 dark:text-slate-300 dark:hover:text-white"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Asosiy xizmatlar (9 ta bo‘lim)</span>
          </button>
        </div>
      </div>

      {/* CONTENT AREA: 9 TA BO'LIM YOKI 5 TA TALABALAR BO'LIMI */}
      <div className="mt-12">
        <AnimatePresence mode="wait">
          {activeTab === "services" ? (
            /* =========================================================================
               TAB 1: 9 TA ASOSIY BO'LIM (3D Rang-barang Neon Animatsiyali Dizayn)
               ========================================================================= */
            <motion.div
              key="services-grid"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {nineServices.map((service, idx) => {
                const Icon = service.icon;
                return (
                  <motion.div
                    key={service.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.03 }}
                    className="group relative flex"
                  >
                    <Link
                      href={service.href}
                      className={`relative flex h-full w-full flex-col justify-between overflow-hidden rounded-[26px] border border-slate-200/90 dark:border-slate-800/80 ${service.theme.borderHover} bg-white p-6 shadow-sm transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1.5 dark:bg-gradient-to-b dark:from-[#0a142f]/90 dark:via-[#060c1e]/95 dark:to-[#020612]/98 dark:shadow-[0_15px_35px_rgba(0,0,0,0.5)] ${service.theme.cardGlow}`}
                    >
                      {/* Ambient 3D Neon Orbs & Top Light Beam (Smooth Lighting) */}
                      <div
                        className={`pointer-events-none absolute -top-16 -right-16 h-52 w-52 rounded-full bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] ${service.theme.glowPrimary} opacity-35 transition-opacity duration-300 group-hover:opacity-85`}
                      />
                      <div
                        className={`pointer-events-none absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] ${service.theme.glowSecondary} opacity-20 transition-opacity duration-300 group-hover:opacity-75`}
                      />
                      <div
                        className={`pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent ${service.theme.topBeam} to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                      />
                      <div
                        className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${service.theme.overlayGrad} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                      />

                      {/* Card Content */}
                      <div className="relative z-10 flex h-full flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            {/* 3D Animated Glowing Icon Container */}
                            <div
                              className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${service.theme.iconBox} transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3`}
                            >
                              <Icon className="h-7 w-7 transition-transform duration-300 group-hover:scale-105" />
                            </div>

                            {/* Individual Badge */}
                            <span
                              className={`rounded-full border px-3 py-1 text-[11px] font-bold shadow-sm ${service.theme.badgeStyle}`}
                            >
                              {service.badge}
                            </span>
                          </div>

                          {/* Stat row with individual gradient */}
                          <div className="mt-5 flex items-baseline gap-2">
                            <span
                              className={`bg-gradient-to-r text-3xl font-extrabold tracking-tight ${service.theme.statGrad} bg-clip-text text-transparent`}
                            >
                              {service.stat}
                            </span>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                              {service.statLabel}
                            </span>
                          </div>

                          {/* Title with individual hover color */}
                          <h3
                            className={`mt-3 text-lg font-bold text-slate-900 transition-colors dark:text-white ${service.theme.titleHover}`}
                          >
                            {service.title}
                          </h3>

                          {/* Description */}
                          <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm dark:text-slate-300">
                            {service.description}
                          </p>
                        </div>

                        {/* Card Bottom CTA Link */}
                        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800/80">
                          <span className="text-xs font-bold text-sky-500 group-hover:underline dark:text-cyan-400">
                            Batafsil / Foydalanish
                          </span>
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r ${service.theme.btnGrad} text-white shadow-md transition-all group-hover:translate-x-1 group-hover:scale-115`}
                          >
                            <ArrowRight className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            /* =========================================================================
               TAB 2: TALABALAR BO'LIMI (1-RASMGA 100% MOS MUKAMMAL DIZAYN)
               ========================================================================= */
            <motion.div
              key="students-grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-6 text-left"
            >
              {/* TOP HEADER: 1-rasmdagi "Talabalar uchun asosiy bo'limlar" */}
              <div className="flex items-center gap-2.5">
                <Layers className="h-5 w-5 text-sky-400" />
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
                    Talabalar uchun asosiy bo‘limlar
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-600 sm:text-sm dark:text-slate-400">
                    O‘zingizga kerakli bo‘limni tanlang va bir necha soniyada natijaga erishing
                  </p>
                </div>
              </div>

              {/* 4 TA YUQORI KARTA (Kurs ishi, Diplom ishi va BMI, Mustaqil ish va Referat, Amaliy ish) */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                {topStudentModules.map((module, idx) => {
                  const Icon = module.icon;
                  return (
                    <motion.div
                      key={module.id}
                      initial={{ opacity: 0, y: 25 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: idx * 0.08 }}
                      className="group relative flex"
                    >
                      <div
                        className={`relative flex h-full w-full flex-col justify-between overflow-hidden rounded-[24px] border border-slate-200/90 dark:border-slate-800/80 ${module.theme.borderHover} bg-white p-6 shadow-sm transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1.5 sm:p-7 dark:bg-gradient-to-b dark:from-[#0a142f]/90 dark:via-[#060c1e]/95 dark:to-[#020612]/98 dark:shadow-[0_15px_35px_rgba(0,0,0,0.5)] ${module.theme.cardGlow}`}
                      >
                        {/* Ambient 3D Neon Orbs & Top Light Beam (Smooth Lighting) */}
                        <div
                          className={`pointer-events-none absolute -top-16 -right-16 h-52 w-52 rounded-full bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] ${module.theme.glowPrimary} opacity-35 transition-opacity duration-300 group-hover:opacity-85`}
                        />
                        <div
                          className={`pointer-events-none absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] ${module.theme.glowSecondary} opacity-20 transition-opacity duration-300 group-hover:opacity-75`}
                        />
                        <div
                          className={`pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent ${module.theme.topBeam} to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                        />
                        <div
                          className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${module.theme.overlayGrad} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                        />

                        {/* Card Content */}
                        <div className="relative z-10 flex h-full flex-col justify-between">
                          <div>
                            {/* Card Header: Icon Box + Badge */}
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

                            {/* Title */}
                            <h3
                              className={`text-lg font-bold text-slate-900 transition-colors sm:text-xl dark:text-white ${module.theme.titleHover}`}
                            >
                              {module.title}
                            </h3>

                            {/* Subtitle */}
                            <p
                              className={`mt-0.5 mb-2.5 text-xs font-medium ${module.theme.subColor}`}
                            >
                              {module.subtitle}
                            </p>

                            {/* Description */}
                            <p className="text-xs leading-relaxed text-slate-600 sm:text-sm dark:text-slate-300">
                              {module.description}
                            </p>
                          </div>

                          {/* Card Bottom: Stats + Action Button */}
                          <div className="mt-6 flex flex-col items-start justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:flex-wrap sm:items-center dark:border-slate-800/80">
                            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                              {module.stats}
                            </span>
                            <Link
                              href={module.href}
                              className={`inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all hover:scale-105 active:scale-95 sm:w-auto ${module.theme.btnStyle}`}
                            >
                              <span>{module.cta}</span>
                              <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-1" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* PASTKI KENG KARTA (Prezentatsiya va Slaydlar) */}
              <motion.div
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.28 }}
                className="group relative flex"
              >
                <div
                  className={`relative flex h-full w-full flex-col justify-between overflow-hidden rounded-[24px] border border-slate-200/90 dark:border-slate-800/80 ${widePresentationModule.theme.borderHover} bg-white p-6 shadow-sm transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1.5 sm:p-8 dark:bg-gradient-to-b dark:from-[#0a142f]/90 dark:via-[#060c1e]/95 dark:to-[#020612]/98 dark:shadow-[0_15px_35px_rgba(0,0,0,0.5)] ${widePresentationModule.theme.cardGlow}`}
                >
                  {/* Ambient 3D Neon Orbs & Top Light Beam (Smooth Lighting) */}
                  <div
                    className={`pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] ${widePresentationModule.theme.glowPrimary} opacity-35 transition-opacity duration-300 group-hover:opacity-85`}
                  />
                  <div
                    className={`pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] ${widePresentationModule.theme.glowSecondary} opacity-20 transition-opacity duration-300 group-hover:opacity-70`}
                  />
                  <div
                    className={`pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent ${widePresentationModule.theme.topBeam} to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
                  />
                  <div
                    className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${widePresentationModule.theme.overlayGrad} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
                  />

                  {/* Card Content */}
                  <div className="relative z-10 flex h-full flex-col justify-between">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
                      {/* Left 7 cols: info */}
                      <div className="space-y-3 lg:col-span-7">
                        <div className="flex flex-wrap items-center gap-2">
                          <div
                            className={`flex h-12 w-12 items-center justify-center rounded-xl border ${widePresentationModule.theme.iconBox} shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3`}
                          >
                            <Presentation className="h-6 w-6 text-orange-400" />
                          </div>
                          {widePresentationModule.badges.map((b) => (
                            <span
                              key={b.text}
                              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${b.style}`}
                            >
                              {b.text}
                            </span>
                          ))}
                        </div>

                        <div>
                          <h3 className="text-xl font-bold text-slate-900 transition-colors group-hover:text-orange-400 sm:text-2xl dark:text-white">
                            {widePresentationModule.title}
                          </h3>
                          <p className="mt-0.5 text-xs font-semibold text-orange-400/90 sm:text-sm">
                            {widePresentationModule.subtitle}
                          </p>
                        </div>

                        <p className="max-w-2xl text-xs leading-relaxed text-slate-600 sm:text-sm dark:text-slate-300">
                          {widePresentationModule.description}
                        </p>
                      </div>

                      {/* Right 5 cols: visual feature highlights */}
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:col-span-5">
                        {widePresentationModule.features.map((feat) => {
                          const FeatIcon = feat.icon;
                          return (
                            <div
                              key={feat.title}
                              className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800/80 dark:bg-[#0a1226]/80"
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
                        <span>{widePresentationModule.stats}</span>
                      </span>
                      <Link
                        href={widePresentationModule.href}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:scale-[1.02] hover:from-orange-600 hover:to-amber-600 sm:w-auto"
                      >
                        <span>{widePresentationModule.cta}</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* =========================================================================
                  2-QATOR: TEST VA IMTIHONLAR (1 COL) + MOCK TEST CHET TILLARI (2 COLS)
                 ========================================================================= */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* 1. TEST VA IMTIHONLARGA TAYYORGARLIK */}
                <motion.div
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.32 }}
                  className="group relative col-span-1 flex"
                >
                  <div
                    className={`relative flex h-full w-full flex-col justify-between overflow-hidden rounded-[24px] border border-slate-200/90 dark:border-slate-800/80 ${examModule.theme.borderHover} bg-white p-6 shadow-sm transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1.5 sm:p-7 dark:bg-gradient-to-b dark:from-[#0a142f]/90 dark:via-[#060c1e]/95 dark:to-[#020612]/98 dark:shadow-[0_15px_35px_rgba(0,0,0,0.5)] ${examModule.theme.cardGlow}`}
                  >
                    {/* Ambient 3D Neon Orbs & Top Light Beam */}
                    <div
                      className={`pointer-events-none absolute -top-16 -right-16 h-52 w-52 rounded-full bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] ${examModule.theme.glowPrimary} opacity-35 transition-opacity duration-300 group-hover:opacity-85`}
                    />
                    <div
                      className={`pointer-events-none absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] ${examModule.theme.glowSecondary} opacity-20 transition-opacity duration-300 group-hover:opacity-75`}
                    />
                    <div
                      className={`pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent ${examModule.theme.topBeam} to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
                    />
                    <div
                      className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${examModule.theme.overlayGrad} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
                    />

                    {/* Card Content */}
                    <div className="relative z-10 flex h-full flex-col justify-between">
                      <div>
                        <div className="mb-4 flex items-center justify-between gap-2">
                          <div
                            className={`flex h-12 w-12 items-center justify-center rounded-xl border ${examModule.theme.iconBox} shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3`}
                          >
                            <CheckSquare className="h-6 w-6" />
                          </div>
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${examModule.badgeStyle}`}
                          >
                            {examModule.badge}
                          </span>
                        </div>

                        <h3
                          className={`text-lg font-bold text-slate-900 transition-colors sm:text-xl dark:text-white ${examModule.theme.titleHover}`}
                        >
                          {examModule.title}
                        </h3>

                        <p
                          className={`mt-0.5 mb-2.5 text-xs font-medium ${examModule.theme.subColor}`}
                        >
                          {examModule.subtitle}
                        </p>

                        <p className="text-xs leading-relaxed text-slate-600 sm:text-sm dark:text-slate-300">
                          {examModule.description}
                        </p>
                      </div>

                      <div className="mt-6 flex flex-col items-start justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:flex-wrap sm:items-center dark:border-slate-800/80">
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          {examModule.stats}
                        </span>
                        <Link
                          href={examModule.href}
                          className={`inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all hover:scale-105 active:scale-95 sm:w-auto ${examModule.theme.btnStyle}`}
                        >
                          <span>{examModule.cta}</span>
                          <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-1" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* 2. MOCK TEST (CHET TILLARI) - 2 COLS */}
                <motion.div
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.36 }}
                  className="group relative col-span-1 flex lg:col-span-2"
                >
                  <div
                    className={`relative flex h-full w-full flex-col justify-between overflow-hidden rounded-[24px] border border-slate-200/90 dark:border-slate-800/80 ${mockTestModule.theme.borderHover} bg-white p-6 shadow-sm transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1.5 sm:p-7 dark:bg-gradient-to-b dark:from-[#0a142f]/90 dark:via-[#060c1e]/95 dark:to-[#020612]/98 dark:shadow-[0_15px_35px_rgba(0,0,0,0.5)] ${mockTestModule.theme.cardGlow}`}
                  >
                    {/* Ambient 3D Neon Orbs & Top Light Beam */}
                    <div
                      className={`pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] ${mockTestModule.theme.glowPrimary} opacity-35 transition-opacity duration-300 group-hover:opacity-85`}
                    />
                    <div
                      className={`pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] ${mockTestModule.theme.glowSecondary} opacity-20 transition-opacity duration-300 group-hover:opacity-70`}
                    />
                    <div
                      className={`pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent ${mockTestModule.theme.topBeam} to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
                    />
                    <div
                      className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${mockTestModule.theme.overlayGrad} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
                    />

                    {/* Card Content */}
                    <div className="relative z-10 flex h-full flex-col justify-between">
                      <div>
                        <div className="mb-4 flex items-center justify-between gap-2">
                          <div
                            className={`flex h-12 w-12 items-center justify-center rounded-xl border ${mockTestModule.theme.iconBox} shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3`}
                          >
                            <Globe2 className="h-6 w-6" />
                          </div>
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${mockTestModule.badgeStyle}`}
                          >
                            {mockTestModule.badge}
                          </span>
                        </div>

                        <h3
                          className={`text-lg font-bold text-slate-900 transition-colors sm:text-xl dark:text-white ${mockTestModule.theme.titleHover}`}
                        >
                          {mockTestModule.title}
                        </h3>

                        <p
                          className={`mt-0.5 mb-2 text-xs font-medium ${mockTestModule.theme.subColor}`}
                        >
                          {mockTestModule.subtitle}
                        </p>

                        <p className="text-xs leading-relaxed text-slate-600 sm:text-sm dark:text-slate-300">
                          {mockTestModule.description}
                        </p>

                        {/* Languages 3-Grid Visual Preview (GB, RU, TR) */}
                        <div className="my-5 grid grid-cols-3 gap-3">
                          {mockTestModule.languages.map((lang) => (
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
                      </div>

                      <div className="mt-4 flex flex-col items-start justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:flex-wrap sm:items-center dark:border-slate-800/80">
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          {mockTestModule.stats}
                        </span>
                        <Link
                          href={mockTestModule.href}
                          className={`inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-2 text-xs font-semibold whitespace-nowrap transition-all hover:scale-105 active:scale-95 sm:w-auto ${mockTestModule.theme.btnStyle}`}
                        >
                          <span>{mockTestModule.cta}</span>
                          <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-1" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* =========================================================================
                  SUBTLE VISUAL DIVIDER: YORDAMCHI MIKRO-XIZMATLAR
                 ========================================================================= */}
              <div className="relative my-8 sm:my-10">
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

              {/* =========================================================================
                  YORDAMCHI MIKRO-XIZMATLAR (TEZKOR ASBOBLAR) BLOKI
                 ========================================================================= */}
              <div className="space-y-6">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                  <div>
                    <h3 className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
                      <span>🛠 Talabalar uchun tezkor asboblar</span>
                    </h3>
                    <p className="mt-1 text-xs text-slate-600 sm:text-sm dark:text-slate-400">
                      Kundalik o‘qish va hujjatlar bilan ishlash uchun qulay mikro-servislar
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

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {studentUtilityTools.map((tool) => {
                    const ToolIcon = tool.icon;
                    return (
                      <Link
                        key={tool.id}
                        href={tool.href}
                        className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800/80 ${tool.theme.borderHover} bg-white p-5 shadow-sm transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:shadow-md dark:bg-gradient-to-b dark:from-[#0a142f]/90 dark:via-[#060c1e]/95 dark:to-[#020612]/98`}
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
                          <h4 className="text-sm font-bold text-slate-900 transition-colors group-hover:text-cyan-400 sm:text-base dark:text-white">
                            {tool.title}
                          </h4>
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

              {/* =========================================================================
                  DAVLAT TA'LIM STANDARTI (MOVSO RUZ) AKADEMIK BANNER
                 ========================================================================= */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="relative flex flex-col items-center justify-between gap-6 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xl sm:p-8 md:flex-row dark:border-slate-800/90 dark:bg-gradient-to-r dark:from-[#0a1636]/95 dark:via-[#070e24]/98 dark:to-[#04091a]"
              >
                {/* Ambient Glow */}
                <div className="pointer-events-none absolute -top-20 -left-20 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.25)_0%,transparent_70%)]" />
                <div className="pointer-events-none absolute -right-20 -bottom-20 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.2)_0%,transparent_70%)]" />

                <div className="relative z-10 max-w-2xl space-y-2 text-left">
                  <div className="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-cyan-400 uppercase">
                    <BookOpen className="h-4 w-4" />
                    <span>Davlat ta&apos;lim standarti (MOVSO RUz)</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 sm:text-xl dark:text-white">
                    Barcha ilmiy ishlar OTM va GOST talablariga mos tuziladi
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-600 sm:text-sm dark:text-slate-300">
                    Har bir yaratilgan kurs ishi, diplom (BMI) va referat standart akademik
                    hoshiyalarga (chapdan 25mm, yuqori/o&apos;ng/pastdan 20mm), mundarijaga va 25–30
                    ta rasmiy manbalar bazasiga ega bo&apos;ladi.
                  </p>
                </div>
                <div className="relative z-10 flex w-full shrink-0 items-center gap-3 sm:w-auto">
                  <Link
                    href="/academic/coursework"
                    className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 transition-all hover:scale-105 sm:w-auto"
                  >
                    Kurs ishi yaratish
                  </Link>
                  <Link
                    href="/academic/diplom-bmi"
                    className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-amber-600/25 transition-all hover:scale-105 sm:w-auto"
                  >
                    Diplom (BMI) yaratish
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
