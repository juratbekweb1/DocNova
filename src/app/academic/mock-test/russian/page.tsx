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

const RUSSIAN_QUESTIONS: Question[] = [
  {
    id: "q1",
    category: "Грамматика: Предложно-падежное управление",
    question:
      "В соответствии ______ новыми академическими стандартами, все дипломные работы проходят обязательную проверку на объем заимствований.",
    options: [
      { key: "A", text: "с" },
      { key: "B", text: "по" },
      { key: "C", text: "к" },
      { key: "D", text: "для" },
    ],
    correctKey: "A",
  },
  {
    id: "q2",
    category: "Деепричастные обороты и синтаксис",
    question:
      "Научный руководитель завершил консультацию, подробно ______ на вопросах методологии исследования.",
    options: [
      { key: "A", text: "останавливался" },
      { key: "B", text: "остановившийся" },
      { key: "C", text: "остановившись" },
      { key: "D", text: "останавливая" },
    ],
    correctKey: "C",
  },
  {
    id: "q3",
    category: "Сложноподчиненные предложения времени",
    question:
      "Аттестационная комиссия утвердила тему исследования только после того, ______ соискатель предоставил развернутый план глав.",
    options: [
      { key: "A", text: "когда" },
      { key: "B", text: "как" },
      { key: "C", text: "пока" },
      { key: "D", text: "чтобы" },
    ],
    correctKey: "B",
  },
  {
    id: "q4",
    category: "Лексическая сочетаемость (Научный стиль)",
    question:
      "Применение современных аналитических алгоритмов позволило исследовательской группе ______ качественно новых результатов.",
    options: [
      { key: "A", text: "добиться" },
      { key: "B", text: "одержать" },
      { key: "C", text: "повысить" },
      { key: "D", text: "совершить" },
    ],
    correctKey: "A",
  },
  {
    id: "q5",
    category: "Официально-деловой стиль речи",
    question:
      "Прошу Вас ______ мне академический отпуск сроком на один семестр в связи с исследовательской стажировкой.",
    options: [
      { key: "A", text: "выдать" },
      { key: "B", text: "позволить" },
      { key: "C", text: "предоставить" },
      { key: "D", text: "уступить" },
    ],
    correctKey: "C",
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

export default function RussianMockTestPage() {
  const { toast } = useToast();

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [writtenText, setWrittenText] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);

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
  const progressPercent = Math.round((answeredCount / RUSSIAN_QUESTIONS.length) * 100);

  const handleSelectAnswer = (qId: string, optionKey: string) => {
    if (result) return;
    setAnswers((prev) => ({ ...prev, [qId]: optionKey }));
  };

  const handleSubmitTest = async () => {
    if (answeredCount < 3 && !writtenText.trim()) {
      toast({
        title: "Iltimos, javoblarni belgilang",
        description: "AI aniq baholashi uchun kamida 3 ta savolga javob bering.",
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
          language: "RU",
          testType: "ТРКИ (TORFL)",
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
        description: `Sizning darajangiz: ${data.bandScore}`,
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

      {/* Top Status Bar */}
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
              <span className="text-xl">🇷🇺</span>
              <span className="text-foreground text-sm font-bold">
                Rus tili (ТРКИ / Деловая речь)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-surface border-border flex items-center gap-2 rounded-xl border px-3 py-1.5 font-mono text-xs font-bold text-purple-400">
              <Clock className="h-4 w-4 text-purple-400" />
              <span>{formatTime(timeLeft)}</span>
            </div>
            <div className="text-foreground-secondary hidden text-xs font-medium sm:block">
              Progress:{" "}
              <span className="font-bold text-purple-400">
                {answeredCount}/{RUSSIAN_QUESTIONS.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="bg-surface-elevated h-1.5 w-full overflow-hidden rounded-full">
            <div
              className="h-full bg-purple-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <span className="rounded-md bg-purple-500/10 px-2.5 py-1 text-xs font-bold tracking-wider text-purple-400 uppercase">
            Раздел 1: Лексика, грамматика и синтаксис
          </span>
          <h2 className="text-foreground mt-2 text-2xl font-bold">
            Тестирование по русскому языку (ТРКИ-1 / ТРКИ-2)
          </h2>
          <p className="text-foreground-secondary mt-1 text-xs sm:text-sm">
            Выберите единственно верный вариант для каждого предложения. Тест проверяет
            академические и деловые языковые нормы.
          </p>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {RUSSIAN_QUESTIONS.map((q, idx) => {
            const selectedKey = answers[q.id];
            const isAnswered = Boolean(selectedKey);

            return (
              <div
                key={q.id}
                className={`bg-surface rounded-2xl border p-5 transition-all sm:p-6 ${
                  isAnswered
                    ? "border-purple-500/40 shadow-sm"
                    : "border-border hover:border-border-hover"
                }`}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-foreground-muted flex items-center gap-2 text-xs font-bold">
                    <span className="bg-surface-elevated flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-purple-400">
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
                        ? "Правильно (✓)"
                        : `Правильный ответ: ${q.correctKey}`}
                    </span>
                  )}
                </div>

                <p className="text-foreground mb-4 text-sm leading-relaxed font-medium sm:text-base">
                  {q.question}
                </p>

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
                            ? "text-foreground border-purple-500 bg-purple-500/10 font-semibold shadow-sm"
                            : "border-border bg-background hover:bg-surface-elevated text-foreground-secondary hover:text-foreground"
                        }`}
                      >
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                            isSelected
                              ? "bg-purple-600 text-white"
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

        {/* Written prompt */}
        <div className="border-border bg-surface mt-10 rounded-2xl border p-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="rounded-md bg-purple-500/10 px-2.5 py-1 text-xs font-bold tracking-wider text-purple-400 uppercase">
              Раздел 2: Письменная часть (Письмо / Эссе)
            </span>
            <span className="text-foreground-muted text-xs">Рекомендуется</span>
          </div>
          <h3 className="text-foreground mb-1 text-base font-bold">
            Мини-сочинение на русском языке
          </h3>
          <p className="text-foreground-secondary mb-4 text-xs leading-relaxed sm:text-sm">
            <strong>Тема:</strong> &laquo;Какова роль высшего образования в условиях стремительной
            цифровизации общества?&raquo; (Напишите 3-4 связных предложения).
          </p>

          <textarea
            rows={4}
            value={writtenText}
            onChange={(e) => setWrittenText(e.target.value)}
            disabled={Boolean(result)}
            placeholder="Напишите ваш ответ на русском языке здесь (например: На мой взгляд, университетское образование сегодня формирует не только базовые знания, но и гибкие навыки критического анализа...)"
            className="border-border bg-background text-foreground placeholder:text-foreground-muted w-full rounded-xl border p-4 text-xs focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none sm:text-sm"
          />
        </div>

        {/* Action Button */}
        {!result && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleSubmitTest}
              disabled={isEvaluating}
              className="flex cursor-pointer items-center gap-2 rounded-2xl bg-purple-600 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-purple-600/25 transition-all hover:scale-[1.02] hover:bg-purple-500 disabled:opacity-50"
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>AI уровень владения языком анализирует...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Проверить и оценить через AI</span>
                  <Send className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        )}

        {/* AI Result Report */}
        {result && (
          <div className="from-surface via-surface to-background animate-in fade-in slide-in-from-bottom-4 mt-12 rounded-3xl border border-purple-500/40 bg-gradient-to-b p-6 shadow-2xl duration-500 sm:p-8">
            <div className="border-border flex flex-col items-start justify-between gap-4 border-b pb-6 sm:flex-row sm:items-center">
              <div>
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-400">
                  <Award className="h-4 w-4" />
                  <span>Результаты тестирования ТРКИ</span>
                </div>
                <h3 className="text-foreground text-2xl font-extrabold">
                  Отчет по уровню владения русским языком
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  className="border-border bg-surface-elevated text-foreground hover:bg-border/60 flex cursor-pointer items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-semibold transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Пройти заново</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-purple-500"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Печать / PDF</span>
                </button>
              </div>
            </div>

            <div className="my-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="border-border bg-surface-elevated/60 rounded-2xl border p-4 text-center">
                <span className="text-foreground-muted text-[11px] font-bold tracking-wider uppercase">
                  Общий балл
                </span>
                <div className="mt-1 text-3xl font-extrabold text-purple-400">
                  {result.overallScore}%
                </div>
              </div>

              <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4 text-center">
                <span className="text-[11px] font-bold tracking-wider text-purple-400 uppercase">
                  Уровень ТРКИ
                </span>
                <div className="mt-1 text-xl font-extrabold text-purple-400 sm:text-2xl">
                  {result.bandScore}
                </div>
              </div>

              <div className="border-border bg-surface-elevated/60 rounded-2xl border p-4 text-center">
                <span className="text-foreground-muted text-[11px] font-bold tracking-wider uppercase">
                  Грамматика
                </span>
                <div className="text-foreground mt-1 text-2xl font-extrabold">
                  {result.grammarScore}%
                </div>
              </div>

              <div className="border-border bg-surface-elevated/60 rounded-2xl border p-4 text-center">
                <span className="text-foreground-muted text-[11px] font-bold tracking-wider uppercase">
                  Лексикон
                </span>
                <div className="text-foreground mt-1 text-2xl font-extrabold">
                  {result.vocabularyScore}%
                </div>
              </div>
            </div>

            <div className="border-border/80 bg-surface mb-6 rounded-2xl border p-5">
              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold tracking-wider text-purple-400 uppercase">
                <Sparkles className="h-4 w-4" />
                <span>Заключение экспертной системы AI</span>
              </h4>
              <p className="text-foreground-secondary text-xs leading-relaxed sm:text-sm">
                {result.summary}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                <h4 className="mb-3 flex items-center gap-1.5 text-xs font-bold tracking-wider text-emerald-400 uppercase">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Сильные стороны</span>
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

              <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5">
                <h4 className="mb-3 flex items-center gap-1.5 text-xs font-bold tracking-wider text-purple-400 uppercase">
                  <BookOpen className="h-4 w-4" />
                  <span>Рекомендации по улучшению</span>
                </h4>
                <ul className="text-foreground-secondary space-y-2 text-xs sm:text-sm">
                  {result.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-bold text-purple-400">•</span>
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
