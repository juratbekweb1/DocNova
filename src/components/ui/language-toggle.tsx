"use client";

import * as React from "react";
import { Globe, ChevronDown, Check } from "lucide-react";
import { useLanguage, Lang } from "@/components/providers/language-provider";
import { motion, AnimatePresence } from "motion/react";

const languages: { code: Lang; label: string }[] = [
  { code: "uz", label: "O'zbek" },
  { code: "ru", label: "Русский" },
  { code: "en", label: "English" },
  { code: "tr", label: "Türkçe" },
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
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="border-border bg-surface text-foreground hover:bg-border/50 flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold shadow-sm transition-all duration-200"
        aria-label="Tilni o'zgartirish"
      >
        <Globe className="text-primary h-3.5 w-3.5 shrink-0" />
        <span className="font-bold tracking-wider uppercase">{currentLang.code}</span>
        <ChevronDown
          className={`text-foreground-muted h-3 w-3 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="border-border bg-surface-elevated absolute right-0 z-50 mt-2 w-36 overflow-hidden rounded-xl border py-1 shadow-xl"
          >
            {languages.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => {
                  setLang(l.code);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between px-3.5 py-2 text-xs font-medium transition-colors ${
                  lang === l.code
                    ? "bg-primary/10 text-primary font-bold"
                    : "text-foreground-secondary hover:bg-border/50 hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="bg-surface text-foreground-muted border-border rounded border px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase">
                    {l.code}
                  </span>
                  <span>{l.label}</span>
                </div>
                {lang === l.code && <Check className="text-primary h-3.5 w-3.5" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
