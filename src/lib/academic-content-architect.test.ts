import { describe, expect, it } from "vitest";
import {
  auditAndSanitizeAcademicContent,
  buildControlledAcademicPrompt,
  calculateAcademicVolumeBudget,
  parseTargetPageCount,
} from "./academic-content-architect";

describe("Academic Content Architect & Volume Controller", () => {
  it("parses page counts accurately from strings, ranges, and numbers", () => {
    expect(parseTargetPageCount("15", "COURSEWORK")).toBe(15);
    expect(parseTargetPageCount("5-8 bet (Klassik)", "REFERAT")).toBe(7);
    expect(parseTargetPageCount("10-15 bet (Kengaytirilgan)", "REFERAT")).toBe(13);
    expect(parseTargetPageCount(30, "COURSEWORK")).toBe(30);
  });

  it("calculates exact GOST A4 word and character budgets for 15-page and 30-page coursework", () => {
    const budget15 = calculateAcademicVolumeBudget(15, "COURSEWORK");
    expect(budget15.targetTotalPages).toBe(15);
    expect(budget15.fixedStructuralPages).toBe(3); // Titul + Mundarija + Adabiyotlar
    expect(budget15.netContentPages).toBe(12);
    // 12 content pages * ~265 words/page ≈ 3180 words (between 3000 and 3600)
    expect(budget15.totalTargetWords).toBeGreaterThanOrEqual(2900);
    expect(budget15.totalTargetWords).toBeLessThanOrEqual(3600);

    const budget30 = calculateAcademicVolumeBudget(30, "COURSEWORK");
    expect(budget30.targetTotalPages).toBe(30);
    expect(budget30.fixedStructuralPages).toBe(4); // Titul + Mundarija + 2 bet Adabiyotlar
    expect(budget30.netContentPages).toBe(26);
    expect(budget30.totalTargetWords).toBeGreaterThan(budget15.totalTargetWords * 2);
  });

  it("builds controlled prompt with topic lock and removes duplicate sentences in audit", () => {
    const { systemInstruction, userPrompt, budget } = buildControlledAcademicPrompt({
      moduleType: "COURSEWORK",
      topic: "Raqamli iqtisodiyotda tijorat banklari xizmatlari",
      subject: "Bank ishi va moliya",
      pageCount: 20,
      language: "uz",
    });

    expect(systemInstruction).toContain("Raqamli iqtisodiyotda tijorat banklari xizmatlari");
    expect(userPrompt).toContain("250-300 so'z");

    const sampleWithDuplicate = `## KIRISH\n\nRaqamli iqtisodiyotda tijorat banklari xizmatlarini modernizatsiya qilish bugungi kunning eng dolzarb masalasidir. Raqamli iqtisodiyotda tijorat banklari xizmatlarini modernizatsiya qilish bugungi kunning eng dolzarb masalasidir. Bank tizimida fintex yechimlar mijozlar oqimini tezlashtiradi.`;

    const audit = auditAndSanitizeAcademicContent(
      sampleWithDuplicate,
      "Raqamli iqtisodiyotda tijorat banklari xizmatlari",
      budget
    );

    expect(audit.isValid).toBe(true);
    expect(audit.duplicateSentencesFound).toBe(1);
    expect(audit.topicRelevanceScore).toBe(100);
  });
});
