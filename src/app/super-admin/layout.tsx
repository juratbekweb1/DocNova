import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { isSuperAdminRole } from "@/lib/roles";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  let hasAccess = isSuperAdminRole(session.user.role);
  if (!hasAccess && session.user.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    hasAccess = isSuperAdminRole(dbUser?.role) || dbUser?.role === "ADMIN";
  }

  if (!hasAccess) {
    redirect("/dashboard?error=access_denied");
  }

  return (
    <div className="min-h-screen w-full bg-[#020817] text-white selection:bg-cyan-500/30 selection:text-white">
      {children}
    </div>
  );
}
