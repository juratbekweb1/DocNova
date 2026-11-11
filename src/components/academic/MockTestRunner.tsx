"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  ChevronLeft,
  RotateCcw,
  Printer,
  Award,
  BookOpen,
  Send,
  Loader2,
  HelpCircle,
  Lightbulb,
  Check,
  Languages,
  Zap,
  ArrowRight,
} from "lucide-react";
import { StudentSubNav } from "@/components/academic/student-sub-nav";
import { useToast } from "@/hooks/use-toast";
import {
  LanguageMockTestData,
  LanguageLevelDef,
  MockQuestion,
} from "@/lib/academic/mock-test-data";
import { evaluateMockTestLocally, AIResult } from "@/lib/academic/mock-test-evaluator";

interface MockTestRunnerProps {
  mockData: LanguageMockTestData;
  accentColor?: "blue" | "purple" | "emerald";
}

function LiveCountdownTimer({ active }: { active: boolean }) {
  const [timeLeft, setTimeLeft] = useState(15 * 60);

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [active]);

  const mins = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  const formatted = `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;

  return (
    <div
      className={`border-border bg-surface-elevated/80 flex items-center gap-2 rounded-xl border px-3 py-1.5 font-mono text-xs font-bold ${
        timeLeft < 180 ? "animate-pulse border-amber-500/50 text-amber-400" : "text-primary"
      }`}
    >
      <Clock className="h-3.5 w-3.5" />
      <span>{formatted}</span>
    </div>
  );
}

export function MockTestRunner({ mockData, accentColor = "blue" }: MockTestRunnerProps) {
  const { toast } = useToast();

  const [selectedLevelId, setSelectedLevelId] = useState<string>(mockData.defaultLevelId);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [writtenText, setWrittenText] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);
  const resultRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to result dashboard when evaluation completes
  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  // Timer state isolated via resetKey so 1Hz tick doesn't re-render questions/essay input
  const [timerResetKey, setTimerResetKey] = useState(0);
  const [timerActive, setTimerActive] = useState(true);

  // Find the active level configuration
  const activeLevel: LanguageLevelDef = useMemo(() => {
    return mockData.levels.find((lvl) => lvl.id === selectedLevelId) || mockData.levels[0];
  }, [mockData, selectedLevelId]);

  // Color themes
  const colorMap = {
    blue: {
      primary: "from-blue-600 to-sky-500",
      borderGlow: "border-blue-500/40 shadow-blue-500/10",
      activeTab: "border-sky-500 bg-sky-500/15 text-sky-300 shadow-[0_0_15px_rgba(14,165,233,0.3)]",
      badge: "border-blue-500/30 bg-blue-500/10 text-blue-400",
      button: "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/25",
      ring: "focus:border-sky-500 focus:ring-sky-500",
      textAccent: "text-sky-400",
      lightBg: "bg-blue-500/5",
    },
    purple: {
      primary: "from-purple-600 to-pink-500",
      borderGlow: "border-purple-500/40 shadow-purple-500/10",
      activeTab:
        "border-purple-500 bg-purple-500/15 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]",
      badge: "border-purple-500/30 bg-purple-500/10 text-purple-400",
      button: "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/25",
      ring: "focus:border-purple-500 focus:ring-purple-500",
      textAccent: "text-purple-400",
      lightBg: "bg-purple-500/5",
    },
    emerald: {
      primary: "from-emerald-600 to-teal-500",
      borderGlow: "border-emerald-500/40 shadow-emerald-500/10",
      activeTab:
        "border-emerald-500 bg-emerald-500/15 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]",
      badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
      button: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/25",
      ring: "focus:border-emerald-500 focus:ring-emerald-500",
      textAccent: "text-emerald-400",
      lightBg: "bg-emerald-500/5",
    },
  };

  const theme = colorMap[accentColor] || colorMap.blue;

  const answeredCount = activeLevel.questions.filter((q) => answers[q.id]).length;
  const progressPercent = Math.round((answeredCount / activeLevel.questions.length) * 100);

  const handleSelectAnswer = (qId: string, optionKey: string) => {
    if (result) return;
    setAnswers((prev) => ({ ...prev, [qId]: optionKey }));
  };

  const handleSelectLevel = (levelId: string) => {
    if (levelId === selectedLevelId) return;

    if (Object.keys(answers).length > 0 && !result) {
      const confirmChange = window.confirm(
        "Darajani o'zgartirsangiz, joriy belgilangan javoblar yangi daraja savollariga moslab qayta o'rnatiladi. Davom etasizmi?"
      );
      if (!confirmChange) return;
    }

    setSelectedLevelId(levelId);
    setAnswers({});
    setWrittenText("");
    setResult(null);
    setTimerResetKey((k) => k + 1);
    setTimerActive(true);

    toast({
      title: "Daraja o'zgartirildi",
      description: `Tanlangan daraja: ${levelId}. Savollar darajaga moslandi.`,
    });
  };

  const handleSubmitTest = async () => {
    if (answeredCount === 0 && !writtenText.trim()) {
      toast({
        title: "Iltimos, javoblarni belgilang",
        description: "AI aniq baholashi uchun kamida 2-3 ta test savoliga javob bering.",
        variant: "destructive",
      });
      return;
    }

    setIsEvaluating(true);
    setTimerActive(false);

    // Fail-fast AbortController with 6.0s maximum client wait budget
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch("/api/ai/language-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          language: mockData.code,
          testType: mockData.standard,
          selectedLevel: activeLevel.name,
          levelId: activeLevel.id,
          levelShortName: activeLevel.shortName,
          answers,
          questions: activeLevel.questions,
          writtenText,
        }),
      });

      clearTimeout(timeoutId);

      // Handle quota limit error: compute local evaluation so user is never left stranded
      if (res.status === 403) {
        const data = await res.json().catch(() => ({}));
        const fallbackResult = evaluateMockTestLocally({
          language: mockData.code,
          testType: mockData.standard,
          selectedLevel: activeLevel.name,
          levelId: activeLevel.id,
          levelShortName: activeLevel.shortName,
          answers,
          questions: activeLevel.questions,
          writtenText,
        });
        setResult(fallbackResult);
        toast({
          title: "Test natijangiz hisoblandi",
          description:
            data.upgradeMessage ||
            "Mock Test limitingiz tugagan bo'lsa-da, javoblaringiz bo'yicha test natijasi muvaffaqiyatli hisoblandi.",
        });
        return;
      }

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      if (!data || !data.bandScore) {
        throw new Error("Invalid response format");
      }

      setResult(data);
      toast({
        title: "Test muvaffaqiyatli baholandi!",
        description: `Sizning natijangiz: ${data.bandScore}`,
      });
    } catch {
      clearTimeout(timeoutId);
      // Instant fail-safe calculation: never leave the user waiting or with an empty screen
      const fallbackResult = evaluateMockTestLocally({
        language: mockData.code,
        testType: mockData.standard,
        selectedLevel: activeLevel.name,
        levelId: activeLevel.id,
        levelShortName: activeLevel.shortName,
        answers,
        questions: activeLevel.questions,
        writtenText,
      });

      setResult(fallbackResult);
      toast({
        title: "Test muvaffaqiyatli baholandi!",
        description: `Sizning natijangiz: ${fallbackResult.bandScore}`,
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setWrittenText("");
    setResult(null);
    setTimerResetKey((k) => k + 1);
    setTimerActive(true);
  };

  // Group levels for display tabs
  const cefrLevels = mockData.levels.filter((l) => l.group === "cefr");
  const specialLevels = mockData.levels.filter((l) => l.group !== "cefr");

  return (
    <div className="bg-background text-foreground min-h-screen pb-24">
      {/* Sub navigation */}
      <div className="print:hidden">
        <StudentSubNav activeTab="mock-test" />
      </div>

      {/* Top Breadcrumb & Live Status Bar */}
      <div className="border-border/70 bg-surface/95 sticky top-16 z-20 border-b px-4 py-3.5 shadow-sm sm:px-6 md:top-20 lg:px-8 print:hidden">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
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
              <span className="text-2xl drop-shadow-sm">{mockData.flag}</span>
              <div>
                <span className="text-foreground block text-sm leading-none font-bold">
                  {mockData.title}
                </span>
                <span className="text-foreground-muted text-[11px]">{mockData.standard}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Active Level Badge */}
            <div
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold ${theme.badge}`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{activeLevel.shortName}</span>
            </div>

            {/* Live Timer */}
            <LiveCountdownTimer key={timerResetKey} active={timerActive && !result} />

            {/* Answered Counter */}
            <div className="text-foreground-secondary bg-surface-elevated/40 border-border hidden rounded-xl border px-3 py-1.5 text-xs font-medium sm:block">
              Progress:{" "}
              <span className="text-primary font-bold">
                {answeredCount}/{activeLevel.questions.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Level Selection Section */}
        <div className="border-border/80 bg-surface-elevated/90 relative mb-8 overflow-hidden rounded-3xl border p-5 shadow-lg sm:p-7 print:hidden">
          <div className="pointer-events-none absolute -top-24 -right-24 hidden h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.15)_0%,transparent_70%)] md:block" />

          <div className="relative z-10">
            <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <div className="text-primary flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
                  <Languages className="h-4 w-4" />
                  <span>Bilim darajangizni tanlang:</span>
                </div>
                <h2 className="text-foreground mt-0.5 text-lg font-extrabold sm:text-xl">
                  Qaysi daraja bo&apos;yicha test topshirmoqchisiz?
                </h2>
              </div>
              <span className="text-foreground-muted text-xs">
                Savollar tanlangan darajaga avtomatik moslashadi
              </span>
            </div>

            {/* CEFR Level Buttons */}
            <div className="mb-4">
              <div className="text-foreground-muted mb-2 text-[11px] font-bold tracking-wider uppercase">
                Standart CEFR shkalasi:
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {cefrLevels.map((lvl) => {
                  const isCurrent = lvl.id === selectedLevelId;
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => handleSelectLevel(lvl.id)}
                      className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border p-3 text-center transition-all duration-200 hover:-translate-y-0.5 ${
                        isCurrent
                          ? theme.activeTab
                          : "border-border bg-surface-elevated/50 hover:bg-surface-elevated hover:border-border-hover text-foreground-secondary"
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-base font-extrabold">{lvl.shortName}</span>
                        {isCurrent && <Check className="text-primary h-3.5 w-3.5" />}
                      </div>
                      <span className="text-foreground-muted text-[10px] leading-tight font-medium">
                        {lvl.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Specialized Levels (IELTS / ТРКИ / TÖMER) */}
            {specialLevels.length > 0 && (
              <div>
                <div className="text-foreground-muted mb-2 text-[11px] font-bold tracking-wider uppercase">
                  Xalqaro imtihon standartlari ({mockData.standard}):
                </div>
                <div
                  className={`grid grid-cols-1 gap-2.5 ${
                    specialLevels.length === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3"
                  }`}
                >
                  {specialLevels.map((lvl) => {
                    const isCurrent = lvl.id === selectedLevelId;
                    return (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => handleSelectLevel(lvl.id)}
                        className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                          isCurrent
                            ? theme.activeTab
                            : "border-border bg-surface-elevated/50 hover:bg-surface-elevated hover:border-border-hover text-foreground-secondary"
                        }`}
                      >
                        <div>
                          <div className="text-foreground text-xs font-bold sm:text-sm">
                            {lvl.name}
                          </div>
                          <div className="text-foreground-muted mt-0.5 line-clamp-1 text-[11px]">
                            {lvl.badge}
                          </div>
                        </div>
                        {isCurrent ? (
                          <div className="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                            ✓
                          </div>
                        ) : (
                          <span className="text-foreground-muted text-xs">Tanlash</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Active Level Description Note */}
            <div className="border-border/60 bg-surface-elevated/30 mt-4 flex items-start gap-2.5 rounded-xl border p-3 text-xs">
              <Zap className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <div className="text-foreground-secondary">
                <strong className="text-foreground font-semibold">{activeLevel.name}:</strong>{" "}
                {activeLevel.description}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Progress Meter */}
        <div className="mb-8 print:hidden">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-foreground-muted">Topshirish holati</span>
            <span className="text-primary font-mono font-bold">
              {progressPercent}% tugallandi ({answeredCount}/{activeLevel.questions.length})
            </span>
          </div>
          <div className="bg-surface-elevated border-border/50 h-2 w-full overflow-hidden rounded-full border">
            <div
              className={`h-full bg-gradient-to-r ${theme.primary} shadow-sm transition-all duration-300`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Section 1: Multiple Choice Questions */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <span
              className={`rounded-lg px-2.5 py-1 text-xs font-bold tracking-wider uppercase ${theme.badge}`}
            >
              Part 1: Grammar, Lexis & Reading
            </span>
            <span className="text-foreground-muted text-xs">
              {activeLevel.questions.length} ta savol
            </span>
          </div>
          <h3 className="text-foreground mt-2 text-xl font-extrabold sm:text-2xl">
            Leksik-grammatik sinov ({activeLevel.shortName})
          </h3>
          <p className="text-foreground-secondary mt-1 text-xs sm:text-sm">
            Quyidagi har bir savol uchun eng to&apos;g&apos;ri javobni tanlang. Xato qilgan taqdirda
            ham test oxirida har bir savolning to&apos;liq qoidasi va tushuntirishi
            ko&apos;rsatiladi.
          </p>
        </div>

        {/* Questions Grid */}
        {useMemo(
          () => (
            <div className="space-y-6">
              {activeLevel.questions.map((q: MockQuestion, idx: number) => {
                const selectedKey = answers[q.id];
                const isAnswered = Boolean(selectedKey);
                const isCorrect = result && selectedKey === q.correctKey;
                const _isWrong = result && selectedKey && selectedKey !== q.correctKey;

                return (
                  <div
                    key={q.id}
                    className={`bg-surface rounded-2xl border p-5 transition-all sm:p-6 ${
                      result
                        ? isCorrect
                          ? "border-emerald-500/40 bg-emerald-500/5 shadow-sm"
                          : "border-red-500/40 bg-red-500/5 shadow-sm"
                        : isAnswered
                          ? `${theme.borderGlow} shadow-sm`
                          : "border-border hover:border-border-hover"
                    }`}
                  >
                    {/* Question Header */}
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-foreground-muted flex items-center gap-2 text-xs font-bold">
                        <span className="bg-surface-elevated text-primary flex h-6 w-6 items-center justify-center rounded-lg text-xs font-extrabold">
                          {idx + 1}
                        </span>
                        <span className="text-foreground font-semibold">{q.category}</span>
                      </div>

                      {result && (
                        <div className="flex items-center gap-1.5">
                          {isCorrect ? (
                            <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>To&apos;g&apos;ri (✓)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs font-bold text-red-400">
                              <XCircle className="h-3.5 w-3.5" />
                              <span>To&apos;g&apos;ri javob: variant {q.correctKey}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Question Text */}
                    <p className="text-foreground mb-4 text-sm leading-relaxed font-medium sm:text-base">
                      {q.question}
                    </p>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {q.options.map((opt) => {
                        const isSelected = selectedKey === opt.key;
                        const isOptionCorrect = result && opt.key === q.correctKey;
                        const isOptionWrongSelected = result && isSelected && !isOptionCorrect;

                        let optStyle =
                          "border-border bg-background hover:bg-surface-elevated text-foreground-secondary hover:text-foreground";

                        if (result) {
                          if (isOptionCorrect) {
                            optStyle =
                              "border-emerald-500 bg-emerald-500/15 text-emerald-300 font-semibold shadow-sm";
                          } else if (isOptionWrongSelected) {
                            optStyle =
                              "border-red-500/70 bg-red-500/10 text-red-300 line-through font-semibold";
                          } else {
                            optStyle =
                              "border-border/60 bg-background/50 text-foreground-muted opacity-60";
                          }
                        } else if (isSelected) {
                          optStyle = `border-primary bg-primary/10 text-foreground font-semibold shadow-sm`;
                        }

                        return (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => handleSelectAnswer(q.id, opt.key)}
                            disabled={Boolean(result)}
                            className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-left text-xs transition-all sm:text-sm ${optStyle}`}
                          >
                            <span
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                                result
                                  ? isOptionCorrect
                                    ? "bg-emerald-500 text-white"
                                    : isOptionWrongSelected
                                      ? "bg-red-500 text-white"
                                      : "bg-surface-elevated text-foreground-muted"
                                  : isSelected
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

                    {/* Explanation Box (Visible after submission) */}
                    {result && q.explanation && (
                      <div className="border-border/80 bg-surface-elevated/70 mt-4 flex items-start gap-3 rounded-xl border p-3.5 text-xs">
                        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                        <div>
                          <span className="text-foreground font-bold">Tushuntirish va qoida:</span>
                          <p className="text-foreground-secondary mt-0.5 leading-relaxed">
                            {q.explanation}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ),
          // eslint-disable-next-line react-hooks/exhaustive-deps
          [activeLevel.questions, answers, result, theme.borderGlow]
        )}

        {/* Section 2: Writing task */}
        <div className="border-border bg-surface mt-10 rounded-2xl border p-6 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="rounded-md border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 text-xs font-bold tracking-wider text-purple-400 uppercase">
              Part 2: Yozma nutq topshirig&apos;i ({activeLevel.shortName}) • Ixtiyoriy
            </span>
            <span className="text-foreground-muted text-xs">
              Tavsiya: {activeLevel.writingPrompt.suggestedLength}
            </span>
          </div>

          <h3 className="text-foreground mb-1 text-base font-bold">
            Mavzu: {activeLevel.writingPrompt.topic}
          </h3>
          <p className="text-foreground-secondary mb-4 text-xs leading-relaxed sm:text-sm">
            {activeLevel.writingPrompt.instructions}
          </p>

          <textarea
            rows={5}
            value={writtenText}
            onChange={(e) => setWrittenText(e.target.value)}
            disabled={Boolean(result)}
            placeholder={activeLevel.writingPrompt.placeholder}
            className={`border-border bg-background text-foreground placeholder:text-foreground-muted w-full rounded-xl border p-4 text-xs transition-colors focus:outline-none sm:text-sm ${theme.ring}`}
          />

          <div className="text-foreground-muted mt-2 flex items-center justify-between text-[11px]">
            <span>
              So&apos;zlar soni:{" "}
              <strong className="text-foreground">
                {writtenText.trim() ? writtenText.trim().split(/\s+/).length : 0}
              </strong>
            </span>
            <span>
              Belgilar soni: <strong className="text-foreground">{writtenText.length}</strong>
            </span>
          </div>
        </div>

        {/* Action Button */}
        {!result && (
          <div className="mt-8 flex flex-col items-center justify-center gap-3 print:hidden">
            <button
              onClick={handleSubmitTest}
              disabled={isEvaluating}
              className={`flex cursor-pointer items-center gap-2.5 rounded-2xl px-9 py-4 text-sm font-bold shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 ${theme.button}`}
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
            <span className="text-foreground-muted text-xs">
              Google Gemini & DocNova lingvistik algoritmi orqali daqiqalik chuqur ekspertiza
            </span>
          </div>
        )}

        {/* AI Result Report Dashboard */}
        {result && (
          <div
            ref={resultRef}
            className="border-primary/40 from-surface via-surface to-background animate-in fade-in slide-in-from-bottom-4 mt-12 rounded-3xl border bg-gradient-to-b p-6 shadow-2xl duration-500 sm:p-8 print:border-none print:bg-transparent print:p-0 print:shadow-none"
          >
            {/* Report Header */}
            <div className="border-border flex flex-col items-start justify-between gap-4 border-b pb-6 sm:flex-row sm:items-center">
              <div>
                <div className="text-primary bg-primary/10 border-primary/20 mb-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold">
                  <Award className="h-4 w-4" />
                  <span>Rasmiy AI Lingvistik Sertifikat Tahlili</span>
                </div>
                <h3 className="text-foreground text-2xl font-extrabold sm:text-3xl">
                  {mockData.title}: {result.bandScore}
                </h3>
                <p className="text-foreground-secondary mt-1 text-xs sm:text-sm">
                  Sinov darajasi: <strong>{activeLevel.name}</strong> • Test sanasi:{" "}
                  {new Date().toLocaleDateString("uz-UZ")}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 print:hidden">
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
                  <span>Chop etish / PDF</span>
                </button>
              </div>
            </div>

            {/* Score Cards Grid */}
            <div className="my-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="border-border bg-surface-elevated/60 rounded-2xl border p-4 text-center">
                <span className="text-foreground-muted text-[11px] font-bold tracking-wider uppercase">
                  Umumiy ko&apos;rsatkich
                </span>
                <div className="text-primary mt-1 text-3xl font-extrabold">
                  {result.overallScore}%
                </div>
                <span className="text-foreground-secondary mt-0.5 block text-[11px]">
                  CEFR {result.cefrLevel}
                </span>
              </div>

              <div className="border-primary/30 bg-primary/10 rounded-2xl border p-4 text-center">
                <span className="text-primary text-[11px] font-bold tracking-wider uppercase">
                  Rasmiy Band / Daraja
                </span>
                <div className="text-primary mt-1 line-clamp-1 text-lg font-extrabold sm:text-xl">
                  {result.bandScore}
                </div>
                <span className="text-primary/70 mt-0.5 block text-[11px]">
                  Tavsiya etilgan daraja
                </span>
              </div>

              <div className="border-border bg-surface-elevated/60 rounded-2xl border p-4 text-center">
                <span className="text-foreground-muted text-[11px] font-bold tracking-wider uppercase">
                  Grammatika
                </span>
                <div className="text-foreground mt-1 text-2xl font-extrabold">
                  {result.grammarScore}%
                </div>
                <span className="text-foreground-muted mt-0.5 block text-[11px]">
                  Sintaksis aniqligi
                </span>
              </div>

              <div className="border-border bg-surface-elevated/60 rounded-2xl border p-4 text-center">
                <span className="text-foreground-muted text-[11px] font-bold tracking-wider uppercase">
                  Leksika / So&apos;z boyligi
                </span>
                <div className="text-foreground mt-1 text-2xl font-extrabold">
                  {result.vocabularyScore}%
                </div>
                <span className="text-foreground-muted mt-0.5 block text-[11px]">
                  Lug&apos;at ko&apos;lami
                </span>
              </div>
            </div>

            {/* Additional Gauges */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="border-border bg-surface-elevated/40 flex items-center justify-between rounded-xl border p-3.5 text-xs">
                <span className="text-foreground-secondary">
                  Matn tushunish (Reading Comprehension):
                </span>
                <span className="text-foreground font-bold">{result.readingScore}%</span>
              </div>
              <div className="border-border bg-surface-elevated/40 flex items-center justify-between rounded-xl border p-3.5 text-xs">
                <span className="text-foreground-secondary">Yozma nutq (Writing Expression):</span>
                <span className="text-foreground font-bold">{result.writingScore}%</span>
              </div>
            </div>

            {/* AI Summary Banner */}
            <div className="border-border/80 bg-surface mb-6 rounded-2xl border p-5">
              <h4 className="text-primary mb-2 flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
                <Sparkles className="h-4 w-4" />
                <span>AI Imtihon Xulosasi</span>
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
                  <span>Tavsiyalar va Rivojlanish rejasi</span>
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

            {/* Weaknesses Box */}
            {result.weaknesses && result.weaknesses.length > 0 && (
              <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
                <h4 className="mb-3 flex items-center gap-1.5 text-xs font-bold tracking-wider text-amber-400 uppercase">
                  <HelpCircle className="h-4 w-4" />
                  <span>E&apos;tibor qaratilishi zarur bo&apos;lgan sohalar</span>
                </h4>
                <ul className="text-foreground-secondary space-y-2 text-xs sm:text-sm">
                  {result.weaknesses.map((weak, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-bold text-amber-400">•</span>
                      <span>{weak}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Certificate Recommendation Stamp */}
            <div className="border-primary/30 from-primary/10 mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border bg-gradient-to-r via-sky-500/5 to-transparent p-5 sm:flex-row">
              <div className="flex items-center gap-3.5">
                <div className="bg-primary/20 text-primary rounded-xl p-3">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-foreground text-sm font-bold">
                    DocNova Raqamli Sertifikat Tavsiyasi
                  </div>
                  <div className="text-foreground-secondary mt-0.5 text-xs">
                    Ushbu test natijasi bo&apos;yicha sizning bilim darajangiz{" "}
                    <strong>{result.bandScore}</strong> sifatida tasdiqlandi.
                  </div>
                </div>
              </div>

              <Link
                href="/academic/mock-test"
                className="bg-primary hover:bg-primary/90 text-primary-foreground flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold shadow-md transition-all hover:scale-105 print:hidden"
              >
                <span>Boshqa tilni sinash</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
