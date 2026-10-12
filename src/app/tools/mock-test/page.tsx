"use client";

import React, { useState } from "react";
import { Headphones, BookOpen, PenTool, Mic, ArrowRight } from "lucide-react";
import { useRecentTool } from "@/hooks/useRecentTool";

export default function UniversalMockTestPage() {
  useRecentTool("mock-test", "Universal Mock Test", "Tools Hub", "/tools/mock-test");

  // Default state for demonstration
  const [activeSection, setActiveSection] = useState(1);
  const [selectedLanguage, setSelectedLanguage] = useState("Koreys tili (TOPIK)");
  
  const languages = [
    "Ingliz tili (IELTS)",
    "Rus tili (TRKI)",
    "Koreys tili (TOPIK)",
    "Nemis tili (Goethe)",
    "Yapon tili (JLPT)"
  ];

  const sections = [
    { id: 1, title: "Listening", icon: Headphones, duration: "35 min", items: "40 questions" },
    { id: 2, title: "Reading", icon: BookOpen, duration: "60 min", items: "40 questions" },
    { id: 3, title: "Writing", icon: PenTool, duration: "60 min", items: "2 tasks" },
    { id: 4, title: "Speaking", icon: Mic, duration: "15 min", items: "3 parts" },
  ];

  const progress = ((activeSection - 1) / sections.length) * 100;

  return (
    <div className="min-h-screen bg-[#FDFDFD] dark:bg-background py-10 px-6 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Setup */}
        <div className="flex flex-col items-center justify-center text-center space-y-4 mb-10">
          <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-blue-50 text-blue-500 text-xs font-semibold tracking-wide uppercase border border-blue-100">
            Universal Mock Exam
          </div>
          
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Til Bo'yicha Full Mock Test
          </h1>
          
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-medium">
            <span>4 ta bo'lim:</span>
            {sections.map((s, idx) => (
              <React.Fragment key={s.id}>
                <span>{s.title} ({s.duration})</span>
                {idx < sections.length - 1 && <span>→</span>}
              </React.Fragment>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-center gap-4">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Tilni tanlang:</span>
            <select 
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-white dark:bg-surface border border-slate-200 dark:border-border rounded-lg px-4 py-2 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {languages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white dark:bg-surface border border-slate-200 dark:border-border rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Imtihon progressi</span>
            <span className="text-sm font-semibold text-slate-500">{activeSection - 1}/4 sections</span>
          </div>
          <div className="h-2.5 w-full bg-slate-100 dark:bg-surface-elevated rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Sections List */}
        <div className="space-y-4">
          {sections.map((section) => {
            const isActive = section.id === activeSection;
            const isCompleted = section.id < activeSection;
            const isLocked = section.id > activeSection;

            return (
              <div 
                key={section.id} 
                className={`
                  flex items-center justify-between p-5 rounded-2xl border transition-all duration-300
                  ${isActive ? 'bg-white dark:bg-surface border-blue-500 shadow-[0_4px_20px_-4px_rgba(59,130,246,0.15)] ring-1 ring-blue-500' : ''}
                  ${isCompleted ? 'bg-slate-50/50 dark:bg-surface/50 border-slate-200 dark:border-border' : ''}
                  ${isLocked ? 'bg-white dark:bg-surface border-slate-200 dark:border-border opacity-70' : ''}
                `}
              >
                <div className="flex items-center gap-5">
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm
                    ${isActive ? 'bg-blue-500 text-white' : ''}
                    ${isCompleted ? 'bg-emerald-500 text-white' : ''}
                    ${isLocked ? 'bg-slate-100 dark:bg-surface-elevated text-slate-400' : ''}
                  `}>
                    {isCompleted ? "✓" : section.id}
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="flex items-center gap-3 mb-1">
                      <section.icon className={`w-5 h-5 ${isActive ? 'text-blue-500' : 'text-slate-500'}`} />
                      <h3 className={`text-lg font-bold ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                        {section.title}
                      </h3>
                      {isActive && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-600 uppercase tracking-wider">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                      <span>⏱ {section.duration}</span>
                      <span>•</span>
                      <span>📝 {section.items}</span>
                    </div>
                  </div>
                </div>

                <div>
                  {isActive && (
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
                      Continue <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                  {isLocked && (
                    <button disabled className="flex items-center gap-2 px-6 py-2.5 bg-slate-50 dark:bg-surface-elevated text-slate-400 text-sm font-semibold rounded-xl border border-slate-200 dark:border-border cursor-not-allowed">
                      Start <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                  {isCompleted && (
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-emerald-50 text-emerald-600 text-sm font-semibold rounded-xl border border-emerald-100">
                      Tugallandi
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
