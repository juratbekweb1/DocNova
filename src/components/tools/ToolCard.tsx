import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Clock, Zap } from "lucide-react";

interface ToolCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  estimatedTime?: string;
  badge?: string;
  badgeColor?: string;
  className?: string;
  ctaText?: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export function ToolCard({
  title,
  description,
  icon: Icon,
  href,
  estimatedTime = "~2 min",
  badge,
  badgeColor = "text-primary bg-primary/10 border-primary/20",
  className,
  ctaText = "Boshlash",
  isFavorite,
  onToggleFavorite
}: ToolCardProps) {
  return (
    <Link href={href} className={cn("block group h-full", className)}>
      <div className="relative h-full overflow-hidden rounded-2xl bg-surface border border-border p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-primary hover:shadow-[0_0_30px_-5px_rgba(56,189,248,0.4)] flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-transparent to-transparent group-hover:from-primary/20 group-hover:via-primary/5 transition-colors duration-500 pointer-events-none" />
        
        <div className="flex flex-col h-full relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-elevated border border-border group-hover:border-primary/30 group-hover:bg-primary/10 transition-colors duration-300">
              <Icon className="h-6 w-6 text-foreground-secondary group-hover:text-primary transition-colors duration-300" />
            </div>
            <div className="flex items-center gap-2 z-20">
              {badge && (
                <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border", badgeColor)}>
                  {badge}
                </span>
              )}
              {onToggleFavorite && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onToggleFavorite();
                  }}
                  className={cn(
                    "p-1.5 rounded-md hover:bg-surface-elevated transition-colors",
                    isFavorite ? "text-amber-500" : "text-foreground-muted hover:text-amber-500"
                  )}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </button>
              )}
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors duration-300">
              {title}
            </h3>
            <p className="text-sm text-foreground-secondary font-medium leading-relaxed line-clamp-2">
              {description}
            </p>
          </div>

          <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-medium text-foreground-muted">
              <Clock className="h-3.5 w-3.5" />
              Tayyor bo&apos;lish vaqti: {estimatedTime}
            </div>
            <button className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              {ctaText}
              <Zap className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
