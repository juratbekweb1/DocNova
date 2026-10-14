"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";

interface CourseworkPage {
  pageNumber: number;
  type: string;
  title: string;
  content: string;
}

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
  h1: ({ children }: any) => (
    <h1 className="text-lg sm:text-xl font-bold text-center uppercase tracking-wide my-3 text-black">
      {children}
    </h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="text-base sm:text-lg font-bold uppercase tracking-normal mt-4 mb-2 text-black">
      {children}
    </h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="text-sm sm:text-base font-semibold mt-3 mb-1 text-black">
      {children}
    </h3>
  ),
  ul: ({ children }: any) => {
    return <ul className="list-none p-0 my-1 space-y-1 w-full text-black">{children}</ul>;
  },
  li: ({ children }: any) => {
    const text = extractText(children);
    const toc = parseTocLine(text);
    if (toc) {
      return (
        <li className={`list-none w-full m-0 p-0 ${toc.isSub ? "pl-5" : ""}`}>
          <div className="flex items-baseline w-full my-0.5 toc-item">
            <span className="whitespace-nowrap pr-1 font-semibold toc-title truncate max-w-[85%] text-xs sm:text-sm text-black">
              {toc.title}
            </span>
            <span className="flex-grow border-b border-dotted border-black mx-1 mb-1 toc-dots" />
            <span className="whitespace-nowrap pl-1 font-bold toc-page shrink-0 text-xs sm:text-sm text-black">
              {toc.page}
            </span>
          </div>
        </li>
      );
    }
    return <li className="my-0.5 text-xs sm:text-sm text-black list-disc ml-5 leading-normal">{children}</li>;
  },
  p: ({ children }: any) => {
    const text = extractText(children);
    const toc = parseTocLine(text);
    if (toc) {
      return (
        <div className={`flex items-baseline w-full my-0.5 toc-item ${toc.isSub ? "pl-5" : ""}`}>
          <span className="whitespace-nowrap pr-1 font-semibold toc-title truncate max-w-[85%] text-xs sm:text-sm text-black">
            {toc.title}
          </span>
          <span className="flex-grow border-b border-dotted border-black mx-1 mb-1 toc-dots" />
          <span className="whitespace-nowrap pl-1 font-bold toc-page shrink-0 text-xs sm:text-sm text-black">
            {toc.page}
          </span>
        </div>
      );
    }
    return <p className="mb-2 text-justify text-xs sm:text-[13px] leading-relaxed text-black indent-6">{children}</p>;
  },
  table: ({ children }: any) => (
    <div className="my-3 overflow-x-auto w-full">
      <table className="w-full border-collapse border border-black text-[11px] sm:text-xs text-black">
        {children}
      </table>
    </div>
  ),
  th: ({ children }: any) => (
    <th className="border border-black bg-slate-100 p-1.5 text-center font-bold text-black text-[11px] sm:text-xs">
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td className="border border-black p-1.5 text-black text-[11px] sm:text-xs">
      {children}
    </td>
  ),
  hr: () => <hr className="my-3 border-t border-slate-300" />,
};

