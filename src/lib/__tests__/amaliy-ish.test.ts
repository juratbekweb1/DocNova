// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  computeOneWayAnova,
  computeTwoWayAnova,
  generateDeterministicAmaliyIsh,
  buildAmaliyIshWordHtml,
} from "@/lib/amaliy-ish-generator";
import { generateAcademicDocx } from "@/lib/academic-docx-exporter";
import { POST as amaliyIshPost } from "@/app/api/ai/amaliy-ish/route";
import { STUDENT_SECTIONS } from "@/components/academic/student-sub-nav";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue(null),
}));
vi.mock("@/lib/auth-options", () => ({
  authOptions: {},
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    verificationToken: {
      upsert: vi.fn().mockResolvedValue({}),
      findUnique: vi.fn().mockResolvedValue(null),
    },
  },
}));
vi.mock("@/lib/gemini", () => ({
  generateGeminiJson: vi.fn().mockResolvedValue({
    data: {
      problem1Condition: "Maxsus korxona smenalari bo'yicha ANOVA tahlili",
      problem1Interpretation: "1-smena eng yuqori unumdorlik ko'rsatdi.",
      conclusions: ["1-xulosa", "2-xulosa"],
      practicalRecommendations: ["1-tavsiya", "2-tavsiya"],
    },
  }),
}));

