"use client";

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
  FileSignature,
  FileCheck,
  FileSpreadsheet,
  Award,
  Clock,
  CheckCircle2,
  PenTool,
  PlusCircle,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Document } from "@prisma/client";

export function WelcomeWidget({
  user,
}: {
  user: { name?: string | null; avatar?: string | null };
}) {
  return (
    <div className="col-span-full mb-4">
      <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
        Xush kelibsiz, {user?.name?.split(" ")[0] || "Yaratuvchi"} 👋
      </h2>
      <p className="mt-2 text-lg font-light text-slate-400">
        Bugun qanday hujjat yaratasiz? AI yordamida professional hujjatlarni bir necha daqiqada
        tayyorlang.
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
  const items = [
    {
      title: "Rezyume",
      typeId: "resume",
      desc: "Ish izlash uchun professional rezyume",
      icon: FileText,
    },
    { title: "CV", typeId: "cv", desc: "Batafsil akademik yoki ilmiy CV", icon: FileBadge },
    {
      title: "Cover Letter",
      typeId: "cover-letter",
      desc: "Moslashtirilgan yozma murojaat",
      icon: FileSignature,
    },
    {
      title: "Ariza",
      typeId: "application",
      desc: "Rasmiy ish yoki o'qish arizasi",
      icon: Briefcase,
    },
    {
      title: "Hisobot",
      typeId: "report",
      desc: "Loyihalar va ish hisoboti",
      icon: FileSpreadsheet,
    },
    {
      title: "Shartnoma",
      typeId: "contract",
      desc: "Huquqiy va biznes shartnomalar",
      icon: FileCheck,
    },
    {
      title: "Sertifikat",
      typeId: "certificate",
      desc: "Yutuqlar va tasdiqlovchi hujjat",
      icon: Award,
    },
  ];

  return (
    <div className="col-span-full">
      <h3 className="mb-4 text-lg font-semibold tracking-tight text-white">Tezkor yaratish</h3>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {items.map((item, i) => (
          <Link key={i} href={`/dashboard/create/${item.typeId}`}>
            <motion.div
              whileHover={{ y: -2 }}
              className="group flex h-full cursor-pointer flex-col rounded-[20px] border border-white/5 bg-[#0a0f1c] p-5 transition-all hover:border-white/10 hover:bg-[#0f172a] hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800/50 text-slate-400 transition-colors group-hover:bg-cyan-500/10 group-hover:text-cyan-400">
                <item.icon className="h-5 w-5" />
              </div>
              <h4 className="mb-1 font-semibold text-white">{item.title}</h4>
              <p className="text-xs leading-relaxed font-light text-slate-400">{item.desc}</p>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function RecentDocumentsWidget({ documents = [] }: { documents?: Document[] }) {
  if (documents.length === 0) {
    return (
      <Card className="col-span-full flex flex-col items-center justify-center rounded-[24px] border border-white/5 bg-[#0a0f1c] p-12 text-center shadow-xl">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-500/5">
          <FileText className="h-10 w-10 text-cyan-400/50" />
        </div>
        <h3 className="mb-2 text-xl font-bold text-white">Hali hujjatlaringiz yo&apos;q</h3>
        <p className="mb-8 max-w-sm font-light text-slate-400">
          AI yordamida birinchi professional hujjatingizni bir necha daqiqada yarating.
        </p>
        <Link href="/dashboard/documents/new">
          <Button className="h-auto rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-8 py-6 text-white shadow-[0_0_20px_-5px_rgba(6,182,212,0.4)] transition-all hover:scale-105 hover:opacity-90">
            <PlusCircle className="mr-2 h-5 w-5" /> Yangi hujjat yaratish
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="col-span-full rounded-[24px] border border-white/5 bg-[#0a0f1c] p-6 shadow-xl lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <h3 className="text-lg font-semibold tracking-tight text-white">So&apos;nggi hujjatlar</h3>
        <Link
          href="/dashboard/documents"
          className="flex items-center gap-1 text-sm font-medium text-cyan-400 transition-colors hover:text-cyan-300"
        >
          Barchasini ko&apos;rish <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>

      <div className="grid gap-3">
        {documents.map((document) => {
          const statuses = [
            {
              label: "Completed",
              icon: CheckCircle2,
              color: "text-emerald-400",
              bg: "bg-emerald-400/10 border-emerald-400/20",
            },
            {
              label: "In progress",
              icon: PenTool,
              color: "text-blue-400",
              bg: "bg-blue-400/10 border-blue-400/20",
            },
            {
              label: "Draft",
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
