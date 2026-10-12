import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserSubscription } from "@/lib/billing/subscription";
import { getDocuments } from "@/actions/document-actions";

import {
  WelcomeWidget,
  QuickCreateWidget,
  RecentDocumentsWidget,
} from "@/components/dashboard/widgets";
import { OverviewCards } from "@/components/dashboard/overview-cards";

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

  const maxAi =
    subscription.planSlug === "premium" ? "Unlimited" : subscription.planSlug === "pro" ? 25 : 5;
  const maxCv =
    subscription.planSlug === "premium" ? "Unlimited" : subscription.planSlug === "pro" ? 10 : 2;
  const maxIelts =
    subscription.planSlug === "premium" ? "Unlimited" : subscription.planSlug === "pro" ? 5 : 0;

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 space-y-8 p-4 sm:p-6 md:p-8 lg:p-12">
      <WelcomeWidget user={session.user} />

      {/* Overview & Analytics Header */}
      <OverviewCards
        subscription={subscription}
        limitsCount={limits?.count}
        maxAi={maxAi}
        cvCount={limits?.cvCount}
        maxCv={maxCv}
        ieltsCount={limits?.ieltsCount}
        maxIelts={maxIelts}
      />

      <QuickCreateWidget />
      <RecentDocumentsWidget documents={documents.slice(0, 3)} />
    </div>
  );
}
