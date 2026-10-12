"use client";

import { useState } from "react";
import { useDocumentEditor, FullDocument } from "@/hooks/useDocumentEditor";
import { EditorToolbar } from "./EditorToolbar";
import { SectionNavigator } from "./SectionNavigator";
import { ActiveSectionEditor } from "./ActiveSectionEditor";
import { EditorRightPanel } from "./EditorRightPanel";

export function DocumentEditorClient({ initialDocument }: { initialDocument: FullDocument }) {
  const {
    document,
    isSaving,
    lastSaved,
    activeSectionId,
    setActiveSectionId,
    activeSection,
    updateTitle,
    updateSectionContent,
  } = useDocumentEditor(initialDocument);

  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");

  return (
    <div className="flex h-[100dvh] w-full flex-col bg-background overflow-hidden text-slate-200">
      <EditorToolbar 
        title={document.title} 
        onTitleChange={updateTitle}
        isSaving={isSaving}
        lastSaved={lastSaved}
      />
      
      {/* Mobile Tabs */}
      <div className="flex lg:hidden border-b border-white/5 bg-[#0a0f1c] p-2 gap-2">
        <button 
          onClick={() => setMobileTab("edit")}
          className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${mobileTab === 'edit' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
        >
          Editor
        </button>
        <button 
          onClick={() => setMobileTab("preview")}
          className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${mobileTab === 'preview' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
        >
          Preview & AI
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left: Section Navigator (20%) */}
        <div className={`w-[260px] shrink-0 border-r border-white/5 bg-background flex-col hidden md:flex ${mobileTab === 'edit' ? 'flex' : 'hidden md:flex'}`}>
          <SectionNavigator 
            sections={document.sections} 
            activeSectionId={activeSectionId}
            onSelectSection={setActiveSectionId}
          />
        </div>

        {/* Center: Dynamic Editor Canvas (40%) */}
        <div className={`flex-1 min-w-0 bg-[#060b14] flex-col relative overflow-y-auto ${mobileTab === 'edit' ? 'flex' : 'hidden lg:flex'}`}>
          <div className="absolute inset-0 bg-[url(/grid.svg)] opacity-[0.02] pointer-events-none" />
          <div className="md:hidden p-4 border-b border-white/10 bg-[#0a0f1c]/80 backdrop-blur-md sticky top-0 z-20 overflow-x-auto whitespace-nowrap flex gap-2 no-scrollbar">
            {document.sections.map(s => (
              <button 
                key={s.id} 
                onClick={() => setActiveSectionId(s.id)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${activeSectionId === s.id ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)]' : 'bg-slate-800/50 text-slate-400 border border-white/5 hover:bg-slate-800 hover:text-white'}`}
              >
                {s.title || s.type}
              </button>
            ))}
          </div>

          <div className="max-w-[850px] w-full mx-auto my-8 p-6 md:p-12 text-slate-200 relative z-10">
            {activeSection ? (
              <div className="bg-[#0a0f1c] border border-white/10 p-8 rounded-3xl shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)]">
                <ActiveSectionEditor 
                  section={activeSection}
                  onChange={(content) => updateSectionContent(activeSection.id, content)}
                />
              </div>
            ) : (
              <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 font-light border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.02]">
                <div className="h-16 w-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                </div>
                <p>Select a section from the left to start editing</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Preview & AI Panel (40%) */}
        <div className={`lg:w-[400px] xl:w-[450px] shrink-0 border-l border-white/5 bg-background flex-col relative overflow-hidden ${mobileTab === 'preview' ? 'flex' : 'hidden lg:flex'} shadow-[-10px_0_30px_-10px_rgba(0,0,0,0.5)] z-20`}>
          <EditorRightPanel document={document} />
        </div>
      </div>
    </div>
  );
}
