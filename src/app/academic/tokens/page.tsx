"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Coins,
  Sparkles,
  CheckCircle2,
  CreditCard,
  Loader2,
  Crown,
  ArrowRight,
  ShieldCheck,
  Zap,
  Plus,
  Minus,
  Lock,
  Wifi,
  Flame,
  Check,
} from "lucide-react";
import { StudentSubNav } from "@/components/academic/student-sub-nav";
import {
  ACADEMIC_TOKEN_PACKS,
  buildCustomTokenPack,
  type TokenPack,
} from "@/lib/billing/token-packs";

function getPriceBreakLabel(tokens: number): { perUnit: number; discount?: string } {
  if (tokens >= 20) return { perUnit: 3_000, discount: "40% super tejamkor" };
  if (tokens >= 10) return { perUnit: 3_500, discount: "30% tejamkor" };
  if (tokens >= 5) return { perUnit: 3_800, discount: "24% tejamkor" };
  if (tokens >= 3) return { perUnit: 4_000, discount: "20% tejamkor" };
  return { perUnit: 5_000 };
}

export default function AcademicTokensPage() {
  const { status } = useSession();
  const router = useRouter();

  const [tokensRemaining, setTokensRemaining] = useState<number | null>(null);
  const [userPlan, setUserPlan] = useState<string>("FREE");

  // Mode: "preset" or "custom"
  const [mode, setMode] = useState<"preset" | "custom">("preset");
  const [selectedPreset, setSelectedPreset] = useState<TokenPack>(ACADEMIC_TOKEN_PACKS[2]); // 5 ta token (Ommabop) default
  const [customCount, setCustomCount] = useState<number>(5);

  // PayX as default and recommended provider
  const [provider, setProvider] = useState<"payx" | "click" | "payme">("payx");
  const [cardNumber, setCardNumber] = useState<string>("");
  const [cardExpiry, setCardExpiry] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/user/usage")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) {
            setTokensRemaining(typeof data.academicTokens === "number" ? data.academicTokens : 3);
            setUserPlan(data.plan || "FREE");
          }
        })
        .catch(() => {});
    }
  }, [status]);

  // Detected card type
  const cardType = useMemo(() => {
    const clean = cardNumber.replace(/\D/g, "");
    if (clean.startsWith("8600")) return "UZCARD";
    if (clean.startsWith("9860")) return "HUMO";
    if (clean.startsWith("4")) return "VISA";
    if (clean.startsWith("5")) return "MASTERCARD";
    return null;
  }, [cardNumber]);

  const handleCardNumberChange = (val: string) => {
    const raw = val.replace(/\D/g, "").slice(0, 16);
    const parts = raw.match(/.{1,4}/g);
    setCardNumber(parts ? parts.join(" ") : raw);
  };

  const handleExpiryChange = (val: string) => {
    const raw = val.replace(/\D/g, "").slice(0, 4);
    if (raw.length >= 3) {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2, 4)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  const effectivePack: TokenPack =
    mode === "preset" ? selectedPreset : buildCustomTokenPack(Math.max(1, customCount));

  const handleCustomChange = useCallback((val: number) => {
    setCustomCount(Math.min(500, Math.max(1, val)));
  }, []);

  const handleBuyTokens = async () => {
    setError(null);
    if (status !== "authenticated") {
      router.push("/login?callbackUrl=/academic/tokens");
      return;
    }

    setIsProcessing(true);
    try {
      // PayX is the dedicated card payment gateway
      const endpoint = provider === "payx" ? "/api/checkout/payx" : "/api/payments/checkout";
      const body: Record<string, unknown> = {
        provider,
        returnUrl: `${window.location.origin}/academic/tokens?payment=success`,
      };

      if (mode === "preset") {
        body.tokenPackId = effectivePack.id;
      } else {
        body.customTokens = customCount;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "To'lov havolasini yaratishda xatolik yuz berdi.");
      }

      const targetUrl = data.pay_url || data.paymentUrl || data.url;
      if (targetUrl) {
        window.location.href = targetUrl;
      } else {
        throw new Error("To'lov tizimidan havola qaytmadi.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "To'lov jarayonida xatolik yuz berdi.");
      setIsProcessing(false);
    }
  };

  const breakInfo = mode === "custom" ? getPriceBreakLabel(customCount) : null;

  return (
    <div className="min-h-screen bg-[#020817] pb-24 text-slate-100 selection:bg-amber-500/30 selection:text-amber-200">
      <StudentSubNav activeTab="tokens" />

      {/* Background 3D Ambient Mesh Glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-amber-500/10 blur-[130px]" />
        <div className="absolute top-1/3 -right-20 h-96 w-96 rounded-full bg-cyan-500/10 blur-[140px]" />
        <div className="absolute -bottom-20 left-1/3 h-96 w-96 rounded-full bg-indigo-600/10 blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pt-8 sm:px-6 lg:px-8">
        {/* =========================================================================
            1. 3D HERO HEADER & BALANCE CARD
           ========================================================================= */}
        <div className="relative mb-10 overflow-hidden rounded-[32px] border border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-[#0b1329]/95 to-[#040816] p-6 shadow-[0_20px_60px_rgba(245,158,11,0.12)] backdrop-blur-xl sm:p-10">
          {/* Subtle 3D Grid Overlay */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />

          <div className="relative z-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-1.5 text-xs font-bold text-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.25)]">
                <Sparkles className="h-4 w-4 animate-spin text-amber-400" />
                <span>Akademik Tokenlar &middot; 100% Rasmiy To&apos;lov</span>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
              </div>

              <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
                Akademik Tokenlar{" "}
                <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 bg-clip-text text-transparent">
                  Sotib Olish
                </span>
              </h1>

              <p className="mt-3.5 text-sm leading-relaxed text-slate-300 sm:text-base">
                Yangi ro&apos;yxatdan o&apos;tgan har bir foydalanuvchiga{" "}
                <span className="font-bold text-amber-300">3 ta umrbod bepul token</span> beriladi.{" "}
                <strong>
                  1 ta kurs ishi, referat, mustaqil ish, amaliy ish yoki BMI = 1 ta token.
                </strong>{" "}
                Limit tugasa yoki ko&apos;proq kerak bo&apos;lsa, o&apos;zingiz xohlagancha token
                xarid qiling.
              </p>

              {/* Trust Badges */}
              <div className="mt-5 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-300">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Muddatsiz (kuyib ketmaydi)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Barcha bo&apos;limlarda o&apos;tadi</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-cyan-400" />
                  <span>PayX xavfsiz karta to&apos;lovi</span>
                </div>
              </div>
            </div>

            {/* 3D Glass Balance Badge */}
            <div className="relative shrink-0 overflow-hidden rounded-3xl border border-amber-400/40 bg-gradient-to-b from-slate-900/90 via-[#0a1226]/95 to-slate-950/95 p-6 text-center shadow-[0_15px_40px_rgba(0,0,0,0.6)] sm:min-w-[240px]">
              {/* Gold light reflection */}
              <div className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-amber-400/20 blur-2xl" />

              <div className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                Sizning Balansingiz
              </div>

              {/* 3D Coin Icon + Count */}
              <div className="mt-3 flex items-center justify-center gap-3">
                <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 text-slate-950 shadow-[0_8px_20px_rgba(245,158,11,0.4)]">
                  <Coins className="h-7 w-7 drop-shadow" />
                </div>
                <div className="text-3xl font-black text-amber-300 sm:text-4xl">
                  {status === "authenticated"
                    ? tokensRemaining !== null
                      ? `${tokensRemaining}`
                      : "..."
                    : "3"}
                  <span className="ml-1.5 text-base font-semibold text-slate-400">ta</span>
                </div>
              </div>

              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-800/60 px-3 py-1 text-xs text-slate-300">
                <span>Tarif:</span>
                <span className="font-extrabold text-cyan-400">{userPlan}</span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            2. MODE SWITCHER TABS (TAYYOR PAKETLAR vs O'ZIM TANLASH)
           ========================================================================= */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-800/80 bg-slate-900/70 p-1.5 backdrop-blur">
            <button
              type="button"
              onClick={() => setMode("preset")}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
                mode === "preset"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Flame className="h-4 w-4" />
              Tayyor Paketlar
            </button>
            <button
              type="button"
              onClick={() => setMode("custom")}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
                mode === "custom"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Zap className="h-4 w-4" />
              O&apos;zim Tanlash (Slider)
            </button>
          </div>

          <div className="text-xs text-slate-400">
            Karta orqali to&apos;lov:{" "}
            <strong className="text-white">PayX (Uzcard / Humo / Visa)</strong>
          </div>
        </div>

        {/* =========================================================================
            3. PRESET TOKEN PACKS (3D CARDS GRID)
           ========================================================================= */}
        {mode === "preset" && (
          <div className="mb-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {ACADEMIC_TOKEN_PACKS.map((pack) => {
              const isSelected = selectedPreset.id === pack.id;
              return (
                <button
                  key={pack.id}
                  type="button"
                  onClick={() => setSelectedPreset(pack)}
                  className={`group relative flex flex-col justify-between rounded-[28px] border p-5 text-left transition-all duration-300 hover:-translate-y-2 ${
                    isSelected
                      ? "border-amber-400 bg-gradient-to-b from-amber-500/20 via-slate-900/95 to-[#050c1e] shadow-[0_20px_45px_rgba(245,158,11,0.25)] ring-2 ring-amber-400/50"
                      : "border-slate-800/90 bg-gradient-to-b from-slate-900/60 to-slate-950/80 hover:border-slate-700 hover:bg-slate-900/90 hover:shadow-[0_15px_35px_rgba(0,0,0,0.5)]"
                  }`}
                >
                  {/* Top Badge */}
                  {pack.badge && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 px-3 py-0.5 text-[11px] font-black tracking-wide whitespace-nowrap text-slate-950 shadow-md shadow-orange-500/30">
                      {pack.badge}
                    </span>
                  )}

                  <div>
                    {/* 3D Icon Box */}
                    <div className="mb-4 flex items-center justify-between">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 ${
                          isSelected
                            ? "bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/40"
                            : "border border-slate-700 bg-slate-800/80 text-amber-400"
                        }`}
                      >
                        <Coins className="h-6 w-6 drop-shadow" />
                      </div>
                      <span className="bg-slate-850 rounded-full border border-slate-700/80 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                        {pack.pricePerTokenLabel}
                      </span>
                    </div>

                    <h2 className="text-xl font-black text-white">{pack.title}</h2>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{pack.subtitle}</p>
                  </div>

                  <div className="mt-6 border-t border-slate-800/80 pt-4">
                    <div className="text-xs font-medium text-slate-400">Jami to&apos;lov:</div>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-xl font-black text-white">
                        {pack.amountUzs.toLocaleString("uz-UZ")}
                        <span className="ml-1 text-xs font-normal text-slate-400">so&apos;m</span>
                      </span>
                      <span
                        className={`flex items-center gap-1 text-xs font-bold ${
                          isSelected ? "text-amber-400" : "text-slate-500"
                        }`}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {isSelected ? "Tanlandi" : "Tanlash"}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* =========================================================================
            4. CUSTOM COUNT PICKER (SLIDER + STEPPER)
           ========================================================================= */}
        {mode === "custom" && (
          <div className="mb-12 rounded-[32px] border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-[#0a1226]/95 to-slate-950 p-6 shadow-2xl sm:p-10">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-2xl font-black text-white">
                  Nechta token kerak? O&apos;zingiz tanlang
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Kerakli miqdorni belgilang — narx va chegirma real vaqtda avtomatik hisoblanadi.
                </p>
              </div>
              {breakInfo?.discount && (
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-4 py-1.5 text-xs font-extrabold text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  <span>{breakInfo.discount}</span>
                </div>
              )}
            </div>

            {/* Stepper with Large Digit */}
            <div className="mt-8 flex items-center justify-center gap-4 sm:gap-6">
              <button
                type="button"
                onClick={() => handleCustomChange(customCount - 1)}
                disabled={customCount <= 1}
                className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 text-white shadow-lg transition hover:scale-105 hover:bg-slate-700 active:scale-95 disabled:opacity-30"
              >
                <Minus className="h-6 w-6" />
              </button>

              <div className="relative max-w-[280px] min-w-[200px]">
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={customCount}
                  onChange={(e) => handleCustomChange(Number(e.target.value))}
                  className="w-full rounded-3xl border border-amber-400/50 bg-slate-950/90 py-4 text-center text-4xl font-black text-amber-300 shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] focus:border-amber-400 focus:outline-none"
                />
                <span className="pointer-events-none absolute top-1/2 right-5 -translate-y-1/2 text-xs font-bold text-slate-500 uppercase">
                  token
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleCustomChange(customCount + 1)}
                disabled={customCount >= 500}
                className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 text-white shadow-lg transition hover:scale-105 hover:bg-slate-700 active:scale-95 disabled:opacity-30"
              >
                <Plus className="h-6 w-6" />
              </button>
            </div>

            {/* Slider */}
            <div className="mt-8">
              <input
                type="range"
                min={1}
                max={50}
                value={Math.min(customCount, 50)}
                onChange={(e) => handleCustomChange(Number(e.target.value))}
                className="h-3 w-full cursor-pointer appearance-none rounded-full bg-slate-800 accent-amber-400"
              />
              <div className="mt-2 flex justify-between text-[11px] font-bold text-slate-500">
                <span>1 ta</span>
                <span>10 ta (-30%)</span>
                <span>20 ta (-40%)</span>
                <span>50+ ta</span>
              </div>
            </div>

            {/* Quick preset buttons */}
            <div className="mt-6 flex flex-wrap justify-center gap-2.5">
              {[1, 3, 5, 10, 15, 20, 30, 50].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleCustomChange(n)}
                  className={`rounded-xl border px-4 py-2 text-xs font-extrabold transition-all ${
                    customCount === n
                      ? "border-amber-400 bg-amber-500/25 text-amber-300 shadow-md shadow-amber-500/20"
                      : "border-slate-800 bg-slate-900/80 text-slate-400 hover:border-slate-700 hover:text-white"
                  }`}
                >
                  {n} ta
                </button>
              ))}
            </div>

            {/* Live Calculation Card */}
            <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/90 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-medium text-slate-400">Jami to&apos;lov narxi:</div>
                  <div className="mt-1 text-3xl font-black text-white sm:text-4xl">
                    {effectivePack.amountUzs.toLocaleString("uz-UZ")}{" "}
                    <span className="text-base font-semibold text-slate-400">so&apos;m</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-slate-400">1 ta token narxi:</div>
                  <div className="mt-1 text-xl font-black text-amber-400">
                    {breakInfo?.perUnit.toLocaleString("uz-UZ")} so&apos;m / ish
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            5. PAYX CARD CHECKOUT SECTION WITH 3D VIRTUAL CARD PREVIEW
           ========================================================================= */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left 2 cols: Payment Method & 3D Card */}
          <div className="rounded-[32px] border border-slate-800/90 bg-gradient-to-b from-slate-900/90 to-slate-950/95 p-6 shadow-2xl backdrop-blur-xl sm:p-8 lg:col-span-2">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <h3 className="flex items-center gap-2.5 text-xl font-black text-white">
                <CreditCard className="h-6 w-6 text-amber-400" />
                To&apos;lov tizimi: Bank kartasi orqali to&apos;lash
              </h3>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                PayX 100% Xavfsiz
              </span>
            </div>

            <p className="mt-2 text-sm text-slate-400">
              Tanlangan:{" "}
              <strong className="text-white">
                {effectivePack.title} ({effectivePack.amountUzs.toLocaleString("uz-UZ")} so&apos;m)
              </strong>
              . To&apos;lov bevosita PayX orqali kartadan yechiladi va token darhol balansingizga
              tushadi.
            </p>

            {/* Provider Selection Tabs (PayX is #1 & Recommended) */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setProvider("payx")}
                className={`relative flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all ${
                  provider === "payx"
                    ? "border-amber-400 bg-gradient-to-b from-amber-500/20 to-slate-900 shadow-[0_0_30px_rgba(245,158,11,0.25)] ring-2 ring-amber-400/40"
                    : "border-slate-800 bg-slate-950/70 text-slate-400 hover:border-slate-700 hover:text-white"
                }`}
              >
                <span className="absolute -top-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-2 py-0.5 text-[10px] font-black text-white shadow">
                  TAVSIYA ETILADI
                </span>
                <span className="text-base font-black text-white">PAYX</span>
                <span className="mt-0.5 text-[11px] font-semibold text-amber-300">
                  Uzcard &bull; Humo &bull; Visa
                </span>
              </button>

              <button
                type="button"
                onClick={() => setProvider("click")}
                className={`flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all ${
                  provider === "click"
                    ? "border-cyan-400 bg-cyan-500/15 text-cyan-300 shadow-[0_0_25px_rgba(34,211,238,0.2)] ring-2 ring-cyan-400/40"
                    : "border-slate-800 bg-slate-950/70 text-slate-400 hover:border-slate-700 hover:text-white"
                }`}
              >
                <span className="text-base font-black text-white">CLICK</span>
                <span className="mt-0.5 text-[11px] font-semibold text-slate-400">
                  Click Up / Web
                </span>
              </button>

              <button
                type="button"
                onClick={() => setProvider("payme")}
                className={`flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all ${
                  provider === "payme"
                    ? "border-cyan-400 bg-cyan-500/15 text-cyan-300 shadow-[0_0_25px_rgba(34,211,238,0.2)] ring-2 ring-cyan-400/40"
                    : "border-slate-800 bg-slate-950/70 text-slate-400 hover:border-slate-700 hover:text-white"
                }`}
              >
                <span className="text-base font-black text-white">PAYME</span>
                <span className="mt-0.5 text-[11px] font-semibold text-slate-400">
                  Paycom Checkout
                </span>
              </button>
            </div>

            {/* =========================================================================
                REALISTIC 3D VIRTUAL BANK CARD DISPLAY
               ========================================================================= */}
            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>To&apos;lov kartasi namunasi:</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <Lock className="h-3.5 w-3.5" />
                  256-bit SSL Shifrlash
                </span>
              </div>

              {/* 3D Bank Card Preview */}
              <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-tr from-[#0a1226] via-[#111d40] to-[#1c2e63] p-6 text-white shadow-[0_25px_50px_rgba(0,0,0,0.7)]">
                {/* Holographic light sweep */}
                <div className="pointer-events-none absolute -top-24 -left-24 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
                <div className="pointer-events-none absolute -right-24 -bottom-24 h-48 w-48 rounded-full bg-amber-400/20 blur-3xl" />

                {/* Top row: Chip + Contactless + Card Brand */}
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Metallic EMV Chip */}
                    <div className="h-9 w-12 rounded-lg border border-amber-300/60 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 shadow-inner" />
                    {/* Contactless waves */}
                    <Wifi className="h-5 w-5 rotate-90 text-slate-300/80" />
                  </div>

                  <div className="text-right">
                    <span className="rounded-lg bg-white/10 px-3 py-1 text-xs font-black tracking-wider text-amber-300 uppercase backdrop-blur">
                      {cardType || "UZCARD / HUMO"}
                    </span>
                  </div>
                </div>

                {/* Card Number display */}
                <div className="relative z-10 mt-7 text-center font-mono text-xl font-bold tracking-[0.2em] text-white sm:text-2xl">
                  {cardNumber || "8600 •••• •••• ••••"}
                </div>

                {/* Card Holder & Expiry */}
                <div className="relative z-10 mt-6 flex items-center justify-between text-xs">
                  <div>
                    <div className="text-[9px] tracking-wider text-slate-400 uppercase">
                      Karta egasi
                    </div>
                    <div className="font-semibold tracking-wider text-slate-200 uppercase">
                      TALABA / FOYDALANUVCHI
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] tracking-wider text-slate-400 uppercase">
                      Amal qilish
                    </div>
                    <div className="font-mono font-bold text-slate-200">
                      {cardExpiry || "12/28"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] tracking-wider text-slate-400 uppercase">Shlyuz</div>
                    <div className="font-bold text-amber-400">PAYX.UZ</div>
                  </div>
                </div>
              </div>

              {/* Optional Quick Card Input (For fast card typing before PayX) */}
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-300">
                    Karta raqamingiz (ixtiyoriy — oldindan kiritish uchun):
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="8600 1234 5678 9012"
                    value={cardNumber}
                    onChange={(e) => handleCardNumberChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-300">
                    Muddati (OO/YY):
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => handleExpiryChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-center font-mono text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm font-medium text-red-300">
                {error}
              </div>
            )}

            {/* Big Action Button */}
            <button
              type="button"
              onClick={handleBuyTokens}
              disabled={isProcessing}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500 px-6 py-4 text-base font-black text-slate-950 shadow-[0_10px_35px_rgba(245,158,11,0.35)] transition-all hover:scale-[1.01] hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  PayX to&apos;lov sahifasiga yo&apos;naltirilmoqda...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5 fill-slate-950" />
                  {effectivePack.amountUzs.toLocaleString("uz-UZ")} so&apos;m to&apos;lash (
                  {effectivePack.tokens} ta token)
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Check className="h-4 w-4" /> To&apos;lov PayX saytiga tushadi
              </span>
              <span>&bull;</span>
              <span>Tokenlar darhol hisobingizga qo&apos;shiladi</span>
            </div>
          </div>

          {/* Right col: Monthly Subscription alternative */}
          <div className="flex flex-col justify-between rounded-[32px] border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 via-slate-900/90 to-slate-950 p-6 shadow-2xl sm:p-8">
            <div>
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-cyan-400/40 bg-cyan-500/15 px-3 py-1 text-xs font-bold text-cyan-300">
                <Crown className="h-3.5 w-3.5" />
                Oylik Cheksiz Obuna
              </div>
              <h3 className="text-2xl font-black text-white">Ko&apos;proq kerakmi?</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                Agar oyiga 30–100 ta akademik ish, taqdimotlar va testlar tayyorlasangiz,{" "}
                <strong className="text-cyan-300">Pro (39 000 so&apos;m/oy)</strong> yoki{" "}
                <strong className="text-amber-300">Premium (69 000 so&apos;m/oy)</strong> obunasi
                ancha arzonroq tushadi.
              </p>

              <ul className="mt-6 space-y-3 text-sm text-slate-300">
                <li className="flex items-center gap-2.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <span>Oyiga 30–100 ta akademik ish</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <span>Taqdimotlar (PPTX) va AI tahrirlash</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <span>CV/ATS va Mock Testlar</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <span>Har kuni avtomatik yangilanadigan limit</span>
                </li>
              </ul>
            </div>

            <Link
              href="/pricing"
              className="mt-8 flex items-center justify-center gap-2 rounded-2xl border border-cyan-500/40 bg-cyan-500/15 px-5 py-3.5 text-sm font-bold text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.15)] transition hover:bg-cyan-500/25 hover:text-white"
            >
              Obuna tariflarini ko&apos;rish
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
