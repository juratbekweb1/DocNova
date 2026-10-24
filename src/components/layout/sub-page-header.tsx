"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

// Route title mapping for breadcrumbs
const SEGMENT_TITLES: Record<string, string> = {
  academic: "Akademik markaz",
  coursework: "Kurs ishi",
  "diplom-bmi": "Diplom ishi (BMI)",
  referat: "Mustaqil ish & Referat",
  "essay-builder": "Esse yozuvchi",
  presentation: "Prezentatsiya & Slaydlar",
  "exam-prep": "Imtihon & Biletlar",
  "mock-test": "Mock Test",
  english: "Ingliz tili (IELTS/CEFR)",
  russian: "Rus tili (TRKI)",
  turkish: "Turk tili (TÖMER)",
  tools: "Foydali vositalar",
  "ai-study-assistant": "AI Repetitor",
  "ai-writer": "AI Matn Yozuvchi",
  "cefr-test": "CEFR Test",
  "compress-pdf": "PDF Siqish",
  "cover-letter": "Cover Letter",
  "cv-analyzer": "CV Tahlil",
  "ielts-mock": "IELTS Mock",
  "interview-prep": "Intervyu Tayyorgarlik",
  "merge-pdf": "PDF Birlashtirish",
  "password-generator": "Parol Generatori",
  "pdf-to-word": "PDF dan Word ga",
  "qr-generator": "QR Kod Generator",
  "resume-builder": "Rezyume Yaratuvchi",
  "sat-practice": "SAT Mashg'ulot",
  "word-counter": "So'zlar Sanagichi",
  documents: "Hujjatlar",
  "cv-builder": "CV / Rezyume",
  features: "Imkoniyatlar",
  pricing: "Tariflar",
  telegram: "Telegram",
};

export interface SubPageHeaderProps {
  /** Optional custom back destination URL */
  fallbackBackUrl?: string;
  /** Optional title override */
  customTitle?: string;
  /** Additional container classes */
  className?: string;
  /** Whether to show full breadcrumbs trail (default: true) */
  showBreadcrumbs?: boolean;
}

export function SubPageHeader({
  fallbackBackUrl,
  customTitle,
  className,
  showBreadcrumbs = true,
}: SubPageHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Do not display on root or auth routes
  if (
    !pathname ||
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password"
  ) {
    return null;
  }

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  // Determine parent route for "Ortga"
  const parentUrl =
    fallbackBackUrl ||
    (segments.length > 1
      ? "/" + segments.slice(0, -1).join("/")
      : segments[0] === "coursework"
        ? "/academic"
        : segments[0] === "cv-builder"
          ? "/documents"
          : "/");

  const handleBack = () => {
    // If browser has history, go back; otherwise use explicit parentUrl
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(parentUrl);
    }
  };

  return (
    <div
      className={cn(
        "border-border/60 bg-surface/40 w-full border-b px-4 py-2.5 backdrop-blur-md transition-all sm:px-6 lg:px-8 print:hidden",
        className
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 text-xs">
        {/* Back Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleBack}
            className="group border-border/80 bg-background/80 hover:bg-surface-elevated hover:border-primary/50 text-foreground-secondary hover:text-foreground inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-semibold shadow-xs transition-all active:scale-95"
            title="Oldingi sahifaga qaytish"
          >
            <ArrowLeft className="text-primary h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Ortga</span>
          </button>
        </div>

        {/* Breadcrumb Trail */}
        {showBreadcrumbs && (
          <nav
            aria-label="Breadcrumb"
            className="no-scrollbar text-foreground-muted hidden items-center gap-1.5 overflow-x-auto whitespace-nowrap sm:flex"
          >
            <Link
              href="/"
              className="hover:text-foreground inline-flex items-center gap-1 transition-colors"
              title="Bosh sahifa"
            >
              <Home className="h-3 w-3" />
              <span>Bosh sahifa</span>
            </Link>

            {segments.map((seg, idx) => {
              const url = "/" + segments.slice(0, idx + 1).join("/");
              const isLast = idx === segments.length - 1;
              const title =
                isLast && customTitle ? customTitle : SEGMENT_TITLES[seg] || seg.replace(/-/g, " ");

              return (
                <React.Fragment key={url}>
                  <ChevronRight className="text-foreground-muted/60 h-3 w-3 shrink-0" />
                  {isLast ? (
                    <span className="text-foreground max-w-[200px] truncate font-semibold">
                      {title}
                    </span>
                  ) : (
                    <Link
                      href={url}
                      className="hover:text-foreground max-w-[150px] truncate transition-colors"
                    >
                      {title}
                    </Link>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
}
