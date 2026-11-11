import React from "react";

/**
 * AcademicBackground3D
 * ------------------------------------------------------------------
 * Minimalist, "skromni" (kamtarona va nafis) 3D atmosferali fon:
 *  - Hech qanday suzuvchi belgilar yoki keskin to'rlar yo'q.
 *  - Chuqur tungi sapfir-indigo (#040918 -> #071026 -> #030712) asosiy rang.
 *  - Tepadan tushuvchi yumshoq 3D sahna nuri (volumetric spotlight) va
 *    faqat nur tushgan joyda ko'rinib, chetlarga qarab 100% yo'qolib ketuvchi
 *    nafis mikro-setka (radial-masked architectural grid).
 *  - Yengil 3D perspektivadagi elliptik yorug'lik yoylar (orbital rings) —
 *    matnga xalaqit bermaydigan chuqurlik effekti.
 *  - 0 ta blur filter (100% GPU radial/conic-gradient, 60 FPS silliq).
 */
export function AcademicBackground3D() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#f8fafc] transition-colors duration-300 md:fixed dark:bg-[#030712]"
    >
      {/* 1. Asosiy chuqur 3D fon gradienti (Tungi sapfir / Kunduzgi toza oq-moviy) */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_45%,#f8fafc_100%)] dark:bg-[linear-gradient(180deg,#050c1f_0%,#030816_50%,#020611_100%)]" />

      {/* 2. Yuqori markaziy 3D hajmli sahna nuri (Volumetric Overhead Spotlight) */}
      <div className="absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_85%_50%_at_50%_-8%,rgba(14,165,233,0.14)_0%,rgba(59,130,246,0.06)_45%,transparent_80%)] md:inset-0 md:h-auto dark:bg-[radial-gradient(ellipse_85%_50%_at_50%_-8%,rgba(56,189,248,0.18)_0%,rgba(37,99,235,0.09)_42%,rgba(15,23,42,0)_80%)]" />

      {/* 3. Ikki yon tomonda juda mayin, ko'zga tashlanmaydigan muvozanat nuri (Desktop only) */}
      <div className="absolute inset-0 hidden bg-[radial-gradient(circle_at_15%_35%,rgba(56,189,248,0.05)_0%,transparent_45%),radial-gradient(circle_at_85%_30%,rgba(99,102,241,0.05)_0%,transparent_45%)] md:block dark:bg-[radial-gradient(circle_at_15%_35%,rgba(14,165,233,0.07)_0%,transparent_48%),radial-gradient(circle_at_85%_30%,rgba(99,102,241,0.07)_0%,transparent_48%)]" />

      {/* 4. Faqat tepa nur ostida ko'rinuvchi nafis arxitektura mikro-setkasi (Desktop only - avoids full-screen alpha mask compositing on mobile scroll) */}
      <div
        className="absolute inset-0 hidden bg-[linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:48px_48px] md:block dark:bg-[linear-gradient(to_right,rgba(148,163,184,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.055)_1px,transparent_1px)]"
        style={{
          maskImage: "radial-gradient(ellipse 70% 45% at 50% 12%, #000 10%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 45% at 50% 12%, #000 10%, transparent 75%)",
        }}
      />

      {/* 5. Minimalist 3D fazoviy ufq yoylari (Subtle 3D Perspective Rings - Desktop only) */}
      <div className="absolute inset-x-0 top-[-260px] hidden justify-center [perspective:1200px] md:flex">
        <div
          className="h-[520px] w-[1100px] shrink-0 [transform:rotateX(72deg)] rounded-full border border-sky-500/15 dark:border-sky-400/15"
          style={{
            maskImage: "linear-gradient(to bottom, transparent 15%, #000 85%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 15%, #000 85%, transparent 100%)",
          }}
        />
      </div>
      <div className="absolute inset-x-0 top-[-190px] hidden justify-center [perspective:1200px] md:flex">
        <div
          className="h-[460px] w-[820px] shrink-0 [transform:rotateX(72deg)] rounded-full border border-indigo-500/10 dark:border-cyan-300/10"
          style={{
            maskImage: "linear-gradient(to bottom, transparent 20%, #000 85%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 20%, #000 85%, transparent 100%)",
          }}
        />
      </div>
    </div>
  );
}
