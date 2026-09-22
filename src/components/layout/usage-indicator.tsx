"use client";

import React, { useEffect, useState } from "react";
import { Zap } from "lucide-react";

interface UsageData {
  plan: string;
  usage: number;
  limit: number;
  remaining: number;
}

export function UsageIndicator() {
  const [data, setData] = useState<UsageData | null>(null);

  useEffect(() => {
    fetch("/api/user/usage")
      .then(res => res.json())
      .then(d => {
        if (!d.error) setData(d);
      })
      .catch(console.error);
  }, []);

  if (!data) return null;

  const percentage = Math.min(100, Math.max(0, (data.usage / data.limit) * 100));
  const isCritical = percentage >= 80;

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 bg-surface-elevated border border-border rounded-lg shadow-sm">
      <div className="flex flex-col gap-1 w-24">
        <div className="flex justify-between items-center text-[10px] font-bold">
          <span className="text-foreground-secondary uppercase tracking-wider">{data.plan}</span>
          <span className={isCritical ? "text-red-500" : "text-primary"}>
            {data.remaining} qoldi
          </span>
        </div>
        <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${isCritical ? 'bg-red-500' : 'bg-primary'}`} 
            style={{ width: `${percentage}%` }} 
          />
        </div>
      </div>
      <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
        <Zap className="w-3.5 h-3.5 text-primary fill-primary/20" />
      </div>
    </div>
  );
}
