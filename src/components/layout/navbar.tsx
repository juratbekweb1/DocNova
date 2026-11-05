"use client";

import * as React from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Logo } from "./logo";
import { NavLinks } from "./nav-links";
import { MobileMenu } from "./mobile-menu";
import { ScrollHeader } from "./scroll-header";
import { Container } from "@/components/ui/container";
import { motion, AnimatePresence } from "motion/react";
import {
  Globe,
  ChevronDown,
  User,
  LogOut,
  Shield,
  ArrowRight,
  Check,
  Sun,
  Moon,
} from "lucide-react";
import { useLanguage, Lang } from "@/components/providers/language-provider";
import { UsageIndicator } from "./usage-indicator";
import { useTheme } from "next-themes";

const languages: { code: Lang; label: string }[] = [
  { code: "uz", label: "O'zbek" },
  { code: "ru", label: "Русский" },
  { code: "en", label: "English" },
  { code: "tr", label: "Türkçe" },
];

export function Navbar() {
  const { data: session } = useSession();
  const { lang, setLang, t } = useLanguage();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [langDropdownOpen, setLangDropdownOpen] = React.useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false);
  const langDropdownRef = React.useRef<HTMLDivElement>(null);
  const userDropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    await signOut({ callbackUrl: "/login", redirect: true });
  };

  const currentLang = languages.find((l) => l.code === lang) || languages[0];
  const isDark = mounted ? resolvedTheme === "dark" || theme === "dark" : true;

  return (
    <ScrollHeader className="border-b border-slate-200/90 bg-white/95 transition-colors duration-300 md:bg-white/85 md:backdrop-blur-xl dark:border-slate-800/70 dark:bg-[#020817]/95 md:dark:bg-[#020817]/85">
      <Container
        size="full"
        className="flex h-16 max-w-[1536px] items-center justify-between gap-2 px-3 sm:px-6 md:h-20 lg:px-8 xl:gap-4"
      >
        {/* Left: Logo */}
        <div className="flex shrink-0 items-center">
          <Logo />
        </div>

        {/* Center: Desktop Navigation */}
        <div className="hidden min-w-0 flex-1 items-center justify-center px-2 xl:flex">
          <NavLinks />
        </div>

        {/* Right: Actions, Theme Switch & Mobile Menu Toggle */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          {/* Theme Switch Pill (Responsive for BOTH Mobile & Desktop) */}
          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-700 shadow-sm transition-all hover:scale-105 hover:text-black sm:h-9 sm:w-9 dark:border-slate-700/60 dark:bg-[#0a1024]/80 dark:text-slate-300 dark:hover:text-white"
            aria-label="Mavzuni almashtirish (Kun / Tun)"
            title={isDark ? "Yorug' (Light) rejimga o'tish" : "Qorong'i (Dark) rejimga o'tish"}
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-sky-600" />
            )}
          </button>

          {/* Language Selector (Visible to all) */}
          <div className="relative hidden lg:block" ref={langDropdownRef}>
            <button
              type="button"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:border-sky-500/40 dark:border-slate-700/50 dark:bg-[#0a1024]/80 dark:text-slate-300"
              aria-label="Tilni tanlash"
            >
              <Globe className="h-3.5 w-3.5 shrink-0 text-sky-500" />
              <span className="font-bold tracking-wider uppercase">{currentLang.code}</span>
              <ChevronDown
                className={`h-3 w-3 shrink-0 text-slate-400 transition-transform duration-200 ${
                  langDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {langDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute right-0 z-50 mt-2 w-36 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1.5 shadow-2xl backdrop-blur-xl dark:border-slate-700/60 dark:bg-[#0a1024]/95"
                >
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => {
                        setLang(l.code);
                        setLangDropdownOpen(false);
                      }}
                      className={`flex w-full items-center justify-between px-3.5 py-2 text-xs font-medium transition-colors ${
                        lang === l.code
                          ? "bg-sky-500/15 font-bold text-sky-500"
                          : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase dark:border-slate-700/80 dark:bg-slate-900/80">
                          {l.code}
                        </span>
                        <span>{l.label}</span>
                      </div>
                      {lang === l.code && <Check className="h-3.5 w-3.5 text-sky-500" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {session ? (
            <>
              <div className="hidden shrink-0 lg:block">
                <UsageIndicator />
              </div>
              {/* User Menu / Kabinetim */}
              <div className="relative hidden shrink-0 lg:block" ref={userDropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="group relative flex items-center gap-2.5 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-[0_0_20px_rgba(14,165,233,0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(14,165,233,0.6)] xl:text-sm"
                >
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
                    {session.user?.name?.[0] || "U"}
                  </div>
                  <span className="max-w-[85px] truncate font-medium xl:max-w-[110px]">
                    Kabinetim
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>

                <AnimatePresence>
                  {userDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl backdrop-blur-xl dark:border-slate-700/60 dark:bg-[#0a1024]/95"
                    >
                      <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {session.user?.name}
                        </p>
                        <p className="truncate text-xs text-slate-400">{session.user?.email}</p>
                      </div>
                      <div className="py-2">
                        {((session.user as Record<string, unknown>)?.role === "SUPER_ADMIN" ||
                          (session.user as Record<string, unknown>)?.role === "ADMIN") && (
                          <Link
                            href={
                              (session.user as Record<string, unknown>)?.role === "SUPER_ADMIN"
                                ? "/super-admin"
                                : "/admin"
                            }
                            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-sky-500 transition-colors hover:bg-sky-500/10"
                            onClick={() => setUserDropdownOpen(false)}
                          >
                            <Shield className="h-4 w-4 shrink-0" />
                            <span>
                              {(session.user as Record<string, unknown>)?.role === "SUPER_ADMIN"
                                ? "Super Admin Panel"
                                : "Admin Panel"}
                            </span>
                          </Link>
                        )}
                        <Link
                          href="/dashboard"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <User className="h-4 w-4 shrink-0 text-sky-500" />
                          <span>Dashboard</span>
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-rose-500 transition-colors hover:bg-rose-500/10"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>{t.logout}</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="hidden items-center gap-3 lg:flex">
              <Link
                href="/login"
                className="group relative flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-[0_0_20px_rgba(14,165,233,0.45)] transition-all hover:scale-105 hover:shadow-[0_0_25px_rgba(14,165,233,0.7)] active:scale-95 xl:text-sm"
              >
                <span>Kabinetim</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          )}

          <MobileMenu />
        </div>
      </Container>
    </ScrollHeader>
  );
}
