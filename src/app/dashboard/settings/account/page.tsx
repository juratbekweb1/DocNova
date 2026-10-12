import { AccountForm } from "@/components/dashboard/settings/account-form"
import { PageHeader } from "@/components/shared/page-header"

export default function SettingsAccountPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Account" 
        description="Manage your account security and email settings."
      />
      <div className="rounded-xl border bg-surface p-6 shadow-sm">
        <AccountForm />
      </div>
    </div>
  )
}
