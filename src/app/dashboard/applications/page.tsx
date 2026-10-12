import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-options"
import { redirect } from "next/navigation"
import { Briefcase, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"

export default async function ApplicationsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  const columns = ["Saved", "Applied", "Interview", "Offer", "Rejected"]

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Application Tracker</h2>
          <p className="text-foreground-secondary mt-1">
            Track your job applications and interview progress.
          </p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> Add Application
        </Button>
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
        {columns.map((col) => (
          <div key={col} className="w-80 shrink-0 flex flex-col">
            <div className="mb-3 flex items-center justify-between px-1">
              <h3 className="font-semibold text-sm text-foreground-secondary uppercase tracking-wider">{col}</h3>
              <span className="bg-muted text-foreground-secondary text-xs px-2 py-0.5 rounded-full font-medium">0</span>
            </div>
            
            <div className="flex-1 bg-surface-muted/50 rounded-xl border border-border/50 p-3 flex flex-col gap-3 min-h-[200px]">
              {col === "Applied" && (
                <div className="bg-surface border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-grab">
                  <h4 className="font-semibold text-foreground">Senior Frontend Engineer</h4>
                  <p className="text-sm text-primary mb-3">Vercel</p>
                  
                  <div className="flex items-center gap-2 text-xs text-foreground-secondary">
                    <Briefcase className="h-3 w-3" />
                    <span>Applied 2 days ago</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                    <span className="text-xs bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded-md font-medium">
                      Senior Engineer Resume
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
