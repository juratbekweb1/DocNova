"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useTheme } from "next-themes";

export function ThemeEnforcer() {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const isDashboard = 
      pathname.startsWith('/dashboard') || 
      pathname.startsWith('/admin') || 
      pathname.startsWith('/super-admin') || 
      pathname.startsWith('/tools');

    if (!isDashboard) {
      // Force dark mode on public pages
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      // In dashboard / tools, respect the current user-selected theme
      if (resolvedTheme === 'light') {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      }
    }
  }, [pathname, resolvedTheme]);

  return null;
}
