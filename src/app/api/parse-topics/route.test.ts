// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const {
  mockGenerateContent,
  mockGetServerSession,
  mockGetUserSubscription,
  mockTrackAIUsage,
  mockMiddlewareAsync,
  mockDocumentCreate,
} = vi.hoisted(() => ({
  mockGenerateContent: vi.fn(),
  mockGetServerSession: vi.fn(),
  mockGetUserSubscription: vi.fn(),
  mockTrackAIUsage: vi.fn(),
  mockMiddlewareAsync: vi.fn(),
  mockDocumentCreate: vi.fn(),
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    constructor(public opts: { apiKey: string }) {}
    models = {
      generateContent: mockGenerateContent,
    };
  },
  Type: {
    OBJECT: "OBJECT",
    ARRAY: "ARRAY",
    STRING: "STRING",
  },
}));

vi.mock("next-auth", () => ({
  getServerSession: mockGetServerSession,
}));

vi.mock("@/lib/auth-options", () => ({
  authOptions: {},
}));

vi.mock("@/lib/limits", () => ({
  getUserSubscription: mockGetUserSubscription,
  trackAIUsage: mockTrackAIUsage,
}));

vi.mock("@/lib/security/rate-limiter", () => ({
  aiDemoRateLimiter: {
    middlewareAsync: mockMiddlewareAsync,
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    document: {
      create: mockDocumentCreate,
    },
  },
}));

import { POST as parseTopicsPost } from "./route";
import { POST as saveTopicsPost } from "../academic/topics/save/route";
import { POST as generateWorksPost } from "../academic/topics/generate-works/route";
import {
  estimateAveragePageCount,
  extractBase64Image,
  formatTopicsAsBlueprint,
  normalizePageCountInput,
  parseGeminiTopicsPayload,
} from "@/lib/academic/topic-parser";

const SAMPLE_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

describe("Academic Image Topic Parser Helpers", () => {
  it("normalizes Data URL and image/jpg MIME types accurately", () => {
    const result = extractBase64Image(`data:image/jpg;base64,${SAMPLE_PNG_BASE64}`);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.mimeType).toBe("image/jpeg");
      expect(result.data).toBe(SAMPLE_PNG_BASE64);
      expect(result.sizeBytes).toBeGreaterThan(0);
    }
  });

  it("rejects non-image MIME types", () => {
    const result = extractBase64Image(`data:application/pdf;base64,${SAMPLE_PNG_BASE64}`);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
    }
  });

  it("sniffs image MIME for application/octet-stream Android content:// gallery photos", () => {
    const result = extractBase64Image(`data:application/octet-stream;base64,${SAMPLE_PNG_BASE64}`);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.mimeType).toBe("image/png");
    }
  });

  it("parses Gemini JSON even if wrapped in markdown code fences", () => {
    const parsed = parseGeminiTopicsPayload(
      '```json\n{"topics":[{"title":"1. Kirish","content":"Asosiy matn"}]}\n```'
    );
    expect(parsed.topics).toEqual([{ title: "1. Kirish", content: "Asosiy matn" }]);
  });

  it("formats topics into an academic blueprint string", () => {
    const blueprint = formatTopicsAsBlueprint([
      { title: "Mavzu A", content: "Izoh A" },
      { title: "Mavzu B", content: "" },
    ]);
    expect(blueprint).toBe("1. Mavzu A\nIzoh A\n\n2. Mavzu B");
  });
});

