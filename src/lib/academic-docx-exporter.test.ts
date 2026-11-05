import { describe, expect, it, vi } from "vitest";
import {
  generateAcademicDocx,
  generateHighResQrBuffer,
  generateVerificationCode,
  verifyDocumentByCode,
} from "./academic-docx-exporter";

// In-memory token storage to verify real DB save and retrieval behavior without WASM memory aborts
const mockVerificationDb = new Map<string, { identifier: string; token: string; expires: Date }>();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    verificationToken: {
      upsert: vi.fn(
        async ({
          where,
          create,
          update,
        }: {
          where: { token: string };
          create: { token: string; identifier: string; expires: Date };
          update: { identifier: string; expires: Date };
        }) => {
          const token = where.token;
          const record = { ...create, ...update, token };
          mockVerificationDb.set(token, record);
          return record;
        }
      ),
      findUnique: vi.fn(async ({ where }: { where: { token: string } }) => {
        return mockVerificationDb.get(where.token) || null;
      }),
    },
  },
}));

describe("Academic DOCX & QR Verification Engine", () => {
  it("generates a valid high-resolution PNG QR buffer", async () => {
    const qrBuffer = await generateHighResQrBuffer(
      "https://www.docnova.uz/verify/DN-2026-TEST1234"
    );
    expect(Buffer.isBuffer(qrBuffer)).toBe(true);
    // PNG magic signature: 89 50 4E 47
    expect(qrBuffer[0]).toBe(0x89);
    expect(qrBuffer[1]).toBe(0x50);
    expect(qrBuffer[2]).toBe(0x4e);
    expect(qrBuffer[3]).toBe(0x47);
    expect(qrBuffer.byteLength).toBeGreaterThan(500);
  });

  it("generates a valid OpenXML .docx binary with embedded QR code and verifies the URL", async () => {
    const sampleMarkdown = `# O'ZBEKISTON RESPUBLIKASI OLIY TA'LIM, FAN VA INNOVATSIYALAR VAZIRLIGI

## TOSHKENT AXBOROT TEXNOLOGIYALARI UNIVERSITETI

# KURS ISHI

### **Mavzu:** «Sun'iy intellekt tizimlarida ma'lumotlar xavfsizligi»

**Bajaruvchi:** Aliyev Vali
**Ilmiy rahbar:** dots. Karimov A.

**Toshkent — 2026**

---

## MUNDARIJA

- **KIRISH** ................................................................................................. 3
- **I BOB. NAZARIY ASOSLAR** ...................................................................... 5
  - 1.1. Tushunchalar va modellar .................................................................... 5
- **XULOSA** ................................................................................................. 18

---

## KIRISH

Mavzuning dolzarbligi **«O'zbekiston — 2030» strategiyasi** doirasida raqamli texnologiyalarni rivojlantirish bilan bevosita bog'liqdir.

| № | Ko'rsatkich | An'anaviy | Zamonaviy |
| :-: | :--- | :---: | :---: |
| 1 | Tezkorlik | 12 soat | 1.5 soat |
| 2 | Aniqlik | 78% | 99% |

## FOYDALANILGAN ADABIYOTLAR

1. O'zbekiston Respublikasining Konstitutsiyasi. — Toshkent: O'zbekiston, 2023.`;

    const result = await generateAcademicDocx({
      topic: "Sun'iy intellekt tizimlarida ma'lumotlar xavfsizligi",
      markdownContent: sampleMarkdown,
      workType: "Kurs ishi",
      subject: "Kiberxavfsizlik asoslari",
      university: "Toshkent axborot texnologiyalari universiteti",
      studentName: "Aliyev Vali",
      teacherName: "dots. Karimov A.",
      language: "uz",
    });

    // 1. Check .docx ZIP magic bytes (PK\x03\x04)
    expect(Buffer.isBuffer(result.buffer)).toBe(true);
    expect(result.buffer[0]).toBe(0x50); // 'P'
    expect(result.buffer[1]).toBe(0x4b); // 'K'
    expect(result.buffer.byteLength).toBeGreaterThan(4000);

    // 2. Check filename and verification code
    expect(result.fileName.endsWith(".docx")).toBe(true);
    expect(result.verificationCode).toMatch(/^DN-\d{4}-[A-F0-9]{12}$/);
    expect(result.verificationUrl).toContain(`/verify/${result.verificationCode}`);

    // 3. Verify that the verification URL can be decoded and verified with compact parameter
    const urlObj = new URL(result.verificationUrl);
    const compactParam = urlObj.searchParams.get("d");
    const check = await verifyDocumentByCode(result.verificationCode, compactParam);

    expect(check.verified).toBe(true);
    expect(check.signatureValid).toBe(true);
    expect(check.payload?.topic).toContain("Sun'iy intellekt");

    // 4. Verify that verification works directly against database records without fallback query parameter
    const dbCheck = await verifyDocumentByCode(result.verificationCode);
    expect(dbCheck.verified).toBe(true);
    expect(dbCheck.signatureValid).toBe(true);
    expect(dbCheck.payload?.topic).toContain("Sun'iy intellekt");
  }, 15000);

  it("generates unique verification codes on consecutive calls", () => {
    const code1 = generateVerificationCode("Mavzu A", "Talaba 1");
    const code2 = generateVerificationCode("Mavzu A", "Talaba 1");
    expect(code1).not.toBe(code2);
  });
});
