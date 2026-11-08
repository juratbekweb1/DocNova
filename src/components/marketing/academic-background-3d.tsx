import React from "react";
import {
  GraduationCap,
  BookOpen,
  FileText,
  Sigma,
  PenTool,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

/**
 * AcademicBackground3D
 * ------------------------------------------------------------------
 * Talabalar va akademik ishlar platformasi uchun sokin, kamtarona 3D fon.
 *  - Chuqur "tungi kutubxona" ko'k-indigo gradienti (dark) / iliq qog'oz tusi (light)
 *  - Perspektivada yotgan "katakli daftar" (graph paper) 3D poli
 *  - Chetlarda sekin suzuvchi 3D akademik obyektlar (kitob, shapka, hujjat, formula...)
 *
 * Unumdorlik: hech qanday `filter: blur` yoki `backdrop-filter` ishlatilmaydi.
 * Animatsiyalar faqat `transform` orqali (GPU compositor), mobil va
 * `prefers-reduced-motion` rejimida o'chiriladi.
 */

type FloatingItem = {
  Icon: LucideIcon;
  position: string;
  size: string;
  iconSize: string;
  rx: string;
  ry: string;
  delay: string;
  duration: string;
  tint: string;
};

const FLOATING_ITEMS: FloatingItem[] = [
  {
    Icon: GraduationCap,
    position: "top-[16%] left-[5%]",
    size: "h-20 w-20",
    iconSize: "h-9 w-9",
    rx: "18deg",
    ry: "-22deg",
    delay: "0s",
    duration: "11s",
    tint: "text-sky-500 dark:text-sky-300",
  },
  {
    Icon: BookOpen,
    position: "top-[24%] right-[6%]",
    size: "h-24 w-24",
    iconSize: "h-10 w-10",
    rx: "14deg",
    ry: "24deg",
    delay: "-3s",
    duration: "13s",
    tint: "text-indigo-500 dark:text-indigo-300",
  },
  {
    Icon: Sigma,
    position: "top-[50%] left-[3%]",
    size: "h-16 w-16",
    iconSize: "h-7 w-7",
    rx: "-12deg",
    ry: "20deg",
    delay: "-6s",
    duration: "12s",
    tint: "text-teal-500 dark:text-teal-300",
  },
  {
    Icon: FileText,
    position: "top-[60%] right-[4%]",
    size: "h-20 w-20",
    iconSize: "h-9 w-9",
    rx: "16deg",
    ry: "-18deg",
    delay: "-2s",
    duration: "14s",
    tint: "text-cyan-500 dark:text-cyan-300",
  },
  {
    Icon: BarChart3,
    position: "top-[80%] left-[9%]",
    size: "h-16 w-16",
    iconSize: "h-7 w-7",
    rx: "-14deg",
    ry: "-20deg",
    delay: "-8s",
    duration: "12s",
    tint: "text-violet-500 dark:text-violet-300",
  },
  {
    Icon: PenTool,
    position: "top-[84%] right-[11%]",
    size: "h-14 w-14",
    iconSize: "h-6 w-6",
    rx: "20deg",
    ry: "16deg",
    delay: "-5s",
    duration: "10s",
    tint: "text-amber-500 dark:text-amber-300",
  },
];

export function AcademicBackground3D() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[linear-gradient(180deg,#f7f8fc_0%,#eef2fb_55%,#e8edf9_100%)] transition-colors duration-300 dark:bg-[linear-gradient(180deg,#030817_0%,#050d24_45%,#080d2b_100%)]"
    >
      {/* 1. Yumshoq yorug'lik dog'lari — "stol chirog'i" effekti (blur'siz, faqat radial-gradient) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_0%,rgba(99,102,241,0.10)_0%,transparent_70%),radial-gradient(ellipse_40%_35%_at_12%_30%,rgba(14,165,233,0.08)_0%,transparent_70%),radial-gradient(ellipse_40%_35%_at_88%_40%,rgba(20,184,166,0.07)_0%,transparent_70%)] dark:bg-[radial-gradient(ellipse_70%_45%_at_50%_0%,rgba(99,102,241,0.20)_0%,transparent_70%),radial-gradient(ellipse_40%_35%_at_12%_30%,rgba(14,165,233,0.12)_0%,transparent_70%),radial-gradient(ellipse_40%_35%_at_88%_40%,rgba(20,184,166,0.10)_0%,transparent_70%)]" />

      {/* 2. Perspektivadagi 3D "katakli daftar" poli */}
      <div className="absolute inset-x-0 bottom-0 h-[58vh] [perspective:900px]">
        <div className="acad-grid-floor absolute bottom-0 left-[-50%] h-[140%] w-[200%] origin-bottom bg-[linear-gradient(rgba(79,70,229,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.12)_1px,transparent_1px)] [background-size:56px_56px] [transform:rotateX(64deg)] dark:bg-[linear-gradient(rgba(56,189,248,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.16)_1px,transparent_1px)]" />
        {/* Ufq chizig'idagi yengil nur */}
        <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(ellipse_60%_100%_at_50%_100%,rgba(99,102,241,0.10)_0%,transparent_70%)] dark:bg-[radial-gradient(ellipse_60%_100%_at_50%_100%,rgba(56,189,248,0.14)_0%,transparent_70%)]" />
      </div>

      {/* 3. Chetlarda suzuvchi 3D akademik obyektlar (faqat desktop) */}
      <div className="absolute inset-0 hidden [perspective:1000px] md:block">
        {FLOATING_ITEMS.map(({ Icon, position, size, iconSize, rx, ry, delay, duration, tint }) => (
          <div
            key={position}
            className={`acad-float absolute ${position} ${size}`}
            style={
              {
                "--rx": rx,
                "--ry": ry,
                animationDelay: delay,
                animationDuration: duration,
              } as React.CSSProperties
            }
          >
            {/* 3D plitka: old yuz + qalinlik (pastki qirra) */}
            <div className="relative h-full w-full [transform-style:preserve-3d]">
              <div className="absolute inset-0 translate-y-[6px] rounded-2xl bg-indigo-200/60 [transform:translateZ(-8px)] dark:bg-indigo-950/70" />
              <div
                className={`absolute inset-0 flex items-center justify-center rounded-2xl border border-white/70 bg-gradient-to-br from-white/90 to-slate-100/70 shadow-[0_18px_40px_-18px_rgba(79,70,229,0.35)] dark:border-white/10 dark:from-[#111a3a]/90 dark:to-[#0a1129]/80 dark:shadow-[0_18px_40px_-18px_rgba(0,0,0,0.8)] ${tint}`}
              >
                <Icon className={`${iconSize} opacity-80`} strokeWidth={1.5} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 4. Pastki va yuqori qirralarda kontent o'qilishi uchun yumshoq vinetka */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#f7f8fc] to-transparent dark:from-[#030817]" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#e8edf9] to-transparent dark:from-[#080d2b]" />
    </div>
  );
}
