"use client";

import React, { useState } from "react";
import { useRecentTool } from "@/hooks/useRecentTool";
import { FileText, Loader2, Upload, File, Sparkles, Copy, Download, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UpgradeModal } from "@/components/modals/upgrade-modal";
import { useToast } from "@/hooks/use-toast";

export default function PdfToWordPage() {
  useRecentTool("pdf-to-word", "PDF to Text / Word", "Tools Hub", "/tools/pdf-to-word");
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [result, setResult] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult("");
    }
  };

  const handleExtract = async () => {
    if (!file) return;

    setIsProcessing(true);
    setResult("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/pdf/pdf-to-word", {
        method: "POST",
        body: formData,
      });

      if (res.status === 403) {
        setShowUpgrade(true);
        setIsProcessing(false);
        return;
      }

      if (!res.ok) throw new Error("Failed to extract");

      const data = await res.json();
      setResult(data.text);
      toast({ title: "Muvaffaqiyatli!", description: "PDF matni muvaffaqiyatli ajratib olindi." });
    } catch (error) {
      console.error(error);
      toast({
        title: "Xatolik",
        description: "PDF faylni qayta ishlashda xatolik yuz berdi.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    toast({ title: "Nusxalandi!", description: "Matn xotiraga nusxalandi." });
  };

  const downloadText = () => {
    const element = document.createElement("a");
    const fileBlob = new Blob([result], { type: "text/plain;charset=utf-8" });
    element.href = URL.createObjectURL(fileBlob);
    element.download = `Extracted_${file?.name.replace(".pdf", "") || "Document"}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast({ title: "Yuklab olindi", description: "Matn .txt fayl sifatida saqlandi." });
  };

  const downloadWordDoc = () => {
    if (!result) return;
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>DocNova Extracted Document</title><style>
      body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #111; }
      p { margin-bottom: 6pt; }
    </style></head><body>`;
    const footer = "</body></html>";
    const formattedHtml = result.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>");
    const sourceHTML = header + `<p>${formattedHtml}</p>` + footer;
    const source = "data:application/vnd.ms-word;charset=utf-8," + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `DocNova_${file?.name.replace(".pdf", "") || "Document"}.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
    toast({ title: "Yuklab olindi", description: "Hujjat Word (.doc) formatida saqlandi." });
  };

  return (
    <div className="bg-background min-h-screen px-6 py-12">
      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />

      <div className="mx-auto mt-12 flex max-w-4xl flex-col items-center justify-center">
        <div className="bg-primary/10 border-primary/20 mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl border">
          <FileText className="text-primary h-10 w-10" />
        </div>
        <h1 className="text-foreground mb-4 text-center text-4xl font-extrabold">
          PDF to Text / Word
        </h1>
        <p className="text-foreground-secondary mb-12 max-w-2xl text-center text-lg">
          PDF hujjatdagi barcha matnlarni bir zumda ajratib oling va Word (.doc) yoki Matn (.txt)
          shaklida saqlang.
        </p>

        <div className="bg-surface border-border w-full rounded-3xl border p-8 shadow-lg">
          {!result ? (
            <>
              <div className="border-border hover:bg-surface-elevated relative mb-8 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition-colors">
                <input
                  type="file"
                  accept=".pdf"
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  onChange={handleFileChange}
                />
                <Upload className="text-foreground-muted mb-4 h-10 w-10" />
                <h3 className="text-foreground mb-2 text-lg font-bold">
                  PDF faylni bu yerga tashlang yoki tanlang
                </h3>
                <p className="text-foreground-secondary text-sm">
                  Faqat .pdf formatidagi fayllar qabul qilinadi
                </p>
              </div>

              {file && (
                <div className="bg-background border-border mb-8 flex items-center gap-3 rounded-xl border p-4">
                  <File className="text-primary h-6 w-6 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate text-sm font-medium">{file.name}</p>
                    <p className="text-foreground-secondary text-xs">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    onClick={() => setFile(null)}
                    variant="ghost"
                    size="sm"
                    className="text-foreground-secondary hover:text-red-500"
                  >
                    O&apos;chirish
                  </Button>
                </div>
              )}

              <Button
                onClick={handleExtract}
                disabled={!file || isProcessing}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/25 flex w-full items-center justify-center gap-2 rounded-xl py-6 text-base font-bold shadow-lg disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Matn ajratilmoqda...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" /> Matnni ajratib olish
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-6">
              <div className="border-border flex flex-wrap items-center justify-between gap-4 border-b pb-4">
                <div>
                  <h3 className="text-foreground text-lg font-bold">Ajratib olingan matn</h3>
                  <p className="text-foreground-secondary text-xs">
                    {file?.name} ({result.split(/\s+/).length} so&apos;z)
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => setResult("")} variant="outline" size="sm">
                    Yangi fayl
                  </Button>
                  <Button onClick={copyToClipboard} variant="outline" size="sm" className="gap-1.5">
                    <Copy className="h-4 w-4" /> Nusxalash
                  </Button>
                  <Button onClick={downloadText} variant="outline" size="sm" className="gap-1.5">
                    <Download className="h-4 w-4" /> .TXT
                  </Button>
                  <Button
                    onClick={downloadWordDoc}
                    size="sm"
                    className="bg-primary text-primary-foreground gap-1.5 font-semibold"
                  >
                    <FileDown className="h-4 w-4" /> Word (.doc)
                  </Button>
                </div>
              </div>

              <div className="bg-background border-border text-foreground max-h-96 overflow-y-auto rounded-xl border p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                {result}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
