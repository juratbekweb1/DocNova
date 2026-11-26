"use client";

import React, { useEffect, useState, useCallback } from "react";
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
} from "lucide-react";
import { StudentSubNav } from "@/components/academic/student-sub-nav";
import {
  ACADEMIC_TOKEN_PACKS,
  buildCustomTokenPack,
  type TokenPack,
} from "@/lib/billing/token-packs";

// Price break info shown in the slider tooltip
function getPriceBreakLabel(tokens: number): { perUnit: number; discount?: string } {
  if (tokens >= 15) return { perUnit: 3_333, discount: "33% tejamkor" };
  if (tokens >= 5) return { perUnit: 4_000, discount: "20% tejamkor" };
  return { perUnit: 5_000 };
}

export default function AcademicTokensPage() {
  const { status } = useSession();
  const router = useRouter();

  const [tokensRemaining, setTokensRemaining] = useState<number | null>(null);
  const [userPlan, setUserPlan] = useState<string>("FREE");

  // "preset" mode (1,5,15) or "custom" mode
  const [mode, setMode] = useState<"preset" | "custom">("preset");
  const [selectedPreset, setSelectedPreset] = useState<TokenPack>(ACADEMIC_TOKEN_PACKS[1]);
  const [customCount, setCustomCount] = useState<number>(3);

  const [provider, setProvider] = useState<"click" | "payme" | "payx">("click");
  const [phoneNumber, setPhoneNumber] = useState("");
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

  // Derived: the effective pack based on current mode
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
      const endpoint = provider === "payx" ? "/api/checkout/payx" : "/api/payments/checkout";
      const body: Record<string, unknown> = { provider, phoneNumber };

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
    <div className="min-h-screen bg-[#020817] pb-20 text-slate-100">
      <StudentSubNav activeTab="tokens" />

      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 lg:px-8">
        {/* Header & Balance Card */}
        <div className="mb-10 flex flex-col justify-between gap-6 rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-[#0a1024] to-[#020817] p-6 sm:flex-row sm:items-center sm:p-8">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
              <Coins className="h-3.5 w-3.5" />
              Akademik Tokenlar
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
              Token sotib olish va Balans
            </h1>
            <p className="mt-2.5 text-sm leading-relaxed text-slate-300 sm:text-base">
              Yangi ro&apos;yxatdan o&apos;tgan har bir foydalanuvchiga{" "}
              <strong>3 ta bepul akademik token</strong> beriladi (kunlik cheklov yo&apos;q).{" "}
              <strong>
                1 ta kurs ishi, referat, mustaqil ish, amaliy ish yoki BMI = 1 ta token.
              </strong>
            </p>
          </div>

          <div className="shrink-0 rounded-2xl border border-slate-700/60 bg-slate-900/90 p-5 text-center sm:min-w-[210px]">
            <div className="text-xs font-medium tracking-wider text-slate-400 uppercase">
              Sizning balansingiz
            </div>
            <div className="mt-2 flex items-center justify-center gap-2 text-3xl font-black text-amber-400">
              <Coins className="h-7 w-7" />
              <span>
                {status === "authenticated"
                  ? tokensRemaining !== null
                    ? `${tokensRemaining} ta`
                    : "..."
                  : "3 ta (Bepul)"}
              </span>
            </div>
            <div className="mt-1.5 text-xs text-slate-400">
              Tarif: <span className="font-semibold text-cyan-400">{userPlan}</span>
            </div>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="mb-6 flex gap-3">
          <button
            type="button"
            onClick={() => setMode("preset")}
            className={`rounded-2xl border px-5 py-2.5 text-sm font-semibold transition-all ${
              mode === "preset"
                ? "border-amber-400 bg-amber-500/15 text-amber-300"
                : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-white"
            }`}
          >
            Tayyor paketlar
          </button>
          <button
            type="button"
            onClick={() => setMode("custom")}
            className={`rounded-2xl border px-5 py-2.5 text-sm font-semibold transition-all ${
              mode === "custom"
                ? "border-amber-400 bg-amber-500/15 text-amber-300"
                : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-white"
            }`}
          >
            O&apos;zim tanlash
          </button>
        </div>

        {/* Preset Packs */}
        {mode === "preset" && (
          <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {ACADEMIC_TOKEN_PACKS.map((pack) => {
              const isSelected = selectedPreset.id === pack.id;
              return (
                <button
                  key={pack.id}
                  type="button"
                  onClick={() => setSelectedPreset(pack)}
                  className={`relative flex flex-col justify-between rounded-3xl border p-6 text-left transition-all duration-200 ${
                    isSelected
                      ? "border-amber-400 bg-gradient-to-b from-amber-500/15 to-slate-900/95 shadow-[0_0_30px_rgba(251,191,36,0.18)]"
                      : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90"
                  }`}
                >
                  {pack.badge && (
                    <span className="absolute -top-3 right-5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-0.5 text-xs font-bold text-slate-950 shadow">
                      {pack.badge}
                    </span>
                  )}

                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                          isSelected ? "bg-amber-400 text-slate-950" : "bg-slate-800 text-amber-400"
                        }`}
                      >
                        <Coins className="h-6 w-6" />
                      </div>
                      <span className="rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs font-semibold text-slate-300">
                        {pack.pricePerTokenLabel}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-white">{pack.title}</h2>
                    <p className="mt-1.5 text-sm text-slate-400">{pack.subtitle}</p>
                  </div>

                  <div className="mt-6 border-t border-slate-800 pt-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-black text-white">
                        {pack.amountUzs.toLocaleString("uz-UZ")} so&apos;m
                      </span>
                      <span
                        className={`flex items-center gap-1 text-xs font-semibold ${
                          isSelected ? "text-amber-400" : "text-slate-500"
                        }`}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {isSelected ? "Tanlangan" : "Tanlash"}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Custom Count Picker */}
        {mode === "custom" && (
          <div className="mb-10 rounded-3xl border border-amber-500/25 bg-gradient-to-br from-amber-500/8 to-slate-900/90 p-6 sm:p-8">
            <h2 className="mb-1 text-lg font-bold text-white">
              Nechta token kerak? O&apos;zingiz tanlang
            </h2>
            <p className="mb-6 text-sm text-slate-400">
              Miqdorni o&apos;zgartiring — narx avtomatik hisoblanadi. 5 va undan ko&apos;proq token
              olsangiz chegirma olasiz.
            </p>

            {/* Stepper */}
            <div className="mb-5 flex items-center gap-4">
              <button
                type="button"
                onClick={() => handleCustomChange(customCount - 1)}
                disabled={customCount <= 1}
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 text-white transition hover:bg-slate-700 disabled:opacity-40"
              >
                <Minus className="h-5 w-5" />
              </button>

              <div className="relative flex-1">
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={customCount}
                  onChange={(e) => handleCustomChange(Number(e.target.value))}
                  className="w-full rounded-2xl border border-amber-400/40 bg-slate-950 py-3 text-center text-3xl font-black text-amber-400 focus:border-amber-400 focus:outline-none"
                />
                <span className="absolute top-1/2 right-4 -translate-y-1/2 text-xs text-slate-400">
                  ta token
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleCustomChange(customCount + 1)}
                disabled={customCount >= 500}
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 text-white transition hover:bg-slate-700 disabled:opacity-40"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>

            {/* Slider */}
            <input
              type="range"
              min={1}
              max={100}
              value={Math.min(customCount, 100)}
              onChange={(e) => handleCustomChange(Number(e.target.value))}
              className="mb-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-800 accent-amber-400"
            />

            {/* Quick picks */}
            <div className="mb-5 flex flex-wrap gap-2">
              {[1, 3, 5, 10, 15, 20, 30, 50, 100].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleCustomChange(n)}
                  className={`rounded-xl border px-4 py-1.5 text-sm font-semibold transition-all ${
                    customCount === n
                      ? "border-amber-400 bg-amber-500/20 text-amber-300"
                      : "border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-600 hover:text-white"
                  }`}
                >
                  {n} ta
                </button>
              ))}
            </div>

            {/* Price summary */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-medium text-slate-400">Jami narx</div>
                  <div className="mt-1 text-3xl font-black text-white">
                    {effectivePack.amountUzs.toLocaleString("uz-UZ")} so&apos;m
                  </div>
                  {breakInfo?.discount && (
                    <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                      <Sparkles className="h-3 w-3" />
                      {breakInfo.discount}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Birlik narxi</div>
                  <div className="mt-1 text-lg font-bold text-amber-400">
                    {breakInfo?.perUnit.toLocaleString("uz-UZ")} so&apos;m / token
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Checkout & Subscription Options */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left 2 cols: Payment Method */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 lg:col-span-2">
            <h3 className="flex items-center gap-2 text-lg font-bold text-white">
              <CreditCard className="h-5 w-5 text-cyan-400" />
              To&apos;lov usulini tanlang
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Tanlangan paket:{" "}
              <strong className="text-white">
                {effectivePack.title} ({effectivePack.amountUzs.toLocaleString("uz-UZ")} so&apos;m)
              </strong>
            </p>

            <div className="mt-5 grid grid-cols-3 gap-3">
              {(["click", "payme", "payx"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProvider(p)}
                  className={`rounded-2xl border px-4 py-3.5 text-center text-sm font-bold uppercase transition-all ${
                    provider === p
                      ? "border-cyan-400 bg-cyan-500/15 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.15)]"
                      : "border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-white"
                  }`}
                >
                  {p === "click" ? "Click" : p === "payme" ? "Payme" : "PayX"}
                </button>
              ))}
            </div>

            {provider === "click" && (
              <div className="mt-5">
                <label className="mb-1.5 block text-xs font-medium text-slate-300">
                  Telefon raqamingiz (ixtiyoriy — Click hisob-faktura yuborish uchun)
                </label>
                <input
                  type="tel"
                  placeholder="+998 90 123 45 67"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleBuyTokens}
              disabled={isProcessing}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 text-base font-extrabold text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:brightness-110 disabled:opacity-60"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  To&apos;lov sahifasiga yo&apos;naltirilmoqda...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  {effectivePack.amountUzs.toLocaleString("uz-UZ")} so&apos;m to&apos;lash (
                  {effectivePack.tokens} ta token)
                </>
              )}
            </button>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              To&apos;lov tasdiqlangandan so&apos;ng tokenlar balansingizga avtomatik
              qo&apos;shiladi.
            </div>
          </div>

          {/* Right col: Monthly Subscription alternative */}
          <div className="flex flex-col justify-between rounded-3xl border border-cyan-500/25 bg-gradient-to-br from-cyan-500/10 to-slate-900/90 p-6 sm:p-8">
            <div>
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-300">
                <Crown className="h-3.5 w-3.5" />
                Oylik Obuna
              </div>
              <h3 className="text-xl font-bold text-white">Ko&apos;proq kerakmi?</h3>
              <p className="mt-2 text-sm text-slate-300">
                Agar oyiga 30–100 ta akademik ish va taqdimotlar tayyorlasangiz,{" "}
                <strong>Pro (39 000 so&apos;m/oy)</strong> yoki{" "}
                <strong>Premium (69 000 so&apos;m/oy)</strong> obunasi ancha arzonroq tushadi.
              </p>

              <ul className="mt-5 space-y-2.5 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 shrink-0 text-cyan-400" />
                  Oyiga 30–100 ta akademik ish
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 shrink-0 text-cyan-400" />
                  Taqdimotlar (PPTX) va AI tahrirlash
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 shrink-0 text-cyan-400" />
                  CV/ATS va Mock Testlar
                </li>
              </ul>
            </div>

            <Link
              href="/pricing"
              className="mt-6 flex items-center justify-center gap-2 rounded-2xl border border-cyan-500/40 bg-cyan-500/10 px-5 py-3 text-sm font-bold text-cyan-300 transition hover:bg-cyan-500/20"
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
