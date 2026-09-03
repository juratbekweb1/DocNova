"use client";

import Link from "next/link";
import { motion, AnimatePresence, Reorder } from "motion/react";
import {
  Sparkles,
  Star,
  Brain,
  ShieldCheck,
  Download,
  Eye,
  LayoutTemplate,
  GitBranch,
  CheckCircle,
  TrendingUp,
  Users,
  ArrowRight,
  ChevronDown,
  Zap,
  GripVertical,
} from "lucide-react";
import React, { useState } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { PricingSection } from "./pricing-section";

type Feature = {
  title: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  iconColor: string;
  glowColor: string;
  badge: string;
  badgeColor: string;
  stat: string;
  statLabel: string;
  href: string;
};

type Template = {
  name: string;
  description: string;
  accent: string;
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "DocNova",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "DocNova is an AI-powered resume builder that helps professionals create ATS-ready resumes with guided support and polished templates.",
  url: "https://DocNova.example.com",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

const AnimatedBackground = () => (
  <div className="bg-background pointer-events-none fixed inset-0 z-0 overflow-hidden">
    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.04] mix-blend-overlay" />

    <motion.div
      animate={{
        x: [0, 100, 0, -100, 0],
        y: [0, 50, 100, 50, 0],
        scale: [1, 1.2, 1, 0.8, 1],
      }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      className="bg-primary/5 dark:bg-primary/10 absolute top-1/4 left-1/4 h-[500px] w-[500px] rounded-full opacity-50 blur-3xl dark:opacity-100"
    />

    <motion.div
      animate={{
        x: [0, -150, 0, 150, 0],
        y: [0, -100, 50, -50, 0],
        scale: [1, 1.5, 1, 1.2, 1],
      }}
      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      className="bg-accent/5 dark:bg-accent/10 absolute right-1/4 bottom-1/3 h-[600px] w-[600px] rounded-full opacity-50 blur-3xl dark:opacity-100"
    />

    <motion.div
      animate={{
        x: [0, 50, -50, 50, 0],
        y: [0, 150, 0, -150, 0],
        scale: [1, 1.1, 0.9, 1.1, 1],
      }}
      transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      className="bg-primary/5 dark:bg-primary/5 absolute top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-3xl dark:opacity-100"
    />
  </div>
);

const FaqItem = ({ faq }: { faq: { question: string; answer: string } }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-border bg-background/70 hover:border-primary/15 overflow-hidden rounded-2xl border p-1 transition-colors">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-foreground hover:bg-surface flex w-full items-center justify-between rounded-xl px-5 py-4 text-left font-semibold transition-colors"
      >
        <span>{faq.question}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="text-foreground-secondary h-5 w-5 flex-shrink-0" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="text-foreground-secondary px-5 pt-2 pb-5 text-sm leading-7">
              {faq.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AiSummaryDemo = () => {
  const [input, setInput] = useState(
    "Worked as a product designer for 5 years. Managed teams, improved engagement by 40%."
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState("");
  const [hasGenerated, setHasGenerated] = useState(false);

  const fullText =
    "Highly motivated Product Designer with 5+ years of experience building scalable design systems and improving user engagement by 40%. Proven track record of leading cross-functional teams in agile environments.";

  const handleGenerate = () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setGeneratedText("");
    setHasGenerated(false);

    setTimeout(() => {
      setIsGenerating(false);
      setHasGenerated(true);
      let currentText = "";
      let i = 0;
      const interval = setInterval(() => {
        currentText += fullText[i];
        setGeneratedText(currentText);
        i++;
        if (i === fullText.length) clearInterval(interval);
      }, 15);
    }, 1500);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="bg-surface-elevated border-border text-foreground-secondary focus:border-primary/50 h-24 w-full resize-none rounded-xl border p-4 text-sm focus:outline-none"
          placeholder="Yutuqlaringizni yozing..."
        />
        <button
          onClick={handleGenerate}
          disabled={isGenerating || input.length === 0}
          className="bg-primary hover:bg-primary text-foreground absolute right-3 bottom-3 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
        >
          {isGenerating ? "Yaratilmoqda..." : "Yaratish (Generate)"}
        </button>
      </div>

      {(isGenerating || hasGenerated) && (
        <div className="flex items-center gap-3 py-2">
          <Brain
            className={`h-5 w-5 ${isGenerating ? "text-primary animate-pulse" : "text-primary"}`}
          />
          <div className="bg-surface h-1 w-full overflow-hidden rounded-full">
            {isGenerating ? (
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="from-primary to-accent h-full bg-gradient-to-r"
              />
            ) : (
              <div className="from-primary to-accent h-full w-full bg-gradient-to-r" />
            )}
          </div>
        </div>
      )}

      {hasGenerated && (
        <div className="bg-primary/10 border-primary/20 text-primary min-h-[80px] rounded-xl border p-4 text-sm leading-relaxed">
          {generatedText}
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="bg-primary ml-1 inline-block h-4 w-1.5 align-middle"
          />
        </div>
      )}
    </div>
  );
};

const ExperienceDragDemo = () => {
  const [items, setItems] = useState([
    { id: "1", role: "Senior Product Designer", company: "TechCorp Inc.", year: "2021-Present" },
    { id: "2", role: "UI/UX Designer", company: "StartupHub", year: "2019-2021" },
    { id: "3", role: "Graphic Designer", company: "Creative Agency", year: "2017-2019" },
  ]);

  return (
    <div className="space-y-4">
      <div className="text-foreground-secondary mb-2 text-xs">
        Tajribalarni o&apos;rnini almashtirish uchun torting (Drag & drop)
      </div>
      <Reorder.Group axis="y" values={items} onReorder={setItems} className="space-y-2">
        {items.map((item) => (
          <Reorder.Item
            key={item.id}
            value={item}
            className="border-border bg-surface/80 hover:border-primary/15 flex cursor-grab items-center gap-3 rounded-xl border p-3 transition-colors active:cursor-grabbing"
          >
            <GripVertical className="text-foreground-secondary h-4 w-4" />
            <div className="flex-1">
              <div className="text-foreground text-sm font-semibold">{item.role}</div>
              <div className="text-foreground-secondary text-xs">
                {item.company} &bull; {item.year}
              </div>
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      <div className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4">
        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
        <p className="text-xs text-emerald-100/90">
          <span className="font-semibold text-emerald-300">Suggestion:</span> Start this bullet
          point with a strong action verb like &quot;Spearheaded&quot; or &quot;Architected&quot;
          instead of &quot;Responsible for&quot;.
        </p>
      </div>
    </div>
  );
};

export function LandingPage() {
  const { t } = useLanguage();
  const [activeDemoTab, setActiveDemoTab] = useState(0);

  const features: Feature[] = [
    {
      title: t.featAiWritingTitle,
      description: t.featAiWritingDesc,
      icon: Brain,
      gradient: "from-primary/20 via-sky-500/10 to-transparent",
      iconColor: "text-primary",
      glowColor: "rgba(34, 211, 238, 0.15)",
      badge: t.featAiBadge,
      badgeColor: "bg-primary/10 text-primary border-primary/15",
      stat: "3x",
      statLabel: t.featAiStatLabel,
      href: "/features/ai-writing",
    },
    {
      title: t.featAtsTitle,
      description: t.featAtsDesc,
      icon: ShieldCheck,
      gradient: "from-violet-500/20 via-purple-500/10 to-transparent",
      iconColor: "text-violet-400",
      glowColor: "rgba(139, 92, 246, 0.15)",
      badge: t.featAtsBadge,
      badgeColor: "bg-violet-400/10 text-violet-300 border-violet-400/30",
      stat: "98%",
      statLabel: t.featAtsStatLabel,
      href: "/features/ats-formatting",
    },
    {
      title: t.featExportTitle,
      description: t.featExportDesc,
      icon: Download,
      gradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
      iconColor: "text-emerald-400",
      glowColor: "rgba(52, 211, 153, 0.15)",
      badge: t.featExportBadge,
      badgeColor: "bg-emerald-400/10 text-emerald-300 border-emerald-400/30",
      stat: "2s",
      statLabel: t.featExportStatLabel,
      href: "/features/exports",
    },
    {
      title: t.featPreviewTitle,
      description: t.featPreviewDesc,
      icon: Eye,
      gradient: "from-orange-500/20 via-amber-500/10 to-transparent",
      iconColor: "text-orange-400",
      glowColor: "rgba(251, 146, 60, 0.15)",
      badge: t.featPreviewBadge,
      badgeColor: "bg-orange-400/10 text-orange-300 border-orange-400/30",
      stat: "0ms",
      statLabel: t.featPreviewStatLabel,
      href: "/features/preview",
    },
    {
      title: t.featTemplatesTitle,
      description: t.featTemplatesDesc,
      icon: LayoutTemplate,
      gradient: "from-pink-500/20 via-rose-500/10 to-transparent",
      iconColor: "text-pink-400",
      glowColor: "rgba(244, 114, 182, 0.15)",
      badge: t.featTemplatesBadge,
      badgeColor: "bg-pink-400/10 text-pink-300 border-pink-400/30",
      stat: "20+",
      statLabel: t.featTemplatesStatLabel,
      href: "/features/templates",
    },
    {
      title: t.featVersionsTitle,
      description: t.featVersionsDesc,
      icon: GitBranch,
      gradient: "from-accent/20 via-indigo-500/10 to-transparent",
      iconColor: "text-blue-400",
      glowColor: "rgba(96, 165, 250, 0.15)",
      badge: t.featVersionsBadge,
      badgeColor: "bg-blue-400/10 text-blue-300 border-blue-400/30",
      stat: "∞",
      statLabel: t.featVersionsStatLabel,
      href: "/features/versions",
    },
  ];

  const templates: Template[] = [
    {
      name: t.tplModernExecutive,
      description: t.tplModernExecutiveDesc,
      accent: "from-primary/20 to-sky-500/20",
    },
    {
      name: t.tplProductDesigner,
      description: t.tplProductDesignerDesc,
      accent: "from-fuchsia-500/20 to-violet-500/20",
    },
    {
      name: t.tplStartupOperator,
      description: t.tplStartupOperatorDesc,
      accent: "from-emerald-500/20 to-teal-500/20",
    },
  ];

  const faqs = [
    {
      question: t.faq1Q,
      answer: t.faq1A,
    },
    {
      question: t.faq2Q,
      answer: t.faq2A,
    },
    {
      question: t.faq3Q,
      answer: t.faq3A,
    },
  ];

  return (
    <div className="text-foreground relative min-h-screen bg-transparent">
      <AnimatedBackground />
      <div className="relative z-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <a
          href="#main-content"
          className="focus:text-foreground sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2"
        >
          {t.skipToContent}
        </a>
        <main id="main-content">
          <section className="mx-auto flex max-w-7xl flex-col items-center gap-12 px-6 py-20 text-center sm:px-8 lg:px-12 lg:py-28">
            <div className="flex max-w-3xl flex-col items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="border-primary/40 bg-primary/10 text-primary mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium"
              >
                <Sparkles className="h-4 w-4" />
                {t.heroTagline}
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-foreground text-4xl font-semibold tracking-tight sm:text-5xl lg:text-7xl lg:leading-[1.1]"
              >
                {t.heroTitle1}
                <span className="gradient-text">{t.heroTitle2}</span>
                {t.heroTitle3}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-foreground-secondary mt-6 max-w-2xl text-lg leading-8"
              >
                {t.heroDesc}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-10 flex flex-wrap justify-center gap-4"
              >
                <a
                  href="/pricing"
                  className="premium-button from-primary to-accent text-foreground shadow-primary/50 hover:shadow-primary/60 rounded-full bg-gradient-to-r px-8 py-4 text-lg font-semibold shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                >
                  {t.startBuildingFree}
                </a>
                <a
                  href="/tools"
                  className="text-foreground hover:border-primary/30 rounded-full border border-white/20 px-8 py-4 text-lg font-semibold transition-all hover:scale-105 hover:bg-white/10"
                >
                  Tools Hub & Demo
                </a>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-foreground-secondary mt-10 flex flex-wrap justify-center gap-6 text-sm"
              >
                <div className="border-border bg-surface flex items-center gap-3 rounded-full border p-1.5 pr-4 backdrop-blur-sm">
                  <div className="flex -space-x-3">
                    {["jack", "amy", "john", "sarah"].map((seed) => (
                      <div
                        key={seed}
                        className="border-background bg-surface hover:ring-primary relative h-9 w-9 overflow-hidden rounded-full border-2 ring-2 ring-transparent transition-all hover:z-10 hover:scale-110"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`https://api.dicebear.com/7.x/notionists/svg?seed=${seed}&backgroundColor=0891b2,0284c7`}
                          alt="User"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  <span className="font-medium">{t.usedBy}</span>
                </div>
                <div className="border-border bg-surface flex items-center gap-2 rounded-full border px-4 py-1.5 backdrop-blur-sm">
                  <Star className="fill-primary text-primary h-4 w-4" />
                  <span className="text-foreground-secondary font-medium">{t.avgSatisfaction}</span>
                </div>
              </motion.div>
            </div>

            {/* Premium Browser Window Preview */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                opacity: { duration: 0.8, delay: 0.4 },
                y: { duration: 0.8, delay: 0.4, type: "spring", bounce: 0.2 },
              }}
              className="border-surface-elevated/50 bg-background relative z-20 mx-auto mt-16 w-full max-w-5xl rounded-[2.5rem] border-[4px] p-1 shadow-[0_30px_80px_-15px_rgba(245,158,11,0.4)] sm:mt-24"
            >
              <div className="border-border bg-surface relative overflow-hidden rounded-[2rem] border shadow-inner">
                {/* Editor Chrome */}
                <div className="bg-surface border-border flex items-center border-b px-6 py-4 shadow-sm">
                  <div className="flex w-1/3 gap-2">
                    <div className="bg-border h-3.5 w-3.5 rounded-full transition-colors hover:bg-red-400" />
                    <div className="bg-border h-3.5 w-3.5 rounded-full transition-colors hover:bg-amber-400" />
                    <div className="bg-border h-3.5 w-3.5 rounded-full transition-colors hover:bg-green-400" />
                  </div>
                  <div className="flex w-1/3 justify-center">
                    <div className="bg-surface-elevated text-foreground-secondary border-border flex h-7 w-full max-w-[280px] items-center justify-center rounded-lg border text-xs font-semibold shadow-inner">
                      <ShieldCheck className="text-foreground-secondary mr-2 h-3.5 w-3.5" />{" "}
                      app.DocNova.com/editor
                    </div>
                  </div>
                  <div className="flex w-1/3 justify-end">
                    <div className="bg-primary/10 border-primary/20 text-primary flex h-7 w-20 items-center justify-center gap-1.5 rounded-lg border text-xs font-bold shadow-sm">
                      <Sparkles className="h-3 w-3" /> AI
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 text-left md:grid-cols-[1fr_1.2fr]">
                  {/* Interactive Form Side */}
                  <div className="bg-background/50 border-border space-y-4 rounded-xl border p-5">
                    <div className="mb-2 flex items-center gap-2">
                      <Zap className="text-primary h-4 w-4" />
                      <span className="text-foreground text-sm font-semibold">Live Editor</span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-foreground-secondary mb-1 block text-xs">
                          Full Name
                        </label>
                        <input
                          type="text"
                          defaultValue="Alex Johnson"
                          id="demo-name"
                          onChange={(e) => {
                            const el = document.getElementById("preview-name");
                            if (el) el.textContent = e.target.value || "Your Name";
                          }}
                          className="border-border bg-background text-foreground focus:border-primary/50 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-foreground-secondary mb-1 block text-xs">Role</label>
                        <input
                          type="text"
                          defaultValue="Senior Product Designer"
                          id="demo-role"
                          onChange={(e) => {
                            const el = document.getElementById("preview-role");
                            if (el) el.textContent = e.target.value || "Your Role";
                          }}
                          className="border-border bg-background text-foreground focus:border-primary/50 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-foreground-secondary mb-1 block text-xs">
                          Summary
                        </label>
                        <textarea
                          defaultValue="Passionate about creating intuitive user experiences and leading design systems."
                          rows={3}
                          onChange={(e) => {
                            const el = document.getElementById("preview-summary");
                            if (el) el.textContent = e.target.value || "Your summary...";
                          }}
                          className="border-border bg-background text-foreground focus:border-primary/50 w-full resize-none rounded-lg border px-3 py-2 text-sm focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="bg-primary/10 border-primary/20 text-primary mt-4 rounded-lg border p-3 text-xs">
                      Type in the fields above to see the resume update instantly on the right!
                    </div>
                  </div>

                  {/* Live Preview Side */}
                  <div className="relative overflow-hidden rounded-xl border border-slate-200/50 bg-[#FDFDFD] p-6 text-slate-900 shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)] md:p-8">
                    <div className="from-primary to-accent absolute top-0 left-0 h-2 w-full bg-gradient-to-r" />
                    <div className="mb-4 border-b border-slate-200 pb-4">
                      <h2
                        id="preview-name"
                        className="text-2xl font-bold text-slate-900 transition-all duration-200"
                      >
                        Alex Johnson
                      </h2>
                      <p
                        id="preview-role"
                        className="text-sm font-semibold text-cyan-700 transition-all duration-200"
                      >
                        Senior Product Designer
                      </p>
                      <div className="text-foreground-secondary mt-2 flex gap-3 text-[10px] font-medium">
                        <span>alex@example.com</span>
                        <span>•</span>
                        <span>+1 234 567 890</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h3 className="text-foreground-secondary mb-2 text-[10px] font-bold tracking-widest uppercase">
                        Summary
                      </h3>
                      <p
                        id="preview-summary"
                        className="text-xs leading-relaxed text-slate-600 transition-all duration-200"
                      >
                        Passionate about creating intuitive user experiences and leading design
                        systems.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-foreground-secondary mb-2 text-[10px] font-bold tracking-widest uppercase">
                        Experience
                      </h3>
                      <div className="mb-3">
                        <div className="flex items-baseline justify-between">
                          <h4 className="text-xs font-semibold text-slate-900">Lead Designer</h4>
                          <span className="text-foreground-secondary text-[10px]">
                            2021 - Present
                          </span>
                        </div>
                        <div className="mb-1 text-[10px] font-medium text-cyan-700">
                          TechCorp Inc.
                        </div>
                        <ul className="list-disc space-y-1 pl-4 text-xs text-slate-600">
                          <li>Directed the redesign of the core product</li>
                          <li>Managed a team of 4 product designers</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </section>

          <section
            className="border-border from-primary/5 via-accent/5 relative overflow-hidden border-y bg-gradient-to-r to-indigo-500/5 px-6 py-8 sm:px-8 lg:px-12"
            aria-label="Social proof"
          >
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />
            <div className="text-foreground-secondary relative z-10 mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-4 text-sm sm:gap-8">
              {[
                { text: t.socialProof1, icon: Star },
                { text: t.socialProof2, icon: Users },
                { text: t.socialProof3, icon: TrendingUp },
                { text: t.socialProof4, icon: CheckCircle },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="group border-border bg-surface hover:border-primary/15 hover:bg-primary/10 flex cursor-pointer items-center gap-2 rounded-full border px-5 py-2.5 backdrop-blur-md transition-all hover:shadow-[0_0_20px_-5px_rgba(34,211,238,0.3)]"
                  >
                    <Icon className="text-primary/70 group-hover:text-primary h-4 w-4 transition-colors" />
                    <span className="text-foreground-secondary group-hover:text-primary font-medium transition-colors">
                      {item.text}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* ═══════════════════════════════════════════
             KEY FEATURES — Premium Section
        ═══════════════════════════════════════════ */}
          <section id="features" className="relative mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12">
            {/* Ambient background glow */}
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
              <div className="from-primary/8 absolute top-0 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-b via-violet-500/5 to-transparent blur-3xl" />
            </div>

            {/* Section header */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mx-auto max-w-3xl text-center"
            >
              <div className="border-primary/15 bg-primary/8 text-primary mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold tracking-[0.2em] uppercase">
                <Zap className="h-3.5 w-3.5" />
                {t.keyFeatures}
              </div>
              <h2 className="text-foreground text-4xl font-semibold tracking-tight sm:text-5xl">
                {t.featuresTitle1}
                <span className="gradient-text">{t.featuresTitle2}</span>
                {t.featuresTitle3}
              </h2>
              <p className="text-foreground-secondary mt-4 text-lg leading-8">{t.featuresDesc}</p>
            </motion.div>

            {/* Feature cards grid */}
            <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Link key={feature.title} href={feature.href} className="block">
                    <motion.article
                      initial={{ opacity: 0, y: 32 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.08 }}
                      className="group bg-background/60 relative h-full overflow-hidden rounded-2xl border border-white/8 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5"
                      style={{
                        boxShadow: "0 0 0 0 transparent",
                      }}
                      whileHover={{
                        boxShadow: `0 20px 60px -10px ${feature.glowColor}, 0 0 0 1px rgba(255,255,255,0.08)`,
                      }}
                    >
                      {/* Card gradient background */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                      />

                      {/* Shimmer sweep on hover */}
                      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/4 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                      <div className="relative flex h-full flex-col">
                        <div>
                          {/* Icon + badge row */}
                          <div className="mb-5 flex items-start justify-between">
                            <div
                              className={`flex h-14 w-14 items-center justify-center rounded-2xl border bg-gradient-to-br ${feature.gradient} ${feature.badgeColor}`}
                            >
                              <Icon className={`h-7 w-7 ${feature.iconColor}`} />
                            </div>
                            <span
                              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${feature.badgeColor}`}
                            >
                              {feature.badge}
                            </span>
                          </div>

                          {/* Stat */}
                          <div className="mb-3 flex items-baseline gap-1.5">
                            <span className={`text-3xl font-bold ${feature.iconColor}`}>
                              {feature.stat}
                            </span>
                            <span className="text-foreground-secondary text-xs">
                              {feature.statLabel}
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="text-foreground text-lg font-semibold">{feature.title}</h3>

                          {/* Description */}
                          <p className="text-foreground-secondary mt-2.5 mb-5 text-sm leading-7">
                            {feature.description}
                          </p>
                        </div>

                        <div className="mt-auto">
                          {/* Bottom CTA line */}
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-semibold ${feature.iconColor}`}>
                              {t.exploreFeature}
                            </span>
                            <ArrowRight
                              className={`h-3.5 w-3.5 ${feature.iconColor} transition-transform group-hover:translate-x-1`}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  </Link>
                );
              })}
            </div>

            {/* Bottom metrics strip */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-background/50 mt-16 grid grid-cols-2 gap-4 rounded-2xl border border-white/8 p-6 backdrop-blur-sm md:grid-cols-4"
            >
              {[
                { icon: Users, value: "12k+", label: t.statActiveUsers, color: "text-primary" },
                {
                  icon: TrendingUp,
                  value: "98%",
                  label: t.statInterviewRate,
                  color: "text-emerald-400",
                },
                { icon: Star, value: "4.9/5", label: t.statUserRating, color: "text-primary" },
                {
                  icon: Zap,
                  value: "< 10min",
                  label: t.statAvgBuildTime,
                  color: "text-violet-400",
                },
              ].map((stat, i) => {
                const StatIcon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 * i }}
                    className="flex flex-col items-center gap-1 text-center"
                  >
                    <StatIcon className={`h-5 w-5 ${stat.color} mb-1`} />
                    <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
                    <span className="text-foreground-secondary text-xs">{stat.label}</span>
                  </motion.div>
                );
              })}
            </motion.div>
          </section>

          <section id="demo" className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12">
            <div className="border-border from-primary/10 via-background to-background relative grid gap-8 overflow-hidden rounded-3xl border bg-gradient-to-br p-8 lg:grid-cols-[0.9fr_1.1fr] lg:p-12">
              {/* Ambient glow */}
              <div className="bg-primary/10 pointer-events-none absolute top-0 right-0 h-96 w-96 translate-x-1/3 -translate-y-1/3 rounded-full blur-3xl" />

              <div className="relative z-10 flex flex-col justify-center">
                <div className="border-primary/15 bg-primary/8 text-primary mb-4 inline-flex w-fit items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold tracking-[0.2em] uppercase">
                  {t.demoTagline}
                </div>
                <h2 className="text-foreground mt-3 text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
                  {t.demoTitle}
                </h2>
                <p className="text-foreground-secondary mt-4 mb-8 text-lg leading-8">
                  {t.demoDesc}
                </p>

                <div className="flex flex-col gap-3">
                  {[
                    { title: t.profSummaryTag, desc: t.profSummaryDesc, icon: Brain },
                    { title: t.expBuilder, desc: t.expBuilderDesc, icon: Zap },
                  ].map((tab, idx) => {
                    const isActive = activeDemoTab === idx;
                    const Icon = tab.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => setActiveDemoTab(idx)}
                        className={`group flex items-start gap-4 rounded-2xl border p-5 text-left transition-all duration-300 ${
                          isActive
                            ? "border-primary/40 bg-primary/10 shadow-[0_0_30px_-5px_rgba(34,211,238,0.2)]"
                            : "border-border bg-surface hover:border-white/15 hover:bg-white/10"
                        }`}
                      >
                        <div
                          className={`mt-0.5 rounded-full p-2 transition-colors ${isActive ? "bg-primary/20" : "bg-surface group-hover:bg-border"}`}
                        >
                          <Icon
                            className={`h-5 w-5 ${isActive ? "text-primary" : "text-foreground-secondary"}`}
                          />
                        </div>
                        <div>
                          <h3
                            className={`font-semibold transition-colors ${isActive ? "text-primary" : "text-foreground"}`}
                          >
                            {tab.title}
                          </h3>
                          <p
                            className={`mt-1.5 text-sm transition-colors ${isActive ? "text-primary/70" : "text-foreground-secondary"}`}
                          >
                            {tab.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="relative z-10 flex min-h-[400px] items-center justify-center">
                <div className="border-border bg-background/60 relative h-full w-full overflow-hidden rounded-2xl border p-4 shadow-2xl backdrop-blur-xl sm:p-6">
                  {/* Fake App Header */}
                  <div className="border-border mb-4 flex items-center justify-between border-b pb-4">
                    <div className="flex items-center gap-3">
                      <div className="from-primary to-accent flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br">
                        <Sparkles className="text-foreground h-4 w-4" />
                      </div>
                      <span className="text-foreground text-sm font-semibold">DocNova AI</span>
                    </div>
                    <div className="flex gap-1.5">
                      <div className="bg-border h-2.5 w-2.5 rounded-full" />
                      <div className="bg-border h-2.5 w-2.5 rounded-full" />
                      <div className="bg-border h-2.5 w-2.5 rounded-full" />
                    </div>
                  </div>

                  {/* Dynamic Content Based on Tab */}
                  <div className="relative">
                    {activeDemoTab === 0 ? (
                      <motion.div
                        key="tab0"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        <AiSummaryDemo />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="tab1"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        <ExperienceDragDemo />
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="templates" className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12">
            <div className="max-w-2xl">
              <p className="text-primary text-sm font-semibold tracking-[0.24em] uppercase">
                {t.templatesTagline}
              </p>
              <h2 className="text-foreground mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                {t.templatesHeadline}
              </h2>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {templates.map((template) => (
                <article
                  key={template.name}
                  className={`border-border rounded-2xl border bg-gradient-to-br ${template.accent} p-[1px]`}
                >
                  <div className="bg-background/90 rounded-[15px] p-6">
                    <h3 className="text-foreground text-lg font-semibold">{template.name}</h3>
                    <p className="text-foreground-secondary mt-3 text-sm leading-7">
                      {template.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <PricingSection />

          <section className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12">
            <div className="border-border bg-background/70 rounded-3xl border p-8 lg:p-12">
              <div className="max-w-2xl">
                <p className="text-primary text-sm font-semibold tracking-[0.24em] uppercase">
                  {t.testimonialsTagline}
                </p>
                <h2 className="text-foreground mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  {t.testimonialsTitle}
                </h2>
              </div>
              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <blockquote className="border-border bg-surface text-foreground-secondary rounded-2xl border p-6">
                  {t.testimonial1}
                </blockquote>
                <blockquote className="border-border bg-surface text-foreground-secondary rounded-2xl border p-6">
                  {t.testimonial2}
                </blockquote>
              </div>
            </div>
          </section>

          <section id="faq" className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12">
            <div className="max-w-2xl">
              <p className="text-primary text-sm font-semibold tracking-[0.24em] uppercase">
                {t.faqTagline}
              </p>
              <h2 className="text-foreground mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                {t.faqTitle}
              </h2>
            </div>
            <div className="mt-10 grid gap-4">
              {faqs.map((faq, idx) => (
                <FaqItem key={idx} faq={faq} />
              ))}
            </div>
          </section>

          <section id="cta" className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12">
            <div className="border-primary/15 bg-primary/10 rounded-3xl border p-8 text-center lg:p-12">
              <h2 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
                {t.ctaTitle}
              </h2>
              <p className="text-foreground-secondary mx-auto mt-4 max-w-2xl text-lg leading-8">
                {t.ctaDesc}
              </p>
              <a
                href="/register"
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20 mt-8 inline-flex rounded-full px-6 py-3 font-semibold shadow-md transition-all hover:scale-105"
              >
                {t.getStartedToday}
              </a>
            </div>
          </section>
        </main>

        <footer className="border-border bg-background/80 border-t px-6 py-10 sm:px-8 lg:px-12">
          <div className="text-foreground-secondary mx-auto flex max-w-7xl flex-col gap-4 text-sm md:flex-row md:items-center md:justify-between">
            <p>{t.footerCopyright}</p>
            <div className="flex gap-4">
              <a href="#features" className="hover:text-foreground transition">
                {t.footerFeatures}
              </a>
              <a href="#pricing" className="hover:text-foreground transition">
                {t.footerPricing}
              </a>
              <a href="#faq" className="hover:text-foreground transition">
                {t.footerFAQ}
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
