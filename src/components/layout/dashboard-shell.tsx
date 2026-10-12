"use client"

import * as React from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"

import { usePathname } from "next/navigation"

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const pathname = usePathname()
  const [prevPathname, setPrevPathname] = React.useState(pathname)

  if (pathname !== prevPathname) {
    setPrevPathname(pathname)
    setIsMobileMenuOpen(false)
  }

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-background">
      {/* Premium Animated Background */}
      <div className="dashboard-animated-bg">
        <div className="dashboard-orb dashboard-orb-1" />
        <div className="dashboard-orb dashboard-orb-2" />
        <div className="dashboard-orb dashboard-orb-3" />
      </div>

      {/* Content layer */}
      <div className="relative z-10 flex h-full w-full">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex h-full shrink-0">
          <Sidebar />
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
              onClick={() => setIsMobileMenuOpen(false)} 
            />
            <div className="relative z-50 flex h-full w-64 flex-col overflow-hidden shadow-2xl animate-in slide-in-from-left duration-300">
              <Sidebar />
            </div>
          </div>
        )}

        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
