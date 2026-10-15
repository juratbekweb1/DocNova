"use client";

import { useState } from "react";
import { Download, User, Briefcase, Star, Printer, RefreshCw } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";

interface ResumeData {
  name: string;
  title: string;
  email: string;
  phone: string;
  linkedin: string;
  summary: string;
  experience: { company: string; role: string; period: string; bullets: string }[];
  skills: string;
  education: string;
}

const defaultData: ResumeData = {
  name: "Alex Johnson",
  title: "Senior Software Engineer",
  email: "alex@example.com",
  phone: "+1 (555) 123-4567",
  linkedin: "linkedin.com/in/alexjohnson",
  summary:
    "Results-driven software engineer with 5+ years building scalable web applications. Passionate about clean code, performance optimization, and delivering exceptional user experiences.",
  experience: [
    {
      company: "TechCorp Inc.",
      role: "Senior Software Engineer",
      period: "2022 – Present",
      bullets:
        "• Led migration of monolithic app to microservices, reducing load time by 60%\n• Mentored team of 4 junior engineers and conducted weekly code reviews\n• Architected real-time notification system serving 200K+ daily active users",
    },
    {
      company: "StartupXYZ",
      role: "Full Stack Developer",
      period: "2020 – 2022",
      bullets:
        "• Built customer-facing dashboard from scratch using React and Node.js\n• Reduced API response times by 45% through query optimization and caching\n• Shipped 20+ features across 8 product sprints with 99.9% uptime",
    },
    {
      company: "Digital Agency",
      role: "Frontend Developer",
      period: "2019 – 2020",
      bullets:
        "• Developed responsive websites for 15+ enterprise clients\n• Improved Lighthouse score from 52 to 96 through performance optimization\n• Established reusable component library used across all client projects",
    },
  ],
  skills: "TypeScript, React, Node.js, PostgreSQL, Redis, Docker, AWS, Git, REST APIs, GraphQL",
  education: "B.S. Computer Science — Stanford University, 2019",
};

