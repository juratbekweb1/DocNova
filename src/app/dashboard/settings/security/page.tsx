import { SecurityForm } from "@/components/dashboard/settings/security-form"
import { PageHeader } from "@/components/shared/page-header"

export default function SettingsSecurityPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Security" 
        description="Manage your password, two-factor authentication, and account security."
      />
      <div className="rounded-xl border bg-surface shadow-sm">
        <SecurityForm />
      </div>
    </div>
  )
}
