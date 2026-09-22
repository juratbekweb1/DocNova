"use client";

import React, { useState } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, ChevronRight, FileText, Loader2, Target, Zap } from "lucide-react";
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

const ScoreRing = ({ score, label, color = "text-primary" }: { score: number, label: string, color?: string }) => {
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
        <div className="absolute text-xl font-bold text-foreground">{score}%</div>
      </div>
      <p className="mt-3 text-sm font-medium text-foreground-secondary">{label}</p>
    </div>
  );
};

export default function AtsAnalyzerPage() {
  const { t } = useLanguage() as any;
  const { toast } = useToast();
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AtsAnalysisData | null>(null);

  const handleAnalyze = async () => {
    if (!resumeText.trim()) {
      toast({
        title: "Error",
        description: t.pasteResume || "Please paste your resume text",
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t.atsAnalyzerTitle || "ATS Resume Analyzer"}</h1>
          <p className="mt-2 text-foreground-secondary">
            {t.atsDesc || "Paste your resume and instantly see how it performs against Applicant Tracking Systems used by Fortune 500 companies."}
          </p>
        </div>

        {!analysis ? (
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="flex flex-col border-border bg-surface p-6 shadow-sm">
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                <FileText className="h-4 w-4 text-primary" /> {t.pasteResume || "Resume Text"}
              </label>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder={t.atsPlaceholder || "Paste your full resume text here..."}
                className="flex-1 resize-none rounded-xl border border-border bg-surface-elevated p-4 text-sm text-foreground placeholder:text-foreground-secondary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[300px]"
              />
            </Card>

            <Card className="flex flex-col border-border bg-surface p-6 shadow-sm">
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Target className="h-4 w-4 text-amber-500" /> {t.jobDescription || "Job Description (Optional)"}
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the target job description here to check for keyword matches..."
                className="flex-1 resize-none rounded-xl border border-border bg-surface-elevated p-4 text-sm text-foreground placeholder:text-foreground-secondary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[300px]"
              />
            </Card>

            <div className="col-span-full flex justify-end">
              <Button 
                size="lg" 
                onClick={handleAnalyze} 
                disabled={isAnalyzing}
                className="w-full sm:w-auto min-w-[200px]"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {t.analyzing || "Analyzing..."}
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-5 w-5" />
                    {t.analyzeResume || "Analyze Resume"}
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
                  <ScoreRing score={analysis.overallScore} label={t.overallScore || "Overall Score"} color="text-primary" />
                </Card>
                <Card className="border-border bg-surface shadow-sm">
                  <ScoreRing score={analysis.keywordScore} label={t.keywordScore || "Keyword Score"} color="text-emerald-500" />
                </Card>
                <Card className="border-border bg-surface shadow-sm">
                  <ScoreRing score={analysis.formatScore} label={t.formatScore || "Format Score"} color="text-blue-500" />
                </Card>
                <Card className="border-border bg-surface shadow-sm">
                  <ScoreRing score={analysis.completenessScore} label={t.completenessScore || "Completeness"} color="text-violet-500" />
                </Card>
              </div>

              {/* Feedback Sections */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Critical Fixes */}
                <Card className="border-error/20 bg-error/5 p-6 shadow-sm">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-error">
                    <AlertCircle className="h-5 w-5" /> {t.criticalFixes || "Critical Fixes"}
                  </h3>
                  <ul className="space-y-3">
                    {analysis.criticalFixes.length > 0 ? analysis.criticalFixes.map((fix, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-foreground-secondary">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-error/20 text-[10px] font-bold text-error">{i + 1}</span>
                        {fix}
                      </li>
                    )) : (
                      <li className="text-sm text-success">No critical formatting issues found!</li>
                    )}
                  </ul>
                </Card>

                {/* Missing Keywords */}
                <Card className="border-amber-500/20 bg-amber-500/5 p-6 shadow-sm">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-amber-500">
                    <Target className="h-5 w-5" /> {t.missingKeywords || "Missing Keywords"}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.missingKeywords.length > 0 ? analysis.missingKeywords.map((keyword, i) => (
                      <span key={i} className="rounded-md border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                        {keyword}
                      </span>
                    )) : (
                      <span className="text-sm text-success">Great keyword coverage!</span>
                    )}
                  </div>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Strengths */}
                <Card className="border-emerald-500/20 bg-emerald-500/5 p-6 shadow-sm">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-emerald-500">
                    <CheckCircle2 className="h-5 w-5" /> {t.strengths || "Strengths"}
                  </h3>
                  <ul className="space-y-3">
                    {analysis.strengths.map((str, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-foreground-secondary">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        {str}
                      </li>
                    ))}
                  </ul>
                </Card>

                {/* AI Summary */}
                <Card className="border-border bg-surface p-6 shadow-sm">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-primary">
                    <Zap className="h-5 w-5" /> AI Summary
                  </h3>
                  <p className="text-sm leading-relaxed text-foreground-secondary">
                    {analysis.summary}
                  </p>
                  
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Button onClick={() => setAnalysis(null)} variant="outline" className="flex-1">
                      {t.reset || "Scan Another Resume"}
                    </Button>
                    <Button className="flex-1">
                      {t.applyAI || "Apply AI Fixes"} <ChevronRight className="ml-2 h-4 w-4" />
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