export default function ExportsPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<ResumeData>(defaultData);
  const [isExporting, setIsExporting] = useState(false);

  const update = (field: keyof ResumeData, value: string) =>
    setData((prev) => ({ ...prev, [field]: value }));
  const updateExp = (i: number, field: string, value: string) =>
    setData((prev) => ({
      ...prev,
      experience: prev.experience.map((e, idx) => (idx === i ? { ...e, [field]: value } : e)),
    }));

  const handlePDF = async () => {
    setIsExporting(true);
    try {
      const element = document.getElementById("resume-preview");
      if (element) {
        const html2pdfModule = await import("html2pdf.js");
        const html2pdf = html2pdfModule.default as unknown as () => {
          set: (options: Record<string, unknown>) => {
            from: (el: HTMLElement) => {
              save: () => Promise<void>;
            };
          };
        };
        const opt = {
          margin: [6, 6, 6, 6],
          filename: `${data.name.replace(/\s+/g, "_") || "DocNova"}_Resume.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, letterRendering: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        };
        await html2pdf().set(opt).from(element).save();
      } else {
        window.print();
      }
    } catch (err) {
      console.warn("Direct PDF generation failed, using print fallback:", err);
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  const handleDOCX = () => {
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${data.name} - Resume</title>
        <!--[if gte mso 9]>
        <xml>
        <w:WordDocument>
        <w:View>Print</w:View>
        <w:Zoom>100</w:Zoom>
        <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page { size: 21cm 29.7cm; margin: 2cm; }
          body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 1.4; color: #1f2937; }
          h1 { font-size: 22pt; margin: 0 0 4pt 0; color: #111827; text-align: center; }
          .title { font-size: 13pt; font-weight: bold; color: #0284c7; text-align: center; margin: 0 0 6pt 0; }
          .contact { font-size: 10pt; color: #64748b; text-align: center; margin-bottom: 12pt; border-bottom: 1.5pt solid #e2e8f0; padding-bottom: 8pt; }
          h3 { font-size: 12pt; text-transform: uppercase; letter-spacing: 1pt; color: #0f172a; border-bottom: 1pt solid #cbd5e1; padding-bottom: 3pt; margin-top: 14pt; margin-bottom: 6pt; }
          .role-header { font-weight: bold; font-size: 11pt; color: #0f172a; margin-top: 6pt; }
          .company { color: #0284c7; font-weight: 600; font-size: 10pt; margin-bottom: 4pt; }
          .bullets { margin-left: 14pt; margin-top: 3pt; margin-bottom: 8pt; white-space: pre-wrap; font-size: 10.5pt; color: #334155; }
        </style>
      </head>
      <body>
        <h1>${data.name}</h1>
        <p class="title">${data.title}</p>
        <p class="contact">${data.email} &nbsp;|&nbsp; ${data.phone} &nbsp;|&nbsp; ${data.linkedin}</p>
        
        ${data.summary ? `<h3>${t.summary || "PROFESSIONAL SUMMARY"}</h3><p style="margin-bottom: 10pt; color: #334155;">${data.summary}</p>` : ""}
        
        <h3>${t.experience || "WORK EXPERIENCE"}</h3>
        ${data.experience
          .map(
            (e) => `
          <div style="margin-bottom: 10pt;">
            <p class="role-header">${e.role} <span style="float: right; font-weight: normal; color: #64748b;">${e.period}</span></p>
            <p class="company">${e.company}</p>
            <div class="bullets">${e.bullets}</div>
          </div>
        `
          )
          .join("")}
        
        ${data.skills ? `<h3>${t.skillsTab || "TECHNICAL & PROFESSIONAL SKILLS"}</h3><p style="color: #334155;">${data.skills}</p>` : ""}
        ${data.education ? `<h3>${t.education || "EDUCATION"}</h3><p style="color: #334155;">${data.education}</p>` : ""}
      </body>
      </html>
    `;
    const blob = new Blob([htmlContent], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.name.replace(/\s+/g, "_") || "DocNova"}_Resume.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <style>{`@media print { body > * { display: none !important; } #resume-preview { display: block !important; position: fixed; inset: 0; background: white; z-index: 99999; } }`}</style>
      <div className="min-h-screen bg-transparent pb-20">
        {/* Hero */}
        <div className="border-border relative overflow-hidden border-b">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 right-1/3 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-7xl px-6 py-12 sm:px-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/20 to-teal-500/10">
                <Download className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <div className="text-xs font-semibold tracking-widest text-emerald-400 uppercase">
                  {t.exportFeature}
                </div>
                <h1 className="text-foreground text-2xl font-bold">{t.exportTitle}</h1>
              </div>
            </div>
            <p className="text-foreground-secondary max-w-2xl">{t.exportDesc}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={handlePDF}
                disabled={isExporting}
                className="text-foreground flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-sm font-semibold shadow-lg shadow-emerald-500/30 transition-all hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50"
              >
                {isExporting ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" /> {t.exportPDF} (Yuklanmoqda...)
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Download className="h-4 w-4" /> PDF yuklab olish
                  </span>
                )}
              </button>
              <button
                onClick={handleDOCX}
                className="flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-2.5 text-sm font-semibold text-emerald-300 transition-all hover:bg-emerald-400/20"
              >
                <Download className="h-4 w-4" /> Word (.doc) yuklab olish
              </button>
              <button
                onClick={() => window.print()}
                className="border-border bg-surface text-foreground-secondary hover:text-foreground flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all"
              >
                <Printer className="h-4 w-4" /> Chop etish (Print)
              </button>
              <a
                href="/cv-builder?tab=editor"
                className="border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all"
              >
                CV Builder&apos;da tahrirlash &rarr;
              </a>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 py-8 sm:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
            {/* Form */}
            <div className="space-y-4">
              <div className="border-border bg-surface-elevated rounded-2xl border p-5 backdrop-blur-sm">
                <div className="mb-4 flex items-center gap-2">
                  <User className="h-4 w-4 text-emerald-400" />
                  <span className="text-foreground text-sm font-semibold">{t.personalInfo}</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      ["name", t.fullName, "John Smith"],
                      ["title", t.jobTitle, "Senior Engineer"],
                      ["email", t.email, "john@example.com"],
                      ["phone", t.phone, "+1 555 000 0000"],
                      ["linkedin", "LinkedIn", "linkedin.com/in/..."],
                    ] as const
                  ).map(([field, label, placeholder]) => (
                    <div key={field}>
                      <label className="text-foreground-secondary mb-1 block text-xs">
                        {label}
                      </label>
                      <input
                        value={(data as unknown as Record<string, string>)[field]}
                        onChange={(e) => update(field as keyof ResumeData, e.target.value)}
                        placeholder={placeholder}
                        className="border-border bg-surface-elevated text-foreground w-full rounded-xl border px-3 py-2 text-sm placeholder-slate-600 focus:border-emerald-400/50 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <label className="text-foreground-secondary mb-1 block text-xs">
                    {t.profSummary}
                  </label>
                  <textarea
                    value={data.summary}
                    onChange={(e) => update("summary", e.target.value)}
                    rows={3}
                    className="border-border bg-surface-elevated text-foreground w-full resize-none rounded-xl border px-3 py-2 text-sm placeholder-slate-600 focus:border-emerald-400/50 focus:outline-none"
                  />
                </div>
              </div>

              {data.experience.map((exp, i) => (
                <div
                  key={i}
                  className="border-border bg-surface-elevated rounded-2xl border p-5 backdrop-blur-sm"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-emerald-400" />
                    <span className="text-foreground text-sm font-semibold">
                      {t.experience} {i + 1}
                    </span>
                  </div>
                  <div className="mb-2 grid gap-2 sm:grid-cols-3">
                    <div>
                      <label className="text-foreground-secondary mb-1 block text-xs">
                        {t.company}
                      </label>
                      <input
                        value={exp.company}
                        onChange={(e) => updateExp(i, "company", e.target.value)}
                        className="border-border bg-surface-elevated text-foreground w-full rounded-xl border px-3 py-2 text-sm focus:border-emerald-400/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-foreground-secondary mb-1 block text-xs">
                        {t.role}
                      </label>
                      <input
                        value={exp.role}
                        onChange={(e) => updateExp(i, "role", e.target.value)}
                        className="border-border bg-surface-elevated text-foreground w-full rounded-xl border px-3 py-2 text-sm focus:border-emerald-400/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-foreground-secondary mb-1 block text-xs">
                        {t.period}
                      </label>
                      <input
                        value={exp.period}
                        onChange={(e) => updateExp(i, "period", e.target.value)}
                        className="border-border bg-surface-elevated text-foreground w-full rounded-xl border px-3 py-2 text-sm focus:border-emerald-400/50 focus:outline-none"
                      />
                    </div>
                  </div>
                  <textarea
                    value={exp.bullets}
                    onChange={(e) => updateExp(i, "bullets", e.target.value)}
                    rows={3}
                    className="border-border bg-surface-elevated text-foreground w-full resize-none rounded-xl border px-3 py-2 text-sm focus:border-emerald-400/50 focus:outline-none"
                  />
                </div>
              ))}

              <div className="border-border bg-surface-elevated rounded-2xl border p-5 backdrop-blur-sm">
                <div className="mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4 text-emerald-400" />
                  <span className="text-foreground text-sm font-semibold">{t.skillsEdu}</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-foreground-secondary mb-1 block text-xs">
                      {t.skills}
                    </label>
                    <input
                      value={data.skills}
                      onChange={(e) => update("skills", e.target.value)}
                      className="border-border bg-surface-elevated text-foreground w-full rounded-xl border px-3 py-2 text-sm focus:border-emerald-400/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-foreground-secondary mb-1 block text-xs">
                      {t.education}
                    </label>
                    <input
                      value={data.education}
                      onChange={(e) => update("education", e.target.value)}
                      className="border-border bg-surface-elevated text-foreground w-full rounded-xl border px-3 py-2 text-sm focus:border-emerald-400/50 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div
              id="resume-preview"
              className="border-border rounded-2xl border bg-white p-8 text-slate-900 shadow-2xl print:rounded-none print:border-0 print:shadow-none"
            >
              <div className="mb-4 border-b-2 border-slate-200 pb-4">
                <h2 className="text-2xl font-bold text-slate-900 print:text-black">{data.name}</h2>
                <p className="text-base font-semibold text-cyan-700">{data.title}</p>
                <div className="text-foreground-secondary mt-1 flex flex-wrap gap-3 text-xs">
                  <span>{data.email}</span>
                  <span>•</span>
                  <span>{data.phone}</span>
                  <span>•</span>
                  <span>{data.linkedin}</span>
                </div>
              </div>
              {data.summary && (
                <>
                  <div className="mb-3">
                    <h3 className="text-foreground-secondary mb-1 text-xs font-bold tracking-widest uppercase">
                      {t.summary}
                    </h3>
                    <p className="text-sm leading-6 text-slate-700">{data.summary}</p>
                  </div>
                </>
              )}
              <div className="mb-3">
                <h3 className="text-foreground-secondary mb-2 text-xs font-bold tracking-widest uppercase">
                  {t.experience}
                </h3>
                {data.experience.map((exp, i) => (
                  <div key={i} className="mb-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-semibold text-slate-900">{exp.role}</span>
                      <span className="text-foreground-secondary text-xs">{exp.period}</span>
                    </div>
                    <div className="mb-1 text-xs font-medium text-cyan-700">{exp.company}</div>
                    <pre className="text-foreground-secondary text-xs leading-5 whitespace-pre-wrap">
                      {exp.bullets}
                    </pre>
                  </div>
                ))}
              </div>
              {data.skills && (
                <div className="mb-3">
                  <h3 className="text-foreground-secondary mb-1 text-xs font-bold tracking-widest uppercase">
                    {t.skillsTab}
                  </h3>
                  <p className="text-sm text-slate-700">{data.skills}</p>
                </div>
              )}
              {data.education && (
                <div>
                  <h3 className="text-foreground-secondary mb-1 text-xs font-bold tracking-widest uppercase">
                    {t.education}
                  </h3>
                  <p className="text-sm text-slate-700">{data.education}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
