"use client";

import React, { useState } from "react";
import { useRecentTool } from "@/hooks/useRecentTool";
import { Briefcase, FileText, Wand2, Loader2, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UpgradeModal } from "@/components/modals/upgrade-modal";

export default function CoverLetterPage() {
  useRecentTool("cover-letter", "Cover Letter", "Tools Hub", "/tools/cover-letter");

  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [skills, setSkills] = useState("");
  const [tone, setTone] = useState("Professional and confident");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");

  const handleGenerate = async () => {
    if (!role || !company) return;

    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, company, skills, tone }),
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
        alert(data.warningMessage); // Or use toast if available
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

  const downloadText = () => {
    const element = document.createElement("a");
    const file = new Blob([result], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `Cover_Letter_${company}.txt`;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  };

  return (
    <div className="bg-background min-h-screen px-6 py-12">
      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        customMessage={upgradeMessage}
      />

      <div className="mx-auto mt-12 flex max-w-6xl flex-col gap-12 md:flex-row">
        {/* Input Form */}
        <div className="flex-1 space-y-8">
          <div>
            <div className="bg-primary/10 border-primary/20 mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl border">
              <Briefcase className="text-primary h-8 w-8" />
            </div>
            <h1 className="text-foreground mb-4 text-4xl font-extrabold">Cover Letter AI</h1>
            <p className="text-foreground-secondary mb-8 text-lg">
              Generate a highly tailored cover letter in seconds. Just paste the job description and
              your skills.
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-foreground text-sm font-bold">Job Title *</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                className="bg-surface-elevated border-border text-foreground focus:border-primary/50 focus:ring-primary/50 w-full rounded-xl border px-4 py-3 text-sm transition-all focus:ring-1 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-foreground text-sm font-bold">Company Name *</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Google"
                className="bg-surface-elevated border-border text-foreground focus:border-primary/50 focus:ring-primary/50 w-full rounded-xl border px-4 py-3 text-sm transition-all focus:ring-1 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-foreground text-sm font-bold">
                Key Skills / Job Description
              </label>
              <textarea
                rows={4}
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="Paste your top skills or the job requirements here..."
                className="bg-surface-elevated border-border text-foreground focus:border-primary/50 focus:ring-primary/50 w-full resize-none rounded-xl border px-4 py-3 text-sm transition-all focus:ring-1 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-foreground text-sm font-bold">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="bg-surface-elevated border-border text-foreground focus:border-primary/50 focus:ring-primary/50 w-full rounded-xl border px-4 py-3 text-sm transition-all focus:ring-1 focus:outline-none"
              >
                <option value="Professional and confident">Professional & Confident</option>
                <option value="Friendly and approachable">Friendly & Approachable</option>
                <option value="Enthusiastic and passionate">Enthusiastic & Passionate</option>
              </select>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!role || !company || isGenerating}
              className="bg-primary hover:bg-primary/90 text-primary-foreground flex w-full items-center justify-center gap-2 rounded-xl py-6 text-base font-bold shadow-[0_0_20px_-5px_rgba(56,189,248,0.4)] disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-5 w-5" /> Generate Cover Letter
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Output */}
        <div className="bg-surface border-border relative flex min-h-[500px] flex-1 flex-col rounded-3xl border p-8">
          {!result ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center opacity-50">
              <FileText className="text-foreground-muted mb-6 h-16 w-16" />
              <h3 className="text-foreground-muted mb-2 text-xl font-bold">
                Your Letter Will Appear Here
              </h3>
              <p className="text-foreground-secondary max-w-sm text-sm">
                Fill in the details on the left and hit generate to see the magic happen.
              </p>
            </div>
          ) : (
            <div className="animate-in fade-in zoom-in-95 flex h-full flex-1 flex-col duration-500">
              <div className="border-border mb-4 flex items-center justify-between border-b pb-4">
                <h3 className="text-foreground text-lg font-bold">Generated Result</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className="border-border h-8"
                  >
                    <Copy className="mr-1.5 h-4 w-4" /> Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadText}
                    className="border-border h-8"
                  >
                    <Download className="mr-1.5 h-4 w-4" /> Save
                  </Button>
                </div>
              </div>
              <div className="custom-scrollbar text-foreground-secondary flex-1 overflow-y-auto pr-2 text-sm leading-relaxed whitespace-pre-wrap">
                {result}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
