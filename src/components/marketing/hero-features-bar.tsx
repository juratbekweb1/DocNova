"use client";

import React from "react";
import { motion } from "motion/react";
import { Zap, ShieldCheck, Gem, Laptop, Headphones } from "lucide-react";

export function HeroFeaturesBar() {
  const features = [
    {
      title: "Tezkor generatsiya",
      description: "Bir necha soniyada natija",
      icon: Zap,
      color: "text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.65)]",
    },
    {
      title: "Xavfsiz va ishonchli",
      description: "Sizning ma'lumotlaringiz himoyada",
      icon: ShieldCheck,
      color: "text-sky-400 drop-shadow-[0_0_12px_rgba(14,165,233,0.65)]",
    },
    {
      title: "Professional sifat",
      description: "Eng yuqori standartlar",
      icon: Gem,
      color: "text-blue-400 drop-shadow-[0_0_12px_rgba(59,130,246,0.65)]",
    },
    {
      title: "Har qanday qurilmada",
      description: "Kompyuter va mobil uchun",
      icon: Laptop,
      color: "text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.65)]",
    },
    {
      title: "24/7 Yordam",
      description: "Har doim yoningizda",
      icon: Headphones,
      color: "text-sky-400 drop-shadow-[0_0_12px_rgba(14,165,233,0.65)]",
    },
  ];

  return (
    <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-[28px] border dark:border-sky-500/25 border-slate-200/90 dark:bg-[#070e24]/90 bg-white/95 p-6 sm:p-8 backdrop-blur-2xl shadow-[0_15px_40px_rgba(0,0,0,0.06),0_0_25px_rgba(14,165,233,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_35px_rgba(14,165,233,0.18)] transition-colors duration-300"
      >
        {/* Interior ambient neon reflection */}
        <div className="pointer-events-none absolute inset-0 dark:bg-gradient-to-r dark:from-cyan-500/10 dark:via-sky-500/5 dark:to-blue-500/10 bg-gradient-to-r from-sky-400/5 via-blue-400/5 to-cyan-400/5" />

        <div className="relative grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 lg:gap-0 lg:divide-x dark:lg:divide-slate-800/80 lg:divide-slate-200">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className={`group flex flex-col items-center text-center transition-all duration-200 hover:-translate-y-1 ${
                  idx === 0 ? "lg:pr-6" : idx === features.length - 1 ? "lg:pl-6" : "lg:px-6"
                }`}
              >
                {/* 1-Rasmga 100% mos toza, porlovchi Neon Icon (ortiqcha qutisiz) */}
                <div className="mb-3 flex h-12 w-12 items-center justify-center transition-transform duration-300 group-hover:scale-115">
                  <Icon className={`h-8 w-8 transition-all ${item.color}`} />
                </div>

                <h3 className="text-sm font-bold dark:text-white text-slate-900 tracking-tight sm:text-base group-hover:text-cyan-400 transition-colors">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs dark:text-slate-400 text-slate-600 group-hover:text-slate-300 transition-colors">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}
