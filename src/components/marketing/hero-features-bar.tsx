"use client";

import React from "react";
import { Zap, ShieldCheck, Gem, Laptop, Headphones } from "lucide-react";

export function HeroFeaturesBar() {
  const features = [
    {
      title: "Tezkor generatsiya",
      description: "Bir necha soniyada natija",
      icon: Zap,
      color: "text-cyan-400 md:drop-shadow-[0_0_12px_rgba(6,182,212,0.65)]",
    },
    {
      title: "Xavfsiz va ishonchli",
      description: "Sizning ma'lumotlaringiz himoyada",
      icon: ShieldCheck,
      color: "text-sky-400 md:drop-shadow-[0_0_12px_rgba(14,165,233,0.65)]",
    },
    {
      title: "Professional sifat",
      description: "Eng yuqori standartlar",
      icon: Gem,
      color: "text-blue-400 md:drop-shadow-[0_0_12px_rgba(59,130,246,0.65)]",
    },
    {
      title: "Har qanday qurilmada",
      description: "Kompyuter va mobil uchun",
      icon: Laptop,
      color: "text-cyan-400 md:drop-shadow-[0_0_12px_rgba(6,182,212,0.65)]",
    },
    {
      title: "24/7 Yordam",
      description: "Har doim yoningizda",
      icon: Headphones,
      color: "text-sky-400 md:drop-shadow-[0_0_12px_rgba(14,165,233,0.65)]",
    },
  ];

  return (
    <section className="relative mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="relative overflow-hidden rounded-[28px] border border-slate-200/90 bg-white/95 p-6 shadow-lg transition-colors duration-300 sm:p-8 dark:border-sky-500/25 dark:bg-[#070e24]/95 dark:shadow-[0_15px_35px_rgba(0,0,0,0.5)]">
        {/* Interior ambient neon reflection */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-sky-400/5 via-blue-400/5 to-cyan-400/5 dark:bg-gradient-to-r dark:from-cyan-500/10 dark:via-sky-500/5 dark:to-blue-500/10" />

        <div className="relative grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 lg:gap-0 lg:divide-x lg:divide-slate-200 dark:lg:divide-slate-800/80">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className={`group flex flex-col items-center text-center transition-transform duration-200 md:hover:-translate-y-1 ${
                  idx === 0 ? "lg:pr-6" : idx === features.length - 1 ? "lg:pl-6" : "lg:px-6"
                }`}
              >
                {/* 1-Rasmga 100% mos toza, porlovchi Neon Icon (ortiqcha qutisiz) */}
                <div className="mb-3 flex h-12 w-12 items-center justify-center transition-transform duration-300 md:group-hover:scale-115">
                  <Icon className={`h-8 w-8 ${item.color}`} />
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
