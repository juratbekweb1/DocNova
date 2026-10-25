import { describe, it, expect, vi, beforeEach } from "vitest";

const { userFind, limitFind } = vi.hoisted(() => ({ userFind: vi.fn(), limitFind: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: userFind }, userApiLimit: { findUnique: limitFind } },
}));

import { checkPdfLimit } from "./pdf-limit";
import { PLAN_LIMITS } from "./limits";

describe("tier limits & unlocks", () => {
  beforeEach(() => {
    userFind.mockReset();
    limitFind.mockReset();
  });

  it("PREMIUM and PRO have no PDF cap even above the free limit", async () => {
    limitFind.mockResolvedValue({ pdfCount: 999 });
    for (const plan of ["PREMIUM", "PRO"]) {
      userFind.mockResolvedValue({ role: "USER", plan });
      expect(await checkPdfLimit("u1")).toBe(true);
    }
  });

  it("FREE is blocked once the PDF cap is reached, allowed below it", async () => {
    userFind.mockResolvedValue({ role: "USER", plan: "FREE" });
    limitFind.mockResolvedValue({ pdfCount: 5 });
    expect(await checkPdfLimit("u1")).toBe(false);
    limitFind.mockResolvedValue({ pdfCount: 4 });
    expect(await checkPdfLimit("u1")).toBe(true);
  });

  it("PREMIUM limits exceed PRO and FREE on every feature; export is unlocked", () => {
    const keys = [
      "chat",
      "document_generation",
      "resume_analysis",
      "rewrite",
      "mock_test",
      "coursework",
      "presentation",
    ] as const;
    for (const k of keys) {
      expect(PLAN_LIMITS.PREMIUM[k]).toBeGreaterThan(PLAN_LIMITS.PRO[k]);
      expect(PLAN_LIMITS.PRO[k]).toBeGreaterThan(PLAN_LIMITS.FREE[k]);
    }
    expect(PLAN_LIMITS.PREMIUM.resume_export).toBe("all");
    expect(PLAN_LIMITS.FREE.resume_export).toBe("basic");
  });
});
