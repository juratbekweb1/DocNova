"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { mainNavConfig } from "@/config/navigation";
import { useLanguage } from "@/components/providers/language-provider";
import { Home, LayoutGrid, GraduationCap, Gem, HelpCircle } from "lucide-react";

interface NavLinksProps {
  className?: string;
  itemClassName?: string;
  onLinkClick?: () => void;
}

const navIcons: Record<string, React.ElementType> = {
  home: Home,
  services: LayoutGrid,
  students: GraduationCap,
  pricing: Gem,
  help: HelpCircle,
};

export function NavLinks({ className, itemClassName, onLinkClick }: NavLinksProps) {
  const pathname = usePathname();
  const { t } = useLanguage();

  const getNavTitle = (href: string, defaultTitle: string) => {
    const safeT = t as unknown as Record<string, string>;
    switch (href) {
      case "/":
        return safeT.navHome || defaultTitle;
      case "/tools":
        return safeT.navServices || defaultTitle;
      case "/academic":
      case "/coursework":
        return t.navStudents || defaultTitle;
      case "/pricing":
        return t.navPricing || defaultTitle;
      case "/#faq":
      case "/help":
        return safeT.navHelp || t.navFAQ || defaultTitle;
      default:
        return defaultTitle;
    }
  };

  return (
    <nav
      className={cn(
        "flex items-center gap-1 rounded-full border dark:border-slate-700/50 border-slate-200/90 dark:bg-[#0a1024]/85 bg-white/95 p-1.5 shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-colors duration-300",
        className
      )}
    >
      {mainNavConfig.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href) && item.href !== "/#faq";
        const IconComponent = item.key ? navIcons[item.key] : null;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onLinkClick}
            className={cn(
              "group relative flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all duration-200 xl:text-[13px]",
              isActive
                ? "border dark:border-cyan-500/30 border-sky-400/40 dark:bg-slate-800/90 bg-sky-50 dark:text-white text-sky-800 shadow-[0_0_15px_rgba(14,165,233,0.25)]"
                : "dark:text-slate-300 text-slate-600 dark:hover:bg-slate-800/60 hover:bg-slate-100 dark:hover:text-white hover:text-slate-900",
              itemClassName
            )}
          >
            {IconComponent && (
              <IconComponent
                className={cn(
                  "h-3.5 w-3.5 shrink-0 transition-colors",
                  isActive ? "text-cyan-500" : "dark:text-slate-400 text-slate-500 group-hover:text-cyan-500"
                )}
              />
            )}
            <span>{getNavTitle(item.href, item.title)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
