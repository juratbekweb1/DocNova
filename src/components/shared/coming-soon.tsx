import { Construction } from "lucide-react"

interface ComingSoonProps {
  title: string
  description?: string
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-6">
        <Construction className="h-10 w-10 text-primary" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight mb-2">{title}</h2>
      <p className="text-foreground-secondary max-w-sm">
        {description ||
          "This feature is currently under active development. We're working hard to bring this to you soon."}
      </p>
    </div>
  )
}
