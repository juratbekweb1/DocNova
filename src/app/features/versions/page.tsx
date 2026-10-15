"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GitBranch, Clock, GitCompare, ChevronRight, Check, Plus, RotateCcw } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";

const versions = [
  {
    id: 1,
    label: "v1.0",
    title: "Initial Resume",
    date: "Jul 28, 2026",
    time: "10:23 AM",
    changes: 3,
    badge: "original",
    bullets: [
      "Created initial resume structure",
      "Added work experience at TechCorp",
      "Listed 6 core skills",
    ],
    content: "Basic resume with 2 years of experience. Used simple language and minimal structure.",
  },
  {
    id: 2,
    label: "v1.1",
    title: "Added metrics",
    date: "Jul 29, 2026",
    time: "2:15 PM",
    changes: 5,
    badge: null,
    bullets: [
      "Quantified all 4 bullet points with metrics",
      "Added 3 new technical skills",
      "Improved professional summary",
      "Fixed typo in contact info",
      "Reordered skills by relevance",
    ],
    content:
      "Improved resume with measurable achievements. Added performance metrics and expanded skills section.",
  },
  {
    id: 3,
    label: "v1.2",
    title: "ATS optimized",
    date: "Jul 30, 2026",
    time: "11:47 AM",
    changes: 7,
    badge: null,
    bullets: [
      "Added 8 ATS keywords from job description",
      "Reformatted dates to consistent style",
      "Replaced weak verbs with action verbs",
      "Added LinkedIn and GitHub URLs",
      "Expanded skills to 12 items",
      "Tightened summary to 2 sentences",
      "Added education GPA",
    ],
    content:
      "ATS-optimized version with targeted keywords and stronger action verbs. Score improved from 42 to 78.",
  },
  {
    id: 4,
    label: "v2.0",
    title: "Full redesign",
    date: "Jul 31, 2026",
    time: "9:05 AM",
    changes: 12,
    badge: "current",
    bullets: [
      "Complete structural redesign",
      "New 2-column layout",
      "Added portfolio links section",
      "AI-improved all 8 bullet points",
      "Added 2 new positions",
      "New professional photo placeholder",
      "Updated skills to 2026 standards",
      "Added certifications section",
      "Improved typography hierarchy",
      "Better use of white space",
      "ATS score now 94/100",
      "Ready to send",
    ],
    content:
      "Premium redesigned resume with AI-optimized content. Full 2-column layout, certifications, and portfolio section added.",
  },
];

