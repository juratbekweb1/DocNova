"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ScrollHeaderProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export function ScrollHeader({ children, className, ...props }: ScrollHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;
    let lastScrolled = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrolled = window.scrollY > 20;
          if (scrolled !== lastScrolled) {
            lastScrolled = scrolled;
            setIsScrolled(scrolled);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    // Initial check in case of page reload halfway down
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 right-0 left-0 z-50 w-full border-b transition-colors duration-300",
        isScrolled
          ? "border-border/50 bg-background/95 md:bg-background/80 shadow-sm md:backdrop-blur-md"
          : "border-transparent bg-transparent",
        className
      )}
      {...props}
    >
      {children}
    </header>
  );
}
