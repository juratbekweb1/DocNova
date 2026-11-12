import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  mockGetServerSession,
  mockGenerateGeminiContent,
  mockGenerateGeminiJson,
  mockCheckUserLimit,
  mockTrackAIUsage,
  mockDeductUserAiCredit,
  mockRefundUserAiCredit,
  mockGetUserSubscription,
} = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
  mockGenerateGeminiContent: vi.fn(),
  mockGenerateGeminiJson: vi.fn(),
  mockCheckUserLimit: vi.fn(),
  mockTrackAIUsage: vi.fn(),
  mockDeductUserAiCredit: vi.fn(),
  mockRefundUserAiCredit: vi.fn(),
  mockGetUserSubscription: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: mockGetServerSession,
}));

vi.mock("@/lib/auth-options", () => ({
  authOptions: {},
}));

vi.mock("@/lib/gemini", () => ({
  generateGeminiContent: mockGenerateGeminiContent,
  generateGeminiJson: mockGenerateGeminiJson,
}));

vi.mock("@/lib/limits", () => ({
  checkUserLimit: mockCheckUserLimit,
  trackAIUsage: mockTrackAIUsage,
  deductUserAiCredit: mockDeductUserAiCredit,
  refundUserAiCredit: mockRefundUserAiCredit,
  getUserSubscription: mockGetUserSubscription,
}));

import { POST as academicPost } from "./route";
import { POST as courseworkPost } from "@/app/api/generate-coursework/route";
import { POST as amaliyIshPost } from "@/app/api/ai/amaliy-ish/route";
import {
  formatImageTopicsTemplateContext,
  IMAGE_TOPICS_CONTEXT_MARKER,
} from "@/lib/academic/topic-fidelity";

