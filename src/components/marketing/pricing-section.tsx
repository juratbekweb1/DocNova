"use client";

import React, { useState } from "react";
import { Check, X, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import Link from "next/link";
import { useLanguage } from "@/components/providers/language-provider";

export function PricingSection() {
  const { t } = useLanguage();
  const [isYearly, setIsYearly] = useState(false);

  const plans = [
    {
      name: "FREE",
      title: t.freePlan || "Bepul",
      price: "0",
      period: "",
      billingDetails: t.freePlanDesc || "Umrbod bepul",
      description: t.freePlanDesc || "Asosiy imkoniyatlar bilan tanishish uchun.",
      features: [
        { name: "1-2 ta standart resume shablonlari", included: true },
        { name: "Kuniga 3 marta AI orqali generatsiya", included: true },
        { name: "Asosiy PDF eksport asboblari", included: true },
        { name: "AI CV Analyzer", included: false },
        { name: "Cover Letter (Motivatsion xat) generatori", included: false },
        { name: "IELTS Mock testlar va AI Feedback", included: false },
      ],
      cta: t.startBuildingFree || "Boshlash",
      ctaHref: "/register",
    },
    {
      name: "PRO",
      title: t.proPlan || "Pro",
      price: isYearly ? "566,400" : "59,000",
      period: isYearly ? "/ Yil" : "/ Oy",
      billingDetails: isYearly ? "Oyiga 47,200 so'm dan aylanadi" : "Har oy to'lanadi",
      description: t.proPlanDesc || "Ish izlovchilar va talabalar uchun maxsus.",
      features: [
        { name: "Cheksiz ATS premium shablonlar", included: true },
        { name: "Kuniga cheksiz AI orqali generatsiya", included: true },
        { name: "Kengaytirilgan PDF asboblari", included: true },
        { name: "AI CV Analyzer (Resume tahlili)", included: true },
        { name: "To'liq Cover Letter generatori", included: true },
        { name: "IELTS Mock testlar va AI Feedback", included: false },
      ],
      cta: t.viewPlans || "Pro'ga o'tish",
      ctaHref: "/checkout?plan=pro",
    },
    {
      name: "PREMIUM",
      title: t.premiumPlan || "Premium",
      price: isYearly ? "758,400" : "79,000",
      period: isYearly ? "/ Yil" : "/ Oy",
      billingDetails: isYearly ? "Oyiga 63,200 so'm dan aylanadi" : "Har oy to'lanadi",
      description: t.premiumPlanDesc || "To'liq professional xizmatlar to'plami.",
      features: [
        { name: "Barcha PRO imkoniyatlar", included: true },
        { name: "To'liq IELTS Mock + AI Score & Feedback", included: true },
        { name: "OCR (Rasmdan matn ajratib olish)", included: true },
        { name: "Ustuvor texnik qo'llab-quvvatlash", included: true },
        { name: "Umuman reklamasiz toza interfeys", included: true },
        { name: "Erta yangilanishlarga kirish", included: true },
      ],
      cta: t.viewPlans || "Premium olish",
      ctaHref: "/checkout?plan=premium",
    }
  ];

  return (
    <section id="pricing" className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12 w-full">
      <div className="rounded-[2.5rem] border border-border bg-background/80 p-8 lg:p-14 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-accent/20 via-primary/5 to-transparent blur-3xl rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none z-0" />
        
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between relative z-10">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">{t.pricingTagline || "Oddiy va shaffof"}</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
              {t.pricingTitle || "Tariflar"}
            </h2>
          </div>
        </div>

        {/* Toggle Switch */}
        <div className="relative flex items-center p-1.5 bg-surface/50 border border-border/50 rounded-full w-fit mt-8 shadow-inner backdrop-blur-sm z-10">
          <button
            onClick={() => setIsYearly(false)}
            className={cn(
              "relative px-8 py-2.5 text-sm font-semibold transition-colors rounded-full z-10",
              !isYearly ? "text-foreground" : "text-foreground-secondary hover:text-foreground"
            )}
          >
            {!isYearly && (
              <motion.div
                layoutId="shared-pricing-toggle"
                className="absolute inset-0 bg-surface-elevated border border-border shadow-[0_2px_8px_rgba(0,0,0,0.2)] rounded-full -z-10"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            Oylik
          </button>
          <button
            onClick={() => setIsYearly(true)}
            className={cn(
              "relative px-8 py-2.5 text-sm font-semibold transition-colors rounded-full z-10 flex items-center gap-2",
              isYearly ? "text-foreground" : "text-foreground-secondary hover:text-foreground"
            )}
          >
            {isYearly && (
              <motion.div
                layoutId="shared-pricing-toggle"
                className="absolute inset-0 bg-surface-elevated border border-border shadow-[0_2px_8px_rgba(0,0,0,0.2)] rounded-full -z-10"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            Yillik
            <span className="bg-gradient-to-r from-emerald-500 to-emerald-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
              20% chegirma
            </span>
          </button>
        </div>
        
        <div className="mt-12 grid gap-6 md:grid-cols-3 relative z-10 items-stretch">
          {/* Free Plan */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="rounded-3xl border border-border/40 bg-surface/30 p-8 hover:border-border/80 transition-all duration-300 flex flex-col relative overflow-hidden"
          >
            <h3 className="text-2xl font-bold tracking-tight text-foreground transition-colors">{plans[0].title}</h3>
            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tight text-foreground">0</span>
              <span className="text-lg text-foreground-secondary">UZS</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-foreground-secondary font-medium">{plans[0].description}</p>
            <div className="mt-8 mb-8 flex-1">
              <ul className="space-y-4">
                {plans[0].features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    {feature.included ? (
                      <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center border bg-primary/10 border-primary/20">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                    ) : (
                      <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-surface-elevated flex items-center justify-center border border-border">
                        <X className="h-3 w-3 text-foreground-muted" />
                      </div>
                    )}
                    <span className={cn("text-sm leading-tight", feature.included ? "text-foreground" : "text-foreground-muted")}>
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-auto">
              <a href={plans[0].ctaHref} className="block w-full rounded-xl border border-border bg-surface-elevated py-4 text-center text-sm font-bold text-foreground hover:bg-surface-elevated/80 transition-all duration-300 shadow-sm">
                {plans[0].cta}
              </a>
            </div>
          </motion.div>
          
          {/* Pro Plan */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="rounded-3xl border border-cyan-500/30 bg-surface-elevated p-8 shadow-[0_0_25px_rgba(0,180,216,0.2)] hover:shadow-[0_0_35px_rgba(0,180,216,0.3)] transition-all duration-300 flex flex-col relative overflow-visible z-20"
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider py-1.5 px-4 rounded-full shadow-lg flex items-center gap-1.5 border border-cyan-400/30">
                <Sparkles className="h-3 w-3" /> ★ MOST POPULAR
              </span>
            </div>
            
            <h3 className="text-2xl font-bold tracking-tight text-foreground mt-4">{plans[1].title}</h3>
            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tight text-foreground">
                {plans[1].price}
              </span>
              <span className="text-lg text-foreground-secondary">UZS</span>
              <span className="text-lg text-foreground-secondary">{plans[1].period}</span>
            </div>
            <p className="mt-2 text-sm font-medium text-cyan-400/80 relative z-10">
              {plans[1].billingDetails}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-foreground-secondary font-medium relative z-10">{plans[1].description}</p>
            <div className="mt-8 mb-8 flex-1">
              <ul className="space-y-4">
                {plans[1].features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    {feature.included ? (
                      <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center border bg-cyan-500/10 border-cyan-500/30">
                        <Check className="h-3 w-3 text-cyan-400" />
                      </div>
                    ) : (
                      <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-surface-elevated flex items-center justify-center border border-border">
                        <X className="h-3 w-3 text-foreground-muted" />
                      </div>
                    )}
                    <span className={cn("text-sm leading-tight", feature.included ? "text-foreground" : "text-foreground-muted")}>
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-auto relative z-10">
              <Link href={plans[1].ctaHref} className="block w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 py-4 text-center text-sm font-bold text-white shadow-[0_4px_14px_0_rgba(0,180,216,0.39)] hover:shadow-[0_6px_20px_rgba(0,180,216,0.23)] hover:-translate-y-0.5 transition-all">
                {plans[1].cta}
              </Link>
            </div>
          </motion.div>

          {/* Premium Plan */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="rounded-3xl border border-purple-500/30 bg-surface p-8 shadow-[0_0_25px_rgba(168,85,247,0.1)] hover:shadow-[0_0_35px_rgba(168,85,247,0.2)] transition-all duration-300 flex flex-col relative overflow-visible z-10"
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider py-1.5 px-4 rounded-full shadow-lg flex items-center gap-1.5 border border-purple-400/30">
                <Zap className="h-3 w-3" /> ⚡ PREMIUM +
              </span>
            </div>
            
            <h3 className="text-2xl font-bold tracking-tight text-foreground mt-4">{plans[2].title}</h3>
            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tight text-foreground">
                {plans[2].price}
              </span>
              <span className="text-lg text-foreground-secondary">UZS</span>
              <span className="text-lg text-foreground-secondary">{plans[2].period}</span>
            </div>
            <p className="mt-2 text-sm font-medium text-purple-400/80 relative z-10">
              {plans[2].billingDetails}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-foreground-secondary font-medium relative z-10">{plans[2].description}</p>
            <div className="mt-8 mb-8 flex-1">
              <ul className="space-y-4">
                {plans[2].features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    {feature.included ? (
                      <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center border bg-purple-500/10 border-purple-500/30">
                        <Check className="h-3 w-3 text-purple-400" />
                      </div>
                    ) : (
                      <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-surface-elevated flex items-center justify-center border border-border">
                        <X className="h-3 w-3 text-foreground-muted" />
                      </div>
                    )}
                    <span className={cn("text-sm leading-tight", feature.included ? "text-foreground" : "text-foreground-muted")}>
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-auto relative z-10">
              <Link href={plans[2].ctaHref} className="block w-full rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 py-4 text-center text-sm font-bold text-white shadow-[0_4px_14px_0_rgba(168,85,247,0.39)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.23)] hover:-translate-y-0.5 transition-all">
                {plans[2].cta}
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
