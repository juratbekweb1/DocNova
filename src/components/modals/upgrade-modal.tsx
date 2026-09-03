"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, X, Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  customTitle?: string;
  customMessage?: string;
}

export function UpgradeModal({ isOpen, onClose, customTitle, customMessage }: UpgradeModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="bg-background/80 fixed inset-0 z-50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2"
          >
            <div className="bg-surface border-primary/20 shadow-primary/10 relative overflow-hidden rounded-3xl border p-6 shadow-2xl md:p-8">
              <div className="bg-primary/10 absolute top-0 right-0 h-32 w-32 translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" />

              <button
                onClick={onClose}
                className="hover:bg-surface-elevated text-foreground-secondary hover:text-foreground absolute top-4 right-4 rounded-full p-2 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-6 flex flex-col items-center text-center">
                <div className="bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
                  <Sparkles className="text-primary h-6 w-6" />
                </div>
                <h2 className="text-foreground mb-2 text-2xl font-bold">
                  {customTitle || "Limitga yetdingiz"}
                </h2>
                <p className="text-foreground-secondary text-sm">
                  {customMessage ||
                    "Sizning bepul AI so'rovlar limitiga yetdingiz. Cheksiz imkoniyatlar uchun tarifingizni yangilang."}
                </p>
              </div>

              <div className="mb-8 space-y-3">
                {[
                  "Unlimited AI Generations",
                  "Advanced CV Analytics",
                  "Priority Support",
                  "Premium Templates",
                ].map((feature, idx) => (
                  <div key={idx} className="text-foreground flex items-center gap-3 text-sm">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                      <Check className="h-3 w-3 text-emerald-500" />
                    </div>
                    {feature}
                  </div>
                ))}
              </div>

              <Link href="/pricing" className="block w-full" onClick={onClose}>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground w-full rounded-xl py-6 text-base font-bold shadow-[0_0_20px_-5px_rgba(56,189,248,0.4)]">
                  View PRO Plans <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <button
                onClick={onClose}
                className="text-foreground-muted hover:text-foreground mt-4 w-full text-sm font-medium transition-colors"
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