describe("Amaliy ish (Dispersion tahlil ANOVA & Excel) Module", () => {
  it("includes amaliy-ish in STUDENT_SECTIONS navigation", () => {
    const amaliySection = STUDENT_SECTIONS.find((s) => s.id === "amaliy-ish");
    expect(amaliySection).toBeDefined();
    expect(amaliySection?.href).toBe("/academic/amaliy-ish");
    expect(amaliySection?.shortTitle).toBe("Amaliy ish");
  });

  it("computes One-Way ANOVA accurately for equal and unequal group sizes", () => {
    const equalGroups = [
      { name: "1-smena", values: [78, 82, 80, 84, 76], color: "#2563eb" },
      { name: "2-smena", values: [70, 72, 68, 74, 71], color: "#0ea5e9" },
      { name: "3-smena", values: [60, 64, 62, 58, 61], color: "#6366f1" },
    ];
    const res = computeOneWayAnova(equalGroups, 3.8853);
    expect(res.N).toBe(15);
    expect(res.dfBetween).toBe(2);
    expect(res.dfWithin).toBe(12);
    expect(res.dfTotal).toBe(14);
    expect(res.ssTotal).toBeCloseTo(res.ssBetween + res.ssWithin, 4);
    expect(res.fObserved).toBeGreaterThan(res.fCritical);
    expect(res.etaSquared).toBeGreaterThan(80);
  });

  it("computes Two-Way ANOVA without replication accurately", () => {
    const rows = ["A1", "A2", "A3"];
    const cols = ["B1", "B2", "B3", "B4"];
    const matrix = [
      [74, 80, 86, 92],
      [68, 75, 81, 88],
      [60, 66, 73, 79],
    ];
    const res = computeTwoWayAnova(rows, cols, matrix);
    expect(res.N).toBe(12);
    expect(res.dfRow).toBe(2);
    expect(res.dfCol).toBe(3);
    expect(res.dfError).toBe(6);
    expect(res.dfTotal).toBe(11);
    expect(res.ssTotal).toBeCloseTo(res.ssRow + res.ssCol + res.ssError, 2);
    expect(res.fRow).toBeGreaterThan(res.fCritRow);
    expect(res.fCol).toBeGreaterThan(res.fCritCol);
  });

  it("generates full 18-variant Amaliy ish document with 4 problems, charts, Excel EN/RU formulas, and Word HTML", () => {
    const doc = generateDeterministicAmaliyIsh({
      variant: "18-variant",
      problemCount: 4,
    });

    expect(doc.meta.variant).toBe("18-VARIANT");
    expect(doc.problems).toHaveLength(4);
    expect(doc.problems[0].points).toBe("3,5 BALL");
    expect(doc.problems[1].points).toBe("2 BALL");
    expect(doc.problems[2].points).toBe("3 BALL");
    expect(doc.problems[3].points).toBe("1,5 BALL");

    // Verify Problem 2 is based on summary statistics / unequal groups
    expect(doc.problems[1].condition).toContain("yig'ma statistik");
    expect(doc.problems[1].stepA.helperTable.title).toContain("Yig'ma statistikalar");

    // Verify Problem 4 is ANOVA table reconstruction and Fisher LSD
    expect(doc.problems[3].condition).toContain("qisman to'ldirilgan ANOVA jadvali");
    expect(doc.problems[3].initialTable.rows[0]).toContain("?");
    expect(doc.problems[3].stepB.verificationEquality).toContain("Tekshirish ayniyati");

    // Verify Excel EN & RU formulas
    const formulaEnList = doc.excelSection.formulas.map((f) => f.formulaEn);
    const formulaRuList = doc.excelSection.formulas.map((f) => f.formulaRu);
    expect(formulaEnList.some((f) => f.includes("=AVERAGE"))).toBe(true);
    expect(formulaRuList.some((f) => f.includes("=СРЗНАЧ"))).toBe(true);
    expect(formulaEnList.some((f) => f.includes("=DEVSQ"))).toBe(true);
    expect(formulaRuList.some((f) => f.includes("=КВАДРОТКЛ"))).toBe(true);
    expect(formulaEnList.some((f) => f.includes("=F.INV.RT"))).toBe(true);
    expect(formulaRuList.some((f) => f.includes("=Ф.ОБР.ПХ"))).toBe(true);
    expect(formulaEnList.some((f) => f.includes("=F.DIST.RT"))).toBe(true);
    expect(formulaRuList.some((f) => f.includes("=Ф.РАСП.ПХ"))).toBe(true);
    expect(formulaEnList.some((f) => f.includes("=T.INV.2T"))).toBe(true);
    expect(formulaRuList.some((f) => f.includes("=СТЬЮДЕНТ.ОБР.2Х"))).toBe(true);

    // Verify Word HTML output - MUST be clean official A4 without double borders or card borders
    const wordHtml = buildAmaliyIshWordHtml(doc);
    expect(wordHtml).toContain("WordSection1");
    expect(wordHtml).toContain("18-VARIANT");
    expect(wordHtml).toContain("1-MASALA");
    expect(wordHtml).toContain("EXCEL’DA BAJARISH");
    expect(wordHtml).toContain("UMUMIY XULOSA");
    // Verify title page has NO double border and NO card boxes
    expect(wordHtml).not.toContain("border:2pt double");
    expect(wordHtml).not.toContain(
      "border:1pt solid #94a3b8;background:#f8fafc;padding:12pt 16pt;"
    );

    // Verify markdown has clean page break
    expect(doc.markdown).toContain("<!-- PAGE_BREAK -->");
  });

  it("respects problemCount (2, 3, or 4 problems), computes exact totalPoints, and avoids referencing 3-masala when problemCount=2", () => {
    const doc2 = generateDeterministicAmaliyIsh({
      variant: "7-variant",
      problemCount: 2,
    });
    expect(doc2.meta.variant).toBe("7-VARIANT");
    expect(doc2.problems).toHaveLength(2);
    expect(doc2.meta.totalPoints).toBe(5.5);
    expect(doc2.summarySection.comparisonTable.rows).toHaveLength(2);
    expect(doc2.summarySection.conclusions.join(" ")).not.toContain("(3-masala)");

    const doc3 = generateDeterministicAmaliyIsh({
      variant: "10-variant",
      problemCount: 3,
    });
    expect(doc3.problems).toHaveLength(3);
    expect(doc3.meta.totalPoints).toBe(8.5);
    expect(doc3.summarySection.conclusions.join(" ")).toContain("(3-masala)");
  });

  it("parses custom numerical group observations from customProblemText and computes exact ANOVA on student data", () => {
    const customDoc = generateDeterministicAmaliyIsh({
      subject: "Statistika",
      topic: "Guruhlararo dispersion tahlil",
      customProblemText: "1-sexi: 50, 52, 48, 50\n2-sexi: 40, 42, 38, 40\n3-sexi: 30, 32, 28, 30",
      problemCount: 4,
    });

    expect(customDoc.problems[0].initialTable.rows).toHaveLength(3);
    expect(customDoc.problems[0].initialTable.rows[0][0]).toBe("1-sexi");
    // Group means are 50, 40, 30 -> grand mean = 40
    // SS_within per group: (0+4+4+0)=8 -> total SS_within = 24
    // SS_between: 4*(100 + 0 + 100) = 800 -> SS_total = 824
    expect(customDoc.problems[0].stepB.verificationEquality).toContain("800 + 24 = 824");
    expect(customDoc.problems[0].stepB.verificationEquality).toContain("df_umumiy = 2 + 9 = 11");
    expect(customDoc.excelSection.tableTitle).toContain("14-jadval");
  });

  it("supports ru and en language metadata localization", () => {
    const ruDoc = generateDeterministicAmaliyIsh({
      variant: "5-variant",
      language: "ru",
    });
    expect(ruDoc.meta.variant).toBe("ВАРИАНТ 5");
    expect(ruDoc.meta.workType).toContain("ПРАКТИЧЕСКАЯ РАБОТА");

    const enDoc = generateDeterministicAmaliyIsh({
      variant: "5-variant",
      language: "en",
    });
    expect(enDoc.meta.variant).toBe("VARIANT 5");
    expect(enDoc.meta.workType).toContain("PRACTICAL WORK");
  });

  it("API /api/ai/amaliy-ish returns 400 when both subject and topic are empty", async () => {
    const req = new NextRequest("http://localhost:3000/api/ai/amaliy-ish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: "   ", topic: "" }),
    });
    const res = await amaliyIshPost(req);
    expect(res.status).toBe(400);
  });

  it("API /api/ai/amaliy-ish returns 200 with full structured document for 18-variant and custom topics", async () => {
    const req = new NextRequest("http://localhost:3000/api/ai/amaliy-ish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: "Ekonometrika",
        topic: "Korxona filiallari samaradorligining dispersion tahlili",
        situation: "Filiallar rentabelligi va xodimlar KPI tahlili",
        variant: "12-variant",
        problemCount: 3,
      }),
    });
    const res = await amaliyIshPost(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.document.meta.variant).toBe("12-VARIANT");
    expect(json.document.meta.totalPoints).toBe(8.5);
    expect(json.document.problems).toHaveLength(3);
  });

  it("exports official OpenXML .docx with clean OTM title page, custom city (e.g. Qarshi), and page break", async () => {
    const doc = generateDeterministicAmaliyIsh({
      city: "Qarshi",
      year: "2026",
      variant: "18-variant",
      problemCount: 4,
    });

    const docxResult = await generateAcademicDocx({
      topic: `${doc.meta.topic} (${doc.meta.variant})`,
      markdownContent: doc.markdown,
      workType: "Amaliy ish",
      subject: doc.meta.subject,
      university: doc.meta.university,
      studentName: `${doc.meta.studentName} (${doc.meta.studentGroup})`,
      teacherName: doc.meta.teacherName,
    });

    expect(docxResult.buffer).toBeDefined();
    expect(docxResult.buffer.byteLength).toBeGreaterThan(5000);
    // OpenXML PK magic header: 50 4B 03 04
    expect(docxResult.buffer[0]).toBe(0x50);
    expect(docxResult.buffer[1]).toBe(0x4b);
    expect(docxResult.buffer[2]).toBe(0x03);
    expect(docxResult.buffer[3]).toBe(0x04);
    expect(docxResult.fileName).toContain("Amaliy_ish");
    expect(docxResult.fileName.endsWith(".docx")).toBe(true);
  });

  it("dynamically adjusts Excel formulas and LSD sample sizes when custom observation count changes", () => {
    const customDoc = generateDeterministicAmaliyIsh({
      customProblemText: "A-sex: 10, 20, 30, 40\nB-sex: 15, 25, 35, 45\nC-sex: 12, 22, 32, 42",
      problemCount: 4,
    });

    // 4 observations per group: data range is B2:D5, sum row is 7
    const lsdFormulaEn = customDoc.excelSection.formulas.find((f) =>
      f.indicator.includes("Fisher LSD")
    )?.formulaEn;
    const lsdFormulaRu = customDoc.excelSection.formulas.find((f) =>
      f.indicator.includes("Fisher LSD")
    )?.formulaRu;
    expect(lsdFormulaEn).toContain("*(1/4+1/4)");
    expect(lsdFormulaRu).toContain("*(1/4+1/4)");
    expect(lsdFormulaRu).toContain("КОРЕНЬ");

    // Check sum row references row 7
    const sumRowFormula = customDoc.excelSection.formulas.find((f) =>
      f.indicator.includes("yig'indisi")
    );
    expect(sumRowFormula?.cell).toBe("B7:D7");
    expect(sumRowFormula?.formulaEn).toBe("=SUM(B2:B5)");
  });
});
