"use client";

import React from "react";
import { useRecentTool } from "@/hooks/useRecentTool";
import { FileText, Wand2, Search, ArrowRight, LayoutTemplate, Sparkles, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ResumeBuilderPage() {
  useRecentTool("resume-builder", "Resume Builder", "Tools Hub", "/tools/resume-builder");

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground-secondary hover:text-foreground hover:bg-surface-elevated transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Boshqaruv paneli
          </Link>
        </div>

        <div className="flex flex-col items-center justify-center text-center mt-6">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 mb-6 text-primary">
            <FileText className="h-10 w-10" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
            Rezyume (CV) Yaratuvchi
          </h1>
          <p className="text-base sm:text-lg text-foreground-secondary max-w-2xl mb-10">
            Sanoqli daqiqalarda xalqaro ATS talablariga mos, professional va chiroyli rezyume yarating. Interaktiv konstruktordan foydalaning yoki AI yordamida shakllantiring.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-8">
            {/* Option 1: Direct CV Builder */}
            <div className="bg-surface border-2 border-primary/40 shadow-lg rounded-2xl p-6 flex flex-col justify-between items-center text-center hover:border-primary hover:-translate-y-1 transition-all">
              <div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                  <LayoutTemplate className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Interaktiv Konstruktor</h3>
                <p className="text-xs text-foreground-secondary mb-6 leading-relaxed">
                  Har bir bo&apos;limni qadam-baqadam to&apos;ldiring, real vaqtda dizaynni ko&apos;ring va PDF yuklab oling.
                </p>
              </div>
              <Link href="/cv-builder" className="w-full">
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md">
                  Konstruktorni ochish <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Option 2: AI Auto-Generate */}
            <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col justify-between items-center text-center hover:border-primary/50 hover:-translate-y-1 transition-all">
              <div>
                <div className="h-12 w-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto mb-4">
                  <Wand2 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">AI bilan Yaratish</h3>
                <p className="text-xs text-foreground-secondary mb-6 leading-relaxed">
                  Tajribangiz va yo&apos;nalishingiz haqida qisqacha ma&apos;lumot bering, AI barchasini tayyorlaydi.
                </p>
              </div>
              <Link href="/dashboard/documents/new" className="w-full">
                <Button variant="outline" className="w-full border-border bg-surface-elevated hover:bg-border/50 text-foreground">
                  <Sparkles className="mr-1.5 h-4 w-4 text-primary" /> AI Generator
                </Button>
              </Link>
            </div>

            {/* Option 3: Templates Gallery */}
            <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col justify-between items-center text-center hover:border-primary/50 hover:-translate-y-1 transition-all">
              <div>
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-4">
                  <Search className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Shablonlar To&apos;plami</h3>
                <p className="text-xs text-foreground-secondary mb-6 leading-relaxed">
                  Barcha kasblar va OTM bitiruvchilari uchun moslashtirilgan tayyor dizaynlarni tanlang.
                </p>
              </div>
              <Link href="/dashboard/templates" className="w-full">
                <Button variant="outline" className="w-full border-border bg-surface-elevated hover:bg-border/50 text-foreground">
                  Shablonlarni ko&apos;rish
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
