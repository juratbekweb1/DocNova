"use client";

import React, { useState } from "react";
import { useRecentTool } from "@/hooks/useRecentTool";
import { BarChart, CheckCircle2, AlertTriangle, Loader2, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UpgradeModal } from "@/components/modals/upgrade-modal";

export default function CvAnalyzerPage() {
  useRecentTool("cv-analyzer", "Cv Analyzer", "Tools Hub", "/tools/cv-analyzer");

  const [cvText, setCvText] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  interface CvAnalyzerResult {
    score: number;
    strengths: string[];
    weaknesses: string[];
    tips: string[];
  }

  const [result, setResult] = useState<CvAnalyzerResult | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");

  const handleAnalyze = async () => {
    if (!cvText.trim()) return;

    setIsAnalyzing(true);
    setResult(null);
    try {
      const res = await fetch("/api/ai/cv-analyzer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvText, jobDescription: jobDesc }),
      });

      const data = await res.json();

      if (res.status === 403) {
        if (data.upgradeMessage) setUpgradeMessage(data.upgradeMessage);
        setShowUpgrade(true);
        setIsAnalyzing(false);
        return;
      }

      if (!res.ok) throw new Error("Failed to analyze");

      if (data.warningMessage) {
        alert(data.warningMessage);
      }
      setResult(data);
    } catch (error) {
      console.error(error);
      alert("Something went wrong during analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-background min-h-screen px-6 py-12">
      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        customMessage={upgradeMessage}
      />

      <div className="mx-auto mt-16 max-w-4xl">
        {!result ? (
          <div className="flex flex-col items-center justify-center">
            <div className="bg-primary/10 border-primary/20 mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl border">
              <BarChart className="text-primary h-10 w-10" />
            </div>
            <h1 className="text-foreground mb-4 text-center text-4xl font-extrabold">
              CV Analyzer
            </h1>
            <p className="text-foreground-secondary mb-12 max-w-2xl text-center text-lg">
              Paste your CV text and optionally a Job Description. Our AI will score it and provide
              actionable feedback.
            </p>

            <div className="bg-surface border-border mb-12 w-full max-w-2xl space-y-6 rounded-3xl border p-8 shadow-lg">
              <div>
                <label className="text-foreground mb-2 block text-sm font-bold">
                  Resume / CV Text *
                </label>
                <textarea
                  value={cvText}
                  onChange={(e) => setCvText(e.target.value)}
                  placeholder="Paste your entire resume text here..."
                  className="bg-background border-border text-foreground focus:border-primary/50 focus:ring-primary/50 h-48 w-full resize-none rounded-xl border p-4 text-sm outline-none focus:ring-1"
                />
              </div>

              <div>
                <label className="text-foreground mb-2 block text-sm font-bold">
                  Job Description (Optional)
                </label>
                <textarea
                  value={jobDesc}
                  onChange={(e) => setJobDesc(e.target.value)}
                  placeholder="Paste the job description you are targeting..."
                  className="bg-background border-border text-foreground focus:border-primary/50 focus:ring-primary/50 h-32 w-full resize-none rounded-xl border p-4 text-sm outline-none focus:ring-1"
                />
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={!cvText.trim() || isAnalyzing}
                className="bg-primary hover:bg-primary/90 text-primary-foreground w-full rounded-xl py-6 text-base font-bold shadow-[0_0_20px_-5px_rgba(56,189,248,0.4)] disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" /> Analyze My CV
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <button
              onClick={() => setResult(null)}
              className="text-foreground-muted hover:text-foreground mb-8 flex items-center text-sm font-medium transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Analyzer
            </button>

            <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
              {/* Score Card */}
              <div className="bg-surface border-border relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border p-8 text-center shadow-lg">
                <div className="from-primary to-accent absolute top-0 h-1 w-full bg-gradient-to-r" />
                <h3 className="text-foreground-muted mb-6 text-sm font-bold tracking-wider uppercase">
                  Overall ATS Score
                </h3>

                <div className="relative mb-6 flex h-40 w-40 items-center justify-center">
                  <svg
                    className="absolute inset-0 h-full w-full -rotate-90 transform"
                    viewBox="0 0 36 36"
                  >
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="rgba(255,255,255,0.05)"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke={
                        result.score >= 80 ? "#10b981" : result.score >= 50 ? "#f59e0b" : "#ef4444"
                      }
                      strokeWidth="3"
                      strokeDasharray={`${result.score}, 100`}
                      className="drop-shadow-lg"
                    />
                  </svg>
                  <span className="text-foreground text-5xl font-black drop-shadow-md">
                    {result.score}
                  </span>
                </div>
                <p className="text-foreground-secondary text-sm">
                  {result.score >= 80
                    ? "Great job! Your CV is well optimized."
                    : "Needs improvement to pass ATS filters."}
                </p>
              </div>

              {/* Feedback Details */}
              <div className="space-y-6">
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6">
                  <h4 className="mb-4 flex items-center font-bold text-emerald-400">
                    <CheckCircle2 className="mr-2 h-5 w-5" /> Strengths
                  </h4>
                  <ul className="space-y-2">
                    {result.strengths?.map((item: string, i: number) => (
                      <li key={i} className="flex items-start text-sm text-emerald-100/80">
                        <span className="mt-1 mr-2 block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />{" "}
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
                  <h4 className="mb-4 flex items-center font-bold text-red-400">
                    <AlertTriangle className="mr-2 h-5 w-5" /> Weaknesses
                  </h4>
                  <ul className="space-y-2">
                    {result.weaknesses?.map((item: string, i: number) => (
                      <li key={i} className="flex items-start text-sm text-red-100/80">
                        <span className="mt-1 mr-2 block h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />{" "}
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-surface-elevated border-border rounded-2xl border p-6">
                  <h4 className="text-primary mb-4 flex items-center font-bold">
                    <Sparkles className="mr-2 h-5 w-5" /> Improvement Tips
                  </h4>
                  <ul className="space-y-2">
                    {result.tips?.map((item: string, i: number) => (
                      <li key={i} className="text-foreground-secondary flex items-start text-sm">
                        <span className="bg-primary mt-1 mr-2 block h-1.5 w-1.5 shrink-0 rounded-full" />{" "}
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