describe("POST /api/parse-topics", () => {
  const originalGeminiKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-gemini-api-key";
    mockGenerateContent.mockReset();
    mockGetServerSession.mockReset().mockResolvedValue(null);
    mockGetUserSubscription.mockReset().mockResolvedValue({ plan: "FREE" });
    mockTrackAIUsage.mockReset().mockResolvedValue("usage-id-1");
    mockMiddlewareAsync.mockReset().mockResolvedValue(null);
  });

  afterEach(() => {
    if (originalGeminiKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalGeminiKey;
    }
  });

  it("calls Gemini 2.5 Flash via @google/genai and returns extracted topics JSON", async () => {
    const tenTopics = Array.from({ length: 10 }, (_, idx) => ({
      title: `${idx + 1}-mavzu: Sun'iy intellekt bo'limi ${idx + 1}`,
      content: `${idx + 1}-mavzu bo'yicha to'liq matn va reja bandlari.`,
    }));

    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({ topics: tenTopics }),
      usageMetadata: {
        promptTokenCount: 256,
        candidatesTokenCount: 512,
      },
    });

    const req = new NextRequest("http://localhost:3000/api/parse-topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: `data:image/png;base64,${SAMPLE_PNG_BASE64}`,
        mimeType: "image/png",
        fileName: "syllabus.png",
      }),
    });

    const res = await parseTopicsPost(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.topics).toHaveLength(10);
    expect(json.topics[0]).toEqual(tenTopics[0]);

    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    const callArg = mockGenerateContent.mock.calls[0][0];
    expect(callArg.model).toBe("gemini-2.5-flash");
    expect(callArg.contents[0]).toEqual({
      inlineData: {
        mimeType: "image/png",
        data: SAMPLE_PNG_BASE64,
      },
    });
    expect(callArg.config.responseMimeType).toBe("application/json");
    expect(mockTrackAIUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gemini-2.5-flash",
        status: "SUCCESS",
        inputTokens: 256,
        outputTokens: 512,
      })
    );
  });

  it("returns 400 when image base64 payload is invalid", async () => {
    const req = new NextRequest("http://localhost:3000/api/parse-topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: "data:text/plain;base64,SGVsbG8=",
      }),
    });

    const res = await parseTopicsPost(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBeTruthy();
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it("enforces rate limit for unauthenticated visitors", async () => {
    mockMiddlewareAsync.mockResolvedValue(
      NextResponse.json({ error: "Too many requests" }, { status: 429 })
    );

    const req = new NextRequest("http://localhost:3000/api/parse-topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: `data:image/png;base64,${SAMPLE_PNG_BASE64}`,
      }),
    });

    const res = await parseTopicsPost(req);
    expect(res.status).toBe(429);
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it("returns 503 when GEMINI_API_KEY is missing", async () => {
    delete process.env.GEMINI_API_KEY;

    const req = new NextRequest("http://localhost:3000/api/parse-topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: `data:image/png;base64,${SAMPLE_PNG_BASE64}`,
      }),
    });

    const res = await parseTopicsPost(req);
    expect(res.status).toBe(503);
  });

  it("returns 504 and records TIMEOUT usage if Gemini hangs during /api/parse-topics", async () => {
    vi.useFakeTimers();
    try {
      mockGenerateContent.mockImplementation(() => new Promise(() => {}));

      const req = new NextRequest("http://localhost:3000/api/parse-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: `data:image/png;base64,${SAMPLE_PNG_BASE64}`,
        }),
      });

      const resPromise = parseTopicsPost(req);
      await vi.advanceTimersByTimeAsync(40_500);
      const res = await resPromise;
      const json = await res.json();

      expect(res.status).toBe(504);
      expect(json.error).toContain("vaqti tugadi");
      expect(mockTrackAIUsage).toHaveBeenCalledWith(
        expect.objectContaining({ status: "FAILED", errorCode: "PARSE_TOPICS_TIMEOUT" })
      );
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("POST /api/academic/topics/save", () => {
  beforeEach(() => {
    mockGetServerSession.mockReset();
    mockDocumentCreate.mockReset();
  });

  it("persists pagesPerTopic metadata and per-topic pageCount in /api/academic/topics/save when provided", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-student-456" },
    });
    mockDocumentCreate.mockResolvedValue({
      id: "doc-pages-1",
      title: "Iqtisodiyot mavzulari",
      slug: "iqtisodiyot-mavzulari-1",
      _count: { sections: 2 },
    });

    const req = new NextRequest("http://localhost:3000/api/academic/topics/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentTitle: "Iqtisodiyot mavzulari",
        pagesPerTopic: "10",
        workType: "coursework",
        topics: [
          { title: "1. Talab va taklif", content: "Bozor muvozanati", pageCount: "12" },
          { title: "2. Elastiklik", content: "Narx elastikligi" },
        ],
      }),
    });

    const res = await saveTopicsPost(req);
    expect(res.status).toBe(201);

    const createPayload = mockDocumentCreate.mock.calls[0][0].data;
    expect(createPayload.sections.create).toEqual([
      {
        type: "CONTENT",
        title: "1. Talab va taklif",
        content: { text: "Bozor muvozanati", pageCount: "12" },
        sortOrder: 0,
        isVisible: true,
      },
      {
        type: "CONTENT",
        title: "2. Elastiklik",
        content: { text: "Narx elastikligi" },
        sortOrder: 1,
        isVisible: true,
      },
    ]);
    expect(createPayload.metadata.create.value.pagesPerTopic).toBe("10");
  });

  it("returns 401 with requireLogin when unauthenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/academic/topics/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topics: [{ title: "1-mavzu", content: "Matn" }],
      }),
    });

    const res = await saveTopicsPost(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.requireLogin).toBe(true);
    expect(mockDocumentCreate).not.toHaveBeenCalled();
  });

  it("persists edited topics as Document + ordered DocumentSection pages in Prisma", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-student-123" },
    });
    mockDocumentCreate.mockResolvedValue({
      id: "doc-abc-123",
      title: "Falsafa konspekti",
      slug: "falsafa-konspekti-xyz",
      _count: { sections: 2 },
    });

    const req = new NextRequest("http://localhost:3000/api/academic/topics/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentTitle: "Falsafa konspekti",
        sourceFileName: "daftar.jpg",
        workType: "referat",
        topics: [
          { title: "1. Antik falsafa", content: "Suqrot va Aflotun qarashlari" },
          { title: "2. Sharq Uyg'onish davri", content: "Forobiy va Ibn Sino" },
        ],
      }),
    });

    const res = await saveTopicsPost(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json).toEqual({
      success: true,
      documentId: "doc-abc-123",
      title: "Falsafa konspekti",
      slug: "falsafa-konspekti-xyz",
      sectionCount: 2,
      editorUrl: "/dashboard/editor/doc-abc-123",
    });

    expect(mockDocumentCreate).toHaveBeenCalledTimes(1);
    const createPayload = mockDocumentCreate.mock.calls[0][0].data;
    expect(createPayload.userId).toBe("user-student-123");
    expect(createPayload.title).toBe("Falsafa konspekti");
    expect(createPayload.sections.create).toEqual([
      {
        type: "CONTENT",
        title: "1. Antik falsafa",
        content: { text: "Suqrot va Aflotun qarashlari" },
        sortOrder: 0,
        isVisible: true,
      },
      {
        type: "CONTENT",
        title: "2. Sharq Uyg'onish davri",
        content: { text: "Forobiy va Ibn Sino" },
        sortOrder: 1,
        isVisible: true,
      },
    ]);
  });
});

