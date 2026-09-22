"use client";

import React, { useState } from "react";
import { Play, ChevronRight, Loader2, Award, CheckCircle, AlertTriangle, Lightbulb } from "lucide-react";
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
    } catch (error) {
      toast({ title: "Xatolik", description: "Testni boshlashda xatolik yuz berdi.", variant: "destructive" });
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
        toast({ title: "Muvaffaqiyatli", description: "Test yakunlandi. Natijalarni ko'rishingiz mumkin." });
      } else {
        setCurrentQuestion(data.nextQuestion);
        setAnswer("");
        setQuestionCount((c) => c + 1);
      }
    } catch (error) {
      toast({ title: "Xatolik", description: "Javobni yuborishda xatolik.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-background flex flex-col items-center py-12 px-4">
      {step === "setup" && (
        <div className="w-full max-w-lg bg-surface border border-border rounded-2xl p-8 shadow-xl">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-foreground">AI Mock Interview</h1>
            <p className="text-sm text-foreground-secondary mt-2">Intervyu uchun sozlashingizni tanlang (5 ta savol)</p>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Tili</label>
              <select value={lang} onChange={e => setLang(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:border-primary/50 text-foreground">
                <option value="EN">English</option>
                <option value="RU">Русский</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Lavozim</label>
              <input type="text" value={role} onChange={e => setRole(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:border-primary/50 text-foreground" placeholder="e.g. Frontend Developer" />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Daraja</label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:border-primary/50 text-foreground">
                <option>Junior</option>
                <option>Middle</option>
                <option>Senior</option>
              </select>
            </div>

            <button onClick={startTest} disabled={isLoading} className="w-full mt-6 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3.5 rounded-xl font-bold hover:bg-primary/90 transition-all disabled:opacity-50">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
              Boshlash
            </button>
          </div>
        </div>
      )}

      {step === "test" && (
        <div className="w-full max-w-2xl bg-surface border border-border rounded-2xl p-8 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <span className="text-primary text-sm font-bold bg-primary/10 px-3 py-1 rounded-full">Savol {questionCount}/5</span>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-6 leading-relaxed">{currentQuestion}</h2>
          
          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            rows={5}
            className="w-full bg-background border border-border rounded-xl p-4 text-sm focus:border-primary/50 text-foreground resize-none"
            placeholder="Javobingizni yozing..."
          />
          
          <div className="mt-6 flex justify-end">
            <button onClick={submitAnswer} disabled={!answer.trim() || isLoading} className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-all disabled:opacity-50">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Keyingisi"}
              {!isLoading && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {step === "results" && (
        <div className="w-full max-w-3xl bg-surface border border-border rounded-2xl p-8 shadow-xl text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6 relative">
             <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle cx="40" cy="40" r="36" fill="transparent" stroke="currentColor" strokeWidth="6" className="text-border" />
                <circle cx="40" cy="40" r="36" fill="transparent" stroke="currentColor" strokeWidth="6" strokeDasharray="226" strokeDashoffset={226 - (226 * score) / 100} className="text-primary" strokeLinecap="round" />
             </svg>
             <span className="text-2xl font-bold text-primary relative z-10">{score}%</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Intervyu Natijasi</h1>
          
          <div className="text-left mt-8 bg-background border border-border rounded-xl overflow-hidden">
            <div className="flex border-b border-border bg-surface-elevated">
              <button onClick={() => setActiveTab("grammar")} className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${activeTab === 'grammar' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-foreground-secondary hover:text-foreground hover:bg-surface'}`}>
                <div className="flex items-center justify-center gap-2"><CheckCircle className="w-4 h-4" /> Grammatika</div>
              </button>
              <button onClick={() => setActiveTab("content")} className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${activeTab === 'content' ? 'bg-amber-500/10 text-amber-500 border-b-2 border-amber-500' : 'text-foreground-secondary hover:text-foreground hover:bg-surface'}`}>
                <div className="flex items-center justify-center gap-2"><Lightbulb className="w-4 h-4" /> Mazmun & G'oyalar</div>
              </button>
              <button onClick={() => setActiveTab("overall")} className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${activeTab === 'overall' ? 'bg-emerald-500/10 text-emerald-500 border-b-2 border-emerald-500' : 'text-foreground-secondary hover:text-foreground hover:bg-surface'}`}>
                <div className="flex items-center justify-center gap-2"><Award className="w-4 h-4" /> Umumiy Xulosa</div>
              </button>
            </div>
            
            <div className="p-6">
              {activeTab === "grammar" && (
                <p className="text-sm text-foreground-secondary whitespace-pre-line leading-relaxed">
                  {feedback || "Grammatika bo'yicha jiddiy xatolar topilmadi. O'tgan zamon fe'llaridan to'g'ri foydalanishga harakat qiling."}
                </p>
              )}
              {activeTab === "content" && (
                <p className="text-sm text-foreground-secondary whitespace-pre-line leading-relaxed">
                  Sizning javoblaringiz asosiy tushunchalarni yaxshi yoritib bergan. Texnik so'z boyligingiz o'z o'rnida ishlatilgan. Rezyumedagi tajribangiz bilan javoblarni ko'proq bog'lashga harakat qiling.
                </p>
              )}
              {activeTab === "overall" && (
                <p className="text-sm text-foreground-secondary whitespace-pre-line leading-relaxed">
                  Suhbatdan o'tish ehtimoli: <span className="font-bold text-emerald-500">Yuqori</span>. 
                  Siz o'z tajribangizni yaxshi namoyon qila oldingiz!
                </p>
              )}
            </div>
          </div>
          
          <button onClick={() => {setStep("setup"); setScore(0); setQuestionCount(0);}} className="mt-8 px-6 py-2.5 bg-surface-elevated hover:bg-border/50 text-foreground font-semibold rounded-xl border border-border transition-colors">
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
