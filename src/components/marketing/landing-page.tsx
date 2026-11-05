"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Play,
  ArrowRight,
  ChevronDown,
  GraduationCap,
} from "lucide-react";
import React, { useState } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { PricingSection } from "./pricing-section";
import { HeroFeaturesBar } from "./hero-features-bar";
import { ServicesGridSection } from "./services-grid-section";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "DocNova",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "DocNova — Talabalar va mutaxassislar uchun milliy AI platformasi. Kurs ishlari, referatlar, BMI, taqdimotlar va rezyumelarni soniyalarda tayyorlang.",
  url: "https://www.docnova.uz",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "UZS",
  },
};

const AnimatedBackground = () => (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden dark:bg-[#020817] bg-[#f8fafc] transition-colors duration-300 transform-gpu">
    {/* Deep Cosmic Radial Aura matching reference Image 2 */}
    <div className="absolute inset-0 dark:bg-[radial-gradient(ellipse_100%_80%_at_50%_-15%,rgba(14,165,233,0.24),rgba(2,8,23,0))] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.12),rgba(248,250,252,0))]" />

    {/* Mobile-optimized lightweight static ambient glow (No infinite JS animation / zero lag on mobile) */}
    <div className="block md:hidden absolute -top-20 right-0 h-[280px] w-[280px] rounded-full bg-cyan-400/15 blur-2xl transform-gpu pointer-events-none" />
    <div className="block md:hidden absolute top-1/3 -left-20 h-[260px] w-[260px] rounded-full bg-blue-600/10 blur-2xl transform-gpu pointer-events-none" />

    {/* Desktop/Tablet electric cyan aurora portal (Smooth hardware-accelerated motion) */}
    <motion.div
      animate={{
        scale: [1, 1.12, 1],
        opacity: [0.35, 0.55, 0.35],
      }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      className="hidden md:block absolute -top-40 right-[-10%] h-[750px] w-[850px] rounded-full bg-gradient-to-bl from-cyan-400/30 via-blue-600/25 to-transparent blur-[110px] transform-gpu will-change-transform"
    />

    {/* Desktop/Tablet deep cosmic blue orb */}
    <motion.div
      animate={{
        scale: [1, 1.1, 1],
        opacity: [0.3, 0.5, 0.3],
      }}
      transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      className="hidden md:block absolute top-10 -left-40 h-[600px] w-[650px] rounded-full bg-gradient-to-tr from-blue-700/25 via-sky-500/15 to-transparent blur-[100px] transform-gpu will-change-transform"
    />

    {/* Center subtle glow */}
    <div className="hidden md:block absolute top-1/2 left-1/2 h-[700px] w-[950px] -translate-x-1/2 -translate-y-1/2 rounded-full dark:bg-cyan-600/10 bg-sky-400/10 blur-[120px] transform-gpu" />

    {/* Subtle starfield sparkle pattern */}
    <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:42px_42px] opacity-[0.05] dark:opacity-[0.14] pointer-events-none" />
  </div>
);

const FaqItem = ({ faq }: { faq: { question: string; answer: string } }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-2xl border dark:border-slate-800/80 border-slate-200/90 dark:bg-[#0a1024]/80 bg-white/90 backdrop-blur-xl transition-colors hover:border-cyan-500/40 shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-6 py-4.5 text-left font-semibold dark:text-white text-slate-900 transition-colors dark:hover:bg-slate-800/40 hover:bg-slate-50"
      >
        <span className="text-base sm:text-lg">{faq.question}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-5 w-5 shrink-0 dark:text-slate-400 text-slate-500" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="border-t dark:border-slate-800/60 border-slate-100 px-6 pt-3 pb-5 text-sm leading-relaxed dark:text-slate-300 text-slate-600 sm:text-base">
              {faq.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export function LandingPage() {
  const { t } = useLanguage();

  const avatars = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80",
  ];

  const faqs = [
    {
      question: "DocNova nima va u qanday ishlaydi?",
      answer:
        "DocNova — talabalar, tadqiqotchilar va mutaxassislar uchun maxsus sun'iy intellekt platformasidir. Siz shunchaki mavzu va talablaringizni kiritasiz, tizim esa OTM standartlariga mos, mundarija, boblar va xulosasi bilan tayyor Word (.doc) hujjatini bir necha soniyada yaratib beradi.",
    },
    {
      question: "Kurs ishi va referatlar qanchalik aniq tayyorlanadi?",
      answer:
        "DocNova O'zbekiston OTMlarining amaldagi barcha standartlarini inobatga oladi. Kirish, asosiy qism, amaliy tahlillar, xulosa hamda eng so'nggi 15+ adabiyotlar ro'yxati avtomatik shakllantiriladi.",
    },
    {
      question: "Hujjatni yaratgandan so'ng tahrirlash mumkinmi?",
      answer:
        "Ha, albatta! Tayyor bo'lgan hujjatni bevosita Word (.doc) formatida yuklab olib Microsoft Word yoki Google Docs dasturlarida xohlagancha o'zgartirishingiz mumkin.",
    },
    {
      question: "Telegram bot orqali ham ishlatsa bo'ladimi?",
      answer:
        "Ha! DocNova rasmiy Telegram boti (@DocNovaAI_bot) orqali telefoningizning o'zidan barcha kurs ishlari, referatlar va taqdimotlarni soniyalarda yaratib olishingiz mumkin.",
    },
  ];

  return (
    <div className="relative min-h-screen w-full max-w-full overflow-x-hidden border-none outline-none dark:bg-[#020817] bg-[#f8fafc] dark:text-white text-slate-900 selection:bg-cyan-500/30 selection:text-white transition-colors duration-300">
      <AnimatedBackground />

      <div className="relative z-10 w-full max-w-full overflow-x-hidden border-none outline-none">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />

        <main id="main-content" className="w-full max-w-full overflow-x-hidden border-none outline-none">
          {/* =========================================================================
              1. HERO SECTION (100% Focused, Centered, Clean Cosmic Atmosphere)
             ========================================================================= */}
          <section className="relative mx-auto max-w-5xl px-4 pt-10 pb-12 sm:px-6 sm:pt-16 sm:pb-16 lg:px-8 lg:pt-20 lg:pb-20 text-center">
            {/* Ambient 3D Depth Layer */}
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
              <div className="absolute top-1/4 left-1/2 h-[550px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-cyan-500/20 via-blue-600/15 to-transparent blur-[140px]" />
              <div className="absolute -top-10 left-1/4 h-[380px] w-[450px] rounded-full bg-blue-700/15 blur-[120px]" />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="flex flex-col items-center"
            >
              {/* Top Pill Badge: AI bilan yangi imkoniyatlar */}
              <div className="inline-flex items-center gap-2.5 rounded-full border dark:border-sky-500/35 border-sky-400/40 dark:bg-sky-950/45 bg-sky-50 px-4 py-1.5 text-xs font-semibold dark:text-sky-300 text-sky-700 shadow-[0_0_20px_rgba(14,165,233,0.25)] backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
                <span>AI bilan yangi imkoniyatlar</span>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
              </div>

              {/* Main Heading */}
              <h1 className="mt-6 text-4xl font-black tracking-tight dark:text-white text-slate-900 sm:text-6xl lg:text-7xl leading-[1.14]">
                DocNova — Hujjatlar yaratishda<br />
                <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-600 bg-clip-text text-transparent">
                  aqlli yordamchingiz
                </span>
              </h1>

              {/* Subtitle Description */}
              <p className="mt-6 max-w-2xl text-base dark:text-slate-300 text-slate-600 sm:text-lg lg:text-xl leading-relaxed">
                Sun&apos;iy intellekt yordamida istalgan hujjatni tez, sifatli va professional tarzda yarating. Talabalar va mutaxassislar uchun eng qulay platforma.
              </p>

              {/* Primary Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5 sm:gap-4">
                <Link
                  href="#students"
                  className="group relative flex items-center gap-2.5 rounded-full bg-gradient-to-r from-sky-500 via-sky-400 to-blue-600 px-8 py-4 text-sm sm:text-base font-semibold text-white shadow-[0_0_30px_rgba(14,165,233,0.55)] transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(14,165,233,0.8)] active:scale-95"
                >
                  <span>🚀 Boshlash</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>

                <a
                  href="#features"
                  className="group flex items-center gap-2.5 rounded-full border dark:border-slate-700/60 border-slate-300 dark:bg-[#0a1226]/85 bg-white px-7 py-4 text-sm sm:text-base font-medium dark:text-slate-200 text-slate-700 shadow-sm backdrop-blur-md transition-all hover:border-sky-500/40 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/15 text-cyan-500 transition-colors group-hover:bg-cyan-500 group-hover:text-white">
                    <Play className="h-3 w-3 fill-current ml-0.5" />
                  </div>
                  <span>Qanday ishlaydi?</span>
                </a>
              </div>

              {/* Social Proof: 5 Avatars + 50K text */}
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3.5">
                <div className="flex -space-x-2.5">
                  {avatars.map((src, i) => (
                    <div
                      key={i}
                      className="relative h-9 w-9 overflow-hidden rounded-full border-2 dark:border-[#020817] border-white ring-1 ring-sky-500/40 shadow-sm"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt="Foydalanuvchi"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                <div className="text-xs sm:text-sm font-medium dark:text-slate-300 text-slate-700">
                  <span className="font-bold dark:text-white text-slate-900">+50K</span> dan ortiq foydalanuvchilar tanlovi 💙
                </div>
              </div>
            </motion.div>
          </section>

          {/* =========================================================================
              2. FEATURES BAR (5 Ta Afzallik Glass Panel - 100% Matching Reference)
             ========================================================================= */}
          <div id="features">
            <HeroFeaturesBar />
          </div>

          {/* =========================================================================
              3. ASOSIY XIZMATLAR (9 Ta 3D Bo'lim & Talabalar Bo'limi Switcher)
             ========================================================================= */}
          <div id="services" className="scroll-mt-20">
            <div id="students" className="scroll-mt-20">
              <ServicesGridSection />
            </div>
          </div>

          {/* =========================================================================
              4. PRICING SECTION
             ========================================================================= */}
          <div id="pricing">
            <PricingSection />
          </div>

          {/* =========================================================================
              5. FAQ SECTION
             ========================================================================= */}
          <section id="faq" className="relative mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold tracking-tight dark:text-white text-slate-900 sm:text-4xl">
                Ko&apos;p beriladigan{" "}
                <span className="bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-600 bg-clip-text text-transparent">
                  savollar
                </span>
              </h2>
              <p className="mt-3 text-base dark:text-slate-400 text-slate-600">
                DocNova haqida eng muhim savollarga javoblar
              </p>
            </div>

            <div className="mt-10 space-y-4">
              {faqs.map((faq, index) => (
                <FaqItem key={index} faq={faq} />
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
