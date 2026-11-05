"use client";

import React, { useState } from "react";
import { Compass, Copy, Check } from "lucide-react";
import { isIOS, isInAppBrowser, getInAppBrowserName } from "@/lib/in-app-browser";

export function InAppBrowserNotice() {
  const isClient = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [copied, setCopied] = useState(false);

  const showNotice = isClient && isIOS() && isInAppBrowser();
  const appName = showNotice ? getInAppBrowserName() : null;

  if (!showNotice) return null;

  const handleCopy = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="text-foreground mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs shadow-sm">
      <div className="flex items-start gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500">
          <Compass className="h-4 w-4" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-500">
              iPhone da Google orqali 1-klikda kirish
            </span>
            {appName && (
              <span className="rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                {appName}
              </span>
            )}
          </div>
          <p className="text-foreground-secondary text-[11px] leading-relaxed">
            {appName || "Ilova"} ichida Google parolingizni so&apos;ramasligi uchun sahifani{" "}
            <strong className="text-foreground">Safari</strong> brauzerida oching.
          </p>
          <p className="text-foreground-muted text-[10px]">
            👉 Pastki o&apos;ng burchakdagi <strong className="text-foreground">🧭 Safari</strong>{" "}
            belgisini yoki yuqoridagi <strong className="text-foreground">⋯</strong> menyusini
            bosing.
          </p>
          <div className="pt-1.5">
            <button
              type="button"
              onClick={handleCopy}
              className="border-border bg-surface text-foreground hover:bg-surface-elevated inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-500" />
                  <span className="text-emerald-500">Havola nusxalandi!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Safari uchun havolani nusxalash</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
