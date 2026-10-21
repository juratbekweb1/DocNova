"use client";

import * as React from "react";
import Link from "next/link";
import { useSession, signOut, signIn } from "next-auth/react";
import { Logo } from "./logo";
import { NavLinks } from "./nav-links";
import { MobileMenu } from "./mobile-menu";
import { ScrollHeader } from "./scroll-header";
import { Container } from "@/components/ui/container";
import { motion, AnimatePresence } from "motion/react";
import { Globe, ChevronDown, User, LogOut, Shield, ArrowUpRight, Check } from "lucide-react";
import { useLanguage, Lang } from "@/components/providers/language-provider";
import { UsageIndicator } from "./usage-indicator";

const languages: { code: Lang; label: string }[] = [
  { code: "uz", label: "O'zbek" },
  { code: "ru", label: "Русский" },
  { code: "en", label: "English" },
  { code: "tr", label: "Türkçe" },
];

export function Navbar() {
  const { data: session } = useSession();
  const { lang, setLang, t } = useLanguage();
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

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  const currentLang = languages.find((l) => l.code === lang) || languages[0];

  return (
    <ScrollHeader>
      <Container
        size="full"
        className="flex h-16 max-w-[1536px] items-center justify-between gap-2 px-4 sm:px-6 md:h-20 lg:px-8 xl:gap-4"
      >
        {/* Left: Logo */}
        <div className="flex shrink-0 items-center">
          <Logo />
        </div>

        {/* Center: Desktop Navigation */}
        <div className="hidden min-w-0 flex-1 items-center justify-center px-2 xl:flex">
          <NavLinks />
        </div>

        {/* Right: Desktop Actions & Mobile Menu Toggle */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* Language Selector (Visible to all) */}
          <div className="relative hidden lg:block" ref={langDropdownRef}>
            <button
              type="button"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="border-border bg-surface text-foreground hover:bg-border/50 flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold shadow-sm transition-all duration-200"
              aria-label="Tilni tanlash"
            >
              <Globe className="text-primary h-3.5 w-3.5 shrink-0" />
              <span className="font-bold tracking-wider uppercase">{currentLang.code}</span>
              <span className="text-foreground-muted">•</span>
              <span className="text-foreground-secondary max-w-[65px] truncate font-medium">
                {currentLang.label}
              </span>
              <ChevronDown
                className={`text-foreground-muted h-3 w-3 shrink-0 transition-transform duration-200 ${
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
                  className="border-border bg-surface-elevated absolute right-0 z-50 mt-2 w-36 overflow-hidden rounded-xl border py-1 shadow-xl"
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

          {session ? (
            <>
              <div className="hidden shrink-0 lg:block">
                <UsageIndicator />
              </div>
              {/* User Menu */}
              <div className="relative hidden shrink-0 lg:block" ref={userDropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="bg-surface border-border text-foreground hover:bg-border/50 hover:border-border-hover flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-xs font-medium shadow-sm transition-all duration-200 xl:text-sm"
                >
                  <div className="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold shadow-sm">
                    {session.user?.name?.[0] || "U"}
                  </div>
                  <span className="max-w-[75px] truncate xl:max-w-[100px] 2xl:max-w-[130px]">
                    {session.user?.name}
                  </span>
                  <ChevronDown className="text-foreground-secondary h-3 w-3 shrink-0" />
                </button>

                <AnimatePresence>
                  {userDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-surface-elevated border-border absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border shadow-lg"
                    >
                      <div className="border-border bg-surface border-b px-4 py-3">
                        <p className="text-foreground truncate text-sm font-medium">
                          {session.user?.name}
                        </p>
                        <p className="text-foreground-secondary truncate text-xs">
                          {session.user?.email}
                        </p>
                      </div>
                      <div className="py-2">
                        <Link
                          href={
                            (session.user as Record<string, unknown>)?.role === "ADMIN"
                              ? "/admin"
                              : "/dashboard"
                          }
                          className="text-foreground-secondary hover:bg-border/50 hover:text-foreground flex items-center gap-2 px-4 py-2.5 text-sm transition-colors"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          {(session.user as Record<string, unknown>)?.role === "ADMIN" ? (
                            <Shield className="h-4 w-4" />
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                          <span>
                            {(session.user as Record<string, unknown>)?.role === "ADMIN"
                              ? "Admin Panel"
                              : "Dashboard"}
                          </span>
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="text-error hover:bg-error/10 flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors"
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
            <div className="hidden items-center gap-4 lg:flex">
              <button
                onClick={() => signIn("google", { callbackUrl: "/?auth=success" })}
                className="border-primary/30 bg-background/50 text-foreground hover:bg-surface-elevated flex cursor-pointer items-center gap-3 rounded-full border py-1.5 pr-1.5 pl-5 text-sm font-semibold shadow-sm transition-colors"
              >
                <span>{t.login}</span>
                <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </button>
            </div>
          )}

          <MobileMenu />
        </div>
      </Container>
    </ScrollHeader>
  );
}
