import React from "react";
import { ToolCard } from "@/components/tools/ToolCard";
import { FileText, FileBadge, FileCode2 } from "lucide-react";

export default function DocumentsHubPage() {
  const tools = [
    {
      title: "Rasmiy arizalar",
      description: "Universitet va ish joyi uchun rasmiy ariza formalarini yarating.",
      icon: FileText,
      href: "/documents/applications",
      estimatedTime: "~2 min"
    },
    {
      title: "Rezyume (CV) Yaratuvchi",
      description: "Sanoqli daqiqalarda ATS talablariga mos rezyumelar yarating.",
      icon: FileBadge,
      href: "/documents/resume-builder",
      estimatedTime: "~5 min"
    },
    {
      title: "Standart Shablonlar",
      description: "Akademik formatlash uchun tayyor shablonlar.",
      icon: FileCode2,
      href: "/dashboard/templates",
      estimatedTime: "Instant"
    }
  ];

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-extrabold text-foreground mb-2">Hujjatlar Bo&apos;limi 📝</h1>
        <p className="text-foreground-secondary mb-10">Rasmiy arizalar, rezyumelar va akademik shablonlarni tayyorlang.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool, idx) => (
            <ToolCard key={idx} {...tool} />
          ))}
        </div>
      </div>
    </div>
  );
}
