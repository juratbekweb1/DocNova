"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  CheckCircle2,
  Sparkles,
  ChevronLeft,
  RotateCcw,
  Printer,
  Award,
  BookOpen,
  Send,
  Loader2,
} from "lucide-react";
import { StudentSubNav } from "@/components/academic/student-sub-nav";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: string;
  category: string;
  question: string;
  options: { key: string; text: string }[];
  correctKey: string;
}

const ENGLISH_QUESTIONS: Question[] = [
  {
    id: "q1",
    category: "Grammar: Conditionals",
    question:
      "If the government ______ stricter emissions regulations earlier, air pollution levels in metropolitan areas would be considerably lower today.",
    options: [
      { key: "A", text: "enacted" },
      { key: "B", text: "had enacted" },
      { key: "C", text: "will enact" },
      { key: "D", text: "would have enacted" },
    ],
    correctKey: "B",
  },
  {
    id: "q2",
    category: "Lexis: Academic Collocations",
    question:
      "The researcher presented a compelling thesis that ran ______ to the conventional economic theories of the decade.",
    options: [
      { key: "A", text: "opposite" },
      { key: "B", text: "reverse" },
      { key: "C", text: "counter" },
      { key: "D", text: "contradiction" },
    ],
    correctKey: "C",
  },
  {
    id: "q3",
    category: "Advanced Structure: Inversion",
    question:
      "Not only ______ the strict deadline for the research grant submission, but she also secured supplementary funding for the department.",
    options: [
      { key: "A", text: "did she meet" },
      { key: "B", text: "she met" },
      { key: "C", text: "she has met" },
      { key: "D", text: "had she meet" },
    ],
    correctKey: "A",
  },
  {
    id: "q4",
    category: "Vocabulary: Academic Register",
    question:
      "The full integration of the automated logistics framework yielded a ______ improvement in overall supply-chain efficiency.",
    options: [
      { key: "A", text: "substantial-like" },
      { key: "B", text: "big-time" },
      { key: "C", text: "gigantic" },
      { key: "D", text: "substantial" },
    ],
    correctKey: "D",
  },
  {
    id: "q5",
    category: "Reading Comprehension & Inference",
    question:
      "The recent study reveals that while remote academic work enhances student autonomy, it may inadvertently ______ collaborative peer synergy if left unmanaged.",
    options: [
      { key: "A", text: "accelerate" },
      { key: "B", text: "undermine" },
      { key: "C", text: "bolster" },
      { key: "D", text: "rectify" },
    ],
    correctKey: "B",
  },
];

interface AIResult {
  overallScore: number;
  bandScore: string;
  cefrLevel: string;
  grammarScore: number;
  vocabularyScore: number;
  readingScore: number;
  writingScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  summary: string;
}

