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
  RotateCcw,
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
        description:
          "Iltimos, aniq tahlil qilish uchun kamida 15-20 ta so'zdan iborat matn kiriting.",
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
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Tekshirishda xatolik yuz berdi. Qayta urinib ko'ring.";
      toast({
        title: "Xatolik",
        description: message,
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
    <div className="bg-background text-foreground min-h-screen pb-20">
      {/* Subnav / Header Breadcrumbs */}
      <div className="border-border bg-surface/50 border-b px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="border-border bg-surface text-foreground-secondary hover:text-foreground hover:bg-surface-elevated inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Boshqaruv paneli
            </Link>
            <span className="text-border">/</span>
            <Link
              href="/refinement"
              className="text-foreground-secondary hover:text-foreground text-xs font-medium"
            >
              Tahrirlash
            </Link>
            <span className="text-border">/</span>
            <span className="text-primary text-xs font-semibold">Plagiat & AI Detektor</span>
          </div>

          <span className="border-primary/20 bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" /> Turnitin & Antiplagiat standarti
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="mb-8 text-center sm:text-left">
          <div className="bg-primary/10 text-primary mb-3 inline-flex items-center gap-2 rounded-xl p-2.5">
            <Search className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight sm:text-4xl">
            Plagiat va AI Detektor 🔍
          </h1>
          <p className="text-foreground-secondary mt-2 max-w-3xl text-sm font-light sm:text-base">
            Matningizni sun&apos;iy intellekt (ChatGPT, Claude, Gemini) generatsiyasi va internet
            manbalariga o&apos;xshashlik darajasiga chuqur tahlil qiling.
          </p>
        </div>

        {/* Editor Box */}
        <div className="border-border bg-surface rounded-3xl border p-6 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-foreground text-xs font-semibold">
                Tekshiriladigan matnni kiriting:
              </span>
              <button
                onClick={handleLoadSample}
                className="text-primary text-[11px] font-semibold hover:underline"
              >
                + Namunani yuklash
              </button>
            </div>
            <div className="text-foreground-secondary flex items-center gap-4 text-xs">
              <span>
                So&apos;zlar: <strong className="text-foreground">{wordCount}</strong>
              </span>
              <span>
                Belgilar: <strong className="text-foreground">{charCount}</strong>
              </span>
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
            className="border-border bg-background text-foreground placeholder:text-foreground-secondary/60 focus:border-primary/50 w-full rounded-2xl border p-4 text-sm leading-relaxed focus:outline-none"
          />

          <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <span className="text-foreground-secondary text-xs">
              ⚡️ OTM talabalari va ilmiy izlanuvchilar uchun 100% maxfiy va xavfsiz tahlil.
            </span>
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || wordCount < 10}
              className="bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary/90 w-full rounded-xl px-8 py-5 text-sm font-bold shadow-lg disabled:opacity-50 sm:w-auto"
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
          <div className="animate-in fade-in mt-8 space-y-8 duration-500">
            {/* Visual Score Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Card 1: Originality */}
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-300">
                    Unikallik (O&apos;ziga xoslik)
                  </span>
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl font-black text-emerald-400">
                    {result.originalityScore}%
                  </span>
                  <span className="text-xs font-medium text-emerald-300/80">Original matn</span>
                </div>
                <p className="mt-2 text-xs text-emerald-200/70">
                  {result.originalityScore >= 80
                    ? "A'lo daraja! OTM mezonlariga mos."
                    : "Plagiat xatari mavjud."}
                </p>
              </div>

              {/* Card 2: AI Probability */}
              <div
                className={`rounded-2xl border p-6 ${
                  result.aiScore < 30
                    ? "border-blue-500/30 bg-blue-500/10 text-blue-300"
                    : result.aiScore < 60
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                      : "border-red-500/30 bg-red-500/10 text-red-300"
                }`}
              >
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
                  <span className="text-xs font-semibold text-cyan-300">
                    Inson omili (Tabiiylik)
                  </span>
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
                  <span className="text-xs font-semibold text-purple-300">
                    O&apos;xshashlik (Plagiat xatari)
                  </span>
                  <AlertTriangle className="h-5 w-5 text-purple-400" />
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl font-black text-purple-400">
                    {result.plagiarismScore}%
                  </span>
                  <span className="text-xs font-medium text-purple-300/80">Olingan qismlar</span>
                </div>
                <p className="mt-2 text-xs text-purple-200/70">
                  Antiplagiat tizimlari uchun ruxsat etilgan mezon
                </p>
              </div>
            </div>

            {/* Detailed Findings & Recommendations */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Sentence Highlights (7 cols) */}
              <div className="border-border bg-surface rounded-3xl border p-6 lg:col-span-7">
                <div className="border-border mb-4 flex items-center justify-between border-b pb-3">
                  <h3 className="text-foreground text-sm font-bold">
                    Gapma-gap tahlil va belgilar
                  </h3>
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
                      className={`mr-1 inline rounded px-1.5 py-0.5 ${
                        s.type === "ai"
                          ? "border-b border-amber-500/40 bg-amber-500/20 text-amber-300"
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
                <div className="border-border bg-surface rounded-3xl border p-6">
                  <h3 className="text-foreground mb-3 text-sm font-bold">Ekspert xulosasi</h3>
                  <p className="text-foreground-secondary text-xs leading-relaxed">
                    {result.summaryUz}
                  </p>

                  <h4 className="text-foreground mt-6 mb-2 text-xs font-bold tracking-wider uppercase">
                    Tavsiyalar:
                  </h4>
                  <ul className="space-y-2">
                    {result.suggestionsUz.map((s, i) => (
                      <li
                        key={i}
                        className="text-foreground-secondary flex items-start gap-2 text-xs"
                      >
                        <CheckCircle2 className="text-primary mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="border-border mt-6 flex gap-2 border-t pt-4">
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
