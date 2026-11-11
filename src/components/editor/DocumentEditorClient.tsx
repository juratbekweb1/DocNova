"use client";

import { useDeferredValue, useState } from "react";
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
  const deferredDocument = useDeferredValue(document);

  return (
    <div className="bg-background flex h-[100dvh] w-full flex-col overflow-hidden text-slate-200">
      <EditorToolbar
        title={document.title}
        onTitleChange={updateTitle}
        isSaving={isSaving}
        lastSaved={lastSaved}
      />

      {/* Mobile Tabs */}
      <div className="flex gap-2 border-b border-white/5 bg-[#0a0f1c] p-2 lg:hidden">
        <button
          onClick={() => setMobileTab("edit")}
          className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${mobileTab === "edit" ? "bg-cyan-600 text-white" : "text-slate-400 hover:bg-slate-800"}`}
        >
          Editor
        </button>
        <button
          onClick={() => setMobileTab("preview")}
          className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${mobileTab === "preview" ? "bg-cyan-600 text-white" : "text-slate-400 hover:bg-slate-800"}`}
        >
          Preview & AI
        </button>
      </div>

      <div className="relative flex flex-1 overflow-hidden">
        {/* Left: Section Navigator (20% - Desktop/Tablet only; mobile uses horizontal pill bar) */}
        <div
          className={`bg-background w-[260px] shrink-0 flex-col border-r border-white/5 ${mobileTab === "edit" ? "hidden md:flex" : "hidden lg:flex"}`}
        >
          <SectionNavigator
            sections={document.sections}
            activeSectionId={activeSectionId}
            onSelectSection={setActiveSectionId}
          />
        </div>

        {/* Center: Dynamic Editor Canvas (40%) */}
        <div
          className={`relative min-w-0 flex-1 flex-col overflow-y-auto bg-[#060b14] ${mobileTab === "edit" ? "flex" : "hidden lg:flex"}`}
        >
          <div className="pointer-events-none absolute inset-0 bg-[url(/grid.svg)] opacity-[0.02]" />
          <div className="no-scrollbar sticky top-0 z-20 flex gap-2 overflow-x-auto border-b border-white/10 bg-[#0a0f1c]/95 p-4 whitespace-nowrap md:hidden">
            {document.sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSectionId(s.id)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${activeSectionId === s.id ? "border border-cyan-500/30 bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)]" : "border border-white/5 bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white"}`}
              >
                {s.title || s.type}
              </button>
            ))}
          </div>

          <div className="relative z-10 mx-auto my-4 w-full max-w-[850px] p-4 text-slate-200 sm:p-6 md:my-8 md:p-12">
            {activeSection ? (
              <div className="rounded-3xl border border-white/10 bg-[#0a0f1c] p-5 shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)] sm:p-8">
                <ActiveSectionEditor
                  section={activeSection}
                  onChange={(content) => updateSectionContent(activeSection.id, content)}
                />
              </div>
            ) : (
              <div className="flex h-[60vh] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/5 bg-white/[0.02] font-light text-slate-400">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800/50">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-slate-500"
                  >
                    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                </div>
                <p>Select a section from the left to start editing</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Preview & AI Panel (40%) */}
        <div
          className={`bg-background relative w-full shrink-0 flex-col overflow-hidden border-l border-white/5 lg:w-[400px] xl:w-[450px] ${mobileTab === "preview" ? "flex" : "hidden lg:flex"} z-20 shadow-[-10px_0_30px_-10px_rgba(0,0,0,0.5)]`}
        >
          <EditorRightPanel document={deferredDocument} />
        </div>
      </div>
    </div>
  );
}
