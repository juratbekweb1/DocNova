"use client";

import React, { useState } from "react";
import { Check, X, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import Link from "next/link";
import { useLanguage } from "@/components/providers/language-provider";

type DbPlan = {
  slug: string;
  priceYearly: number;
  priceMonthly: number;
};

export function PricingSection() {
  const { t } = useLanguage();
  const [isYearly, setIsYearly] = useState(false);
  const [dbPlans, setDbPlans] = useState<DbPlan[]>([]);

  React.useEffect(() => {
    fetch("/api/plans")
      .then((res) => res.json())
      .then((data) => setDbPlans(Array.isArray(data) ? data : []))
      .catch(() => setDbPlans([]));
  }, []);

  const getDbPrice = (slug: string, yearly: boolean) => {
    const p = dbPlans.find((plan) => plan.slug === slug);
    if (!p) return null;
    return yearly ? p.priceYearly : p.priceMonthly;
  };

  const formatPrice = (price: number | null | undefined, defaultStr: string) => {
    if (price == null) return defaultStr;
    return price.toLocaleString();
  };

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
      price: formatPrice(getDbPrice("pro", isYearly), isYearly ? "566,400" : "59,000"),
      period: isYearly ? "/ Yil" : "/ Oy",
      billingDetails: isYearly ? "Oyiga 47,200 so'm dan aylanadi" : "Har oy to'lanadi",
      description: t.proPlanDesc || "Karyerangizni yangi bosqichga ko'taring.",
      features: [
        { name: "10-15 ta ATS premium shablonlar", included: true },
        { name: "Kuniga 25 marta AI orqali generatsiya", included: true },
        { name: "Kengaytirilgan PDF eksport asboblari", included: true },
        { name: "AI CV Analyzer (Resume tahlili) - 10 ta tekshiruv", included: true },
        { name: "Asosiy Cover Letter generatori", included: true },
        { name: "IELTS Mock testlar - 5 ta urinish (AI Feedback yo'q)", included: true },
        { name: "Cheksiz shablonlar va generatsiya", included: false },
        { name: "To'liq IELTS va AI yordamchisi", included: false },
      ],
      cta: t.viewPlans || "Pro'ga o'tish",
      ctaHref: "/checkout?plan=pro",
    },
    {
      name: "PREMIUM",
      title: t.premiumPlan || "Premium",
      price: formatPrice(getDbPrice("premium", isYearly), isYearly ? "758,400" : "79,000"),
      period: isYearly ? "/ Yil" : "/ Oy",
      billingDetails: isYearly ? "Oyiga 63,200 so'm dan aylanadi" : "Har oy to'lanadi",
      description: t.premiumPlanDesc || "Cheksiz imkoniyatlar, barcha cheklovlardan ozod bo'ling.",
      features: [
        { name: "Barcha PRO imkoniyatlar", included: true },
        { name: "To'liq IELTS Mock + AI Score & Feedback", included: true },
        { name: "OCR (Rasmdan matn ajratib olish)", included: true },
        { name: "Eksklyuziv AI Karyera Yordamchisi (AI Mentor)", included: true },
        { name: "Ustuvor texnik qo'llab-quvvatlash", included: true },
        { name: "Erta yangilanishlarga kirish", included: true },
        { name: "Reklamasiz toza interfeys", included: true },
        { name: "Kengaytirilgan Portfolio generatori", included: true },
      ],
      cta: t.viewPlans || "Premium olish",
      ctaHref: "/checkout?plan=premium",
    },
  ];

  return (
    <section id="pricing" className="mx-auto w-full max-w-7xl px-6 py-24 sm:px-8 lg:px-12">
      <div className="border-border bg-background/80 relative overflow-hidden rounded-[2.5rem] border p-8 lg:p-14">
        {/* Background decoration */}
        <div className="from-accent/20 via-primary/5 pointer-events-none absolute top-0 right-0 z-0 h-[600px] w-[600px] translate-x-1/3 -translate-y-1/3 rounded-full bg-gradient-to-bl to-transparent blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-primary text-sm font-semibold tracking-[0.24em] uppercase">
              {t.pricingTagline || "Oddiy va shaffof"}
            </p>
            <h2 className="text-foreground mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
              {t.pricingTitle || "Tariflar"}
            </h2>
          </div>
        </div>

        {/* Toggle Switch */}
        <div className="bg-surface/50 border-border/50 relative z-10 mt-8 flex w-fit items-center rounded-full border p-1.5 shadow-inner backdrop-blur-sm">
          <button
            onClick={() => setIsYearly(false)}
            className={cn(
              "relative z-10 rounded-full px-8 py-2.5 text-sm font-semibold transition-colors",
              !isYearly ? "text-foreground" : "text-foreground-secondary hover:text-foreground"
            )}
          >
            {!isYearly && (
              <motion.div
                layoutId="shared-pricing-toggle"
                className="bg-surface-elevated border-border absolute inset-0 -z-10 rounded-full border shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            Oylik
          </button>
          <button
            onClick={() => setIsYearly(true)}
            className={cn(
              "relative z-10 flex items-center gap-2 rounded-full px-8 py-2.5 text-sm font-semibold transition-colors",
              isYearly ? "text-foreground" : "text-foreground-secondary hover:text-foreground"
            )}
          >
            {isYearly && (
              <motion.div
                layoutId="shared-pricing-toggle"
                className="bg-surface-elevated border-border absolute inset-0 -z-10 rounded-full border shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            Yillik
            <span className="rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 px-2 py-0.5 text-[10px] font-bold whitespace-nowrap text-white shadow-sm">
              20% chegirma
            </span>
          </button>
        </div>

        <div className="relative z-10 mt-12 grid items-stretch gap-6 md:grid-cols-3">
          {/* Free Plan */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="border-border/40 bg-surface/30 hover:border-border/80 relative flex flex-col overflow-hidden rounded-3xl border p-8 transition-all duration-300"
          >
            <h3 className="text-foreground text-2xl font-bold tracking-tight transition-colors">
              {plans[0].title}
            </h3>
            <div className="mt-6 flex flex-wrap items-baseline gap-1.5">
              <span className="text-foreground text-5xl font-black tracking-tight">0</span>
              <span className="text-foreground-secondary text-lg whitespace-nowrap">UZS</span>
            </div>
            <p className="text-foreground-secondary mt-4 text-sm leading-relaxed font-medium">
              {plans[0].description}
            </p>
            <div className="mt-8 mb-8 flex-1">
              <ul className="space-y-4">
                {plans[0].features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    {feature.included ? (
                      <div className="bg-primary/10 border-primary/20 mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border">
                        <Check className="text-primary h-3 w-3" />
                      </div>
                    ) : (
                      <div className="bg-surface-elevated border-border mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border">
                        <X className="text-foreground-muted h-3 w-3" />
                      </div>
                    )}
                    <span
                      className={cn(
                        "text-sm leading-tight",
                        feature.included ? "text-foreground" : "text-foreground-muted"
                      )}
                    >
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-auto">
              <a
                href={plans[0].ctaHref}
                className="border-border bg-surface-elevated text-foreground hover:bg-surface-elevated/80 block w-full rounded-xl border py-4 text-center text-sm font-bold shadow-sm transition-all duration-300"
              >
                {plans[0].cta}
              </a>
            </div>
          </motion.div>

          {/* Pro Plan */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="bg-surface-elevated relative z-20 flex flex-col overflow-visible rounded-3xl border border-cyan-500/30 p-8 shadow-[0_0_25px_rgba(0,180,216,0.2)] transition-all duration-300 hover:shadow-[0_0_35px_rgba(0,180,216,0.3)]"
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-1.5 text-[10px] font-bold tracking-wider text-white uppercase shadow-lg sm:text-xs">
                <Sparkles className="h-3 w-3" /> ★ MOST POPULAR
              </span>
            </div>

            <h3 className="text-foreground mt-4 text-2xl font-bold tracking-tight">
              {plans[1].title}
            </h3>
            <div className="mt-6 flex flex-wrap items-baseline gap-1.5">
              <span className="text-foreground text-5xl font-black tracking-tight">
                {plans[1].price}
              </span>
              <span className="text-foreground-secondary text-lg whitespace-nowrap">
                UZS {plans[1].period}
              </span>
            </div>
            <p className="relative z-10 mt-2 text-sm font-medium text-cyan-400/80">
              {plans[1].billingDetails}
            </p>
            <p className="text-foreground-secondary relative z-10 mt-4 text-sm leading-relaxed font-medium">
              {plans[1].description}
            </p>
            <div className="mt-8 mb-8 flex-1">
              <ul className="space-y-4">
                {plans[1].features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    {feature.included ? (
                      <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/10">
                        <Check className="h-3 w-3 text-cyan-400" />
                      </div>
                    ) : (
                      <div className="bg-surface-elevated border-border mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border">
                        <X className="text-foreground-muted h-3 w-3" />
                      </div>
                    )}
                    <span
                      className={cn(
                        "text-sm leading-tight",
                        feature.included ? "text-foreground" : "text-foreground-muted"
                      )}
                    >
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative z-10 mt-auto">
              <Link
                href={plans[1].ctaHref}
                className="block w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-4 text-center text-sm font-bold text-white shadow-[0_4px_14px_0_rgba(0,180,216,0.39)] transition-all hover:-translate-y-0.5 hover:from-cyan-400 hover:to-blue-500 hover:shadow-[0_6px_20px_rgba(0,180,216,0.23)]"
              >
                {plans[1].cta}
              </Link>
            </div>
          </motion.div>

          {/* Premium Plan */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="bg-surface relative z-10 flex flex-col overflow-visible rounded-3xl border border-purple-500/30 p-8 shadow-[0_0_25px_rgba(168,85,247,0.1)] transition-all duration-300 hover:shadow-[0_0_35px_rgba(168,85,247,0.2)]"
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="flex items-center gap-1.5 rounded-full border border-purple-400/30 bg-gradient-to-r from-purple-500 to-indigo-500 px-4 py-1.5 text-[10px] font-bold tracking-wider text-white uppercase shadow-lg sm:text-xs">
                <Zap className="h-3 w-3" /> ⚡ PREMIUM +
              </span>
            </div>

            <h3 className="text-foreground mt-4 text-2xl font-bold tracking-tight">
              {plans[2].title}
            </h3>
            <div className="mt-6 flex flex-wrap items-baseline gap-1.5">
              <span className="text-foreground text-5xl font-black tracking-tight">
                {plans[2].price}
              </span>
              <span className="text-foreground-secondary text-lg whitespace-nowrap">
                UZS {plans[2].period}
              </span>
            </div>
            <p className="relative z-10 mt-2 text-sm font-medium text-purple-400/80">
              {plans[2].billingDetails}
            </p>
            <p className="text-foreground-secondary relative z-10 mt-4 text-sm leading-relaxed font-medium">
              {plans[2].description}
            </p>
            <div className="mt-8 mb-8 flex-1">
              <ul className="space-y-4">
                {plans[2].features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    {feature.included ? (
                      <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-purple-500/30 bg-purple-500/10">
                        <Check className="h-3 w-3 text-purple-400" />
                      </div>
                    ) : (
                      <div className="bg-surface-elevated border-border mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border">
                        <X className="text-foreground-muted h-3 w-3" />
                      </div>
                    )}
                    <span
                      className={cn(
                        "text-sm leading-tight",
                        feature.included ? "text-foreground" : "text-foreground-muted"
                      )}
                    >
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative z-10 mt-auto">
              <Link
                href={plans[2].ctaHref}
                className="block w-full rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 py-4 text-center text-sm font-bold text-white shadow-[0_4px_14px_0_rgba(168,85,247,0.39)] transition-all hover:-translate-y-0.5 hover:from-purple-400 hover:to-indigo-500 hover:shadow-[0_6px_20px_rgba(168,85,247,0.23)]"
              >
                {plans[2].cta}
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
