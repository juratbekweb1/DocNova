import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminSettingsPage() {
  const [userCount, documentCount, activePlanCount] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.document.count({ where: { deletedAt: null } }),
    prisma.plan.count({ where: { isActive: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-foreground text-3xl font-bold tracking-tight">System Settings</h2>
        <p className="text-foreground-secondary">Review the current platform configuration.</p>
      </div>

      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle>Platform Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="border-border bg-background rounded-md border p-4">
            <p className="text-foreground-secondary text-sm">Active users</p>
            <p className="mt-1 text-2xl font-bold">{userCount}</p>
          </div>
          <div className="border-border bg-background rounded-md border p-4">
            <p className="text-foreground-secondary text-sm">Documents</p>
            <p className="mt-1 text-2xl font-bold">{documentCount}</p>
          </div>
          <div className="border-border bg-background rounded-md border p-4">
            <p className="text-foreground-secondary text-sm">Active plans</p>
            <p className="mt-1 text-2xl font-bold">{activePlanCount}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
