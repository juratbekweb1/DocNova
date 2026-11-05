import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserSubscription } from "@/lib/billing/subscription";
import { getAllUserSectionLimits } from "@/lib/limits";
import { getDocuments } from "@/actions/document-actions";
import { getSuperAdminSiteReport } from "@/lib/super-admin-analytics";
import { SuperAdminCommandCenter } from "@/components/admin/super-admin-command-center";

import {
  WelcomeWidget,
  QuickCreateWidget,
  RecentDocumentsWidget,
} from "@/components/dashboard/widgets";
import { OverviewCards } from "@/components/dashboard/overview-cards";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const [dbUser, subscription, limits, sectionLimits, documents] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    }),
    getUserSubscription(session.user.id),
    prisma.userApiLimit.findUnique({ where: { userId: session.user.id } }),
    getAllUserSectionLimits(session.user.id),
    getDocuments(),
  ]);

  const isSuperOrAdmin =
    dbUser?.role === "SUPER_ADMIN" ||
    dbUser?.role === "ADMIN" ||
    session.user.role === "SUPER_ADMIN" ||
    session.user.role === "ADMIN" ||
    Boolean(subscription.features?.unlimited);

  const adminReport = isSuperOrAdmin ? await getSuperAdminSiteReport() : null;

  const courseworkStat = sectionLimits.find((s) => s.id === "coursework");
  const docGenStat = sectionLimits.find((s) => s.id === "document_generation");
  const cvStat = sectionLimits.find((s) => s.id === "resume_analysis");
  const mockStat = sectionLimits.find((s) => s.id === "mock_test");

  const maxAi = docGenStat?.unlimited
    ? "Unlimited"
    : (docGenStat?.total ??
      (subscription.planSlug === "premium" ? 100 : subscription.planSlug === "pro" ? 30 : 3));
  const maxCv = cvStat?.unlimited
    ? "Unlimited"
    : (cvStat?.total ??
      (subscription.planSlug === "premium" ? 30 : subscription.planSlug === "pro" ? 10 : 1));
  const maxIelts = mockStat?.unlimited
    ? "Unlimited"
    : (mockStat?.total ??
      (subscription.planSlug === "premium" ? 30 : subscription.planSlug === "pro" ? 10 : 1));

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 space-y-8 p-4 sm:p-6 lg:p-8">
      <WelcomeWidget user={session.user} />

      {/* Overview & Section-by-Section Limit Statistics */}
      <OverviewCards
        subscription={subscription}
        limitsCount={docGenStat?.used ?? limits?.count ?? 0}
        maxAi={maxAi}
        cvCount={cvStat?.used ?? limits?.cvCount ?? 0}
        maxCv={maxCv}
        ieltsCount={mockStat?.used ?? limits?.ieltsCount ?? 0}
        maxIelts={maxIelts}
        courseworkUsed={courseworkStat?.used ?? 0}
        courseworkMax={courseworkStat?.unlimited ? "Unlimited" : (courseworkStat?.total ?? 3)}
        sectionLimits={sectionLimits}
      />

      {isSuperOrAdmin && adminReport ? (
        <SuperAdminCommandCenter report={adminReport} embedded />
      ) : (
        <>
          <QuickCreateWidget />
          <RecentDocumentsWidget documents={documents.slice(0, 3)} />
        </>
      )}
    </div>
  );
}
