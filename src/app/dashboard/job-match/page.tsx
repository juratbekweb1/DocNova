import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-options"
import { redirect } from "next/navigation"
import { Briefcase, Search, Sparkles } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default async function JobMatchPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Job Match</h2>
        <p className="text-foreground-secondary mt-1">
          Compare your resume against a job description to find missing keywords and tailor your application.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <Card className="p-6 premium-card flex flex-col h-full">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Job Description</h3>
          </div>
          <p className="text-sm text-foreground-secondary mb-4">
            Paste the job description you are applying for to analyze your resume&apos;s compatibility.
          </p>
          <textarea 
            className="flex-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-foreground-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[300px] resize-none"
            placeholder="Paste job description here..."
          />
          <div className="mt-6 flex justify-end">
            <Button className="w-full sm:w-auto bg-primary">
              <Search className="mr-2 h-4 w-4" /> Analyze Match
            </Button>
          </div>
        </Card>

        <Card className="p-6 premium-card flex flex-col items-center justify-center text-center bg-surface-muted/30 border-dashed">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
            <Sparkles className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Ready to Analyze</h3>
          <p className="text-foreground-secondary text-sm max-w-sm mb-6">
            We&apos;ll compare your latest resume against the job description to calculate your match score and find missing keywords.
          </p>
          <div className="grid grid-cols-2 gap-4 w-full max-w-xs text-left">
            <div className="bg-surface p-3 rounded-lg border shadow-sm">
              <span className="block text-xs text-foreground-secondary">Resume Selected</span>
              <span className="font-medium text-sm truncate">Senior Designer</span>
            </div>
            <div className="bg-surface p-3 rounded-lg border shadow-sm">
              <span className="block text-xs text-foreground-secondary">Target Role</span>
              <span className="font-medium text-sm text-foreground-secondary italic">Pending</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
