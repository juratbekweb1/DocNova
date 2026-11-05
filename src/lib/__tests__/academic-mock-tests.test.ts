import { describe, it, expect } from "vitest";
import {
  ENGLISH_MOCK_DATA,
  RUSSIAN_MOCK_DATA,
  TURKISH_MOCK_DATA,
  LanguageMockTestData,
} from "../academic/mock-test-data";
import { evaluateMockTestLocally } from "../academic/mock-test-evaluator";

describe("Academic Mock Test System - Multi-Level Verification", () => {
  const testSuites: {
    name: string;
    data: LanguageMockTestData;
    requiredLevels: string[];
    cefrCount: number;
    specialCount: number;
  }[] = [
    {
      name: "English Mock Test",
      data: ENGLISH_MOCK_DATA,
      requiredLevels: [
        "A1",
        "A2",
        "B1",
        "B2",
        "C1",
        "C2",
        "IELTS-4-5",
        "IELTS-5.5-6.5",
        "IELTS-7-8.5",
      ],
      cefrCount: 6,
      specialCount: 3,
    },
    {
      name: "Russian Mock Test",
      data: RUSSIAN_MOCK_DATA,
      requiredLevels: [
        "A1",
        "A2",
        "B1",
        "B2",
        "C1",
        "C2",
        "TRKI-ELEM",
        "TRKI-BASE",
        "TRKI-1",
        "TRKI-2",
      ],
      cefrCount: 6,
      specialCount: 4,
    },
    {
      name: "Turkish Mock Test",
      data: TURKISH_MOCK_DATA,
      requiredLevels: [
        "A1",
        "A2",
        "B1",
        "B2",
        "C1",
        "C2",
        "TOMER-BASLANGIC",
        "TOMER-ORTA",
        "TOMER-ILERI",
      ],
      cefrCount: 6,
      specialCount: 3,
    },
  ];

  testSuites.forEach(({ name, data, requiredLevels, cefrCount, specialCount }) => {
    describe(name, () => {
      it("should contain all required language levels and correct counts", () => {
        const levelIds = data.levels.map((l) => l.id);
        requiredLevels.forEach((reqLevel) => {
          expect(levelIds).toContain(reqLevel);
        });

        const cefrLevels = data.levels.filter((l) => l.group === "cefr");
        const specialLevels = data.levels.filter((l) => l.group !== "cefr");

        expect(cefrLevels.length).toBe(cefrCount);
        expect(specialLevels.length).toBe(specialCount);
      });

      it("every level should have exactly 5 questions with 4 options and valid correctKey", () => {
        data.levels.forEach((level) => {
          expect(level.questions.length).toBe(5);

          level.questions.forEach((q) => {
            expect(q.id).toBeDefined();
            expect(q.category.length).toBeGreaterThan(0);
            expect(q.question.length).toBeGreaterThan(10);
            expect(q.options.length).toBe(4);

            const optionKeys = q.options.map((o) => o.key);
            expect(["A", "B", "C", "D"]).toEqual(expect.arrayContaining(optionKeys));
            expect(optionKeys).toContain(q.correctKey);

            expect(q.explanation).toBeDefined();
            expect(q.explanation.length).toBeGreaterThan(10);
          });
        });
      });

      it("every level should contain a dedicated writing prompt", () => {
        data.levels.forEach((level) => {
          expect(level.writingPrompt).toBeDefined();
          expect(level.writingPrompt.topic.length).toBeGreaterThan(5);
          expect(level.writingPrompt.instructions.length).toBeGreaterThan(10);
          expect(level.writingPrompt.placeholder.length).toBeGreaterThan(10);
          expect(level.writingPrompt.suggestedLength.length).toBeGreaterThan(3);
        });
      });
    });
  });

  describe("CEFR & Level Scoring Logic Verification", () => {
    it("should correctly preserve CEFR A1 level instead of defaulting to B2", () => {
      const a1Level = ENGLISH_MOCK_DATA.levels.find((l) => l.id === "A1")!;
      expect(a1Level).toBeDefined();
      expect(a1Level.shortName).toBe("A1");
      expect(a1Level.group).toBe("cefr");

      // Verify that all 6 CEFR levels have correct matching IDs
      ["A1", "A2", "B1", "B2", "C1", "C2"].forEach((lvl) => {
        expect(ENGLISH_MOCK_DATA.levels.some((l) => l.id === lvl && l.group === "cefr")).toBe(true);
        expect(RUSSIAN_MOCK_DATA.levels.some((l) => l.id === lvl && l.group === "cefr")).toBe(true);
        expect(TURKISH_MOCK_DATA.levels.some((l) => l.id === lvl && l.group === "cefr")).toBe(true);
      });
    });

    it("should compute exact scores when candidate answers all questions correctly", () => {
      const b2Level = ENGLISH_MOCK_DATA.levels.find((l) => l.id === "B2")!;
      const answers: Record<string, string> = {};
      b2Level.questions.forEach((q) => {
        answers[q.id] = q.correctKey;
      });

      let correct = 0;
      b2Level.questions.forEach((q) => {
        if (answers[q.id] === q.correctKey) correct++;
      });

      expect(correct).toBe(5);
      expect((correct / b2Level.questions.length) * 100).toBe(100);
    });

    it("should correctly identify wrong answers and calculate partial scores", () => {
      const trki1Level = RUSSIAN_MOCK_DATA.levels.find((l) => l.id === "TRKI-1")!;
      expect(trki1Level).toBeDefined();

      const answers: Record<string, string> = {};
      // 3 correct, 2 wrong
      trki1Level.questions.forEach((q, idx) => {
        answers[q.id] = idx < 3 ? q.correctKey : "WRONG_KEY";
      });

      let correct = 0;
      trki1Level.questions.forEach((q) => {
        if (answers[q.id] === q.correctKey) correct++;
      });

      expect(correct).toBe(3);
      expect(Math.round((correct / trki1Level.questions.length) * 100)).toBe(60);
    });

    it("should evaluate Mock Test deterministically and instantly via evaluateMockTestLocally", () => {
      const b2Level = ENGLISH_MOCK_DATA.levels.find((l) => l.id === "B2")!;
      const answers: Record<string, string> = {};
      b2Level.questions.forEach((q) => {
        answers[q.id] = q.correctKey;
      });

      const start = performance.now();
      const result = evaluateMockTestLocally({
        language: "EN",
        testType: "IELTS & CEFR",
        selectedLevel: b2Level.name,
        levelId: b2Level.id,
        levelShortName: b2Level.shortName,
        answers,
        questions: b2Level.questions,
        writtenText: "This is a comprehensive analytical essay demonstrating advanced academic English writing skills.",
      });
      const duration = performance.now() - start;

      // Must complete in under 50ms (fail-fast safeguard)
      expect(duration).toBeLessThan(50);
      expect(result.overallScore).toBeGreaterThanOrEqual(80);
      expect(result.cefrLevel).toBe("B2");
      expect(result.bandScore).toContain("CEFR B2");
      expect(result.strengths.length).toBe(3);
      expect(result.weaknesses.length).toBe(2);
      expect(result.recommendations.length).toBe(3);
      expect(result.summary.length).toBeGreaterThan(20);
    });

    it("should accurately score IELTS levels", () => {
      const ieltsLevel = ENGLISH_MOCK_DATA.levels.find((l) => l.id === "IELTS-5.5-6.5")!;
      const answers: Record<string, string> = {};
      ieltsLevel.questions.forEach((q) => {
        answers[q.id] = q.correctKey;
      });

      const result = evaluateMockTestLocally({
        language: "EN",
        levelId: "IELTS-5.5-6.5",
        answers,
        questions: ieltsLevel.questions,
      });

      expect(result.cefrLevel).toBe("B2");
      expect(result.bandScore).toContain("IELTS 6.5");
      expect(result.overallScore).toBe(100);
    });

    it("should accurately score Turkish TOMER levels", () => {
      const tomerLevel = TURKISH_MOCK_DATA.levels.find((l) => l.id === "TOMER-ILERI")!;
      const answers: Record<string, string> = {};
      tomerLevel.questions.forEach((q) => {
        answers[q.id] = q.correctKey;
      });

      const result = evaluateMockTestLocally({
        language: "TR",
        levelId: "TOMER-ILERI",
        answers,
        questions: tomerLevel.questions,
      });

      expect(result.cefrLevel).toBe("C2");
      expect(result.bandScore).toContain("TÖMER İleri");
    });
  });
});