describe("POST /api/academic/topics/generate-works", () => {
  const originalGeminiKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-gemini-api-key";
    mockGenerateContent.mockReset();
    mockGetServerSession.mockReset().mockResolvedValue(null);
    mockGetUserSubscription.mockReset().mockResolvedValue({ plan: "FREE" });
    mockTrackAIUsage.mockReset().mockResolvedValue("usage-id-works");
    mockMiddlewareAsync.mockReset().mockResolvedValue(null);
  });

  afterEach(() => {
    if (originalGeminiKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalGeminiKey;
    }
  });

  it("generates a 2-3 page Mustaqil ish for each topic using gemini-2.5-flash", async () => {
    mockGenerateContent
      .mockResolvedValueOnce({
        text: "## Reja\n1. Kirish\n\n### Kirish\nBirinchi mavzu bo'yicha to'liq 2-3 bet mustaqil ish.",
        usageMetadata: { promptTokenCount: 150, candidatesTokenCount: 900 },
      })
      .mockResolvedValueOnce({
        text: "## Reja\n1. Asosiy qism\n\n### Kirish\nIkkinchi mavzu bo'yicha to'liq 2-3 bet mustaqil ish.",
        usageMetadata: { promptTokenCount: 160, candidatesTokenCount: 950 },
      });

    const req = new NextRequest("http://localhost:3000/api/academic/topics/generate-works", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: "Iqtisodiyot",
        workType: "Mustaqil ish",
        pagesPerTopic: "2-3",
        topics: [
          { title: "1. Raqamli iqtisodiyot asoslari", content: "Raqamlashtirish" },
          { title: "2. Elektron tijorat rivoji", content: "Bozor tahlili" },
        ],
      }),
    });

    const res = await generateWorksPost(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.pagesPerTopic).toBe("2-3");
    expect(json.totalTopics).toBe(2);
    expect(json.works).toEqual([
      {
        title: "1. Raqamli iqtisodiyot asoslari",
        content: expect.stringContaining("Birinchi mavzu bo'yicha to'liq 2-3 bet mustaqil ish"),
      },
      {
        title: "2. Elektron tijorat rivoji",
        content: expect.stringContaining("Ikkinchi mavzu bo'yicha to'liq 2-3 bet mustaqil ish"),
      },
    ]);
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    expect(mockGenerateContent.mock.calls[0][0].model).toBe("gemini-2.5-flash");
    expect(mockTrackAIUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        feature: "ACADEMIC_GENERATION",
        model: "gemini-2.5-flash",
        status: "SUCCESS",
        inputTokens: 310,
        outputTokens: 1850,
      })
    );
  });

  it("falls back per-topic when Gemini fails on one topic without losing the batch", async () => {
    mockGenerateContent
      .mockResolvedValueOnce({
        text: "Birinchi mavzu muvaffaqiyatli yozildi.",
        usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 400 },
      })
      .mockRejectedValueOnce(new Error("Transient rate limit"));

    const req = new NextRequest("http://localhost:3000/api/academic/topics/generate-works", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: "Tarix",
        topics: [
          { title: "1. Amir Temur davri", content: "" },
          { title: "2. Temuriylar renessansi", content: "" },
        ],
      }),
    });

    const res = await generateWorksPost(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.works).toHaveLength(2);
    expect(json.works[0].content).toBe("Birinchi mavzu muvaffaqiyatli yozildi.");
    expect(json.works[1].content).toContain("## Reja");
    expect(json.works[1].content).toContain("2. Temuriylar renessansi");
  });

  it("returns 400 when topics array is empty", async () => {
    const req = new NextRequest("http://localhost:3000/api/academic/topics/generate-works", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topics: [] }),
    });

    const res = await generateWorksPost(req);
    expect(res.status).toBe(400);
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it("returns 503 when GEMINI_API_KEY is missing", async () => {
    delete process.env.GEMINI_API_KEY;

    const req = new NextRequest("http://localhost:3000/api/academic/topics/generate-works", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topics: [{ title: "1. Kirish", content: "" }],
      }),
    });

    const res = await generateWorksPost(req);
    expect(res.status).toBe(503);
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it("normalizes and estimates page counts across presets, ranges, suffixes, and invalid edge values", () => {
    expect(normalizePageCountInput("2-3")).toBe("2-3");
    expect(normalizePageCountInput(" 10 bet ")).toBe("10");
    expect(normalizePageCountInput("10-5")).toBe("5-10");
    expect(normalizePageCountInput("7–7")).toBe("7");
    expect(normalizePageCountInput("0")).toBeUndefined();
    expect(normalizePageCountInput("101")).toBeUndefined();
    expect(normalizePageCountInput("no-pages")).toBeUndefined();

    expect(estimateAveragePageCount("2-3")).toBe(2.5);
    expect(estimateAveragePageCount("10")).toBe(10);
  });

  it("supports per-topic pageCount overrides and custom pagesPerTopic in generate-works prompts", async () => {
    mockGenerateContent
      .mockResolvedValueOnce({
        text: "5 betlik ish tayyor",
        usageMetadata: { promptTokenCount: 120, candidatesTokenCount: 600 },
      })
      .mockResolvedValueOnce({
        text: "12 betlik ish tayyor",
        usageMetadata: { promptTokenCount: 140, candidatesTokenCount: 1400 },
      });

    const req = new NextRequest("http://localhost:3000/api/academic/topics/generate-works", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: "Iqtisodiyot",
        workType: "Mustaqil ish",
        pagesPerTopic: "8",
        topics: [
          { title: "1. Yashil iqtisodiyot", content: "", pageCount: "5" },
          { title: "2. Monopoliya tahlili", content: "", pageCount: "12" },
        ],
      }),
    });

    const res = await generateWorksPost(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.pagesPerTopic).toBe("8");
    expect(json.pageCounts).toEqual(["5", "12"]);
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    expect(mockGenerateContent.mock.calls[0][0].contents).toContain("5 A4 betlik");
    expect(mockGenerateContent.mock.calls[1][0].contents).toContain("12 A4 betlik");
    expect(mockGenerateContent.mock.calls[1][0].config.maxOutputTokens).toBeGreaterThan(2500);
  });

  it("returns 400 when pagesPerTopic is outside valid 1-100 page range", async () => {
    const req = new NextRequest("http://localhost:3000/api/academic/topics/generate-works", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pagesPerTopic: "0",
        topics: [{ title: "1. Kirish", content: "" }],
      }),
    });

    const res = await generateWorksPost(req);
    expect(res.status).toBe(400);
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it("scales maxOutputTokens up to 16384 for 15-page topics in generate-works", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: "15 betlik kengaytirilgan kurs ishi",
      usageMetadata: { promptTokenCount: 200, candidatesTokenCount: 9500 },
    });

    const req = new NextRequest("http://localhost:3000/api/academic/topics/generate-works", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: "Iqtisodiyot",
        workType: "Kurs ishi",
        pagesPerTopic: "15",
        topics: [{ title: "1. Investitsiya siyosati", content: "Tahlil" }],
      }),
    });

    const res = await generateWorksPost(req);
    expect(res.status).toBe(200);
    expect(mockGenerateContent.mock.calls[0][0].config.maxOutputTokens).toBe(12750);
  });
});
