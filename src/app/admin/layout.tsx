import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Users, Tag, CreditCard, LogOut } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  // RBAC protection
  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    redirect("/dashboard?error=access_denied");
  }

  return (
    <div className="bg-background flex min-h-screen">
      {/* Sidebar */}
      <aside className="border-border bg-surface hidden w-64 flex-col border-r md:flex">
        <div className="border-border flex h-16 items-center border-b px-6">
          <span className="text-foreground text-xl font-bold">DocNova Admin</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            <li>
              <Link
                href="/admin"
                className="text-foreground hover:bg-surface-elevated flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium"
              >
                <LayoutDashboard className="h-4 w-4" /> Telemetry
              </Link>
            </li>
            <li>
              <Link
                href="/admin/pricing"
                className="text-foreground-secondary hover:text-foreground hover:bg-surface-elevated flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium"
              >
                <CreditCard className="h-4 w-4" /> Pricing Engine
              </Link>
            </li>
            <li>
              <Link
                href="/admin/promo"
                className="text-foreground-secondary hover:text-foreground hover:bg-surface-elevated flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium"
              >
                <Tag className="h-4 w-4" /> Promo Codes
              </Link>
            </li>
            <li>
              <Link
                href="/admin/users"
                className="text-foreground-secondary hover:text-foreground hover:bg-surface-elevated flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium"
              >
                <Users className="h-4 w-4" /> Users (CRM)
              </Link>
            </li>
          </ul>
        </nav>

        <div className="border-border border-t p-4">
          <Link
            href="/dashboard"
            className="text-foreground-secondary hover:text-foreground hover:bg-surface-elevated flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium"
          >
            <LogOut className="h-4 w-4" /> Exit Admin
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="border-border bg-surface flex h-16 items-center justify-between border-b px-6">
          <h1 className="text-foreground text-lg font-bold">Control Panel</h1>
          <div className="flex items-center gap-4">
            <span className="text-primary bg-primary/10 rounded-full px-3 py-1 text-sm font-medium">
              {session.user.role}
            </span>
          </div>
        </header>
        <div className="bg-background flex-1 overflow-y-auto p-6">{children}</div>
      </main>
    </div>
  );
}
