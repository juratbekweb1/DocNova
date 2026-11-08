"use client";

import React, { useState, useRef } from "react";
import {
  Calculator,
  Sparkles,
  Loader2,
  FileDown,
  Copy,
  Check,
  Printer,
  Table2,
  BarChart3,
  FileSpreadsheet,
  CheckCircle2,
  BookOpen,
} from "lucide-react";
import { StudentSubNav } from "@/components/academic/student-sub-nav";
import { useToast } from "@/hooks/use-toast";
import {
  StaleBuildError,
  deliverPdf,
  describePdfError,
  exportElementsToPdf,
  inAppHint,
} from "@/lib/pdf-export";
import { downloadAcademicDocx } from "@/lib/docx-download-client";
import {
  AmaliyIshChart,
  AmaliyIshDocument,
  AmaliyIshTable,
  buildAmaliyIshWordHtml,
  generateDeterministicAmaliyIsh,
} from "@/lib/amaliy-ish-generator";

const SUBJECT_PRESETS = [
  "Iqtisodiyotda ma'lumotlar tahlili",
  "Ekonometrika",
  "Statistika",
  "Matematik statistika",
  "Moliya va soliqlar",
  "Buxgalteriya hisobi va audit",
  "Sanoat iqtisodiyoti",
  "Fizika",
  "Informatika va AT",
];

const UNIVERSITY_PRESETS = [
  "Toshkent to'qimachilik va yengil sanoat instituti",
  "Toshkent davlat iqtisodiyot universiteti (TDIU)",
  "O'zbekiston Milliy universiteti (O'zMU)",
  "Toshkent moliya instituti",
  "Toshkent davlat texnika universiteti (TDTU)",
  "Toshkent axborot texnologiyalari universiteti (TATU)",
  "Samarqand iqtisodiyot va servis instituti",
  "Buxoro muhandislik-texnologiya instituti",
];

