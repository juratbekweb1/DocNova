"use client";

import * as React from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Search,
  LogOut,
  Settings,
  User as UserIcon,
  HelpCircle,
  PlusCircle,
  ChevronRight,
  Menu,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLanguage } from "@/components/providers/language-provider";

interface TopbarProps {
  onOpenMobileMenu?: () => void;
}

export function Topbar({ onOpenMobileMenu }: TopbarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { t } = useLanguage();

  // Generate breadcrumb from pathname
  const paths = pathname.split("/").filter((p) => p !== "");
  const pageTitle =
    paths.length > 1
      ? paths[paths.length - 1].replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
      : pathname.startsWith("/admin")
        ? t.adminPanelTitle || "Admin Panel"
        : t.sidebarDashboard || "Boshqaruv paneli";

  return (
    <header className="border-border bg-surface/95 md:bg-surface/80 sticky top-0 z-40 flex h-14 items-center justify-between border-b px-4 shadow-sm md:px-6 md:backdrop-blur-md">
      <div className="text-foreground-secondary flex items-center gap-3 text-sm">
        <button
          onClick={onOpenMobileMenu}
          className="text-foreground-secondary hover:text-foreground hover:bg-border/50 -ml-1.5 rounded-md p-1.5 transition-colors md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden items-center gap-2 sm:flex">
          <span className="text-foreground-secondary font-medium">DocNova</span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">{pageTitle}</span>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-end space-x-4">
        <div className="relative hidden w-full max-w-[280px] md:block">
          <Search className="text-foreground-muted absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            type="search"
            placeholder={t.topbarSearch || "Hujjatlarni qidirish..."}
            className="bg-surface-elevated border-border text-foreground placeholder:text-foreground-muted focus-visible:bg-surface focus-visible:ring-primary/50 h-9 w-full rounded-full pl-9 text-sm transition-all focus-visible:ring-1"
          />
        </div>

        {pathname.startsWith("/dashboard") && (
          <Link
            href="/dashboard/documents/new"
            className="bg-primary hover:bg-primary/90 text-primary-foreground hidden items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium shadow-sm transition-all hover:scale-[1.02] hover:shadow-[0_0_15px_-3px_rgba(245,158,11,0.4)] active:scale-[0.98] sm:flex"
          >
            <PlusCircle className="h-4 w-4" />
            {t.topbarNewDoc || "Yangi hujjat"}
          </Link>
        )}

        <ThemeToggle />
        <LanguageToggle />

        <button className="relative rounded-full p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white focus:outline-none">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full p-0.5 transition-transform outline-none hover:scale-105 focus-visible:ring-2 focus-visible:ring-cyan-500">
              <Avatar className="h-8 w-8 border border-white/10 shadow-sm">
                <AvatarImage
                  src={session?.user?.avatar || session?.user?.image || ""}
                  alt={session?.user?.name || ""}
                />
                <AvatarFallback className="bg-slate-800 text-xs text-slate-300">
                  {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="bg-surface border-border text-foreground w-56"
            align="end"
            forceMount
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-foreground text-sm leading-none font-medium">
                  {session?.user?.name || "Foydalanuvchi"}
                </p>
                <p className="text-foreground-secondary text-xs leading-none">
                  {session?.user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuGroup>
              <Link href="/dashboard/settings/profile">
                <DropdownMenuItem className="focus:bg-surface-elevated focus:text-foreground cursor-pointer">
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>{t.topbarProfile || "Profil"}</span>
                </DropdownMenuItem>
              </Link>
              <Link href="/dashboard/settings/account">
                <DropdownMenuItem className="focus:bg-surface-elevated focus:text-foreground cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>{t.topbarSettings || "Sozlamalar"}</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem className="focus:bg-surface-elevated focus:text-foreground cursor-pointer">
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>{t.topbarHelp || "Yordam"}</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              className="text-error focus:bg-error/10 focus:text-error cursor-pointer"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t.topbarLogout || "Tizimdan chiqish"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
