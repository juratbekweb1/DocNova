"use client";

import React from "react";
import Link from "next/link";
import { motion } from "motion/react";

export function HeroFuturisticVisual() {
  return (
    <div className="relative mx-auto flex w-full max-w-[650px] items-center justify-center select-none">
      {/* Background Ambient Glows - Seamlessly integrated with deep navy background */}
      <div className="pointer-events-none absolute -inset-10 -z-10">
        <div className="absolute top-1/2 left-1/2 hidden h-[480px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-cyan-500/25 via-blue-600/20 to-sky-400/25 blur-3xl md:block" />
        <div className="absolute top-1/4 right-4 hidden h-[280px] w-[280px] rounded-full bg-cyan-400/25 blur-2xl md:block" />
        <div className="absolute top-1/2 left-1/2 block h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 transform-gpu rounded-full bg-cyan-500/15 blur-lg md:hidden" />
      </div>

      {/* Main 3D Floating Composition - 100% Seamless, Background-image, NO <img>, NO border */}
      <motion.div
        animate={{
          y: [0, -7, 0],
          rotateZ: [-0.3, 0.3, -0.3],
        }}
        transition={{
          duration: 6.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative w-full transform-gpu will-change-transform"
      >
        {/* Banner element as CSS background-image (no <img>, no left button pills, responsive) */}
        <div
          className="relative aspect-[535/320] w-full bg-[url('/images/hero-3d-docnova-bg.png')] [mask-image:radial-gradient(ellipse_at_center,black_84%,transparent_100%)] bg-contain bg-center bg-no-repeat drop-shadow-[0_20px_50px_rgba(14,165,233,0.22)]"
          role="img"
          aria-label="DocNova AI 3D Hujjat Generatori foni"
        >
          {/* Hotspot for right-side AI badge */}
          <Link
            href="/academic"
            className="absolute top-[42%] right-[16%] h-[18%] w-[19%] cursor-pointer rounded-2xl focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
            title="AI Hujjat Yaratish"
          />

          {/* Hotspot for 'Bir necha soniyada tayyor' banner */}
          <Link
            href="/academic"
            className="absolute right-[11%] bottom-[8%] h-[17%] w-[33%] cursor-pointer rounded-2xl focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
            title="Tezkor akademik generatsiya"
          />
        </div>
      </motion.div>
    </div>
  );
}
