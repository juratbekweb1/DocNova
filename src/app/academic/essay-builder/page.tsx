"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useRecentTool } from "@/hooks/useRecentTool";
import {
  GraduationCap,
  Sparkles,
  Loader2,
  Copy,
  Eraser,
  FileDown,
  FileImage,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UpgradeModal } from "@/components/modals/upgrade-modal";
import { useToast } from "@/hooks/use-toast";
import { StudentSubNav } from "@/components/academic/student-sub-nav";
import { UrlImageModeSync } from "@/components/academic/creation-mode-selector";
import { ImageTopicParser } from "@/components/academic/image-topic-parser";
import { downloadAcademicDocx } from "@/lib/docx-download-client";

export default function AcademicEssayBuilderPage() {
  useRecentTool("essay-builder", "Essay Builder", "Academic Hub", "/academic/essay-builder");
  const { toast } = useToast();

  const [topic, setTopic] = useState("");
  const [field, setField] = useState("Ijtimoiy-gumanitar");
  const [essayType, setEssayType] = useState("Argumentativ (Isbotlovchi)");
  const [length, setLength] = useState("3-5 bet");
  const [showImageParser, setShowImageParser] = useState(false);
  const imageParserRef = useRef<HTMLDivElement>(null);
  const resultPreviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const openAndScroll = () => {
      setShowImageParser(true);
      window.setTimeout(() => {
        imageParserRef.current?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
      }, 60);
    };
    const handleUrlModeChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ mode?: string | null }>;
      const nextMode =
        customEvent.detail && "mode" in customEvent.detail
          ? customEvent.detail.mode
          : new URLSearchParams(window.location.search).get("mode");
      if (nextMode === "image") {
        openAndScroll();
      } else if (customEvent.detail?.mode === null) {
        setShowImageParser(false);
      }
    };
    const handlePopState = () => {
      if (new URLSearchParams(window.location.search).get("mode") === "image") {
        openAndScroll();
      }
    };
    window.addEventListener("docnova:url-mode-change", handleUrlModeChange);
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("docnova:url-mode-change", handleUrlModeChange);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);
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

        <div className="bg-surface border-border mb-12 w-full space-y-6 rounded-3xl border p-6 shadow-lg sm:p-8">
          <div className="flex flex-col gap-3 rounded-2xl border border-sky-500/25 bg-sky-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-0.5">
              <p className="text-foreground text-xs font-bold sm:text-sm">
                Mavzular rasm ko&apos;rinishida bormi?
              </p>
              <p className="text-foreground-muted text-xs">
                Telefon galereyasidan rasm tashlang — AI mavzularni ajratib, har biriga nechta bet
                yozilishini so&apos;raydi.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowImageParser(true);
                const inputEl = document.getElementById(
                  "image-upload-input"
                ) as HTMLInputElement | null;
                inputEl?.click();
              }}
              className="inline-flex min-h-[42px] shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-sky-600 sm:text-sm"
            >
              <FileImage className="h-4 w-4 shrink-0" />
              <span>Rasm tashlash</span>
            </button>
          </div>

          <div ref={imageParserRef} className={showImageParser ? "block" : "hidden"}>
            <Suspense fallback={null}>
              <UrlImageModeSync />
            </Suspense>
            <ImageTopicParser
              workType="essay"
              accentColor="blue"
              defaultPagesPerTopic="3-4"
              subjectHint={field}
              onImageSelected={() => setShowImageParser(true)}
              onApplyTopicsToForm={(topics) => {
                if (topics.length === 0) return;
                setTopic(topics[0].title);
                if (topics[0].pageCount) {
                  setLength(`${topics[0].pageCount} bet`);
                }
                toast({
                  title: "Rasmdan mavzu qo'llanildi!",
                  description: `${topics.length} ta mavzu aniqlandi va shaklga kiritildi.`,
                });
              }}
              onWorksGenerated={(works) => {
                if (works.length === 0) return;
                const combinedMarkdown = works
                  .map((w, idx) => `# ${idx + 1}. ${w.title}\n\n${w.content}`)
                  .join("\n\n---\n\n");
                const distinctPages = new Set(
                  works.map((w) => w.pageCount).filter((v): v is string => Boolean(v))
                );
                const syncedLength =
                  distinctPages.size === 1
                    ? `${Array.from(distinctPages)[0]} bet`
                    : works[0]?.pageCount
                      ? `${works[0].pageCount} bet`
                      : undefined;
                if (works[0]?.title?.trim()) {
                  setTopic(works[0].title.trim());
                }
                if (syncedLength) {
                  setLength(syncedLength);
                }
                setResult(combinedMarkdown);
                toast({
                  title: "Rasmdan tanlangan betlarda insho tayyor!",
                  description: `${works.length} ta mavzu bo'yicha akademik insholar yaratildi.`,
                });
                if (typeof window !== "undefined") {
                  window.setTimeout(() => {
                    resultPreviewRef.current?.scrollIntoView?.({
                      behavior: "smooth",
                      block: "start",
                    });
                  }, 80);
                }
              }}
              compact
            />
          </div>

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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
          </div>

          <div>
            <label className="text-foreground-secondary mb-1.5 block text-xs font-semibold">
              Rejalashtirilgan hajm (Nechta bet yozilsin?)
            </label>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {["1-2 bet", "3-5 bet", "6-8 bet", "10 bet", "15 bet"].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setLength(preset)}
                  className={`cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all ${
                    length === preset
                      ? "border-primary bg-primary text-primary-foreground shadow-xs"
                      : "border-border bg-background text-foreground-secondary hover:text-foreground"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={length}
              onChange={(e) => setLength(e.target.value)}
              placeholder="Yoki aniq bet sonini yozing (masalan: 7 bet)..."
              className="bg-background border-border text-foreground focus:border-primary/50 w-full rounded-xl border px-3.5 py-2 text-xs outline-none sm:text-sm"
            />
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

        <div ref={resultPreviewRef}>
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
    </div>
  );
}
