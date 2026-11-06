"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { GraduationCap, ArrowRight } from "lucide-react";

export function StudentFeaturesSection() {
  const cards = [
    {
      title: "Kurs ishi",
      description: "Mavzu bo‘yicha to‘liq kurs ish tayyorlang",
      href: "/academic/coursework",
      imageSrc: "/images/student-coursework-3d.png",
      alt: "Kurs ishi 3D kitob",
      theme: {
        border: "border-sky-500/35 hover:border-cyan-400/80",
        bgHover: "dark:hover:bg-[#071c33] hover:bg-sky-50/80",
        glow: "hover:shadow-[0_20px_50px_rgba(14,165,233,0.35),0_0_25px_rgba(6,182,212,0.2)]",
        titleHover: "group-hover:text-cyan-300",
        btnGrad: "from-sky-500 to-blue-600 shadow-[0_0_20px_rgba(14,165,233,0.5)]",
      },
    },
    {
      title: "Mustaqil ish",
      description: "Sifatli va aniq mustaqil ish",
      href: "/academic/referat",
      imageSrc: "/images/student-independent-3d-purple.png",
      alt: "Mustaqil ish 3D hujjat",
      theme: {
        border: "border-purple-500/35 hover:border-fuchsia-400/80",
        bgHover: "dark:hover:bg-[#1f0e38] hover:bg-purple-50/80",
        glow: "hover:shadow-[0_20px_50px_rgba(192,38,211,0.35),0_0_25px_rgba(168,85,247,0.2)]",
        titleHover: "group-hover:text-fuchsia-300",
        btnGrad:
          "from-purple-500 via-fuchsia-500 to-pink-600 shadow-[0_0_20px_rgba(192,38,211,0.5)]",
      },
    },
    {
      title: "Referat",
      description: "Istalgan mavzuda referat yarating",
      href: "/academic/referat",
      imageSrc: "/images/student-referat-3d-green.png",
      alt: "Referat 3D qog'ozlar",
      theme: {
        border: "border-emerald-500/35 hover:border-emerald-400/80",
        bgHover: "dark:hover:bg-[#072418] hover:bg-emerald-50/80",
        glow: "hover:shadow-[0_20px_50px_rgba(16,185,129,0.35),0_0_25px_rgba(16,185,129,0.2)]",
        titleHover: "group-hover:text-emerald-300",
        btnGrad: "from-emerald-500 to-teal-600 shadow-[0_0_20px_rgba(16,185,129,0.5)]",
      },
    },
    {
      title: "Presentation",
      description: "Zamonaviy taqdimot loyihalari",
      href: "/academic/presentation",
      imageSrc: "/images/student-presentation-3d-amber.png",
      alt: "Presentation 3D doska taqdimot",
      theme: {
        border: "border-amber-500/35 hover:border-amber-400/80",
        bgHover: "dark:hover:bg-[#261505] hover:bg-amber-50/80",
        glow: "hover:shadow-[0_20px_50px_rgba(245,158,11,0.35),0_0_25px_rgba(245,158,11,0.2)]",
        titleHover: "group-hover:text-amber-300",
        btnGrad: "from-amber-500 to-orange-600 shadow-[0_0_20px_rgba(245,158,11,0.5)]",
      },
    },
  ];

  return (
    <section className="relative mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[1fr_2.6fr] lg:items-center xl:grid-cols-[1fr_2.8fr]">
        {/* LEFT COLUMN: Section Title & Call to Action */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-start"
        >
          {/* Section Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-50 px-4 py-1.5 text-xs font-semibold text-sky-700 shadow-sm backdrop-blur-md dark:border-sky-500/35 dark:bg-sky-950/50 dark:text-sky-300">
            <GraduationCap className="h-4 w-4 text-cyan-400" />
            <span>Talabalar uchun</span>
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
          </div>

          <h2 className="mt-5 text-3xl leading-[1.15] font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl dark:text-white">
            O‘quv jarayonini{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
              yengillashtiring!
            </span>
          </h2>

          <p className="mt-4 max-w-md text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
            Endi kurs ishi, mustaqil ish, referat va boshqa akademik ishlarni osongina tayyorlang.
          </p>

          <Link
            href="/academic"
            className="group mt-8 inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-sky-500 via-sky-400 to-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_0_25px_rgba(14,165,233,0.45)] transition-all hover:scale-105 hover:shadow-[0_0_35px_rgba(14,165,233,0.7)] active:scale-95"
          >
            <span>Barcha imkoniyatlar</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>

        {/* RIGHT COLUMN: 4 Multicolored Real 3D Cards & Paper Airplane */}
        <div className="relative w-full">
          {/* 3D Paper Airplane floating at top-right */}
          <div className="pointer-events-none absolute -top-10 right-2 z-20 sm:-top-14 sm:right-0">
            <motion.div
              animate={{
                y: [0, -8, 0],
                x: [0, 4, 0],
                rotate: [0, 3, 0],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative"
            >
              <svg
                width="54"
                height="54"
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-[0_10px_25px_rgba(56,189,248,0.7)] sm:h-16 sm:w-16"
              >
                <path
                  d="M10 32 L54 12 L38 52 L28 38 L10 32 Z"
                  fill="url(#planeMultiGrad1)"
                  stroke="#7dd3fc"
                  strokeWidth="1.2"
                />
                <path d="M54 12 L28 38 L32 46 L38 52 Z" fill="url(#planeMultiGrad2)" />
                <defs>
                  <linearGradient
                    id="planeMultiGrad1"
                    x1="10"
                    y1="12"
                    x2="54"
                    y2="52"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#38bdf8" />
                    <stop offset="1" stopColor="#1d4ed8" />
                  </linearGradient>
                  <linearGradient
                    id="planeMultiGrad2"
                    x1="28"
                    y1="12"
                    x2="54"
                    y2="52"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#60a5fa" />
                    <stop offset="1" stopColor="#1e40af" />
                  </linearGradient>
                </defs>
              </svg>
              {/* Dashed flight trail */}
              <svg
                width="70"
                height="40"
                viewBox="0 0 80 45"
                fill="none"
                className="pointer-events-none absolute -bottom-5 -left-12 hidden opacity-60 sm:block"
              >
                <path
                  d="M5 38 Q 40 32 75 8"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  fill="none"
                />
              </svg>
            </motion.div>
          </div>

          {/* Cards Grid: Perfectly responsive across all screen sizes with individual 3D themes */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {cards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative flex"
              >
                <Link
                  href={card.href}
                  className={`flex h-full w-full flex-col justify-between rounded-[24px] border ${card.theme.border} bg-white/95 p-4 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 sm:p-5 dark:bg-[#070e24]/90 dark:shadow-[0_15px_35px_rgba(0,0,0,0.5)] ${card.theme.bgHover} ${card.theme.glow}`}
                >
                  {/* Top: Individual Multicolored 3D Render Image */}
                  <div className="flex h-24 items-center justify-center">
                    <div className="relative h-20 w-24 transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-115">
                      <Image
                        src={card.imageSrc}
                        alt={card.alt}
                        fill
                        sizes="(max-width: 640px) 120px, 96px"
                        className="object-contain"
                      />
                    </div>
                  </div>

                  {/* Middle: Title & Description */}
                  <div className="mt-4 flex-1">
                    <h3
                      className={`text-lg font-bold text-slate-900 transition-colors dark:text-white ${card.theme.titleHover}`}
                    >
                      {card.title}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed font-normal text-slate-600 sm:text-sm dark:text-slate-300">
                      {card.description}
                    </p>
                  </div>

                  {/* Bottom: Action Circle Button in Matching Theme Gradient */}
                  <div className="mt-5 flex justify-end">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r ${card.theme.btnGrad} text-white shadow-md transition-all group-hover:translate-x-0.5 group-hover:scale-115`}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
