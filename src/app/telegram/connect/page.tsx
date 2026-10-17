"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

function TelegramConnectInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const { data: session, status } = useSession();
  const [connecting, setConnecting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleConnect = async () => {
    if (!token) return;
    setConnecting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/telegram/docnova-ai/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
      } else {
        setErrorMessage(data.error || "Bog'lashda xatolik yuz berdi.");
      }
    } catch {
      setErrorMessage("Internet bilan aloqa uzildi. Qaytadan urinib ko'ring.");
    } finally {
      setConnecting(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-white">
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center shadow-xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold">Xavfsizlik tokeni topilmadi</h2>
          <p className="text-sm text-slate-400">
            Telegram bot orqali yangi havola oling. Buning uchun botda <code>/start</code>{" "}
            buyrug&apos;ini yuboring.
          </p>
          <a
            href="https://t.me/DocNovaAI_bot"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-500"
          >
            <Send className="h-4 w-4" />
            @DocNovaAI_bot ga o&apos;tish
          </a>
        </div>
      </div>
    );
  }

  const getCanonicalCallbackUrl = () => {
    if (typeof window === "undefined") return "https://www.docnova.uz/academic";
    const pathAndQuery = `${window.location.pathname}${window.location.search}`;
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return pathAndQuery;
    }
    return `https://www.docnova.uz${pathAndQuery}`;
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 text-white">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-md sm:p-8">
        {/* Header Branding */}
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
            <Sparkles className="h-3.5 w-3.5" />
            DocNova AI Telegram Integratsiyasi
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Telegram Hisobni Ulash</h1>
          <p className="text-xs text-slate-400 sm:text-sm">
            @DocNovaAI_bot orqali ilmiy ishlarni yaratish va Word fayllarni yuklab olish
          </p>
        </div>

        {/* Loading Session */}
        {status === "loading" && (
          <div className="flex flex-col items-center justify-center space-y-3 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-sm text-slate-400">Hisob holati tekshirilmoqda...</p>
          </div>
        )}

        {/* Unauthenticated: Sign in prompt */}
        {status === "unauthenticated" && (
          <div className="space-y-4">
            <div className="space-y-2 rounded-2xl border border-slate-700/50 bg-slate-800/60 p-4 text-xs text-slate-300">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-400">
                <ShieldCheck className="h-4 w-4" />
                Xavfsiz avtorizatsiya
              </div>
              <p>
                Telegram profilingizni DocNova bilan bog&apos;lash uchun platformadagi hisobingizga
                kiring. Agar yangi bo&apos;lsangiz, bir zumda ro&apos;yxatdan o&apos;tishingiz
                mumkin.
              </p>
            </div>

            <button
              onClick={() => signIn("google", { callbackUrl: getCanonicalCallbackUrl() })}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3.5 font-semibold text-slate-900 shadow-lg transition hover:bg-slate-100"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.36 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.98 0 12s.45 3.84 1.24 5.42l4.04-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              Google orqali kirish
            </button>

            <Link
              href={`/login?callbackUrl=${encodeURIComponent(getCanonicalCallbackUrl())}`}
              className="block py-1 text-center text-xs text-slate-400 transition hover:text-white"
            >
              Email va parol orqali kirish
            </Link>
          </div>
        )}

        {/* Authenticated: Connecting or Connected */}
        {status === "authenticated" && (
          <div className="space-y-5">
            {!connecting && !success && !errorMessage && (
              <div className="space-y-4">
                <div className="space-y-2 rounded-2xl border border-slate-700/50 bg-slate-800/60 p-4 text-xs text-slate-300">
                  <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Tizimga muvaffaqiyatli kirdingiz
                  </div>
                  <p>
                    Profil: <strong>{session?.user?.name || session?.user?.email}</strong>
                    <br />
                    Email: <code>{session?.user?.email}</code>
                  </p>
                  <p className="text-xs text-slate-400">
                    Ushbu DocNova hisobingizni @DocNovaAI_bot ga bog&apos;lashni tasdiqlaysizmi?
                  </p>
                </div>

                <button
                  onClick={handleConnect}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 font-semibold text-white shadow-lg transition hover:from-blue-500 hover:to-indigo-500"
                >
                  <Send className="h-4 w-4" />
                  Bog&apos;lashni tasdiqlash
                </button>
              </div>
            )}

            {connecting && (
              <div className="flex flex-col items-center justify-center space-y-3 py-6">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                <p className="text-sm font-medium text-slate-300">
                  Hisobingiz Telegram botga bog&apos;lanmoqda...
                </p>
              </div>
            )}

            {success && (
              <div className="space-y-4 py-2 text-center">
                <div className="animate-in zoom-in-75 mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-emerald-400">
                    Muvaffaqiyatli bog&apos;landi!
                  </h3>
                  <p className="text-xs text-slate-300">
                    Sizning DocNova hisobingiz (<strong>{session?.user?.email}</strong>) Telegram
                    botga ulandi.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-3 text-left text-xs text-slate-400">
                  ✅ Botga tasdiqlovchi xabar yuborildi.
                  <br />✅ Akademik xizmatlar (Kurs ishi, Referat, BMI, Taqdimot) faollashdi.
                </div>
                <a
                  href="https://t.me/DocNovaAI_bot"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 font-semibold text-white shadow-lg transition hover:from-blue-500 hover:to-indigo-500"
                >
                  <Send className="h-4 w-4" />
                  Telegram botga qaytish
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            )}

            {errorMessage && !success && (
              <div className="space-y-4 py-2 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-rose-500/20 bg-rose-500/10 text-rose-400">
                  <AlertCircle className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-rose-400">Bog&apos;lashda xatolik</h3>
                  <p className="text-xs text-slate-400">{errorMessage}</p>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={handleConnect}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-700"
                  >
                    Qaytadan urinish
                  </button>
                  <a
                    href="https://t.me/DocNovaAI_bot"
                    className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-center text-xs font-semibold text-white transition hover:bg-blue-500"
                  >
                    Botga qaytish va yangi havola olish
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TelegramConnectPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      }
    >
      <TelegramConnectInner />
    </Suspense>
  );
}
