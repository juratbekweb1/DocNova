"use client";

import React, { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import type { SectionLimitStat } from "@/lib/limits";

export interface UsageData {
  plan: string;
  usage: number;
  limit: number;
  remaining: number;
  sections?: SectionLimitStat[];
  error?: string;
}

let cachedUsageData: UsageData | null = null;
let cachedUsageAt = 0;
let inFlightUsagePromise: Promise<UsageData | null> | null = null;
const USAGE_CACHE_TTL_MS = 20_000;

export function invalidateClientUsageCache() {
  cachedUsageData = null;
  cachedUsageAt = 0;
}

export function fetchClientUsageData(force = false): Promise<UsageData | null> {
  const now = Date.now();
  if (!force && cachedUsageData && now - cachedUsageAt < USAGE_CACHE_TTL_MS) {
    return Promise.resolve(cachedUsageData);
  }
  if (!force && inFlightUsagePromise) {
    return inFlightUsagePromise;
  }

  inFlightUsagePromise = fetch("/api/user/usage")
    .then((res) => (res.ok ? res.json() : null))
    .then((d: UsageData | null) => {
      if (d && !d.error) {
        cachedUsageData = d;
        cachedUsageAt = Date.now();
        return d;
      }
      return null;
    })
    .catch((err) => {
      console.error(err);
      return null;
    })
    .finally(() => {
      inFlightUsagePromise = null;
    });

  return inFlightUsagePromise;
}

export function UsageIndicator() {
  const [data, setData] = useState<UsageData | null>(cachedUsageData);

  useEffect(() => {
    // UsageIndicator is inside `hidden lg:block` in Navbar; avoid fetching/re-rendering on mobile viewports
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      return;
    }
    let active = true;
    fetchClientUsageData().then((d) => {
      if (active && d) setData(d);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!data) return null;

  const percentage = Math.min(100, Math.max(0, (data.usage / data.limit) * 100));
  const isCritical = percentage >= 80;

  return (
    <div className="bg-surface-elevated border-border flex items-center gap-3 rounded-lg border px-3 py-1.5 shadow-sm">
      <div className="flex w-32 flex-col gap-1">
        <div className="flex items-center justify-between text-[10px] font-bold">
          <span className="text-foreground-secondary tracking-wider uppercase">{data.plan}</span>
          <span className={isCritical ? "text-red-500" : "text-primary"}>
            {data.remaining} qoldi
          </span>
        </div>
        <div className="bg-border h-1.5 w-full overflow-hidden rounded-full">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isCritical ? "bg-red-500" : "bg-primary"}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      <div className="bg-primary/10 flex h-6 w-6 shrink-0 items-center justify-center rounded-md">
        <Zap className="text-primary fill-primary/20 h-3.5 w-3.5" />
      </div>
    </div>
  );
}
