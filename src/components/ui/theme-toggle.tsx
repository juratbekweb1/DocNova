"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "motion/react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-foreground-secondary opacity-50 shadow-sm">
        <Sun className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-foreground-secondary transition-all duration-200 hover:scale-105 hover:bg-border/50 hover:text-foreground shadow-sm"
        aria-label="Toggle theme"
      >
        {resolvedTheme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-36 rounded-xl border border-border bg-surface-elevated shadow-lg overflow-hidden z-50"
          >
            <button
              onClick={() => {
                setTheme("light");
                setIsOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                theme === "light"
                  ? "bg-primary/10 text-primary"
                  : "text-foreground-secondary hover:bg-border/50 hover:text-foreground"
              }`}
            >
              <Sun className="h-4 w-4" /> Light
            </button>
            <button
              onClick={() => {
                setTheme("dark");
                setIsOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                theme === "dark"
                  ? "bg-primary/10 text-primary"
                  : "text-foreground-secondary hover:bg-border/50 hover:text-foreground"
              }`}
            >
              <Moon className="h-4 w-4" /> Dark
            </button>
            <button
              onClick={() => {
                setTheme("system");
                setIsOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                theme === "system"
                  ? "bg-primary/10 text-primary"
                  : "text-foreground-secondary hover:bg-border/50 hover:text-foreground"
              }`}
            >
              <Monitor className="h-4 w-4" /> System
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
