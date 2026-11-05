"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Printer,
  ChevronLeft,
  Loader2,
  FileText,
  RotateCcw,
  BookOpen,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface SentenceItem {
  text: string;
  type: "human" | "ai" | "paraphrased" | "borrowed";
  confidence: number;
}

interface AnalysisResult {
  aiScore: number;
  humanScore: number;
  originalityScore: number;
  plagiarismScore: number;
  verdict: string;
  verdictUz: string;
  summaryUz: string;
  suggestionsUz: string[];
  sentenceAnalysis: SentenceItem[];
  stats: {
    wordCount: number;
    charCount: number;
    sentenceCount: number;
    readingTimeMinutes: number;
  };
}

const SAMPLE_TEXT = `O'zbekiston Respublikasida raqamli iqtisodiyotni rivojlantirish va barcha sohalarga zamonaviy axborot texnologiyalarini tatbiq etish davlat siyosatining ustuvor yo'nalishlaridan biri hisoblanadi. 
Ayniqsa, bank-moliya tizimida sun'iy intellekt modellaridan foydalanish mijozlarga xizmat ko'rsatish tezligini oshirmoqda va operatsion xarajatlarni qisqartirishga xizmat qilmoqda. 
Mazkur tadqiqot ishida tijorat banklarining transformatsiya jarayonlari tahlil qilinib, mavjud xatarlarni minimallashtirish bo'yicha amaliy takliflar ishlab chiqilgan. 
Olib borilgan empirik tahlillar shuni ko'rsatadiki, raqamli xizmatlar ulushining ortishi bank rentabelligini o'rtacha 18-22 foizga oshirish imkonini beradi.`;

