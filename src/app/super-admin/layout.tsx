import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-options"
import { isSuperAdminRole } from "@/lib/roles"
import { DashboardShell } from "@/components/layout/dashboard-shell"

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  if (!isSuperAdminRole(session.user.role)) {
    redirect("/dashboard?error=access_denied")
  }

  return <DashboardShell>{children}</DashboardShell>
}
