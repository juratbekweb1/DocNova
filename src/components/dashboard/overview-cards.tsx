"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  Shield,
  Sparkles,
  FileText,
  GraduationCap,
  Presentation,
  PenTool,
  AlertTriangle,
  Crown,
  ArrowUpRight,
} from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import { format } from "date-fns";
import type { SectionLimitStat } from "@/lib/limits";

interface OverviewCardsProps {
  subscription: {
    planSlug?: string | null;
    expiresAt?: Date | string | null;
  };
  limitsCount?: number;
  maxAi: number | "Unlimited";
  cvCount?: number;
  maxCv: number | "Unlimited";
  ieltsCount?: number;
  maxIelts: number | "Unlimited";
  courseworkUsed?: number;
  courseworkMax?: number | "Unlimited";
  sectionLimits?: SectionLimitStat[];
}

export function OverviewCards({
  subscription,
  limitsCount = 0,
  maxAi,
  cvCount = 0,
  maxCv,
  ieltsCount = 0,
  maxIelts,
  sectionLimits = [],
}: OverviewCardsProps) {
  const { t } = useLanguage();

  const formatRemaining = (used: number = 0, max: number | "Unlimited") => {
    if (max === "Unlimited") return "Cheksiz (∞)";
    const rem = Math.max(0, max - used);
    return `${rem}/${max} ta qoldi`;
  };

  const getSectionIcon = (id: string) => {
    switch (id) {
      case "coursework":
        return GraduationCap;
      case "presentation":
        return Presentation;
      case "document_generation":
        return Sparkles;
      case "resume_analysis":
        return FileText;
      case "rewrite":
        return PenTool;
      default:
        return GraduationCap;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Active Plan */}
        <Card className="bg-surface border-border relative overflow-hidden rounded-2xl shadow-sm">
          <div className="from-primary/10 pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent" />
          <CardContent className="relative z-10 flex h-full flex-col items-center justify-center p-5 text-center sm:p-6">
            <Shield className="text-primary mb-2 h-7 w-7 shrink-0 sm:h-8 sm:w-8" />
            <p className="text-foreground-secondary mb-1 text-xs font-medium sm:text-sm">
              {t.activePlanLabel || "Joriy Tarif"}
            </p>
            <h3 className="text-foreground text-xl font-bold whitespace-nowrap capitalize sm:text-2xl">
              {subscription.planSlug === "premium"
                ? t.planPremium || "Premium"
                : subscription.planSlug === "pro"
                  ? t.planPro || "Pro"
                  : t.planFree || "Free"}
            </h3>
            {subscription.expiresAt ? (
              <p className="text-foreground-muted mt-2 max-w-full truncate text-xs">
                Muddati: {format(new Date(subscription.expiresAt), "MMM d, yyyy")}
              </p>
            ) : (
              <Link
                href="/checkout"
                className="text-primary mt-2 inline-flex items-center gap-1 text-xs font-semibold hover:underline"
              >
                <Crown className="h-3.5 w-3.5" />
                Tarifni oshirish
              </Link>
            )}
          </CardContent>
        </Card>

        {/* 2. AI Generations */}
        <Card className="bg-surface border-border relative overflow-hidden rounded-2xl shadow-sm">
          <CardContent className="flex h-full flex-col justify-between p-5 sm:p-6">
            <div className="mb-3 flex items-start justify-between gap-2">
              <p className="text-foreground-secondary truncate text-xs font-medium sm:text-sm">
                {t.aiGenerationsLabel || "AI Yaratishlar"}
              </p>
              <div className="shrink-0 rounded-lg bg-blue-500/10 p-2 text-blue-400">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
            <h3 className="text-foreground text-xl font-extrabold tracking-tight whitespace-nowrap sm:text-2xl">
              {formatRemaining(limitsCount, maxAi)}
            </h3>
          </CardContent>
        </Card>

        {/* 3. CV Analyzer */}
        <Card className="bg-surface border-border relative overflow-hidden rounded-2xl shadow-sm">
          <CardContent className="flex h-full flex-col justify-between p-5 sm:p-6">
            <div className="mb-3 flex items-start justify-between gap-2">
              <p className="text-foreground-secondary truncate text-xs font-medium sm:text-sm">
                {t.cvAnalyzerLabel || "CV Tahlili"}
              </p>
              <div className="shrink-0 rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <h3 className="text-foreground text-xl font-extrabold tracking-tight whitespace-nowrap sm:text-2xl">
              {formatRemaining(cvCount, maxCv)}
            </h3>
          </CardContent>
        </Card>

        {/* 4. IELTS Mocks */}
        <Card className="bg-surface border-border relative overflow-hidden rounded-2xl shadow-sm">
          <CardContent className="flex h-full flex-col justify-between p-5 sm:p-6">
            <div className="mb-3 flex items-start justify-between gap-2">
              <p className="text-foreground-secondary truncate text-xs font-medium sm:text-sm">
                {t.ieltsMocksLabel || "IELTS / Mock Test"}
              </p>
              <div className="shrink-0 rounded-lg bg-violet-500/10 p-2 text-violet-400">
                <GraduationCap className="h-4 w-4" />
              </div>
            </div>
            <h3 className="text-foreground text-xl font-extrabold tracking-tight whitespace-nowrap sm:text-2xl">
              {formatRemaining(ieltsCount, maxIelts)}
            </h3>
          </CardContent>
        </Card>
      </div>

      {/* Section-by-Section Limit Breakdown */}
      {sectionLimits.length > 0 && (
        <Card className="bg-surface border-border overflow-hidden rounded-2xl shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-foreground text-base font-bold sm:text-lg">
                  Bo&apos;limlar bo&apos;yicha limitlar statistikasi
                </h3>
                <p className="text-foreground-secondary text-xs sm:text-sm">
                  Har bir modul bo&apos;yicha joriy oylik qolgan generatsiya kvotalaringiz
                </p>
              </div>
              <Link
                href="/checkout"
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold shadow-sm transition-all"
              >
                <Crown className="h-3.5 w-3.5" />
                <span>Obuna bo&apos;lish / Tarifni oshirish</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sectionLimits.map((item) => {
                const Icon = getSectionIcon(item.id);
                const isExhausted = !item.unlimited && item.remaining <= 0;
                const percentRemaining = item.unlimited
                  ? 100
                  : item.total > 0
                    ? Math.round((item.remaining / item.total) * 100)
                    : 0;

                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-4 transition-all ${
                      isExhausted
                        ? "border-red-500/40 bg-red-500/5"
                        : "border-border bg-surface-elevated/40"
                    }`}
                  >
                    <div className="mb-2.5 flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`rounded-lg p-2 ${
                            isExhausted
                              ? "bg-red-500/15 text-red-400"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <Link
                            href={item.href}
                            className="text-foreground hover:text-primary flex items-center gap-1 text-xs font-bold transition-colors sm:text-sm"
                          >
                            <span>{item.title}</span>
                            <ArrowUpRight className="h-3 w-3 opacity-60" />
                          </Link>
                          <p className="text-foreground-muted text-[11px]">
                            Ishlatildi: {item.used} ta
                          </p>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-extrabold ${
                          item.unlimited
                            ? "bg-emerald-500/15 text-emerald-400"
                            : isExhausted
                              ? "bg-red-500/15 text-red-400"
                              : percentRemaining <= 35
                                ? "bg-amber-500/15 text-amber-400"
                                : "bg-emerald-500/15 text-emerald-400"
                        }`}
                      >
                        {item.unlimited
                          ? "Cheksiz (∞)"
                          : `${item.remaining}/${item.total} ta qoldi`}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="bg-border/60 h-2 w-full overflow-hidden rounded-full">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.unlimited
                            ? "bg-emerald-500"
                            : isExhausted
                              ? "bg-red-500"
                              : percentRemaining <= 35
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                        }`}
                        style={{
                          width: `${item.unlimited ? 100 : Math.max(4, percentRemaining)}%`,
                        }}
                      />
                    </div>

                    {isExhausted && (
                      <div className="mt-2.5 flex items-center justify-between gap-2 text-[11px] text-red-400">
                        <span className="flex items-center gap-1 font-medium">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          Limitingiz tugadi!
                        </span>
                        <Link href="/checkout" className="font-bold underline hover:text-red-300">
                          Obuna bo&apos;lish →
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
