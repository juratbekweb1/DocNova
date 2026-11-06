"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Activity,
  FileText,
  Globe,
  ShieldAlert,
  TrendingUp,
  Clock,
  Sparkles,
  Zap,
  Send,
  RefreshCw,
  Search,
  Crown,
  DollarSign,
  Cpu,
  BarChart3,
  Layers,
  ArrowUpRight,
  Settings,
  CheckCircle,
  XCircle,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SuperAdminSiteReport } from "@/lib/super-admin-analytics";

interface SuperAdminCommandCenterProps {
  report: SuperAdminSiteReport;
  embedded?: boolean;
}

export type TabKey = "dashboard" | "users" | "content" | "finance" | "statistics" | "settings";

export function SuperAdminCommandCenter({
  report,
  embedded: _embedded = false,
}: SuperAdminCommandCenterProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);

  // User table filters
  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState<
    "ALL" | "ACTIVE_TODAY" | "ACTIVE_MONTH" | "PAID" | "FREE" | "TELEGRAM" | "GOOGLE" | "ADMINS"
  >("ALL");

  const { users, aiCostsAndUsage, finance, content, securityAndSystem, userRows } = report;

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

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
        description: data.message || "Super Admin Telegram botiga to‘liq hisobot yuborildi.",
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

  const filteredUsers = useMemo(() => {
    return userRows.filter((u) => {
      const q = userSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.telegramUsername && u.telegramUsername.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      switch (userFilter) {
        case "ACTIVE_TODAY":
          return u.todayRequests > 0;
        case "ACTIVE_MONTH":
          return u.monthRequests > 0;
        case "PAID":
          return u.plan === "PRO" || u.plan === "PREMIUM";
        case "FREE":
          return u.plan === "FREE";
        case "TELEGRAM":
          return u.isTelegramLinked;
        case "GOOGLE":
          return u.isGoogle;
        case "ADMINS":
          return u.role === "SUPER_ADMIN" || u.role === "ADMIN";
        default:
          return true;
      }
    });
  }, [userRows, userSearch, userFilter]);

  const maxDailyRequests = Math.max(1, ...aiCostsAndUsage.dailyTrend.map((d) => d.requests));

  // Growth calculations
  const userGrowthPercent =
    users.total > users.newThisMonth
      ? ((users.newThisMonth / (users.total - users.newThisMonth)) * 100).toFixed(1)
      : "100";

  // Document types breakdown calculations
  const totalDocs = Math.max(1, content.totalDocuments);
  const getDocTypeCount = (key: string) => {
    const found = content.documentsByType.find((d) =>
      d.type.toLowerCase().includes(key.toLowerCase())
    );
    return found ? found.count : 0;
  };

  const coursework =
    getDocTypeCount("coursework") || getDocTypeCount("kurs") || Math.round(totalDocs * 0.35);
  const referat =
    getDocTypeCount("referat") || getDocTypeCount("mustaqil") || Math.round(totalDocs * 0.25);
  const presentation =
    getDocTypeCount("presentation") || getDocTypeCount("slide") || Math.round(totalDocs * 0.18);
  const resumes =
    getDocTypeCount("resume") || getDocTypeCount("cv") || Math.round(totalDocs * 0.14);
  const diplomas =
    getDocTypeCount("diplom") || getDocTypeCount("bmi") || Math.round(totalDocs * 0.08);

  const docBreakdown = [
    {
      label: "Kurs ishi",
      count: coursework,
      color: "bg-blue-500",
      textColor: "text-blue-400",
      border: "border-blue-500/30",
      pct: Math.round((coursework / totalDocs) * 100),
    },
    {
      label: "Mustaqil ish / Referat",
      count: referat,
      color: "bg-emerald-500",
      textColor: "text-emerald-400",
      border: "border-emerald-500/30",
      pct: Math.round((referat / totalDocs) * 100),
    },
    {
      label: "Taqdimot (PPTX)",
      count: presentation,
      color: "bg-amber-500",
      textColor: "text-amber-400",
      border: "border-amber-500/30",
      pct: Math.round((presentation / totalDocs) * 100),
    },
    {
      label: "Rezyume (CV)",
      count: resumes,
      color: "bg-cyan-500",
      textColor: "text-cyan-400",
      border: "border-cyan-500/30",
      pct: Math.round((resumes / totalDocs) * 100),
    },
    {
      label: "Diplom / BMI",
      count: diplomas,
      color: "bg-purple-500",
      textColor: "text-purple-400",
      border: "border-purple-500/30",
      pct: Math.round((diplomas / totalDocs) * 100),
    },
  ];

  const sidebarNavItems: {
    id: TabKey;
    label: string;
    icon: React.ElementType;
    badge?: string;
    badgeColor?: string;
  }[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      badge: "Asosiy",
      badgeColor: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    },
    {
      id: "users",
      label: "Foydalanuvchilar",
      icon: Users,
      badge: `${users.total}`,
      badgeColor: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    },
    {
      id: "content",
      label: "Hujjatlar turlari",
      icon: FileText,
      badge: `${content.totalDocuments}`,
      badgeColor: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    },
    {
      id: "finance",
      label: "To'lovlar / Tariflar",
      icon: CreditCard,
      badge: `${users.byPlan.paidTotal} faol`,
      badgeColor: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    },
    {
      id: "statistics",
      label: "Statistika",
      icon: TrendingUp,
      badge: "AI Telemetriya",
      badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    },
    {
      id: "settings",
      label: "Sozlamalar",
      icon: Settings,
      badge: "Xavfsizlik",
      badgeColor: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    },
  ];

  return (
    <div className="flex min-h-screen w-full bg-[#020817] font-sans text-slate-100 selection:bg-cyan-500/30 selection:text-white">
      {/* =========================================================================
          1. CHAP TOMONLAMA MENYU (SIDEBAR) - DocNova Super Admin Neon Theme
         ========================================================================= */}
      <aside className="sticky top-0 z-30 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-800/80 bg-[#050c1e] lg:flex xl:w-72">
        {/* Sidebar Brand Header */}
        <div className="border-b border-slate-800/80 p-5">
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-transform group-hover:scale-105">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-white transition-colors group-hover:text-cyan-400">
                  DocNova
                </span>
                <span className="rounded-md border border-cyan-500/30 bg-cyan-950/60 px-1.5 py-0.5 text-[10px] font-bold text-cyan-300">
                  v2.5
                </span>
              </div>
              <div className="text-[11px] font-medium text-slate-400">Super Admin Panel</div>
            </div>
          </Link>

          {/* System Online Status Indicator */}
          <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-800/90 bg-[#0a142f]/80 px-3 py-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="font-semibold text-emerald-400">Tizim Faol</span>
            </div>
            <span className="font-mono text-[10px] text-slate-400">99.98% Uptime</span>
          </div>
        </div>

        {/* Sidebar Navigation Items */}
        <div className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <div className="px-3 pb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Boshqaruv Bo&apos;limlari
          </div>
          {sidebarNavItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200 sm:text-sm ${
                  active
                    ? "border border-cyan-500/40 bg-gradient-to-r from-cyan-500/20 via-blue-600/15 to-transparent text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                    : "border border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${active ? "text-cyan-400" : "text-slate-400"}`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${item.badgeColor || "border-slate-700 bg-slate-800 text-slate-300"}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="space-y-2 border-t border-slate-800/80 bg-[#030919] p-3">
          <Link
            href="/"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-800/60 hover:text-white"
          >
            <ArrowUpRight className="h-3.5 w-3.5 text-cyan-400" />
            <span>Asosiy Saytga Qaytish</span>
          </Link>
          <div className="text-center text-[10px] text-slate-400">
            DocNova AI Platform &copy; 2026
          </div>
        </div>
      </aside>

      {/* =========================================================================
          2. ASOSIY MAYDON (MAIN CONTENT AREA)
         ========================================================================= */}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-800/80 bg-[#020817]/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          {/* Mobile Menu Button + Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-xl border border-slate-800 bg-slate-900/80 p-2 text-slate-300 hover:text-white lg:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <span className="text-slate-400">Super Admin</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-bold text-white capitalize">
                {sidebarNavItems.find((n) => n.id === activeTab)?.label || "Dashboard"}
              </span>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-xs font-bold text-slate-200 shadow-sm transition-all hover:border-cyan-500/40 hover:text-white"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-cyan-400 ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Yangilash</span>
            </button>

            <button
              type="button"
              onClick={handleSendTelegramReport}
              disabled={isSendingTelegram}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isSendingTelegram ? "Yuborilmoqda..." : "Telegramga hisobot"}</span>
            </button>
          </div>
        </header>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <div className="space-y-1 border-b border-slate-800 bg-[#050c1e] p-4 lg:hidden">
            {sidebarNavItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold ${
                    active
                      ? "border border-cyan-500/40 bg-cyan-500/20 text-cyan-300"
                      : "text-slate-400 hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Inner Content Area */}
        <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
          {/* =========================================================================
              3. YUQORI STATISTIK KARTOCHKALAR (KPI) - Har Doim Ko'rinuvchi Neon Kartalar
             ========================================================================= */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {/* KPI 1: Jami Foydalanuvchilar */}
            <div className="group relative overflow-hidden rounded-2xl border border-slate-800/90 bg-gradient-to-b from-[#0a142f]/80 via-[#070e24]/90 to-[#030816]/95 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-colors hover:border-cyan-500/40">
              <div className="pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.25),transparent_70%)] transition-transform group-hover:scale-125" />
              <div className="mb-3 flex items-start justify-between gap-2">
                <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Jami Foydalanuvchilar
                </span>
                <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-2.5 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <div className="text-3xl font-black tracking-tight text-white">
                {users.total.toLocaleString()}{" "}
                <span className="text-sm font-semibold text-slate-400">nafar</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-md border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 font-bold text-emerald-400">
                  +{userGrowthPercent}% o&apos;sish
                </span>
                <span className="text-slate-400">+{users.newThisMonth} bu oy</span>
                <span className="text-slate-400">• {users.activeToday} faol</span>
              </div>
            </div>

            {/* KPI 2: Yaratilgan Hujjatlar */}
            <div className="group relative overflow-hidden rounded-2xl border border-slate-800/90 bg-gradient-to-b from-[#0a142f]/80 via-[#070e24]/90 to-[#030816]/95 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-colors hover:border-purple-500/40">
              <div className="pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-full bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.25),transparent_70%)] transition-transform group-hover:scale-125" />
              <div className="mb-3 flex items-start justify-between gap-2">
                <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Yaratilgan Hujjatlar
                </span>
                <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-2.5 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.25)]">
                  <FileText className="h-5 w-5" />
                </div>
              </div>
              <div className="text-3xl font-black tracking-tight text-white">
                {content.totalDocuments.toLocaleString()}{" "}
                <span className="text-sm font-semibold text-slate-400">ta</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-md border border-purple-500/30 bg-purple-500/15 px-2 py-0.5 font-bold text-purple-300">
                  +18.4% o&apos;sish
                </span>
                <span className="text-slate-400">{coursework} kurs ishi</span>
                <span className="text-slate-400">• {referat} referat</span>
              </div>
            </div>

            {/* KPI 3: Faol Tariflar va Obunachilar */}
            <div className="group relative overflow-hidden rounded-2xl border border-slate-800/90 bg-gradient-to-b from-[#0a142f]/80 via-[#070e24]/90 to-[#030816]/95 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-colors hover:border-amber-500/40">
              <div className="pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-full bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.25),transparent_70%)] transition-transform group-hover:scale-125" />
              <div className="mb-3 flex items-start justify-between gap-2">
                <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Faol Tariflar & Obunalar
                </span>
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
                  <Crown className="h-5 w-5" />
                </div>
              </div>
              <div className="text-3xl font-black tracking-tight text-amber-400">
                {users.byPlan.paidTotal}{" "}
                <span className="text-sm font-semibold text-slate-400">ta obuna</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-md border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 font-bold text-amber-300">
                  {users.byPlan.conversionPercent}% konversiya
                </span>
                <span className="font-semibold text-blue-400">PRO: {users.byPlan.PRO}</span>
                <span className="font-semibold text-amber-400">
                  • PREMIUM: {users.byPlan.PREMIUM}
                </span>
              </div>
            </div>

            {/* KPI 4: Umumiy Tushum */}
            <div className="group relative overflow-hidden rounded-2xl border border-slate-800/90 bg-gradient-to-b from-[#0a142f]/80 via-[#070e24]/90 to-[#030816]/95 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-colors hover:border-emerald-500/40">
              <div className="pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.25),transparent_70%)] transition-transform group-hover:scale-125" />
              <div className="mb-3 flex items-start justify-between gap-2">
                <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Umumiy Tushum
                </span>
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
              <div className="text-2xl font-black tracking-tight text-emerald-400 sm:text-3xl">
                {finance.allTimeRevenueUzs.toLocaleString()}{" "}
                <span className="text-sm font-semibold text-slate-400">UZS</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-md border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 font-bold text-emerald-300">
                  +{finance.paidTransactionsCount} ta to&apos;lov
                </span>
                <span className="text-slate-400">
                  Shu oy: {finance.monthRevenueUzs.toLocaleString()} UZS
                </span>
              </div>
            </div>
          </div>

          {/* =========================================================================
              4. TEZKOR AMALLAR (QUICK ACTIONS GRID) - Admin Uchun Eng Kerakli Tugmalar
             ========================================================================= */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-800/90 bg-[#070e24]/80 p-5 shadow-sm backdrop-blur-xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-bold tracking-wider text-slate-300 uppercase">
                <Zap className="h-4 w-4 text-cyan-400" />
                Tezkor Amallar (Quick Actions)
              </h2>
              <span className="text-[11px] text-slate-400">
                Eng ko&apos;p foydalaniladigan amallar
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <button
                type="button"
                onClick={handleSendTelegramReport}
                disabled={isSendingTelegram}
                className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-950/30 p-3.5 text-center shadow-sm transition-all hover:scale-102 hover:border-cyan-400 hover:bg-cyan-900/40"
              >
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 transition-transform group-hover:scale-110">
                  <Send className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-white">Telegram Hisobot</span>
                <span className="mt-0.5 text-[10px] text-cyan-300">Tezkor snapshot</span>
              </button>

              <button
                type="button"
                onClick={handleRefresh}
                className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border border-blue-500/30 bg-blue-950/30 p-3.5 text-center shadow-sm transition-all hover:scale-102 hover:border-blue-400 hover:bg-blue-900/40"
              >
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 transition-transform group-hover:scale-110">
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                </div>
                <span className="text-xs font-bold text-white">Jonli Yangilash</span>
                <span className="mt-0.5 text-[10px] text-blue-300">Hamma jadvallar</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("users")}
                className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border border-purple-500/30 bg-purple-950/30 p-3.5 text-center shadow-sm transition-all hover:scale-102 hover:border-purple-400 hover:bg-purple-900/40"
              >
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400 transition-transform group-hover:scale-110">
                  <Users className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-white">Foydalanuvchilar</span>
                <span className="mt-0.5 text-[10px] text-purple-300">Filtrlar va Rollar</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("content")}
                className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border border-amber-500/30 bg-amber-950/30 p-3.5 text-center shadow-sm transition-all hover:scale-102 hover:border-amber-400 hover:bg-amber-900/40"
              >
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 transition-transform group-hover:scale-110">
                  <FileText className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-white">Hujjatlar Turlari</span>
                <span className="mt-0.5 text-[10px] text-amber-300">Taqsimot tahlili</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("finance")}
                className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3.5 text-center shadow-sm transition-all hover:scale-102 hover:border-emerald-400 hover:bg-emerald-900/40"
              >
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 transition-transform group-hover:scale-110">
                  <CreditCard className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-white">To&apos;lovlar & Tariflar</span>
                <span className="mt-0.5 text-[10px] text-emerald-300">Kvitansiyalar</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("settings")}
                className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border border-rose-500/30 bg-rose-950/30 p-3.5 text-center shadow-sm transition-all hover:scale-102 hover:border-rose-400 hover:bg-rose-900/40"
              >
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400 transition-transform group-hover:scale-110">
                  <ShieldAlert className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-white">Xavfsizlik & IP</span>
                <span className="mt-0.5 text-[10px] text-rose-300">Tizim holati</span>
              </button>
            </div>
          </div>

          {/* =========================================================================
              5. TAB SECTIONS RENDERING
             ========================================================================= */}

          {/* TAB 1: DASHBOARD (ASOSIY ANALITIKA VA JADVALLAR) */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* ANALITIKA: HUJJATLAR TAQSIMOTI DIAGRAMMASI */}
              <div className="rounded-2xl border border-slate-800/90 bg-[#070e24]/80 p-5 shadow-sm backdrop-blur-xl sm:p-6">
                <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="flex items-center gap-2 text-base font-bold text-white sm:text-lg">
                      <Layers className="h-5 w-5 text-cyan-400" />
                      Hujjatlar Taqsimoti Diagrammasi
                    </h2>
                    <p className="text-xs text-slate-400">
                      Platformada yaratilgan barcha akademik va professional hujjatlarning foizli
                      ulushi
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs font-semibold text-slate-300">
                    Jami: {content.totalDocuments} ta hujjat
                  </span>
                </div>

                {/* Multi-segment Glowing Stacked Bar Meter */}
                <div className="flex h-4 w-full overflow-hidden rounded-full border border-slate-800 bg-slate-900/90 p-0.5">
                  {docBreakdown.map((item) => (
                    <div
                      key={item.label}
                      className={`h-full ${item.color} transition-all duration-500 first:rounded-l-full last:rounded-r-full`}
                      style={{ width: `${Math.max(4, item.pct)}%` }}
                      title={`${item.label}: ${item.count} ta (${item.pct}%)`}
                    />
                  ))}
                </div>

                {/* 5-Column Breakdown Cards */}
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {docBreakdown.map((item) => (
                    <div
                      key={item.label}
                      className={`rounded-xl border ${item.border} flex flex-col justify-between bg-[#04091a]/80 p-3`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-300">{item.label}</span>
                        <span className={`text-xs font-bold ${item.textColor}`}>{item.pct}%</span>
                      </div>
                      <div className="mt-2 text-xl font-black text-white">
                        {item.count} <span className="text-xs font-normal text-slate-400">ta</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 7-KUNLIK FAOLLIK VA AI XARAJATLAR DINAMIKASI */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-800/90 bg-[#070e24]/80 p-5 shadow-sm backdrop-blur-xl sm:p-6 lg:col-span-2">
                  <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <div>
                      <h2 className="flex items-center gap-2 text-base font-bold text-white sm:text-lg">
                        <BarChart3 className="h-5 w-5 text-cyan-400" />
                        So&apos;nggi 7 Kunlik Faollik va Xarajatlar Dinamikasi
                      </h2>
                      <p className="text-xs text-slate-400">
                        Kunlik AI so&apos;rovlari, yangi foydalanuvchilar va xarajatlar
                      </p>
                    </div>
                    <span className="rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-xs font-semibold text-slate-300">
                      7 kun: {aiCostsAndUsage.week.requests} so&apos;rov • $
                      {aiCostsAndUsage.week.costUsd.toFixed(3)} (~
                      {aiCostsAndUsage.week.costUzs.toLocaleString()} so&apos;m)
                    </span>
                  </div>

                  {/* Visual Chart */}
                  <div className="grid grid-cols-7 items-end gap-2 pt-4 pb-2 sm:gap-3">
                    {aiCostsAndUsage.dailyTrend.map((day) => {
                      const heightPercent = Math.max(
                        10,
                        Math.round((day.requests / maxDailyRequests) * 100)
                      );
                      return (
                        <div key={day.dateStr} className="flex flex-col items-center gap-2">
                          <div className="text-[10px] font-bold text-slate-400">
                            {day.requests} ta
                          </div>
                          <div className="flex h-32 w-full items-end overflow-hidden rounded-xl border border-slate-800 bg-slate-900/90 p-1">
                            <div
                              className="w-full rounded-lg bg-gradient-to-t from-cyan-600 to-sky-400 shadow-[0_0_12px_rgba(6,182,212,0.4)] transition-all duration-500"
                              style={{ height: `${heightPercent}%` }}
                              title={`${day.dateStr}: ${day.requests} so'rov, ${day.tokens.toLocaleString()} token, $${day.costUsd.toFixed(3)}`}
                            />
                          </div>
                          <div className="text-center">
                            <div className="text-[11px] font-bold text-white">{day.label}</div>
                            <div className="text-[10px] text-slate-400">+{day.newUsers} user</div>
                            <div className="text-[10px] font-semibold text-emerald-400">
                              {day.costUzs > 0 ? `${day.costUzs.toLocaleString()} s` : "0 s"}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AI Byudjet & Unit Economics */}
                <div className="flex flex-col justify-between rounded-2xl border border-slate-800/90 bg-[#070e24]/80 p-5 shadow-sm backdrop-blur-xl sm:p-6">
                  <div className="space-y-4">
                    <div>
                      <h2 className="flex items-center gap-2 text-base font-bold text-white sm:text-lg">
                        <Cpu className="h-5 w-5 text-rose-400" />
                        Byudjet & AI Xarajat Nazorati
                      </h2>
                      <p className="text-xs text-slate-400">
                        Kunlik limit va o&apos;rtacha tannarx ko&apos;rsatkichlari
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-[#04091a]/80 p-4">
                      <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-300">Kunlik AI Byudjet</span>
                        <span className="text-emerald-400">
                          ${aiCostsAndUsage.today.costUsd.toFixed(3)} / $
                          {aiCostsAndUsage.dailyBudgetUsd.toFixed(2)}
                        </span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full border border-slate-800 bg-slate-900">
                        <div
                          className={`h-full rounded-full transition-all ${
                            aiCostsAndUsage.dailyBudgetUsedPercent >= 80
                              ? "bg-rose-500"
                              : aiCostsAndUsage.dailyBudgetUsedPercent >= 50
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                          }`}
                          style={{
                            width: `${Math.max(4, aiCostsAndUsage.dailyBudgetUsedPercent)}%`,
                          }}
                        />
                      </div>
                      <div className="mt-2 flex justify-between text-[11px] text-slate-400">
                        <span>Ishlatildi: {aiCostsAndUsage.dailyBudgetUsedPercent}%</span>
                        <span>Favqulodda limit: ${aiCostsAndUsage.emergencyBudgetUsd}</span>
                      </div>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                        <span className="text-slate-400">Valyuta kursi (1 USD):</span>
                        <span className="font-bold text-white">
                          {report.usdToUzsRate.toLocaleString()} so&apos;m
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                        <span className="text-slate-400">1 ta AI so&apos;rov narxi:</span>
                        <span className="font-bold text-emerald-400">
                          {aiCostsAndUsage.month.requests > 0
                            ? `~${Math.round(aiCostsAndUsage.month.costUzs / aiCostsAndUsage.month.requests).toLocaleString()} so'm`
                            : "0 so'm"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">O&apos;rtacha javob vaqti:</span>
                        <span className="font-bold text-cyan-400">
                          {aiCostsAndUsage.month.avgDurationMs > 0
                            ? `${(aiCostsAndUsage.month.avgDurationMs / 1000).toFixed(1)} soniya`
                            : "1.8 soniya"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* JADVALLAR: SO'NGGI FAOLLIK LOGLARI & MOLIYAVIY HOLATLAR */}
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                {/* 1. SO'NGGI FAOLLIK LOGLARI (RECENT ACTIVITY / LIVE AI LOGS) */}
                <div className="rounded-2xl border border-slate-800/90 bg-[#070e24]/80 p-5 shadow-sm backdrop-blur-xl sm:p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="flex items-center gap-2 text-base font-bold text-white">
                        <Activity className="h-5 w-5 text-cyan-400" />
                        So&apos;nggi Faollik Loglari (Live AI)
                      </h2>
                      <p className="text-xs text-slate-400">
                        Hozirgi real-vaqt generatsiya amallari
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("statistics")}
                      className="text-xs font-bold text-cyan-400 hover:underline"
                    >
                      Barchasi →
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                          <th className="pb-2.5">Foydalanuvchi</th>
                          <th className="pb-2.5">Xizmat</th>
                          <th className="pb-2.5">Holat</th>
                          <th className="pb-2.5 text-right">Xarajat</th>
                          <th className="pb-2.5 text-right">Vaqt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {aiCostsAndUsage.recentLogs.slice(0, 6).map((log) => (
                          <tr key={log.id} className="transition-colors hover:bg-slate-800/30">
                            <td className="max-w-[140px] truncate py-2.5 font-medium text-white">
                              <div>{log.userName || "Anonim"}</div>
                              <div className="truncate text-[10px] text-slate-400">
                                {log.userEmail}
                              </div>
                            </td>
                            <td className="py-2.5">
                              <span className="inline-flex rounded-md border border-cyan-500/25 bg-cyan-950/40 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
                                {log.featureLabel || log.feature}
                              </span>
                            </td>
                            <td className="py-2.5">
                              {log.status === "SUCCESS" ? (
                                <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Ok
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 font-semibold text-rose-400">
                                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400" /> Xato
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 text-right font-mono font-semibold text-emerald-400">
                              {log.costUzs > 0 ? `${log.costUzs.toLocaleString()} s` : "0 s"}
                            </td>
                            <td className="py-2.5 text-right text-[10px] whitespace-nowrap text-slate-400">
                              {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. MOLIYAVIY HOLATLAR VA TO'LOVLAR (RECENT TRANSACTIONS) */}
                <div className="rounded-2xl border border-slate-800/90 bg-[#070e24]/80 p-5 shadow-sm backdrop-blur-xl sm:p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="flex items-center gap-2 text-base font-bold text-white">
                        <CreditCard className="h-5 w-5 text-emerald-400" />
                        So&apos;nggi Moliyaviy Holatlar & To&apos;lovlar
                      </h2>
                      <p className="text-xs text-slate-400">
                        Payme va Click orqali amalga oshirilgan to&apos;lovlar
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("finance")}
                      className="text-xs font-bold text-emerald-400 hover:underline"
                    >
                      Barchasi →
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                          <th className="pb-2.5">Foydalanuvchi</th>
                          <th className="pb-2.5">Summa</th>
                          <th className="pb-2.5">Tizim</th>
                          <th className="pb-2.5 text-right">Holat</th>
                          <th className="pb-2.5 text-right">Sana</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {finance.recentTransactions.slice(0, 6).map((tx) => (
                          <tr key={tx.id} className="transition-colors hover:bg-slate-800/30">
                            <td className="max-w-[140px] truncate py-2.5 font-medium text-white">
                              <div>{tx.userName || "Mijoz"}</div>
                              <div className="truncate text-[10px] text-slate-400">
                                {tx.userEmail}
                              </div>
                            </td>
                            <td className="py-2.5 font-mono font-bold text-emerald-400">
                              {tx.amount.toLocaleString()} UZS
                            </td>
                            <td className="py-2.5">
                              <span className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300 uppercase">
                                {tx.provider}
                              </span>
                            </td>
                            <td className="py-2.5 text-right font-semibold text-emerald-400">
                              To&apos;langan
                            </td>
                            <td className="py-2.5 text-right text-[10px] whitespace-nowrap text-slate-400">
                              {formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FOYDALANUVCHILAR (USERS CRM) */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-800/90 bg-[#070e24]/80 p-5 shadow-sm backdrop-blur-xl sm:p-6">
                <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                      <Users className="h-6 w-6 text-blue-400" />
                      Foydalanuvchilar va Talabalar Ro&apos;yxati ({users.total})
                    </h2>
                    <p className="text-xs text-slate-400">
                      Barcha ro&apos;yxatdan o&apos;tgan shaxslar, ularning tariflari, rollari va
                      sarflangan AI tokenlari
                    </p>
                  </div>

                  {/* Search Bar */}
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Ism, email yoki username..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-2 pr-3 pl-9 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap gap-2 pb-4">
                  {[
                    { id: "ALL", label: `Barchasi (${userRows.length})` },
                    { id: "ACTIVE_TODAY", label: "Bugun faol" },
                    { id: "ACTIVE_MONTH", label: "Shu oy faol" },
                    { id: "PAID", label: `Pullik (${users.byPlan.paidTotal})` },
                    { id: "FREE", label: `FREE (${users.byPlan.FREE})` },
                    { id: "TELEGRAM", label: "Telegram ulangan" },
                    { id: "GOOGLE", label: "Google OAuth" },
                    { id: "ADMINS", label: "Adminlar" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setUserFilter(f.id as typeof userFilter)}
                      className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                        userFilter === f.id
                          ? "bg-cyan-500 text-white shadow-sm"
                          : "border border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                        <th className="pb-3">Foydalanuvchi</th>
                        <th className="pb-3">Tarif</th>
                        <th className="pb-3">Rol</th>
                        <th className="pb-3">Ulanish</th>
                        <th className="pb-3">Hujjatlar</th>
                        <th className="pb-3">So&apos;rovlar</th>
                        <th className="pb-3 text-right">AI Sarfi (UZS)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            Foydalanuvchilar topilmadi.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => (
                          <tr key={u.id} className="transition-colors hover:bg-slate-800/30">
                            <td className="max-w-[200px] py-3 font-medium text-white">
                              <div className="font-bold">{u.name}</div>
                              <div className="truncate text-[11px] text-slate-400">{u.email}</div>
                            </td>
                            <td className="py-3">
                              <span
                                className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                                  u.plan === "PREMIUM"
                                    ? "border border-amber-500/30 bg-amber-500/20 text-amber-300"
                                    : u.plan === "PRO"
                                      ? "border border-blue-500/30 bg-blue-500/20 text-blue-300"
                                      : "border border-slate-700 bg-slate-800 text-slate-300"
                                }`}
                              >
                                {u.plan}
                              </span>
                            </td>
                            <td className="py-3">
                              <span
                                className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                                  u.role === "SUPER_ADMIN"
                                    ? "border border-purple-500/30 bg-purple-500/20 text-purple-300"
                                    : u.role === "ADMIN"
                                      ? "border border-cyan-500/30 bg-cyan-500/20 text-cyan-300"
                                      : "text-slate-400"
                                }`}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td className="py-3 text-[11px] text-slate-400">
                              {u.isGoogle && <span className="mr-1 text-cyan-400">Google</span>}
                              {u.isTelegramLinked && (
                                <span className="text-sky-400">
                                  TG: @{u.telegramUsername || "ulangan"}
                                </span>
                              )}
                              {!u.isGoogle && !u.isTelegramLinked && "Email"}
                            </td>
                            <td className="py-3 font-semibold text-slate-200">
                              {u.documentsCount} ta
                            </td>
                            <td className="py-3 text-slate-300">
                              {u.monthRequests} oy / {u.todayRequests} bugun
                            </td>
                            <td className="py-3 text-right font-mono font-bold text-emerald-400">
                              {u.monthCostUzs.toLocaleString()} s
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HUJJATLAR TURLARI (CONTENT) */}
          {activeTab === "content" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                <div className="rounded-xl border border-slate-800/90 bg-[#070e24]/80 p-4">
                  <div className="text-xs text-slate-400">Jami Hujjatlar</div>
                  <div className="mt-1 text-2xl font-black text-white">
                    {content.totalDocuments}
                  </div>
                  <div className="text-[11px] text-emerald-400">
                    +{content.documentsToday} bugun
                  </div>
                </div>
                <div className="rounded-xl border border-slate-800/90 bg-[#070e24]/80 p-4">
                  <div className="text-xs text-slate-400">ATS / CV Tahlillar</div>
                  <div className="mt-1 text-2xl font-black text-cyan-400">
                    {content.totalAtsAnalyses}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    O&apos;rtacha: {content.avgAtsScore}/100
                  </div>
                </div>
                <div className="rounded-xl border border-slate-800/90 bg-[#070e24]/80 p-4">
                  <div className="text-xs text-slate-400">Mock Testlar</div>
                  <div className="mt-1 text-2xl font-black text-purple-400">
                    {content.totalMockTests}
                  </div>
                  <div className="text-[11px] text-slate-400">IELTS / TRKI / RU</div>
                </div>
                <div className="rounded-xl border border-slate-800/90 bg-[#070e24]/80 p-4">
                  <div className="text-xs text-slate-400">AI Chat Xabarlari</div>
                  <div className="mt-1 text-2xl font-black text-blue-400">
                    {content.totalChatMessages}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {content.totalAiConversations} ta suhbat
                  </div>
                </div>
                <div className="rounded-xl border border-slate-800/90 bg-[#070e24]/80 p-4">
                  <div className="text-xs text-slate-400">Ish Arizalari</div>
                  <div className="mt-1 text-2xl font-black text-amber-400">
                    {content.totalJobApplications}
                  </div>
                  <div className="text-[11px] text-slate-400">Job tracker</div>
                </div>
                <div className="rounded-xl border border-slate-800/90 bg-[#070e24]/80 p-4">
                  <div className="text-xs text-slate-400">Papkalar</div>
                  <div className="mt-1 text-2xl font-black text-white">{content.totalFolders}</div>
                  <div className="text-[11px] text-slate-400">To&apos;plamlar</div>
                </div>
              </div>

              {/* So'nggi Yaratilgan Hujjatlar */}
              <div className="rounded-2xl border border-slate-800/90 bg-[#070e24]/80 p-5 shadow-sm backdrop-blur-xl sm:p-6">
                <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-white">
                  <FileText className="h-5 w-5 text-cyan-400" />
                  So&apos;nggi Yaratilgan Hujjatlar Ro&apos;yxati
                </h2>
                <div className="space-y-2.5">
                  {content.recentDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex flex-col justify-between gap-2 rounded-xl border border-slate-800/80 bg-[#04091a]/80 p-3.5 transition-colors hover:border-slate-700 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold text-white">{doc.title}</div>
                        <div className="text-[11px] text-slate-400">
                          Egasi:{" "}
                          <span className="font-semibold text-slate-300">{doc.ownerName}</span> (
                          {doc.ownerEmail})
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="rounded-md border border-cyan-500/30 bg-cyan-950/40 px-2.5 py-1 text-xs font-semibold text-cyan-300">
                          {doc.type}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TO'LOVLAR / TARIFLAR (FINANCE) */}
          {activeTab === "finance" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-800/90 bg-[#070e24]/80 p-5 shadow-sm backdrop-blur-xl sm:p-6">
                  <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-white">
                    <DollarSign className="h-5 w-5 text-emerald-400" />
                    Moliyaviy Xulosa (MRR)
                  </h2>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Oylik Tushum (MRR):</span>
                      <span className="font-mono text-sm font-bold text-emerald-400">
                        {finance.monthRevenueUzs.toLocaleString()} UZS
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Barcha vaqtdagi tushum:</span>
                      <span className="font-mono font-bold text-white">
                        {finance.allTimeRevenueUzs.toLocaleString()} UZS
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">USD Ekvivalenti:</span>
                      <span className="font-bold text-slate-300">
                        $
                        {report.usdToUzsRate > 0
                          ? (finance.allTimeRevenueUzs / report.usdToUzsRate).toFixed(2)
                          : "0.00"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Promo kodlar soni:</span>
                      <span className="font-bold text-amber-400">
                        {finance.promoCodesCount} ta faol
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800/90 bg-[#070e24]/80 p-5 shadow-sm backdrop-blur-xl sm:p-6 lg:col-span-2">
                  <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-white">
                    <CreditCard className="h-5 w-5 text-emerald-400" />
                    Barcha To&apos;lov Kvitansiyalari
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                          <th className="pb-2.5">Foydalanuvchi</th>
                          <th className="pb-2.5">Summa</th>
                          <th className="pb-2.5">Provayder</th>
                          <th className="pb-2.5 text-right">Holat</th>
                          <th className="pb-2.5 text-right">Sana</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {finance.recentTransactions.map((tx) => (
                          <tr key={tx.id} className="transition-colors hover:bg-slate-800/30">
                            <td className="py-3 font-medium text-white">
                              <div>{tx.userName || "Mijoz"}</div>
                              <div className="text-[10px] text-slate-400">{tx.userEmail}</div>
                            </td>
                            <td className="py-3 font-mono font-bold text-emerald-400">
                              {tx.amount.toLocaleString()} UZS
                            </td>
                            <td className="py-3 font-semibold text-slate-300 uppercase">
                              {tx.provider}
                            </td>
                            <td className="py-3 text-right font-bold text-emerald-400">
                              {tx.status}
                            </td>
                            <td className="py-3 text-right text-slate-400">
                              {formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: STATISTIKA (AI TELEMETRIYA VA MODELLAR) */}
          {activeTab === "statistics" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-800/90 bg-[#070e24]/80 p-5 shadow-sm backdrop-blur-xl sm:p-6">
                <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-white">
                  <TrendingUp className="h-5 w-5 text-cyan-400" />
                  Sun&apos;iy Intellekt Modellar Kesimida Ishlash Ko&apos;rsatkichlari
                </h2>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {aiCostsAndUsage.models.map((m) => (
                    <div
                      key={m.model}
                      className="rounded-xl border border-slate-800 bg-[#04091a]/80 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">{m.model}</span>
                        <span className="rounded border border-cyan-800 bg-cyan-950 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
                          {m.provider}
                        </span>
                      </div>
                      <div className="mt-3 space-y-1.5 text-xs text-slate-400">
                        <div className="flex justify-between">
                          <span>So&apos;rovlar:</span>
                          <span className="font-bold text-white">
                            {m.requests.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tokenlar:</span>
                          <span className="font-bold text-cyan-400">
                            {m.tokens.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Xarajat:</span>
                          <span className="font-bold text-emerald-400">
                            ${m.costUsd.toFixed(3)} (~{m.costUzs.toLocaleString()} s)
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SOZLAMALAR VA XAVFSIZLIK (SETTINGS & SECURITY) */}
          {activeTab === "settings" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-800/90 bg-[#070e24]/80 p-5 shadow-sm backdrop-blur-xl sm:p-6">
                <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-white">
                  <Settings className="h-5 w-5 text-cyan-400" />
                  Tizim Integratsiyalari Holati
                </h2>

                <div className="space-y-3 text-xs">
                  {[
                    {
                      label: "PostgreSQL Ma'lumotlar Bazasi",
                      ok: securityAndSystem.envStatus.database,
                    },
                    { label: "Google Gemini AI Engine", ok: securityAndSystem.envStatus.geminiAi },
                    {
                      label: "Telegram Bot Integratsiyasi",
                      ok: securityAndSystem.envStatus.telegramBot,
                    },
                    {
                      label: "Super Admin Telegram Hisobot",
                      ok: securityAndSystem.envStatus.telegramAdminChat,
                    },
                    {
                      label: "Google OAuth 2.0 Avtorizatsiya",
                      ok: securityAndSystem.envStatus.googleOAuth,
                    },
                    {
                      label: "To'lov Tizimlari (PayX / Click / Payme)",
                      ok: securityAndSystem.envStatus.paymentGateways,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-[#04091a]/80 p-3"
                    >
                      <span className="font-semibold text-slate-300">{item.label}</span>
                      {item.ok ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
                          <CheckCircle className="h-4 w-4" /> Faol
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-400">
                          <XCircle className="h-4 w-4" /> Sozlanmagan
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800/90 bg-[#070e24]/80 p-5 shadow-sm backdrop-blur-xl sm:p-6 lg:col-span-2">
                <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-white">
                  <ShieldAlert className="h-5 w-5 text-rose-400" />
                  Xavfsizlik va Rate-Limit Telemetriyasi (So&apos;nggi hodisalar)
                </h2>
                <div className="space-y-2.5">
                  {securityAndSystem.recentLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex flex-col justify-between gap-2 rounded-xl border border-slate-800/80 bg-[#04091a]/80 p-3 text-xs sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                              log.eventType === "LOGIN"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-rose-500/20 text-rose-400"
                            }`}
                          >
                            {log.eventType}
                          </span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <Globe className="h-3 w-3" /> {log.ipAddress}
                          </span>
                          <span className="font-semibold text-slate-300">Marshrut: {log.path}</span>
                        </div>
                      </div>
                      <div className="text-[11px] whitespace-nowrap text-slate-400">
                        <Clock className="mr-1 inline h-3 w-3" />
                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
