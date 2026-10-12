"use client";

import * as React from "react";
import { Globe, ChevronDown } from "lucide-react";
import { useLanguage, Lang } from "@/components/providers/language-provider";
import { motion, AnimatePresence } from "motion/react";

const languages: { code: Lang; label: string; flag: string }[] = [
  { code: "uz", label: "O'zbek", flag: "🇺🇿" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
];

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentLang = languages.find((l) => l.code === lang) || languages[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-9 items-center gap-1.5 rounded-xl border border-border bg-surface px-2.5 text-xs font-semibold text-foreground-secondary transition-all duration-200 hover:scale-105 hover:bg-border/50 hover:text-foreground shadow-sm"
        aria-label="Tilni o'zgartirish"
      >
        <span className="text-base leading-none">{currentLang.flag}</span>
        <span className="font-bold tracking-wider">{currentLang.code.toUpperCase()}</span>
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-36 rounded-xl border border-border bg-surface-elevated shadow-lg overflow-hidden z-50 py-1"
          >
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLang(l.code);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3.5 py-2 text-xs font-medium transition-colors ${
                  lang === l.code
                    ? "bg-primary/10 text-primary font-bold"
                    : "text-foreground-secondary hover:bg-border/50 hover:text-foreground"
                }`}
              >
                <span className="text-base leading-none">{l.flag}</span>
                <span>{l.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
