import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CreditCard, Activity, FileText } from "lucide-react";

export default async function AdminTelemetryPage() {
  const totalUsers = await prisma.user.count();
  const activeSubs = await prisma.subscription.count({ where: { status: "active" } });

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const transactions = await prisma.transaction.findMany({
    where: { status: "success", createdAt: { gte: monthStart } },
  });
  const mrr = transactions.reduce((acc, t) => acc + t.amount, 0);

  const totalApiLimit = await prisma.userApiLimit.aggregate({
    _sum: { count: true, pdfCount: true, cvCount: true, ieltsCount: true },
  });

  const totalTokens =
    (totalApiLimit._sum.count || 0) +
    (totalApiLimit._sum.cvCount || 0) +
    (totalApiLimit._sum.ieltsCount || 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-foreground text-3xl font-bold tracking-tight">Telemetry Overview</h2>
        <p className="text-foreground-secondary">Monitor system performance and revenue.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-surface border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="text-foreground-muted h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="text-foreground-muted h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubs}</div>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue This Month</CardTitle>
            <Activity className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mrr.toLocaleString()} UZS</div>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total AI Executions</CardTitle>
            <FileText className="text-primary h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTokens}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-surface border-border">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.slice(0, 5).map((t) => (
              <div
                key={t.id}
                className="border-border flex justify-between border-b py-2 last:border-0"
              >
                <span className="text-foreground-secondary text-sm">{t.provider}</span>
                <span className="text-sm font-bold">{t.amount} UZS</span>
              </div>
            ))}
            {transactions.length === 0 && (
              <p className="text-foreground-muted text-sm">No recent transactions.</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardHeader>
            <CardTitle>Top Services Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm">AI Generations</span>
                <span className="font-bold">{totalApiLimit._sum.count || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">CV Analyzer</span>
                <span className="font-bold">{totalApiLimit._sum.cvCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">IELTS Mock</span>
                <span className="font-bold">{totalApiLimit._sum.ieltsCount || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
