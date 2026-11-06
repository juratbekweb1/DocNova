"use client";

import * as React from "react";
import { motion } from "motion/react";

type AuthCardProps = {
  children: React.ReactNode;
};

export function AuthCard({ children }: AuthCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="border-border bg-surface-elevated/95 premium-card mx-auto w-full max-w-md rounded-[2rem] border p-8 shadow-2xl sm:p-10"
    >
      {children}
    </motion.div>
  );
}
