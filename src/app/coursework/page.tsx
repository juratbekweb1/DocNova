"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";

function extractText(c: any): string {
  if (typeof c === "string") return c;
  if (typeof c === "number") return c.toString();
  if (Array.isArray(c)) return c.map(extractText).join("");
  if (c && typeof c === "object" && c.props && c.props.children) {
    return extractText(c.props.children);
  }
  return "";
}

function parseTocLine(text: string): { title: string; page: string; isSub: boolean } | null {
  if (!text) return null;
  const clean = text.trim();
  const match = clean.match(/^([^\n]+?)\s*(?:[\.·…\-]\s*){2,}\s*(\d+)\s*$/);
  if (match) {
    const rawTitle = match[1]
      .replace(/^\s*[-*•]\s*/, "")
      .replace(/\*/g, "")
      .trim();
    const page = match[2].trim();
    if (rawTitle.length > 0 && page.length > 0) {
      const isSub = /^\d+\.\d+/.test(rawTitle);
      return { title: rawTitle, page, isSub };
    }
  }
  return null;
}

const markdownComponents = {
  ul: ({ children }: any) => {
    return <ul className="list-none p-0 my-2 space-y-1 w-full">{children}</ul>;
  },
  li: ({ children }: any) => {
    const text = extractText(children);
    const toc = parseTocLine(text);
    if (toc) {
      return (
        <li className={`list-none w-full m-0 p-0 ${toc.isSub ? "pl-5" : ""}`}>
          <div className="flex items-baseline w-full my-1 toc-item">
            <span className="whitespace-nowrap pr-1 font-semibold toc-title truncate max-w-[85%]">
              {toc.title}
            </span>
            <span className="flex-grow border-b border-dotted border-black mx-1 mb-1 toc-dots" />
            <span className="whitespace-nowrap pl-1 font-bold toc-page shrink-0">
              {toc.page}
            </span>
          </div>
        </li>
      );
    }
    return <li className="my-1">{children}</li>;
  },
  p: ({ children }: any) => {
    const text = extractText(children);
    const toc = parseTocLine(text);
    if (toc) {
      return (
        <div className={`flex items-baseline w-full my-1 toc-item ${toc.isSub ? "pl-5" : ""}`}>
          <span className="whitespace-nowrap pr-1 font-semibold toc-title truncate max-w-[85%]">
            {toc.title}
          </span>
          <span className="flex-grow border-b border-dotted border-black mx-1 mb-1 toc-dots" />
          <span className="whitespace-nowrap pl-1 font-bold toc-page shrink-0">
            {toc.page}
          </span>
        </div>
      );
    }
    return <p className="mb-4 leading-relaxed">{children}</p>;
  },
};

export default function CourseworkGenerator() {
  const [formData, setFormData] = useState({
    university: "",
    subject: "",
    topic: "",
    studentName: "",
    teacherName: "",
    year: new Date().getFullYear().toString(),
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/generate-coursework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Xatolik yuz berdi");
      }

      setResult(data.result);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background p-4 pt-6 text-foreground md:p-8">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-8 lg:grid-cols-12 w-full min-w-0 print:m-0 print:block print:max-w-none print:p-0">
        {/* Left Side: Form */}
        <div className="sticky top-24 rounded-2xl border border-border bg-surface p-6 shadow-xl lg:col-span-5 min-w-0 print:hidden">
          <h1 className="mb-6 text-2xl font-bold text-primary flex items-center gap-2">
            🎓 Kurs ishi va Referat Generatori
          </h1>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground-secondary">OTM nomi</label>
              <input
                type="text"
                name="university"
                required
                value={formData.university}
                onChange={handleChange}
                placeholder="O'zbekiston Milliy Universiteti..."
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground-secondary">Fan nomi</label>
              <input
                type="text"
                name="subject"
                required
                value={formData.subject}
                onChange={handleChange}
                placeholder="Informatika va AT..."
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground-secondary">Mavzu</label>
              <input
                type="text"
                name="topic"
                required
                value={formData.topic}
                onChange={handleChange}
                placeholder="Sun'iy intellektning ta'limdagi o'rni..."
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground-secondary">Talaba F.I.Sh</label>
              <input
                type="text"
                name="studentName"
                required
                value={formData.studentName}
                onChange={handleChange}
                placeholder="Aliyev Vali..."
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground-secondary">Ilmiy rahbar</label>
              <input
                type="text"
                name="teacherName"
                required
                value={formData.teacherName}
                onChange={handleChange}
                placeholder="Prof. Qodirov A..."
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground-secondary">Yil</label>
              <input
                type="text"
                name="year"
                required
                value={formData.year}
                onChange={handleChange}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-sm font-medium text-red-500">
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-4 flex w-full items-center justify-center rounded-xl bg-primary hover:bg-primary/90 px-4 py-3 font-semibold text-primary-foreground shadow-lg transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg
                    className="mr-3 -ml-1 h-5 w-5 animate-spin text-primary-foreground"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Generatsiya qilinmoqda...
                </>
              ) : (
                "Kurs ishini yaratish 🚀"
              )}
            </button>
          </form>
        </div>

        {/* Right Side: A4 Preview */}
        <div className="flex flex-col items-center lg:col-span-7 w-full min-w-0 print:block print:w-full">
          {result && (
            <div className="mb-4 flex w-full justify-end print:hidden">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2 font-medium text-white shadow-lg transition-all hover:bg-emerald-700"
              >
                <span className="text-xl">🖨️</span> PDF Yuklash / Chop Etish
              </button>
            </div>
          )}

          <div className="flex w-full justify-center overflow-x-auto max-w-full p-2 print:block print:w-full print:p-0">
            <div
              className="a4-document prose prose-slate max-w-full shrink-0 bg-white p-6 sm:p-10 md:p-[25mm] text-black shadow-2xl"
              style={{
                width: "210mm",
                minHeight: "297mm",
                maxWidth: "100%",
              }}
            >
              {result ? (
                <div className="markdown-content">
                  <ReactMarkdown components={markdownComponents}>{result}</ReactMarkdown>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center space-y-4 pt-40 text-slate-400 opacity-50">
                  <div className="text-6xl">📄</div>
                  <p>Hujjat shu yerda shakllanadi...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
