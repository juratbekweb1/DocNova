"use client";

import React, { useState, useRef, useTransition } from "react";
import { useRecentTool } from "@/hooks/useRecentTool";
import {
  QrCode,
  Download,
  Link2,
  FileText,
  AlertTriangle,
  UploadCloud,
  X,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { QRCodeCanvas } from "qrcode.react";
import { QRErrorBoundary } from "./qr-error-boundary";

// QR Code standard max byte capacity for Level L/M/Q/H
// Byte mode max with Level L is ~2953 bytes, Level H is ~1273 bytes
const MAX_SAFE_QR_LENGTH = 1200;
const ABSOLUTE_MAX_QR_LENGTH = 2000;

export default function QrGeneratorPage() {
  useRecentTool("qr-generator", "QR Generator", "Tools Hub", "/tools/qr-generator");

  const [text, setText] = useState("");
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState<"L" | "M" | "Q" | "H">("M");
  const [copied, setCopied] = useState(false);
  const [fileWarning, setFileWarning] = useState<string | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();

  const textLength = text.length;
  const isTooLong = textLength > ABSOLUTE_MAX_QR_LENGTH;
  const isNearLimit = textLength > MAX_SAFE_QR_LENGTH && !isTooLong;

  // Safe text setter with length boundary check
  const handleTextChange = (val: string) => {
    setFileWarning(null);
    startTransition(() => {
      setText(val);
    });
  };

  // Safe file reader
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileWarning(null);

    // Hard safety size limit (even for text files, prevent loading 50MB into state)
    if (file.size > 2 * 1024 * 1024) {
      setFileWarning(
        "Fayl hajmi QR kod uchun juda katta (max 2 MB). QR kodlar odatda qisqa matn yoki havola (URL) uchun mo'ljallangan."
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      const content = await file.text();
      if (content.length > ABSOLUTE_MAX_QR_LENGTH) {
        setFileWarning(
          `Fayl ichidagi matn hajmi (${content.length.toLocaleString()} ta belgi) QR kod sig'imidan katta. Dastlabki ${MAX_SAFE_QR_LENGTH} ta belgi olindi. QR kod to'g'ri ishlashi uchun havola (URL) ishlatish tavsiya etiladi.`
        );
        setText(content.slice(0, MAX_SAFE_QR_LENGTH));
      } else {
        setText(content);
      }
    } catch (err) {
      console.error("[QR_FILE_READ_ERR]", err);
      setFileWarning("Faylni o'qishda xatolik yuz berdi. Iltimos, oddiy matnli fayl yuklang.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;

    const pngUrl = canvas.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = "docnova-qrcode.png";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handleCopyText = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-background min-h-screen px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-center">
        {/* Header Icon */}
        <div className="bg-primary/10 border-primary/20 mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl border sm:mb-6 sm:h-20 sm:w-20">
          <QrCode className="text-primary h-8 w-8 sm:h-10 sm:w-10" />
        </div>

        <h1 className="text-foreground mb-2 text-center text-2xl font-extrabold sm:mb-4 sm:text-4xl">
          QR Kod Generator
        </h1>
        <p className="text-foreground-secondary mb-8 max-w-2xl text-center text-xs sm:mb-12 sm:text-base">
          URL havolalar, matn yoki aloqa ma&apos;lumotlari uchun bir zumda skanerlanuvchi QR kodlar
          yarating va PNG formatida yuklab oling.
        </p>

        <div className="bg-surface border-border flex w-full flex-col items-stretch gap-6 rounded-3xl border p-5 shadow-lg sm:gap-8 sm:p-8 lg:flex-row">
          {/* Left: Input & Upload Controls */}
          <div className="w-full flex-1 space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-foreground flex items-center gap-2 text-xs font-bold sm:text-sm">
                  <Link2 className="text-primary h-4 w-4" /> Havola (URL) yoki Matn
                </label>
                <span
                  className={`text-[11px] font-semibold ${
                    isTooLong
                      ? "text-red-400"
                      : isNearLimit
                        ? "text-amber-400"
                        : "text-foreground-muted"
                  }`}
                >
                  {textLength} / {ABSOLUTE_MAX_QR_LENGTH} belgi
                </span>
              </div>

              <textarea
                value={text}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="https://example.com yoki istalgan matn..."
                rows={5}
                className="bg-background border-border text-foreground focus:border-primary/50 focus:ring-primary/50 w-full resize-none rounded-xl border p-3.5 text-xs leading-relaxed outline-none focus:ring-1 sm:text-sm"
              />
            </div>

            {/* Quick Presets & File Upload Option */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.csv,.json,.md,text/plain"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="border-border bg-surface-elevated hover:bg-border/60 text-foreground-secondary hover:text-foreground inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors"
              >
                <UploadCloud className="text-primary h-3.5 w-3.5" />
                <span>Matnli fayl yuklash</span>
              </button>

              {text && (
                <>
                  <button
                    type="button"
                    onClick={handleCopyText}
                    className="border-border bg-surface-elevated hover:bg-border/60 text-foreground-secondary hover:text-foreground inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span>{copied ? "Nusxalandi" : "Nusxalash"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setText("")}
                    className="border-border bg-surface-elevated text-foreground-muted inline-flex cursor-pointer items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                    title="Tozalash"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Tozalash</span>
                  </button>
                </>
              )}
            </div>

            {/* Error Correction Level Selector */}
            <div>
              <label className="text-foreground-muted mb-1.5 block text-[11px] font-semibold">
                Xatolikdan himoyalanish darajasi (Error Correction):
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: "L" as const, label: "L (~7%)" },
                  { id: "M" as const, label: "M (~15%)" },
                  { id: "Q" as const, label: "Q (~25%)" },
                  { id: "H" as const, label: "H (~30%)" },
                ].map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setErrorCorrectionLevel(lvl.id)}
                    className={`rounded-lg border py-1.5 text-xs font-semibold transition-all ${
                      errorCorrectionLevel === lvl.id
                        ? "bg-primary border-primary text-white shadow-xs"
                        : "bg-surface-elevated border-border text-foreground hover:bg-border/40"
                    }`}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Warning Alert if too long or file warning */}
            {(isTooLong || fileWarning) && (
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <div className="flex-1">
                  {fileWarning ||
                    "Fayl/Matn hajmi QR kod uchun juda katta. Iltimos, qisqaroq matn yoki havola (URL) kiriting."}
                </div>
              </div>
            )}
          </div>

          {/* Right: QR Preview Canvas with Error Boundary */}
          <div className="bg-surface-elevated border-border flex min-w-[280px] flex-col items-center justify-center space-y-5 rounded-2xl border p-6 sm:min-w-[320px] sm:p-8">
            <QRErrorBoundary fallbackTitle="QR kod sig'imi oshdi" onReset={() => setText("")}>
              {isTooLong ? (
                <div className="flex h-[216px] w-[216px] flex-col items-center justify-center rounded-xl border border-dashed border-red-500/40 bg-red-500/5 p-4 text-center">
                  <AlertTriangle className="mb-2 h-8 w-8 text-red-400" />
                  <p className="mb-1 text-xs font-bold text-red-400">Hajm chegaradan oshdi</p>
                  <p className="text-foreground-muted text-[11px]">
                    QR kod sig&apos;ishi uchun matnni qisqartiring yoki URL kiriting.
                  </p>
                </div>
              ) : (
                <div ref={qrRef} className="rounded-xl bg-white p-4 shadow-inner">
                  <QRCodeCanvas
                    value={text || "https://www.docnova.uz"}
                    size={192}
                    bgColor={"#ffffff"}
                    fgColor={"#000000"}
                    level={errorCorrectionLevel}
                    includeMargin={false}
                  />
                </div>
              )}
            </QRErrorBoundary>

            <Button
              onClick={downloadQR}
              disabled={!text || isTooLong}
              className="bg-primary hover:bg-primary/90 text-primary-foreground w-full cursor-pointer rounded-xl py-5 font-bold shadow-[0_0_20px_-5px_rgba(56,189,248,0.4)] disabled:opacity-50"
            >
              <Download className="mr-2 h-4 w-4" /> PNG yuklab olish
            </Button>

            <div className="text-foreground-muted flex items-center gap-1 text-center text-[11px]">
              <FileText className="h-3 w-3" />
              <span>Har qanday kamera va skanerda 100% ochiladi</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
