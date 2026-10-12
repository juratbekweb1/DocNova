"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import React from "react";

export function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const isDashboard = 
    pathname.startsWith('/dashboard') || 
    pathname.startsWith('/admin') || 
    pathname.startsWith('/super-admin') || 
    pathname.startsWith('/tools');

  if (isDashboard) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-16 md:pt-20">{children}</main>
    </>
  );
}
