"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, Briefcase, FileSignature, FileCheck, 
  Award, FileSpreadsheet, FilePlus, 
  Wand2, LayoutTemplate, PenTool, ChevronLeft, Loader2
} from "lucide-react";
import { createDocument } from "@/actions/document-actions";
import { useRouter } from "next/navigation";
import { DocumentType } from "@prisma/client";

const types = [
  { id: "RESUME", name: "Resume", icon: FileText, desc: "Professional ATS-friendly resume" },
  { id: "CV", name: "CV", icon: Briefcase, desc: "Detailed academic or professional CV" },
  { id: "COVER_LETTER", name: "Cover Letter", icon: FileSignature, desc: "Persuasive application letter" },
  { id: "CONTRACT", name: "Contract", icon: FileCheck, desc: "Legal or business agreement" },
  { id: "CERTIFICATE", name: "Certificate", icon: Award, desc: "Award or achievement document" },
  { id: "APPLICATION", name: "Application", icon: FilePlus, desc: "Formal submission form" },
  { id: "REPORT", name: "Report", icon: FileSpreadsheet, desc: "Business or academic report" },
];

export function NewDocumentFlow() {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState<typeof types[0] | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const handleTypeSelect = (type: typeof types[0]) => {
    setSelectedType(type);
    setStep(2);
  };

  const handleCreate = async (_method: 'scratch' | 'template' | 'ai') => {
    if (!selectedType) return;
    setIsCreating(true);
    
    try {
      // For now, all methods create a blank document and route to editor
      // In the future, 'template' or 'ai' can pass query params
      const docId = await createDocument(selectedType.id as DocumentType, `Untitled ${selectedType.name}`);
      router.push(`/dashboard/editor/${docId}`);
    } catch (error) {
      console.error(error);
      setIsCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl pt-8 pb-16">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <div className="text-center">
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">What are you creating?</h1>
              <p className="mt-3 text-lg text-slate-400 font-light">Choose a document type to get started.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {types.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => handleTypeSelect(type)}
                    className="group text-left relative flex flex-col items-start rounded-[20px] border border-white/5 bg-[#0a0f1c] p-6 transition-all hover:-translate-y-1 hover:border-white/10 hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]"
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-slate-400 transition-colors group-hover:bg-cyan-500/10 group-hover:text-cyan-400">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mb-1.5 text-base font-semibold text-white">{type.name}</h3>
                    <p className="text-xs text-slate-400 font-light leading-relaxed">{type.desc}</p>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {step === 2 && selectedType && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8 max-w-3xl mx-auto"
          >
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setStep(1)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                  <selectedType.icon className="h-8 w-8 text-cyan-400" />
                  {selectedType.name}
                </h1>
                <p className="mt-1 text-slate-400 font-light">How would you like to build this?</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 pt-4">
              {/* Scratch */}
              <button
                onClick={() => handleCreate('scratch')}
                disabled={isCreating}
                className="group relative flex flex-col items-center text-center rounded-[24px] border border-white/5 bg-[#0a0f1c] p-8 transition-all hover:-translate-y-1 hover:border-white/10 hover:bg-surface hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-400 transition-colors group-hover:bg-slate-700 group-hover:text-white">
                  <PenTool className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">Start from scratch</h3>
                <p className="text-xs text-slate-400 font-light">Blank canvas to build your own structure.</p>
              </button>

              {/* Template */}
              <button
                onClick={() => handleCreate('template')}
                disabled={isCreating}
                className="group relative flex flex-col items-center text-center rounded-[24px] border border-white/5 bg-[#0a0f1c] p-8 transition-all hover:-translate-y-1 hover:border-white/10 hover:bg-surface hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 transition-colors group-hover:bg-blue-500/20 group-hover:text-blue-300">
                  <LayoutTemplate className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">Use a template</h3>
                <p className="text-xs text-slate-400 font-light">Start with a professionally designed layout.</p>
              </button>

              {/* AI Generation */}
              <button
                onClick={() => handleCreate('ai')}
                disabled={isCreating}
                className="relative overflow-hidden group flex flex-col items-center text-center rounded-[24px] border border-cyan-500/30 bg-gradient-to-b from-cyan-900/20 to-[#020617] p-8 transition-all hover:-translate-y-1 hover:border-cyan-400/50 hover:shadow-[0_0_40px_-10px_rgba(34,211,238,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/25 transition-transform group-hover:scale-110">
                  {isCreating ? <Loader2 className="h-6 w-6 animate-spin" /> : <Wand2 className="h-6 w-6" />}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">Generate with AI</h3>
                <p className="text-xs text-cyan-100/70 font-light">Fastest way to get a complete draft.</p>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
