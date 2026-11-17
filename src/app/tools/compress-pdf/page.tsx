"use client";

import React, { useState } from "react";
import { useRecentTool } from "@/hooks/useRecentTool";
import { Minimize2, Loader2, Upload, File, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UpgradeModal } from "@/components/modals/upgrade-modal";
import { useToast } from "@/hooks/use-toast";
import {
  uploadFileDirectlyToStorage,
  type DirectUploadProgress,
} from "@/lib/storage/client-upload";
import { UploadProgressBar } from "@/components/ui/upload-progress-bar";

const SERVERLESS_FALLBACK_MAX_BYTES = 4 * 1024 * 1024;

export default function CompressPdfPage() {
  useRecentTool("compress-pdf", "Compress PDF", "Tools Hub", "/tools/compress-pdf");
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<DirectUploadProgress | null>(null);
  const [stageLabel, setStageLabel] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [stats, setStats] = useState<{ original: number; compressed: number } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStats(null);
    }
  };

  const triggerDownload = (url: string, downloadName: string, revokeAfter = false) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadName;
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (revokeAfter) {
      URL.revokeObjectURL(url);
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
    setStageLabel("PDF bulutga yuklanmoqda...");
    setUploadProgress({ loaded: 0, total: file.size, percentage: 5 });

    try {
      const storageFile = await uploadFileDirectlyToStorage(file, {
        folder: "pdf",
        onProgress: (prog) => setUploadProgress(prog),
      });

      let res: Response;
      if (storageFile) {
        setStageLabel("PDF siqilmoqda va optimallashtirilmoqda...");
        setUploadProgress({ loaded: file.size, total: file.size, percentage: 100 });
        res = await fetch("/api/pdf/compress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storageFile }),
        });
      } else {
        if (file.size > SERVERLESS_FALLBACK_MAX_BYTES) {
          throw new Error(
            "Katta PDF fayllarni yuklash uchun bulut xotirasi (Storage) ulanishi kerak."
          );
        }
        setStageLabel("PDF siqilmoqda...");
        const formData = new FormData();
        formData.append("file", file);
        res = await fetch("/api/pdf/compress", {
          method: "POST",
          body: formData,
        });
      }

      if (res.status === 403) {
        setShowUpgrade(true);
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

      const contentType = (res.headers.get("content-type") || "").toLowerCase();
      let originalSize = file.size;
      let compressedSize = file.size;

      if (contentType.includes("application/json")) {
        const data = (await res.json()) as {
          downloadUrl?: string;
          fileName?: string;
          originalSize?: number;
          compressedSize?: number;
        };
        if (!data.downloadUrl) {
          throw new Error("Yuklab olish havolasi olinmadi.");
        }
        originalSize = data.originalSize ?? file.size;
        compressedSize = data.compressedSize ?? file.size;
        setStats({ original: originalSize, compressed: compressedSize });

        const dlRes = await fetch(data.downloadUrl);
        if (dlRes.ok) {
          const blob = await dlRes.blob();
          const url = URL.createObjectURL(blob);
          triggerDownload(url, data.fileName || `docnova_compressed_${file.name}`, true);
        } else {
          triggerDownload(data.downloadUrl, data.fileName || `docnova_compressed_${file.name}`);
        }
      } else {
        originalSize = Number(res.headers.get("X-Original-Size") || file.size);
        compressedSize = Number(res.headers.get("X-Compressed-Size") || file.size);
        setStats({ original: originalSize, compressed: compressedSize });

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        triggerDownload(url, `docnova_compressed_${file.name}`, true);
      }

      const savedPercent =
        originalSize > 0
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
      setUploadProgress(null);
      setStageLabel("");
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
    <div className="bg-background min-h-screen px-6 py-12">
      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />

      <div className="mx-auto mt-12 flex max-w-4xl flex-col items-center justify-center">
        <div className="bg-primary/10 border-primary/20 mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl border shadow-[0_0_25px_rgba(14,165,233,0.25)]">
          <Minimize2 className="text-primary h-10 w-10" />
        </div>
        <h1 className="text-foreground mb-4 text-center text-4xl font-extrabold">
          PDF Siqish (Compress)
        </h1>
        <p className="text-foreground-secondary mb-12 max-w-2xl text-center text-lg">
          PDF hujjat sifatini saqlagan holda uning hajmini kamaytiring va optimallashtiring (50 MB
          gacha qo&apos;llab-quvvatlanadi).
        </p>

        <div className="bg-surface border-border w-full rounded-3xl border p-8 shadow-lg">
          <div className="border-border hover:bg-surface-elevated relative mb-8 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition-colors">
            <input
              type="file"
              accept=".pdf"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              onChange={handleFileChange}
            />
            <Upload className="text-foreground-muted mb-4 h-10 w-10" />
            <h3 className="text-foreground mb-2 text-lg font-bold">
              Faylni bu yerga tashlang yoki tanlang
            </h3>
            <p className="text-foreground-secondary text-sm">
              Faqat PDF (.pdf) formatidagi fayllar qabul qilinadi (50 MB gacha)
            </p>
          </div>

          {file && (
            <div className="mb-6">
              <div className="bg-background border-border flex items-center justify-between rounded-xl border p-4">
                <div className="flex items-center gap-3 overflow-hidden">
                  <File className="text-primary h-5 w-5 shrink-0" />
                  <span className="text-foreground truncate text-sm font-medium">{file.name}</span>
                </div>
                <span className="text-foreground-secondary bg-surface-elevated rounded px-2 py-1 text-xs font-semibold">
                  {formatBytes(file.size)}
                </span>
              </div>

              {stats && (
                <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs sm:text-sm">
                  <div className="font-bold text-emerald-400">
                    Optimizatsiya: {formatBytes(stats.original)} → {formatBytes(stats.compressed)}
                  </div>
                  <div className="font-extrabold text-emerald-300">
                    -
                    {Math.max(
                      0,
                      Math.round(((stats.original - stats.compressed) / stats.original) * 100)
                    )}
                    %
                  </div>
                </div>
              )}
            </div>
          )}

          {isProcessing && (
            <UploadProgressBar
              className="mb-6"
              percentage={uploadProgress?.percentage ?? 100}
              loadedBytes={uploadProgress?.loaded}
              totalBytes={uploadProgress?.total}
              indeterminate={!uploadProgress || uploadProgress.percentage >= 100}
              label={stageLabel || "PDF siqilmoqda..."}
            />
          )}

          <Button
            onClick={handleCompress}
            disabled={!file || isProcessing}
            className="bg-primary hover:bg-primary/90 text-primary-foreground w-full rounded-xl py-6 text-base font-bold shadow-[0_0_20px_-5px_rgba(56,189,248,0.4)] disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> {stageLabel || "Siqilmoqda..."}
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
