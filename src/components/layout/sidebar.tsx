"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "motion/react";
import {
  FileText,
  LayoutDashboard,
  Settings,
  Star,
  PlusCircle,
  Wand2,
  HelpCircle,
  Users,
  Tag,
  CreditCard,
  LogOut,
  ShieldAlert,
  Search,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/language-provider";
import { useSubscription } from "@/components/providers/subscription-provider";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t } = useLanguage();
  const { features } = useSubscription();

  const userRole = (session?.user as Record<string, unknown> | undefined)?.role as
    | string
    | undefined;
  const isSuperOrAdmin =
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN" ||
    Boolean(features?.unlimited);

  const userNavigation = [
    { name: t.sidebarDashboard || "Boshqaruv paneli", href: "/dashboard", icon: LayoutDashboard },
    ...(isSuperOrAdmin
      ? [
          {
            name: userRole === "SUPER_ADMIN" ? "Super Admin Markazi" : "Admin Markazi",
            href: userRole === "SUPER_ADMIN" ? "/super-admin" : "/admin",
            icon: ShieldAlert,
          },
        ]
      : []),
    {
      name: t.sidebarStudents || t.sidebarCoursework || "Talabalar uchun",
      href: "/academic",
      icon: GraduationCap,
    },
    { name: t.sidebarDocuments || "Hujjatlar", href: "/documents", icon: FileText },
    { name: t.sidebarAts || "ATS Tahlili", href: "/dashboard/ats-analyzer", icon: Search },
    { name: t.sidebarRefinement || "Tahrirlash", href: "/refinement", icon: Wand2 },
    { name: t.sidebarSaved || "Saqlangan hujjatlar", href: "/dashboard/documents", icon: Star },
  ];

  const adminNavigation = [
    { name: "Monitoring & Boshqaruv", href: "/super-admin", icon: LayoutDashboard },
    { name: "AI Tokenlar & Xarajatlar", href: "/admin/ai-analytics", icon: Sparkles },
    { name: "Foydalanuvchilar (CRM)", href: "/admin/users", icon: Users },
    { name: "Tariflar va Narxlar", href: "/admin/pricing", icon: CreditCard },
    { name: "Promo Kodlar", href: "/admin/promo", icon: Tag },
    { name: "Yaratilgan Hujjatlar", href: "/admin/resumes", icon: FileText },
    { name: "Tizim Sozlamalari", href: "/admin/settings", icon: Settings },
  ];

  const superAdminNavigation = adminNavigation;

  let topNavigation = userNavigation;
  let title = "DocNova";

  if (pathname.startsWith("/super-admin")) {
    topNavigation = superAdminNavigation;
    title = t.superAdminTitle || "Super Admin";
  } else if (pathname.startsWith("/admin")) {
    topNavigation = adminNavigation;
    title = t.adminPanelTitle || "Admin Panel";
  }

  const isDashboardRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/help") ||
    pathname === "/academic" ||
    pathname === "/coursework" ||
    pathname === "/documents" ||
    pathname === "/refinement";

  const bottomNavigation = isDashboardRoute
    ? [
        {
          name: t.sidebarSettings || "Settings & Profile",
          href: "/dashboard/settings/profile",
          icon: Settings,
        },
        { name: t.sidebarHelp || "Help & Support", href: "/help", icon: HelpCircle },
      ]
    : [{ name: t.adminExitDashboard || "Exit to Dashboard", href: "/dashboard", icon: LogOut }];

  return (
    <div className="border-border bg-background text-foreground-secondary flex h-full w-64 flex-col border-r">
      <div className="mt-2 flex h-14 items-center px-6">
        <Link href="/" className="text-foreground flex items-center gap-2.5 text-lg font-bold">
          <div className="from-primary to-accent text-primary-foreground shadow-primary/20 flex h-7 w-7 items-center justify-center rounded bg-gradient-to-br text-[10px] shadow-lg">
            DN
          </div>
          <span className="tracking-tight">{title}</span>
        </Link>
      </div>

      {isDashboardRoute && (
        <div className="mt-8 px-4">
          <Link href="/dashboard/documents/new">
            <button className="bg-primary text-primary-foreground flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm transition-all hover:scale-[1.02] hover:shadow-[0_0_15px_-3px_rgba(56,189,248,0.4)] active:scale-[0.98]">
              <PlusCircle className="h-4 w-4" />
              {t.topbarNewDoc || "Yangi hujjat"}
            </button>
          </Link>
        </div>
      )}

      <div className="flex-1 overflow-auto py-6">
        <nav className="grid items-start gap-1 px-3">
          {topNavigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" &&
                item.href !== "/admin" &&
                item.href !== "/super-admin" &&
                pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group hover:text-foreground relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive ? "text-foreground" : "text-foreground-secondary hover:bg-border/50"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="bg-border/40 absolute inset-0 rounded-md"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 350,
                      damping: 30,
                    }}
                  />
                )}
                <item.icon
                  className={cn(
                    "relative z-10 h-4 w-4",
                    isActive
                      ? "text-primary"
                      : "text-foreground-muted group-hover:text-foreground-secondary"
                  )}
                />
                <span className="relative z-10">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto px-3 pb-4">
        <nav className="grid items-start gap-1">
          {bottomNavigation.map((item) => {
            const isActive = pathname.startsWith(item.href) && item.href !== "/dashboard";
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group hover:text-foreground relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive ? "text-foreground" : "text-foreground-secondary hover:bg-border/50"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="bg-border/40 absolute inset-0 rounded-md"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 350,
                      damping: 30,
                    }}
                  />
                )}
                <item.icon
                  className={cn(
                    "relative z-10 h-4 w-4",
                    isActive
                      ? "text-primary"
                      : "text-foreground-muted group-hover:text-foreground-secondary"
                  )}
                />
                <span className="relative z-10">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-border mt-4 flex items-center gap-3 border-t px-3 pt-4">
          <Avatar className="border-border h-8 w-8 rounded-md border shadow-sm">
            <AvatarImage
              src={session?.user?.avatar || session?.user?.image || ""}
              alt={session?.user?.name || ""}
            />
            <AvatarFallback className="bg-surface-elevated text-foreground-secondary rounded-md text-xs">
              {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col truncate">
            <span className="text-foreground truncate text-sm font-medium">
              {session?.user?.name || "User"}
            </span>
            <span className="text-foreground-muted truncate text-xs">{session?.user?.email}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
