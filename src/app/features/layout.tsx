"use client";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useLanguage } from "@/components/providers/language-provider";

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-transparent">
      {/* Top bar */}
      <div className="border-border bg-surface/80 border-b backdrop-blur-md md:sticky md:top-20 md:z-40">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6 sm:py-5">
          <Link
            href="/"
            className="text-foreground-secondary hover:text-foreground flex items-center gap-2 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.backToHome}
          </Link>
          <div className="bg-border h-4 w-px" />
          <div className="text-primary flex items-center gap-1.5 text-sm">
            <Sparkles className="h-3.5 w-3.5" />
            {t.DocNovaFeatures}
          </div>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
