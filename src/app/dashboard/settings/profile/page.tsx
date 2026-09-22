import { ProfileForm } from "@/components/dashboard/settings/profile-form"
import { PageHeader } from "@/components/shared/page-header"
import { TelegramIntegration } from "@/components/dashboard/settings/telegram-integration"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

export default async function SettingsProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { isTelegramLinked: true, telegramUsername: true }
  });

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Profile" 
        description="This is how others will see you on the site."
      />
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <ProfileForm />
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm mt-6">
        <TelegramIntegration 
          isLinked={user?.isTelegramLinked || false} 
          telegramUsername={user?.telegramUsername} 
        />
      </div>
    </div>
  )
}
