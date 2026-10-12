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
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            {t.adminTitle || "Admin Boshqaruv Paneli"}
          </h1>
          <p className="text-foreground-secondary mt-1 font-medium">
            {t.adminSubtitle || "Saytning to'liq statistikasi, kirish-chiqishlar va moliyaviy holati."}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-sm font-bold shadow-sm">
          <Server className="w-4 h-4 animate-pulse" />
          {t.adminOnline || "Tizim faol (Online)"}
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm hover:shadow-[0_8px_30px_-12px_rgba(59,130,246,0.3)] hover:border-blue-500/50 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground-secondary">
              {t.adminTotalUsers || "Jami Foydalanuvchilar"}
            </h3>
            <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-500">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-foreground">{totalUsers}</div>
          <p className="text-xs text-foreground-muted mt-2 font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            {lang === "ru" ? "За всё время" : lang === "en" ? "All time" : "Barcha vaqt uchun"}
          </p>
        </div>

        <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm hover:shadow-[0_8px_30px_-12px_rgba(16,185,129,0.3)] hover:border-emerald-500/50 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground-secondary">
              {t.adminActiveSubs || "Faol Obunalar"}
            </h3>
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-500">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-foreground">{activeSubs}</div>
          <p className="text-xs text-foreground-muted mt-2 font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            {lang === "ru" ? "Премиум пользователи" : lang === "en" ? "Premium subscribers" : "Premium foydalanuvchilar"}
          </p>
        </div>

        <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm hover:shadow-[0_8px_30px_-12px_rgba(245,158,11,0.3)] hover:border-amber-500/50 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground-secondary">
              {t.adminMrr || "Oylik Tushum (MRR)"}
            </h3>
            <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-foreground">
            {mrr.toLocaleString()} <span className="text-lg text-foreground-secondary">UZS</span>
          </div>
          <p className="text-xs text-foreground-muted mt-2 font-medium">
            {lang === "ru" ? "Успешные платежи" : lang === "en" ? "Successful payments" : "Jami muvaffaqiyatli to'lovlar"}
          </p>
        </div>

        <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm hover:shadow-[0_8px_30px_-12px_rgba(139,92,246,0.3)] hover:border-purple-500/50 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground-secondary">
              {t.adminAiTokens || "Jami AI Tokenlar"}
            </h3>
            <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-500">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-foreground">{totalTokens}</div>
          <p className="text-xs text-foreground-muted mt-2 font-medium">
            {lang === "ru" ? "Использование ИИ" : lang === "en" ? "AI system queries" : "AI tizimi ishlatilish soni"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Users & Transactions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Users Card */}
          <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border bg-surface-elevated flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-500" />
                {t.adminRecentUsers || "Yangi Foydalanuvchilar"}
              </h2>
            </div>
            <div className="divide-y divide-border">
              {recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="p-4 hover:bg-surface-elevated/50 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                      {user.name?.[0] || user.email?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {user.name || (lang === "ru" ? "Пользователь без имени" : "Ismsiz Foydalanuvchi")}
                      </p>
                      <p className="text-xs text-foreground-secondary">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider ${
                        user.role === "ADMIN"
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-slate-500/10 text-slate-500"
                      }`}
                    >
                      {user.role}
                    </span>
                    <p className="text-xs text-foreground-muted mt-1 flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3" />{" "}
                      {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transactions Card */}
          <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border bg-surface-elevated flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-500" />
                {lang === "ru" ? "Последние платежи" : lang === "en" ? "Recent Transactions" : "Oxirgi To'lovlar"}
              </h2>
            </div>
            <div className="p-4">
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-foreground-secondary text-sm">
                  {lang === "ru" ? "Платежей пока нет" : lang === "en" ? "No transactions yet" : "Hali to'lovlar mavjud emas."}
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((tr) => (
                    <div
                      key={tr.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-emerald-500/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                          <Activity className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground uppercase">{tr.provider}</p>
                          <p className="text-xs text-foreground-secondary">ID: {tr.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-extrabold text-foreground">
                          +{tr.amount.toLocaleString()} UZS
                        </p>
                        <p className="text-xs text-emerald-500 font-medium">
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
          <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden h-full flex flex-col">
            <div className="p-6 border-b border-border bg-surface-elevated">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                {t.adminSecurityLogs || "Xavfsizlik Jurnali"}
              </h2>
              <p className="text-xs text-foreground-secondary mt-1">
                {lang === "ru" ? "Логи входа и активность пользователей." : lang === "en" ? "Security logs and user activity." : "Xavfsizlik tizimi va foydalanuvchilar harakati (Loglar)."}
              </p>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              {securityLogs.length === 0 ? (
                <div className="text-center py-8 text-foreground-secondary text-sm">
                  {lang === "ru" ? "Нет данных" : "Ma'lumotlar yo'q."}
                </div>
              ) : (
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                  {securityLogs.map((log) => (
                    <div
                      key={log.id}
                      className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-surface-elevated bg-surface text-foreground-secondary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 group-hover:border-primary group-hover:text-primary transition-colors z-10">
                        <LogIn className="w-4 h-4" />
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-3 rounded-xl border border-border bg-surface shadow-sm group-hover:border-primary/30 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              log.eventType === "LOGIN"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-rose-500/10 text-rose-500"
                            }`}
                          >
                            {log.eventType}
                          </span>
                          <span className="text-[10px] text-foreground-muted">
                            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <div className="text-xs text-foreground-secondary flex items-center gap-1.5 mt-2">
                          <Globe className="w-3 h-3" /> {log.ipAddress || "Noma'lum IP"}
                        </div>
                        <div className="text-[10px] text-foreground-muted truncate mt-1">
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
