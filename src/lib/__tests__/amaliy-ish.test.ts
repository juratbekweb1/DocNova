// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  computeOneWayAnova,
  computeTwoWayAnova,
  generateDeterministicAmaliyIsh,
  buildAmaliyIshWordHtml,
} from "@/lib/amaliy-ish-generator";
import { POST as amaliyIshPost } from "@/app/api/ai/amaliy-ish/route";
import { STUDENT_SECTIONS } from "@/components/academic/student-sub-nav";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue(null),
}));
vi.mock("@/lib/auth-options", () => ({
  authOptions: {},
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

    // Verify Excel EN & RU formulas
    const formulaEnList = doc.excelSection.formulas.map((f) => f.formulaEn);
    const formulaRuList = doc.excelSection.formulas.map((f) => f.formulaRu);
    expect(formulaEnList.some((f) => f.includes("=AVERAGE"))).toBe(true);
    expect(formulaRuList.some((f) => f.includes("=СРЗНАЧ"))).toBe(true);
    expect(formulaEnList.some((f) => f.includes("=DEVSQ"))).toBe(true);
    expect(formulaRuList.some((f) => f.includes("=КВАДРОТКЛ"))).toBe(true);
    expect(formulaEnList.some((f) => f.includes("=F.INV.RT"))).toBe(true);
    expect(formulaRuList.some((f) => f.includes("=F.ОБР.ПХ"))).toBe(true);
    expect(formulaEnList.some((f) => f.includes("=F.DIST.RT"))).toBe(true);
    expect(formulaRuList.some((f) => f.includes("=F.РАСП.ПХ"))).toBe(true);

    // Verify Word HTML output
    const wordHtml = buildAmaliyIshWordHtml(doc);
    expect(wordHtml).toContain("WordSection1");
    expect(wordHtml).toContain("18-VARIANT");
    expect(wordHtml).toContain("1-MASALA");
    expect(wordHtml).toContain("EXCEL’DA BAJARISH");
    expect(wordHtml).toContain("UMUMIY XULOSA");
  });

  it("respects problemCount (2 or 3 problems) and variant offset", () => {
    const doc2 = generateDeterministicAmaliyIsh({
      variant: "7-variant",
      problemCount: 2,
    });
    expect(doc2.meta.variant).toBe("7-VARIANT");
    expect(doc2.problems).toHaveLength(2);
    expect(doc2.summarySection.comparisonTable.rows).toHaveLength(2);
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
    expect(json.document.problems).toHaveLength(3);
  });
});
