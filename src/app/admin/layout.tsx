import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { isAdminRole } from "@/lib/roles";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  // RBAC protection
  if (!isAdminRole(session.user.role)) {
    redirect("/dashboard?error=access_denied");
  }

  return <DashboardShell>{children}</DashboardShell>;
}
