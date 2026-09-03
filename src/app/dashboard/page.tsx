import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserSubscription } from "@/lib/billing/subscription";
import { format } from "date-fns";
import { getDocuments } from "@/actions/document-actions";

import {
  WelcomeWidget,
  QuickCreateWidget,
  RecentDocumentsWidget,
} from "@/components/dashboard/widgets";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Sparkles, FileText, GraduationCap } from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const [subscription, limits, documents] = await Promise.all([
    getUserSubscription(session.user.id),
    prisma.userApiLimit.findUnique({ where: { userId: session.user.id } }),
    getDocuments(),
  ]);

  // Example limits mapping based on plan slug
  const maxAi =
    subscription.planSlug === "premium" ? "Unlimited" : subscription.planSlug === "pro" ? 25 : 5;
  const maxCv =
    subscription.planSlug === "premium" ? "Unlimited" : subscription.planSlug === "pro" ? 10 : 2;
  const maxIelts =
    subscription.planSlug === "premium" ? "Unlimited" : subscription.planSlug === "pro" ? 5 : 0;

  const formatLimit = (used: number = 0, max: number | "Unlimited") =>
    max === "Unlimited" ? "∞" : `${used} / ${max}`;

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 space-y-8 p-4 sm:p-6 md:p-8 lg:p-12">
      <WelcomeWidget user={session.user} />

      {/* Overview & Analytics Header */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-surface border-border relative overflow-hidden">
          <div className="from-primary/10 pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent" />
          <CardContent className="relative z-10 flex h-full flex-col items-center justify-center p-6 text-center">
            <Shield className="text-primary mb-2 h-8 w-8" />
            <p className="text-foreground-secondary mb-1 text-sm font-medium">Active Plan</p>
            <h3 className="text-foreground text-2xl font-bold capitalize">
              {subscription.planSlug || "Free"}
            </h3>
            {subscription.expiresAt && (
              <p className="text-foreground-muted mt-2 text-xs">
                Expires: {format(new Date(subscription.expiresAt), "MMM d, yyyy")}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardContent className="flex h-full flex-col justify-center p-6">
            <div className="mb-4 flex items-start justify-between">
              <p className="text-foreground-secondary text-sm font-medium">AI Generations</p>
              <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
            <h3 className="text-foreground text-3xl font-bold">
              {formatLimit(limits?.count, maxAi)}
            </h3>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardContent className="flex h-full flex-col justify-center p-6">
            <div className="mb-4 flex items-start justify-between">
              <p className="text-foreground-secondary text-sm font-medium">CV Analyzer</p>
              <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <h3 className="text-foreground text-3xl font-bold">
              {formatLimit(limits?.cvCount, maxCv)}
            </h3>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardContent className="flex h-full flex-col justify-center p-6">
            <div className="mb-4 flex items-start justify-between">
              <p className="text-foreground-secondary text-sm font-medium">IELTS Mocks</p>
              <div className="rounded-lg bg-violet-500/10 p-2 text-violet-400">
                <GraduationCap className="h-4 w-4" />
              </div>
            </div>
            <h3 className="text-foreground text-3xl font-bold">
              {formatLimit(limits?.ieltsCount, maxIelts)}
            </h3>
          </CardContent>
        </Card>
      </div>

      <QuickCreateWidget />
      <RecentDocumentsWidget documents={documents.slice(0, 3)} />
    </div>
  );
}
