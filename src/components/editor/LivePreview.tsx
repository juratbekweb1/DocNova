import { FullDocument } from "@/hooks/useDocumentEditor";
import { Maximize2, ZoomIn, ZoomOut } from "lucide-react";

interface SectionContent {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  text?: string;
  items?: Array<{
    title?: string;
    subtitle?: string;
    date?: string;
    description?: string;
  }>;
}

export function LivePreview({ document }: { document: FullDocument }) {
  const getSectionContent = (type: string) => {
    return (document.sections.find(s => s.type === type)?.content as unknown as SectionContent) || {};
  };

  const personalInfo = getSectionContent("PERSONAL_INFO");
  const summary = getSectionContent("SUMMARY");
  const experience = getSectionContent("EXPERIENCE");
  const education = getSectionContent("EDUCATION");
  const skills = getSectionContent("SKILLS") as SectionContent & { items?: string[] };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-surface/80">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Live Preview</span>
        <div className="flex items-center gap-2 text-slate-400">
          <button className="p-1 hover:text-white rounded hover:bg-slate-800"><ZoomOut className="h-4 w-4" /></button>
          <span className="text-xs">100%</span>
          <button className="p-1 hover:text-white rounded hover:bg-slate-800"><ZoomIn className="h-4 w-4" /></button>
          <div className="w-px h-4 bg-white/10 mx-1"></div>
          <button className="p-1 hover:text-white rounded hover:bg-slate-800"><Maximize2 className="h-4 w-4" /></button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto bg-background p-4 flex justify-center items-start no-scrollbar relative">
        <div className="absolute inset-0 bg-[url(/grid.svg)] opacity-[0.05] pointer-events-none" />
        
        <div className="origin-top scale-[0.45] xl:scale-[0.5] transition-transform relative z-10">
          {/* A4 Paper Container */}
          <div 
            className="bg-white text-black rounded-sm shrink-0 flex flex-col shadow-[0_0_50px_-12px_rgba(255,255,255,0.1),0_20px_40px_-10px_rgba(0,0,0,0.5)] border border-slate-200"
            style={{ 
              width: "210mm", 
              minHeight: "297mm", 
              padding: "20mm 20mm" 
            }}
          >
          {/* Header */}
          {(personalInfo.name || personalInfo.email || personalInfo.phone || personalInfo.location) && (
            <div className="text-center border-b-2 border-slate-800 pb-6 mb-6">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 uppercase">
                {personalInfo.name || "Untitled Document"}
              </h1>
              <div className="mt-3 flex items-center justify-center gap-3 text-sm text-slate-600 flex-wrap">
                {personalInfo.email && <span>{personalInfo.email}</span>}
                {personalInfo.email && personalInfo.phone && <span>•</span>}
                {personalInfo.phone && <span>{personalInfo.phone}</span>}
                {(personalInfo.email || personalInfo.phone) && personalInfo.location && <span>•</span>}
                {personalInfo.location && <span>{personalInfo.location}</span>}
              </div>
            </div>
          )}

          {/* Body */}
          <div className="flex flex-col gap-6">
            {/* Generic Content Section for Non-Resumes */}
            {getSectionContent("CONTENT").text && (
              <div className="prose prose-slate max-w-none text-slate-800 leading-relaxed text-sm whitespace-pre-wrap">
                {getSectionContent("CONTENT").text}
              </div>
            )}

            {/* Summary */}
            {summary.text && (
              <div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {summary.text}
                </p>
              </div>
            )}

            {/* Experience */}
            {experience?.items && experience.items.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-1 mb-4">
                  Experience
                </h2>
                <div className="space-y-5">
                  {experience.items.map((item: { title?: string; subtitle?: string; date?: string; description?: string }, idx: number) => (
                    <div key={idx}>
                      <div className="flex items-baseline justify-between">
                        <h3 className="font-bold text-slate-800 text-[15px]">{item.title}</h3>
                        <span className="text-sm font-medium text-slate-600">{item.date}</span>
                      </div>
                      <div className="text-sm font-medium text-slate-600 mb-2">
                        {item.subtitle}
                      </div>
                      {item.description && (
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {item.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {education?.items && education.items.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-1 mb-4">
                  Education
                </h2>
                <div className="space-y-4">
                  {education.items.map((item: { title?: string; subtitle?: string; date?: string }, idx: number) => (
                    <div key={idx} className="flex items-baseline justify-between">
                      <div>
                        <h3 className="font-bold text-slate-800 text-[15px]">{item.title}</h3>
                        <div className="text-sm text-slate-600">{item.subtitle}</div>
                      </div>
                      <span className="text-sm font-medium text-slate-600">{item.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {skills?.items && skills.items.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-1 mb-4">
                  Skills
                </h2>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {skills.items.join(" • ")}
                </p>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
