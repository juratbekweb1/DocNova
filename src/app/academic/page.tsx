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
} from "lucide-react";
import { StudentSubNav } from "@/components/academic/student-sub-nav";

export default function AcademicHubPage() {
  const studentModules = [
    {
      id: "coursework",
      title: "Kurs ishi yordamchisi",
      subtitle: "15-30 betlik to'liq akademik kurs ishlari",
      description:
        "Titul varag'i, avtomatik mundarija, kirish, 3 ta asosiy bob, xulosa va OTM talablariga mos adabiyotlar ro'yxati.",
      href: "/academic/coursework",
      icon: GraduationCap,
      badge: "Eng ommabop",
      badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      stats: "15, 19, 25, 30 bet • A4 PDF & Word",
      cta: "Kurs ishini boshlash",
      accent: "from-blue-600/20 to-sky-500/5 hover:border-blue-500/40",
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
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      stats: "40-80 bet • Ilmiy yangilik & Reja",
      cta: "BMI tuzishni boshlash",
      accent: "from-amber-600/20 to-orange-500/5 hover:border-amber-500/40",
    },
    {
      id: "presentation",
      title: "Prezentatsiya va Slaydlar",
      subtitle: "PowerPoint (.pptx) va Ma'ruzachi nutqi (Speaker Notes)",
      description:
        "Kurs ishi yoki diplom ishi himoyasi uchun professional slaydlar, har bir slayd uchun asosiy tezislar va komissiya oldida so'zlash uchun nutq matni.",
      href: "/academic/presentation",
      icon: Presentation,
      badge: "PPTX & AI",
      badgeColor: "bg-orange-500/10 text-orange-400 border-orange-500/20",
      stats: "8-20 slayd • PowerPoint (.pptx) & Speaker Notes",
      cta: "Slaydlar yaratish",
      accent: "from-orange-600/20 to-amber-500/5 hover:border-orange-500/40",
      featured: true,
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
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      stats: "3-15 bet • Word (.doc) eksport",
      cta: "Referat tayyorlash",
      accent: "from-emerald-600/20 to-teal-500/5 hover:border-emerald-500/40",
    },
    {
      id: "exam-prep",
      title: "Test va Imtihonlarga tayyorgarlik",
      subtitle: "Bilet savollari yechimlari va interaktiv testlar",
      description:
        "Fanlar bo'yicha imtihon biletlari, 10 talik variantli testlar (MCQ) va tushuntirishli yechimlar orqali sessiyaga 100% tayyorlaning.",
      href: "/academic/exam-prep",
      icon: CheckSquare,
      badge: "Interaktiv",
      badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      stats: "Biletlar • Testlar • Shpargalkalar",
      cta: "Imtihonga tayyorlanish",
      accent: "from-purple-600/20 to-pink-500/5 hover:border-purple-500/40",
    },
    {
      id: "mock-test",
      title: "Mock Test (Chet tillari)",
      subtitle: "IELTS, TRKI va TÖMER xalqaro simulyatori",
      description:
        "3 ta tildan birini tanlang: Ingliz, Rus va Turk tillari bo'yicha test topshiring va AI orqali darajangiz (Band / CEFR) hisobotini oling.",
      href: "/academic/mock-test",
      icon: Globe2,
      badge: "3 ta til • AI Baholash",
      badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
      stats: "Ingliz • Rus • Turk tillari",
      cta: "Tillarni tanlash",
      accent: "from-cyan-600/20 to-blue-500/5 hover:border-cyan-500/40",
      featured: true,
    },
  ];

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Sub-nav */}
      <StudentSubNav />

      {/* Hero Section */}
      <div className="border-border/60 bg-surface/30 relative overflow-hidden border-b py-12 md:py-16">
        <div className="from-primary/5 pointer-events-none absolute inset-0 bg-gradient-to-b via-transparent to-transparent" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-3xl flex-col items-center space-y-4 text-center">
            <div className="border-primary/30 bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              <span>DocNova Talabalar Portali 2026</span>
            </div>

            <h1 className="text-foreground text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              Talabalar va Ilmiy Izlanuvchilar{" "}
              <span className="from-primary via-accent bg-gradient-to-r to-sky-400 bg-clip-text text-transparent">
                Markazi
              </span>
            </h1>

            <p className="text-foreground-secondary max-w-2xl text-base leading-relaxed sm:text-lg">
              Kurs ishlari, diplom loyihalari (BMI), mustaqil ishlar, imtihon biletlari va chet
              tillari bo&apos;yicha xalqaro mock testlar — barchasi bitta qulay va intuitiv
              platformada.
            </p>

            {/* Quick Feature Badges */}
            <div className="text-foreground-muted flex flex-wrap items-center justify-center gap-4 pt-2 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>OTM standartlariga 100% mos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileCheck2 className="text-primary h-4 w-4" />
                <span>Word (.doc) va PDF format</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-amber-400" />
                <span>Tezkor 24/7 AI generatsiya</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main 5 Modules Grid */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-foreground flex items-center gap-2.5 text-xl font-bold tracking-tight sm:text-2xl">
              <Layers className="text-primary h-5 w-5" />
              Talabalar uchun 5 ta asosiy bo&apos;lim
            </h2>
            <p className="text-foreground-secondary mt-1 text-xs sm:text-sm">
              O&apos;zingizga kerakli bo&apos;limni tanlang va bir necha soniyada natijaga erishing
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {studentModules.map((module) => {
            const Icon = module.icon;
            return (
              <div
                key={module.id}
                className={`group border-border relative flex flex-col justify-between rounded-2xl border bg-gradient-to-b ${module.accent} p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  module.featured ? "border-primary/40 shadow-primary/5 lg:col-span-2" : ""
                }`}
              >
                <div>
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <div className="bg-surface border-border group-hover:border-primary/50 flex h-12 w-12 items-center justify-center rounded-xl border shadow-sm transition-all group-hover:scale-105">
                      <Icon className="text-primary h-6 w-6" />
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${module.badgeColor}`}
                    >
                      {module.badge}
                    </span>
                  </div>

                  <h3 className="text-foreground group-hover:text-primary text-lg font-bold transition-colors sm:text-xl">
                    {module.title}
                  </h3>
                  <p className="text-primary/80 mt-0.5 mb-2.5 text-xs font-medium">
                    {module.subtitle}
                  </p>
                  <p className="text-foreground-secondary text-xs leading-relaxed sm:text-sm">
                    {module.description}
                  </p>

                  {/* Mock test languages visual preview */}
                  {module.id === "mock-test" && (
                    <div className="my-4 grid grid-cols-3 gap-3">
                      <div className="border-border/80 bg-surface/80 rounded-xl border p-3 text-center">
                        <div className="mb-1 text-2xl">🇬🇧</div>
                        <div className="text-foreground text-xs font-bold">Ingliz tili</div>
                        <div className="text-foreground-muted text-[10px]">IELTS • CEFR</div>
                      </div>
                      <div className="border-border/80 bg-surface/80 rounded-xl border p-3 text-center">
                        <div className="mb-1 text-2xl">🇷🇺</div>
                        <div className="text-foreground text-xs font-bold">Rus tili</div>
                        <div className="text-foreground-muted text-[10px]">ТРКИ • B1/B2</div>
                      </div>
                      <div className="border-border/80 bg-surface/80 rounded-xl border p-3 text-center">
                        <div className="mb-1 text-2xl">🇹🇷</div>
                        <div className="text-foreground text-xs font-bold">Turk tili</div>
                        <div className="text-foreground-muted text-[10px]">TÖMER • C1</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-border/50 mt-6 flex flex-col items-start justify-between gap-3 border-t pt-4 sm:flex-row sm:items-center">
                  <span className="text-foreground-muted text-[11px] font-medium">
                    {module.stats}
                  </span>
                  <Link
                    href={module.href}
                    className="bg-surface-elevated hover:bg-primary hover:text-primary-foreground border-border text-foreground group-hover:bg-primary group-hover:text-primary-foreground inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold shadow-sm transition-all sm:w-auto"
                  >
                    <span>{module.cta}</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Academic Standard Banner */}
        <div className="border-border bg-surface mt-12 flex flex-col items-center justify-between gap-6 rounded-2xl border p-6 sm:p-8 md:flex-row">
          <div className="max-w-2xl space-y-2">
            <div className="text-primary flex items-center gap-2 text-xs font-bold tracking-wider uppercase">
              <BookOpen className="h-4 w-4" />
              <span>Davlat ta&apos;lim standarti</span>
            </div>
            <h3 className="text-foreground text-lg font-bold sm:text-xl">
              Barcha ilmiy ishlar OTM va GOST talablariga mos tuziladi
            </h3>
            <p className="text-foreground-secondary text-xs sm:text-sm">
              Har bir yaratilgan kurs ishi va referat standart akademik hoshiyalarga (chapdan 25mm,
              yuqori/o&apos;ng/pastdan 20mm), mundarijaga va rasmiy manbalar bazasiga ega
              bo&apos;ladi.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/academic/coursework"
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20 rounded-xl px-5 py-2.5 text-xs font-semibold shadow-md transition-all sm:text-sm"
            >
              Hozir yaratish
            </Link>
            <Link
              href="/academic/mock-test"
              className="bg-surface-elevated border-border text-foreground hover:bg-border/50 rounded-xl border px-5 py-2.5 text-xs font-semibold transition-all sm:text-sm"
            >
              Mock Testga o&apos;tish
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
