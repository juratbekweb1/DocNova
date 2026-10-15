"use client";

import React, { useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import {
  Award,
  BookOpen,
  FileDown,
  Printer,
  Copy,
  Check,
  Sparkles,
  Loader2,
  FileCheck2,
  Presentation,
  Plus,
  Minus,
} from "lucide-react";
import { StudentSubNav } from "@/components/academic/student-sub-nav";
import { useToast } from "@/hooks/use-toast";

export default function DiplomBmiPage() {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    university: "",
    faculty: "",
    topic: "",
    studentName: "",
    teacherName: "",
    workType: "Bakalavr Bitiruv Malakaviy Ishi (BMI)",
    part: "To'liq konsepsiya va Kirish",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [slidesCount, setSlidesCount] = useState<number>(15);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.topic.trim()) {
      toast({
        title: "Mavzuni kiriting",
        description: "Diplom yoki BMI mavzusi kiritilishi shart.",
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
          action: "generate-bmi",
          ...formData,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Generatsiyada xatolik yuz berdi");
      }

      setResult(data.result);
      toast({
        title: "BMI materiali tayyorlandi!",
        description: "Natijani Word (.doc) formatida yuklab olishingiz mumkin.",
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
    const cleanTopic = formData.topic.slice(0, 30).replace(/[^a-zA-Z0-9]/g, "_") || "BMI";
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>${formData.topic}</title>
    <style>
      body { font-family: 'Times New Roman', serif; font-size: 14pt; line-height: 1.5; margin: 25mm 20mm 20mm 25mm; text-align: justify; }
      h1 { font-size: 16pt; text-align: center; font-weight: bold; text-transform: uppercase; margin-bottom: 20px; }
      h2 { font-size: 14pt; font-weight: bold; margin-top: 15px; }
      p { margin-bottom: 12px; text-indent: 1.25cm; }
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
    a.download = `BMI_${cleanTopic}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-background text-foreground min-h-screen pb-20">
      <StudentSubNav activeTab="diplom-bmi" />

      {/* Top Banner */}
      <div className="border-border bg-surface/30 border-b px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
              <Award className="h-3.5 w-3.5" />
              <span>Bitiruv Malakaviy Ishi & Dissertatsiya</span>
            </div>
            <h1 className="text-foreground text-2xl font-extrabold sm:text-3xl">
              Diplom ishi va BMI yordamchisi
            </h1>
            <p className="text-foreground-secondary mt-1 max-w-2xl text-xs sm:text-sm">
              Bakalavriat bitiruv malakaviy ishlari va magistrlik dissertatsiyalari uchun kirish,
              boblar strukturasi, metodologiya va ilmiy yangilik apparatini tuzish.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* Left Form */}
          <div className="border-border bg-surface rounded-2xl border p-6 shadow-sm lg:col-span-5">
            <h2 className="text-foreground mb-4 flex items-center gap-2 text-lg font-bold">
              <FileCheck2 className="h-5 w-5 text-amber-400" />
              Tadqiqot parametrlari
            </h2>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="text-foreground-secondary mb-1 block text-xs font-semibold">
                  Ish turi
                </label>
                <select
                  name="workType"
                  value={formData.workType}
                  onChange={handleChange}
                  className="border-border bg-background text-foreground w-full rounded-xl border px-3.5 py-2.5 text-xs focus:border-amber-400 focus:outline-none sm:text-sm"
                >
                  <option value="Bakalavr Bitiruv Malakaviy Ishi (BMI)">
                    Bakalavr Bitiruv Malakaviy Ishi (BMI)
                  </option>
                  <option value="Magistrlik Dissertatsiyasi">Magistrlik Dissertatsiyasi</option>
                  <option value="Diplom Loyihasi (Muhandislik)">
                    Diplom Loyihasi (Muhandislik)
                  </option>
                </select>
              </div>

              <div>
                <label className="text-foreground-secondary mb-1 block text-xs font-semibold">
                  Tadqiqot mavzusi (Aniq va to&apos;liq) *
                </label>
                <input
                  type="text"
                  name="topic"
                  required
                  value={formData.topic}
                  onChange={handleChange}
                  placeholder="Masalan: Raqamli iqtisodiyot sharoitida bank xizmatlarini avtomatlashtirish..."
                  className="border-border bg-background text-foreground w-full rounded-xl border px-3.5 py-2.5 text-xs focus:border-amber-400 focus:outline-none sm:text-sm"
                />
              </div>

              <div>
                <label className="text-foreground-secondary mb-1 block text-xs font-semibold">
                  OTM va Fakultet
                </label>
                <input
                  type="text"
                  name="university"
                  value={formData.university}
                  onChange={handleChange}
                  placeholder="O'zbekiston Milliy Universiteti, Iqtisodiyot fakulteti..."
                  className="border-border bg-background text-foreground w-full rounded-xl border px-3.5 py-2.5 text-xs focus:border-amber-400 focus:outline-none sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-foreground-secondary mb-1 block text-xs font-semibold">
                    Talaba F.I.Sh.
                  </label>
                  <input
                    type="text"
                    name="studentName"
                    value={formData.studentName}
                    onChange={handleChange}
                    placeholder="Aliyev Vali"
                    className="border-border bg-background text-foreground w-full rounded-xl border px-3.5 py-2.5 text-xs focus:border-amber-400 focus:outline-none sm:text-sm"
                  />
                </div>
                <div>
                  <label className="text-foreground-secondary mb-1 block text-xs font-semibold">
                    Ilmiy rahbar
                  </label>
                  <input
                    type="text"
                    name="teacherName"
                    value={formData.teacherName}
                    onChange={handleChange}
                    placeholder="dots. Karimov A.A."
                    className="border-border bg-background text-foreground w-full rounded-xl border px-3.5 py-2.5 text-xs focus:border-amber-400 focus:outline-none sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-foreground-secondary mb-1 block text-xs font-semibold">
                  Shakllantiriladigan qism
                </label>
                <select
                  name="part"
                  value={formData.part}
                  onChange={handleChange}
                  className="border-border bg-background text-foreground w-full rounded-xl border px-3.5 py-2.5 text-xs focus:border-amber-400 focus:outline-none sm:text-sm"
                >
                  <option value="To'liq konsepsiya va Kirish">
                    To&apos;liq konsepsiya, Mundarija va Kirish apparati
                  </option>
                  <option value="I Bob. Nazariy-metodologik asoslar">
                    I Bob. Nazariy-metodologik asoslar rejasi va matni
                  </option>
                  <option value="II Bob. Amaliy va tahliliy tadqiqot">
                    II Bob. Amaliy tahliliy tadqiqot va metodlar
                  </option>
                  <option value="Xulosa va Foydalanilgan adabiyotlar">
                    Xulosa va GOST adabiyotlar ro&apos;yxati
                  </option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3.5 text-xs font-bold text-white shadow-lg shadow-amber-600/20 transition-all hover:scale-[1.01] hover:bg-amber-500 disabled:opacity-50 sm:text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>BMI generatsiya qilinmoqda...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>BMI materialini shakllantirish</span>
                  </>
                )}
              </button>

              {/* DIPLOM HIMOYASI SLAYDLARI: FOYDALANUVCHI O'ZI XOHLAGANCHA SLAYD QO'SHADI */}
              <div className="mt-4 space-y-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Presentation className="h-4 w-4 text-amber-400" />
                    <span className="text-foreground text-xs font-bold">
                      Diplom himoyasi uchun slaydlar (PPTX)
                    </span>
                  </div>
                  <span className="text-xs font-bold text-amber-400">{slidesCount} ta slayd</span>
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
                    {[10, 15, 20].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setSlidesCount(cnt)}
                        className={`cursor-pointer rounded border px-2 py-0.5 text-[10px] ${
                          slidesCount === cnt
                            ? "border-amber-600 bg-amber-600 font-bold text-white"
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
                    formData.topic || "Bitiruv Malakaviy Ishi"
                  )}&slides=${slidesCount}&type=diplom`}
                  className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-600/20 px-3 py-2 text-xs font-bold text-amber-300 transition-all hover:bg-amber-600/30"
                >
                  <Presentation className="h-3.5 w-3.5" />
                  <span>{slidesCount} ta slaydli himoya taqdimoti yaratish →</span>
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
                    formData.topic
                  )}&slides=${slidesCount}&type=diplom`}
                  className="group flex items-center justify-between rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent p-3.5 transition-all hover:border-amber-500/70"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-amber-500/20 p-2 text-amber-400">
                      <Presentation className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-foreground flex items-center gap-2 text-xs font-bold sm:text-sm">
                        <span>Himoya uchun taqdimot (PPTX) tayyormi?</span>
                        <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                          {slidesCount} ta slayd
                        </span>
                      </div>
                      <div className="text-foreground-secondary text-[11px]">
                        Diplom ishingiz asosida komissiya oldida so&apos;zlash uchun slaydlar va
                        ma&apos;ruzachi nutqi
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-400 transition-transform group-hover:translate-x-1">
                    <span>Slaydlar yaratish</span>
                    <span>→</span>
                  </div>
                </Link>

                {/* Actions bar */}
                <div className="border-border bg-surface flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3">
                  <div className="text-foreground text-xs font-semibold">📄 BMI hujjati tayyor</div>
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
                      className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-amber-500"
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

                {/* A4 Paper view */}
                <div className="border-border max-h-[800px] overflow-y-auto rounded-2xl border bg-white p-8 font-serif text-sm leading-relaxed text-slate-900 shadow-xl sm:p-12">
                  <div className="prose prose-slate max-w-none text-slate-900">
                    <ReactMarkdown>{result}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-border bg-surface/40 flex min-h-[400px] flex-col items-center justify-center space-y-3 rounded-2xl border border-dashed p-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
                  <BookOpen className="h-7 w-7" />
                </div>
                <h3 className="text-foreground text-base font-bold">
                  Diplom ishi va BMI materiali shu yerda shakllanadi
                </h3>
                <p className="text-foreground-secondary max-w-md text-xs sm:text-sm">
                  Chap tomondan tadqiqot mavzusi, OTM va kerakli bo&apos;limni tanlang. AI vazirlik
                  standartlariga mos kirish va reja tuzib beradi.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