describe("Academic / Coursework / Amaliy-ish Topic Fidelity Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue({ user: { id: "user-academic-1" } });
    mockGetUserSubscription.mockResolvedValue({ plan: "PRO" });
    mockCheckUserLimit.mockResolvedValue({ allowed: true });
    mockTrackAIUsage.mockResolvedValue("usage-log-1");
    mockDeductUserAiCredit.mockResolvedValue(undefined);
    mockRefundUserAiCredit.mockResolvedValue(undefined);
  });

  it("preserves [RASMDAN OLINGAN MAVZU VA TALABLAR] topics & subpoints verbatim in /api/ai/academic generate-referat and self-corrects off-topic drift", async () => {
    const offTopicChapters = {
      kirishContent:
        "Qishloq xo'jaligida sug'orish tizimlari va paxta hosildorligini oshirish zamonaviy agrar siyosatning muhim yo'nalishidir. Melioratsiya hamda tuproq unumdorligini tiklash masalalari iqtisodiy barqarorlikni ta'minlaydi.",
      sub1_1:
        "Tomchilatib sug'orish texnologiyalari suv resurslarini tejash imkonini beradi va agrotexnik tadbirlarni tezlashtiradi.",
      sub1_2:
        "Mineral o'g'itlar balansini nazorat qilish ekin maydonlaridan olinadigan yalpi hosil sifatini yaxshilaydi.",
      sub2_1:
        "Fermer xo'jaliklarida klaster boshqaruvi zamonaviy traktorlar va dronlar yordamida monitoring qilinadi.",
      xulosaContent:
        "Xulosa o'rnida shuni aytish mumkinki, agrar tarmoqni modernizatsiya qilish mamlakat oziq-ovqat xavfsizligini mustahkamlaydi.",
    };

    const onTopicCryptoChapters = {
      kirishContent:
        "Kriptografiya va RSA shifrlash algoritmi zamonaviy axborot xavfsizligi tizimlarining fundamental asosini tashkil etadi. Asimmetrik ochiq kalit tizimlari ma'lumotlarni himoyalash, elektron raqamli imzo yaratish va tarmoq kanallari maxfiyligini kafolatlashda qo'llaniladi.",
      sub1_1:
        "RSA shifrlashning matematik negizini ikki katta tub son ko'paytmasi va Eyler funksiyasi tashkil etadi. Eyler funksiyasi modul arifmetikasida teskari elementni topish imkonini berib, ochiq kalit va maxfiy kalit juftligini hisoblashga xizmat qiladi.",
      sub1_2:
        "Kriptografiya amaliyotida ochiq kalit yordamida xabarlar shifrlanadi, yopiq kalit esa faqat qabul qiluvchi tomonidan deshifrlash uchun ishlatiladi.",
      sub2_1:
        "TLS protokollari, elektron hukumat va bank operatsiyalarida RSA shifrlash kalit uzunligi 2048 bitdan kam bo'lmagan standartlar asosida joriy etiladi.",
      xulosaContent:
        "Demak, kriptografiya va RSA shifrlash Eyler funksiyasi hamda ochiq kalit mexanizmi orqali yuqori darajadagi ma'lumot himoyasini ta'minlaydi.",
    };

    mockGenerateGeminiJson
      .mockResolvedValueOnce({
        data: offTopicChapters,
        modelUsed: "gemini-2.5-flash",
        usage: { promptTokenCount: 300, candidatesTokenCount: 250 },
      })
      .mockResolvedValueOnce({
        data: onTopicCryptoChapters,
        modelUsed: "gemini-2.5-flash",
        usage: { promptTokenCount: 420, candidatesTokenCount: 620 },
      });

    const imageTemplate = formatImageTopicsTemplateContext(
      [
        {
          title: "1. Kriptografiya va RSA shifrlash",
          content: "Eyler funksiyasi va ochiq kalit matematik asosi",
          pageCount: "8",
        },
      ],
      { subject: "Axborot xavfsizligi", language: "uz" }
    );

    const req = new NextRequest("http://localhost:3000/api/ai/academic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "generate-referat",
        subject: "Axborot xavfsizligi",
        topic: "Kriptografiya va RSA shifrlash",
        workType: "Mustaqil ish",
        length: "8 bet",
        templateText: imageTemplate,
      }),
    });

    const res = await academicPost(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockGenerateGeminiJson).toHaveBeenCalledTimes(2);

    const firstPrompt = mockGenerateGeminiJson.mock.calls[0][0] as string;
    expect(firstPrompt).toContain(IMAGE_TOPICS_CONTEXT_MARKER);
    expect(firstPrompt).toContain("1. Kriptografiya va RSA shifrlash");
    expect(firstPrompt).toContain("Eyler funksiyasi va ochiq kalit matematik asosi");

    const retryOptions = mockGenerateGeminiJson.mock.calls[1][1] as { temperature: number };
    expect(retryOptions.temperature).toBe(0.12);

    expect(json.result).toContain("RSA shifrlash");
    expect(json.result).toContain("Eyler funksiyasi");
    expect(json.result).not.toContain("Tomchilatib sug'orish");
  });

  it("preserves image topics in /api/ai/academic generate-exam-prep and retries off-topic exam questions", async () => {
    const offTopicExam = `1. Bog'dorchilikda daraxtlarni bahorda butash qoidalari qanday belgilanadi?
   - A) Faqat yozda kesish
   - B) Vegetatsiya boshlanishidan oldin shakl berish (To'g'ri)
   - C) Ildiz tizimini qazib olish
   - D) Suv bermaslik

2. Gullar urug'ini saqlash harorati necha gradus bo'lishi kerak?
   - A) +5 C
   - B) +12 C
   - C) -20 C
   - D) +40 C

Bog'bonchilik va landshaft dizaynida manzarali ko'chatlarni parvarishlash tuproq unumdorligiga bog'liq bo'ladi.`;

    const onTopicSqlExam = `## Imtihon testlari va nazariy savollar

1. SQL inyeksiya (SQL Injection) hujumidan himoyalanishning eng ishonchli dasturiy usuli qaysi?
   - A) Foydalanuvchi kiritishini satr qo'shish orqali ulash
   - B) Parametrlangan so'rovlar (Prepared Statements) dan foydalanish (To'g'ri)
   - C) Faqat HTML CSS yashirish
   - D) Ma'lumotlar bazasi portini o'zgartirish

2. XSS (Cross-Site Scripting) zaifligi qanday xavf tug'diradi va brauzerda qanday cheklanadi?
   - A) Xotira oqishi
   - B) Zararli JavaScript kodini bajarish orqali sessiya cookie larini o'g'irlash (To'g'ri)
   - C) Printer sozlamalarini buzish
   - D) Faqat DNS keshni tozalash

### Bilet savollariga javob
1-savol: SQL inyeksiya va XSS hujumlari veb-ilovalarda kirish ma'lumotlarini yetarli filtrlamaslik natijasida yuzaga keladi. Prepared Statements, qat'iy escaping va Content Security Policy (CSP) ushbu tahdidlarni samarali bartaraf etadi.`;

    mockGenerateGeminiContent
      .mockResolvedValueOnce({
        text: offTopicExam,
        modelUsed: "gemini-2.5-flash",
        usage: { promptTokenCount: 200, candidatesTokenCount: 150 },
      })
      .mockResolvedValueOnce({
        text: onTopicSqlExam,
        modelUsed: "gemini-2.5-flash",
        usage: { promptTokenCount: 280, candidatesTokenCount: 380 },
      });

    const examTemplate = formatImageTopicsTemplateContext(
      [{ title: "1. SQL inyeksiya va XSS hujumlari", content: "Prepared Statements va CSP" }],
      { subject: "Veb xavfsizlik", language: "uz" }
    );

    const req = new NextRequest("http://localhost:3000/api/ai/academic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "generate-exam-prep",
        subject: "Veb xavfsizlik",
        topic: "SQL inyeksiya va XSS hujumlari",
        templateText: examTemplate,
      }),
    });

    const res = await academicPost(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(mockGenerateGeminiContent).toHaveBeenCalledTimes(2);
    expect(mockGenerateGeminiContent.mock.calls[0][0]).toContain("Prepared Statements va CSP");
    expect(mockGenerateGeminiContent.mock.calls[1][1].temperature).toBe(0.1);
    expect(json.result).toContain("SQL inyeksiya");
    expect(json.result).not.toContain("Bog'dorchilikda");
  });

  it("preserves [RASMDAN OLINGAN MAVZU VA TALABLAR] in /api/generate-coursework outline generation", async () => {
    mockGenerateGeminiJson.mockResolvedValueOnce({
      data: {
        chapters: [
          {
            number: 1,
            title: "I BOB. Neyron tarmoqlar va backpropagation nazariyasi",
            subsections: [
              "1.1. Perseptron va ko'p qatlamli arxitektura",
              "1.2. Aktivatsiya funksiyalari: ReLU, Sigmoid va Tanh",
              "1.3. Yo'qotish funksiyasi va gradient tushish usuli",
            ],
          },
          {
            number: 2,
            title: "II BOB. Xatolikni teskari tarqatish (Backpropagation) algoritmi",
            subsections: [
              "2.1. Zanjirli qoida (Chain Rule) matematik keltirib chiqarish",
              "2.2. Gradient so'nishi muammosi va Batch Normalization",
              "2.3. Adam optimizatorining amaliy taqqoslashi",
            ],
          },
          {
            number: 3,
            title: "III BOB. Chuqur o'qitish modellarini optimallashtirish yo'llari",
            subsections: [
              "3.1. Giperparametrlarni sozlash",
              "3.2. Overfittingni bartaraf etish (Dropout)",
              "3.3. Amaliy tasniflash tajribasi",
            ],
          },
        ],
      },
      modelUsed: "gemini-2.5-flash",
      usage: { promptTokenCount: 250, candidatesTokenCount: 220 },
    });

    const courseworkTemplate = formatImageTopicsTemplateContext(
      [
        {
          title: "1. Neyron tarmoqlar va backpropagation",
          content: "Gradient tushish, Chain Rule va ReLU aktivatsiya funksiyasi",
          pageCount: "25",
        },
      ],
      { subject: "Sun'iy intellekt", language: "uz" }
    );

    const req = new NextRequest("http://localhost:3000/api/generate-coursework", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "outline",
        subject: "Sun'iy intellekt",
        topic: "Neyron tarmoqlar va backpropagation",
        templateText: courseworkTemplate,
      }),
    });

    const res = await courseworkPost(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(mockGenerateGeminiJson).toHaveBeenCalledTimes(1);

    const promptArg = mockGenerateGeminiJson.mock.calls[0][0] as string;
    expect(promptArg).toContain(IMAGE_TOPICS_CONTEXT_MARKER);
    expect(promptArg).toContain("Gradient tushish, Chain Rule va ReLU aktivatsiya funksiyasi");
    expect(json.outline.chapters).toHaveLength(3);
  });

  it("uses domain-specific non-ANOVA prompt in /api/ai/amaliy-ish for custom domains while preserving ANOVA prompt for dispersion topics", async () => {
    mockGenerateGeminiJson.mockResolvedValue({
      data: {
        introduction: {
          relevance:
            "Kredit portfeli sifatini boshqarish tijorat banklari barqarorligi uchun muhim.",
          purpose: "PD, LGD va EAD modellarini qo'llash",
          tasks: ["Skoring tahlili", "Risk baholash"],
          methods: ["Kredit skoring", "Stress-test"],
        },
        problem1Condition:
          "Bank kredit portfelining 3 ta segmenti bo'yicha PD qiymatlarini hisoblang.",
      },
      modelUsed: "gemini-2.5-flash",
      usage: { promptTokenCount: 200, candidatesTokenCount: 150 },
    });

    const customDomainReq = new NextRequest("http://localhost:3000/api/ai/amaliy-ish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: "Bank ishi",
        topic: "Tijorat banklarida kredit portfeli riskini baholash",
        situation: "Kredit skoringi va zaxira tahlili",
        variant: "7-variant",
        customProblemText: "PD, LGD va EAD ko'rsatkichlari misolida",
      }),
    });

    const customRes = await amaliyIshPost(customDomainReq);
    expect(customRes.status).toBe(200);

    const customPrompt = mockGenerateGeminiJson.mock.calls[0][0] as string;
    expect(customPrompt).toContain("Bank ishi");
    expect(customPrompt).toContain("PD, LGD va EAD ko'rsatkichlari misolida");
    expect(customPrompt).toContain("dispersion tahlil yoki begona fan atamalarini aralashtirmang");
    expect(customPrompt).not.toContain("One-Way & Two-Way ANOVA");

    const anovaReq = new NextRequest("http://localhost:3000/api/ai/amaliy-ish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: "Ekonometrika",
        topic: "Ishlab chiqarish jarayonida bir omilli dispersion tahlil",
        situation: "Korxona smenalari bo'yicha unumdorlik",
        variant: "14-variant",
      }),
    });

    const anovaRes = await amaliyIshPost(anovaReq);
    expect(anovaRes.status).toBe(200);

    const anovaPrompt = mockGenerateGeminiJson.mock.calls[1][0] as string;
    expect(anovaPrompt).toContain("One-Way & Two-Way ANOVA");
    expect(anovaPrompt).toContain("Fisher LSD");
  });
});
