import { prisma } from "@/lib/prisma";
import { AdminDashboardClient } from "./admin-dashboard-client";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const totalUsers = await prisma.user.count();
  const activeSubs = await prisma.subscription.count({ where: { status: "active" } });

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const transactions = await prisma.transaction.findMany({
    where: { status: "success", createdAt: { gte: monthStart } },
    orderBy: { createdAt: "desc" },
  });
  const mrr = transactions.reduce((acc, t) => acc + t.amount, 0);

  const totalApiLimit = await prisma.userApiLimit.aggregate({
    _sum: { count: true, pdfCount: true, cvCount: true, ieltsCount: true },
  });

  const totalTokens =
    (totalApiLimit._sum.count || 0) +
    (totalApiLimit._sum.cvCount || 0) +
    (totalApiLimit._sum.ieltsCount || 0);

  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, name: true, email: true, createdAt: true, role: true },
  });

  const securityLogs = await prisma.securityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  return (
    <AdminDashboardClient
      totalUsers={totalUsers}
      activeSubs={activeSubs}
      mrr={mrr}
      totalTokens={totalTokens}
      recentUsers={recentUsers}
      transactions={transactions}
      securityLogs={securityLogs}
    />
  );
}