export default function AiDetectorPage() {
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  const handleAnalyze = async () => {
    if (wordCount < 10) {
      toast({
        title: "Matn juda qisqa",
        description: "Iltimos, aniq tahlil qilish uchun kamida 15-20 ta so'zdan iborat matn kiriting.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const res = await fetch("/api/ai/detector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Tahlil qilishda xatolik yuz berdi");
      }

      setResult(json.data);
      toast({
        title: "Tahlil yakunlandi! 🎯",
        description: `Matn o'ziga xosligi: ${json.data.originalityScore}%, AI ehtimoli: ${json.data.aiScore}%`,
      });
    } catch (err: any) {
      toast({
        title: "Xatolik",
        description: err.message || "Tekshirishda xatolik yuz berdi. Qayta urinib ko'ring.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLoadSample = () => {
    setText(SAMPLE_TEXT);
  };

  const handleClear = () => {
    setText("");
    setResult(null);
  };

  const handleCopyReport = () => {
    if (!result) return;
    const reportText = `DOCNOVA PLAGIAT VA AI TEKSHIRUV HISOBOTI:
=========================================
• Matn o'ziga xosligi (Unikallik): ${result.originalityScore}%
• Plagiat xatari: ${result.plagiarismScore}%
• AI (Sun'iy intellekt) ehtimoli: ${result.aiScore}%
• Inson omili: ${result.humanScore}%
• Xulosa: ${result.verdictUz}

Batafsil xulosa:
${result.summaryUz}

Tavsiyalar:
${result.suggestionsUz.map((s, i) => `${i + 1}. ${s}`).join("\n")}
`;
    navigator.clipboard.writeText(reportText);
    toast({
      title: "Nusxalandi! 📋",
      description: "Tekshiruv hisoboti nusxalandi.",
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      {/* Subnav / Header Breadcrumbs */}
      <div className="border-b border-border bg-surface/50 py-4 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground-secondary transition-colors hover:text-foreground hover:bg-surface-elevated"
            >
              <ChevronLeft className="h-4 w-4" />
              Boshqaruv paneli
            </Link>
            <span className="text-border">/</span>
            <Link
              href="/refinement"
              className="text-xs font-medium text-foreground-secondary hover:text-foreground"
            >
              Tahrirlash
            </Link>
            <span className="text-border">/</span>
            <span className="text-xs font-semibold text-primary">Plagiat & AI Detektor</span>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Turnitin & Antiplagiat standarti
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="mb-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-xl bg-primary/10 p-2.5 text-primary mb-3">
            <Search className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight sm:text-4xl">
            Plagiat va AI Detektor 🔍
          </h1>
          <p className="mt-2 max-w-3xl text-sm font-light text-foreground-secondary sm:text-base">
            Matningizni sun&apos;iy intellekt (ChatGPT, Claude, Gemini) generatsiyasi va internet manbalariga o&apos;xshashlik darajasiga chuqur tahlil qiling.
          </p>
        </div>

        {/* Editor Box */}
        <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-foreground">
                Tekshiriladigan matnni kiriting:
              </span>
              <button
                onClick={handleLoadSample}
                className="text-[11px] font-semibold text-primary hover:underline"
              >
                + Namunani yuklash
              </button>
            </div>
            <div className="flex items-center gap-4 text-xs text-foreground-secondary">
              <span>So&apos;zlar: <strong className="text-foreground">{wordCount}</strong></span>
              <span>Belgilar: <strong className="text-foreground">{charCount}</strong></span>
              {text && (
                <button
                  onClick={handleClear}
                  className="inline-flex items-center gap-1 text-[11px] text-red-400 hover:underline"
                >
                  <RotateCcw className="h-3 w-3" /> Tozalash
                </button>
              )}
            </div>
          </div>

          <textarea
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tekshirmoqchi bo'lgan maqola, kurs ishi, insho yoki referat matnini bu yerga joylashtiring..."
            className="w-full rounded-2xl border border-border bg-background p-4 text-sm leading-relaxed text-foreground placeholder:text-foreground-secondary/60 focus:border-primary/50 focus:outline-none"
          />

          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-foreground-secondary">
              ⚡️ OTM talabalari va ilmiy izlanuvchilar uchun 100% maxfiy va xavfsiz tahlil.
            </span>
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || wordCount < 10}
              className="w-full sm:w-auto rounded-xl bg-primary px-8 py-5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Tahlil qilinmoqda...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" /> Plagiat & AI ni tekshirish
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="mt-8 space-y-8 animate-in fade-in duration-500">
            {/* Visual Score Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Card 1: Originality */}
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-300">Unikallik (O&apos;ziga xoslik)</span>
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl font-black text-emerald-400">
                    {result.originalityScore}%
                  </span>
                  <span className="text-xs font-medium text-emerald-300/80">Original matn</span>
                </div>
                <p className="mt-2 text-xs text-emerald-200/70">
                  {result.originalityScore >= 80 ? "A'lo daraja! OTM mezonlariga mos." : "Plagiat xatari mavjud."}
                </p>
              </div>

              {/* Card 2: AI Probability */}
              <div className={`rounded-2xl border p-6 ${
                result.aiScore < 30
                  ? "border-blue-500/30 bg-blue-500/10 text-blue-300"
                  : result.aiScore < 60
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                  : "border-red-500/30 bg-red-500/10 text-red-300"
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">AI Matn Ehtimoli</span>
                  <Zap className="h-5 w-5" />
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl font-black">{result.aiScore}%</span>
                  <span className="text-xs font-medium opacity-80">AI belgilari</span>
                </div>
                <p className="mt-2 text-xs opacity-75">{result.verdictUz}</p>
              </div>

              {/* Card 3: Human Content */}
              <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-cyan-300">Inson omili (Tabiiylik)</span>
                  <CheckCircle2 className="h-5 w-5 text-cyan-400" />
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl font-black text-cyan-400">{result.humanScore}%</span>
                  <span className="text-xs font-medium text-cyan-300/80">Insoniy til</span>
                </div>
                <p className="mt-2 text-xs text-cyan-200/70">Tabiiy jumla tuzilmalari</p>
              </div>

              {/* Card 4: Plagiarism Risk */}
              <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-purple-300">O&apos;xshashlik (Plagiat xatari)</span>
                  <AlertTriangle className="h-5 w-5 text-purple-400" />
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl font-black text-purple-400">
                    {result.plagiarismScore}%
                  </span>
                  <span className="text-xs font-medium text-purple-300/80">Olingan qismlar</span>
                </div>
                <p className="mt-2 text-xs text-purple-200/70">Antiplagiat tizimlari uchun ruxsat etilgan mezon</p>
              </div>
            </div>

            {/* Detailed Findings & Recommendations */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Sentence Highlights (7 cols) */}
              <div className="rounded-3xl border border-border bg-surface p-6 lg:col-span-7">
                <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
                  <h3 className="text-sm font-bold text-foreground">Gapma-gap tahlil va belgilar</h3>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" /> Inson
                    </span>
                    <span className="flex items-center gap-1 text-amber-400">
                      <span className="h-2 w-2 rounded-full bg-amber-400" /> AI ehtimoli
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-sm leading-relaxed">
                  {result.sentenceAnalysis.map((s, idx) => (
                    <span
                      key={idx}
                      className={`inline rounded px-1.5 py-0.5 mr-1 ${
                        s.type === "ai"
                          ? "bg-amber-500/20 text-amber-300 border-b border-amber-500/40"
                          : "text-foreground hover:bg-emerald-500/10"
                      }`}
                    >
                      {s.text}{" "}
                    </span>
                  ))}
                </div>
              </div>

              {/* Summary and Advice (5 cols) */}
              <div className="space-y-6 lg:col-span-5">
                <div className="rounded-3xl border border-border bg-surface p-6">
                  <h3 className="mb-3 text-sm font-bold text-foreground">Ekspert xulosasi</h3>
                  <p className="text-xs leading-relaxed text-foreground-secondary">
                    {result.summaryUz}
                  </p>

                  <h4 className="mt-6 mb-2 text-xs font-bold uppercase tracking-wider text-foreground">
                    Tavsiyalar:
                  </h4>
                  <ul className="space-y-2">
                    {result.suggestionsUz.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-foreground-secondary">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 flex gap-2 border-t border-border pt-4">
                    <Button
                      variant="outline"
                      onClick={handleCopyReport}
                      className="w-full text-xs font-semibold"
                    >
                      <Copy className="mr-1.5 h-3.5 w-3.5" /> Hisobotdan nusxa olish
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.print()}
                      className="w-full text-xs font-semibold"
                    >
                      <Printer className="mr-1.5 h-3.5 w-3.5" /> Chop etish
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
