import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserSubscription } from "@/lib/billing/subscription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, CreditCard } from "lucide-react";

export default async function BillingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const subscription = await getUserSubscription(session.user.id);
  const transactions = await prisma.transaction.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 space-y-8 p-4 sm:p-6 md:p-8 lg:p-12">
      <div>
        <h2 className="text-foreground text-3xl font-extrabold tracking-tight sm:text-4xl">
          Billing & Subscription
        </h2>
        <p className="text-foreground-secondary mt-2 text-lg font-light">
          Manage your plan, payment methods, and invoices.
        </p>
      </div>

      <Card className="bg-surface border-border overflow-hidden">
        <div className="from-primary absolute top-0 h-1 w-full bg-gradient-to-r to-blue-500" />
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h3 className="text-foreground text-2xl font-bold capitalize">
                {subscription.planSlug || "Free"}
              </h3>
              <p className="text-foreground-secondary mt-1">
                {subscription.isPremium
                  ? "You have full access to all premium features."
                  : "Upgrade to unlock unlimited features."}
              </p>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" className="border-border">
                Cancel Plan
              </Button>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Upgrade Plan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-foreground-secondary bg-surface-elevated text-xs uppercase">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Provider</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-border hover:bg-surface-elevated/50 border-b">
                    <td className="px-6 py-4">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-bold">{t.amount} UZS</td>
                    <td className="px-6 py-4 capitalize">
                      <div className="flex items-center gap-2">
                        <CreditCard className="text-foreground-muted h-4 w-4" />
                        {t.provider}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-bold ${t.status === "success" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary hover:bg-primary/10"
                      >
                        <Download className="mr-2 h-4 w-4" /> Receipt
                      </Button>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-foreground-muted px-6 py-8 text-center">
                      No transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
