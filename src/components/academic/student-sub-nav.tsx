"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  Award,
  FileText,
  CheckSquare,
  Globe2,
  ChevronLeft,
  Sparkles,
  Presentation,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentSubNavProps {
  activeTab?: "coursework" | "diplom-bmi" | "referat" | "presentation" | "exam-prep" | "mock-test";
  className?: string;
}

export interface StudentSectionItem {
  id: "coursework" | "diplom-bmi" | "referat" | "presentation" | "exam-prep" | "mock-test";
  title: string;
  shortTitle: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
  isFeatured?: boolean;
}

export const STUDENT_SECTIONS: StudentSectionItem[] = [
  {
    id: "coursework",
    title: "Kurs ishi yordamchisi",
    shortTitle: "Kurs ishi",
    href: "/academic/coursework",
    icon: GraduationCap,
    badge: "15-30 bet",
  },
  {
    id: "diplom-bmi",
    title: "Diplom ishi va BMI",
    shortTitle: "Diplom (BMI)",
    href: "/academic/diplom-bmi",
    icon: Award,
    badge: "BMI & Magistr",
  },
  {
    id: "presentation",
    title: "Prezentatsiya va Slaydlar",
    shortTitle: "Slaydlar (PPTX)",
    href: "/academic/presentation",
    icon: Presentation,
    badge: "PPTX & AI",
  },
  {
    id: "referat",
    title: "Mustaqil ish va Referat",
    shortTitle: "Referat & Mustaqil",
    href: "/academic/referat",
    icon: FileText,
    badge: "Tezkor",
  },
  {
    id: "exam-prep",
    title: "Test va Imtihonlarga tayyorgarlik",
    shortTitle: "Imtihon & Test",
    href: "/academic/exam-prep",
    icon: CheckSquare,
    badge: "Biletlar & MCQ",
  },
  {
    id: "mock-test",
    title: "Mock Test (Chet tillari)",
    shortTitle: "Mock Test",
    href: "/academic/mock-test",
    icon: Globe2,
    badge: "IELTS • TRKI • TÖMER",
    isFeatured: true,
  },
];

export function StudentSubNav({ activeTab, className }: StudentSubNavProps) {
  const pathname = usePathname();

  const currentTab =
    activeTab ||
    (pathname.includes("/academic/presentation")
      ? "presentation"
      : pathname.includes("/academic/mock-test")
        ? "mock-test"
        : pathname.includes("/academic/diplom-bmi")
          ? "diplom-bmi"
          : pathname.includes("/academic/referat") || pathname.includes("/academic/essay-builder")
            ? "referat"
            : pathname.includes("/academic/exam-prep")
              ? "exam-prep"
              : pathname.includes("/academic/coursework") || pathname === "/coursework"
                ? "coursework"
                : undefined);

  return (
    <div
      className={cn(
        "border-border/80 bg-background/80 sticky top-16 z-30 w-full border-b backdrop-blur-xl transition-all",
        className
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
        {/* Left: Quick Back to Hub */}
        <Link
          href="/academic"
          className="group text-foreground-secondary hover:bg-surface-elevated hover:text-foreground flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all"
        >
          <ChevronLeft className="text-primary h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span className="hidden sm:inline">Talabalar markazi</span>
          <span className="sm:hidden">Markaz</span>
        </Link>

        {/* Center/Right: 5 Sections Navigation Pills */}
        <nav
          className="no-scrollbar flex flex-1 items-center gap-1.5 overflow-x-auto py-0.5"
          aria-label="Student Navigation"
        >
          {STUDENT_SECTIONS.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "relative flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium whitespace-nowrap transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-primary/25 font-semibold shadow-md"
                    : "text-foreground-secondary hover:text-foreground hover:bg-surface-elevated hover:border-border/60 border border-transparent"
                )}
              >
                <Icon
                  className={cn(
                    "h-3.5 w-3.5",
                    isActive ? "text-primary-foreground" : "text-primary"
                  )}
                />
                <span>{item.shortTitle}</span>

                {item.isFeatured ? (
                  <span
                    className={cn(
                      "py-0.2 hidden items-center gap-1 rounded-full px-1.5 text-[10px] font-bold tracking-wider uppercase md:inline-flex",
                      isActive
                        ? "bg-white/20 text-white"
                        : "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                    )}
                  >
                    <Sparkles className="h-2.5 w-2.5" />3 ta til
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
