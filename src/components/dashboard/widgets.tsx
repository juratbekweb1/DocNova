"use client";
import { useLanguage } from '@/components/providers/language-provider';

import Link from "next/link";
import { motion } from "motion/react";
import {
  FileText,
  Briefcase,
  Wand2,
  Trophy,
  FileBadge,
  MoreVertical,
  Star,
  Clock,
  CheckCircle2,
  PenTool,
  PlusCircle,
  GraduationCap,
  PencilRuler,
  Search,
  Sparkles,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Document } from "@prisma/client";

export function WelcomeWidget({
  user,
}: {
  user: { name?: string | null; avatar?: string | null };
}) {
  const { t } = useLanguage();

  return (
    <div className="col-span-full mb-4">
      <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        {t.welcomeGreeting || "Xush kelibsiz"}, {user?.name?.split(" ")[0] || "User"} 👋
      </h2>
      <p className="mt-2 text-lg font-light text-foreground-secondary">
        {t.welcomeSubtitle || "Bugun qanday hujjat yaratasiz? AI yordamida professional hujjatlarni bir necha daqiqada tayyorlang."}
      </p>
    </div>
  );
}

export function StatCardsWidget() {
  const stats = [
    {
      label: "Jami hujjatlar",
      value: "12",
      icon: FileText,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      label: "ATS Balli",
      value: "87",
      icon: Trophy,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20",
    },
    {
      label: "Arizalar",
      value: "24",
      icon: Briefcase,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      label: "AI Krediti",
      value: "68",
      icon: Wand2,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
      border: "border-violet-500/20",
    },
  ];

  return (
    <div className="col-span-full mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat, i) => (
        <Card
          key={i}
          className={`flex flex-col justify-between rounded-[20px] border bg-[#0a0f1c] p-6 ${stat.border} shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl`}
        >
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-slate-400">{stat.label}</p>
            <div className={`rounded-lg p-2 ${stat.bg} ${stat.color}`}>
              <stat.icon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{stat.value}</span>
            {stat.label === "ATS Balli" && (
              <span className="text-sm font-medium text-slate-500">/100</span>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

export function QuickCreateWidget() {
  const { t } = useLanguage();
  const items = [
    {
      title: t.toolCoursework || "Coursework Generator",
      typeId: "coursework",
      desc: t.toolCourseworkDesc || "Generate structured academic coursework automatically.",
      icon: GraduationCap,
      href: "/academic/coursework"
    },
    {
      title: t.toolEssay || "Essay / Report Builder",
      typeId: "ai-writer",
      desc: t.toolEssayDesc || "Build compelling essays and detailed reports.",
      icon: PencilRuler,
      href: "/academic/essay-builder"
    },
    {
      title: t.toolApplications || "Official Applications",
      typeId: "applications",
      desc: t.toolApplicationsDesc || "Generate official university and workplace application forms.",
      icon: FileText,
      href: "/documents/applications"
    },
    {
      title: t.toolSlides || "Coursework-to-Slide",
      typeId: "coursework-to-slide",
      desc: t.toolSlidesDesc || "Generate PPTX presentations from your coursework.",
      icon: Sparkles,
      href: "/academic/coursework-to-slide"
    },
    {
      title: t.toolPlagiarism || "Plagiarism Detector",
      typeId: "ai-detector",
      desc: t.toolPlagiarismDesc || "Scan your documents for plagiarism and AI text.",
      icon: Search,
      href: "/refinement/ai-detector"
    },
    {
      title: t.toolResume || "Resume Builder",
      typeId: "resume-builder",
      desc: t.toolResumeDesc || "Create ATS-friendly resumes in minutes.",
      icon: FileBadge,
      href: "/documents/resume-builder"
    },
  ];

  return (
    <div className="col-span-full">
      <h3 className="mb-4 text-lg font-semibold tracking-tight text-foreground">{t.quickCreateTitle || "Tezkor yaratish"}</h3>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {items.map((item, i) => (
          <Link key={i} href={item.href}>
            <motion.div
              whileHover={{ y: -2 }}
              className="group flex h-full cursor-pointer flex-col rounded-[20px] border border-border bg-surface p-5 transition-all hover:border-primary/50 hover:bg-surface-elevated hover:shadow-lg"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <item.icon className="h-5 w-5" />
              </div>
              <h4 className="mb-1 font-semibold text-foreground">{item.title}</h4>
              <p className="text-xs leading-relaxed font-light text-foreground-secondary">{item.desc}</p>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function RecentDocumentsWidget({ documents = [] }: { documents?: Document[] }) {
  const { t } = useLanguage();

  if (documents.length === 0) {
    return (
      <Card className="col-span-full flex flex-col items-center justify-center rounded-[24px] border border-border bg-surface p-12 text-center shadow-xl">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
          <FileText className="h-10 w-10 text-primary" />
        </div>
        <h3 className="mb-2 text-xl font-bold text-foreground">{t.noDocsTitle || "Hali hujjatlaringiz yo'q"}</h3>
        <p className="mb-8 max-w-sm font-light text-foreground-secondary">
          {t.noDocsDesc || "AI yordamida birinchi professional hujjatingizni bir necha daqiqada yarating."}
        </p>
        <Link href="/dashboard/documents/new">
          <Button className="h-auto rounded-full bg-primary hover:bg-primary/90 px-8 py-4 text-primary-foreground shadow-lg transition-all hover:scale-105">
            <PlusCircle className="mr-2 h-5 w-5" /> {t.createNewDoc || "Yangi hujjat yaratish"}
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="col-span-full rounded-[24px] border border-border bg-surface p-6 shadow-xl lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">{t.recentDocsTitle || "So'nggi hujjatlar"}</h3>
        <Link
          href="/dashboard/documents"
          className="flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:underline"
        >
          {t.viewAll || "Barchasini ko'rish"} <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>

      <div className="grid gap-3">
        {documents.map((document) => {
          const statuses = [
            {
              label: t.statusCompleted || "Completed",
              icon: CheckCircle2,
              color: "text-emerald-400",
              bg: "bg-emerald-400/10 border-emerald-400/20",
            },
            {
              label: t.statusInProgress || "In progress",
              icon: PenTool,
              color: "text-blue-400",
              bg: "bg-blue-400/10 border-blue-400/20",
            },
            {
              label: t.statusDraft || "Draft",
              icon: Clock,
              color: "text-slate-400",
              bg: "bg-slate-400/10 border-slate-400/20",
            },
          ];
          const status =
            document.status === "PUBLISHED"
              ? statuses[0]
              : document.status === "DRAFT"
                ? statuses[2]
                : statuses[1];

          return (
            <div
              key={document.id}
              className="group flex flex-col justify-between rounded-xl border border-white/5 bg-slate-900/40 p-4 transition-all hover:border-white/10 hover:bg-slate-800/60 sm:flex-row sm:items-center"
            >
              <div className="flex items-center gap-4">
                <div className="relative hidden h-12 w-10 shrink-0 items-center justify-center overflow-hidden rounded border border-white/10 bg-slate-800 shadow-sm sm:flex">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                  <FileText className="relative z-10 h-4 w-4 text-cyan-400/50" />
                </div>
                <div className="flex-1 space-y-1">
                  <Link
                    href={`/dashboard/editor/${document.id}`}
                    className="decoration-cyan-400/50 hover:underline"
                  >
                    <p className="font-medium text-slate-200 transition-colors group-hover:text-white">
                      {document.title}
                    </p>
                  </Link>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" /> {document.type.replace("_", " ")}
                    </span>
                    <span>•</span>
                    <span>Updated {document.updatedAt.toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-6 sm:mt-0 sm:justify-end">
                <div
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium tracking-wider uppercase ${status.bg} ${status.color}`}
                >
                  <status.icon className="h-3 w-3" />
                  {status.label}
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 hover:bg-white/5 hover:text-white"
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 hover:bg-white/5 hover:text-white"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
