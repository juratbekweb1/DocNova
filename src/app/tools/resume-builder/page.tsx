"use client";

import React from "react";
import { useRecentTool } from "@/hooks/useRecentTool";
import { FileText, Wand2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ResumeBuilderPage() {
  useRecentTool("resume-builder", "Resume Builder", "Tools Hub", "/tools/resume-builder");

  return (
    <div className="bg-background min-h-screen px-6 py-12">
      <div className="mx-auto mt-16 flex max-w-4xl flex-col items-center justify-center text-center">
        <div className="bg-primary/10 border-primary/20 mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full border">
          <FileText className="text-primary h-10 w-10" />
        </div>
        <h1 className="text-foreground mb-4 text-4xl font-extrabold">Resume Builder</h1>
        <p className="text-foreground-secondary mb-12 max-w-2xl text-lg">
          Create an ATS-friendly resume in minutes. Choose from our professional templates or let
          our AI build one for you from scratch.
        </p>

        <div className="mb-8 grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          <div className="bg-surface border-primary/40 hover:border-primary flex flex-col items-center justify-between rounded-2xl border-2 p-6 text-center shadow-lg transition-all hover:-translate-y-1">
            <div>
              <div className="bg-primary/10 text-primary mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-foreground mb-2 text-lg font-bold">Interaktiv Konstruktor</h3>
              <p className="text-foreground-secondary mb-6 text-xs leading-relaxed">
                {
                  "Har bir bo'limni qadam-baqadam to'ldiring, real vaqtda dizaynni ko'ring va PDF yuklab oling."
                }
              </p>
            </div>
            <Link href="/cv-builder" className="w-full">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground w-full font-bold shadow-md">
                Konstruktorni ochish
              </Button>
            </Link>
          </div>

          <div className="bg-surface border-border hover:border-primary/50 flex flex-col items-center justify-between rounded-2xl border p-6 text-center transition-all hover:-translate-y-1">
            <div>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                <Wand2 className="h-6 w-6" />
              </div>
              <h3 className="text-foreground mb-2 text-lg font-bold">AI Auto-Generate</h3>
              <p className="text-foreground-secondary mb-6 text-xs leading-relaxed">
                Just paste your LinkedIn profile or tell us about your experience, and AI will do
                the rest.
              </p>
            </div>
            <Link href="/dashboard/documents/new" className="w-full">
              <Button
                variant="outline"
                className="border-border bg-surface-elevated hover:bg-border/50 text-foreground w-full"
              >
                Generate with AI
              </Button>
            </Link>
          </div>

          <div className="bg-surface border-border hover:border-primary/50 flex flex-col items-center justify-between rounded-2xl border p-6 text-center transition-all hover:-translate-y-1">
            <div>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="text-foreground mb-2 text-lg font-bold">Start from a Template</h3>
              <p className="text-foreground-secondary mb-6 text-xs leading-relaxed">
                Browse our collection of ATS-optimized designs and customize them to fit your style.
              </p>
            </div>
            <Link href="/dashboard/templates" className="w-full">
              <Button
                variant="outline"
                className="border-border bg-surface-elevated hover:bg-border/50 text-foreground w-full"
              >
                Browse Templates
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
