"use client";

import React, { useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  FileText,
  Loader2,
  Target,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useToast } from "@/hooks/use-toast";

interface AtsAnalysisData {
  overallScore: number;
  keywordScore: number;
  formatScore: number;
  completenessScore: number;
  summary: string;
  missingKeywords: string[];
  criticalFixes: string[];
  strengths: string[];
  improvementSuggestions: string[];
}

const ScoreRing = ({
  score,
  label,
  color = "text-primary",
}: {
  score: number;
  label: string;
  color?: string;
}) => {
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative flex items-center justify-center">
        <svg className="h-24 w-24 -rotate-90 transform" viewBox="0 0 80 80">
          <circle
            className="text-border"
            strokeWidth="6"
            stroke="currentColor"
            fill="transparent"
            r="36"
            cx="40"
            cy="40"
          />
          <circle
            className={color}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="36"
            cx="40"
            cy="40"
            style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
          />
        </svg>
        <div className="text-foreground absolute text-xl font-bold">{score}%</div>
      </div>
      <p className="text-foreground-secondary mt-3 text-sm font-medium">{label}</p>
    </div>
  );
};

export default function AtsAnalyzerPage() {
  const { toast } = useToast();
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AtsAnalysisData | null>(null);

  const handleAnalyze = async () => {
    if (!resumeText.trim()) {
      toast({
        title: "Xatolik",
        description: "Iltimos, rezyume matnini kiriting",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/ai/ats-analyzer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze resume");
      }

      setAnalysis(data.data.feedback);
      toast({
        title: "Success",
        description: "Analysis complete!",
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <DashboardShell>
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <h1 className="text-foreground text-3xl font-bold tracking-tight">ATS Rezyume Tahlili</h1>
          <p className="text-foreground-secondary mt-2">
            Rezyumengizni kiriting va u Fortune 500 kompaniyalari qo&apos;llaydigan Applicant
            Tracking System (ATS) tizimlari talablariga qanchalik mos kelishini tekshiring.
          </p>
        </div>

        {!analysis ? (
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border bg-surface flex flex-col p-6 shadow-sm">
              <label className="text-foreground mb-2 flex items-center gap-2 text-sm font-semibold">
                <FileText className="text-primary h-4 w-4" /> Rezyume matni
              </label>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Rezyumengiz matnini bu yerga nusxalang yoki yozing..."
                className="border-border bg-surface-elevated text-foreground placeholder:text-foreground-secondary/50 focus:border-primary focus:ring-primary min-h-[300px] flex-1 resize-none rounded-xl border p-4 text-sm focus:ring-1 focus:outline-none"
              />
            </Card>

            <Card className="border-border bg-surface flex flex-col p-6 shadow-sm">
              <label className="text-foreground mb-2 flex items-center gap-2 text-sm font-semibold">
                <Target className="h-4 w-4 text-amber-500" /> Vakansiya / Ish talablari (Ixtiyoriy)
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Vakansiyadagi talablar va kalit so'zlarni solishtirish uchun ish tavsifini kiriting..."
                className="border-border bg-surface-elevated text-foreground placeholder:text-foreground-secondary/50 focus:border-primary focus:ring-primary min-h-[300px] flex-1 resize-none rounded-xl border p-4 text-sm focus:ring-1 focus:outline-none"
              />
            </Card>

            <div className="col-span-full flex justify-end">
              <Button
                size="lg"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full min-w-[200px] sm:w-auto"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Tahlil qilinmoqda...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-5 w-5" />
                    Rezyumeni tahlil qilish
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Score Dashboard */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-border bg-surface shadow-sm">
                  <ScoreRing
                    score={analysis.overallScore}
                    label="Umumiy ball"
                    color="text-primary"
                  />
                </Card>
                <Card className="border-border bg-surface shadow-sm">
                  <ScoreRing
                    score={analysis.keywordScore}
                    label="Kalit so'zlar"
                    color="text-emerald-500"
                  />
                </Card>
                <Card className="border-border bg-surface shadow-sm">
                  <ScoreRing
                    score={analysis.formatScore}
                    label="Format & Struktura"
                    color="text-blue-500"
                  />
                </Card>
                <Card className="border-border bg-surface shadow-sm">
                  <ScoreRing
                    score={analysis.completenessScore}
                    label="To'liqlik"
                    color="text-violet-500"
                  />
                </Card>
              </div>

              {/* Feedback Sections */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Critical Fixes */}
                <Card className="border-error/20 bg-error/5 p-6 shadow-sm">
                  <h3 className="text-error mb-4 flex items-center gap-2 text-lg font-bold">
                    <AlertCircle className="h-5 w-5" /> Kritik kamchiliklar
                  </h3>
                  <ul className="space-y-3">
                    {analysis.criticalFixes.length > 0 ? (
                      analysis.criticalFixes.map((fix, i) => (
                        <li
                          key={i}
                          className="text-foreground-secondary flex items-start gap-3 text-sm"
                        >
                          <span className="bg-error/20 text-error mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                            {i + 1}
                          </span>
                          {fix}
                        </li>
                      ))
                    ) : (
                      <li className="text-success text-sm">Hech qanday format xatosi topilmadi!</li>
                    )}
                  </ul>
                </Card>

                {/* Missing Keywords */}
                <Card className="border-amber-500/20 bg-amber-500/5 p-6 shadow-sm">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-amber-500">
                    <Target className="h-5 w-5" /> Yetishmayotgan kalit so&apos;zlar
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.missingKeywords.length > 0 ? (
                      analysis.missingKeywords.map((keyword, i) => (
                        <span
                          key={i}
                          className="rounded-md border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400"
                        >
                          {keyword}
                        </span>
                      ))
                    ) : (
                      <span className="text-success text-sm">
                        Kalit so&apos;zlar mukammal qamrab olingan!
                      </span>
                    )}
                  </div>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Strengths */}
                <Card className="border-emerald-500/20 bg-emerald-500/5 p-6 shadow-sm">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-emerald-500">
                    <CheckCircle2 className="h-5 w-5" /> Kuchli tomonlar
                  </h3>
                  <ul className="space-y-3">
                    {analysis.strengths.map((str, i) => (
                      <li
                        key={i}
                        className="text-foreground-secondary flex items-start gap-3 text-sm"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        {str}
                      </li>
                    ))}
                  </ul>
                </Card>

                {/* AI Summary */}
                <Card className="border-border bg-surface p-6 shadow-sm">
                  <h3 className="text-primary mb-4 flex items-center gap-2 text-lg font-bold">
                    <Zap className="h-5 w-5" /> AI Xulosa
                  </h3>
                  <p className="text-foreground-secondary text-sm leading-relaxed">
                    {analysis.summary}
                  </p>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Button onClick={() => setAnalysis(null)} variant="outline" className="flex-1">
                      Boshqa rezyumeni tekshirish
                    </Button>
                    <Button className="flex-1">
                      AI bilan tuzatish <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </DashboardShell>
  );
}
