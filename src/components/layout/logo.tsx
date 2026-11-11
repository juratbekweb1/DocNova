"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
}

export function Logo({
  className,
  iconClassName,
  textClassName,
  showText = true,
  ...props
}: LogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        "group focus-visible:ring-primary focus-visible:ring-offset-background flex items-center gap-3 rounded-lg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        className
      )}
      aria-label="DocNova Home"
      {...props}
    >
      <div className="relative transition-transform duration-200 md:group-hover:scale-105 md:group-hover:rotate-3">
        <div className="relative">
          {/* Glow effect (Desktop only to avoid Gaussian blur pass in fixed mobile header) */}
          <div className="bg-primary pointer-events-none absolute inset-0 hidden opacity-30 blur-xl transition-opacity group-hover:opacity-50 md:block" />

          {/* Logo container */}
          <div className="from-primary to-accent shadow-primary/30 group-hover:shadow-primary/50 relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg transition-shadow">
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={cn("text-primary-foreground", iconClassName)}
              aria-hidden="true"
            >
              {/* Document body with folded corner */}
              <path
                d="M7 4.5C7 3.67 7.67 3 8.5 3H17L22 8V23.5C22 24.33 21.33 25 20.5 25H8.5C7.67 25 7 24.33 7 23.5V4.5Z"
                fill="currentColor"
                fillOpacity="0.15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Folded corner */}
              <path
                d="M17 3V7C17 7.55 17.45 8 18 8H22"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Text lines */}
              <line
                x1="10.5"
                y1="12.5"
                x2="18.5"
                y2="12.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <line
                x1="10.5"
                y1="16"
                x2="16"
                y2="16"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <line
                x1="10.5"
                y1="19.5"
                x2="14"
                y2="19.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              {/* AI spark */}
              <path
                d="M21 13L22 11L23 13L25 14L23 15L22 17L21 15L19 14L21 13Z"
                fill="currentColor"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
      {showText && (
        <div className="flex flex-col">
          <span
            className={cn(
              "text-foreground group-hover:text-primary text-2xl font-black tracking-tight transition-colors",
              textClassName
            )}
          >
            DocNova
          </span>
          {props["aria-label"] === "DocNova Home" && (
            <span className="text-primary text-[10px] font-bold tracking-wider uppercase">
              AI Tools Hub
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
