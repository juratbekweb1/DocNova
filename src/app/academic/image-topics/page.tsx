import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, FileImage, Layers, Sparkles } from "lucide-react";
import { StudentSubNav } from "@/components/academic/student-sub-nav";
import { ImageTopicParser } from "@/components/academic/image-topic-parser";

export const metadata: Metadata = {
  title: "Rasm orqali mavzu va sahifalar qo'shish | DocNova Talaba",
  description:
    "Darslik, daftar yoki mavzular ro'yxati rasmini yuklang — Gemini 2.5 Flash barcha mavzularni tahrirlanadigan bloklarga ajratadi va bazaga saqlaydi.",
};

export default function AcademicImageTopicsPage() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <StudentSubNav activeTab="image-topics" />

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        {/* Page Header */}
        <section className="border-border bg-surface space-y-4 rounded-2xl border p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-600 dark:text-sky-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Gemini 2.5 Flash Vision</span>
            </div>

            <Link
              href="/dashboard/documents"
              className="border-border bg-surface-elevated text-foreground-secondary hover:text-foreground inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Saqlangan hujjatlarim
            </Link>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-foreground text-xl font-extrabold tracking-tight sm:text-2xl lg:text-3xl">
              Rasm orqali avtomatik mavzular va sahifalar qo&apos;shish
            </h1>
            <p className="text-foreground-secondary max-w-3xl text-sm">
              Konspekt, kitob sahifasi, dars jadvali yoki mavzular ro&apos;yxatining rasmini
              yuklang. Tizim rasmdagi har bir mavzuni avtomatik o&apos;qib alohida bloklarga
              ajratadi va bitta bosish bilan hujjat sifatida bazaga saqlaydi.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-3">
            <div className="border-border bg-surface-elevated/60 flex items-start gap-2.5 rounded-xl border p-3">
              <FileImage className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
              <div className="text-xs">
                <p className="text-foreground font-semibold">1. Rasm tashlang</p>
                <p className="text-foreground-muted">
                  Telefon galereyasidan mavzular rasmini tanlang — AI darhol o&apos;qiydi
                </p>
              </div>
            </div>
            <div className="border-border bg-surface-elevated/60 flex items-start gap-2.5 rounded-xl border p-3">
              <Layers className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <div className="text-xs">
                <p className="text-foreground font-semibold">2. Nechta bet tanlang</p>
                <p className="text-foreground-muted">
                  Har bir mavzuga nechta bet yozilishini belgilab, bloklarni tahrirlang
                </p>
              </div>
            </div>
            <div className="border-border bg-surface-elevated/60 flex items-start gap-2.5 rounded-xl border p-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <div className="text-xs">
                <p className="text-foreground font-semibold">3. Yozing va saqlang</p>
                <p className="text-foreground-muted">
                  Har bir mavzu bo&apos;yicha ish tayyorlanadi va hujjat sifatida saqlanadi
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Image Topic Parser */}
        <ImageTopicParser workType="general" accentColor="blue" />
      </main>
    </div>
  );
}