export default function VersionsPage() {
  const { t } = useLanguage();
  const [versionList, setVersionList] = useState(versions);
  const [selected, setSelected] = useState<number>(4);
  const [comparing, setComparing] = useState<number | null>(null);
  const [restored, setRestored] = useState<number | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const selectedVer = versionList.find((v) => v.id === selected) || versionList[0];
  const compareVer = versionList.find((v) => v.id === comparing);

  const handleRestore = (id: number) => {
    setRestored(id);
    setTimeout(() => setRestored(null), 2500);
  };

  const handleSaveNow = () => {
    const nextId = versionList.length + 1;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const dateStr = now.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
    const newVer = {
      id: nextId,
      label: `v2.${nextId - 4}`,
      title: "Real-time avto-saqlangan versiya",
      date: dateStr,
      time: timeStr,
      changes: 4,
      badge: "current" as const,
      bullets: [
        "Kompaniya talablariga mos ATS format yangilandi",
        "Imlo va stilistik xatolar AI orqali tekshirildi",
        "Oxirgi ish tajribalari va yutuqlar saqlandi",
        "Bog'lanish kontaktlari tasdiqlandi",
      ],
      content:
        "Foydalanuvchi tomonidan saqlangan eng oxirgi ishchi nusxa. Barcha bo'limlar sinxronizatsiya qilingan.",
    };

    setVersionList((prev) => [
      ...prev.map((v) => ({ ...v, badge: v.badge === "current" ? null : v.badge })),
      newVer,
    ]);
    setSelected(nextId);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-transparent pb-20">
      {/* Hero */}
      <div className="border-border relative overflow-hidden border-b">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 right-1/3 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 py-12 sm:px-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-400/30 bg-gradient-to-br from-blue-500/20 to-indigo-500/10">
              <GitBranch className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <div className="text-xs font-semibold tracking-widest text-blue-400 uppercase">
                {t.versionsFeature}
              </div>
              <h1 className="text-foreground text-2xl font-bold">{t.versionsTitle}</h1>
            </div>
          </div>
          <p className="text-foreground-secondary max-w-2xl">{t.versionsDesc}</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Timeline */}
          <div className="border-border bg-surface-elevated rounded-2xl border p-4 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-foreground text-sm font-semibold">{t.allVersions}</span>
              <button
                onClick={handleSaveNow}
                className="flex items-center gap-1.5 rounded-lg border border-blue-400/30 bg-blue-500/15 px-2.5 py-1.5 text-xs font-medium text-blue-300 transition-colors hover:bg-blue-500/25"
              >
                <span className="flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> {t.saveNow || "Hozir saqlash"}
                </span>
              </button>
            </div>
            <div className="relative">
              <div className="absolute top-0 bottom-0 left-4 w-px bg-white/8" />
              <div className="space-y-1">
                {[...versionList].reverse().map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelected(v.id)}
                    className={`relative w-full rounded-xl p-3 text-left transition-all ${
                      selected === v.id
                        ? "border border-blue-400/20 bg-blue-500/15"
                        : "hover:bg-surface border border-transparent"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`relative z-10 mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          v.badge === "current"
                            ? "text-foreground bg-blue-500"
                            : v.badge === "original"
                              ? "text-foreground bg-slate-600"
                              : "bg-surface-elevated text-foreground-secondary border border-white/20"
                        }`}
                      >
                        {v.badge === "current" ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          v.label.split("v")[1]
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-foreground truncate text-sm font-medium">
                            {v.title}
                          </span>
                          {v.badge && (
                            <span
                              className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                                v.badge === "current"
                                  ? "bg-blue-400/15 text-blue-300"
                                  : "text-foreground-secondary bg-slate-500/20"
                              }`}
                            >
                              {v.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-foreground-secondary mt-0.5 flex items-center gap-1.5 text-xs">
                          <Clock className="h-3 w-3" />
                          {v.date} · {v.changes} o&apos;zgarish
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Detail panel */}
          <div className="space-y-4">
            {saveSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/15 p-3 text-xs font-semibold text-emerald-300"
              >
                <Check className="h-4 w-4" /> Yangi versiya muvaffaqiyatli saqlandi va sinxronlandi!
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={selected}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-border bg-surface-elevated rounded-2xl border p-6 backdrop-blur-sm"
              >
                <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-foreground text-lg font-bold">{selectedVer.title}</span>
                      <span className="border-border text-foreground-secondary rounded-full border px-2 py-0.5 text-xs">
                        {selectedVer.label}
                      </span>
                    </div>
                    <div className="text-foreground-secondary flex items-center gap-2 text-sm">
                      <Clock className="h-3.5 w-3.5" />
                      {selectedVer.date} at {selectedVer.time} · {selectedVer.changes}{" "}
                      o&apos;zgarish
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        setComparing(comparing === selected ? null : selected === 4 ? 3 : 4)
                      }
                      className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
                        comparing
                          ? "border-blue-400/40 bg-blue-400/15 text-blue-300"
                          : "border-border text-foreground-secondary hover:text-foreground"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <GitCompare className="h-3.5 w-3.5" />{" "}
                        {comparing ? t.stopCompare : t.compare}
                      </span>
                    </button>
                    {selectedVer.badge !== "current" && (
                      <button
                        onClick={() => handleRestore(selectedVer.id)}
                        className="border-border text-foreground-secondary hover:text-foreground flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors"
                      >
                        {restored === selectedVer.id ? (
                          <span className="flex items-center gap-1.5">
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            {t.restored}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <RotateCcw className="h-3.5 w-3.5" />
                            {t.restore}
                          </span>
                        )}
                      </button>
                    )}
                    <a
                      href="/cv-builder?tab=editor"
                      className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-md transition-opacity hover:opacity-95"
                    >
                      CV Builder&apos;da tahrirlash &rarr;
                    </a>
                    <a
                      href="/dashboard"
                      className="border-border bg-surface hover:text-foreground flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold text-slate-300 transition-colors"
                    >
                      Barcha rezyumelar (Dashboard)
                    </a>
                  </div>
                </div>

                <div className="border-border bg-surface-elevated/40 mb-4 rounded-xl border p-4">
                  <p className="mb-1 text-sm font-semibold text-slate-300">{t.snapshot}</p>
                  <p className="text-foreground-secondary text-sm">{selectedVer.content}</p>
                </div>

                <div>
                  <p className="text-foreground-secondary mb-3 text-xs font-semibold tracking-widest uppercase">
                    {t.changesIn}
                  </p>
                  <div className="space-y-2">
                    {selectedVer.bullets.map((b, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-sm">
                        <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-blue-400" />
                        <span className="text-slate-300">{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Compare panel */}
            <AnimatePresence>
              {comparing && compareVer && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden rounded-2xl border border-blue-400/20 bg-blue-500/5 p-6 backdrop-blur-sm"
                >
                  <div className="mb-4 flex items-center gap-2">
                    <GitCompare className="h-4 w-4 text-blue-400" />
                    <span className="text-foreground text-sm font-semibold">
                      {t.comparingWith} {compareVer.title} ({compareVer.label})
                    </span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="bg-surface-elevated rounded-xl p-4">
                      <p className="text-foreground-secondary mb-2 text-xs font-bold tracking-widest uppercase">
                        {selectedVer.label}
                      </p>
                      <p className="text-sm text-slate-300">{selectedVer.content}</p>
                    </div>
                    <div className="bg-surface-elevated rounded-xl p-4">
                      <p className="text-foreground-secondary mb-2 text-xs font-bold tracking-widest uppercase">
                        {compareVer.label}
                      </p>
                      <p className="text-sm text-slate-300">{compareVer.content}</p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-xl border border-blue-400/20 bg-blue-500/10 p-3">
                    <p className="text-xs text-blue-300">
                      📈 {t.improvement}: {compareVer.changes} → {selectedVer.changes} changes ·
                      Score: 42 → 94/100
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
