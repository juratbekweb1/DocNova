// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  mockGetServerSession,
  mockGetUserSubscription,
  mockCheckUserLimit,
  mockTrackAIUsage,
  mockDeductUserAiCredit,
  mockGenerateGeminiJson,
} = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
  mockGetUserSubscription: vi.fn(),
  mockCheckUserLimit: vi.fn(),
  mockTrackAIUsage: vi.fn(),
  mockDeductUserAiCredit: vi.fn(),
  mockGenerateGeminiJson: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: mockGetServerSession,
}));

vi.mock("@/lib/auth-options", () => ({
  authOptions: {},
}));

vi.mock("@/lib/limits", () => ({
  getUserSubscription: mockGetUserSubscription,
  checkUserLimit: mockCheckUserLimit,
  trackAIUsage: mockTrackAIUsage,
  deductUserAiCredit: mockDeductUserAiCredit,
}));

vi.mock("@/lib/gemini", () => ({
  generateGeminiJson: mockGenerateGeminiJson,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    verificationToken: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

import { POST as presentationPost } from "./route";
import { POST as exportDocxPost } from "../export-docx/route";

describe("Academic presentation rounding & anonymous docx export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue({ user: { id: "user-1", name: "Talaba" } });
    mockGetUserSubscription.mockResolvedValue({ plan: "FREE" });
    mockCheckUserLimit.mockResolvedValue({ allowed: true });
    mockTrackAIUsage.mockResolvedValue(undefined);
    mockDeductUserAiCredit.mockResolvedValue(undefined);
  });

  it("rounds fractional slidesCount (e.g. 2.5 from '2-3' range) to an integer count", async () => {
    mockGenerateGeminiJson.mockRejectedValueOnce(new Error("Gemini busy -> test fallback"));

    const req = new NextRequest("http://localhost:3000/api/academic/presentation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: "Raqamli iqtisodiyot",
        slidesCount: 2.5,
      }),
    });

    const res = await presentationPost(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.slidesCount).toBe(3);
    expect(json.slides).toHaveLength(3);
    expect(json.slides.map((s: { slideNumber: number }) => s.slideNumber)).toEqual([1, 2, 3]);
  });

  it("allows unauthenticated POST /api/academic/export-docx so /academic/image-topics downloads work without login", async () => {
    mockGetServerSession.mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost:3000/api/academic/export-docx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: "Kredit portfeli tahlili",
        markdownContent: "# 1. Kredit portfeli tahlili\n\nAsosiy tahliliy matn.",
        workType: "Mustaqil ish",
        language: "uz",
      }),
    });

    const res = await exportDocxPost(req);
    const bytes = new Uint8Array(await res.arrayBuffer());

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    expect(res.headers.get("Content-Disposition")).toContain(".docx");
    // OpenXML .docx files are ZIP archives starting with PK signature
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
  });
});
