"use client";

import React from "react";
import Link from "next/link";
import {
  Globe2,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Award,
  Zap,
  ShieldCheck,
  Languages,
  Presentation,
  Sliders,
} from "lucide-react";
import { StudentSubNav } from "@/components/academic/student-sub-nav";

export default function MockTestHubPage() {
  const languageCards = [
    {
      id: "english",
      title: "Ingliz tili Mock Test",
      nativeTitle: "English Proficiency Diagnostic Assessment",
      standard: "IELTS & CEFR (A1 — C2)",
      flag: "🇬🇧",
      href: "/academic/mock-test/english",
      accent:
        "from-blue-600/20 via-sky-600/10 to-transparent hover:border-blue-500/50 shadow-blue-500/5",
      buttonBg: "bg-blue-600 hover:bg-blue-500 shadow-blue-500/25",
      badge: "A1 — C2 • IELTS 4.0 — 8.5",
      badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      description:
        "Xalqaro IELTS va CEFR standartlari asosida tuzilgan adaptiv test. Har bir daraja (A1 dan C2 gacha va IELTS 4.0 — 8.5) uchun alohida savollar to'plami va yozma topshiriq.",
      levels: ["A1", "A2", "B1", "B2", "C1", "C2", "IELTS 4-5", "IELTS 5.5-6.5", "IELTS 7-8.5"],
      features: [
        "Foydalanuvchi darajasini tanlash tugmalari (A1-C2, IELTS)",
        "Reading, Grammar va Academic Vocabulary",
        "Writing task (Insho yozish tahlili)",
        "Darhol IELTS Band & CEFR darajasi",
        "Xatolar ustida qoida va tushuntirishlar",
      ],
      estimatedTime: "15 daqiqa",
      questionsCount: "5 ta savol + 1 ta insho",
    },
    {
      id: "russian",
      title: "Rus tili Mock Test",
      nativeTitle: "Тестирование по русскому языку (ТРКИ & CEFR)",
      standard: "ТРКИ (TORFL) & CEFR (A1 — C2)",
      flag: "🇷🇺",
      href: "/academic/mock-test/russian",
      accent:
        "from-purple-600/20 via-pink-600/10 to-transparent hover:border-purple-500/50 shadow-purple-500/5",
      buttonBg: "bg-purple-600 hover:bg-purple-500 shadow-purple-500/25",
      badge: "A1 — C2 • ТРКИ (ТЭУ, ТБУ, 1, 2)",
      badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      description:
        "OTM, magistratura va xalqaro tashkilotlar uchun TRKI talablariga mos rus tili darajasini aniqlash. Darajani tanlash imkoniyati bilan mos grammatika va ishbilarmonlik nutqi.",
      levels: ["A1", "A2", "B1", "B2", "C1", "C2", "ТРКИ-Элем", "ТРКИ-База", "ТРКИ-1", "ТРКИ-2"],
      features: [
        "Darajalar tanlovi (A1-C2, ТРКИ-Элементарный, Базовый, ТРКИ-1, ТРКИ-2)",
        "Падежные окончания и глагольное управление",
        "Синтаксис, деепричастия и научный стиль",
        "Деловое письмо / мини-эссе",
        "Мгновенный отчет по уровню ТРКИ с разбором ошибок",
      ],
      estimatedTime: "15 daqiqa",
      questionsCount: "5 ta savol + 1 ta yozma",
    },
    {
      id: "turkish",
      title: "Turk tili Mock Test",
      nativeTitle: "Türkçe Yeterlilik ve Seviye Sınavı (TÖMER)",
      standard: "TÖMER & Yunus Emre (A1 — C2)",
      flag: "🇹🇷",
      href: "/academic/mock-test/turkish",
      accent:
        "from-emerald-600/20 via-teal-600/10 to-transparent hover:border-emerald-500/50 shadow-emerald-500/5",
      buttonBg: "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/25",
      badge: "A1 — C2 • TÖMER Başlangıç — İleri",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      description:
        "Turkiya universitetlari grantlari (Türkiye Bursları) va ish uchun TÖMER simulyatori. Tanlangan darajaga qarab fe'l zamonlari, qo'shimchalar va matn tahlili.",
      levels: ["A1", "A2", "B1", "B2", "C1", "C2", "TÖMER Başlangıç", "TÖMER Orta", "TÖMER İleri"],
      features: [
        "Darajalar tanlovi (A1-C2, TÖMER Başlangıç, Orta, İleri)",
        "Fiil çekimleri, zarf-fiil ve ekler bilgisi",
        "Cümle tamamlama ve akademik anlam",
        "Serbest yazma (Kompozisyon ve niyet mektubu)",
        "Anında TÖMER seviye raporu ve çözüm analizi",
      ],
      estimatedTime: "15 daqiqa",
      questionsCount: "5 ta savol + 1 ta yozma",
    },
  ];

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Sub navigation */}
      <StudentSubNav activeTab="mock-test" />

      {/* Hero Header */}
      <div className="border-border/60 bg-surface/30 relative overflow-hidden border-b py-12 md:py-16">
        <div className="from-primary/10 pointer-events-none absolute inset-0 bg-gradient-to-b via-transparent to-transparent" />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.15)_0%,transparent_70%)]" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-3xl flex-col items-center space-y-4 text-center">
            <div className="border-primary/30 bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold shadow-sm">
              <Globe2 className="h-3.5 w-3.5" />
              <span>DocNova Xalqaro Til Simulyatori 2026</span>
            </div>

            <h1 className="text-foreground text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              Mock Test:{" "}
              <span className="via-primary bg-gradient-to-r from-cyan-400 to-sky-400 bg-clip-text text-transparent">
                Chet tillari diagnostikasi
              </span>
            </h1>

            <p className="text-foreground-secondary max-w-2xl text-base leading-relaxed sm:text-lg">
              IELTS, CEFR, ТРКИ va TÖMER xalqaro standartlari asosida bilimingizni sinang. O&apos;z
              darajangizni (A1 dan C2 gacha) tanlang va sun&apos;iy intellekt yordamida tezkor
              tahlil hamda sertifikat darajasini oling.
            </p>

            <div className="text-foreground-muted flex flex-wrap items-center justify-center gap-4 pt-2 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <Sliders className="h-4 w-4 text-sky-400" />
                <span>Interaktiv daraja tanlash</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-amber-400" />
                <span>Bir zumda AI baholash</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="h-4 w-4 text-emerald-400" />
                <span>Rasmiy shkala (A1 — C2)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="text-primary h-4 w-4" />
                <span>100% to&apos;liq tahlil</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main 3 Language Cards Section */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto mb-8 max-w-xl text-center">
          <h2 className="text-foreground flex items-center justify-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
            <Languages className="text-primary h-5 w-5" />
            Sinov tilini tanlang
          </h2>
          <p className="text-foreground-secondary mt-1 text-xs sm:text-sm">
            Har bir til uchun moslashuvchan daraja tanlash menyusi va maxsus AI baholash rubrikasi
            ishlab chiqilgan
          </p>
        </div>

        {/* The 3 Cards */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {languageCards.map((card) => (
            <div
              key={card.id}
              className={`group border-border relative flex flex-col justify-between rounded-3xl border bg-gradient-to-b ${card.accent} p-7 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl`}
            >
              <div>
                {/* Top Badge & Flag */}
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div className="text-4xl drop-shadow-sm filter">{card.flag}</div>
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${card.badgeColor}`}
                  >
                    {card.badge}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-foreground group-hover:text-primary text-xl font-bold transition-colors">
                  {card.title}
                </h3>
                <p className="text-foreground-muted mt-0.5 mb-2 text-xs font-medium">
                  {card.nativeTitle}
                </p>
                <div className="text-primary mb-4 flex items-center gap-1.5 text-xs font-semibold">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{card.standard}</span>
                </div>

                {/* Description */}
                <p className="text-foreground-secondary mb-5 text-xs leading-relaxed sm:text-sm">
                  {card.description}
                </p>

                {/* Supported Level Chips */}
                <div className="mb-5">
                  <div className="text-foreground-muted mb-2 text-[11px] font-bold tracking-wider uppercase">
                    Qo&apos;llab-quvvatlanadigan darajalar:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {card.levels.map((lvl) => (
                      <span
                        key={lvl}
                        className="border-border bg-surface-elevated/80 text-foreground-secondary rounded-lg border px-2 py-0.5 text-[11px] font-semibold"
                      >
                        {lvl}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Feature Checklist */}
                <div className="border-border/80 bg-surface/70 mb-6 space-y-2.5 rounded-2xl border p-4">
                  <div className="text-foreground-muted text-[11px] font-bold tracking-wider uppercase">
                    Test imkoniyatlari:
                  </div>
                  {card.features.map((feature, idx) => (
                    <div key={idx} className="text-foreground flex items-center gap-2 text-xs">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Time & Count */}
                <div className="text-foreground-muted mb-6 flex items-center justify-between px-1 text-xs font-medium">
                  <span className="flex items-center gap-1">
                    <Clock className="text-primary h-3.5 w-3.5" />
                    {card.estimatedTime}
                  </span>
                  <span>{card.questionsCount}</span>
                </div>
              </div>

              {/* Action Button */}
              <Link
                href={card.href}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${card.buttonBg}`}
              >
                <span>Darajani tanlab, testni boshlash</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          ))}
        </div>

        {/* Presentation Cross-Sell Banner */}
        <div className="mt-10">
          <Link
            href="/academic/presentation?type=mock&slides=10"
            className="group flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-transparent p-5 shadow-sm transition-all hover:border-cyan-500/60"
          >
            <div className="flex items-center gap-3.5">
              <div className="shrink-0 rounded-xl bg-cyan-500/20 p-3 text-cyan-400">
                <Presentation className="h-6 w-6" />
              </div>
              <div>
                <div className="text-foreground flex items-center gap-2 text-sm font-bold sm:text-base">
                  <span>Til o&apos;rganish yoki taqdimotlar uchun slaydlar (PPTX) kerakmi?</span>
                  <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
                    Istalgancha slayd
                  </span>
                </div>
                <div className="text-foreground-secondary mt-0.5 text-xs">
                  IELTS, CEFR yoki lingvistik mavzularda xohlagancha slaydlar va ma&apos;ruzachi
                  nutqini tayyorlang
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 transition-transform group-hover:translate-x-1 sm:text-sm">
              <span>Slaydlar yaratish</span>
              <span>→</span>
            </div>
          </Link>
        </div>

        {/* How It Works Box */}
        <div className="border-border bg-surface mt-10 rounded-3xl border p-8 shadow-sm">
          <h3 className="text-foreground mb-8 text-center text-lg font-bold sm:text-xl">
            Mock Test qanday ishlaydi?
          </h3>
          <div className="grid grid-cols-1 gap-6 text-center md:grid-cols-4">
            <div className="flex flex-col items-center space-y-2">
              <div className="bg-primary/10 text-primary border-primary/20 mb-2 flex h-12 w-12 items-center justify-center rounded-2xl border text-lg font-bold">
                1
              </div>
              <h4 className="text-foreground text-sm font-semibold">Darajangizni belgilang</h4>
              <p className="text-foreground-secondary max-w-xs text-xs">
                A1 dan C2 gacha yoki IELTS / TRKI / TÖMER standartini tanlang.
              </p>
            </div>

            <div className="flex flex-col items-center space-y-2">
              <div className="bg-primary/10 text-primary border-primary/20 mb-2 flex h-12 w-12 items-center justify-center rounded-2xl border text-lg font-bold">
                2
              </div>
              <h4 className="text-foreground text-sm font-semibold">Savollarga javob bering</h4>
              <p className="text-foreground-secondary max-w-xs text-xs">
                Tanlangan darajaga mos 5 ta grammatik-leksik savolni yeching va qisqa insho yozing.
              </p>
            </div>

            <div className="flex flex-col items-center space-y-2">
              <div className="bg-primary/10 text-primary border-primary/20 mb-2 flex h-12 w-12 items-center justify-center rounded-2xl border text-lg font-bold">
                3
              </div>
              <h4 className="text-foreground text-sm font-semibold">AI chuqur tahlil qiladi</h4>
              <p className="text-foreground-secondary max-w-xs text-xs">
                Google Gemini API so&apos;z boyligingiz, grammatik aniqlik va jumlalar tuzilishini
                tekshiradi.
              </p>
            </div>

            <div className="flex flex-col items-center space-y-2">
              <div className="bg-primary/10 text-primary border-primary/20 mb-2 flex h-12 w-12 items-center justify-center rounded-2xl border text-lg font-bold">
                4
              </div>
              <h4 className="text-foreground text-sm font-semibold">Natija & Xatolar tahlili</h4>
              <p className="text-foreground-secondary max-w-xs text-xs">
                Bir necha soniyada xalqaro darajangiz (Band / CEFR) va har bir savol bo&apos;yicha
                tushuntirishni oling.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
