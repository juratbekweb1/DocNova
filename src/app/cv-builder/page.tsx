"use client";

import React, { useState } from "react";
import { Download, LayoutTemplate, Star, Crown, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


export default function CvBuilderPage() {
  const [name, setName] = useState("Alex Johnson");
  const [role, setRole] = useState("Senior Product Designer");
  const [summary, setSummary] = useState("Passionate about creating intuitive user experiences and leading design systems.");
  
  // Generating a grid of 20 templates
  const templates = Array.from({ length: 24 }).map((_, i) => ({
    id: i + 1,
    name: `Template ${i + 1}`,
    isPro: i >= 4 && i < 14,
    isPremium: i >= 14
  }));

  const [activeTemplate, setActiveTemplate] = useState(1);
  const { toast } = useToast();

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-background">
      {/* Sidebar: Form & Templates */}
      <div className="w-1/3 border-r border-border bg-surface flex flex-col h-full">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">CV & Resume Hub</h2>
          <button onClick={() => toast({ title: "Yuklab olinmoqda", description: "Rezyume eksport qilinmoqda, kuting..." })} className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8">
          {/* Real-time Editor Form */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" /> Live Editor
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground-secondary mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:border-primary/50 text-foreground" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground-secondary mb-1">Role</label>
                <input 
                  type="text" 
                  value={role} 
                  onChange={e => setRole(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:border-primary/50 text-foreground" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground-secondary mb-1">Professional Summary</label>
                <textarea 
                  value={summary} 
                  onChange={e => setSummary(e.target.value)}
                  rows={4}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:border-primary/50 text-foreground resize-none" 
                />
              </div>
            </div>
          </div>

          {/* Templates Grid */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
              <LayoutTemplate className="w-4 h-4 text-primary" /> Templates Grid
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {templates.map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => setActiveTemplate(tpl.id)}
                  className={`relative aspect-[1/1.4] rounded-lg border-2 transition-all ${activeTemplate === tpl.id ? 'border-primary' : 'border-border bg-background hover:border-primary/50'}`}
                >
                  {/* Mock thumbnail representation */}
                  <div className="absolute inset-2 bg-surface-elevated rounded-sm border border-border/50">
                    <div className="w-1/2 h-2 bg-border/80 mt-2 mx-2 rounded-full" />
                    <div className="w-1/3 h-1.5 bg-border/50 mt-1 mx-2 rounded-full" />
                    <div className="w-3/4 h-8 bg-border/30 mt-4 mx-2 rounded-sm" />
                  </div>
                  
                  {tpl.isPro && (
                    <div className="absolute top-1 right-1 bg-violet-500 text-white p-1 rounded-md">
                      <Star className="w-3 h-3 fill-current" />
                    </div>
                  )}
                  {tpl.isPremium && (
                    <div className="absolute top-1 right-1 bg-amber-500 text-white p-1 rounded-md">
                      <Crown className="w-3 h-3 fill-current" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Live Preview (0ms latency UI) */}
      <div className="flex-1 bg-surface-elevated p-8 overflow-y-auto flex justify-center">
        <div className="w-full max-w-[210mm] min-h-[297mm] bg-white text-black p-12 shadow-2xl rounded-sm transform transition-all duration-200 ease-out">
          {/* Header */}
          <div className="border-b border-gray-300 pb-6 mb-6">
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">{name || "Your Name"}</h1>
            <p className="text-xl text-gray-600 mt-2 font-medium">{role || "Your Role"}</p>
          </div>
          
          {/* Summary */}
          <div className="mb-8">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">Professional Summary</h2>
            <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
              {summary || "Start typing your professional summary..."}
            </p>
          </div>

          {/* Placeholder for Experience (just visual mockup) */}
          <div className="mb-8">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">Experience</h2>
            <div className="mb-4">
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="text-md font-bold text-gray-900">TechCorp Inc.</h3>
                <span className="text-xs font-medium text-gray-500">2021 - Present</span>
              </div>
              <p className="text-sm italic text-gray-600 mb-2">Lead Designer</p>
              <ul className="list-disc pl-4 text-sm text-gray-700 space-y-1">
                <li>Directed the redesign of the core product increasing engagement by 40%.</li>
                <li>Managed a team of 4 product designers.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
