"use client";

import React from "react";
import {
  Users,
  CreditCard,
  Activity,
  FileText,
  Globe,
  ShieldAlert,
  TrendingUp,
  UserPlus,
  Clock,
  LogIn,
  Server,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useLanguage } from "@/components/providers/language-provider";

interface AdminDashboardClientProps {
  totalUsers: number;
  activeSubs: number;
  mrr: number;
  totalTokens: number;
  recentUsers: Array<{
    id: string;
    name: string | null;
    email: string | null;
    createdAt: Date | string;
    role: string;
  }>;
  transactions: Array<{
    id: string;
    amount: number;
    provider: string;
    createdAt: Date | string;
  }>;
  securityLogs: Array<{
    id: string;
    eventType: string;
    ipAddress: string | null;
    path: string | null;
    createdAt: Date | string;
  }>;
}

export function AdminDashboardClient({
  totalUsers,
  activeSubs,
  mrr,
  totalTokens,
  recentUsers,
  transactions,
  securityLogs,
}: AdminDashboardClientProps) {
  const { t, lang } = useLanguage();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 mx-auto max-w-7xl space-y-8 p-6 duration-700 md:p-8">
      {/* Header Info */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-foreground text-3xl font-extrabold tracking-tight">
            {t.adminTitle || "Admin Boshqaruv Paneli"}
          </h1>
          <p className="text-foreground-secondary mt-1 font-medium">
            {t.adminSubtitle ||
              "Saytning to'liq statistikasi, kirish-chiqishlar va moliyaviy holati."}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-500 shadow-sm">
          <Server className="h-4 w-4 animate-pulse" />
          {t.adminOnline || "Tizim faol (Online)"}
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-surface border-border group relative overflow-hidden rounded-2xl border p-6 shadow-sm transition-all hover:border-blue-500/50 hover:shadow-[0_8px_30px_-12px_rgba(59,130,246,0.3)]">
          <div className="pointer-events-none absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.2),transparent_70%)] transition-transform group-hover:scale-110"></div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-foreground-secondary text-sm font-bold">
              {t.adminTotalUsers || "Jami Foydalanuvchilar"}
            </h3>
            <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-500">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="text-foreground text-3xl font-extrabold">{totalUsers}</div>
          <p className="text-foreground-muted mt-2 flex items-center gap-1 text-xs font-medium">
            <TrendingUp className="h-3 w-3 text-emerald-500" />
            {lang === "ru" ? "За всё время" : lang === "en" ? "All time" : "Barcha vaqt uchun"}
          </p>
        </div>

        <div className="bg-surface border-border group relative overflow-hidden rounded-2xl border p-6 shadow-sm transition-all hover:border-emerald-500/50 hover:shadow-[0_8px_30px_-12px_rgba(16,185,129,0.3)]">
          <div className="pointer-events-none absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.2),transparent_70%)] transition-transform group-hover:scale-110"></div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-foreground-secondary text-sm font-bold">
              {t.adminActiveSubs || "Faol Obunalar"}
            </h3>
            <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-500">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <div className="text-foreground text-3xl font-extrabold">{activeSubs}</div>
          <p className="text-foreground-muted mt-2 flex items-center gap-1 text-xs font-medium">
            <TrendingUp className="h-3 w-3 text-emerald-500" />
            {lang === "ru"
              ? "Премиум пользователи"
              : lang === "en"
                ? "Premium subscribers"
                : "Premium foydalanuvchilar"}
          </p>
        </div>

        <div className="bg-surface border-border group relative overflow-hidden rounded-2xl border p-6 shadow-sm transition-all hover:border-amber-500/50 hover:shadow-[0_8px_30px_-12px_rgba(245,158,11,0.3)]">
          <div className="pointer-events-none absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.2),transparent_70%)] transition-transform group-hover:scale-110"></div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-foreground-secondary text-sm font-bold">
              {t.adminMrr || "Oylik Tushum (MRR)"}
            </h3>
            <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-500">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="text-foreground text-3xl font-extrabold">
            {mrr.toLocaleString()} <span className="text-foreground-secondary text-lg">UZS</span>
          </div>
          <p className="text-foreground-muted mt-2 text-xs font-medium">
            {lang === "ru"
              ? "Успешные платежи"
              : lang === "en"
                ? "Successful payments"
                : "Jami muvaffaqiyatli to'lovlar"}
          </p>
        </div>

        <div className="bg-surface border-border group relative overflow-hidden rounded-2xl border p-6 shadow-sm transition-all hover:border-purple-500/50 hover:shadow-[0_8px_30px_-12px_rgba(139,92,246,0.3)]">
          <div className="pointer-events-none absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.2),transparent_70%)] transition-transform group-hover:scale-110"></div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-foreground-secondary text-sm font-bold">
              {t.adminAiTokens || "Jami AI Tokenlar"}
            </h3>
            <div className="rounded-xl bg-purple-500/10 p-2.5 text-purple-500">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="text-foreground text-3xl font-extrabold">{totalTokens}</div>
          <p className="text-foreground-muted mt-2 text-xs font-medium">
            {lang === "ru"
              ? "Использование ИИ"
              : lang === "en"
                ? "AI system queries"
                : "AI tizimi ishlatilish soni"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Recent Users & Transactions */}
        <div className="space-y-6 lg:col-span-2">
          {/* Recent Users Card */}
          <div className="bg-surface border-border overflow-hidden rounded-2xl border shadow-sm">
            <div className="border-border bg-surface-elevated flex items-center justify-between border-b p-6">
              <h2 className="text-foreground flex items-center gap-2 text-lg font-bold">
                <UserPlus className="h-5 w-5 text-blue-500" />
                {t.adminRecentUsers || "Yangi Foydalanuvchilar"}
              </h2>
            </div>
            <div className="divide-border divide-y">
              {recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="hover:bg-surface-elevated/50 flex items-center justify-between p-4 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 font-bold text-blue-500">
                      {user.name?.[0] || user.email?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="text-foreground text-sm font-bold">
                        {user.name ||
                          (lang === "ru" ? "Пользователь без имени" : "Ismsiz Foydalanuvchi")}
                      </p>
                      <p className="text-foreground-secondary text-xs">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-bold tracking-wider uppercase ${
                        user.role === "ADMIN"
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-slate-500/10 text-slate-500"
                      }`}
                    >
                      {user.role}
                    </span>
                    <p className="text-foreground-muted mt-1 flex items-center justify-end gap-1 text-xs">
                      <Clock className="h-3 w-3" />{" "}
                      {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transactions Card */}
          <div className="bg-surface border-border overflow-hidden rounded-2xl border shadow-sm">
            <div className="border-border bg-surface-elevated flex items-center justify-between border-b p-6">
              <h2 className="text-foreground flex items-center gap-2 text-lg font-bold">
                <CreditCard className="h-5 w-5 text-emerald-500" />
                {lang === "ru"
                  ? "Последние платежи"
                  : lang === "en"
                    ? "Recent Transactions"
                    : "Oxirgi To'lovlar"}
              </h2>
            </div>
            <div className="p-4">
              {transactions.length === 0 ? (
                <div className="text-foreground-secondary py-8 text-center text-sm">
                  {lang === "ru"
                    ? "Платежей пока нет"
                    : lang === "en"
                      ? "No transactions yet"
                      : "Hali to'lovlar mavjud emas."}
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((tr) => (
                    <div
                      key={tr.id}
                      className="border-border flex items-center justify-between rounded-xl border p-3 transition-colors hover:border-emerald-500/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-500">
                          <Activity className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-foreground text-sm font-bold uppercase">
                            {tr.provider}
                          </p>
                          <p className="text-foreground-secondary text-xs">
                            ID: {tr.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-foreground text-sm font-extrabold">
                          +{tr.amount.toLocaleString()} UZS
                        </p>
                        <p className="text-xs font-medium text-emerald-500">
                          {lang === "ru" ? "Оплачено" : lang === "en" ? "Paid" : "To'landi"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Security & Logins */}
        <div className="space-y-6">
          <div className="bg-surface border-border flex h-full flex-col overflow-hidden rounded-2xl border shadow-sm">
            <div className="border-border bg-surface-elevated border-b p-6">
              <h2 className="text-foreground flex items-center gap-2 text-lg font-bold">
                <ShieldAlert className="h-5 w-5 text-rose-500" />
                {t.adminSecurityLogs || "Xavfsizlik Jurnali"}
              </h2>
              <p className="text-foreground-secondary mt-1 text-xs">
                {lang === "ru"
                  ? "Логи входа и активность пользователей."
                  : lang === "en"
                    ? "Security logs and user activity."
                    : "Xavfsizlik tizimi va foydalanuvchilar harakati (Loglar)."}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {securityLogs.length === 0 ? (
                <div className="text-foreground-secondary py-8 text-center text-sm">
                  {lang === "ru" ? "Нет данных" : "Ma'lumotlar yo'q."}
                </div>
              ) : (
                <div className="before:via-border relative space-y-4 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:-translate-x-px before:bg-gradient-to-b before:from-transparent before:to-transparent md:before:mx-auto md:before:translate-x-0">
                  {securityLogs.map((log) => (
                    <div
                      key={log.id}
                      className="group is-active relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse"
                    >
                      <div className="border-surface-elevated bg-surface text-foreground-secondary group-hover:border-primary group-hover:text-primary z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border shadow transition-colors md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                        <LogIn className="h-4 w-4" />
                      </div>
                      <div className="border-border bg-surface group-hover:border-primary/30 w-[calc(100%-4rem)] rounded-xl border p-3 shadow-sm transition-colors md:w-[calc(50%-2.5rem)]">
                        <div className="mb-1 flex items-center justify-between">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
                              log.eventType === "LOGIN"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-rose-500/10 text-rose-500"
                            }`}
                          >
                            {log.eventType}
                          </span>
                          <span className="text-foreground-muted text-[10px]">
                            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <div className="text-foreground-secondary mt-2 flex items-center gap-1.5 text-xs">
                          <Globe className="h-3 w-3" /> {log.ipAddress || "Noma'lum IP"}
                        </div>
                        <div className="text-foreground-muted mt-1 truncate text-[10px]">
                          Path: {log.path || "/"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
