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

  it("recovers valid JSON even when Gemini adds conversational text before/after the object", () => {
    const parsed = parseGeminiTopicsPayload(
      'Mana rasmdan olingan natija:\n{"subject":"Tarix","topics":[{"title":"1. Xorazmshohlar","content":""}]}\nOmad!'
    );
    expect(parsed.subject).toBe("Tarix");
    expect(parsed.topics).toEqual([{ title: "1. Xorazmshohlar", content: "" }]);
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
    expect(callArg.model).toBe("gemini-3.1-flash-lite-preview");
    expect(callArg.contents[0]).toEqual({
      inlineData: {
        mimeType: "image/png",
        data: SAMPLE_PNG_BASE64,
      },
    });
    expect(callArg.config.responseMimeType).toBe("application/json");
    expect(mockTrackAIUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gemini-3.1-flash-lite-preview",
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

  it("extracts subject & language, filters table metadata headers, and preserves empty content without hallucinating outlines", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        subject: "Algoritmlar va ma'lumotlar tuzilmasi",
        language: "uz",
        topics: [
          { title: "T/r | Mavzu nomi | Soat | Imzo", content: "" },
          { title: "№ | Fan | Guruh", content: "Ball" },
          { title: "1. Binar qidiruv va rekursiv daraxtlar", content: "" },
          {
            title: "2. Dijkstra algoritmi va eng qisqa yo'l",
            content: "Grafiklar, qo'shnilik ro'yxati va O(E log V) bahosi",
          },
        ],
      }),
    });

    const req = new NextRequest("http://localhost:3000/api/parse-topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: `data:image/jpeg;base64,${SAMPLE_PNG_BASE64}`,
        mimeType: "image/jpeg",
      }),
    });

    const res = await parseTopicsPost(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.subject).toBe("Algoritmlar va ma'lumotlar tuzilmasi");
    expect(json.language).toBe("uz");
    expect(json.topics).toEqual([
      { title: "1. Binar qidiruv va rekursiv daraxtlar", content: "" },
      {
        title: "2. Dijkstra algoritmi va eng qisqa yo'l",
        content: "Grafiklar, qo'shnilik ro'yxati va O(E log V) bahosi",
      },
    ]);
  });

  it("fails over to gemini-2.5-flash-lite if primary vision model throws a transient error", async () => {
    mockGenerateContent
      .mockRejectedValueOnce(new Error("503 Service Unavailable"))
      .mockResolvedValueOnce({
        text: JSON.stringify({
          subject: "Fizika",
          language: "uz",
          topics: [{ title: "1. Termodinamikaning birinchi qonuni", content: "Q = dU + A" }],
        }),
      });

    const req = new NextRequest("http://localhost:3000/api/parse-topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: `data:image/png;base64,${SAMPLE_PNG_BASE64}`,
        mimeType: "image/png",
      }),
    });

    const res = await parseTopicsPost(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    expect(mockGenerateContent.mock.calls[0][0].model).toBe("gemini-3.1-flash-lite-preview");
    expect(mockGenerateContent.mock.calls[1][0].model).toBe("gemini-3.1-flash-lite");
    expect(json.topics).toEqual([
      { title: "1. Termodinamikaning birinchi qonuni", content: "Q = dU + A" },
    ]);
  });

  it("fails over automatically to fast secondary model if Attempt 1 hangs past perAttemptMs", async () => {
    vi.useFakeTimers();
    try {
      mockGenerateContent
        .mockImplementationOnce(() => new Promise(() => {}))
        .mockResolvedValueOnce({
          text: JSON.stringify({
            subject: "Biologiya",
            language: "uz",
            topics: [{ title: "1. DNK replikatsiyasi", content: "" }],
          }),
        });

      const req = new NextRequest("http://localhost:3000/api/parse-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: `data:image/png;base64,${SAMPLE_PNG_BASE64}`,
          mimeType: "image/png",
        }),
      });

      const resPromise = parseTopicsPost(req);
      await vi.advanceTimersByTimeAsync(16_500);
      const res = await resPromise;
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
      expect(mockGenerateContent.mock.calls[0][0].model).toBe("gemini-3.1-flash-lite-preview");
      expect(mockGenerateContent.mock.calls[1][0].model).toBe("gemini-3.1-flash-lite");
      expect(json.topics).toEqual([{ title: "1. DNK replikatsiyasi", content: "" }]);
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
    const topic1RealisticText = `## Reja
1. Raqamli iqtisodiyot asoslari va raqamlashtirish mohiyati
2. O'zbekistonda raqamli infratuzilma rivojlanishi

### Kirish
Birinchi mavzu bo'yicha to'liq 2-3 bet mustaqil ish raqamli iqtisodiyot asoslari hamda milliy xo'jalikni raqamlashtirish jarayonlarining nazariy va amaliy qonuniyatlarini chuqur tahlil qiladi. Hozirgi globallashuv bosqichida raqamli iqtisodiyot tarmoq samaradorligini keskin oshirmoqda.

### 1. Raqamli iqtisodiyotning nazariy jihatlari
Raqamli iqtisodiyot asoslari ishlab chiqarish jarayonlarini avtomatlashtirish, katta ma'lumotlar bazalarini boshqarish va raqamlashtirish strategiyalarini amaliyotga tatbiq etish orqali iqtisodiy o'sishning barqaror sur'atlarini ta'minlaydi hamda tadbirkorlik muhitini tubdan yangilaydi.

### Xulosa
Tadqiqot natijalari raqamli iqtisodiyot asoslari va raqamlashtirish islohotlari mamlakat raqobatbardoshligini oshirishda hal qiluvchi omil ekanligini ko'rsatadi.`;

    const topic2RealisticText = `## Reja
1. Elektron tijorat rivoji va bozor tahlili
2. Onlayn savdo platformalarining iqtisodiy samaradorligi

### Kirish
Ikkinchi mavzu bo'yicha to'liq 2-3 bet mustaqil ish elektron tijorat rivoji va zamonaviy raqamli bozor tahlili masalalarini ilmiy asosda ochib beradi. Onlayn savdo kanallari kichik va o'rta biznes subyektlari uchun yangi eksport imkoniyatlarini yaratmoqda.

### 1. Elektron tijorat mexanizmlari
Elektron tijorat rivoji to'lov tizimlari, logistika infratuzilmasi va bozor tahlili bilan uzviy bog'liq holda rivojlanib, iste'molchilar bilan o'zaro munosabatlarni soddalashtiradi hamda operatsion xarajatlarni sezilarli darajada kamaytirish imkonini beradi.

### Xulosa
Bozor tahlili shuni ko'rsatadiki, elektron tijorat rivoji milliy iqtisodiyotning raqamli transformatsiyasini jadallashtiradi.`;

    mockGenerateContent
      .mockResolvedValueOnce({
        text: topic1RealisticText,
        usageMetadata: { promptTokenCount: 150, candidatesTokenCount: 900 },
      })
      .mockResolvedValueOnce({
        text: topic2RealisticText,
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
    expect(json.usedFallbackCount).toBe(0);
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
    expect(mockGenerateContent.mock.calls[0][0].model).toBe("gemini-3.1-flash-lite");
    expect(mockTrackAIUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        feature: "ACADEMIC_GENERATION",
        model: "gemini-3.1-flash-lite",
        status: "SUCCESS",
        inputTokens: 310,
        outputTokens: 1850,
      })
    );
  });

  it("falls back per-topic when Gemini fails on one topic without losing the batch", async () => {
    const amirTemurText = `## Reja
1. Amir Temur davri davlatchilik siyosati
2. Harbiy islohotlar va boshqaruv tizimi

### Kirish
Birinchi mavzu muvaffaqiyatli yozildi va unda Amir Temur davri markazlashgan davlat boshqaruvi, Temur tuzuklari hamda ijtimoiy-siyosiy islohotlar tahlil qilinadi. Amir Temur davri Markaziy Osiyo tarixida qudratli saltanatning shakllanish bosqichi sifatida muhim ilmiy ahamiyatga ega.

### 1. Davlatchilik tamoyillari
Amir Temur davri siyosiy institutlari adolat, qonun ustuvorligi, soliq tizimini tartibga solish va ilm-fan homiyligiga tayangan holda barqaror rivojlanishni ta'minlagan hamda xalqaro diplomatiyani yuksak bosqichga olib chiqqan.

### Xulosa
Amir Temur davri merosi bugungi milliy davlatchilik taraqqiyotida muhim tarixiy manba bo'lib xizmat qiladi.`;

    mockGenerateContent
      .mockResolvedValueOnce({
        text: amirTemurText,
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
    expect(json.usedFallbackCount).toBe(1);
    expect(json.fallbackIndices).toEqual([1]);
    expect(json.works[0].content).toBe(amirTemurText);
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
    const yashilText = `## Reja
1. Yashil iqtisodiyot tamoyillari va qayta tiklanuvchi energiya
2. Ekologik barqaror rivojlanish mexanizmlari

### Kirish
5 betlik ish tayyor va unda yashil iqtisodiyot konsepti, karbon izini qisqartirish strategiyalari hamda ekologik innovatsiyalarning iqtisodiyotdagi o'rni batafsil yoritiladi. Yashil iqtisodiyot zamonaviy sanoat tarmoqlarida resurslardan oqilona foydalanish, energiya tejamkorligini oshirish va atrof-muhit muhofazasini uyg'unlashtirishga xizmat qiladi. Tadqiqot davomida qayta tiklanuvchi energiya manbalarini kengaytirish va chiqindisiz ishlab chiqarish zanjirlarini shakllantirish masalalari ilmiy asosda o'rganiladi.

### 1. Yashil o'sish modeli va resurs samaradorligi
Yashil iqtisodiyot sharoitida quyosh hamda shamol energetikasi loyihalariga investitsiyalar jalb etish barqaror ish o'rinlari yaratish bilan birga milliy iqtisodiyotning energiya samaradorligini oshiradi. Ishlab chiqarish jarayonlarida suv va xomashyo sarfini kamaytirish, aylanma iqtisodiyot tamoyillarini tatbiq etish hamda ekologik standartlarga rioya qilish korxonalarning raqobatbardoshligini mustahkamlaydi.

### 2. Amaliy natijalar va davlat siyosati
Davlat tomonidan yashil sertifikatlar, yashil obligatsiyalar va ekologik imtiyozlarni joriy etish korxonalarning toza texnologiyalarga o'tish sur'atini tezlashtiradi. Shuningdek, issiqxona gazlari emissiyasini monitoring qilish va ekologik soliq mexanizmlarini takomillashtirish sanoat tarmoqlarida mas'uliyatli ishlab chiqarish madaniyatini rivojlantiradi.

### Xulosa
Yashil iqtisodiyot kelajak avlodlar uchun barqaror ekologik muhit, energiya xavfsizligi va yuqori qo'shilgan qiymatli ishlab chiqarishni ta'minlaydi.`;

    const monopoliyaText = `## Reja
1. Monopoliya tahlili va bozor raqobati cheklovlari
2. Antimonopol tartibga solish mexanizmlari

### Kirish
12 betlik ish tayyor bo'lib, unda monopoliya tahlili, tabiiy monopoliyalar faoliyati, bozor konsentratsiyasi indekslari hamda raqobat siyosatining asosiy vositalari keng qamrovli ko'rib chiqiladi. Monopoliya tahlili narx belgilash jarayonlari, resurslar taqsimotidagi nomutanosibliklar va iste'molchilar farovonligiga ta'sirni aniqlashda muhim rol o'ynaydi. Zamonaviy mikroiqtisodiyotda bozor hokimiyatini o'lchash uchun Lerner indeksi va Gerfindal-Xirshman ko'rsatkichlaridan keng foydalaniladi.

### 1. Bozor tuzilmalari va monopoliya mexanizmi
Monopoliya sharoitida yagona sotuvchi bozor taklifini nazorat qiladi hamda chegaraviy xarajatdan yuqori narx o'rnatish orqali resurslar taqsimoti samaradorligini pasaytiradi. Monopolist korxona ishlab chiqarish hajmini sun'iy ravishda cheklab, bozorda muvozanat narxini oshiradi va jamiyatda sof ijtimoiy yo'qotishlar yuzaga kelishiga sabab bo'ladi.

### 2. Davlat antimonopol tartibga solish amaliyoti
Monopoliya tahlili asosida antimonopol qo'mitalar dominant kompaniyalarning narx manipulyatsiyasini cheklash, kartel kelishuvlarining oldini olish hamda yangi ishtirokchilar uchun bozorga kirish to'siqlarini kamaytirish choralarini ko'radi. Tabiiy monopoliyalar uchun esa tariflarni chegaraviy yoki o'rtacha xarajatlar asosida tartibga solish mexanizmlari qo'llaniladi. Raqamli platformalar bozorida monopolistik ustunlikni suiiste'mol qilish holatlariga qarshi zamonaviy raqobat siyosati vositalari, jumladan majburiy interoperabellik va ma'lumotlar ochiqligi talablari joriy etilmoqda.

### 3. Monopoliya va raqobat muhitini muvozanatlash istiqbollari
Xalqaro tajriba shuni ko'rsatadiki, bozor konsentratsiyasini muntazam monitoring qilish, kichik va o'rta biznes subyektlari uchun teng raqobat sharoitini ta'minlash hamda innovatsion faoliyatni rag'batlantirish orqali monopolistik samarasizliklarni kamaytirish mumkin. Davlat organlari va mustaqil regulyatorlar o'rtasidagi hamkorlik bozor shaffofligini oshirib, iste'molchilarning tanlov erkinligini kengaytiradi.

### Xulosa
Samarali monopoliya tahlili bozor raqobatini himoya qilish, iste'molchilar manfaatlarini ta'minlash va uzoq muddatli iqtisodiy muvozanatni saqlash uchun asos bo'lib xizmat qiladi.`;

    mockGenerateContent
      .mockResolvedValueOnce({
        text: yashilText,
        usageMetadata: { promptTokenCount: 120, candidatesTokenCount: 600 },
      })
      .mockResolvedValueOnce({
        text: monopoliyaText,
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
    const investText = `## Reja
1. Investitsiya siyosati va tahlil metodologiyasi
2. O'zbekistonda investitsiya muhitini yaxshilash yo'llari

### Kirish
15 betlik kengaytirilgan kurs ishi investitsiya siyosati hamda uning makroiqtisodiy barqarorlikka ta'sirini chuqur tahlil qiladi. Zamonaviy sharoitda investitsiya siyosati to'g'ridan-to'g'ri xorijiy kapitalni jalb etish, ishlab chiqarish quvvatlarini modernizatsiya qilish va hududiy infratuzilmani yangilashning asosiy drayveri hisoblanadi.

### 1. Investitsiya loyihalarini baholash mezonlari
Kapital qo'yilmalar samaradorligini aniqlashda sof joriy qiymat (NPV), ichki daromadlilik normasi (IRR) va o'zini oqlash muddati kabi tahlil ko'rsatkichlari qo'llaniladi. Ushbu ilmiy tahlil investorlar uchun risklarni minimallashtirish hamda loyiha rentabelligini oldindan baholash imkonini taqdim etadi.

### 2. Davlat investitsiya siyosati mexanizmlari
Soliq va bojxona imtiyozlari, erkin iqtisodiy zonalar faoliyati hamda davlat-xususiy sheriklik loyihalari milliy investitsiya siyosati jozibadorligini oshirib, yuqori texnologiyali tarmoqlarda yangi quvvatlarni ishga tushirishga xizmat qilmoqda.

### Xulosa
Olib borilgan chuqur tahlil shuni tasdiqlaydiki, izchil investitsiya siyosati sanoat diversifikatsiyasi va uzoq muddatli iqtisodiy o'sishni kafolatlaydi.`;

    mockGenerateContent.mockResolvedValueOnce({
      text: investText,
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

  it("self-corrects when Attempt 1 drifts to an unrelated domain and succeeds cleanly on Attempt 2", async () => {
    const offTopicAttempt = `## Reja
1. Qishloq xo'jaligida sug'orish tizimlari
2. Paxtachilik agrotexnikasi

### Kirish
Qishloq xo'jaligida tomchilatib sug'orish texnologiyalari tuproq namligini saqlash va g'alla hosildorligini oshirishga xizmat qiladi. Melioratsiya tadbirlari ekin maydonlari unumdorligini yaxshilaydi va suv isrofgarchiligini kamaytiradi.

### Asosiy qism
Drenaj tarmoqlarini yangilash hamda mineral o'g'itlardan oqilona foydalanish fermer xo'jaliklarida barqaror hosil yetishtirish imkonini yaratadi.

### Xulosa
Agrotexnik islohotlar oziq-ovqat xavfsizligini mustahkamlashda asosiy o'rin tutadi.`;

    const correctedQuantumAttempt = `## Reja
1. Kvant mexanikasi postulatlari va to'lqin funksiyasi
2. Shredinger tenglamasi va tunnel effekti

### Kirish
Ushbu mustaqil ish kvant mexanikasi asoslari, to'lqin-zarra dualizmi hamda Shredinger tenglamasining fizik mohiyatini yoritadi. Kvant mexanikasi mikrozarralar harakatini to'lqin funksiyasi orqali aniqlaydi va tunnel effekti kabi klassik fizikada uchramaydigan hodisalarni izohlab beradi.

### Asosiy qism
Statsionar Shredinger tenglamasi Gamilton operatori yordamida zarraning energetik spektrini topishga imkon beradi. To'lqin funksiyasi modulining kvadrati ehtimollik zichligini ifodalaydi, tunnel effekti esa yarimo'tkazgich diodlari va skanerlovchi tunnel mikroskopida bevosita qo'llaniladi.

### Xulosa
Xulosa qilib aytganda, Shredinger tenglamasi, to'lqin funksiyasi va tunnel effekti zamonaviy kvant texnologiyalarining nazariy poydevoridir.`;

    mockGenerateContent
      .mockResolvedValueOnce({
        text: offTopicAttempt,
        usageMetadata: { promptTokenCount: 150, candidatesTokenCount: 300 },
      })
      .mockResolvedValueOnce({
        text: correctedQuantumAttempt,
        usageMetadata: { promptTokenCount: 220, candidatesTokenCount: 450 },
      });

    const req = new NextRequest("http://localhost:3000/api/academic/topics/generate-works", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: "Nazariy fizika",
        workType: "Mustaqil ish",
        pagesPerTopic: "2-3",
        topics: [
          {
            title: "1. Kvant mexanikasi va Shredinger tenglamasi",
            content: "To'lqin funksiyasi va tunnel effekti misolida",
          },
        ],
      }),
    });

    const res = await generateWorksPost(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    expect(mockGenerateContent.mock.calls[1][0].config.temperature).toBe(0.12);
    expect(mockGenerateContent.mock.calls[1][0].contents).toMatch(/Kvant|Shredinger/i);
    expect(json.usedFallbackCount).toBe(0);
    expect(json.fallbackIndices).toEqual([]);
    expect(json.works[0].content).toContain("Shredinger tenglamasi");
    expect(json.works[0].content).not.toContain("tomchilatib sug'orish");
  });

  it("self-corrects when Russian topic receives Uzbek response on Attempt 1", async () => {
    const wrongLangUzbekText = `## Reja
1. O'yinlar nazariyasi tushunchasi
2. Nesh muvozanati va strategik qarorlar

### Kirish
O'yinlar nazariyasi iqtisodiy agentlarning strategik o'zaro ta'sirini o'rganadigan matematik yo'nalishdir. Nesh muvozanati sharoitida biror ishtirokchi o'z strategiyasini bir tomonlama o'zgartirishdan manfaatdor bo'lmaydi. Bu holat raqobat bozorlari va auktsionlarni modellashtirishda qo'llaniladi.

### Asosiy qism
Dominant strategiyalar va kooperativ bo'lmagan o'yinlar tahlili bozor ishtirokchilari xulq-atvorini bashorat qilish imkonini beradi.

### Xulosa
O'yinlar nazariyasi iqtisodiy qarorlar qabul qilish samaradorligini oshiradi.`;

    const correctedRussianText = `## План
1. Основные понятия теории игр и матричные модели
2. Равновесие Нэша в экономических приложениях

### Введение
Теория игр представляет собой математический аппарат анализа стратегического взаимодействия рациональных субъектов. Равновесие Нэша описывает устойчивый профиль стратегий, при котором ни один участник не получает выгоды от одностороннего отклонения.

### Основная часть
Дилемма заключённого и модели олигополистической конкуренции демонстрируют, как теория игр и равновесие Нэша объясняют ценовые войны, картельные соглашения и механизмы аукционов на современных рынках.

### Заключение
Таким образом, теория игр и равновесие Нэша являются ключевыми инструментами микроэкономического моделирования.`;

    mockGenerateContent
      .mockResolvedValueOnce({ text: wrongLangUzbekText })
      .mockResolvedValueOnce({ text: correctedRussianText });

    const req = new NextRequest("http://localhost:3000/api/academic/topics/generate-works", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: "Микроэкономика",
        workType: "Реферат",
        pagesPerTopic: "2-3",
        language: "auto",
        topics: [{ title: "1. Теория игр и равновесие Нэша", content: "Дилемма заключённого" }],
      }),
    });

    const res = await generateWorksPost(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    expect(mockGenerateContent.mock.calls[0][0].contents).toContain("русском языке");
    expect(json.usedFallbackCount).toBe(0);
    expect(json.works[0].content).toContain("Равновесие Нэша");
    expect(json.works[0].content).toContain("Теория игр");
  });

  it("handles mixed-language batches independently under language=auto and isolates persistent off-topic failures safely", async () => {
    const uzOutput = `## Reja
1. Raqamli marketing kanallari va SEO optimizatsiya
2. Konversiya tahlili va reklama samaradorligi

### Kirish
Raqamli marketing zamonaviy biznesda mijozlarni jalb qilishning eng samarali vositasidir. SEO optimizatsiya, ijtimoiy tarmoqlar va kontent marketing strategiyalari brend taniluvchanligini oshirib, maqsadli auditoriya bilan bevosita aloqa o'rnatadi hamda konversiya ko'rsatkichlarini sezilarli yaxshilaydi.

### Asosiy qism
Qidiruv tizimlari uchun SEO va kontekstli reklama kampaniyalari ROI darajasini aniq o'lchash imkonini beradi.

### Xulosa
Tizimli raqamli marketing korxona savdo hajmini barqaror oshiradi.`;

    const ruOutput = `## План
1. Архитектура распределённых баз данных и репликация
2. Теорема CAP и согласованность транзакций

### Введение
Распределённые базы данных обеспечивают горизонтальное масштабирование и отказоустойчивость современных высоконагруженных систем. Согласно теореме CAP распределённые базы данных вынуждены балансировать между строгой согласованностью и доступностью при сетевом разделении узлов.

### Основная часть
Механизмы синхронной репликации, шардирования и алгоритмы консенсуса Raft позволяют сохранять целостность данных между дата-центрами.

### Заключение
Грамотное проектирование распределённых баз данных гарантирует надёжность хранения критической информации.`;

    const wrongDomainPersistent = `## Reja
1. Gulchilik va landshaft dizayni
2. Manzarali o'simliklarni parvarishlash

### Kirish
Shahar xiyobonlarida manzarali gullarni ekish va mavsumiy parvarishlash estetik muhit yaratadi. Bog'bonchilik usullari ekologik go'zallikni ta'minlashga qaratilgan.

### Xulosa
Obodonlashtirish ishlari shahar qiyofasini bezaydi.`;

    // Topic 1 (uz) passes attempt 1, Topic 2 (ru) passes attempt 1, Topic 3 (en) stays off-topic on both attempts
    mockGenerateContent
      .mockResolvedValueOnce({ text: uzOutput })
      .mockResolvedValueOnce({ text: ruOutput })
      .mockResolvedValueOnce({ text: wrongDomainPersistent })
      .mockResolvedValueOnce({ text: wrongDomainPersistent });

    const req = new NextRequest("http://localhost:3000/api/academic/topics/generate-works", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workType: "Mustaqil ish",
        pagesPerTopic: "2-3",
        language: "auto",
        topics: [
          { title: "1. Raqamli marketing va SEO strategiyalari", content: "Konversiya tahlili" },
          { title: "2. Распределённые базы данных и теорема CAP", content: "Шардирование" },
          {
            title: "3. Quantum cryptography and key distribution protocols",
            content: "BB84 protocol",
          },
        ],
      }),
    });

    const res = await generateWorksPost(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.works).toHaveLength(3);
    expect(json.works[0].content).toContain("Raqamli marketing");
    expect(json.works[1].content).toContain("Распределённые базы данных");
    expect(json.usedFallbackCount).toBe(1);
    expect(json.fallbackIndices).toEqual([2]);
    // Ensure wrong-domain text ("Gulchilik") is NEVER returned to the student
    expect(json.works[2].content).not.toContain("Gulchilik");
    expect(json.works[2].content).toContain("Quantum cryptography");
  });
});
