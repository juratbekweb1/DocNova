"use client";

import { useState } from "react";
import { FullDocument } from "@/hooks/useDocumentEditor";
import { LivePreview } from "./LivePreview";
import { Wand2, Layout, CheckCircle, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EditorRightPanel({ document }: { document: FullDocument }) {
  const [activeTab, setActiveTab] = useState<"preview" | "assistant">("preview");

  return (
    <div className="flex h-full flex-col bg-background text-white">
      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border p-4">
        <button
          onClick={() => setActiveTab("preview")}
          className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === "preview" ? "bg-white/10 text-white" : "text-foreground-secondary hover:text-slate-200"
          }`}
        >
          <Layout className="h-4 w-4" /> Preview
        </button>
        <button
          onClick={() => setActiveTab("assistant")}
          className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === "assistant" ? "bg-cyan-500/20 text-cyan-400" : "text-foreground-secondary hover:text-cyan-200"
          }`}
        >
          <Wand2 className="h-4 w-4" /> AI Assistant
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === "preview" ? (
          <div className="absolute inset-0 bg-[#0a0f1c]">
            <LivePreview document={document} />
          </div>
        ) : (
          <div className="h-full overflow-y-auto p-6 flex flex-col gap-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-cyan-500/20">
                <Wand2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">DocNova AI</h3>
                <p className="text-sm text-foreground-secondary">Your intelligent writing assistant.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface/80 p-5 shadow-inner">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                <CheckCircle className="h-4 w-4 text-emerald-400" /> ATS Optimization
              </h4>
              <p className="mb-4 text-xs leading-relaxed text-foreground-secondary">
                Your document is missing key industry terms. Improve the Experience section to boost your match rate.
              </p>
              <Button size="sm" className="w-full bg-white/5 text-white hover:bg-white/10 border border-border">
                Analyze Document
              </Button>
            </div>

            <div className="rounded-2xl border border-border bg-gradient-to-b from-cyan-950/30 to-slate-900/50 p-5">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-cyan-400">
                <Lightbulb className="h-4 w-4" /> Suggested Actions
              </h4>
              <div className="flex flex-col gap-2">
                {["Improve professional tone", "Fix grammar & spelling", "Expand bullet points", "Add metrics to experience"].map((action, i) => (
                  <button key={i} className="flex items-center gap-2 rounded-lg bg-black/20 px-3 py-2 text-left text-xs font-medium text-foreground-secondary transition-colors hover:bg-cyan-500/10 hover:text-cyan-300">
                    <Wand2 className="h-3 w-3 opacity-50" /> {action}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
