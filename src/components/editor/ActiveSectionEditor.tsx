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

interface CanvasInputProps {
  label: string;
  value?: unknown;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}

function CanvasInput({ label, value, onChange, placeholder, type = "text" }: CanvasInputProps) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-400 uppercase">
        {label}
      </label>
      <input
        type={type}
        value={(value as string) || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border-b border-white/10 bg-transparent py-2 text-base text-white transition-colors placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
        placeholder={placeholder}
      />
    </div>
  );
}

interface CanvasTextareaProps {
  label: string;
  value?: unknown;
  onChange: (value: string) => void;
  onAssist: (fieldName: string, text: string, itemIndex: number) => void;
  placeholder?: string;
  fieldName: string;
  itemIndex?: number;
  minHeight?: string;
}

function CanvasTextarea({
  label,
  value,
  onChange,
  onAssist,
  placeholder,
  fieldName,
  itemIndex = -1,
  minHeight = "120px",
}: CanvasTextareaProps) {
  const stringValue = (value as string) || "";
  return (
    <div className="group relative mb-4 flex h-full flex-col">
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
          {label}
        </label>
        <button
          type="button"
          onClick={() => onAssist(fieldName, stringValue, itemIndex)}
          className="flex items-center gap-1 text-xs font-medium text-cyan-400 opacity-100 transition-opacity hover:text-cyan-300 md:opacity-0 md:group-hover:opacity-100"
        >
          <Sparkles className="h-3 w-3" /> Improve with AI
        </button>
      </div>
      <textarea
        value={stringValue}
        onChange={(e) => onChange(e.target.value)}
        style={{ minHeight }}
        className="bg-background w-full resize-y rounded-lg border border-white/10 p-4 text-base leading-relaxed text-white shadow-inner transition-shadow placeholder:text-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 focus:outline-none"
        placeholder={placeholder}
      />
    </div>
  );
}

export function ActiveSectionEditor({ section, onChange }: ActiveSectionEditorProps) {
  const content = (section.content as Record<string, unknown>) || {};

  const [aiState, setAiState] = useState({
    isOpen: false,
    isLoading: false,
    targetField: "",
    itemIndex: -1,
    originalText: "",
    suggestedText: "",
  });

  const handleFieldChange = (field: string, value: unknown) => {
    onChange({ ...content, [field]: value } as Prisma.InputJsonValue);
  };

  const handleAIAssist = async (
    field: string,
    text: string,
    itemIndex: number = -1,
    instruction: string = "Make Professional"
  ) => {
    if (!text.trim()) return;

    setAiState({
      ...aiState,
      isOpen: true,
      isLoading: true,
      targetField: field,
      itemIndex,
      originalText: text,
      suggestedText: "",
    });
    try {
      const suggestion = await generateSectionSuggestion(section.type, text, instruction);
      setAiState((prev) => ({ ...prev, isLoading: false, suggestedText: suggestion }));
    } catch (error) {
      console.error(error);
      setAiState((prev) => ({ ...prev, isOpen: false, isLoading: false }));
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

  const renderEditorFields = () => {
    switch (section.type) {
      case "PERSONAL_INFO":
        return (
          <div className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <CanvasInput
                label="Full Name"
                value={content.name}
                onChange={(v: string) => handleFieldChange("name", v)}
                placeholder="e.g. John Doe"
              />
            </div>
            <div>
              <CanvasInput
                label="Email"
                type="email"
                value={content.email}
                onChange={(v: string) => handleFieldChange("email", v)}
                placeholder="john@example.com"
              />
            </div>
            <div>
              <CanvasInput
                label="Phone"
                value={content.phone}
                onChange={(v: string) => handleFieldChange("phone", v)}
                placeholder="+1 234 567 8900"
              />
            </div>
            <div className="sm:col-span-2">
              <CanvasInput
                label="Location"
                value={content.location}
                onChange={(v: string) => handleFieldChange("location", v)}
                placeholder="City, State"
              />
            </div>
            <div className="sm:col-span-2">
              <CanvasInput
                label="LinkedIn/Website URL"
                value={content.website}
                onChange={(v: string) => handleFieldChange("website", v)}
                placeholder="linkedin.com/in/johndoe"
              />
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
              onAssist={handleAIAssist}
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
              <div
                key={idx}
                className="group relative rounded-xl border border-white/5 bg-white/[0.02] p-6 shadow-sm transition-colors hover:border-white/10"
              >
                <button
                  type="button"
                  onClick={() => {
                    const newItems = [...items];
                    newItems.splice(idx, 1);
                    handleFieldChange("items", newItems);
                  }}
                  className="absolute -top-3 -right-3 rounded-full border border-white/10 bg-[#0a0f1c] p-2 text-slate-500 opacity-100 shadow-sm transition-opacity hover:text-red-400 md:opacity-0 md:group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  <div className="col-span-2 md:col-span-1">
                    <CanvasInput
                      label={section.type === "EDUCATION" ? "School" : "Company/Skill"}
                      value={item.title}
                      onChange={(v: string) => {
                        const newItems = [...items];
                        newItems[idx] = { ...item, title: v };
                        handleFieldChange("items", newItems);
                      }}
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <CanvasInput
                      label={section.type === "EDUCATION" ? "Degree" : "Role/Level"}
                      value={item.subtitle}
                      onChange={(v: string) => {
                        const newItems = [...items];
                        newItems[idx] = { ...item, subtitle: v };
                        handleFieldChange("items", newItems);
                      }}
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <CanvasInput
                      label="Date/Duration"
                      value={item.date}
                      onChange={(v: string) => {
                        const newItems = [...items];
                        newItems[idx] = { ...item, date: v };
                        handleFieldChange("items", newItems);
                      }}
                    />
                  </div>
                  <div className="col-span-2 mt-4">
                    <CanvasTextarea
                      label="Description"
                      value={item.description}
                      onChange={(v: string) => {
                        const newItems = [...items];
                        newItems[idx] = { ...item, description: v };
                        handleFieldChange("items", newItems);
                      }}
                      onAssist={handleAIAssist}
                      fieldName="description"
                      itemIndex={idx}
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button
              onClick={() =>
                handleFieldChange("items", [
                  ...items,
                  { title: "", subtitle: "", date: "", description: "" },
                ])
              }
              variant="outline"
              className="w-full border-dashed border-white/10 bg-transparent text-slate-400 hover:border-cyan-500/50 hover:bg-cyan-500/10 hover:text-cyan-400"
            >
              <Plus className="mr-2 h-4 w-4" /> Add{" "}
              {section.type === "EDUCATION"
                ? "Education"
                : section.type === "SKILLS"
                  ? "Skill"
                  : "Experience"}
            </Button>
          </div>
        );

      case "CONTENT":
        return (
          <div className="flex h-full flex-col space-y-4">
            <CanvasTextarea
              label="Document Content"
              value={content.text}
              onChange={(v: string) => handleFieldChange("text", v)}
              onAssist={handleAIAssist}
              placeholder="Start writing your document here..."
              fieldName="text"
              minHeight="600px"
            />
          </div>
        );

      default:
        return (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center font-light text-slate-500">
            Unknown section type: {section.type}
          </div>
        );
    }
  };

  return (
    <div className="relative">
      <h2 className="mb-8 border-b border-white/10 pb-4 text-2xl font-bold text-white">
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
          onTryAgain={() =>
            handleAIAssist(
              aiState.targetField,
              aiState.originalText,
              aiState.itemIndex,
              "Make Professional"
            )
          }
        />
      )}
    </div>
  );
}
