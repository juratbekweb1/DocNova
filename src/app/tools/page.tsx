"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  Search,
  FileText,
  FileCode2,
  SpellCheck2,
  GraduationCap,
  Briefcase,
  PencilRuler,
  FolderKanban,
  ArrowRight,
  BookOpen,
  Globe,
  Target,
  Mic,
  Sparkles,
  BrainCircuit,
  BarChart,
  Clock,
} from "lucide-react";
import { ToolCard } from "@/components/tools/ToolCard";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/language-provider";

export default function ToolsHubPage() {
  const { data: session, status } = useSession();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "favorites">("all");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentItems, setRecentItems] = useState<
    { title: string; time: string; icon: React.ElementType; href: string }[]
  >([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load favorites & recents on mount based on auth status
  useEffect(() => {
    if (status === "loading") return;

    if (session?.user) {
      // Fetch from API
      fetch("/api/tools/favorites")
        .then((r) => r.json())
        .then((data) => {
          if (data.favorites) setFavorites(data.favorites);
        });
      fetch("/api/tools/recents")
        .then((r) => r.json())
        .then((data) => {
          if (data.recents) {
            const mapped = data.recents.map(
              (r: { title: string; lastUsedAt: string; route: string }) => ({
                title: r.title,
                time: new Date(r.lastUsedAt).toLocaleDateString(),
                icon: Clock, // We use a generic icon since we didn't store the icon
                href: r.route,
              })
            );
            setRecentItems(mapped);
          }
        });
    } else {
      // Load from Local Storage fallback
      const storedFavs = localStorage.getItem("DocNova_favorites");
      if (storedFavs) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFavorites(JSON.parse(storedFavs));
      }

      setRecentItems([
        {
          title: "Resume: Senior Frontend Dev",
          time: "10m ago",
          icon: FileText,
          href: "/tools/resume-builder",
        },
        {
          title: "IELTS Reading Mock - Section 3",
          time: "2h ago",
          icon: GraduationCap,
          href: "/tools/ielts-mock",
        },
        {
          title: "Cover Letter: Google",
          time: "Yesterday",
          icon: Briefcase,
          href: "/tools/cover-letter",
        },
      ]);
    }
  }, [session, status]);

  const toggleFavorite = async (title: string) => {
    const isFav = favorites.includes(title);
    const updated = isFav ? favorites.filter((f) => f !== title) : [...favorites, title];
    setFavorites(updated);

    if (session?.user) {
      if (isFav) {
        await fetch("/api/tools/favorites", {
          method: "DELETE",
          body: JSON.stringify({ toolId: title }),
        });
      } else {
        await fetch("/api/tools/favorites", {
          method: "POST",
          body: JSON.stringify({ toolId: title }),
        });
      }
    } else {
      localStorage.setItem("DocNova_favorites", JSON.stringify(updated));
    }
  };

  // Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const quickTools = [
    { name: t.filterResume || "Resume", icon: FileText, filter: "resume" },
    { name: t.filterPdf || "PDF", icon: FileCode2, filter: "pdf" },
    { name: t.filterIelts || "IELTS", icon: GraduationCap, filter: "ielts" },
    { name: t.filterCoverLetter || "Cover Letter", icon: Briefcase, filter: "cover letter" },
    { name: t.filterAiWriter || "AI Writer", icon: PencilRuler, filter: "ai writer" },
    { name: t.filterTranslator || "Translator", icon: Globe, filter: "translator" },
    { name: t.filterGrammar || "Grammar", icon: SpellCheck2, filter: "grammar" },
  ];

  const categories = [
    {
      title: t.catEdu || "🎓 Education Hub",
      description: t.catEduDesc || "Smart tools to accelerate your learning and test prep.",
      tools: [
        {
          title: t.toolIelts || "IELTS Mock Test",
          description: t.toolIeltsDesc || "Full IELTS simulation with AI scoring for all sections.",
          icon: GraduationCap,
          href: "/tools/ielts-mock",
          badge: t.popular || "POPULAR",
        },
        {
          title: t.toolCefr || "CEFR Level Test",
          description: t.toolCefrDesc || "Accurate A1-C2 English proficiency assessment.",
          icon: Target,
          href: "/tools/cefr-test",
        },
        {
          title: t.toolSat || "SAT Digital Practice",
          description: t.toolSatDesc || "Mock exams for Math and Reading/Writing.",
          icon: BookOpen,
          href: "/tools/sat-practice",
        },
        {
          title: t.toolAiStudy || "AI Study Assistant",
          description: t.toolAiStudyDesc || "Generate summaries, flashcards & quizzes from PDF.",
          icon: BrainCircuit,
          href: "/tools/ai-study-assistant",
          badge: t.proBadge || "PRO",
        },
      ],
    },
    {
      title: t.catCareer || "💼 Career Hub",
      description: t.catCareerDesc || "Everything you need to land your next dream role.",
      tools: [
        {
          title: t.toolResumeBuilder || "Resume Builder",
          description: t.toolResumeBuilderDesc || "Create ATS-friendly resumes in minutes.",
          icon: FileText,
          href: "/tools/resume-builder",
          badge: t.popular || "POPULAR",
        },
        {
          title: t.toolCvAnalyzer || "CV Analyzer",
          description:
            t.toolCvAnalyzerDesc || "AI scoring and improvement suggestions for your CV.",
          icon: BarChart,
          href: "/tools/cv-analyzer",
          badge: t.proBadge || "PRO",
        },
        {
          title: t.toolCoverLetter || "Cover Letter AI",
          description:
            t.toolCoverLetterDesc || "Generate tailored cover letters based on job descriptions.",
          icon: Briefcase,
          href: "/tools/cover-letter",
        },
        {
          title: t.toolInterviewPrep || "Interview Prep AI",
          description: t.toolInterviewPrepDesc || "Mock interview with HR and technical questions.",
          icon: Mic,
          href: "/tools/interview-prep",
        },
      ],
    },
    {
      title: t.catWriting || "✍️ AI Writing",
      description: t.catWritingDesc || "Productivity tools to accelerate your workflow.",
      tools: [
        {
          title: t.toolAiWriterPro || "AI Writer Pro",
          description: t.toolAiWriterProDesc || "Draft emails, reports, and articles instantly.",
          icon: PencilRuler,
          href: "/tools/ai-writer",
          badge: t.proBadge || "PRO",
        },
      ],
    },
    {
      title: t.catUtils || "🛠️ Quick Utilities",
      description: t.catUtilsDesc || "Handy tools for everyday tasks.",
      tools: [
        {
          title: t.toolQrGen || "QR Generator",
          description: t.toolQrGenDesc || "Create QR codes from URLs or text instantly.",
          icon: Globe,
          href: "/tools/qr-generator",
        },
        {
          title: t.toolPasswordGen || "Password Gen",
          description: t.toolPasswordGenDesc || "Generate strong and secure passwords.",
          icon: SpellCheck2,
          href: "/tools/password-generator",
        },
        {
          title: t.toolWordCounter || "Word Counter",
          description: t.toolWordCounterDesc || "Count words, characters, and reading time.",
          icon: FolderKanban,
          href: "/tools/word-counter",
        },
      ],
    },
    {
      title: t.catFiles || "📄 Work With Files",
      description: t.catFilesDesc || "Format, convert, and manage documents.",
      tools: [
        {
          title: t.toolMergePdf || "Merge PDF",
          description: t.toolMergePdfDesc || "Combine multiple PDF files into one.",
          icon: FileCode2,
          href: "/tools/merge-pdf",
        },
        {
          title: t.toolCompressPdf || "Compress PDF",
          description: t.toolCompressPdfDesc || "Reduce file size of your PDF documents.",
          icon: FolderKanban,
          href: "/tools/compress-pdf",
        },
        {
          title: t.toolPdfToWord || "PDF to Word",
          description: t.toolPdfToWordDesc || "Extract text and convert PDF to editable formats.",
          icon: FileCode2,
          href: "/tools/pdf-to-word",
        },
      ],
    },
  ];

  // Filtering Logic
  const filteredCategories = categories
    .map((category) => {
      return {
        ...category,
        tools: category.tools.filter((tool) => {
          const matchesSearch =
            tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            category.title.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesTab = activeTab === "all" || favorites.includes(tool.title);
          return matchesSearch && matchesTab;
        }),
      };
    })
    .filter((category) => category.tools.length > 0);

  return (
    <div className="bg-background min-h-screen pb-20">
      {/* Hero & Search Section */}
      <div className="border-border bg-surface relative overflow-hidden border-b">
        <div className="pointer-events-none absolute inset-0 bg-[url(/grid.svg)] opacity-[0.03]" />
        <div className="bg-primary/10 pointer-events-none absolute top-0 left-1/2 h-[400px] w-[800px] -translate-x-1/2 rounded-full blur-[120px]" />

        <div className="relative mx-auto flex max-w-5xl flex-col items-center px-6 py-20 text-center">
          <h1 className="text-foreground mb-4 text-4xl font-extrabold tracking-tight md:text-5xl">
            {t.everythingYouNeed || "Everything you need to"}{" "}
            <span className="text-primary">
              {t.everythingYouNeedHighlight || "get things done."}
            </span>
          </h1>
          <p className="text-foreground-secondary mb-10 max-w-2xl text-lg font-light">
            {t.toolsHubDesc ||
              "A unified collection of AI-powered tools, generators, and utilities to boost your productivity."}
          </p>

          {/* Universal Search Bar */}
          <div className="group relative w-full max-w-2xl">
            <div className="bg-primary/20 absolute inset-0 rounded-2xl opacity-0 blur-xl transition-opacity group-focus-within:opacity-100" />
            <div className="bg-surface-elevated border-border focus-within:border-primary/50 focus-within:ring-primary/50 relative flex w-full items-center rounded-2xl border p-2 shadow-lg transition-all focus-within:ring-1">
              <Search className="text-foreground-muted ml-3 h-5 w-5" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder={t.searchPlaceholder || "Search for tools, features, or templates..."}
                className="text-foreground placeholder:text-foreground-muted h-auto flex-1 border-none bg-transparent px-4 py-3 text-base focus-visible:ring-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="bg-surface border-border text-foreground-muted mr-1 hidden items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium sm:flex">
                <span className="text-[10px]">Ctrl</span>+ K
              </div>
            </div>
          </div>

          {/* Quick Tools Badges */}
          <div className="mt-8 flex max-w-3xl flex-wrap justify-center gap-2">
            {quickTools.map((tool, i) => (
              <button
                key={i}
                onClick={() => setSearchQuery(tool.filter)}
                className="bg-surface-elevated border-border text-foreground-secondary hover:text-foreground hover:bg-border/50 hover:border-primary/30 flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <tool.icon className="h-4 w-4" />
                {tool.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto max-w-7xl px-6 pt-12">
        {/* Continue Where You Left Off */}
        {!searchQuery && activeTab === "all" && (
          <div className="mb-16">
            <h2 className="text-foreground mb-6 flex items-center gap-2 text-xl font-bold">
              <Sparkles className="text-primary h-5 w-5" />{" "}
              {t.continueWhereLeftOff || "Continue Where You Left Off"}
            </h2>
            <div className="flex scrollbar-none gap-4 overflow-x-auto pb-4">
              {recentItems.map((item, idx) => (
                <a
                  key={idx}
                  href={item.href}
                  className="bg-surface-elevated border-border hover:border-primary/50 group w-[300px] flex-shrink-0 rounded-2xl border p-5 transition-colors"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="bg-surface border-border rounded-lg border p-2.5">
                      <item.icon className="text-primary h-4 w-4" />
                    </div>
                    <span className="text-foreground-muted text-xs font-medium">{item.time}</span>
                  </div>
                  <h3 className="text-foreground mb-4 truncate text-sm font-bold">{item.title}</h3>
                  <div className="text-primary group-hover:text-primary/80 flex items-center text-xs font-bold transition-colors">
                    {t.continue || "Continue"}{" "}
                    <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Tabs: All Tools / My Favorites */}
        <div className="border-border mb-10 flex items-center justify-center gap-4 border-b pb-4 sm:justify-start">
          <button
            onClick={() => setActiveTab("all")}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-bold transition-all",
              activeTab === "all"
                ? "bg-primary text-primary-foreground shadow-primary/20 shadow-lg"
                : "text-foreground-secondary hover:text-foreground hover:bg-surface-elevated"
            )}
          >
            {t.allTools || "All Tools"}
          </button>
          <button
            onClick={() => setActiveTab("favorites")}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all",
              activeTab === "favorites"
                ? "bg-primary text-primary-foreground shadow-primary/20 shadow-lg"
                : "text-foreground-secondary hover:text-foreground hover:bg-surface-elevated"
            )}
          >
            {t.myFavorites || "My Favorites ⭐"}
          </button>
        </div>

        {!searchQuery && activeTab === "all" && (
          <>
            <div className="mb-10 text-center">
              <h2 className="text-foreground mb-2 text-2xl font-bold">
                {t.whatAreYouHereToDo || "What Are You Here To Do?"}
              </h2>
              <p className="text-foreground-secondary">
                {t.exploreCategories || "Explore tools by category to find exactly what you need."}
              </p>
            </div>

            <div className="mb-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((category, idx) => (
                <a
                  key={idx}
                  href={`#category-${idx}`}
                  className="group bg-surface border-border hover:border-primary/50 relative overflow-hidden rounded-2xl border p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_-12px_rgba(56,189,248,0.25)]"
                >
                  <div className="from-primary/5 absolute inset-0 bg-gradient-to-b to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <h3 className="text-foreground group-hover:text-primary text-lg font-bold transition-colors">
                    {category.title}
                  </h3>
                </a>
              ))}
            </div>
          </>
        )}

        <div className="space-y-16">
          {filteredCategories.length === 0 ? (
            <div className="bg-surface border-border rounded-3xl border py-20 text-center">
              <h3 className="text-foreground mb-2 text-xl font-medium">
                {activeTab === "favorites"
                  ? t.noFavorites || "No favorites yet"
                  : t.noToolsFound || "No tools found"}
              </h3>
              <p className="text-foreground-secondary">
                {activeTab === "favorites"
                  ? t.clickHeart || "Click the heart icon on any tool to save it here."
                  : t.adjustSearch || "Try adjusting your search query."}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-primary mt-4 font-medium hover:underline"
                >
                  {t.clearSearch || "Clear search"}
                </button>
              )}
            </div>
          ) : (
            filteredCategories.map((category, idx) => (
              <section
                id={`category-${idx}`}
                key={idx}
                className="animate-in fade-in slide-in-from-bottom-8 fill-mode-both duration-700"
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-foreground flex items-center gap-3 text-2xl font-bold">
                      {category.title}
                    </h2>
                    {activeTab === "all" && (
                      <p className="text-foreground-secondary mt-1">{category.description}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {category.tools.map((tool, toolIdx) => (
                    <ToolCard
                      key={toolIdx}
                      title={tool.title}
                      description={tool.description}
                      icon={tool.icon}
                      href={tool.href}
                      badge={tool.badge}
                      badgeColor={
                        tool.badge === "POPULAR" || tool.badge === t.popular
                          ? "text-amber-500 bg-amber-500/10 border-amber-500/20"
                          : undefined
                      }
                      isFavorite={favorites.includes(tool.title)}
                      onToggleFavorite={() => toggleFavorite(tool.title)}
                    />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
