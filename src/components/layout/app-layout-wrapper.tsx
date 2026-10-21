"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Toaster } from "@/components/ui/toaster";
import { LimitPaywallModal } from "@/components/modals/limit-paywall-modal";
import { FeedbackWidget } from "@/components/modals/feedback-widget";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, X } from "lucide-react";
import React, { useEffect, useState } from "react";

export function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { toast } = useToast();
  const [showAuthToast, setShowAuthToast] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth") === "success") {
      params.delete("auth");
      const nextQuery = params.toString();
      const cleanUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}`;
      window.history.replaceState({}, "", cleanUrl);

      const showTimer = setTimeout(() => {
        setShowAuthToast(true);
        toast({
          title: "Tabriklaymiz, siz muvaffaqiyatli ro'yxatdan o'tdingiz!",
          description:
            "DocNova AI platformasining barcha imkoniyatlaridan foydalanishingiz mumkin.",
        });
      }, 0);
      const hideTimer = setTimeout(() => setShowAuthToast(false), 6000);
      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [pathname, toast]);

  const isDashboard =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/super-admin") ||
    pathname.startsWith("/tools");

  const authBanner = showAuthToast ? (
    <div className="fixed top-20 right-4 z-[90] flex max-w-md items-center gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-950/95 px-4 py-3.5 text-white shadow-2xl backdrop-blur-xl">
      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
      <p className="text-xs font-bold sm:text-sm">
        Tabriklaymiz, siz muvaffaqiyatli ro&apos;yxatdan o&apos;tdingiz!
      </p>
      <button
        type="button"
        onClick={() => setShowAuthToast(false)}
        className="ml-2 rounded-lg p-1 text-emerald-300 hover:bg-emerald-900/60 hover:text-white"
        aria-label="Yopish"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  ) : null;

  if (isDashboard) {
    return (
      <>
        {authBanner}
        <main className="w-full max-w-full min-w-0 flex-1 overflow-x-hidden">{children}</main>
        <LimitPaywallModal />
        <FeedbackWidget />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <Navbar />
      {authBanner}
      <main className="w-full max-w-full min-w-0 flex-1 overflow-x-hidden pt-16 md:pt-20">
        {children}
      </main>
      <LimitPaywallModal />
      <FeedbackWidget />
      <Toaster />
    </>
  );
}
