import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lock, X, CheckCircle, Zap } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import Link from "next/link";

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PaywallModal({ isOpen, onClose }: PaywallModalProps) {
  const { t } = useLanguage();

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
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="border-border bg-surface pointer-events-auto relative w-full max-w-lg overflow-hidden rounded-3xl border shadow-2xl"
            >
              {/* Background ambient glow - GPU radial gradients */}
              <div className="pointer-events-none absolute top-0 right-0 h-64 w-64 translate-x-1/3 -translate-y-1/3 rounded-full bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.25)_0%,transparent_70%)]" />
              <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 -translate-x-1/3 translate-y-1/3 rounded-full bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.18)_0%,transparent_70%)]" />

              <button
                onClick={onClose}
                className="text-foreground-secondary hover:border-border hover:text-foreground absolute top-4 right-4 z-10 rounded-full p-2 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="relative z-10 p-8">
                <div className="from-primary/20 border-primary/30 text-primary mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border bg-gradient-to-br to-blue-600/20">
                  <Lock className="h-7 w-7" />
                </div>

                <div className="text-center">
                  <h2 className="text-foreground mb-3 text-2xl font-bold">{t.usageLimitTitle}</h2>
                  <p className="text-foreground-secondary mx-auto max-w-sm text-sm leading-relaxed">
                    {t.usageLimitDesc}
                  </p>
                </div>

                <div className="mt-8 space-y-4">
                  <Link
                    href="/#pricing"
                    onClick={onClose}
                    className="from-primary text-foreground shadow-primary/30 hover:shadow-primary/50 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r to-blue-600 py-3.5 text-sm font-semibold shadow-lg transition-all hover:scale-[1.02]"
                  >
                    <Zap className="h-4 w-4" />
                    {t.upgradeNow}
                  </Link>
                  <button
                    onClick={onClose}
                    className="border-border text-foreground-secondary hover:text-foreground w-full rounded-xl border py-3.5 text-sm font-medium transition-colors hover:bg-white/5"
                  >
                    {t.closeBtn}
                  </button>
                </div>

                <div className="mt-8 flex justify-center gap-6 border-t border-white/5 pt-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    <span className="text-foreground-secondary text-xs">Pro - {t.pricePro}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-violet-400" />
                    <span className="text-foreground-secondary text-xs">
                      Premium - {t.pricePremium}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
