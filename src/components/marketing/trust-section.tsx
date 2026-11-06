"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { motion, useInView, animate } from "motion/react";
import { Container } from "@/components/ui/container";

interface AnimatedCounterProps {
  from?: number;
  to: number;
  suffix?: string;
  duration?: number;
}

function AnimatedCounter({ from = 0, to, suffix = "", duration = 2 }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (inView && ref.current) {
      const controls = animate(from, to, {
        duration,
        ease: "easeOut",
        onUpdate: (value) => {
          if (ref.current) {
            // Check if 'to' is a float (like 4.9) or an integer
            const isFloat = to % 1 !== 0;
            ref.current.textContent =
              value.toLocaleString("en-US", {
                minimumFractionDigits: isFloat ? 1 : 0,
                maximumFractionDigits: isFloat ? 1 : 0,
              }) + suffix;
          }
        },
      });
      return controls.stop;
    }
  }, [inView, from, to, duration, suffix]);

  return (
    <span ref={ref} className="tabular-nums">
      {from}
      {suffix}
    </span>
  );
}

export function TrustSection() {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  };

  return (
    <section
      className="border-border/50 bg-surface/50 relative mt-12 w-full overflow-hidden border-y py-10 sm:mt-24 sm:py-16"
      aria-label="Social proof"
    >
      <Container>
        <motion.div
          className="grid grid-cols-1 gap-10 text-center sm:grid-cols-3 sm:gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <motion.div variants={itemVariants} className="flex flex-col items-center gap-2">
            <h3 className="text-foreground text-4xl font-bold tracking-tight sm:text-5xl">
              <AnimatedCounter to={12000} suffix="+" />
            </h3>
            <p className="text-foreground-secondary mt-1 text-xs font-semibold tracking-widest uppercase sm:text-sm">
              Resumes Created
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-col items-center gap-2">
            <h3 className="text-foreground text-4xl font-bold tracking-tight sm:text-5xl">
              <AnimatedCounter to={96} suffix="%" />
            </h3>
            <p className="text-foreground-secondary mt-1 text-xs font-semibold tracking-widest uppercase sm:text-sm">
              ATS Success Rate
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-col items-center gap-2">
            <h3 className="text-foreground text-4xl font-bold tracking-tight sm:text-5xl">
              <AnimatedCounter to={4.9} suffix="★" />
            </h3>
            <p className="text-foreground-secondary mt-1 text-xs font-semibold tracking-widest uppercase sm:text-sm">
              Average Rating
            </p>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
