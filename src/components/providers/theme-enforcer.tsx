"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

export function ThemeEnforcer() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (resolvedTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
    } else if (resolvedTheme === "light") {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
    }
  }, [resolvedTheme]);

  return null;
}
