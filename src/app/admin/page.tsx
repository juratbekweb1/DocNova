import { getSuperAdminSiteReport } from "@/lib/super-admin-analytics";
import { SuperAdminCommandCenter } from "@/components/admin/super-admin-command-center";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const report = await getSuperAdminSiteReport();

  return <SuperAdminCommandCenter report={report} />;
}
