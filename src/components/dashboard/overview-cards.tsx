"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Shield, Sparkles, FileText, GraduationCap } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import { format } from "date-fns";

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
}

export function OverviewCards({
  subscription,
  limitsCount = 0,
  maxAi,
  cvCount = 0,
  maxCv,
  ieltsCount = 0,
  maxIelts,
}: OverviewCardsProps) {
  const { t } = useLanguage();

  const formatLimit = (used: number = 0, max: number | "Unlimited") =>
    max === "Unlimited" ? "∞" : `${used} / ${max}`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Active Plan */}
      <Card className="bg-surface border-border relative overflow-hidden rounded-2xl shadow-sm">
        <div className="from-primary/10 pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent" />
        <CardContent className="relative z-10 flex h-full flex-col items-center justify-center p-5 sm:p-6 text-center">
          <Shield className="text-primary mb-2 h-7 w-7 sm:h-8 sm:w-8 shrink-0" />
          <p className="text-foreground-secondary mb-1 text-xs sm:text-sm font-medium">
            {t.activePlanLabel || "Active Plan"}
          </p>
          <h3 className="text-foreground text-xl sm:text-2xl font-bold capitalize whitespace-nowrap">
            {subscription.planSlug === "premium"
              ? t.planPremium || "Premium"
              : subscription.planSlug === "pro"
                ? t.planPro || "Pro"
                : t.planFree || "Free"}
          </h3>
          {subscription.expiresAt && (
            <p className="text-foreground-muted mt-2 text-xs truncate max-w-full">
              Expires: {format(new Date(subscription.expiresAt), "MMM d, yyyy")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* 2. AI Generations */}
      <Card className="bg-surface border-border relative overflow-hidden rounded-2xl shadow-sm">
        <CardContent className="flex h-full flex-col justify-between p-5 sm:p-6">
          <div className="mb-3 flex items-start justify-between gap-2">
            <p className="text-foreground-secondary text-xs sm:text-sm font-medium truncate">
              {t.aiGenerationsLabel || "AI Generations"}
            </p>
            <div className="shrink-0 rounded-lg bg-blue-500/10 p-2 text-blue-400">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <h3 className="text-foreground text-2xl sm:text-3xl font-extrabold tracking-tight whitespace-nowrap">
            {formatLimit(limitsCount, maxAi)}
          </h3>
        </CardContent>
      </Card>

      {/* 3. CV Analyzer */}
      <Card className="bg-surface border-border relative overflow-hidden rounded-2xl shadow-sm">
        <CardContent className="flex h-full flex-col justify-between p-5 sm:p-6">
          <div className="mb-3 flex items-start justify-between gap-2">
            <p className="text-foreground-secondary text-xs sm:text-sm font-medium truncate">
              {t.cvAnalyzerLabel || "CV Analyzer"}
            </p>
            <div className="shrink-0 rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <h3 className="text-foreground text-2xl sm:text-3xl font-extrabold tracking-tight whitespace-nowrap">
            {formatLimit(cvCount, maxCv)}
          </h3>
        </CardContent>
      </Card>

      {/* 4. IELTS Mocks */}
      <Card className="bg-surface border-border relative overflow-hidden rounded-2xl shadow-sm">
        <CardContent className="flex h-full flex-col justify-between p-5 sm:p-6">
          <div className="mb-3 flex items-start justify-between gap-2">
            <p className="text-foreground-secondary text-xs sm:text-sm font-medium truncate">
              {t.ieltsMocksLabel || "IELTS Mocks"}
            </p>
            <div className="shrink-0 rounded-lg bg-violet-500/10 p-2 text-violet-400">
              <GraduationCap className="h-4 w-4" />
            </div>
          </div>
          <h3 className="text-foreground text-2xl sm:text-3xl font-extrabold tracking-tight whitespace-nowrap">
            {formatLimit(ieltsCount, maxIelts)}
          </h3>
        </CardContent>
      </Card>
    </div>
  );
}
