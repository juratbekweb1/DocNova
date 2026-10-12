"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { Wand2, Edit3, AlignLeft, Sparkles, Languages, CheckSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export default function AIToolsPage() {
  const { t } = useLanguage();

  const tools = [
    {
      name: t.toolImproveWriting || "Improve Writing",
      desc: t.toolImproveWritingDesc || "Paste text and AI improves its professional tone.",
      icon: Edit3,
      href: "/academic/essay-builder",
    },
    {
      name: t.toolGenSummary || "Generate Summary",
      desc: t.toolGenSummaryDesc || "Generate a strong professional summary.",
      icon: AlignLeft,
      href: "/documents/resume-builder",
    },
    {
      name: t.toolGenExp || "Generate Experience",
      desc: t.toolGenExpDesc || "Turn simple notes into strong resume bullets.",
      icon: Sparkles,
      href: "/documents/resume-builder",
    },
    {
      name: t.toolGenCover || "Generate Cover Letter",
      desc: t.toolGenCoverDesc || "Generate a personalized cover letter.",
      icon: Wand2,
      href: "/documents/applications",
    },
    {
      name: t.toolAtsAnalyzer || "ATS Analyzer",
      desc: t.toolAtsAnalyzerDesc || "Analyze your resume against ATS requirements.",
      icon: CheckSquare,
      href: "/dashboard/ats-analyzer",
    },
    {
      name: t.toolTranslate || "Translate",
      desc: t.toolTranslateDesc || "Translate documents preserving professional tone.",
      icon: Languages,
      href: "/tools",
    },
  ];

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          {t.aiToolsTitle || "AI Tools Center"}
        </h2>
        <p className="text-foreground-secondary mt-1">
          {t.aiToolsDesc || "Supercharge your career documents with powerful AI assistants."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {tools.map((tool, i) => (
          <Link key={i} href={tool.href}>
            <Card className="p-6 premium-card cursor-pointer hover:border-primary/50 transition-colors group h-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <tool.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg text-foreground">{tool.name}</h3>
              </div>
              <p className="text-foreground-secondary text-sm">{tool.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
