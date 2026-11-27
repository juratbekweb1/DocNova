import React from "react";

/**
 * AcademicBackground3D
 * ------------------------------------------------------------------
 * DocNova (Documents + Nova Star) 3D Kosmik & Arxitekturaviy Fon:
 *  - Chuqur tungi obsidian-sapfir (#020617 -> #050b1e -> #020817).
 *  - Tepadan tushuvchi Nova stellar flare (porloq yulduz nuri va volumetrik sahna nuri).
 *  - Nozik kosmik starlight / zarrachalar maydoni (GPU radial-gradient).
 *  - Radial-masked 3D arxitektura to'ri (faqat markaziy nur doirasida ko'rinadi).
 *  - 3D elliptik fazoviy ufq yoylari (orbital rings) — chuqur fazo effekti.
 *  - 100% GPU accelerated, 60 FPS silliq skroll.
 */
export function AcademicBackground3D() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#f8fafc] transition-colors duration-500 md:fixed dark:bg-[#020617]"
    >
      {/* 1. Chuqur kosmik asos gradienti */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_45%,#f8fafc_100%)] dark:bg-[linear-gradient(180deg,#04091a_0%,#020617_50%,#01040d_100%)]" />

      {/* 2. Markaziy Nova Flare & Volumetrik sahna nuri (DocNova Identity) */}
      <div className="absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_80%_55%_at_50%_-10%,rgba(56,189,248,0.22)_0%,rgba(14,165,233,0.12)_35%,rgba(99,102,241,0.06)_60%,transparent_80%)] dark:bg-[radial-gradient(ellipse_85%_60%_at_50%_-12%,rgba(56,189,248,0.25)_0%,rgba(37,99,235,0.14)_40%,rgba(147,51,234,0.06)_65%,transparent_85%)]" />

      {/* 3. Nova yulduz nurlanishi (Top Center Star Flare) */}
      <div className="absolute top-[-80px] left-1/2 h-[160px] w-[500px] -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent blur-2xl dark:via-cyan-300/40" />
      <div className="absolute top-[-30px] left-1/2 h-[70px] w-[200px] -translate-x-1/2 rounded-full bg-cyan-300/40 blur-xl dark:bg-cyan-200/50" />

      {/* 4. Ikki yon tomondagi mayin muvozanat nurlari (Desktop) */}
      <div className="absolute inset-0 hidden bg-[radial-gradient(circle_at_12%_32%,rgba(56,189,248,0.08)_0%,transparent_50%),radial-gradient(circle_at_88%_28%,rgba(168,85,247,0.08)_0%,transparent_50%)] md:block dark:bg-[radial-gradient(circle_at_12%_32%,rgba(14,165,233,0.12)_0%,transparent_50%),radial-gradient(circle_at_88%_28%,rgba(147,51,234,0.1)_0%,transparent_50%)]" />

      {/* 5. Nafis kosmik mikroyulduzlar maydoni (Pure CSS, 0 JS) */}
      <div
        className="absolute inset-0 hidden opacity-40 md:block dark:opacity-60"
        style={{
          backgroundImage: `
            radial-gradient(1px 1px at 20px 30px, #38bdf8, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 40px 70px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(1.5px 1.5px at 90px 40px, #67e8f9, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 160px 120px, #a855f7, rgba(0,0,0,0)),
            radial-gradient(1.5px 1.5px at 230px 80px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 290px 150px, #38bdf8, rgba(0,0,0,0))
          `,
          backgroundSize: "320px 220px",
          maskImage: "radial-gradient(ellipse 90% 70% at 50% 25%, #000 20%, transparent 85%)",
          WebkitMaskImage: "radial-gradient(ellipse 90% 70% at 50% 25%, #000 20%, transparent 85%)",
        }}
      />

      {/* 6. Arxitektura 3D mikro-setkasi (Desktop) */}
      <div
        className="absolute inset-0 hidden bg-[linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:44px_44px] md:block dark:bg-[linear-gradient(to_right,rgba(148,163,184,0.065)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.065)_1px,transparent_1px)]"
        style={{
          maskImage: "radial-gradient(ellipse 75% 50% at 50% 15%, #000 15%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 75% 50% at 50% 15%, #000 15%, transparent 80%)",
        }}
      />

      {/* 7. 3D Fazoviy Ufq Orbital Yoylari (Perspective Rings) */}
      <div className="absolute inset-x-0 top-[-260px] hidden justify-center [perspective:1200px] md:flex">
        <div
          className="h-[540px] w-[1140px] shrink-0 [transform:rotateX(72deg)] rounded-full border border-sky-400/20 shadow-[0_0_50px_rgba(56,189,248,0.15)] dark:border-cyan-400/20"
          style={{
            maskImage: "linear-gradient(to bottom, transparent 15%, #000 85%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 15%, #000 85%, transparent 100%)",
          }}
        />
      </div>
      <div className="absolute inset-x-0 top-[-190px] hidden justify-center [perspective:1200px] md:flex">
        <div
          className="h-[460px] w-[840px] shrink-0 [transform:rotateX(72deg)] rounded-full border border-indigo-400/15 shadow-[0_0_35px_rgba(99,102,241,0.12)] dark:border-indigo-400/20"
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
