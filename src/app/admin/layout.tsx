import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { isAdminRole } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  let hasAccess = isAdminRole(session.user.role);
  if (!hasAccess && session.user.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    hasAccess = isAdminRole(dbUser?.role);
  }

  if (!hasAccess) {
    redirect("/dashboard?error=access_denied");
  }

  return <DashboardShell>{children}</DashboardShell>;
}
