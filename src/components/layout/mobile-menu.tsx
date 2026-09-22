"use client";

import * as React from "react";
import { useState } from "react";
import { Menu, LogOut, User, Shield } from "lucide-react";
import { MobileDrawer } from "./mobile-drawer";
import { NavLinks } from "./nav-links";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";
import { useLanguage } from "@/components/providers/language-provider";
import { isAdminRole, isSuperAdminRole } from "@/lib/roles";

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();
  const { t } = useLanguage();

  return (
    <div className="md:hidden flex items-center">
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 -mr-2 rounded-md text-foreground-secondary hover:text-foreground hover:bg-surface-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label="Open mobile menu"
        aria-expanded={isOpen}
      >
        <Menu className="w-6 h-6" />
      </button>

      <MobileDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} side="right">
        <div className="flex flex-col gap-6 h-full">
          <NavLinks 
            className="flex-col items-start gap-4 w-full" 
            itemClassName="w-full text-base py-2 border-b border-border/10"
            onLinkClick={() => setIsOpen(false)} 
          />
          <div className="flex flex-col gap-3 mt-auto pb-4">
            {session ? (
              <>
                <Link
                  href={
                    isSuperAdminRole((session.user as Record<string, unknown>)?.role)
                      ? "/super-admin"
                      : isAdminRole((session.user as Record<string, unknown>)?.role)
                        ? "/admin"
                        : "/dashboard"
                  }
                  onClick={() => setIsOpen(false)}
                  className="w-full"
                >
                  <Button variant="outline" className="w-full justify-center gap-2">
                    {isAdminRole((session.user as Record<string, unknown>)?.role) ? (
                      <Shield className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                    {isSuperAdminRole((session.user as Record<string, unknown>)?.role)
                      ? "Super Admin Panel"
                      : isAdminRole((session.user as Record<string, unknown>)?.role)
                        ? "Admin Panel"
                        : t.dashboard || "Dashboard"}
                  </Button>
                </Link>
                <Button 
                  variant="destructive" 
                  className="w-full justify-center gap-2"
                  onClick={() => {
                    setIsOpen(false);
                    signOut({ callbackUrl: "/login" });
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  {t.logout}
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setIsOpen(false)} className="w-full">
                  <Button variant="ghost" className="w-full justify-center">
                    {t.login}
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setIsOpen(false)} className="w-full">
                  <Button className="w-full justify-center">
                    {t.getStarted}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </MobileDrawer>
    </div>
  );
}
