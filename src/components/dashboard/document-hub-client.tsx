"use client";

import { useState } from "react";
import { DocumentType, Document } from "@prisma/client";
import { motion } from "motion/react";
import {
  FileText,
  Briefcase,
  FileSignature,
  FileCheck,
  Award,
  FileSpreadsheet,
  PlusCircle,
  ArrowLeft,
  MoreVertical,
  Star,
  CheckCircle2,
  Clock,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createDocument } from "@/actions/document-actions";
import { useRouter } from "next/navigation";

const typeConfig: Record<
  DocumentType,
  { name: string; desc: string; icon: React.ElementType; color: string; bg: string }
> = {
  RESUME: {
    name: "Resume",
    desc: "Professional ATS-friendly resume",
    icon: FileText,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  CV: {
    name: "CV",
    desc: "Detailed academic or professional CV",
    icon: Briefcase,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  COVER_LETTER: {
    name: "Cover Letter",
    desc: "Persuasive application letter",
    icon: FileSignature,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  CONTRACT: {
    name: "Contract",
    desc: "Legal or business agreement",
    icon: FileCheck,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  CERTIFICATE: {
    name: "Certificate",
    desc: "Award or achievement document",
    icon: Award,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  APPLICATION: {
    name: "Application",
    desc: "Formal submission form",
    icon: FileText,
    color: "text-pink-400",
    bg: "bg-pink-500/10",
  },
  REPORT: {
    name: "Report",
    desc: "Business or academic report",
    icon: FileSpreadsheet,
    color: "text-rose-400",
    bg: "bg-rose-500/10",
  },
};

export function DocumentHubClient({
  type,
  recentDocuments,
}: {
  type: DocumentType;
  recentDocuments: Document[];
}) {
  const config = typeConfig[type];
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const docId = await createDocument(type, `Untitled ${config.name}`);
      router.push(`/dashboard/editor/${docId}`);
    } catch (e) {
      console.error(e);
      setIsCreating(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-7xl flex-1 space-y-10 p-4 text-slate-200 sm:p-6 md:p-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#0a0f1c] p-8 sm:p-12">
        <div className="pointer-events-none absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),transparent_70%)]" />

        <div className="relative z-10 flex flex-col justify-between gap-8 md:flex-row md:items-center">
          <div className="flex items-start gap-6">
            <div
              className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl ${config.bg} ${config.color} shadow-inner`}
            >
              <config.icon className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">{config.name}</h1>
              <p className="mt-2 max-w-md leading-relaxed font-light text-slate-400">
                {config.desc}. Create a new document or manage your existing ones below.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={handleCreate}
              disabled={isCreating}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-6 text-white shadow-[0_0_20px_-5px_rgba(6,182,212,0.4)] transition-all hover:scale-105 hover:opacity-90"
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              {isCreating ? "Creating..." : `New ${config.name}`}
            </Button>
            <Button
              variant="outline"
              className="rounded-xl border-white/10 bg-transparent px-6 py-6 text-white hover:bg-white/5"
            >
              <Wand2 className="mr-2 h-5 w-5 text-cyan-400" /> AI Generation
            </Button>
          </div>
        </div>
      </div>

      {/* Recent Documents Section */}
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-white">Recent {config.name}s</h2>
        </div>

        {recentDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[24px] border border-white/5 bg-[#0a0f1c] p-16 text-center shadow-xl">
            <div
              className={`mb-6 flex h-20 w-20 items-center justify-center rounded-full ${config.bg}`}
            >
              <config.icon className={`h-8 w-8 ${config.color} opacity-50`} />
            </div>
            <h3 className="mb-2 text-xl font-bold text-white">
              No {config.name.toLowerCase()}s yet
            </h3>
            <p className="mb-8 max-w-sm font-light text-slate-400">
              Start building your first {config.name.toLowerCase()} using our professional tools.
            </p>
            <Button
              onClick={handleCreate}
              disabled={isCreating}
              className="rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-8 py-6 text-white shadow-[0_0_20px_-5px_rgba(6,182,212,0.4)] transition-all hover:scale-105"
            >
              <PlusCircle className="mr-2 h-5 w-5" /> Create First {config.name}
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentDocuments.map((doc) => (
              <motion.div
                key={doc.id}
                whileHover={{ y: -4 }}
                className="group relative flex flex-col justify-between rounded-[20px] border border-white/5 bg-[#0a0f1c] p-6 shadow-sm transition-all hover:border-white/10 hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]"
              >
                <Link href={`/dashboard/editor/${doc.id}`} className="absolute inset-0 z-10" />

                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${config.bg} ${config.color} mb-4 transition-transform group-hover:scale-110`}
                  >
                    <config.icon className="h-6 w-6" />
                  </div>
                  <div className="relative z-20 flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-slate-500 hover:bg-white/5 hover:text-white"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-slate-500 hover:bg-white/5 hover:text-white"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-2">
                  <h3 className="line-clamp-1 font-semibold text-white transition-colors group-hover:text-cyan-400">
                    {doc.title}
                  </h3>
                  <div className="mt-2 flex items-center gap-3 text-xs font-light text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(doc.updatedAt).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      {doc.status.toLowerCase()}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
