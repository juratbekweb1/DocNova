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
import { Globe, ChevronDown, User, LogOut, Shield, ArrowUpRight } from "lucide-react";
import { useLanguage, Lang } from "@/components/providers/language-provider";
import { UsageIndicator } from "./usage-indicator";


const languages = [
  { code: "uz" as Lang, label: "O'zbek", flag: "🇺🇿" },
  { code: "ru" as Lang, label: "Русский", flag: "🇷🇺" },
  { code: "en" as Lang, label: "English", flag: "🇺🇸" },
  { code: "tr" as Lang, label: "Türkçe", flag: "🇹🇷" },
];

export function Navbar() {
  const { data: session } = useSession();
  const { lang, setLang, t } = useLanguage();
  const [langDropdownOpen, setLangDropdownOpen] = React.useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false);

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <ScrollHeader>
      <Container size="full" className="flex h-16 md:h-20 items-center justify-between gap-2 xl:gap-4 px-4 sm:px-6 lg:px-8 max-w-[1536px]">
        {/* Left: Logo */}
        <div className="flex items-center shrink-0">
          <Logo />
        </div>

        {/* Center: Desktop Navigation */}
        <div className="hidden xl:flex flex-1 items-center justify-center min-w-0 px-2">
          <NavLinks />
        </div>

        {/* Right: Desktop Actions & Mobile Menu Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Language Selector (Visible to all) */}
          <div className="relative hidden lg:block">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1.5 rounded-xl bg-surface border border-border px-2.5 py-1.5 text-xs xl:text-sm font-medium text-foreground transition-all duration-200 hover:bg-border/50 shadow-sm"
            >
              <Globe className="h-3.5 w-3.5 text-foreground-secondary" />
              <span>{languages.find((l) => l.code === lang)?.flag}</span>
              <span className="max-w-[75px] truncate">{languages.find((l) => l.code === lang)?.label}</span>
              <ChevronDown className="h-3 w-3 text-foreground-secondary" />
            </button>

            <AnimatePresence>
              {langDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-40 rounded-xl bg-surface-elevated border border-border shadow-lg overflow-hidden z-50"
                >
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLang(l.code);
                        setLangDropdownOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                        lang === l.code
                          ? "bg-primary/10 text-primary"
                          : "text-foreground-secondary hover:bg-border/50 hover:text-foreground"
                      }`}
                    >
                      <span>{l.flag}</span>
                      <span>{l.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {session ? (
            <>
              <div className="hidden lg:block shrink-0">
                <UsageIndicator />
              </div>
              {/* User Menu */}
              <div className="relative hidden lg:block shrink-0">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 rounded-xl bg-surface border border-border px-2.5 py-1.5 text-xs xl:text-sm font-medium text-foreground transition-all duration-200 hover:bg-border/50 hover:border-border-hover shadow-sm"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-sm shrink-0">
                    {session.user?.name?.[0] || "U"}
                  </div>
                  <span className="max-w-[75px] xl:max-w-[100px] 2xl:max-w-[130px] truncate">{session.user?.name}</span>
                  <ChevronDown className="h-3 w-3 text-foreground-secondary shrink-0" />
                </button>

                <AnimatePresence>
                  {userDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-56 rounded-xl bg-surface-elevated border border-border shadow-lg overflow-hidden z-50"
                    >
                      <div className="px-4 py-3 border-b border-border bg-surface">
                        <p className="text-sm font-medium text-foreground truncate">{session.user?.name}</p>
                        <p className="text-xs text-foreground-secondary truncate">{session.user?.email}</p>
                      </div>
                      <div className="py-2">
                        <Link
                          href={(session.user as Record<string, unknown>)?.role === "ADMIN" ? "/admin" : "/dashboard"}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground-secondary hover:bg-border/50 hover:text-foreground transition-colors"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          {(session.user as Record<string, unknown>)?.role === "ADMIN" ? (
                            <Shield className="h-4 w-4" />
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                          <span>{(session.user as Record<string, unknown>)?.role === "ADMIN" ? "Admin Panel" : "Dashboard"}</span>
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-error hover:bg-error/10 transition-colors"
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
            <div className="hidden lg:flex items-center gap-4"><button onClick={() => signIn("google", { callbackUrl: "/dashboard" })} className="flex items-center gap-3 rounded-full border border-primary/30 bg-background/50 pl-5 pr-1.5 py-1.5 text-sm font-semibold text-foreground hover:bg-surface-elevated transition-colors shadow-sm cursor-pointer"><span>{t.login}</span><div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground"><ArrowUpRight className="h-4 w-4" /></div></button></div>
          )}
          
          <MobileMenu />
        </div>
      </Container>
    </ScrollHeader>
  );
}