export default function EnglishMockTestPage() {
  const { toast } = useToast();

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [writtenText, setWrittenText] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);

  // 15 minutes timer
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [timerActive, setTimerActive] = useState(true);

  useEffect(() => {
    if (!timerActive || result) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, result]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const answeredCount = Object.keys(answers).length;
  const progressPercent = Math.round((answeredCount / ENGLISH_QUESTIONS.length) * 100);

  const handleSelectAnswer = (qId: string, optionKey: string) => {
    if (result) return;
    setAnswers((prev) => ({ ...prev, [qId]: optionKey }));
  };

  const handleSubmitTest = async () => {
    if (answeredCount < 3 && !writtenText.trim()) {
      toast({
        title: "Iltimos, javoblarni belgilang",
        description: "AI aniq baholashi uchun kamida 3 ta test savoliga javob bering.",
        variant: "destructive",
      });
      return;
    }

    setIsEvaluating(true);
    setTimerActive(false);

    try {
      const res = await fetch("/api/ai/language-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: "EN",
          testType: "IELTS & CEFR",
          answers,
          writtenText,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Baholashda xatolik yuz berdi");
      }

      setResult(data);
      toast({
        title: "Test muvaffaqiyatli baholandi!",
        description: `Sizning natijangiz: ${data.bandScore}`,
      });
    } catch (err: unknown) {
      const e = err as Error;
      toast({
        title: "Baholashda xatolik",
        description: e.message || "Keyinroq qayta urinib ko'ring",
        variant: "destructive",
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setWrittenText("");
    setResult(null);
    setTimeLeft(15 * 60);
    setTimerActive(true);
  };

  return (
    <div className="bg-background text-foreground min-h-screen pb-20">
      <StudentSubNav activeTab="mock-test" />

      {/* Top Breadcrumb & Status Bar */}
      <div className="border-border bg-surface/40 border-b px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/academic/mock-test"
              className="text-foreground-secondary hover:text-foreground flex items-center gap-1.5 text-xs font-semibold transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Mock Testlar</span>
            </Link>
            <span className="text-foreground-muted">•</span>
            <div className="flex items-center gap-2">
              <span className="text-xl">🇬🇧</span>
              <span className="text-foreground text-sm font-bold">Ingliz tili (IELTS / CEFR)</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-surface border-border text-primary flex items-center gap-2 rounded-xl border px-3 py-1.5 font-mono text-xs font-bold">
              <Clock className="text-primary h-4 w-4" />
              <span>{formatTime(timeLeft)}</span>
            </div>
            <div className="text-foreground-secondary hidden text-xs font-medium sm:block">
              Progress:{" "}
              <span className="text-primary font-bold">
                {answeredCount}/{ENGLISH_QUESTIONS.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Progress meter */}
        <div className="mb-8">
          <div className="bg-surface-elevated h-1.5 w-full overflow-hidden rounded-full">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Section Title */}
        <div className="mb-8">
          <span className="text-primary bg-primary/10 rounded-md px-2.5 py-1 text-xs font-bold tracking-wider uppercase">
            Part 1: Grammar & Reading Comprehension
          </span>
          <h2 className="text-foreground mt-2 text-2xl font-bold">
            Ingliz tili leksik-grammatik sinovi
          </h2>
          <p className="text-foreground-secondary mt-1 text-xs sm:text-sm">
            Quyidagi har bir savol uchun eng to&apos;g&apos;ri variantni tanlang. Savollar xalqaro
            IELTS va CEFR B2/C1 imtihon bazasiga mos.
          </p>
        </div>

        {/* Questions List */}
        <div className="space-y-6">
          {ENGLISH_QUESTIONS.map((q, idx) => {
            const selectedKey = answers[q.id];
            const isAnswered = Boolean(selectedKey);

            return (
              <div
                key={q.id}
                className={`bg-surface rounded-2xl border p-5 transition-all sm:p-6 ${
                  isAnswered
                    ? "border-primary/40 shadow-sm"
                    : "border-border hover:border-border-hover"
                }`}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-foreground-muted flex items-center gap-2 text-xs font-bold">
                    <span className="bg-surface-elevated text-primary flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold">
                      {idx + 1}
                    </span>
                    <span>{q.category}</span>
                  </span>
                  {result && (
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-bold ${
                        selectedKey === q.correctKey
                          ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                          : "border border-red-500/20 bg-red-500/10 text-red-400"
                      }`}
                    >
                      {selectedKey === q.correctKey
                        ? "To'g'ri (✓)"
                        : `To'g'ri javob: ${q.correctKey}`}
                    </span>
                  )}
                </div>

                <p className="text-foreground mb-4 text-sm leading-relaxed font-medium sm:text-base">
                  {q.question}
                </p>

                {/* Options Grid */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {q.options.map((opt) => {
                    const isSelected = selectedKey === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => handleSelectAnswer(q.id, opt.key)}
                        disabled={Boolean(result)}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-left text-xs transition-all sm:text-sm ${
                          isSelected
                            ? "border-primary bg-primary/10 text-foreground font-semibold shadow-sm"
                            : "border-border bg-background hover:bg-surface-elevated text-foreground-secondary hover:text-foreground"
                        }`}
                      >
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-surface-elevated text-foreground-muted"
                          }`}
                        >
                          {opt.key}
                        </span>
                        <span className="leading-snug">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Section 2: Writing task */}
        <div className="border-border bg-surface mt-10 rounded-2xl border p-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="rounded-md bg-purple-500/10 px-2.5 py-1 text-xs font-bold tracking-wider text-purple-400 uppercase">
              Part 2: Mini Writing Task (IELTS Task 2)
            </span>
            <span className="text-foreground-muted text-xs">Ixtiyoriy, lekin tavsiya etiladi</span>
          </div>
          <h3 className="text-foreground mb-1 text-base font-bold">Insho / Yozma fikr bildirish</h3>
          <p className="text-foreground-secondary mb-4 text-xs leading-relaxed sm:text-sm">
            <strong>Topic:</strong> &quot;Some educators believe university students should freely
            utilize generative AI for their academic assignments, while others fear it erodes
            critical reasoning. What is your stance?&quot; (Ingliz tilida 3-5 ta jumla yozing).
          </p>

          <textarea
            rows={4}
            value={writtenText}
            onChange={(e) => setWrittenText(e.target.value)}
            disabled={Boolean(result)}
            placeholder="Write your response in English here (e.g. In my perspective, generative AI serves as a powerful catalyst for academic research when paired with rigorous fact-checking...)"
            className="border-border bg-background text-foreground placeholder:text-foreground-muted focus:border-primary focus:ring-primary w-full rounded-xl border p-4 text-xs focus:ring-1 focus:outline-none sm:text-sm"
          />
        </div>

        {/* Action Button */}
        {!result && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleSubmitTest}
              disabled={isEvaluating}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/25 flex cursor-pointer items-center gap-2 rounded-2xl px-8 py-4 text-sm font-bold shadow-xl transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>AI darajangizni tahlil qilmoqda...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Natijani AI orqali baholash</span>
                  <Send className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        )}

        {/* AI Result Report Dashboard */}
        {result && (
          <div className="border-primary/40 from-surface via-surface to-background animate-in fade-in slide-in-from-bottom-4 mt-12 rounded-3xl border bg-gradient-to-b p-6 shadow-2xl duration-500 sm:p-8">
            <div className="border-border flex flex-col items-start justify-between gap-4 border-b pb-6 sm:flex-row sm:items-center">
              <div>
                <div className="text-primary bg-primary/10 mb-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold">
                  <Award className="h-4 w-4" />
                  <span>Rasmiy AI Baholash Hisoboti</span>
                </div>
                <h3 className="text-foreground text-2xl font-extrabold">
                  Ingliz tili Mock Test Natijasi
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  className="border-border bg-surface-elevated text-foreground hover:bg-border/60 flex cursor-pointer items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-semibold transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Qayta topshirish</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold shadow-sm transition-colors"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Chop etish</span>
                </button>
              </div>
            </div>

            {/* Score Cards Grid */}
            <div className="my-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="border-border bg-surface-elevated/60 rounded-2xl border p-4 text-center">
                <span className="text-foreground-muted text-[11px] font-bold tracking-wider uppercase">
                  Umumiy ball
                </span>
                <div className="text-primary mt-1 text-3xl font-extrabold">
                  {result.overallScore}%
                </div>
              </div>

              <div className="border-primary/30 bg-primary/10 rounded-2xl border p-4 text-center">
                <span className="text-primary text-[11px] font-bold tracking-wider uppercase">
                  IELTS / CEFR
                </span>
                <div className="text-primary mt-1 text-xl font-extrabold sm:text-2xl">
                  {result.bandScore}
                </div>
              </div>

              <div className="border-border bg-surface-elevated/60 rounded-2xl border p-4 text-center">
                <span className="text-foreground-muted text-[11px] font-bold tracking-wider uppercase">
                  Grammar
                </span>
                <div className="text-foreground mt-1 text-2xl font-extrabold">
                  {result.grammarScore}%
                </div>
              </div>

              <div className="border-border bg-surface-elevated/60 rounded-2xl border p-4 text-center">
                <span className="text-foreground-muted text-[11px] font-bold tracking-wider uppercase">
                  Vocabulary
                </span>
                <div className="text-foreground mt-1 text-2xl font-extrabold">
                  {result.vocabularyScore}%
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="border-border/80 bg-surface mb-6 rounded-2xl border p-5">
              <h4 className="text-primary mb-2 flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
                <Sparkles className="h-4 w-4" />
                <span>AI Xulosasi</span>
              </h4>
              <p className="text-foreground-secondary text-xs leading-relaxed sm:text-sm">
                {result.summary}
              </p>
            </div>

            {/* Strengths & Recommendations */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                <h4 className="mb-3 flex items-center gap-1.5 text-xs font-bold tracking-wider text-emerald-400 uppercase">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Kuchli tomonlaringiz</span>
                </h4>
                <ul className="text-foreground-secondary space-y-2 text-xs sm:text-sm">
                  {result.strengths.map((str, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-bold text-emerald-400">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">
                <h4 className="mb-3 flex items-center gap-1.5 text-xs font-bold tracking-wider text-blue-400 uppercase">
                  <BookOpen className="h-4 w-4" />
                  <span>Tavsiyalar va O&apos;sish nuqtalari</span>
                </h4>
                <ul className="text-foreground-secondary space-y-2 text-xs sm:text-sm">
                  {result.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-bold text-blue-400">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
