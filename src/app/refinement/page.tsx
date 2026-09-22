import React from "react";
import { ToolCard } from "@/components/tools/ToolCard";
import { Search, SpellCheck2 } from "lucide-react";

export default function RefinementHubPage() {
  const tools = [
    {
      title: "Plagiat va AI Detektor",
      description: "Hujjatlaringizni plagiat va AI aralashuviga tekshiring.",
      icon: Search,
      href: "/refinement/ai-detector",
      estimatedTime: "~1 min"
    },
    {
      title: "Matnni qayta shakllantirish (Humanizer)",
      description: "AI yozgan matnni tabiiy inson tiliga o'tkazish va detektorlarni chetlab o'tish.",
      icon: SpellCheck2,
      href: "/refinement/paraphraser",
      estimatedTime: "~2 min"
    }
  ];

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-extrabold text-foreground mb-2">Tahrirlash va Tekshirish 🔍</h1>
        <p className="text-foreground-secondary mb-10">Plagiatga tekshirish, sun&apos;iy intellekt matnini aniqlash va insoniylashtirish.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool, idx) => (
            <ToolCard key={idx} {...tool} />
          ))}
        </div>
      </div>
    </div>
  );
}
