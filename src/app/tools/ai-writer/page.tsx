"use client";

import React, { useState } from "react";
import { useRecentTool } from "@/hooks/useRecentTool";
import { PencilRuler, Sparkles, Loader2, Copy, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UpgradeModal } from "@/components/modals/upgrade-modal";

export default function AiWriterPage() {
  useRecentTool("ai-writer", "AI Writer", "Tools Hub", "/tools/ai-writer");

  const [prompt, setPrompt] = useState("");
  const [action, setAction] = useState("write");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/writer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, action }),
      });

      const data = await res.json();

      if (res.status === 403) {
        if (data.upgradeMessage) setUpgradeMessage(data.upgradeMessage);
        setShowUpgrade(true);
        setIsGenerating(false);
        return;
      }

      if (!res.ok) throw new Error("Failed to generate");

      if (data.warningMessage) {
        alert(data.warningMessage);
      }
      setResult(data.result);
    } catch (error) {
      console.error(error);
      alert("Something went wrong during generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    alert("Copied to clipboard!");
  };

  return (
    <div className="bg-background min-h-screen px-6 py-12">
      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        customMessage={upgradeMessage}
      />

      <div className="mx-auto mt-12 flex max-w-4xl flex-col items-center justify-center">
        <div className="bg-primary/10 border-primary/20 mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl border">
          <PencilRuler className="text-primary h-10 w-10" />
        </div>
        <h1 className="text-foreground mb-4 text-center text-4xl font-extrabold">AI Writer Pro</h1>
        <p className="text-foreground-secondary mb-12 max-w-2xl text-center text-lg">
          Draft, improve, or summarize text instantly. Choose your action and let the AI do the
          heavy lifting.
        </p>

        <div className="bg-surface border-border mb-12 w-full rounded-3xl border p-8 shadow-lg">
          <div className="mb-6 flex gap-4">
            <button
              onClick={() => setAction("write")}
              className={`flex-1 rounded-xl py-3 text-sm font-bold transition-colors ${action === "write" ? "bg-primary text-primary-foreground" : "bg-background border-border text-foreground-secondary hover:text-foreground border"}`}
            >
              Write from scratch
            </button>
            <button
              onClick={() => setAction("improve")}
              className={`flex-1 rounded-xl py-3 text-sm font-bold transition-colors ${action === "improve" ? "bg-primary text-primary-foreground" : "bg-background border-border text-foreground-secondary hover:text-foreground border"}`}
            >
              Improve Text
            </button>
            <button
              onClick={() => setAction("summarize")}
              className={`flex-1 rounded-xl py-3 text-sm font-bold transition-colors ${action === "summarize" ? "bg-primary text-primary-foreground" : "bg-background border-border text-foreground-secondary hover:text-foreground border"}`}
            >
              Summarize
            </button>
          </div>

          <div className="space-y-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                action === "write"
                  ? "E.g. Write an email to my boss asking for a 1-week vacation..."
                  : "Paste your text here..."
              }
              className="bg-background border-border text-foreground focus:border-primary/50 focus:ring-primary/50 h-40 w-full resize-none rounded-xl border p-4 text-sm outline-none focus:ring-1"
            />

            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="bg-primary hover:bg-primary/90 text-primary-foreground flex w-full items-center justify-center gap-2 rounded-xl py-6 text-base font-bold shadow-[0_0_20px_-5px_rgba(56,189,248,0.4)] disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" /> Generate
                </>
              )}
            </Button>
          </div>
        </div>

        {result && (
          <div className="animate-in fade-in slide-in-from-bottom-8 bg-surface-elevated border-primary/20 relative w-full overflow-hidden rounded-3xl border p-8 shadow-2xl duration-700">
            <div className="bg-primary/10 absolute top-0 right-0 h-32 w-32 rounded-full blur-3xl" />

            <div className="border-border mb-6 flex items-center justify-between border-b pb-4">
              <h3 className="text-foreground flex items-center gap-2 text-xl font-bold">
                <Sparkles className="text-primary h-5 w-5" /> Generated Output
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setResult("");
                    setPrompt("");
                  }}
                  className="border-border h-8 hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-500"
                >
                  <Eraser className="mr-1.5 h-4 w-4" /> Clear
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className="border-border h-8"
                >
                  <Copy className="mr-1.5 h-4 w-4" /> Copy
                </Button>
              </div>
            </div>

            <div className="text-foreground-secondary text-sm leading-relaxed whitespace-pre-wrap">
              {result}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
