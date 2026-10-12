import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-options"
import { redirect } from "next/navigation"
import { ArrowUpCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default async function ScorePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  // Example placeholder for the UI
  const overallScore = 87
  const categories = [
    { name: "ATS Compatibility", score: 94 },
    { name: "Content Quality", score: 88 },
    { name: "Keywords", score: 82 },
    { name: "Experience", score: 90 },
    { name: "Formatting", score: 96 },
  ]

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Resume Score</h2>
          <p className="text-foreground-secondary mt-1">
            Analyze your resume against industry standards and ATS algorithms.
          </p>
        </div>
        <Button className="bg-primary text-primary-foreground">
          Analyze New Document
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
        <Card className="p-8 premium-card flex flex-col items-center justify-center text-center">
          <div className="relative h-48 w-48 mb-6">
            <svg className="h-full w-full" viewBox="0 0 100 100">
              <circle className="text-muted stroke-current" strokeWidth="8" cx="50" cy="50" r="40" fill="transparent" />
              <circle className="text-amber-500 stroke-current" strokeWidth="8" strokeLinecap="round" cx="50" cy="50" r="40" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * overallScore) / 100} transform="rotate(-90 50 50)" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold text-foreground">{overallScore}</span>
              <span className="text-sm font-medium text-foreground-secondary">/ 100</span>
            </div>
          </div>
          <h3 className="text-xl font-bold">Good Score</h3>
          <p className="text-sm text-foreground-secondary mt-2">
            Your resume is in the top 20% of applicants, but there&apos;s room for improvement in keywords.
          </p>
          <Button className="mt-6 w-full gap-2">
            <ArrowUpCircle className="h-4 w-4" /> Improve with AI
          </Button>
        </Card>

        <div className="col-span-1 md:col-span-2 space-y-6">
          <Card className="p-6 premium-card h-full flex flex-col justify-between">
            <h3 className="font-semibold text-lg mb-6">Detailed Breakdown</h3>
            <div className="space-y-6">
              {categories.map((cat, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-2 font-medium">
                    <span>{cat.name}</span>
                    <span className={cat.score >= 90 ? "text-emerald-500" : cat.score >= 80 ? "text-amber-500" : "text-red-500"}>
                      {cat.score}
                    </span>
                  </div>
                  <Progress value={cat.score} className="h-2" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