export default function CourseworkGenerator() {
  const [formData, setFormData] = useState({
    university: "",
    subject: "",
    topic: "",
    studentName: "",
    teacherName: "",
    year: new Date().getFullYear().toString(),
    pageCount: "19",
  });

  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [pages, setPages] = useState<CourseworkPage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const documentRef = React.useRef<HTMLDivElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setPages([]);

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
      if (data.pages && Array.isArray(data.pages) && data.pages.length > 0) {
        setPages(data.pages);
      }
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

  const handleDownloadPDF = async () => {
    if (!documentRef.current) return;
    setDownloading(true);

    try {
      // SSR muammolarini oldini olish uchun dinamik import
      const html2pdf = (await import("html2pdf.js")).default;
      const cleanStudentName = formData.studentName?.trim().replace(/[^a-zA-Z0-9\-_]/g, "_") || "DocNova";
      const totalPages = pages.length > 0 ? pages.length : parseInt(formData.pageCount || "19", 10);

      const opt = {
        margin: [0, 0, 0, 0] as [number, number, number, number],
        filename: `Kurs_ishi_${cleanStudentName}_${totalPages}sahifa.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          scrollY: 0,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"], after: ".html2pdf__page-break" },
      };

      await (html2pdf as any)().set(opt).from(documentRef.current).save();
    } catch (err) {
      console.error("PDF yuklab olishda xatolik:", err);
    } finally {
      setDownloading(false);
    }
  };

  const cleanResult = React.useMemo(() => {
    if (!result) return "";
    return result
      .replace(/<br\s*\/?>/gi, "\n\n")
      .replace(/<hr\s*\/?>/gi, "\n\n---\n\n");
  }, [result]);

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
                placeholder="Sun'iy intellektning nazariy va amaliy asoslari..."
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground-secondary">Talaba F.I.Sh</label>
                <input
                  type="text"
                  name="studentName"
                  required
                  value={formData.studentName}
                  onChange={handleChange}
                  placeholder="Aliyev Vali"
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
                  placeholder="dots. Karimov A.A."
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
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

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium text-foreground-secondary">
                  Sahifalar soni (Kutilayotgan hajm)
                </label>
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                  {formData.pageCount || "19"} sahifa
                </span>
              </div>

              {/* Tezkor tanlov tugmalari */}
              <div className="grid grid-cols-4 gap-2 mb-2">
                {[
                  { val: "15", label: "15 bet" },
                  { val: "19", label: "19 bet" },
                  { val: "25", label: "25 bet" },
                  { val: "30", label: "30 bet" },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setFormData({ ...formData, pageCount: item.val })}
                    className={`rounded-xl py-2 px-1 text-xs sm:text-sm font-semibold transition-all border text-center cursor-pointer ${
                      formData.pageCount === item.val
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-background border-border text-foreground hover:border-primary/50 hover:bg-surface-elevated"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Ixtiyoriy boshqa son kiritish maydoni */}
              <div className="relative">
                <input
                  type="number"
                  name="pageCount"
                  min={10}
                  max={60}
                  value={formData.pageCount}
                  onChange={handleChange}
                  placeholder="Boshqa hajm (masalan: 19 yoki 30)..."
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-foreground-muted pointer-events-none">
                  sahifa
                </span>
              </div>
              <p className="mt-1 text-[11px] text-foreground-muted">
                💡 OTM talabiga qarab 15, 19, 25, 30 yoki o&apos;zingizga kerakli sahifani tanlang.
              </p>
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
          {(pages.length > 0 || cleanResult) && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 w-full print:hidden">
              <div className="text-xs sm:text-sm font-semibold text-foreground-secondary">
                📄 Jami hajm:{" "}
                <span className="text-primary font-bold">
                  {pages.length > 0 ? `${pages.length} sahifa` : `${formData.pageCount || "19"} sahifa`}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                  className="flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 px-5 py-2.5 font-medium text-white shadow-lg transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
                >
                  <span>{downloading ? "⏳" : "📥"}</span>
                  <span>{downloading ? "Yuklanmoqda..." : "PDF yuklab olish"}</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="flex items-center justify-center gap-2 rounded-xl bg-slate-700 hover:bg-slate-800 px-5 py-2.5 font-medium text-white shadow-lg transition-all hover:scale-[1.02] cursor-pointer text-sm"
                >
                  <span>🖨️</span>
                  <span>Chop etish</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex w-full justify-center overflow-x-auto max-w-full p-2 print:block print:w-full print:p-0">
            {pages.length > 0 ? (
              <div
                ref={documentRef}
                id="coursework-document"
                className="coursework-document flex flex-col items-center gap-6 w-[210mm] shrink-0 print:block print:w-full print:gap-0"
              >
                {pages.map((p, idx) => (
                  <React.Fragment key={p.pageNumber}>
                    <div
                      className="coursework-page relative flex flex-col justify-between bg-white text-black shadow-xl border border-slate-200/80 rounded-sm print:rounded-none print:border-0 print:shadow-none print:m-0"
                      style={{
                        width: "210mm",
                        minHeight: "297mm",
                        maxHeight: "297mm",
                        boxSizing: "border-box",
                        padding: "20mm 20mm 20mm 25mm", // Standart akademik hoshiyalar: chap 25mm, yuqori/o'ng/past 20mm
                        pageBreakAfter: idx < pages.length - 1 ? "always" : "auto",
                        breakAfter: idx < pages.length - 1 ? "page" : "auto",
                        overflow: "hidden",
                      }}
                    >
                      <div className="coursework-page-content prose prose-slate max-w-none text-black flex-grow">
                        <ReactMarkdown components={markdownComponents}>{p.content}</ReactMarkdown>
                      </div>

                      {/* Sahifa raqami (1-sahifa Titulda ko'rsatilmaydi) */}
                      {p.pageNumber > 1 ? (
                        <div className="coursework-page-footer mt-auto pt-3 text-center text-xs font-serif text-slate-700">
                          {p.pageNumber}
                        </div>
                      ) : (
                        <div className="h-4" />
                      )}
                    </div>

                    {idx < pages.length - 1 && (
                      <div
                        className="html2pdf__page-break"
                        style={{
                          pageBreakAfter: "always",
                          breakAfter: "page",
                          height: 0,
                          margin: 0,
                          padding: 0,
                        }}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            ) : cleanResult ? (
              <div
                ref={documentRef}
                className="a4-document prose prose-slate max-w-full shrink-0 bg-white p-6 sm:p-10 md:p-[25mm] text-black shadow-2xl"
                style={{
                  width: "210mm",
                  minHeight: "297mm",
                  maxWidth: "100%",
                }}
              >
                <div className="markdown-content">
                  <ReactMarkdown components={markdownComponents}>{cleanResult}</ReactMarkdown>
                </div>
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

      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .coursework-page {
            width: 210mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            box-sizing: border-box !important;
            padding: 20mm 20mm 20mm 25mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            page-break-after: always !important;
            break-after: page !important;
          }
          .html2pdf__page-break {
            page-break-after: always !important;
            break-after: page !important;
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
