"use client";

import React, { useState } from "react";
import { Check, X, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);

  const plans = [
    {
      name: "FREE",
      title: "Bepul",
      price: "0",
      period: "",
      billingDetails: "Umrbod bepul",
      description: "Asosiy imkoniyatlar bilan tanishish uchun.",
      features: [
        { name: "1-2 ta standart resume shablonlari", included: true },
        { name: "Kuniga 3 marta AI orqali generatsiya", included: true },
        { name: "Asosiy PDF eksport asboblari", included: true },
        { name: "AI CV Analyzer", included: false },
        { name: "Cover Letter (Motivatsion xat) generatori", included: false },
        { name: "IELTS Mock testlar va AI Feedback", included: false },
      ],
      cta: "Boshlash",
      ctaHref: "/register",
    },
    {
      name: "PRO",
      title: "Pro",
      price: isYearly ? "566,400" : "59,000",
      period: isYearly ? "/ Yil" : "/ Oy",
      billingDetails: isYearly ? "Oyiga 47,200 so'm dan aylanadi" : "Har oy to'lanadi",
      description: "Ish izlovchilar va talabalar uchun maxsus.",
      features: [
        { name: "Cheksiz ATS premium shablonlar", included: true },
        { name: "Kuniga cheksiz AI orqali generatsiya", included: true },
        { name: "Kengaytirilgan PDF asboblari", included: true },
        { name: "AI CV Analyzer (Resume tahlili)", included: true },
        { name: "To'liq Cover Letter generatori", included: true },
        { name: "IELTS Mock testlar va AI Feedback", included: false },
      ],
      cta: "Pro'ga o'tish",
      ctaHref: "/checkout?plan=pro",
    },
    {
      name: "PREMIUM",
      title: "Premium",
      price: isYearly ? "758,400" : "79,000",
      period: isYearly ? "/ Yil" : "/ Oy",
      billingDetails: isYearly ? "Oyiga 63,200 so'm dan aylanadi" : "Har oy to'lanadi",
      description: "To'liq professional xizmatlar to'plami.",
      features: [
        { name: "Barcha PRO imkoniyatlar", included: true },
        { name: "To'liq IELTS Mock + AI Score & Feedback", included: true },
        { name: "OCR (Rasmdan matn ajratib olish)", included: true },
        { name: "Ustuvor texnik qo'llab-quvvatlash", included: true },
        { name: "Umuman reklamasiz toza interfeys", included: true },
        { name: "Erta yangilanishlarga kirish", included: true },
      ],
      cta: "Premium olish",
      ctaHref: "/checkout?plan=premium",
    }
  ];

  return (
    <div className="min-h-screen bg-background py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-cyan-900/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-purple-900/20 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight mb-4">
            Oddiy va shaffof <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">tariflar</span>
          </h1>
          <p className="text-lg text-foreground-secondary mb-10">
            Faoliyatingizga mos keladigan tarifni tanlang. Yashirin to'lovlar yo'q. Istalgan vaqtda bekor qilishingiz mumkin.
          </p>

          {/* Toggle Switch */}
          <div className="relative flex items-center p-1.5 bg-surface/50 border border-border/50 rounded-full mx-auto w-fit mb-4 shadow-inner backdrop-blur-sm">
            <button
              onClick={() => setIsYearly(false)}
              className={cn(
                "relative px-8 py-2.5 text-sm font-semibold transition-colors rounded-full z-10",
                !isYearly ? "text-foreground" : "text-foreground-secondary hover:text-foreground"
              )}
            >
              {!isYearly && (
                <motion.div
                  layoutId="pricing-toggle"
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
                  layoutId="pricing-toggle"
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
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={cn(
                "relative rounded-3xl p-8 flex flex-col h-full transition-all duration-300",
                plan.name === "PRO"
                  ? "bg-surface-elevated border border-cyan-500/30 shadow-[0_0_25px_rgba(0,180,216,0.2)] hover:shadow-[0_0_35px_rgba(0,180,216,0.3)] z-10"
                  : plan.name === "PREMIUM"
                  ? "bg-surface border border-purple-500/30 shadow-[0_0_25px_rgba(168,85,247,0.1)] hover:shadow-[0_0_35px_rgba(168,85,247,0.2)] z-0"
                  : "bg-surface/30 border border-border/40 hover:border-border/80 z-0"
              )}
            >
              {/* Badges */}
              {plan.name === "PRO" && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full shadow-lg flex items-center gap-1 border border-cyan-400/30">
                    <Sparkles className="h-3 w-3" /> ★ MOST POPULAR
                  </span>
                </div>
              )}
              {plan.name === "PREMIUM" && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full shadow-lg flex items-center gap-1 border border-purple-400/30">
                    <Zap className="h-3 w-3" /> ⚡ PREMIUM +
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-foreground mb-2">{plan.title}</h3>
                <p className="text-sm text-foreground-secondary min-h-[40px]">{plan.description}</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-foreground">{plan.price}</span>
                  {plan.price !== "0" && <span className="text-lg text-foreground-secondary">so'm</span>}
                  {plan.period && <span className="text-lg text-foreground-secondary">{plan.period}</span>}
                </div>
                {plan.billingDetails && (
                  <p className={cn(
                    "text-sm font-medium mt-2",
                    plan.name === "PRO" ? "text-cyan-400/80" : plan.name === "PREMIUM" ? "text-purple-400/80" : "text-foreground-muted"
                  )}>
                    {plan.billingDetails}
                  </p>
                )}
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    {feature.included ? (
                      <div className={cn(
                        "mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center border",
                        plan.name === "PRO" 
                          ? "bg-cyan-500/10 border-cyan-500/30" 
                          : plan.name === "PREMIUM" 
                          ? "bg-purple-500/10 border-purple-500/30" 
                          : "bg-primary/10 border-primary/20"
                      )}>
                        <Check className={cn(
                          "h-3 w-3",
                          plan.name === "PRO" ? "text-cyan-400" : plan.name === "PREMIUM" ? "text-purple-400" : "text-primary"
                        )} />
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

              <a
                href={plan.ctaHref}
                className={cn(
                  "w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center transition-all duration-300 mt-auto",
                  plan.name === "PRO"
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_4px_14px_0_rgba(0,180,216,0.39)] hover:shadow-[0_6px_20px_rgba(0,180,216,0.23)] hover:-translate-y-0.5"
                    : plan.name === "PREMIUM"
                    ? "bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white shadow-[0_4px_14px_0_rgba(168,85,247,0.39)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.23)] hover:-translate-y-0.5"
                    : "bg-surface-elevated text-foreground border border-border hover:bg-surface-elevated/80 hover:text-foreground"
                )}
              >
                {plan.cta}
              </a>
            </motion.div>
          ))}
        </div>

        {/* Payment Systems Placeholder */}
        <div className="mt-20 pt-10 border-t border-border/50 relative z-10">
          <p className="text-center text-sm font-medium text-foreground-secondary mb-6">
            Quyidagi to'lov tizimlari orqali ishonchli va xavfsiz to'lang
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="flex items-center gap-2 font-bold text-xl text-foreground">
              <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center text-white">C</div>
              Click
            </div>
            <div className="flex items-center gap-2 font-bold text-xl text-foreground">
              <div className="w-8 h-8 rounded bg-teal-500 flex items-center justify-center text-white">P</div>
              Payme
            </div>
            <div className="flex items-center gap-2 font-bold text-xl text-foreground">
              <div className="w-8 h-8 rounded bg-purple-600 flex items-center justify-center text-white">U</div>
              Uzum Bank
            </div>
            <div className="flex items-center gap-2 font-bold text-xl text-foreground">
              <div className="w-8 h-8 rounded bg-indigo-500 flex items-center justify-center text-white">S</div>
              Stripe
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
