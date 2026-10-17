"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Loader2,
  Activity,
  Zap,
  AlertTriangle,
  Users,
  Send,
  Search,
  TrendingUp,
  CreditCard,
  Crown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { PlatformAiSummary } from "@/lib/telegram-ai-report";

export default function AIAnalyticsPage() {
  const [summary, setSummary] = useState<PlatformAiSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState<"ALL" | "ACTIVE" | "PAID" | "FREE">("ALL");

  const { toast } = useToast();

  const loadData = () => {
    setIsLoading(true);
    fetch("/api/admin/ai/usage?range=30d")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.summary) {
          setSummary(data.summary);
        } else {
          toast({
            title: "Xatolik",
            description: data.error || "AI statistikasi yuklanmadi",
            variant: "destructive",
          });
        }
      })
      .catch((err) => {
        console.error(err);
        toast({
          title: "Xatolik",
          description: "Server bilan bog‘lanishda xatolik yuz berdi",
          variant: "destructive",
        });
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    let ignore = false;
    fetch("/api/admin/ai/usage?range=30d")
      .then((res) => res.json())
      .then((data) => {
        if (!ignore) {
          if (data.success && data.summary) {
            setSummary(data.summary);
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleSendTelegramReport = async () => {
    setIsSendingTelegram(true);
    try {
      const res = await fetch("/api/admin/ai/telegram-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Telegramga yuborishda xatolik yuz berdi");
      }
      toast({
        title: "Hisobot yuborildi! 🚀",
        description: data.message || "Super Admin Telegram botiga to‘liq AI hisoboti yuborildi.",
      });
    } catch (err: unknown) {
      const e = err as Error;
      toast({
        title: "Telegram xatoligi",
        description: e.message || "Telegram botga hisobot yuborilmadi.",
        variant: "destructive",
      });
    } finally {
      setIsSendingTelegram(false);
    }
  };

  // Filter users
  const filteredUsers = useMemo(() => {
    if (!summary?.allUsers) return [];
    return summary.allUsers.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (planFilter === "ACTIVE") return u.monthRequests > 0;
      if (planFilter === "PAID") return u.plan === "PRO" || u.plan === "PREMIUM";
      if (planFilter === "FREE") return u.plan === "FREE";
      return true;
    });
  }, [summary, searchTerm, planFilter]);

  if (isLoading) {
    return (
      <div className="flex min-h-[600px] flex-col items-center justify-center gap-4 bg-[#0a0a0b] text-zinc-100">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
        <p className="text-sm text-zinc-400">
          AI tokenlari va foydalanuvchilar hisoboti yuklanmoqda...
        </p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex min-h-[600px] flex-col items-center justify-center bg-[#0a0a0b] p-8 text-zinc-100">
        <AlertTriangle className="mb-4 h-12 w-12 text-amber-500" />
        <h2 className="text-xl font-bold">Ma&apos;lumot topilmadi</h2>
        <p className="mt-2 text-sm text-zinc-400">Hozircha AI statistikasi mavjud emas.</p>
        <button
          onClick={loadData}
          className="mt-4 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500"
        >
          Qayta yuklash
        </button>
      </div>
    );
  }

  const { today, month, planBreakdown, featureBreakdown } = summary;

  return (
    <div className="min-h-screen space-y-8 bg-[#0a0a0b] p-6 font-sans text-zinc-100 md:p-8">
      {/* Top Header */}
      <div className="flex flex-col gap-4 border-b border-white/5 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400">
              Super Admin Nazorati
            </span>
            <span className="text-xs text-zinc-500">
              {summary.reportDateStr} • {summary.reportTimeStr}
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
            AI Tokenlar & Foydalanuvchilar Tahlili
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Foydalanuvchilarning bepul, Pro va Premium limitlari sarfi, kunlik/oylik tokenlar va
            Telegram hisobotlari
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-zinc-300 transition-colors hover:bg-white/10"
          >
            Yangilash
          </button>
          <button
            onClick={handleSendTelegramReport}
            disabled={isSendingTelegram}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50"
          >
            {isSendingTelegram ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span>Telegramga hisobot yuborish</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Today & Month */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Bugungi Tokenlar"
          value={today.totalTokens.toLocaleString()}
          icon={<Zap className="h-4 w-4 text-cyan-400" />}
          subtext={`${today.totalRequests} ta so‘rov • ${today.activeUsers} faol user`}
        />
        <StatCard
          title="Bugungi Xarajat"
          value={`$${today.costUsd.toFixed(3)}`}
          icon={<Activity className="h-4 w-4 text-emerald-400" />}
          subtext={`~${today.costUzs.toLocaleString()} so‘m`}
        />
        <StatCard
          title="Shu Oylik Tokenlar"
          value={`${(month.totalTokens / 1_000_000).toFixed(2)}M`}
          icon={<TrendingUp className="h-4 w-4 text-purple-400" />}
          subtext={`${month.totalRequests} ta so‘rov • ${month.activeUsers} faol user`}
        />
        <StatCard
          title="Shu Oylik Xarajat"
          value={`$${month.costUsd.toFixed(2)}`}
          icon={<CreditCard className="h-4 w-4 text-amber-400" />}
          subtext={`~${month.costUzs.toLocaleString()} so‘m`}
        />
      </div>

      {/* Grid: Plan Breakdown & Feature Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Plan Breakdown */}
        <div className="rounded-2xl border border-white/5 bg-[#121214] p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-white">
            <Crown className="h-5 w-5 text-amber-400" /> Tariflar Kesimida Foydalanish
          </h2>

          <div className="space-y-4">
            {/* FREE */}
            <div className="rounded-xl border border-white/5 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-300">
                  <span className="h-2 w-2 rounded-full bg-zinc-400" /> Bepul (FREE)
                </span>
                <span className="text-xs font-semibold text-zinc-400">
                  {planBreakdown.FREE.usersCount} ta foydalanuvchi
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between text-sm">
                <span className="text-zinc-400">So‘rovlar:</span>
                <span className="font-bold text-white">{planBreakdown.FREE.requests} ta</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between text-sm">
                <span className="text-zinc-400">Sarflangan tokenlar:</span>
                <span className="font-bold text-cyan-400">
                  {planBreakdown.FREE.tokens.toLocaleString()} token
                </span>
              </div>
            </div>

            {/* PRO */}
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400">
                  <span className="h-2 w-2 rounded-full bg-blue-400" /> ⭐ PRO (39 000 so‘m)
                </span>
                <span className="text-xs font-semibold text-blue-300">
                  {planBreakdown.PRO.usersCount} ta obunachi
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between text-sm">
                <span className="text-zinc-400">So‘rovlar:</span>
                <span className="font-bold text-white">{planBreakdown.PRO.requests} ta</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between text-sm">
                <span className="text-zinc-400">Sarflangan tokenlar:</span>
                <span className="font-bold text-blue-400">
                  {planBreakdown.PRO.tokens.toLocaleString()} token
                </span>
              </div>
            </div>

            {/* PREMIUM */}
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  <span className="h-2 w-2 rounded-full bg-amber-400" /> 👑 PREMIUM (69 000 so‘m)
                </span>
                <span className="text-xs font-semibold text-amber-300">
                  {planBreakdown.PREMIUM.usersCount} ta obunachi
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between text-sm">
                <span className="text-zinc-400">So‘rovlar:</span>
                <span className="font-bold text-white">{planBreakdown.PREMIUM.requests} ta</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between text-sm">
                <span className="text-zinc-400">Sarflangan tokenlar:</span>
                <span className="font-bold text-amber-400">
                  {planBreakdown.PREMIUM.tokens.toLocaleString()} token
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Breakdown */}
        <div className="rounded-2xl border border-white/5 bg-[#121214] p-6 shadow-sm lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-white">
            <Activity className="h-5 w-5 text-cyan-400" /> Modullar Kesimida AI Sarfi
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Object.entries(featureBreakdown)
              .sort((a, b) => b[1].requests - a[1].requests)
              .map(([feature, data]) => {
                const label = getFeatureTitle(feature);
                return (
                  <div
                    key={feature}
                    className="flex flex-col justify-between rounded-xl border border-white/5 bg-white/5 p-4 transition-colors hover:border-white/10"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-300">{label}</span>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-zinc-400">
                        {data.requests} ta
                      </span>
                    </div>
                    <div className="mt-3 flex items-baseline justify-between">
                      <span className="text-xs text-zinc-500">Tokenlar:</span>
                      <span className="text-xs font-bold text-cyan-400">
                        {data.tokens.toLocaleString()} token
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* User Token & Quota Breakdown Table */}
      <div className="space-y-6 rounded-2xl border border-white/5 bg-[#121214] p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-white">
              <Users className="h-5 w-5 text-blue-400" /> Foydalanuvchilar Bo‘yicha Token & Limit
              Nazorati
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              Har bir foydalanuvchining oylik token sarfi, bepul yoki obunali limiti va faolligi
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute top-2.5 left-3 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Ism yoki email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-48 rounded-xl border border-white/10 bg-white/5 py-1.5 pr-3 pl-9 text-xs text-white placeholder-zinc-500 focus:border-cyan-500 focus:outline-none sm:w-60"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex rounded-xl border border-white/10 bg-white/5 p-1 text-xs">
              <button
                onClick={() => setPlanFilter("ALL")}
                className={`rounded-lg px-2.5 py-1 font-medium transition-colors ${
                  planFilter === "ALL" ? "bg-white/15 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                Barchasi ({summary.allUsers.length})
              </button>
              <button
                onClick={() => setPlanFilter("ACTIVE")}
                className={`rounded-lg px-2.5 py-1 font-medium transition-colors ${
                  planFilter === "ACTIVE"
                    ? "bg-cyan-500/20 text-cyan-400"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Faollar
              </button>
              <button
                onClick={() => setPlanFilter("PAID")}
                className={`rounded-lg px-2.5 py-1 font-medium transition-colors ${
                  planFilter === "PAID"
                    ? "bg-amber-500/20 text-amber-400"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Pro & Premium
              </button>
              <button
                onClick={() => setPlanFilter("FREE")}
                className={`rounded-lg px-2.5 py-1 font-medium transition-colors ${
                  planFilter === "FREE"
                    ? "bg-zinc-500/20 text-zinc-300"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Bepul
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 tracking-wider text-zinc-500 uppercase">
                <th className="pb-3 font-semibold">Foydalanuvchi</th>
                <th className="pb-3 font-semibold">Tarif</th>
                <th className="pb-3 font-semibold">Bugungi Tokenlar</th>
                <th className="pb-3 font-semibold">Oylik Tokenlar</th>
                <th className="pb-3 font-semibold">Akademik Limit</th>
                <th className="pb-3 font-semibold">Taxminiy Xarajat</th>
                <th className="pb-3 font-semibold">So‘nggi Faollik</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500">
                    Foydalanuvchilar topilmadi.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isLimitExceeded = u.academicUsed >= u.academicLimit;
                  return (
                    <tr key={u.userId} className="transition-colors hover:bg-white/[0.02]">
                      {/* User Info */}
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 text-xs font-bold text-white">
                            {u.name.slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{u.name}</div>
                            <div className="text-[11px] text-zinc-400">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Plan Badge */}
                      <td className="py-3.5 pr-4">
                        <PlanBadge plan={u.plan} role={u.role} />
                      </td>

                      {/* Today Tokens */}
                      <td className="py-3.5 pr-4 font-medium">
                        {u.todayTokens > 0 ? (
                          <div>
                            <span className="text-cyan-400">{u.todayTokens.toLocaleString()}</span>
                            <span className="block text-[10px] text-zinc-500">
                              {u.todayRequests} ta so‘rov
                            </span>
                          </div>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>

                      {/* Month Tokens */}
                      <td className="py-3.5 pr-4 font-medium">
                        {u.monthTokens > 0 ? (
                          <div>
                            <span className="font-bold text-purple-400">
                              {u.monthTokens.toLocaleString()}
                            </span>
                            <span className="block text-[10px] text-zinc-500">
                              {u.monthRequests} ta so‘rov
                            </span>
                          </div>
                        ) : (
                          <span className="text-zinc-600">0 token</span>
                        )}
                      </td>

                      {/* Academic Limit Progress */}
                      <td className="py-3.5 pr-4">
                        <div className="w-28">
                          <div className="mb-1 flex justify-between text-[11px]">
                            <span
                              className={
                                isLimitExceeded ? "font-bold text-red-400" : "text-zinc-300"
                              }
                            >
                              {u.academicUsed} / {u.academicLimit} ta
                            </span>
                            {isLimitExceeded && (
                              <span className="text-[10px] font-bold text-red-400">Tugadi</span>
                            )}
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                            <div
                              className={`h-full rounded-full ${
                                isLimitExceeded
                                  ? "bg-red-500"
                                  : u.academicUsed > 0
                                    ? "bg-cyan-500"
                                    : "bg-transparent"
                              }`}
                              style={{
                                width: `${Math.min(100, Math.round((u.academicUsed / u.academicLimit) * 100))}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Cost */}
                      <td className="py-3.5 pr-4 font-medium">
                        {u.monthCostUsd > 0 ? (
                          <div>
                            <span className="text-emerald-400">${u.monthCostUsd.toFixed(3)}</span>
                            <span className="block text-[10px] text-zinc-500">
                              ~{u.monthCostUzs.toLocaleString()} so‘m
                            </span>
                          </div>
                        ) : (
                          <span className="text-zinc-600">$0.00</span>
                        )}
                      </td>

                      {/* Last Active */}
                      <td className="py-3.5 text-[11px] text-zinc-400">
                        {u.lastActive
                          ? new Date(u.lastActive).toLocaleDateString("uz-UZ")
                          : "Hali faol emas"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  subtext,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtext: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#121214] p-5 shadow-sm transition-colors hover:border-white/10">
      <div className="mb-3 flex items-start justify-between">
        <h3 className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">{title}</h3>
        <div className="rounded-lg bg-white/5 p-2 text-zinc-300">{icon}</div>
      </div>
      <div className="text-2xl font-black tracking-tight text-white">{value}</div>
      <div className="mt-2 text-xs text-zinc-500">{subtext}</div>
    </div>
  );
}

function PlanBadge({ plan, role }: { plan: string; role: string }) {
  if (role === "SUPER_ADMIN") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[11px] font-bold text-red-400">
        SUPER ADMIN
      </span>
    );
  }
  if (plan === "PREMIUM") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-400">
        👑 PREMIUM
      </span>
    );
  }
  if (plan === "PRO") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[11px] font-bold text-blue-400">
        ⭐ PRO
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-white/5 bg-zinc-500/10 px-2 py-0.5 text-[11px] font-medium text-zinc-400">
      FREE
    </span>
  );
}

function getFeatureTitle(f: string): string {
  const map: Record<string, string> = {
    COURSEWORK: "Kurs ishi generatori",
    REFERAT: "Mustaqil ish / Referat",
    REFERAT_EXTENDED: "Referat (10-15 bet parallel)",
    BMI_DIPLOM: "BMI va Diplom ishi",
    PRESENTATION: "Prezentatsiya & Nutq",
    EXAM_PREP: "Imtihon savollari & test",
    REWRITE: "AI Yozuvchi / Insho",
    MOCK_TEST: "Mock Test (Xalqaro tillar)",
    CHAT: "AI Maslahatchi (Chat)",
    DOCUMENT_GENERATION: "Rezyume yaratish",
    RESUME_ANALYSIS: "CV Tahlili",
  };
  return map[f] || f.replace(/_/g, " ");
}
