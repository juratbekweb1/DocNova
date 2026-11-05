import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { HelpSupportCenter } from "@/components/support/help-support-center";

export const dynamic = "force-dynamic";

export default async function DashboardHelpPage() {
  const session = await getServerSession(authOptions);

  return (
    <HelpSupportCenter
      defaultName={session?.user?.name}
      defaultEmail={session?.user?.email}
    />
  );
}
