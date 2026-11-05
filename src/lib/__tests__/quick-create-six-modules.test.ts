// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST as detectorPost } from "@/app/api/ai/detector/route";
import CourseworkToSlideRedirect from "@/app/academic/coursework-to-slide/page";
import EssayBuilderRedirect from "@/app/essay-builder/page";

// Mock next-auth and auth-options
vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue(null),
}));
vi.mock("@/lib/auth-options", () => ({
  authOptions: {},
}));
vi.mock("@/lib/gemini", () => ({
  generateGeminiContent: vi.fn().mockResolvedValue({
    text: JSON.stringify({
      aiScore: 12,
      humanScore: 88,
      originalityScore: 92,
      plagiarismScore: 8,
      verdict: "Likely Human",
      verdictUz: "Inson tomonidan yozilgan",
      summaryUz: "Matn to'liq insoniy uslubda yozilgan.",
      suggestionsUz: ["Yaxshi darajada saqlang"],
      sentenceAnalysis: [
        { text: "O'zbekiston Respublikasida raqamli texnologiyalar rivojlanmoqda.", type: "human", confidence: 95 }
      ]
    })
  }),
}));

// Mock next/navigation redirect
const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/test",
}));

describe("Quick Create 6 Modules Verification", () => {
  describe("1. AI Plagiarism & Detector Endpoint (/api/ai/detector)", () => {
    it("rejects text that is too short (< 20 chars) with 400", async () => {
      const req = new NextRequest("http://localhost:3000/api/ai/detector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Short text" }),
      });

      const res = await detectorPost(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBeDefined();
    });

    it("successfully analyzes text and returns structured plagiarism and AI scores", async () => {
      const sampleText =
        "O'zbekiston Respublikasida raqamli texnologiyalarni rivojlantirish va ta'lim tizimiga sun'iy intellekt modellarini tatbiq etish ustuvor yo'nalish hisoblanadi. Ushbu tadqiqotda bank tizimining transformatsiya jarayonlari chuqur o'rganilgan.";

      const req = new NextRequest("http://localhost:3000/api/ai/detector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sampleText }),
      });

      const res = await detectorPost(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data).toBeDefined();
      expect(typeof json.data.aiScore).toBe("number");
      expect(typeof json.data.originalityScore).toBe("number");
      expect(typeof json.data.plagiarismScore).toBe("number");
      expect(Array.isArray(json.data.sentenceAnalysis)).toBe(true);
      expect(json.data.stats.wordCount).toBeGreaterThan(10);
    });
  });

  describe("2. Redirect Compatibility Routes", () => {
    it("redirects /academic/coursework-to-slide to /academic/presentation?module=coursework", () => {
      mockRedirect.mockClear();
      try {
        CourseworkToSlideRedirect();
      } catch {
        // Next.js redirect might throw NEXT_REDIRECT error in real runtime
      }
      expect(mockRedirect).toHaveBeenCalledWith("/academic/presentation?module=coursework");
    });

    it("redirects /essay-builder to /academic/essay-builder", () => {
      mockRedirect.mockClear();
      try {
        EssayBuilderRedirect();
      } catch {
        // Next.js redirect might throw NEXT_REDIRECT error in real runtime
      }
      expect(mockRedirect).toHaveBeenCalledWith("/academic/essay-builder");
    });
  });
});
