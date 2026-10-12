"use client"

import * as React from "react"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, Search, LogOut, Settings, User as UserIcon, HelpCircle, PlusCircle, ChevronRight, Menu } from "lucide-react"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { LanguageToggle } from "@/components/ui/language-toggle"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useLanguage } from "@/components/providers/language-provider"

interface TopbarProps {
  onOpenMobileMenu?: () => void
}

export function Topbar({ onOpenMobileMenu }: TopbarProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const { t } = useLanguage()

  // Generate breadcrumb from pathname
  const paths = pathname.split('/').filter(p => p !== '')
  const pageTitle = paths.length > 1 
    ? paths[paths.length - 1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    : (pathname.startsWith('/admin') ? (t.adminPanelTitle || "Admin Panel") : (t.sidebarDashboard || "Boshqaruv paneli"))

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-surface/80 backdrop-blur-md px-4 md:px-6 shadow-sm">
      <div className="flex items-center gap-3 text-sm text-foreground-secondary">
        <button 
          onClick={onOpenMobileMenu}
          className="md:hidden p-1.5 -ml-1.5 rounded-md text-foreground-secondary hover:text-foreground hover:bg-border/50 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden sm:flex items-center gap-2">
          <span className="font-medium text-foreground-secondary">DocNova</span>
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium text-foreground">{pageTitle}</span>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-end space-x-4">
        <div className="relative w-full max-w-[280px] hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
          <Input
            type="search"
            placeholder={t.topbarSearch || "Hujjatlarni qidirish..."}
            className="w-full bg-surface-elevated border-border pl-9 text-sm text-foreground placeholder:text-foreground-muted focus-visible:bg-surface focus-visible:ring-1 focus-visible:ring-primary/50 rounded-full h-9 transition-all"
          />
        </div>

        {pathname.startsWith("/dashboard") && (
          <Link href="/dashboard/documents/new" className="hidden sm:flex items-center gap-1.5 rounded-full bg-primary hover:bg-primary/90 px-4 py-1.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:scale-[1.02] hover:shadow-[0_0_15px_-3px_rgba(245,158,11,0.4)] active:scale-[0.98]">
            <PlusCircle className="h-4 w-4" />
            {t.topbarNewDoc || "Yangi hujjat"}
          </Link>
        )}

        <ThemeToggle />
        <LanguageToggle />

        <button className="relative rounded-full p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-colors focus:outline-none">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 transition-transform hover:scale-105">
              <Avatar className="h-8 w-8 border border-white/10 shadow-sm">
                <AvatarImage src={session?.user?.avatar || session?.user?.image || ""} alt={session?.user?.name || ""} />
                <AvatarFallback className="bg-slate-800 text-xs text-slate-300">
                  {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-surface border-border text-foreground" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none text-foreground">{session?.user?.name || "Foydalanuvchi"}</p>
                <p className="text-xs leading-none text-foreground-secondary">
                  {session?.user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuGroup>
              <Link href="/dashboard/settings/profile">
                <DropdownMenuItem className="cursor-pointer focus:bg-surface-elevated focus:text-foreground">
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>{t.topbarProfile || "Profil"}</span>
                </DropdownMenuItem>
              </Link>
              <Link href="/dashboard/settings/account">
                <DropdownMenuItem className="cursor-pointer focus:bg-surface-elevated focus:text-foreground">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>{t.topbarSettings || "Sozlamalar"}</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem className="cursor-pointer focus:bg-surface-elevated focus:text-foreground">
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>{t.topbarHelp || "Yordam"}</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem className="cursor-pointer text-error focus:bg-error/10 focus:text-error" onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t.topbarLogout || "Tizimdan chiqish"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
