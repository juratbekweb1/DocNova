"use client";

import React, { useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import {
  CheckSquare,
  Sparkles,
  Loader2,
  FileDown,
  Copy,
  Check,
  Printer,
  HelpCircle,
  BookOpen,
  Presentation,
  Plus,
  Minus,
} from "lucide-react";
import { StudentSubNav } from "@/components/academic/student-sub-nav";
import { useToast } from "@/hooks/use-toast";

export default function AcademicExamPrepPage() {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    subject: "",
    topic: "",
    prepType: "Bilet savollari va to'liq yechimlar",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [slidesCount, setSlidesCount] = useState<number>(12);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.topic.trim()) {
      toast({
        title: "Maydonlarni to'ldiring",
        description: "Fan nomi va mavzuni kiritishingiz kerak.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/ai/academic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate-exam-prep",
          ...formData,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Material tuzishda xatolik yuz berdi");
      }

      setResult(data.result);
      toast({
        title: "Imtihon materiali tayyor!",
        description: "Bilet savollari va testlar muvaffaqiyatli shakllantirildi.",
      });
    } catch (err: unknown) {
      const e = err as Error;
      toast({
        title: "Xatolik yuz berdi",
        description: e.message || "Iltimos, qayta urinib ko'ring.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast({ title: "Nusxalandi!", description: "Matn xotiraga olindi." });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadDoc = () => {
    if (!result) return;
    const cleanTopic = formData.topic.slice(0, 30).replace(/[^a-zA-Z0-9]/g, "_") || "Imtihon";
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>${formData.topic}</title>
    <style>
      body { font-family: 'Calibri', sans-serif; font-size: 12pt; line-height: 1.4; margin: 20mm; }
      h1 { font-size: 16pt; color: #1e293b; font-weight: bold; border-bottom: 2px solid #0ea5e9; padding-bottom: 6px; }
      h2 { font-size: 13pt; color: #0f172a; font-weight: bold; margin-top: 15px; }
      p { margin-bottom: 10px; }
    </style></head><body>`;
    const footer = "</body></html>";
    const formattedBody = result
      .replace(/^# (.*$)/gim, "<h1>$1</h1>")
      .replace(/^## (.*$)/gim, "<h2>$1</h2>")
      .replace(/^### (.*$)/gim, "<h3>$1</h3>")
      .replace(/\n\n/g, "</p><p>");

    const blob = new Blob([header + "<p>" + formattedBody + "</p>" + footer], {
      type: "application/msword",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Imtihon_${cleanTopic}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-background text-foreground min-h-screen pb-20">
      <StudentSubNav activeTab="exam-prep" />

      {/* Top Banner */}
      <div className="border-border bg-surface/30 border-b px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-400">
              <CheckSquare className="h-3.5 w-3.5" />
              <span>Sessiya & Oraliq Nazoratlar</span>
            </div>
            <h1 className="text-foreground text-2xl font-extrabold sm:text-3xl">
              Test va Imtihonlarga tayyorgarlik
            </h1>
            <p className="text-foreground-secondary mt-1 max-w-2xl text-xs sm:text-sm">
              Fanlar bo&apos;yicha imtihon biletlari, 10 talik test savollari (MCQ) va to&apos;liq
              tushuntirishli yechimlar to&apos;plami.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* Left Form */}
          <div className="border-border bg-surface rounded-2xl border p-6 shadow-sm lg:col-span-5">
            <h2 className="text-foreground mb-4 flex items-center gap-2 text-lg font-bold">
              <BookOpen className="h-5 w-5 text-purple-400" />
              Imtihon talablari
            </h2>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="text-foreground-secondary mb-1 block text-xs font-semibold">
                  Fan nomi *
                </label>
                <input
                  type="text"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Masalan: Axborot xavfsizligi, Oliy matematika..."
                  className="border-border bg-background text-foreground w-full rounded-xl border px-3.5 py-2.5 text-xs focus:border-purple-400 focus:outline-none sm:text-sm"
                />
              </div>

              <div>
                <label className="text-foreground-secondary mb-1 block text-xs font-semibold">
                  Mavzu yoki savollar ro&apos;yxati *
                </label>
                <input
                  type="text"
                  name="topic"
                  required
                  value={formData.topic}
                  onChange={handleChange}
                  placeholder="Masalan: Kriptografiya asoslari va RSA algoritmi..."
                  className="border-border bg-background text-foreground w-full rounded-xl border px-3.5 py-2.5 text-xs focus:border-purple-400 focus:outline-none sm:text-sm"
                />
              </div>

              <div>
                <label className="text-foreground-secondary mb-1 block text-xs font-semibold">
                  Tayyorgarlik rejimi
                </label>
                <select
                  name="prepType"
                  value={formData.prepType}
                  onChange={handleChange}
                  className="border-border bg-background text-foreground w-full rounded-xl border px-3.5 py-2.5 text-xs focus:border-purple-400 focus:outline-none sm:text-sm"
                >
                  <option value="Bilet savollari va to'liq yechimlar">
                    Bilet savollari va to&apos;liq yozma javoblar
                  </option>
                  <option value="Variantli Testlar (MCQ 10 ta)">
                    Variantli Testlar (MCQ 10 ta savol + to&apos;g&apos;ri javob izohi)
                  </option>
                  <option value="Tezkor shpargalka va qisqa konspekt">
                    Tezkor shpargalka va qisqa konspekt
                  </option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3.5 text-xs font-bold text-white shadow-lg shadow-purple-600/20 transition-all hover:scale-[1.01] hover:bg-purple-500 disabled:opacity-50 sm:text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Materiallar tayyorlanmoqda...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Imtihon materiallarini yaratish</span>
                  </>
                )}
              </button>

              {/* IMTIHON SLAYDLARI: FOYDALANUVCHI O'ZI XOHLAGANCHA SLAYD QO'SHADI */}
              <div className="mt-4 space-y-2.5 rounded-xl border border-purple-500/30 bg-purple-500/5 p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Presentation className="h-4 w-4 text-purple-400" />
                    <span className="text-foreground text-xs font-bold">
                      Imtihon ko&apos;rgazmali slaydlari (PPTX)
                    </span>
                  </div>
                  <span className="text-xs font-bold text-purple-400">{slidesCount} ta slayd</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-foreground-secondary text-[11px]">Slayd soni:</span>
                  <button
                    type="button"
                    onClick={() => setSlidesCount((prev) => Math.max(1, prev - 1))}
                    className="border-border bg-background hover:bg-surface-elevated flex h-7 w-7 cursor-pointer items-center justify-center rounded border text-xs font-bold"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={slidesCount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) setSlidesCount(Math.min(60, Math.max(1, val)));
                    }}
                    className="border-border bg-background text-foreground h-7 w-14 rounded border text-center text-xs font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setSlidesCount((prev) => Math.min(60, prev + 1))}
                    className="border-border bg-background hover:bg-surface-elevated flex h-7 w-7 cursor-pointer items-center justify-center rounded border text-xs font-bold"
                  >
                    <Plus className="h-3 w-3" />
                  </button>

                  <div className="ml-auto flex items-center gap-1">
                    {[8, 12, 16].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setSlidesCount(cnt)}
                        className={`cursor-pointer rounded border px-2 py-0.5 text-[10px] ${
                          slidesCount === cnt
                            ? "border-purple-600 bg-purple-600 font-bold text-white"
                            : "bg-background border-border text-foreground hover:bg-surface-elevated"
                        }`}
                      >
                        {cnt}
                      </button>
                    ))}
                  </div>
                </div>

                <Link
                  href={`/academic/presentation?topic=${encodeURIComponent(
                    formData.topic || formData.subject || "Imtihon savollari"
                  )}&slides=${slidesCount}&type=exam`}
                  className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-600/20 px-3 py-2 text-xs font-bold text-purple-300 transition-all hover:bg-purple-600/30"
                >
                  <Presentation className="h-3.5 w-3.5" />
                  <span>{slidesCount} ta slaydli imtihon ko&apos;rgazmasi yaratish →</span>
                </Link>
              </div>
            </form>
          </div>

          {/* Right Preview */}
          <div className="flex flex-col lg:col-span-7">
            {result ? (
              <div className="space-y-4">
                {/* Cross-Sell Slides Banner */}
                <Link
                  href={`/academic/presentation?topic=${encodeURIComponent(
                    formData.topic || formData.subject
                  )}&slides=${slidesCount}&type=exam`}
                  className="group flex items-center justify-between rounded-xl border border-purple-500/40 bg-gradient-to-r from-purple-500/15 via-pink-500/10 to-transparent p-3.5 transition-all hover:border-purple-500/70"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-purple-500/20 p-2 text-purple-400">
                      <Presentation className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-foreground flex items-center gap-2 text-xs font-bold sm:text-sm">
                        <span>
                          Biletlar va savollar bo&apos;yicha slaydlar (PPTX) tayyorlaysizmi?
                        </span>
                        <span className="rounded bg-purple-500/20 px-2 py-0.5 text-[10px] font-semibold text-purple-300">
                          {slidesCount} ta slayd
                        </span>
                      </div>
                      <div className="text-foreground-secondary text-[11px]">
                        Vizual xotira va taqdimot uchun savol-javobli slaydlar
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-purple-400 transition-transform group-hover:translate-x-1">
                    <span>Slaydlar yaratish</span>
                    <span>→</span>
                  </div>
                </Link>

                <div className="border-border bg-surface flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3">
                  <div className="text-foreground text-xs font-semibold">
                    📄 Imtihon materiallari tayyor
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="border-border bg-surface-elevated text-foreground hover:bg-border/60 flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span>{copied ? "Nusxalandi" : "Nusxa"}</span>
                    </button>
                    <button
                      onClick={handleDownloadDoc}
                      className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-purple-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-purple-500"
                    >
                      <FileDown className="h-3.5 w-3.5" />
                      <span>Word (.doc) yuklash</span>
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="border-border bg-surface-elevated text-foreground hover:bg-border/60 flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Chop etish</span>
                    </button>
                  </div>
                </div>

                <div className="border-border bg-surface max-h-[800px] overflow-y-auto rounded-2xl border p-6 text-xs leading-relaxed shadow-xl sm:p-8 sm:text-sm">
                  <div className="prose prose-invert text-foreground max-w-none">
                    <ReactMarkdown>{result}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-border bg-surface/40 flex min-h-[400px] flex-col items-center justify-center space-y-3 rounded-2xl border border-dashed p-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400">
                  <HelpCircle className="h-7 w-7" />
                </div>
                <h3 className="text-foreground text-base font-bold">
                  Imtihon savollari va javoblari shu yerda ko&apos;rinadi
                </h3>
                <p className="text-foreground-secondary max-w-md text-xs sm:text-sm">
                  Fan va mavzuni kiriting. AI imtihonda tushishi mumkin bo&apos;lgan asosiy bilet
                  savollarini va to&apos;liq tushuntirishli yechimlarini tuzib beradi.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
