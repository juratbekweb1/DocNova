"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Toaster } from "@/components/ui/toaster";
import { LimitPaywallModal } from "@/components/modals/limit-paywall-modal";
import { FeedbackWidget } from "@/components/modals/feedback-widget";
import { toast as sonnerToast, Toaster as SonnerToaster } from "sonner";
import React, { useEffect } from "react";
import { useSession } from "next-auth/react";

export function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { status } = useSession();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detect if we just arrived with ?auth=success OR ?error=...
    const params = new URLSearchParams(window.location.search);
    const authStatus = params.get("auth");
    const authError = params.get("error");

    if (authStatus === "success" && status === "authenticated") {
      params.delete("auth");
      const nextQuery = params.toString();
      const cleanUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}`;
      window.history.replaceState({}, "", cleanUrl);

      // TASK 3: Color-coded Green notification for Success Login/Register
      sonnerToast.success(
        "Tabriklaymiz! Siz muvaffaqiyatli ro'yxatdan o'tdingiz / tizimga kirdingiz",
        {
          duration: 5000,
          style: {
            backgroundColor: "#065f46",
            color: "#ffffff",
            borderColor: "#10b981",
          },
        }
      );
    } else if (authError) {
      params.delete("error");
      const nextQuery = params.toString();
      const cleanUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}`;
      window.history.replaceState({}, "", cleanUrl);

      // TASK 3: Color-coded Red notification for Auth Error
      sonnerToast.error("Xatolik yuz berdi. Qayta urinib ko'ring", {
        duration: 5000,
        style: {
          backgroundColor: "#7f1d1d",
          color: "#ffffff",
          borderColor: "#ef4444",
        },
      });
    }
  }, [pathname, status]);

  const isDashboard =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/super-admin") ||
    pathname.startsWith("/tools");

  return (
    <>
      {!isDashboard && <Navbar />}
      <main
        className={`w-full max-w-full min-w-0 flex-1 overflow-x-hidden ${
          !isDashboard ? "pt-16 md:pt-20" : ""
        }`}
      >
        {children}
      </main>
      <LimitPaywallModal />
      <FeedbackWidget />
      <Toaster />
      {/* Top Sonner Toaster for Color-Coded Notifications */}
      <SonnerToaster
        position="top-center"
        richColors
        closeButton
        theme="dark"
        toastOptions={{
          className: "text-xs sm:text-sm font-semibold rounded-2xl shadow-2xl",
        }}
      />
    </>
  );
}
