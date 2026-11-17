"use client";

import React from "react";
import { Loader2, CloudUpload } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBytesCompact } from "@/lib/storage/direct-upload-shared";

export interface UploadProgressBarProps {
  /** 0 to 100 */
  percentage: number;
  label: string;
  loadedBytes?: number;
  totalBytes?: number;
  indeterminate?: boolean;
  className?: string;
}

export function UploadProgressBar({
  percentage,
  label,
  loadedBytes,
  totalBytes,
  indeterminate = false,
  className,
}: UploadProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(percentage)));

  return (
    <div
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn(
        "border-primary/25 bg-primary/5 w-full space-y-2 rounded-xl border p-3.5 text-xs",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-foreground flex min-w-0 items-center gap-2 font-semibold">
          {indeterminate ? (
            <Loader2 className="text-primary h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <CloudUpload className="text-primary h-4 w-4 shrink-0 animate-pulse" />
          )}
          <span className="truncate">{label}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-[11px] font-bold">
          {typeof loadedBytes === "number" &&
            typeof totalBytes === "number" &&
            totalBytes > 0 &&
            !indeterminate && (
              <span className="text-foreground-muted font-medium">
                {formatBytesCompact(loadedBytes)} / {formatBytesCompact(totalBytes)}
              </span>
            )}
          <span className="text-primary tabular-nums">{indeterminate ? "..." : `${clamped}%`}</span>
        </div>
      </div>

      <div className="bg-surface-elevated h-2 w-full overflow-hidden rounded-full">
        {indeterminate ? (
          <div className="bg-primary/80 h-full w-1/2 animate-pulse rounded-full transition-all duration-300" />
        ) : (
          <div
            className="bg-primary h-full rounded-full transition-all duration-200 ease-out"
            style={{ width: `${Math.max(clamped, 4)}%` }}
          />
        )}
      </div>
    </div>
  );
}
