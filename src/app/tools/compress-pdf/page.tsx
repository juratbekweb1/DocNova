"use client";

import React, { useState } from "react";
import { useRecentTool } from "@/hooks/useRecentTool";
import { Minimize2, Loader2, Upload, File, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UpgradeModal } from "@/components/modals/upgrade-modal";
import { useToast } from "@/hooks/use-toast";

export default function CompressPdfPage() {
  useRecentTool("compress-pdf", "Compress PDF", "Tools Hub", "/tools/compress-pdf");
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [stats, setStats] = useState<{ original: number; compressed: number } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStats(null);
    }
  };

  const handleCompress = async () => {
    if (!file) {
      toast({
        title: "Fayl tanlanmadi",
        description: "Iltimos, siqish uchun bitta PDF fayl tanlang.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setStats(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/pdf/compress", {
        method: "POST",
        body: formData,
      });

      if (res.status === 403) {
        setShowUpgrade(true);
        setIsProcessing(false);
        return;
      }

      if (!res.ok) {
        let errorMsg = "PDF faylni siqishda xatolik yuz berdi.";
        try {
          const errData = await res.json();
          if (errData?.error) errorMsg = errData.error;
        } catch {
          // ignore
        }
        throw new Error(errorMsg);
      }

      const originalSize = Number(res.headers.get("X-Original-Size") || file.size);
      const compressedSize = Number(res.headers.get("X-Compressed-Size") || file.size);
      setStats({ original: originalSize, compressed: compressedSize });

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `docnova_compressed_${file.name}`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);

      const savedPercent = originalSize > 0
        ? Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))
        : 0;

      toast({
        title: "Muvaffaqiyatli siqildi! ✅",
        description: `Hajmi: ${formatBytes(originalSize)} dan ${formatBytes(compressedSize)} ga kamaytirildi (-${savedPercent}%).`,
      });
    } catch (error) {
      console.error("[Compress PDF Client Error]:", error);
      toast({
        title: "Xatolik yuz berdi",
        description: error instanceof Error ? error.message : "Faylni siqishda xatolik yuz berdi.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />

      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center mt-12">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 mb-6 shadow-[0_0_25px_rgba(14,165,233,0.25)]">
          <Minimize2 className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-4xl font-extrabold text-foreground text-center mb-4">
          PDF Siqish (Compress)
        </h1>
        <p className="text-lg text-foreground-secondary text-center max-w-2xl mb-12">
          PDF hujjat sifatini saqlagan holda uning hajmini kamaytiring va optimallashtiring.
        </p>

        <div className="w-full bg-surface border border-border rounded-3xl p-8 shadow-lg">
          <div className="border-2 border-dashed border-border rounded-2xl p-12 flex flex-col items-center justify-center text-center hover:bg-surface-elevated transition-colors cursor-pointer relative mb-8">
            <input
              type="file"
              accept=".pdf"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
            />
            <Upload className="h-10 w-10 text-foreground-muted mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">Faylni bu yerga tashlang yoki tanlang</h3>
            <p className="text-sm text-foreground-secondary">Faqat PDF (.pdf) formatidagi fayllar qabul qilinadi</p>
          </div>

          {file && (
            <div className="mb-8">
              <div className="flex items-center justify-between p-4 bg-background border border-border rounded-xl">
                <div className="flex items-center gap-3 overflow-hidden">
                  <File className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm font-medium text-foreground truncate">{file.name}</span>
                </div>
                <span className="text-xs font-semibold text-foreground-secondary px-2 py-1 rounded bg-surface-elevated">
                  {formatBytes(file.size)}
                </span>
              </div>

              {stats && (
                <div className="mt-4 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between text-xs sm:text-sm">
                  <div className="text-emerald-400 font-bold">
                    Optimizatsiya: {formatBytes(stats.original)} → {formatBytes(stats.compressed)}
                  </div>
                  <div className="font-extrabold text-emerald-300">
                    -{Math.max(0, Math.round(((stats.original - stats.compressed) / stats.original) * 100))}%
                  </div>
                </div>
              )}
            </div>
          )}

          <Button
            onClick={handleCompress}
            disabled={!file || isProcessing}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 rounded-xl font-bold text-base shadow-[0_0_20px_-5px_rgba(56,189,248,0.4)] disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Siqilmoqda...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" /> PDF ni Siqish
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
