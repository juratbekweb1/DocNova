"use client";

import React, { useState } from "react";
import { useRecentTool } from "@/hooks/useRecentTool";
import { Layers, Loader2, Upload, Trash2, File, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UpgradeModal } from "@/components/modals/upgrade-modal";
import { useToast } from "@/hooks/use-toast";
import {
  getDirectStorageCapability,
  uploadFileDirectlyToStorage,
  type DirectUploadProgress,
} from "@/lib/storage/client-upload";
import type { UploadedStorageFile } from "@/lib/storage/direct-upload-shared";
import { UploadProgressBar } from "@/components/ui/upload-progress-bar";

const SERVERLESS_FALLBACK_MAX_BYTES = 4 * 1024 * 1024;

export default function MergePdfPage() {
  useRecentTool("merge-pdf", "Merge PDF", "Tools Hub", "/tools/merge-pdf");
  const { toast } = useToast();

  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<DirectUploadProgress | null>(null);
  const [stageLabel, setStageLabel] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files as FileList)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const triggerDownload = (url: string, fileName: string, revokeAfter = false) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (revokeAfter) {
      URL.revokeObjectURL(url);
    }
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      toast({
        title: "Fayllar yetarli emas",
        description: "Birlashtirish uchun kamida 2 ta PDF fayl tanlang.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
    setStageLabel("PDF fayllar bulutga yuklanmoqda...");
    setUploadProgress({ loaded: 0, total: totalBytes, percentage: 2 });

    try {
      const capability = await getDirectStorageCapability();
      let res: Response;

      if (capability.available && capability.provider) {
        const uploadedRefs: UploadedStorageFile[] = [];
        let completedBytes = 0;

        for (let i = 0; i < files.length; i++) {
          const current = files[i];
          setStageLabel(`Fayl yuklanmoqda (${i + 1}/${files.length}): ${current.name}`);
          const uploaded = await uploadFileDirectlyToStorage(current, {
            folder: "pdf",
            onProgress: (prog) => {
              const aggregateLoaded = Math.min(totalBytes, completedBytes + prog.loaded);
              const pct =
                totalBytes > 0
                  ? Math.min(100, Math.round((aggregateLoaded / totalBytes) * 100))
                  : 0;
              setUploadProgress({ loaded: aggregateLoaded, total: totalBytes, percentage: pct });
            },
          });

          if (!uploaded) {
            throw new Error(`"${current.name}" faylini bulutga yuklab bo'lmadi.`);
          }
          completedBytes += current.size;
          uploadedRefs.push(uploaded);
        }

        setStageLabel("PDF fayllar birlashtirilmoqda...");
        setUploadProgress({ loaded: totalBytes, total: totalBytes, percentage: 100 });
        res = await fetch("/api/pdf/merge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storageFiles: uploadedRefs }),
        });
      } else {
        if (totalBytes > SERVERLESS_FALLBACK_MAX_BYTES) {
          throw new Error(
            "Katta PDF fayllarni birlashtirish uchun bulut xotirasi (Storage) ulanishi kerak."
          );
        }
        setStageLabel("PDF fayllar birlashtirilmoqda...");
        const formData = new FormData();
        files.forEach((f) => formData.append("files", f));
        res = await fetch("/api/pdf/merge", {
          method: "POST",
          body: formData,
        });
      }

      if (res.status === 403) {
        setShowUpgrade(true);
        return;
      }

      if (!res.ok) {
        let errorMsg = "Fayllarni birlashtirishda xatolik yuz berdi.";
        try {
          const errData = await res.json();
          if (errData?.error) errorMsg = errData.error;
        } catch {
          // ignore json parse error
        }
        throw new Error(errorMsg);
      }

      const contentType = (res.headers.get("content-type") || "").toLowerCase();
      if (contentType.includes("application/json")) {
        const data = (await res.json()) as { downloadUrl?: string; fileName?: string };
        if (!data.downloadUrl) {
          throw new Error("Yuklab olish havolasi olinmadi.");
        }
        const dlRes = await fetch(data.downloadUrl);
        if (dlRes.ok) {
          const blob = await dlRes.blob();
          const url = URL.createObjectURL(blob);
          triggerDownload(url, data.fileName || "docnova_merged.pdf", true);
        } else {
          triggerDownload(data.downloadUrl, data.fileName || "docnova_merged.pdf");
        }
      } else {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        triggerDownload(url, "docnova_merged.pdf", true);
      }

      toast({
        title: "Muvaffaqiyatli! ✅",
        description: "PDF fayllar birlashtirildi va yuklab olish boshlandi.",
      });
    } catch (error) {
      console.error("[Merge PDF Client Error]:", error);
      toast({
        title: "Xatolik yuz berdi",
        description:
          error instanceof Error
            ? error.message
            : "PDF fayllarni birlashtirishda xatolik yuz berdi.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setUploadProgress(null);
      setStageLabel("");
    }
  };

  return (
    <div className="bg-background min-h-screen px-6 py-12">
      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />

      <div className="mx-auto mt-12 flex max-w-4xl flex-col items-center justify-center">
        <div className="bg-primary/10 border-primary/20 mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl border shadow-[0_0_25px_rgba(14,165,233,0.25)]">
          <Layers className="text-primary h-10 w-10" />
        </div>
        <h1 className="text-foreground mb-4 text-center text-4xl font-extrabold">
          PDF Birlashtirish
        </h1>
        <p className="text-foreground-secondary mb-12 max-w-2xl text-center text-lg">
          Bir nechta PDF hujjatlarini tartibli bitta faylga tez va oson birlashtiring (har biri 50
          MB gacha).
        </p>

        <div className="bg-surface border-border w-full rounded-3xl border p-8 shadow-lg">
          <div className="border-border hover:bg-surface-elevated relative mb-8 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition-colors">
            <input
              type="file"
              multiple
              accept=".pdf"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              onChange={handleFileChange}
            />
            <Upload className="text-foreground-muted mb-4 h-10 w-10" />
            <h3 className="text-foreground mb-2 text-lg font-bold">
              Fayllarni bu yerga tashlang yoki tanlang
            </h3>
            <p className="text-foreground-secondary text-sm">
              Faqat PDF (.pdf) formatidagi fayllar qabul qilinadi
            </p>
          </div>

          {files.length > 0 && (
            <div className="mb-6 space-y-3">
              <h4 className="text-foreground mb-4 font-bold">Tanlangan Fayllar ({files.length})</h4>
              {files.map((file, idx) => (
                <div
                  key={idx}
                  className="bg-background border-border flex items-center justify-between rounded-xl border p-4"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <File className="text-primary h-5 w-5 shrink-0" />
                    <span className="text-foreground truncate text-sm font-medium">
                      {file.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="text-foreground-muted shrink-0 rounded-lg p-2 transition-colors hover:bg-red-500/10 hover:text-red-500"
                    title="O'chirish"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {isProcessing && (
            <UploadProgressBar
              className="mb-6"
              percentage={uploadProgress?.percentage ?? 100}
              loadedBytes={uploadProgress?.loaded}
              totalBytes={uploadProgress?.total}
              indeterminate={!uploadProgress || uploadProgress.percentage >= 100}
              label={stageLabel || "Birlashtirilmoqda..."}
            />
          )}

          <Button
            onClick={handleMerge}
            disabled={files.length < 2 || isProcessing}
            className="bg-primary hover:bg-primary/90 text-primary-foreground w-full rounded-xl py-6 text-base font-bold shadow-[0_0_20px_-5px_rgba(56,189,248,0.4)] disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />{" "}
                {stageLabel || "Birlashtirilmoqda..."}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" /> PDF larni Birlashtirish
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
