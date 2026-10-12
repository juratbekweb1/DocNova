/* eslint-disable @typescript-eslint/no-explicit-any */
import { DocumentSection, Prisma } from "@prisma/client";
import { Sparkles, Trash2, Plus } from "lucide-react";
import { useState } from "react";
import { AISuggestionCard } from "./AISuggestionCard";
import { generateSectionSuggestion } from "@/actions/editor-ai-actions";
import { Button } from "@/components/ui/button";

interface ActiveSectionEditorProps {
  section: DocumentSection;
  onChange: (content: Prisma.InputJsonValue) => void;
}

interface SectionItem {
  title?: string;
  subtitle?: string;
  date?: string;
  description?: string;
  [key: string]: string | undefined;
}

export function ActiveSectionEditor({ section, onChange }: ActiveSectionEditorProps) {
  const content = (section.content as Record<string, unknown>) || {};

  const [aiState, setAiState] = useState({
    isOpen: false,
    isLoading: false,
    targetField: "",
    itemIndex: -1,
    originalText: "",
    suggestedText: ""
  });

  const handleFieldChange = (field: string, value: unknown) => {
    onChange({ ...content, [field]: value } as Prisma.InputJsonValue);
  };

  const handleAIAssist = async (field: string, text: string, itemIndex: number = -1, instruction: string = "Make Professional") => {
    if (!text.trim()) return;
    
    setAiState({ ...aiState, isOpen: true, isLoading: true, targetField: field, itemIndex, originalText: text, suggestedText: "" });
    try {
      const suggestion = await generateSectionSuggestion(section.type, text, instruction);
      setAiState(prev => ({ ...prev, isLoading: false, suggestedText: suggestion }));
    } catch (error) {
      console.error(error);
      setAiState(prev => ({ ...prev, isOpen: false, isLoading: false }));
    }
  };

  const applyAISuggestion = (mode: "replace" | "insert", text: string) => {
    if (aiState.itemIndex >= 0) {
      const items = [...((content.items as SectionItem[]) || [])];
      const currentItem = items[aiState.itemIndex];
      const newText = mode === "replace" ? text : `${currentItem[aiState.targetField]}\n\n${text}`;
      items[aiState.itemIndex] = { ...currentItem, [aiState.targetField]: newText };
      handleFieldChange("items", items);
    } else {
      const newText = mode === "replace" ? text : `${content[aiState.targetField]}\n\n${text}`;
      handleFieldChange(aiState.targetField, newText);
    }
    setAiState({ ...aiState, isOpen: false });
  };

  // Reusable input component for A4 canvas style
  const CanvasInput = ({ label, value, onChange, placeholder, type = "text" }: any) => (
    <div className="mb-4">
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">{label}</label>
      <input 
        type={type} 
        value={value || ""} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent border-b border-white/10 py-2 text-base text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors" 
        placeholder={placeholder}
      />
    </div>
  );

  const CanvasTextarea = ({ label, value, onChange, placeholder, fieldName, itemIndex = -1, minHeight = "120px" }: any) => (
    <div className="mb-4 relative group flex flex-col h-full">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
        <button 
          onClick={() => handleAIAssist(fieldName, value, itemIndex)}
          className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-medium"
        >
          <Sparkles className="h-3 w-3" /> Improve with AI
        </button>
      </div>
      <textarea 
        value={value || ""} 
        onChange={(e) => onChange(e.target.value)}
        style={{ minHeight }}
        className="w-full bg-background border border-white/10 rounded-lg p-4 text-base text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 resize-y transition-shadow shadow-inner leading-relaxed" 
        placeholder={placeholder}
      />
    </div>
  );

  const renderEditorFields = () => {
    switch (section.type) {
      case "PERSONAL_INFO":
        return (
          <div className="grid grid-cols-2 gap-x-8 gap-y-2">
            <div className="col-span-2">
              <CanvasInput label="Full Name" value={content.name} onChange={(v: string) => handleFieldChange("name", v)} placeholder="e.g. John Doe" />
            </div>
            <div>
              <CanvasInput label="Email" type="email" value={content.email} onChange={(v: string) => handleFieldChange("email", v)} placeholder="john@example.com" />
            </div>
            <div>
              <CanvasInput label="Phone" value={content.phone} onChange={(v: string) => handleFieldChange("phone", v)} placeholder="+1 234 567 8900" />
            </div>
            <div className="col-span-2">
              <CanvasInput label="Location" value={content.location} onChange={(v: string) => handleFieldChange("location", v)} placeholder="City, State" />
            </div>
            <div className="col-span-2">
              <CanvasInput label="LinkedIn/Website URL" value={content.website} onChange={(v: string) => handleFieldChange("website", v)} placeholder="linkedin.com/in/johndoe" />
            </div>
          </div>
        );

      case "SUMMARY":
        return (
          <div className="space-y-4">
            <CanvasTextarea 
              label="Professional Summary" 
              value={content.text} 
              onChange={(v: string) => handleFieldChange("text", v)} 
              placeholder="Briefly describe your professional background and key strengths..."
              fieldName="text"
            />
          </div>
        );

      case "EXPERIENCE":
      case "EDUCATION":
      case "SKILLS":
        const items = (content.items as SectionItem[]) || [];
        return (
          <div className="space-y-8">
            {items.map((item, idx) => (
              <div key={idx} className="relative group rounded-xl border border-white/5 bg-white/[0.02] p-6 shadow-sm hover:border-white/10 transition-colors">
                <button 
                  onClick={() => {
                    const newItems = [...items];
                    newItems.splice(idx, 1);
                    handleFieldChange("items", newItems);
                  }}
                  className="absolute -right-3 -top-3 p-2 bg-[#0a0f1c] text-slate-500 hover:text-red-400 rounded-full border border-white/10 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  <div className="col-span-2 md:col-span-1">
                    <CanvasInput label={section.type === "EDUCATION" ? "School" : "Company/Skill"} value={item.title} onChange={(v: string) => {
                      const newItems = [...items]; newItems[idx] = { ...item, title: v }; handleFieldChange("items", newItems);
                    }} />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <CanvasInput label={section.type === "EDUCATION" ? "Degree" : "Role/Level"} value={item.subtitle} onChange={(v: string) => {
                      const newItems = [...items]; newItems[idx] = { ...item, subtitle: v }; handleFieldChange("items", newItems);
                    }} />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <CanvasInput label="Date/Duration" value={item.date} onChange={(v: string) => {
                      const newItems = [...items]; newItems[idx] = { ...item, date: v }; handleFieldChange("items", newItems);
                    }} />
                  </div>
                  <div className="col-span-2 mt-4">
                    <CanvasTextarea 
                      label="Description" 
                      value={item.description} 
                      onChange={(v: string) => {
                        const newItems = [...items]; newItems[idx] = { ...item, description: v }; handleFieldChange("items", newItems);
                      }}
                      fieldName="description"
                      itemIndex={idx}
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button 
              onClick={() => handleFieldChange("items", [...items, { title: "", subtitle: "", date: "", description: "" }])}
              variant="outline" 
              className="w-full border-dashed border-white/10 bg-transparent text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 hover:bg-cyan-500/10"
            >
              <Plus className="mr-2 h-4 w-4" /> Add {section.type === "EDUCATION" ? "Education" : section.type === "SKILLS" ? "Skill" : "Experience"}
            </Button>
          </div>
        );

      case "CONTENT":
        return (
          <div className="space-y-4 h-full flex flex-col">
            <CanvasTextarea 
              label="Document Content" 
              value={content.text} 
              onChange={(v: string) => handleFieldChange("text", v)} 
              placeholder="Start writing your document here..."
              fieldName="text"
              minHeight="600px"
            />
          </div>
        );

      default:
        return <div className="text-slate-500 font-light p-8 border border-dashed border-white/10 rounded-2xl text-center">Unknown section type: {section.type}</div>;
    }
  };

  return (
    <div className="relative">
      <h2 className="text-2xl font-bold text-white mb-8 border-b border-white/10 pb-4">
        {section.title || section.type}
      </h2>
      
      {renderEditorFields()}

      {aiState.isOpen && (
        <AISuggestionCard 
          originalText={aiState.originalText}
          suggestedText={aiState.suggestedText}
          onAccept={(text) => applyAISuggestion("replace", text)}
          onInsert={(text) => applyAISuggestion("insert", text)}
          onDismiss={() => setAiState({ ...aiState, isOpen: false })}
          onTryAgain={() => handleAIAssist(aiState.targetField, aiState.originalText, aiState.itemIndex, "Make Professional")}
        />
      )}
    </div>
  );
}
