"use client";

import React from "react";
import { Zap, ShieldCheck, Gem, Laptop, Headphones } from "lucide-react";

export function HeroFeaturesBar() {
  const features = [
    {
      title: "Tezkor generatsiya",
      description: "Bir necha soniyada natija",
      icon: Zap,
      gradient: "from-cyan-400 to-blue-500",
      glow: "group-hover:shadow-[0_10px_30px_rgba(6,182,212,0.4)]",
      iconColor: "text-cyan-400",
    },
    {
      title: "Xavfsiz va ishonchli",
      description: "Sizning ma'lumotlaringiz himoyada",
      icon: ShieldCheck,
      gradient: "from-emerald-400 to-teal-500",
      glow: "group-hover:shadow-[0_10px_30px_rgba(16,185,129,0.4)]",
      iconColor: "text-emerald-400",
    },
    {
      title: "Professional sifat",
      description: "Eng yuqori OTM standartlari",
      icon: Gem,
      gradient: "from-blue-400 to-indigo-500",
      glow: "group-hover:shadow-[0_10px_30px_rgba(59,130,246,0.4)]",
      iconColor: "text-blue-400",
    },
    {
      title: "Har qanday qurilmada",
      description: "Kompyuter va mobil uchun",
      icon: Laptop,
      gradient: "from-purple-400 to-fuchsia-500",
      glow: "group-hover:shadow-[0_10px_30px_rgba(168,85,247,0.4)]",
      iconColor: "text-purple-400",
    },
    {
      title: "24/7 AI Yordam",
      description: "Har doim yoningizda",
      icon: Headphones,
      gradient: "from-amber-400 to-orange-500",
      glow: "group-hover:shadow-[0_10px_30px_rgba(245,158,11,0.4)]",
      iconColor: "text-amber-400",
    },
  ];

  return (
    <section className="relative mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="relative overflow-hidden rounded-[30px] border border-slate-200/90 bg-white/95 p-6 shadow-xl backdrop-blur-xl transition-all duration-300 sm:p-8 dark:border-sky-500/25 dark:bg-[#070e24]/95 dark:shadow-[0_20px_45px_rgba(0,0,0,0.6)]">
        {/* Interior ambient neon reflection & specular beam */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-sky-500/5 to-indigo-500/5 dark:from-cyan-500/10 dark:via-sky-500/5 dark:to-blue-500/10" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

        <div className="relative grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 lg:gap-0 lg:divide-x lg:divide-slate-200 dark:lg:divide-slate-800/80">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className={`group flex transform-gpu flex-col items-center text-center transition-all duration-300 md:hover:-translate-y-1.5 ${
                  idx === 0 ? "lg:pr-6" : idx === features.length - 1 ? "lg:pl-6" : "lg:px-6"
                }`}
              >
                {/* 3D Levitating Icon container with metallic shadow */}
                <div
                  className={`mb-3.5 flex h-13 w-13 items-center justify-center rounded-2xl border border-slate-200/80 bg-slate-50/80 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3 dark:border-slate-800/80 dark:bg-[#0b1633] ${item.glow}`}
                >
                  <Icon
                    className={`h-7 w-7 ${item.iconColor} transition-transform duration-300 group-hover:scale-110`}
                  />
                </div>

                <h3 className="text-sm font-bold tracking-tight text-slate-900 transition-colors group-hover:text-cyan-400 sm:text-base dark:text-white">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs text-slate-600 transition-colors group-hover:text-slate-300 dark:text-slate-400">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
