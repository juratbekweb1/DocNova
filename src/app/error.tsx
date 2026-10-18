"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log non-sensitive error to console or monitoring
    console.error("[GLOBAL_APP_ERROR]", error?.message || "Unknown error");
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 shadow-inner">
        <AlertTriangle className="h-8 w-8" />
      </div>

      <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
        Kutilmagan xatolik yuz berdi
      </h1>

      <p className="mt-3 max-w-md text-sm text-slate-600 dark:text-slate-400">
        Tizimda vaqtinchalik nosozlik yuz berdi. Iltimos, sahifani qayta yuklab ko&apos;ring yoki
        bosh sahifaga qayting.
      </p>

      {error?.digest && (
        <p className="mt-2 font-mono text-xs text-slate-400">
          Xatolik kodi: <span className="font-semibold">{error.digest}</span>
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
        >
          <RotateCcw className="h-4 w-4" />
          Qaytadan urinish
        </button>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <Home className="h-4 w-4" />
          Bosh sahifa
        </Link>
      </div>
    </div>
  );
}
