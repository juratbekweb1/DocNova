"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, X, Sparkles } from "lucide-react";
import Link from "next/link";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function UpgradeModal({ isOpen, onClose, title = "Limit Exceeded", description = "You've reached the limit of your current Free plan." }: UpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-foreground-secondary hover:text-foreground transition-colors rounded-full hover:bg-surface-elevated"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-8 text-center border-b border-border">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">{title}</h2>
            <p className="mt-2 text-foreground-secondary">{description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 bg-background">
            <div className="p-8 border-b md:border-b-0 md:border-r border-border">
              <h3 className="text-lg font-semibold text-foreground">Free Plan</h3>
              <ul className="mt-4 space-y-3">
                <li className="flex items-center text-sm text-foreground-secondary">
                  <CheckCircle className="w-4 h-4 mr-2 text-primary/50" /> 10 Nova Chat requests/day
                </li>
                <li className="flex items-center text-sm text-foreground-secondary">
                  <CheckCircle className="w-4 h-4 mr-2 text-primary/50" /> 1 Mock Test/month
                </li>
                <li className="flex items-center text-sm text-foreground-secondary">
                  <CheckCircle className="w-4 h-4 mr-2 text-primary/50" /> Basic templates only
                </li>
              </ul>
              <div className="mt-6">
                <button disabled className="w-full py-2.5 px-4 rounded-xl border border-border bg-surface text-foreground-secondary text-sm font-medium opacity-50 cursor-not-allowed">
                  Current Plan
                </button>
              </div>
            </div>

            <div className="p-8 bg-primary/5">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                Pro <span className="text-xs py-0.5 px-2 rounded-full bg-primary text-primary-foreground font-bold uppercase tracking-wider">Popular</span>
              </h3>
              <ul className="mt-4 space-y-3">
                <li className="flex items-center text-sm text-foreground">
                  <CheckCircle className="w-4 h-4 mr-2 text-primary" /> 60 Nova Chat requests/day
                </li>
                <li className="flex items-center text-sm text-foreground">
                  <CheckCircle className="w-4 h-4 mr-2 text-primary" /> 10 Mock Tests/month
                </li>
                <li className="flex items-center text-sm text-foreground">
                  <CheckCircle className="w-4 h-4 mr-2 text-primary" /> All premium templates
                </li>
              </ul>
              <div className="mt-6">
                <Link href="/pricing" onClick={onClose} className="block text-center w-full py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all hover:-translate-y-0.5">
                  Upgrade to Pro
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
