import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { HelpSupportCenter } from "@/components/support/help-support-center";

export const dynamic = "force-dynamic";

export default async function HelpPage() {
  const session = await getServerSession(authOptions);

  const content = (
    <HelpSupportCenter
      defaultName={session?.user?.name}
      defaultEmail={session?.user?.email}
    />
  );

  if (session?.user) {
    return <DashboardShell>{content}</DashboardShell>;
  }

  return <div className="min-h-screen bg-slate-950 pt-4">{content}</div>;
}
