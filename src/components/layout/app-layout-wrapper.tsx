"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import React from "react";

export function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isDashboard =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/super-admin") ||
    pathname.startsWith("/tools");

  if (isDashboard) {
    return <main className="w-full max-w-full min-w-0 flex-1 overflow-x-hidden">{children}</main>;
  }

  return (
    <>
      <Navbar />
      <main className="w-full max-w-full min-w-0 flex-1 overflow-x-hidden pt-16 md:pt-20">
        {children}
      </main>
    </>
  );
}
