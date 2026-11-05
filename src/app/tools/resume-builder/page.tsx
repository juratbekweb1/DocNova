"use client";

import React from "react";
import { useRecentTool } from "@/hooks/useRecentTool";
import { FileText, Wand2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ResumeBuilderPage() {
  useRecentTool('resume-builder', 'Resume Builder', 'Tools Hub', '/tools/resume-builder');

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center text-center mt-16">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 border border-primary/20 mb-6">
          <FileText className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-4xl font-extrabold text-foreground mb-4">Resume Builder</h1>
        <p className="text-lg text-foreground-secondary max-w-2xl mb-12">
          Create an ATS-friendly resume in minutes. Choose from our professional templates or let our AI build one for you from scratch.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mb-8">
          <div className="bg-surface border-2 border-primary/40 shadow-lg rounded-2xl p-6 flex flex-col justify-between items-center text-center hover:border-primary hover:-translate-y-1 transition-all">
            <div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Interaktiv Konstruktor</h3>
              <p className="text-xs text-foreground-secondary mb-6 leading-relaxed">
                Har bir bo'limni qadam-baqadam to'ldiring, real vaqtda dizaynni ko'ring va PDF yuklab oling.
              </p>
            </div>
            <Link href="/cv-builder" className="w-full">
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md">
                Konstruktorni ochish
              </Button>
            </Link>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col justify-between items-center text-center hover:border-primary/50 hover:-translate-y-1 transition-all">
            <div>
              <div className="h-12 w-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto mb-4">
                <Wand2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">AI Auto-Generate</h3>
              <p className="text-xs text-foreground-secondary mb-6 leading-relaxed">
                Just paste your LinkedIn profile or tell us about your experience, and AI will do the rest.
              </p>
            </div>
            <Link href="/dashboard/documents/new" className="w-full">
              <Button variant="outline" className="w-full border-border bg-surface-elevated hover:bg-border/50 text-foreground">
                Generate with AI
              </Button>
            </Link>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col justify-between items-center text-center hover:border-primary/50 hover:-translate-y-1 transition-all">
            <div>
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-4">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Start from a Template</h3>
              <p className="text-xs text-foreground-secondary mb-6 leading-relaxed">
                Browse our collection of ATS-optimized designs and customize them to fit your style.
              </p>
            </div>
            <Link href="/dashboard/templates" className="w-full">
              <Button variant="outline" className="w-full border-border bg-surface-elevated hover:bg-border/50 text-foreground">
                Browse Templates
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
