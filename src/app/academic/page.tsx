import React from "react";
import { ToolCard } from "@/components/tools/ToolCard";
import { GraduationCap, PencilRuler, BookOpen, Sparkles } from "lucide-react";

export default function AcademicHubPage() {
  const tools = [
    {
      title: "Kurs ishi generatori",
      description: "Strukturalangan akademik kurs ishlarini avtomatik yarating.",
      icon: GraduationCap,
      href: "/coursework",
      estimatedTime: "~5 min"
    },
    {
      title: "Referat va Mustaqil ish",
      description: "Mukammal referat va batafsil hisobotlar tayyorlang.",
      icon: PencilRuler,
      href: "/academic/essay-builder",
      estimatedTime: "~2 min"
    },
    {
      title: "Iqtiboslar generatori",
      description: "APA, MLA, Harvard va boshqa formatlarda iqtiboslarni avtomatik shakllantiring.",
      icon: BookOpen,
      href: "/academic/citations",
      estimatedTime: "~1 min"
    },
    {
      title: "Kurs ishidan Slaydga",
      description: "Kurs ishingiz asosida avtomatik PPTX taqdimotlar yarating.",
      icon: Sparkles,
      href: "/academic/coursework-to-slide",
      estimatedTime: "~3 min"
    }
  ];

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-extrabold text-foreground mb-2">Akademik Bo&apos;lim 🎓</h1>
        <p className="text-foreground-secondary mb-10">Kurs ishlari, referatlar va iqtiboslar uchun aqlli yordamchingiz.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool, idx) => (
            <ToolCard key={idx} {...tool} />
          ))}
        </div>
      </div>
    </div>
  );
}