const AmaliyDataTable = React.memo(function AmaliyDataTable({ table }: { table: AmaliyIshTable }) {
  return (
    <div className="my-3 break-inside-avoid overflow-x-auto print:break-inside-avoid print:overflow-visible">
      <div className="mb-1.5 text-xs font-bold text-slate-900 sm:text-sm print:text-black">
        {table.title}
      </div>
      <table className="w-full border-collapse break-inside-avoid border border-slate-400 text-xs sm:text-[13px] print:break-inside-avoid print:border-black">
        <thead>
          <tr className="break-inside-avoid bg-slate-100 print:break-inside-avoid print:bg-slate-100">
            {table.headers.map((h, i) => (
              <th
                key={i}
                className="border border-slate-400 px-2.5 py-2 text-center font-bold text-slate-900 print:border-black print:text-black"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rIdx) => {
            const isSummaryRow =
              rIdx === table.rows.length - 1 &&
              (String(row[0]).toLowerCase().includes("jami") ||
                String(row[0]).toLowerCase().includes("ustun"));
            return (
              <tr
                key={rIdx}
                className={`break-inside-avoid print:break-inside-avoid ${
                  isSummaryRow ? "bg-slate-50 font-bold text-slate-950" : "even:bg-slate-50/50"
                }`}
              >
                {row.map((cell, cIdx) => (
                  <td
                    key={cIdx}
                    className={`border border-slate-300 px-2.5 py-1.5 print:border-black ${
                      cIdx === 0 ? "text-left font-medium" : "text-center"
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      {table.footerNote && (
        <p className="mt-1 text-[11px] text-slate-600 italic">{table.footerNote}</p>
      )}
    </div>
  );
});

const AmaliySvgBarChart = React.memo(function AmaliySvgBarChart({
  chart,
}: {
  chart: AmaliyIshChart;
}) {
  const maxVal = Math.max(...chart.bars.map((b) => b.value), chart.overallMean, 1);
  const yMax = Math.ceil(maxVal * 1.18);
  const chartWidth = 620;
  const chartHeight = 250;
  const padLeft = 58;
  const padRight = 32;
  const padTop = 28;
  const padBottom = 52;
  const plotW = chartWidth - padLeft - padRight;
  const plotH = chartHeight - padTop - padBottom;

  const meanY = padTop + plotH - Math.min(1, Math.max(0, chart.overallMean / yMax)) * plotH;

  const barCount = chart.bars.length;
  const slotW = plotW / Math.max(1, barCount);
  const barW = Math.min(82, slotW * 0.52);

  const gridTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(yMax * t));

  return (
    <div className="my-4 rounded-xl border border-slate-300 bg-slate-50/70 p-3.5 sm:p-4 print:border-slate-400 print:bg-white">
      <div className="mb-2 text-center text-xs font-bold text-slate-900 sm:text-sm">
        {chart.figureNumber}. {chart.title}
      </div>
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="mx-auto h-auto w-full max-w-[620px]"
          role="img"
          aria-label={chart.title}
        >
          {/* Y-axis grid lines */}
          {gridTicks.map((tick, idx) => {
            const y = padTop + plotH - (tick / yMax) * plotH;
            return (
              <g key={idx}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={chartWidth - padRight}
                  y2={y}
                  stroke="#cbd5e1"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text x={padLeft - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#475569">
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Axes */}
          <line
            x1={padLeft}
            y1={padTop}
            x2={padLeft}
            y2={padTop + plotH}
            stroke="#334155"
            strokeWidth="1.5"
          />
          <line
            x1={padLeft}
            y1={padTop + plotH}
            x2={chartWidth - padRight}
            y2={padTop + plotH}
            stroke="#334155"
            strokeWidth="1.5"
          />

          {/* Bars */}
          {chart.bars.map((bar, idx) => {
            const h = Math.max(4, (bar.value / yMax) * plotH);
            const x = padLeft + idx * slotW + (slotW - barW) / 2;
            const y = padTop + plotH - h;
            return (
              <g key={idx}>
                <rect x={x} y={y} width={barW} height={h} rx="5" fill={bar.color} opacity="0.92" />
                <text
                  x={x + barW / 2}
                  y={y - 6}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="bold"
                  fill="#0f172a"
                >
                  {bar.value}
                </text>
                <text
                  x={x + barW / 2}
                  y={padTop + plotH + 18}
                  textAnchor="middle"
                  fontSize="10.5"
                  fontWeight="600"
                  fill="#1e293b"
                >
                  {bar.label}
                </text>
              </g>
            );
          })}

          {/* Overall Mean Line */}
          <line
            x1={padLeft}
            y1={meanY}
            x2={chartWidth - padRight}
            y2={meanY}
            stroke="#dc2626"
            strokeWidth="2"
            strokeDasharray="6 4"
          />
          <rect
            x={chartWidth - padRight - 175}
            y={Math.max(4, meanY - 20)}
            width="170"
            height="17"
            rx="4"
            fill="#fef2f2"
            stroke="#fca5a5"
          />
          <text
            x={chartWidth - padRight - 90}
            y={Math.max(16, meanY - 8)}
            textAnchor="middle"
            fontSize="10"
            fontWeight="bold"
            fill="#b91c1c"
          >
            {chart.overallMeanLabel}
          </text>
        </svg>
      </div>
      <div className="mt-1 text-center text-[11px] text-slate-600 italic">{chart.caption}</div>
    </div>
  );
});

const AmaliyIshDocumentSheet = React.memo(
  React.forwardRef<HTMLDivElement, { doc: AmaliyIshDocument }>(function AmaliyIshDocumentSheet(
    { doc },
    ref
  ) {
    return (
      <div
        ref={ref}
        className="border-border rounded-2xl border bg-white p-5 font-serif text-slate-900 shadow-2xl sm:p-10 print:m-0 print:border-0 print:p-0 print:text-black print:shadow-none"
      >
        {/* ===================================================================
                      1. TITUL VARAG'I (OTM RASMIY STANDARTI)
                     =================================================================== */}
        <div className="mb-12 flex min-h-[860px] flex-col justify-between p-2 text-center break-words sm:p-6 print:min-h-[240mm] print:break-after-page print:p-0">
          <div>
            <p className="text-[11px] font-bold tracking-wider break-words text-slate-800 uppercase sm:text-xs">
              {doc.meta.ministry}
            </p>
            <h2 className="mt-2 text-sm font-extrabold tracking-wide break-words text-slate-950 uppercase sm:text-lg">
              {doc.meta.university}
            </h2>
            <p className="mt-1 text-xs break-words text-slate-600 italic sm:text-sm">
              {doc.meta.department}
            </p>
          </div>

          <div className="my-8">
            <p className="text-xs font-bold tracking-wider break-words text-slate-800 uppercase sm:text-sm">
              «{doc.meta.subject}» FANIDAN
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-widest break-words text-slate-950 uppercase sm:text-5xl">
              {doc.meta.workType}
            </h1>
            <p className="mt-2 text-base font-bold tracking-wider break-words text-slate-900 uppercase sm:text-xl">
              {doc.meta.variant}
            </p>

            {/* Mavzu va Vaziyat - ortiqcha card/border/rounded stillarisiz toza rasmiy ko'rinish */}
            <div className="mx-auto mt-8 max-w-xl space-y-1.5 text-center text-xs break-words sm:text-sm">
              <p className="leading-relaxed">
                <span className="font-bold text-slate-950">Mavzu:</span>{" "}
                <span className="font-medium text-slate-900">{doc.meta.topic}</span>
              </p>
              <p className="leading-relaxed text-slate-800">
                <span className="font-bold text-slate-950">Vaziyat:</span>{" "}
                <span>{doc.meta.situation}</span>
              </p>
            </div>
          </div>

          <div>
            {/* O'ng tomonda joylashgan Tayyorladi / Guruh / Vazifa berdi bloki */}
            <div className="mt-10 ml-auto w-full max-w-xs space-y-2 text-left text-xs sm:max-w-sm sm:text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-x-2 border-b border-slate-400/80 pb-1">
                <span className="font-bold text-slate-800">Tayyorladi:</span>
                <span className="text-right font-semibold break-words text-slate-950">
                  {doc.meta.studentName}
                </span>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-x-2 border-b border-slate-400/80 pb-1">
                <span className="font-bold text-slate-800">Guruh:</span>
                <span className="text-right font-semibold break-words text-slate-950">
                  {doc.meta.studentGroup}
                </span>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-x-2 border-b border-slate-400/80 pb-1">
                <span className="font-bold text-slate-800">Vazifa berdi:</span>
                <span className="text-right font-semibold break-words text-slate-950">
                  {doc.meta.teacherName}
                </span>
              </div>
            </div>

            {/* Pastda markazda Shahar va Yil */}
            <p className="mt-14 text-center text-xs font-bold tracking-wider text-slate-900 uppercase sm:text-sm">
              {doc.meta.city} – {doc.meta.year}
            </p>
          </div>
        </div>

        {/* Sahifa ajratgich (Faqat vebda ko'rinadi, chop etishda yashirinadi) */}
        <div className="my-8 border-b-2 border-dashed border-slate-300 print:hidden" />

        {/* ===================================================================
        {/* ===================================================================
                      2. KIRISH (OTM STANDARTI BO'YICHA)
                     =================================================================== */}
        <div className="space-y-8">
          {doc.introduction && (
            <section className="space-y-4 rounded-xl border border-slate-300 bg-white p-4 sm:p-6 print:border-black print:p-0">
              <div className="border-b-2 border-slate-900 pb-2 text-center">
                <h2 className="text-lg font-black tracking-wide text-slate-950 uppercase sm:text-xl">
                  {doc.introduction.title}
                </h2>
              </div>

              <div className="space-y-3.5 text-xs leading-relaxed text-slate-800 sm:text-[13.5px]">
                <div>
                  <h4 className="font-bold text-slate-950">Mavzuning dolzarbligi:</h4>
                  <p className="mt-1 text-justify indent-6 text-slate-900">
                    {doc.introduction.relevance}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-950">Amaliy ishning maqsadi:</h4>
                  <p className="mt-1 text-justify indent-6 text-slate-900">
                    {doc.introduction.purpose}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-950">Amaliy ishning asosiy vazifalari:</h4>
                  <ul className="mt-1 list-disc space-y-1 pl-6">
                    {doc.introduction.tasks.map((task, idx) => (
                      <li key={idx}>{task}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-slate-950">Tadqiqot obyekti va predmeti:</h4>
                  <p className="mt-1 text-justify indent-6 text-slate-900">
                    {doc.introduction.objectAndSubject}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-950">
                    Qo&apos;llanilgan metodlar va dasturiy vositalar:
                  </h4>
                  <ul className="mt-1 list-disc space-y-1 pl-6">
                    {doc.introduction.methods.map((method, idx) => (
                      <li key={idx}>{method}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          )}

          {/* ===================================================================
                        3. I BOB: NAZARIY VA USLUBIY ASOSLAR
                       =================================================================== */}
          {doc.theorySection && (
            <section className="space-y-4 rounded-xl border border-slate-300 bg-white p-4 sm:p-6 print:border-black print:p-0">
              <div className="border-b-2 border-slate-900 pb-2 text-center">
                <h2 className="text-base font-black tracking-wide text-slate-950 uppercase sm:text-lg">
                  {doc.theorySection.title}
                </h2>
              </div>

              <div className="space-y-2.5 text-xs leading-relaxed text-slate-800 sm:text-[13.5px]">
                {doc.theorySection.paragraphs.map((p, idx) => (
                  <p key={idx} className="text-justify indent-6 text-slate-900">
                    {p}
                  </p>
                ))}
              </div>

              <AmaliyDataTable
                table={{
                  title: "Nazariy asoslar: Dispersion tahlilning asosiy matematik formulalari",
                  headers: ["Ko'rsatkich nomi", "Matematik formula", "Iqtisodiy-statistik tavsifi"],
                  rows: doc.theorySection.keyFormulas.map((f) => [f.name, f.formula, f.note]),
                }}
              />
            </section>
          )}

          {/* ===================================================================
                        4. II BOB: AMALIY ISHNING HISOBLASH VA TAHLIL QISMI
                       =================================================================== */}
          <div className="border-b-2 border-slate-900 pb-3 text-center">
            <h2 className="text-lg font-black tracking-wide text-slate-950 uppercase sm:text-xl">
              II BOB. AMALIY ISHNING HISOBLASH VA TAHLIL QISMI ({doc.meta.variant})
            </h2>
            <p className="mt-1 text-xs text-slate-700 sm:text-sm">
              <strong>Mavzu:</strong> {doc.meta.topic} &nbsp;|&nbsp; <strong>Vaziyat:</strong>{" "}
              {doc.meta.situation}
            </p>
          </div>

          {/* Uslubiy eslatma */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-xs sm:text-sm print:border-slate-400 print:bg-slate-50">
            <div className="mb-1.5 flex items-center gap-1.5 font-bold text-blue-950">
              <BookOpen className="h-4 w-4" />
              <span>{doc.methodologicalNote.title}:</span>
            </div>
            <ul className="list-disc space-y-1 pl-5 text-slate-800">
              {doc.methodologicalNote.rules.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>

          {/* MASALALAR (1-MASALA .. 4-MASALA) */}
          {doc.problems.map((problem) => (
            <section key={problem.number} className="space-y-4 border-t border-slate-300 pt-6">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-white print:border print:border-black print:bg-slate-100 print:text-black">
                <h3 className="text-base font-extrabold tracking-wide sm:text-lg">
                  {problem.title} ({problem.points})
                </h3>
                <span className="rounded bg-white/15 px-2.5 py-0.5 text-xs font-semibold print:border print:border-black">
                  Dispersion tahlil (ANOVA)
                </span>
              </div>

              <p className="text-xs leading-relaxed text-slate-800 sm:text-sm">
                <strong>Masala sharti:</strong> {problem.condition}
              </p>

              {/* Dastlabki ma'lumotlar jadvali */}
              <AmaliyDataTable table={problem.initialTable} />

              <div className="pt-1">
                <h4 className="inline-block border-b-2 border-blue-800 pb-0.5 text-sm font-extrabold text-blue-950 uppercase sm:text-base">
                  Yechim:
                </h4>
              </div>

              {/* a) qadam */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-slate-950 sm:text-sm">
                  {problem.stepA.heading}
                </h5>
                <ul className="list-disc space-y-1 pl-5 text-xs text-slate-800 sm:text-[13px]">
                  {problem.stepA.hypotheses.map((h, idx) => (
                    <li key={idx}>{h}</li>
                  ))}
                </ul>
                <AmaliyDataTable table={problem.stepA.helperTable} />
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-[11px] text-slate-800 sm:text-xs">
                  <div className="mb-1 font-sans font-bold text-slate-900">
                    Qo&apos;lda hisoblash ifodasi:
                  </div>
                  {problem.stepA.manualSampleCalc.map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
              </div>

              {/* b) qadam */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-slate-950 sm:text-sm">
                  {problem.stepB.heading}
                </h5>
                <AmaliyDataTable table={problem.stepB.formulaTable} />
                <div className="rounded-lg border-l-4 border-blue-700 bg-blue-50/70 px-3.5 py-2 text-xs font-bold text-blue-950">
                  {problem.stepB.verificationEquality}
                </div>
              </div>

              {/* c) qadam */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-slate-950 sm:text-sm">
                  {problem.stepC.heading}
                </h5>
                <AmaliyDataTable table={problem.stepC.anovaTable} />
              </div>

              {/* d) qadam */}
              <div className="space-y-1.5 rounded-lg border border-emerald-300 bg-emerald-50/60 p-3.5 text-xs sm:text-sm print:border-slate-400">
                <h5 className="font-bold text-emerald-950">{problem.stepD.heading}</h5>
                <p className="font-bold text-emerald-900">{problem.stepD.decisionTitle}</p>
                <p className="leading-relaxed text-slate-800">
                  {problem.stepD.decisionExplanation}
                </p>
              </div>

              {/* e) qadam + Ustunli diagramma */}
              <div className="space-y-2.5">
                <h5 className="text-xs font-bold text-slate-950 sm:text-sm">
                  {problem.stepE.heading}
                </h5>
                <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs font-bold text-slate-900">
                  {problem.stepE.etaFormula}
                </p>
                <p className="text-xs leading-relaxed text-slate-800 sm:text-sm">
                  <strong>Iqtisodiy va amaliy talqin:</strong>{" "}
                  {problem.stepE.economicInterpretation}
                </p>
                <div className="space-y-1 text-xs text-slate-800 sm:text-[13px]">
                  <div className="font-bold text-slate-950">Boshqaruv uchun tavsiyalar:</div>
                  <ul className="list-disc space-y-1 pl-5">
                    {problem.stepE.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>

                {/* Vizual ustunli diagramma (1-rasm) */}
                <AmaliySvgBarChart chart={problem.stepE.chart} />
              </div>
            </section>
          ))}

          {/* ===================================================================
                        3. EXCEL'DA BAJARISH (1-MASALA MISOLIDA)
                       =================================================================== */}
          <section className="space-y-3 border-t-2 border-slate-900 pt-6">
            <div className="flex items-center gap-2 text-base font-extrabold text-emerald-900 uppercase sm:text-lg">
              <FileSpreadsheet className="h-5 w-5" />
              <span>{doc.excelSection.title}</span>
            </div>
            <p className="text-xs text-slate-700 italic sm:text-sm">{doc.excelSection.subtitle}</p>
            <div className="space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-800 sm:text-[13px]">
              {doc.excelSection.steps.map((s, idx) => (
                <p key={idx}>{s}</p>
              ))}
            </div>
            <AmaliyDataTable
              table={{
                title: doc.excelSection.tableTitle,
                headers: ["Katak", "Ko'rsatkich", "Formula (EN)", "Formula (RU)", "Natija"],
                rows: doc.excelSection.formulas.map((f) => [
                  f.cell,
                  f.indicator,
                  f.formulaEn,
                  f.formulaRu,
                  f.result,
                ]),
              }}
            />
          </section>

          {/* ===================================================================
                        4. UMUMIY XULOSA VA AMALIY TAVSIYALAR
                       =================================================================== */}
          <section className="space-y-3 border-t-2 border-slate-900 pt-6">
            <div className="flex items-center gap-2 text-base font-extrabold text-slate-950 uppercase sm:text-lg">
              <BarChart3 className="h-5 w-5 text-blue-900" />
              <span>{doc.summarySection.title}</span>
            </div>

            <AmaliyDataTable table={doc.summarySection.comparisonTable} />

            <div className="space-y-2 text-xs leading-relaxed text-slate-800 sm:text-sm">
              {doc.summarySection.conclusions.map((c, idx) => (
                <p key={idx}>{c}</p>
              ))}
            </div>

            <div className="rounded-xl border border-slate-300 bg-slate-50 p-4 text-xs sm:text-sm">
              <div className="mb-1.5 flex items-center gap-1.5 font-bold text-slate-950">
                <Table2 className="h-4 w-4 text-blue-800" />
                <span>Yakuni amaliy va boshqaruv tavsiyalari:</span>
              </div>
              <ul className="list-disc space-y-1 pl-5 text-slate-800">
                {doc.summarySection.practicalRecommendations.map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>
          </section>

          {/* ===================================================================
                        5. FOYDALANILGAN ADABIYOTLAR RO'YXATI
                       =================================================================== */}
          {doc.references && doc.references.length > 0 && (
            <section className="space-y-3 border-t-2 border-slate-900 pt-6">
              <div className="flex items-center gap-2 text-base font-extrabold text-slate-950 uppercase sm:text-lg">
                <BookOpen className="h-5 w-5 text-blue-900" />
                <span>
                  {doc.meta.language === "ru"
                    ? "Список использованной литературы"
                    : doc.meta.language === "en"
                      ? "List of References"
                      : "Foydalanilgan adabiyotlar ro'yxati"}
                </span>
              </div>
              <ol className="list-decimal space-y-1.5 pl-6 text-xs text-slate-800 sm:text-sm">
                {doc.references.map((ref, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {ref.replace(/^\d+\.\s*/, "")}
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      </div>
    );
  })
);

export default function AmaliyIshPage() {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    university: "Toshkent to'qimachilik va yengil sanoat instituti",
    department: "Iqtisodiyot va raqamli texnologiyalar kafedrasi",
    subject: "Iqtisodiyotda ma'lumotlar tahlili",
    topic: "Bir omilli va ikki omilli dispersion tahlil",
    situation: "Ishlab chiqarish smenalari va xodimlar so'rovi",
    variant: "18-variant",
    problemCount: 4 as 2 | 3 | 4,
    studentName: "Karimov Sardorbek Anvar o'g'li",
    studentGroup: "IQT-22-18",
    teacherName: "dots. Raximov B.SH.",
    city: "Toshkent",
    year: "2026",
    language: "uz" as "uz" | "ru" | "en",
    customProblemText: "",
  });

  // Pre-load the 18-variant sample immediately so users see the exact PDF solution right away
  const [doc, setDoc] = useState<AmaliyIshDocument>(() =>
    generateDeterministicAmaliyIsh({
      university: "Toshkent to'qimachilik va yengil sanoat instituti",
      department: "Iqtisodiyot va raqamli texnologiyalar kafedrasi",
      subject: "Iqtisodiyotda ma'lumotlar tahlili",
      topic: "Bir omilli va ikki omilli dispersion tahlil",
      situation: "Ishlab chiqarish smenalari va xodimlar so'rovi",
      variant: "18-variant",
      problemCount: 4,
      studentName: "Karimov Sardorbek Anvar o'g'li",
      studentGroup: "IQT-22-18",
      teacherName: "dots. Raximov B.SH.",
      city: "Toshkent",
      year: "2026",
      language: "uz",
    })
  );

  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const documentRef = useRef<HTMLDivElement>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "problemCount" ? (Number(value) as 2 | 3 | 4) : value,
    }));
  };

  const handleLoad18VariantSample = () => {
    const presetForm = {
      university: "Toshkent to'qimachilik va yengil sanoat instituti",
      department: "Iqtisodiyot va raqamli texnologiyalar kafedrasi",
      subject: "Iqtisodiyotda ma'lumotlar tahlili",
      topic: "Bir omilli va ikki omilli dispersion tahlil",
      situation: "Ishlab chiqarish smenalari va xodimlar so'rovi",
      variant: "18-variant",
      problemCount: 4 as 2 | 3 | 4,
      studentName: formData.studentName || "Karimov Sardorbek Anvar o'g'li",
      studentGroup: formData.studentGroup || "IQT-22-18",
      teacherName: formData.teacherName || "dots. Raximov B.SH.",
      city: "Toshkent",
      year: "2026",
      language: "uz" as "uz" | "ru" | "en",
      customProblemText: "",
    };
    setFormData(presetForm);
    const sampleDoc = generateDeterministicAmaliyIsh(presetForm);
    setDoc(sampleDoc);
    toast({
      title: "18-variant namunasi yuklandi! 📊",
      description:
        "«Bir omilli va ikki omilli dispersion tahlil» bo'yicha 4 ta masala, ANOVA jadvallari, grafiklar va Excel formulalari tayyor.",
    });
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.subject.trim() || !formData.topic.trim()) {
      toast({
        title: "Ma'lumotlarni to'ldiring",
        description: "Fan nomi va amaliy ish mavzusi kiritilishi shart.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/ai/amaliy-ish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, useAi: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.document) {
        setDoc(data.document);
        toast({
          title: "Amaliy ish muvaffaqiyatli tayyorlandi! 🧮",
          description: `${data.document.meta.variant} bo'yicha barcha hisob-kitob jadvallari, grafiklar va Excel formulalari shakllantirildi.`,
        });
      } else {
        // Fallback client-side deterministic calculation
        const localDoc = generateDeterministicAmaliyIsh(formData);
        setDoc(localDoc);
        toast({
          title: "Amaliy ish hisoblab chiqildi! 📊",
          description: "Barcha jadvallar, diagramma va Excel funksiyalari tayyor.",
        });
      }
    } catch {
      const localDoc = generateDeterministicAmaliyIsh(formData);
      setDoc(localDoc);
      toast({
        title: "Amaliy ish tayyorlandi! 📊",
        description: "Matematik model asosida barcha jadvallar va yechimlar tuzildi.",
      });
    } finally {
      setLoading(false);
    }
  };

  // 100% ishlaydigan A4 Word (.doc) eksporti (Titul varag'i, barcha jadvallar, grafik chizmasi, Excel jadvali bilan)
  const handleDownloadWordDoc = () => {
    const htmlContent = buildAmaliyIshWordHtml(doc);
    const blob = new Blob(["\ufeff", htmlContent], {
      type: "application/msword;charset=utf-8",
    });
    const cleanVariant = doc.meta.variant.replace(/[^a-zA-Z0-9_-]/g, "_");
    const cleanTopic = doc.meta.topic.slice(0, 28).replace(/[^a-zA-Z0-9_-]/g, "_") || "Amaliy_ish";
    const fileName = `Amaliy_ish_${cleanVariant}_${cleanTopic}.doc`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 30_000);

    toast({
      title: "Word (.doc) yuklab olindi! 📄",
      description:
        "Titul varag'i, ANOVA jadvallari, ustunli diagramma va Excel formulalari A4 formatda saqlandi.",
    });
  };

  const handleDownloadDocx = async () => {
    if (isDownloadingDocx) return;
    setIsDownloadingDocx(true);
    try {
      const exported = await downloadAcademicDocx({
        topic: `${doc.meta.topic} (${doc.meta.variant})`,
        markdownContent: doc.markdown,
        workType: "Amaliy ish",
        subject: doc.meta.subject,
        university: doc.meta.university,
        studentName: `${doc.meta.studentName} (${doc.meta.studentGroup})`,
        teacherName: doc.meta.teacherName,
        language: doc.meta.language === "ru" ? "ru" : doc.meta.language === "en" ? "en" : "uz",
      });

      if (exported.deliveryMethod !== "cancelled") {
        toast({
          title: "Word (.docx) yuklab olindi! 📄",
          description: "GOST A4 standartlariga mos .docx hujjat saqlandi.",
        });
      }
    } catch {
      // Fallback to .doc download
      handleDownloadWordDoc();
    } finally {
      setIsDownloadingDocx(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!documentRef.current) return;
    setIsExportingPdf(true);
    const cleanVariant = doc.meta.variant.replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `Amaliy_ish_${cleanVariant}.pdf`;
    try {
      const blob = await exportElementsToPdf([documentRef.current], {
        filename,
        orientation: "portrait",
        margin: 10,
        fit: "width",
        captureWidth: 794,
      });
      const delivered = await deliverPdf(blob, filename);
      if (delivered !== "cancelled") {
        toast({
          title: "PDF yuklab olindi! 📄",
          description: inAppHint() ?? "Amaliy ish A4 PDF formatida saqlandi.",
        });
      }
    } catch (err) {
      if (err instanceof StaleBuildError) {
        toast({
          title: "Sahifani yangilang 🔄",
          description: err.message,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Chop etish oynasi orqali PDF saqlash",
        description: describePdfError(err),
      });
      handlePrint();
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 120);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(doc.markdown);
    setCopied(true);
    toast({
      title: "Nusxalandi!",
      description: "Amaliy ish matni va jadvallari xotiraga olindi.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-background text-foreground min-h-screen pb-20 print:bg-white print:pb-0">
      <div className="print:hidden">
        <StudentSubNav activeTab="amaliy-ish" />
      </div>

      {/* Top Hero Banner */}
      <div className="border-border bg-surface/30 border-b px-4 py-7 sm:px-6 lg:px-8 print:hidden">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400">
              <Calculator className="h-3.5 w-3.5" />
              <span>Hisob-kitob • ANOVA Jadvallari • Grafik & Excel Formulalar</span>
            </div>
            <h1 className="text-foreground text-2xl font-extrabold sm:text-3xl">
              Amaliy ish va Masalalar yechimi generatori
            </h1>
            <p className="text-foreground-secondary mt-1 max-w-2xl text-xs sm:text-sm">
              OTM standartidagi titul varag&apos;i, 1–4 ta masalaning bosqichma-bosqich{" "}
              <span className="text-foreground font-semibold">a), b), c), d), e)</span> yechimlari,
              yordamchi va yakuniy ANOVA jadvallari, ustunli diagramma hamda MS Excel (EN/RU)
              formulalari.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLoad18VariantSample}
            className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-indigo-400/40 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] sm:text-sm"
          >
            <Sparkles className="h-4 w-4" />
            <span>Namuna (18-variant: Dispersion tahlil ANOVA)</span>
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8 print:p-0">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 print:block">
          {/* LEFT COLUMN: FORM */}
          <div className="border-border bg-surface rounded-2xl border p-4 shadow-sm sm:p-6 lg:col-span-4 print:hidden">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-foreground flex items-center gap-2 text-base font-bold sm:text-lg">
                <Calculator className="h-5 w-5 text-indigo-400" />
                <span>Amaliy ish parametrlari</span>
              </h2>
              <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-[11px] font-bold text-indigo-400">
                A4 Word & PDF
              </span>
            </div>

            <form onSubmit={handleGenerate} className="space-y-3.5">
              {/* Quick Sample Preset Box */}
              <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-foreground text-xs font-bold">Tayyor PDF namunasi:</span>
                  <button
                    type="button"
                    onClick={handleLoad18VariantSample}
                    className="cursor-pointer rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white transition-colors hover:bg-indigo-500"
                  >
                    18-variantni yuklash
                  </button>
                </div>
                <p className="text-foreground-secondary mt-1 text-[11px]">
                  «Iqtisodiyotda ma&apos;lumotlar tahlili» fanidan 18-variant: Bir omilli va ikki
                  omilli dispersion tahlil (4 ta masala + Excel).
                </p>
              </div>

              {/* OTM nomi */}
              <div>
                <label className="text-foreground-secondary mb-1 block text-xs font-semibold">
                  OTM (Universitet / Institut) nomi
                </label>
                <input
                  type="text"
                  name="university"
                  list="amaliy-universities"
                  value={formData.university}
                  onChange={handleChange}
                  placeholder="Toshkent to'qimachilik va yengil sanoat instituti"
                  className="border-border bg-background text-foreground min-h-[42px] w-full rounded-xl border px-3 py-2 text-xs focus:border-indigo-400 focus:outline-none sm:text-sm"
                />
                <datalist id="amaliy-universities">
                  {UNIVERSITY_PRESETS.map((u) => (
                    <option key={u} value={u} />
                  ))}
                </datalist>
              </div>

              {/* Fan nomi */}
              <div>
                <label className="text-foreground-secondary mb-1 block text-xs font-semibold">
                  Fan nomi *
                </label>
                <input
                  type="text"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Masalan: Iqtisodiyotda ma'lumotlar tahlili"
                  className="border-border bg-background text-foreground min-h-[42px] w-full rounded-xl border px-3 py-2 text-xs focus:border-indigo-400 focus:outline-none sm:text-sm"
                />
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {SUBJECT_PRESETS.slice(0, 5).map((subj) => (
                    <button
                      key={subj}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, subject: subj }))}
                      className="border-border bg-background text-foreground-secondary hover:text-foreground cursor-pointer rounded-lg border px-2 py-0.5 text-[10px] font-medium transition-colors hover:border-indigo-500/40"
                    >
                      {subj}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mavzu */}
              <div>
                <label className="text-foreground-secondary mb-1 block text-xs font-semibold">
                  Amaliy ish mavzusi *
                </label>
                <input
                  type="text"
                  name="topic"
                  required
                  value={formData.topic}
                  onChange={handleChange}
                  placeholder="Bir omilli va ikki omilli dispersion tahlil"
                  className="border-border bg-background text-foreground min-h-[42px] w-full rounded-xl border px-3 py-2 text-xs focus:border-indigo-400 focus:outline-none sm:text-sm"
                />
              </div>

              {/* Vaziyat */}
              <div>
                <label className="text-foreground-secondary mb-1 block text-xs font-semibold">
                  Amaliy vaziyat (keys) nomi
                </label>
                <input
                  type="text"
                  name="situation"
                  value={formData.situation}
                  onChange={handleChange}
                  placeholder="Ishlab chiqarish smenalari va xodimlar so'rovi"
                  className="border-border bg-background text-foreground min-h-[42px] w-full rounded-xl border px-3 py-2 text-xs focus:border-indigo-400 focus:outline-none sm:text-sm"
                />
              </div>

              {/* Variant va Masalalar soni */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-foreground-secondary mb-1 block text-xs font-semibold">
                    Variant raqami
                  </label>
                  <input
                    type="text"
                    name="variant"
                    value={formData.variant}
                    onChange={handleChange}
                    placeholder="18-variant"
                    className="border-border bg-background text-foreground min-h-[42px] w-full rounded-xl border px-3 py-2 text-xs font-bold focus:border-indigo-400 focus:outline-none sm:text-sm"
                  />
                </div>
                <div>
                  <label className="text-foreground-secondary mb-1 block text-xs font-semibold">
                    Masalalar soni
                  </label>
                  <select
                    name="problemCount"
                    value={formData.problemCount}
                    onChange={handleChange}
                    className="border-border bg-background text-foreground min-h-[42px] w-full rounded-xl border px-3 py-2 text-xs font-semibold focus:border-indigo-400 focus:outline-none sm:text-sm"
                  >
                    <option value={2}>2 ta masala</option>
                    <option value={3}>3 ta masala</option>
                    <option value={4}>4 ta masala (To&apos;liq)</option>
                  </select>
                </div>
              </div>

              {/* Ixtiyoriy masala sharti */}
              <div>
                <label className="text-foreground-secondary mb-1 block text-xs font-semibold">
                  Masala sharti yoki topshiriq matni (ixtiyoriy)
                </label>
                <textarea
                  name="customProblemText"
                  rows={2}
                  value={formData.customProblemText}
                  onChange={handleChange}
                  placeholder="Bo'sh qoldirsangiz, mavzu va variant raqamiga mos 4 ta masalali to'liq amaliy ish avtomatik tuziladi va yechiladi..."
                  className="border-border bg-background text-foreground w-full rounded-xl border px-3 py-2 text-xs focus:border-indigo-400 focus:outline-none"
                />
              </div>

              {/* Talaba, Guruh, O'qituvchi */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-foreground-secondary mb-1 block text-xs font-semibold">
                    Talaba F.I.Sh. (Tayyorladi)
                  </label>
                  <input
                    type="text"
                    name="studentName"
                    value={formData.studentName}
                    onChange={handleChange}
                    placeholder="Karimov S.A."
                    className="border-border bg-background text-foreground min-h-[40px] w-full rounded-xl border px-3 py-2 text-xs focus:border-indigo-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-foreground-secondary mb-1 block text-xs font-semibold">
                    Guruh raqami
                  </label>
                  <input
                    type="text"
                    name="studentGroup"
                    value={formData.studentGroup}
                    onChange={handleChange}
                    placeholder="IQT-22-18"
                    className="border-border bg-background text-foreground min-h-[40px] w-full rounded-xl border px-3 py-2 text-xs focus:border-indigo-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-foreground-secondary mb-1 block text-xs font-semibold">
                    O&apos;qituvchi (Vazifa berdi)
                  </label>
                  <input
                    type="text"
                    name="teacherName"
                    value={formData.teacherName}
                    onChange={handleChange}
                    placeholder="dots. Raximov B.SH."
                    className="border-border bg-background text-foreground min-h-[40px] w-full rounded-xl border px-3 py-2 text-xs focus:border-indigo-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-foreground-secondary mb-1 block text-xs font-semibold">
                    Til
                  </label>
                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleChange}
                    className="border-border bg-background text-foreground min-h-[40px] w-full rounded-xl border px-3 py-2 text-xs font-semibold focus:border-indigo-400 focus:outline-none"
                  >
                    <option value="uz">O&apos;zbek tili (UZ)</option>
                    <option value="ru">Русский язык (RU)</option>
                    <option value="en">English (EN)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 px-4 py-3.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.01] disabled:opacity-50 sm:text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Amaliy ish hisoblanmoqda...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Amaliy ish tayyorlash</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* RIGHT COLUMN: A4 DOCUMENT PREVIEW & EXPORT */}
          <div className="flex min-w-0 flex-col space-y-4 lg:col-span-8">
            {/* Export Toolbar */}
            <div className="border-border bg-surface flex flex-col gap-3 rounded-2xl border p-3.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between print:hidden">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500/15 px-2.5 py-1 text-xs font-bold text-indigo-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{doc.meta.variant} tayyor</span>
                </span>
                <span className="text-foreground-secondary text-xs">
                  {doc.problems.length} ta masala • Jami {doc.meta.totalPoints} ball • Jadval,
                  Grafik & Excel
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
                <button
                  type="button"
                  onClick={handleDownloadWordDoc}
                  className="flex min-h-[40px] cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-blue-500"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  <span>Word (.doc)</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadDocx}
                  disabled={isDownloadingDocx}
                  className="flex min-h-[40px] cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 disabled:opacity-50"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  <span>{isDownloadingDocx ? "Yuklanmoqda..." : "Word (.docx)"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isExportingPdf}
                  className="flex min-h-[40px] cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-red-500 disabled:opacity-50"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  <span>{isExportingPdf ? "PDF..." : "PDF (.pdf)"}</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="border-border bg-surface-elevated text-foreground hover:bg-border/60 flex min-h-[40px] cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="border-border bg-surface-elevated text-foreground hover:bg-border/60 flex min-h-[40px] cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span>{copied ? "Nusxalandi" : "Nusxa"}</span>
                </button>
              </div>
            </div>

            {/* A4 DOCUMENT SHEET */}
            <AmaliyIshDocumentSheet ref={documentRef} doc={doc} />
          </div>
        </div>
      </div>

      {/* Print Specific CSS */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 20mm 15mm 20mm 30mm;
          }
          body {
            background-color: white !important;
            color: black !important;
            font-family: "Times New Roman", Times, serif !important;
          }
          header,
          nav,
          footer,
          .print\\:hidden {
            display: none !important;
          }
          table {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
