"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";

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
    <div className="min-h-screen bg-slate-950 p-4 pt-20 text-white md:p-8">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-8 lg:grid-cols-12 print:m-0 print:block print:max-w-none print:p-0">
        {/* Left Side: Form */}
        <div className="sticky top-24 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl lg:col-span-5 print:hidden">
          <h1 className="mb-6 text-2xl font-bold text-blue-400">
            🎓 AI Kurs Ishi va Referat Generatori
          </h1>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">OTM nomi</label>
              <input
                type="text"
                name="university"
                required
                value={formData.university}
                onChange={handleChange}
                placeholder="O'zbekiston Milliy Universiteti..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">Fan nomi</label>
              <input
                type="text"
                name="subject"
                required
                value={formData.subject}
                onChange={handleChange}
                placeholder="Informatika va AT..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">Mavzu</label>
              <input
                type="text"
                name="topic"
                required
                value={formData.topic}
                onChange={handleChange}
                placeholder="Sun'iy intellektning ta'limdagi o'rni..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">Talaba F.I.Sh</label>
              <input
                type="text"
                name="studentName"
                required
                value={formData.studentName}
                onChange={handleChange}
                placeholder="Aliyev Vali..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">Ilmiy rahbar</label>
              <input
                type="text"
                name="teacherName"
                required
                value={formData.teacherName}
                onChange={handleChange}
                placeholder="Prof. Qodirov A..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">Yil</label>
              <input
                type="text"
                name="year"
                required
                value={formData.year}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm font-medium text-red-500">
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-4 flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg
                    className="mr-3 -ml-1 h-5 w-5 animate-spin text-white"
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
                "Yaratish 🚀"
              )}
            </button>
          </form>
        </div>

        {/* Right Side: A4 Preview */}
        <div className="flex flex-col items-center lg:col-span-7 print:block print:w-full">
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

          <div className="flex w-full justify-center overflow-x-auto print:block print:w-full">
            <div
              className="a4-document prose prose-slate max-w-none shrink-0 bg-white p-[25mm] text-black shadow-2xl"
              style={{
                width: "210mm",
                minHeight: "297mm",
              }}
            >
              {result ? (
                <div className="markdown-content">
                  <ReactMarkdown>{result}</ReactMarkdown>
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
