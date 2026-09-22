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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          <div className="bg-surface border border-border rounded-2xl p-8 flex flex-col items-center text-center hover:border-primary/50 hover:-translate-y-1 transition-all">
            <Search className="h-10 w-10 text-foreground-muted mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">Start from a Template</h3>
            <p className="text-sm text-foreground-secondary mb-8">Browse our collection of ATS-optimized designs and customize them to fit your style.</p>
            <Link href="/dashboard/templates" className="w-full">
              <Button className="w-full bg-surface-elevated hover:bg-border/50 text-foreground border border-border">
                Browse Templates
              </Button>
            </Link>
          </div>
          
          <div className="bg-surface border-2 border-primary/50 shadow-[0_0_30px_-5px_rgba(56,189,248,0.2)] rounded-2xl p-8 flex flex-col items-center text-center hover:-translate-y-1 transition-all">
            <Wand2 className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">AI Auto-Generate</h3>
            <p className="text-sm text-foreground-secondary mb-8">Just paste your LinkedIn profile or tell us about your experience, and AI will do the rest.</p>
            <Link href="/dashboard/documents/new" className="w-full">
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/25">
                Generate with AI
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
