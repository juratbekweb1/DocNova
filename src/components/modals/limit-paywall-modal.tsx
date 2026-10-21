"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Crown, Lock, Sparkles, X, CheckCircle2, ArrowRight } from "lucide-react";
import { useSession } from "next-auth/react";
import type { SectionLimitStat } from "@/lib/limits";

export interface PaywallEventDetail {
  message?: string;
  feature?: string;
}

export function triggerPaywallModal(detail?: PaywallEventDetail) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("docnova:limit-exhausted", { detail }));
  }
}

function mapUrlToSectionId(url: string): string | null {
  if (
    url.includes("/api/generate-coursework") ||
    url.includes("/api/academic/coursework") ||
    url.includes("/api/academic/diplom-bmi") ||
    url.includes("/api/ai/academic")
  ) {
    return "coursework";
  }
  if (url.includes("/api/academic/presentation") || url.includes("/api/ai/presentation")) {
    return "presentation";
  }
  if (url.includes("/api/ai/cv-analyzer") || url.includes("/api/ai/ats-analyzer")) {
    return "resume_analysis";
  }
  if (url.includes("/api/ai/writer")) {
    return "rewrite";
  }
  if (url.includes("/api/ai/cover-letter")) {
    return "document_generation";
  }
  if (url.includes("/api/ai/language-test") || url.includes("/api/mock-test")) {
    return "mock_test";
  }
  return null;
}

export function LimitPaywallModal() {
  const { status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState(
    "Limitingiz tugadi! Generatsiyani davom ettirish uchun iltimos obuna sotib oling."
  );
  const sectionsRef = useRef<SectionLimitStat[]>([]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/user/usage")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.sections && Array.isArray(data.sections)) {
          sectionsRef.current = data.sections;
        }
      })
      .catch(() => {});
  }, [status]);

  useEffect(() => {
    const handleCustomEvent = (e: Event) => {
      const custom = e as CustomEvent<PaywallEventDetail>;
      if (custom.detail?.message) {
        setMessage(custom.detail.message);
      } else {
        setMessage(
          "Limitingiz tugadi! Generatsiyani davom ettirish uchun iltimos obuna sotib oling."
        );
      }
      setIsOpen(true);
    };

    window.addEventListener("docnova:limit-exhausted", handleCustomEvent);

    // Intercept generation API calls for frontend pre-check & backend 403/requireUpgrade detection
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
      const reqInfo = args[0];
      const reqInit = args[1];
      const url =
        typeof reqInfo === "string"
          ? reqInfo
          : reqInfo instanceof URL
            ? reqInfo.toString()
            : reqInfo?.url || "";
      const method = (reqInit?.method || "GET").toUpperCase();

      if (method === "POST") {
        const sectionId = mapUrlToSectionId(url);
        if (sectionId && sectionsRef.current.length > 0) {
          const stat = sectionsRef.current.find((s) => s.id === sectionId);
          if (stat && !stat.unlimited && stat.remaining <= 0) {
            const msg =
              "Limitingiz tugadi! Generatsiyani davom ettirish uchun iltimos obuna sotib oling.";
            setMessage(msg);
            setIsOpen(true);
            return new Response(
              JSON.stringify({
                error: "Limit reached",
                requireUpgrade: true,
                upgradeMessage: msg,
                code: "LIMIT_EXCEEDED",
              }),
              {
                status: 403,
                headers: { "Content-Type": "application/json" },
              }
            );
          }
        }
      }

      const response = await originalFetch.apply(this, args);

      if (
        method === "POST" &&
        (response.status === 403 || response.status === 429) &&
        url.includes("/api/")
      ) {
        try {
          const cloned = response.clone();
          const data = await cloned.json();
          if (
            data?.requireUpgrade ||
            data?.code === "LIMIT_EXCEEDED" ||
            data?.error === "Limit reached"
          ) {
            setMessage(
              "Limitingiz tugadi! Generatsiyani davom ettirish uchun iltimos obuna sotib oling."
            );
            setIsOpen(true);
          }
        } catch {
          // ignore non-json
        }
      }

      return response;
    };

    return () => {
      window.removeEventListener("docnova:limit-exhausted", handleCustomEvent);
      window.fetch = originalFetch;
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="border-border bg-surface relative w-full max-w-md overflow-hidden rounded-3xl border p-6 shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-foreground-secondary hover:bg-surface-elevated hover:text-foreground absolute top-4 right-4 rounded-full p-2 transition-colors"
          aria-label="Yopish"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-lg">
            <Lock className="h-8 w-8" />
          </div>

          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400">
            <Sparkles className="h-3.5 w-3.5" />
            DocNova Pro & Premium
          </span>

          <h3 className="text-foreground text-xl font-extrabold sm:text-2xl">Limitingiz tugadi!</h3>

          <p className="text-foreground-secondary mt-2.5 text-sm leading-relaxed">{message}</p>

          <div className="border-border bg-surface-elevated/60 my-6 w-full space-y-2.5 rounded-2xl border p-4 text-left text-xs">
            <div className="text-foreground flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>Kurs ishi, Referat, BMI va Slaydlar (100 tagacha/oy)</span>
            </div>
            <div className="text-foreground flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>CV, ATS Tahlili va AI Yaratishlar (kengaytirilgan kvota)</span>
            </div>
            <div className="text-foreground flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>Word (.doc) va PDF formatda cheklovsiz yuklab olish</span>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2.5">
            <Link
              href="/checkout"
              onClick={() => setIsOpen(false)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold shadow-lg transition-all"
            >
              <Crown className="h-4 w-4" />
              <span>Obuna bo&apos;lish</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/dashboard/billing"
              onClick={() => setIsOpen(false)}
              className="border-border bg-surface-elevated text-foreground hover:border-primary/40 flex w-full items-center justify-center gap-2 rounded-xl border px-5 py-3 text-xs font-semibold transition-all"
            >
              <span>Tarifni oshirish</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
