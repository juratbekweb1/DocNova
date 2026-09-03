"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { mainNavConfig } from "@/config/navigation";
import { useLanguage } from "@/components/providers/language-provider";

interface NavLinksProps {
  className?: string;
  itemClassName?: string;
  onLinkClick?: () => void;
}

export function NavLinks({ className, itemClassName, onLinkClick }: NavLinksProps) {
  const pathname = usePathname();
  const { t } = useLanguage();

  const getNavTitle = (href: string, defaultTitle: string) => {
    switch (href) {
      case "/tools":
        return t.navTools || defaultTitle;
      case "/dashboard/templates":
        return t.navTemplates || defaultTitle;
      case "/pricing":
        return t.navPricing || defaultTitle;
      case "/#faq":
        return t.navFAQ || defaultTitle;
      default:
        return defaultTitle;
    }
  };

  return (
    <nav className={cn("flex items-center gap-8", className)}>
      {mainNavConfig.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onLinkClick}
            className={cn(
              "focus-visible:ring-primary relative rounded-md px-1 py-1 text-sm font-bold transition-all duration-300 focus-visible:ring-2 focus-visible:outline-none",
              "after:from-primary after:to-accent after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-gradient-to-r after:transition-all after:duration-300 hover:after:w-full",
              isActive
                ? "dark:text-primary text-amber-600 after:w-full"
                : "text-foreground/80 dark:hover:text-primary hover:-translate-y-0.5 hover:text-amber-600",
              itemClassName
            )}
          >
            {getNavTitle(item.href, item.title)}
          </Link>
        );
      })}
    </nav>
  );
}
