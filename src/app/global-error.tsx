"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function RootGlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[CRITICAL_ROOT_ERROR]", error?.message || "Root error");
  }, [error]);

  return (
    <html lang="uz">
      <body className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4 text-center font-sans text-white">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
            <AlertTriangle className="h-7 w-7" />
          </div>

          <h1 className="mt-5 text-2xl font-bold tracking-tight">Kritik xatolik yuz berdi</h1>

          <p className="mt-2 text-sm text-slate-400">
            Dastur yuklanishida xatolik yuz berdi. Iltimos, sahifani qaytadan yangilang.
          </p>

          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500"
            >
              <RotateCcw className="h-4 w-4" />
              Qaytadan urinish
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
