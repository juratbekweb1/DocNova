"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { SubPageHeader } from "@/components/layout/sub-page-header";

export function RootContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // List of paths that shouldn't use the marketing layout
  const isAppRoute =
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/register") ||
    pathname?.startsWith("/forgot-password") ||
    pathname?.startsWith("/reset-password");

  const isSubPage = !isAppRoute && pathname !== "/";

  return (
    <>
      {!isAppRoute && <Navbar />}
      <main className={!isAppRoute ? "flex-1 pt-20" : "flex h-full flex-1 flex-col"}>
        {isSubPage && <SubPageHeader />}
        {children}
      </main>
    </>
  );
}
