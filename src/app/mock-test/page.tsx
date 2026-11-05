"use client";

import React, { useState } from "react";
import { Play, ChevronRight, Loader2, Award, CheckCircle, Lightbulb } from "lucide-react";
import { UpgradeModal } from "@/components/modals/UpgradeModal";
import { useToast } from "@/hooks/use-toast";

export default function MockTestPage() {
  const [step, setStep] = useState<"setup" | "test" | "results">("setup");
  const [lang, setLang] = useState("EN");
  const [role, setRole] = useState("Frontend Developer");
  const [difficulty, setDifficulty] = useState("Middle");
  const [questionCount, setQuestionCount] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [activeTab, setActiveTab] = useState("grammar");

  const { toast } = useToast();

  const startTest = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/mock-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", role, difficulty, lang }),
      });
      if (res.status === 429) {
        setShowUpgradeModal(true);
        return;
      }
      if (!res.ok) throw new Error("Tarmoqda xatolik yuz berdi.");
      const data = await res.json();
      setCurrentQuestion(data.nextQuestion);
      setStep("test");
      setQuestionCount(1);
    } catch (_error) {
      toast({
        title: "Xatolik",
        description: "Testni boshlashda xatolik yuz berdi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim() || isLoading) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/mock-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "answer", answer, questionCount }),
      });
      if (!res.ok) throw new Error("Tarmoqda xatolik yuz berdi.");
      const data = await res.json();

      if (data.isFinished) {
        setScore(data.score);
        setFeedback(data.feedback);
        setStep("results");
        toast({
          title: "Muvaffaqiyatli",
          description: "Test yakunlandi. Natijalarni ko'rishingiz mumkin.",
        });
      } else {
        setCurrentQuestion(data.nextQuestion);
        setAnswer("");
        setQuestionCount((c) => c + 1);
      }
    } catch (_error) {
      toast({
        title: "Xatolik",
        description: "Javobni yuborishda xatolik.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background flex min-h-[calc(100vh-80px)] flex-col items-center px-4 py-12">
      {step === "setup" && (
        <div className="bg-surface border-border w-full max-w-lg rounded-2xl border p-8 shadow-xl">
          <div className="mb-8 text-center">
            <h1 className="text-foreground text-2xl font-bold">AI Mock Interview</h1>
            <p className="text-foreground-secondary mt-2 text-sm">
              Intervyu uchun sozlashingizni tanlang (5 ta savol)
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-foreground mb-1.5 block text-sm font-medium">Tili</label>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="bg-background border-border focus:border-primary/50 text-foreground w-full rounded-xl border px-4 py-3 text-sm"
              >
                <option value="EN">English</option>
                <option value="RU">Русский</option>
              </select>
            </div>

            <div>
              <label className="text-foreground mb-1.5 block text-sm font-medium">Lavozim</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="bg-background border-border focus:border-primary/50 text-foreground w-full rounded-xl border px-4 py-3 text-sm"
                placeholder="e.g. Frontend Developer"
              />
            </div>

            <div>
              <label className="text-foreground mb-1.5 block text-sm font-medium">Daraja</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="bg-background border-border focus:border-primary/50 text-foreground w-full rounded-xl border px-4 py-3 text-sm"
              >
                <option>Junior</option>
                <option>Middle</option>
                <option>Senior</option>
              </select>
            </div>

            <button
              onClick={startTest}
              disabled={isLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-bold transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Play className="h-5 w-5 fill-current" />
              )}
              Boshlash
            </button>
          </div>
        </div>
      )}

      {step === "test" && (
        <div className="bg-surface border-border w-full max-w-2xl rounded-2xl border p-8 shadow-xl">
          <div className="mb-6 flex items-center justify-between">
            <span className="text-primary bg-primary/10 rounded-full px-3 py-1 text-sm font-bold">
              Savol {questionCount}/5
            </span>
          </div>
          <h2 className="text-foreground mb-6 text-xl leading-relaxed font-semibold">
            {currentQuestion}
          </h2>

          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={5}
            className="bg-background border-border focus:border-primary/50 text-foreground w-full resize-none rounded-xl border p-4 text-sm"
            placeholder="Javobingizni yozing..."
          />

          <div className="mt-6 flex justify-end">
            <button
              onClick={submitAnswer}
              disabled={!answer.trim() || isLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-xl px-6 py-2.5 font-bold transition-all disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Keyingisi"}
              {!isLoading && <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}

      {step === "results" && (
        <div className="bg-surface border-border w-full max-w-3xl rounded-2xl border p-8 text-center shadow-xl">
          <div className="bg-primary/10 relative mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full">
            <svg className="absolute inset-0 h-full w-full -rotate-90 transform">
              <circle
                cx="40"
                cy="40"
                r="36"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="6"
                className="text-border"
              />
              <circle
                cx="40"
                cy="40"
                r="36"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="6"
                strokeDasharray="226"
                strokeDashoffset={226 - (226 * score) / 100}
                className="text-primary"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-primary relative z-10 text-2xl font-bold">{score}%</span>
          </div>
          <h1 className="text-foreground mb-2 text-2xl font-bold">Intervyu Natijasi</h1>

          <div className="bg-background border-border mt-8 overflow-hidden rounded-xl border text-left">
            <div className="border-border bg-surface-elevated flex border-b">
              <button
                onClick={() => setActiveTab("grammar")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === "grammar" ? "bg-primary/10 text-primary border-primary border-b-2" : "text-foreground-secondary hover:text-foreground hover:bg-surface"}`}
              >
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4" /> Grammatika
                </div>
              </button>
              <button
                onClick={() => setActiveTab("content")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === "content" ? "border-b-2 border-amber-500 bg-amber-500/10 text-amber-500" : "text-foreground-secondary hover:text-foreground hover:bg-surface"}`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Lightbulb className="h-4 w-4" /> {"Mazmun & G'oyalar"}
                </div>
              </button>
              <button
                onClick={() => setActiveTab("overall")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === "overall" ? "border-b-2 border-emerald-500 bg-emerald-500/10 text-emerald-500" : "text-foreground-secondary hover:text-foreground hover:bg-surface"}`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Award className="h-4 w-4" /> Umumiy Xulosa
                </div>
              </button>
            </div>

            <div className="p-6">
              {activeTab === "grammar" && (
                <p className="text-foreground-secondary text-sm leading-relaxed whitespace-pre-line">
                  {feedback ||
                    "Grammatika bo'yicha jiddiy xatolar topilmadi. O'tgan zamon fe'llaridan to'g'ri foydalanishga harakat qiling."}
                </p>
              )}
              {activeTab === "content" && (
                <p className="text-foreground-secondary text-sm leading-relaxed whitespace-pre-line">
                  {
                    "Sizning javoblaringiz asosiy tushunchalarni yaxshi yoritib bergan. Texnik so'z boyligingiz o'z o'rnida ishlatilgan. Rezyumedagi tajribangiz bilan javoblarni ko'proq bog'lashga harakat qiling."
                  }
                </p>
              )}
              {activeTab === "overall" && (
                <p className="text-foreground-secondary text-sm leading-relaxed whitespace-pre-line">
                  {"Suhbatdan o'tish ehtimoli: "}
                  <span className="font-bold text-emerald-500">Yuqori</span>.
                  {" Siz o'z tajribangizni yaxshi namoyon qila oldingiz!"}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              setStep("setup");
              setScore(0);
              setQuestionCount(0);
            }}
            className="bg-surface-elevated hover:bg-border/50 text-foreground border-border mt-8 rounded-xl border px-6 py-2.5 font-semibold transition-colors"
          >
            Qayta topshirish
          </button>
        </div>
      )}

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="Mock Test Limiti Tugadi"
        description="Joriy ta'rifingizda oylik Mock Test limitiga yetib keldingiz."
      />
    </div>
  );
}
