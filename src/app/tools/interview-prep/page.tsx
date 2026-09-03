"use client";

import React from "react";
import { useRecentTool } from "@/hooks/useRecentTool";
import { Mic, User, Video, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InterviewPrepPage() {
  useRecentTool("interview-prep", "Interview Prep", "Tools Hub", "/tools/interview-prep");

  return (
    <div className="bg-background min-h-screen px-6 py-12">
      <div className="mx-auto mt-12 flex max-w-6xl flex-col items-center">
        <div className="bg-primary/10 border-primary/20 relative mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl border">
          <Mic className="text-primary h-10 w-10" />
          <div className="absolute -top-2 -right-2 animate-pulse rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-emerald-950">
            LIVE
          </div>
        </div>
        <h1 className="text-foreground mb-4 text-4xl font-extrabold">Interview Prep AI</h1>
        <p className="text-foreground-secondary mb-12 max-w-2xl text-center text-lg">
          Practice your interview skills with our AI HR manager. Get real-time feedback on your
          answers, tone, and technical knowledge.
        </p>

        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3">
          <div className="bg-surface border-border relative flex aspect-video flex-col overflow-hidden rounded-3xl border md:col-span-2">
            <div className="bg-surface-elevated absolute inset-0 flex flex-col items-center justify-center">
              <User className="text-border mb-4 h-24 w-24" />
              <p className="text-foreground-muted font-medium">Camera Feed Placeholder</p>
            </div>
            <div className="bg-background/80 border-border absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-4 rounded-full border px-6 py-3 backdrop-blur-md">
              <button className="bg-surface border-border hover:bg-border/50 text-foreground flex h-12 w-12 items-center justify-center rounded-full border transition-colors">
                <Video className="h-5 w-5" />
              </button>
              <button className="bg-surface border-border hover:bg-border/50 text-foreground flex h-12 w-12 items-center justify-center rounded-full border transition-colors">
                <Mic className="h-5 w-5" />
              </button>
              <Button className="bg-error text-error-foreground hover:bg-error/90 h-12 rounded-full px-6 font-bold">
                End Mock
              </Button>
            </div>
          </div>

          <div className="bg-surface border-border flex h-full flex-col rounded-3xl border p-6">
            <h3 className="text-foreground mb-4 flex items-center gap-2 text-lg font-bold">
              <MessageSquare className="text-primary h-5 w-5" /> Live Feedback
            </h3>
            <div className="bg-background border-border flex-1 space-y-4 overflow-y-auto rounded-2xl border p-4">
              <div className="bg-surface-elevated border-border text-foreground rounded-xl border p-3 text-sm">
                <span className="text-primary mb-1 block font-bold">AI Interviewer:</span>
                &quot;Tell me about a time you faced a difficult technical challenge and how you
                overcame it.&quot;
              </div>
              <div className="bg-primary/10 border-primary/20 text-foreground rounded-xl border p-3 text-sm">
                <span className="text-primary mb-1 block font-bold">Feedback tip:</span>
                Remember to use the STAR method (Situation, Task, Action, Result) for this
                behavioral question.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
