import fs from "node:fs";

const path = "src/app/tools/page.tsx";
let content = fs.readFileSync(path, "utf8");

if (!content.includes("useLanguage")) {
  content = content.replace(
    'import { cn } from "@/lib/utils";',
    'import { cn } from "@/lib/utils";\\nimport { useLanguage } from "@/components/providers/language-provider";'
  );
}

if (!content.includes("const { t } = useLanguage();")) {
  content = content.replace(
    "export default function ToolsHubPage() {\\n  const { data: session, status } = useSession();",
    "export default function ToolsHubPage() {\\n  const { data: session, status } = useSession();\\n  const { t } = useLanguage();"
  );
}

content = content.replace(
  /const quickTools = \[[\s\S]*?const categories = \[/,
  "const quickTools = [" +
    "\\n" +
    '    { name: t.filterResume || "Resume", icon: FileText, filter: "resume" },' +
    "\\n" +
    '    { name: t.filterPdf || "PDF", icon: FileCode2, filter: "pdf" },' +
    "\\n" +
    '    { name: t.filterIelts || "IELTS", icon: GraduationCap, filter: "ielts" },' +
    "\\n" +
    '    { name: t.filterCoverLetter || "Cover Letter", icon: Briefcase, filter: "cover letter" },' +
    "\\n" +
    '    { name: t.filterAiWriter || "AI Writer", icon: PencilRuler, filter: "ai writer" },' +
    "\\n" +
    '    { name: t.filterTranslator || "Translator", icon: Globe, filter: "translator" },' +
    "\\n" +
    '    { name: t.filterGrammar || "Grammar", icon: SpellCheck2, filter: "grammar" },' +
    "\\n" +
    "  ];" +
    "\\n" +
    "\\n" +
    "  const categories = ["
);

content = content.replace(
  /const categories = \[[\s\S]*?  \];/,
  "const categories = [" +
    "\\n" +
    "    {" +
    "\\n" +
    '      title: t.catEdu || "🎓 Education Hub",' +
    "\\n" +
    '      description: t.catEduDesc || "Smart tools to accelerate your learning and test prep.",' +
    "\\n" +
    "      tools: [" +
    "\\n" +
    '        { title: t.toolIelts || "IELTS Mock Test", description: t.toolIeltsDesc || "Full IELTS simulation with AI scoring for all sections.", icon: GraduationCap, href: "/tools/ielts-mock", badge: t.popular || "POPULAR" },' +
    "\\n" +
    '        { title: t.toolCefr || "CEFR Level Test", description: t.toolCefrDesc || "Accurate A1-C2 English proficiency assessment.", icon: Target, href: "/tools/cefr-test" },' +
    "\\n" +
    '        { title: t.toolSat || "SAT Digital Practice", description: t.toolSatDesc || "Mock exams for Math and Reading/Writing.", icon: BookOpen, href: "/tools/sat-practice" },' +
    "\\n" +
    '        { title: t.toolAiStudy || "AI Study Assistant", description: t.toolAiStudyDesc || "Generate summaries, flashcards & quizzes from PDF.", icon: BrainCircuit, href: "/tools/ai-study-assistant", badge: t.proBadge || "PRO" },' +
    "\\n" +
    "      ]" +
    "\\n" +
    "    }," +
    "\\n" +
    "    {" +
    "\\n" +
    '      title: t.catCareer || "💼 Career Hub",' +
    "\\n" +
    '      description: t.catCareerDesc || "Everything you need to land your next dream role.",' +
    "\\n" +
    "      tools: [" +
    "\\n" +
    '        { title: t.toolResumeBuilder || "Resume Builder", description: t.toolResumeBuilderDesc || "Create ATS-friendly resumes in minutes.", icon: FileText, href: "/tools/resume-builder", badge: t.popular || "POPULAR" },' +
    "\\n" +
    '        { title: t.toolCvAnalyzer || "CV Analyzer", description: t.toolCvAnalyzerDesc || "AI scoring and improvement suggestions for your CV.", icon: BarChart, href: "/tools/cv-analyzer", badge: t.proBadge || "PRO" },' +
    "\\n" +
    '        { title: t.toolCoverLetter || "Cover Letter AI", description: t.toolCoverLetterDesc || "Generate tailored cover letters based on job descriptions.", icon: Briefcase, href: "/tools/cover-letter" },' +
    "\\n" +
    '        { title: t.toolInterviewPrep || "Interview Prep AI", description: t.toolInterviewPrepDesc || "Mock interview with HR and technical questions.", icon: Mic, href: "/tools/interview-prep" },' +
    "\\n" +
    "      ]" +
    "\\n" +
    "    }," +
    "\\n" +
    "    {" +
    "\\n" +
    '      title: t.catWriting || "✍️ AI Writing",' +
    "\\n" +
    '      description: t.catWritingDesc || "Productivity tools to accelerate your workflow.",' +
    "\\n" +
    "      tools: [" +
    "\\n" +
    '        { title: t.toolAiWriterPro || "AI Writer Pro", description: t.toolAiWriterProDesc || "Draft emails, reports, and articles instantly.", icon: PencilRuler, href: "/tools/ai-writer", badge: t.proBadge || "PRO" },' +
    "\\n" +
    "      ]" +
    "\\n" +
    "    }," +
    "\\n" +
    "    {" +
    "\\n" +
    '      title: t.catUtils || "🛠️ Quick Utilities",' +
    "\\n" +
    '      description: t.catUtilsDesc || "Handy tools for everyday tasks.",' +
    "\\n" +
    "      tools: [" +
    "\\n" +
    '        { title: t.toolQrGen || "QR Generator", description: t.toolQrGenDesc || "Create QR codes from URLs or text instantly.", icon: Globe, href: "/tools/qr-generator" },' +
    "\\n" +
    '        { title: t.toolPasswordGen || "Password Gen", description: t.toolPasswordGenDesc || "Generate strong and secure passwords.", icon: SpellCheck2, href: "/tools/password-generator" },' +
    "\\n" +
    '        { title: t.toolWordCounter || "Word Counter", description: t.toolWordCounterDesc || "Count words, characters, and reading time.", icon: FolderKanban, href: "/tools/word-counter" },' +
    "\\n" +
    "      ]" +
    "\\n" +
    "    }," +
    "\\n" +
    "    {" +
    "\\n" +
    '      title: t.catFiles || "📄 Work With Files",' +
    "\\n" +
    '      description: t.catFilesDesc || "Format, convert, and manage documents.",' +
    "\\n" +
    "      tools: [" +
    "\\n" +
    '        { title: t.toolMergePdf || "Merge PDF", description: t.toolMergePdfDesc || "Combine multiple PDF files into one.", icon: FileCode2, href: "/tools/merge-pdf" },' +
    "\\n" +
    '        { title: t.toolCompressPdf || "Compress PDF", description: t.toolCompressPdfDesc || "Reduce file size of your PDF documents.", icon: FolderKanban, href: "/tools/compress-pdf" },' +
    "\\n" +
    '        { title: t.toolPdfToWord || "PDF to Word", description: t.toolPdfToWordDesc || "Extract text and convert PDF to editable formats.", icon: FileCode2, href: "/tools/pdf-to-word" },' +
    "\\n" +
    "      ]" +
    "\\n" +
    "    }" +
    "\\n" +
    "  ];"
);

content = content.replace(
  'Everything you need to <span className="text-primary">get things done.</span>',
  '{t.everythingYouNeed} <span className="text-primary">{t.everythingYouNeedHighlight}</span>'
);

content = content.replace(
  "A unified collection of AI-powered tools, generators, and utilities to boost your productivity.",
  "{t.toolsHubDesc}"
);

content = content.replace(
  'placeholder="Search for tools, features, or templates..."',
  'placeholder={t.searchPlaceholder || "Search for tools, features, or templates..."}'
);

content = content.replace(
  "Continue Where You Left Off",
  '{t.continueWhereLeftOff || "Continue Where You Left Off"}'
);

content = content.replace("Continue <ArrowRight", '{t.continue || "Continue"} <ArrowRight');

content = content.replace(
  ">\\n            All Tools\\n          </button>",
  '>\\n            {t.allTools || "All Tools"}\\n          </button>'
);

content = content.replace(
  ">\\n            My Favorites ⭐\\n          </button>",
  '>\\n            {t.myFavorites || "My Favorites ⭐"}\\n          </button>'
);

content = content.replace(
  "What Are You Here To Do?",
  '{t.whatAreYouHereToDo || "What Are You Here To Do?"}'
);

content = content.replace(
  "Explore tools by category to find exactly what you need.",
  '{t.exploreCategories || "Explore tools by category to find exactly what you need."}'
);

content = content.replace(
  'activeTab === "favorites" ? "No favorites yet" : "No tools found"',
  'activeTab === "favorites" ? (t.noFavorites || "No favorites yet") : (t.noToolsFound || "No tools found")'
);

content = content.replace(
  'activeTab === "favorites" ? "Click the heart icon on any tool to save it here." : "Try adjusting your search query."',
  'activeTab === "favorites" ? (t.clickHeart || "Click the heart icon on any tool to save it here.") : (t.adjustSearch || "Try adjusting your search query.")'
);

content = content.replace(">Clear search</button>", '>{t.clearSearch || "Clear search"}</button>');

fs.writeFileSync(path, content);
console.log("Tools page updated!");
