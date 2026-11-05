"use client";

import React, { useState } from "react";
import { useRecentTool } from "@/hooks/useRecentTool";
import { GraduationCap, Sparkles, Loader2, Copy, Eraser, FileDown, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UpgradeModal } from "@/components/modals/upgrade-modal";
import { useToast } from "@/hooks/use-toast";
import { StudentSubNav } from "@/components/academic/student-sub-nav";
import { downloadAcademicDocx } from "@/lib/docx-download-client";

export default function AcademicEssayBuilderPage() {
  useRecentTool("essay-builder", "Essay Builder", "Academic Hub", "/academic/essay-builder");
  const { toast } = useToast();

  const [topic, setTopic] = useState("");
  const [field, setField] = useState("Ijtimoiy-gumanitar");
  const [essayType, setEssayType] = useState("Argumentativ (Isbotlovchi)");
  const [length, setLength] = useState("O'rtacha (3-5 bet)");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    setIsGenerating(true);
    try {
      const prompt = `Mavzu: ${topic}
Soha: ${field}
Insho turi: ${essayType}
Hajm: ${length}

Iltimos, ushbu mavzu bo'yicha to'liq akademik insho (essay) yozib ber. 
Quyidagi tuzilmani qat'iy saqla:
1. Kirish va asosiy tezis (Thesis Statement)
2. Mavzuning dolzarbligi va nazariy asosi
3. Asosiy dalillar va tahlil (3 ta mustahkam argument)
4. Qarshi tomon dalillari va ularning tahlili (Counter-arguments)
5. Xulosa va yakuniy xulosalar
6. Tavsiya etilgan ilmiy adabiyotlar ro'yxati (APA/Harvard formati)`;

      const res = await fetch("/api/ai/writer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, action: "write" }),
      });

      const data = await res.json();

      if (res.status === 403) {
        if (data.upgradeMessage) setUpgradeMessage(data.upgradeMessage);
        setShowUpgrade(true);
        setIsGenerating(false);
        return;
      }

      if (!res.ok) throw new Error("Failed to generate");

      setResult(data.result);
      toast({
        title: "Insho tayyor!",
        description: "Akademik insho muvaffaqiyatli shakllantirildi.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Xatolik",
        description: "Insho yaratishda xatolik yuz berdi.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    toast({ title: "Nusxalandi!", description: "Insho xotiraga nusxalandi." });
  };

  const downloadWordDoc = async () => {
    if (!result) return;
    try {
      const exported = await downloadAcademicDocx({
        topic: topic || "Akademik Insho",
        markdownContent: result,
        workType: `Akademik Insho (${essayType})`,
        subject: field,
      });

      if (exported.deliveryMethod !== "cancelled") {
        toast({
          title: "Word (.docx) yuklab olindi! 📄",
          description: `Insho .docx formatida va QR-kod (${exported.verificationCode}) bilan saqlandi.`,
        });
      }
    } catch (err) {
      console.error("[ESSAY_DOCX_EXPORT_ERR]", err);
      toast({
        title: "Xatolik",
        description: err instanceof Error ? err.message : "Word faylni yuklab olishda xatolik",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-background min-h-screen pb-16">
      <StudentSubNav activeTab="referat" />
      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        customMessage={upgradeMessage}
      />

      <div className="mx-auto mt-12 flex max-w-4xl flex-col items-center justify-center">
        <div className="bg-primary/10 border-primary/20 mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl border">
          <GraduationCap className="text-primary h-10 w-10" />
        </div>
        <h1 className="text-foreground mb-4 text-center text-4xl font-extrabold">
          Akademik Insho (Essay) Generator
        </h1>
        <p className="text-foreground-secondary mb-12 max-w-2xl text-center text-lg">
          Universitet, xalqaro dasturlar (IELTS, TOEFL, SAT) va ilmiy maqolalar uchun professional
          akademik insho yarating.
        </p>

        <div className="bg-surface border-border mb-12 w-full space-y-6 rounded-3xl border p-8 shadow-lg">
          <div>
            <label className="text-foreground mb-2 block text-sm font-semibold">
              Insho mavzusi
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Masalan: Sun'iy intellektning ta'lim tizimidagi roli va axloqiy muammolari"
              className="bg-background border-border text-foreground focus:border-primary/50 focus:ring-primary/50 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-1"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="text-foreground-secondary mb-1.5 block text-xs font-medium">
                Fan sohasi
              </label>
              <select
                value={field}
                onChange={(e) => setField(e.target.value)}
                className="bg-background border-border text-foreground w-full rounded-lg border px-3 py-2 text-xs outline-none"
              >
                <option>Ijtimoiy-gumanitar</option>
                <option>Axborot texnologiyalari & IT</option>
                <option>Iqtisodiyot va Moliya</option>
                <option>Tibbiyot va Salomatlik</option>
                <option>Tilshunoslik va Adabiyot</option>
                <option>Tabiiy fanlar</option>
              </select>
            </div>

            <div>
              <label className="text-foreground-secondary mb-1.5 block text-xs font-medium">
                Insho turi
              </label>
              <select
                value={essayType}
                onChange={(e) => setEssayType(e.target.value)}
                className="bg-background border-border text-foreground w-full rounded-lg border px-3 py-2 text-xs outline-none"
              >
                <option>Argumentativ (Isbotlovchi)</option>
                <option>Analitik (Tahliliy)</option>
                <option>Muammo va Yechim</option>
                <option>Taqqoslash va Qarama-qarshilik</option>
                <option>Tavsifiy (Narrative)</option>
              </select>
            </div>

            <div>
              <label className="text-foreground-secondary mb-1.5 block text-xs font-medium">
                Rejalashtirilgan hajm
              </label>
              <select
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className="bg-background border-border text-foreground w-full rounded-lg border px-3 py-2 text-xs outline-none"
              >
                <option>Qisqa (1-2 bet, ~500 so&apos;z)</option>
                <option>O&apos;rtacha (3-5 bet, ~1500 so&apos;z)</option>
                <option>Kengaytirilgan (6-8 bet, ~2500 so&apos;z)</option>
              </select>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!topic.trim() || isGenerating}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/25 flex w-full items-center justify-center gap-2 rounded-xl py-6 text-base font-bold shadow-lg disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Insho shakllantirilmoqda...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" /> Akademik Insho Yaratish
              </>
            )}
          </Button>
        </div>

        {result && (
          <div className="animate-in fade-in slide-in-from-bottom-8 bg-surface-elevated border-primary/20 relative w-full overflow-hidden rounded-3xl border p-8 shadow-2xl duration-700">
            <div className="border-border mb-6 flex flex-wrap items-center justify-between gap-4 border-b pb-4">
              <h3 className="text-foreground flex items-center gap-2 text-xl font-bold">
                <BookOpen className="text-primary h-5 w-5" /> Akademik Insho Natijasi
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setResult("");
                    setTopic("");
                  }}
                  className="border-border h-8 hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-500"
                >
                  <Eraser className="mr-1.5 h-4 w-4" /> Tozalash
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadWordDoc}
                  className="border-border h-8"
                >
                  <FileDown className="mr-1.5 h-4 w-4" /> Word (.doc)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className="border-border h-8"
                >
                  <Copy className="mr-1.5 h-4 w-4" /> Nusxalash
                </Button>
              </div>
            </div>

            <div className="text-foreground font-serif text-sm leading-relaxed whitespace-pre-wrap">
              {result}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
