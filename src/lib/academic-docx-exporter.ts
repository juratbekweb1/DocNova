import crypto from "crypto";
import QRCode from "qrcode";
import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  Footer,
  HeadingLevel,
  ImageRun,
  LeaderType,
  LineRuleType,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  ShadingType,
  TabStopType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
  convertMillimetersToTwip,
} from "docx";

export type AcademicWorkType =
  "COURSEWORK" | "DIPLOMA_BMI" | "REFERAT" | "INDEPENDENT_WORK" | "ESSAY" | "OTHER";

export interface AcademicDocxExportInput {
  /** Hujjat mavzusi (masalan: "Raqamli iqtisodiyotda bank xizmatlari") */
  topic: string;
  /** Markdown formatidagi to'liq hujjat matni yoki sahifalar ro'yxati */
  markdownContent: string;
  /** Sahifalarga bo'lingan kontent (ixtiyoriy, agar mavjud bo'lsa) */
  pages?: Array<{
    pageNumber: number;
    type?: string;
    title?: string;
    content: string;
  }>;
  /** Ish turi nomi (masalan: "Kurs ishi", "Bitiruv malakaviy ishi (BMI)", "Referat") */
  workType?: string;
  /** Fan yoki mutaxassislik nomi */
  subject?: string;
  /** Oliy ta'lim muassasasi nomi */
  university?: string;
  /** Fakultet yoki kafedra */
  faculty?: string;
  /** Bajaruvchi talaba F.I.Sh. */
  studentName?: string;
  /** Ilmiy rahbar / O'qituvchi F.I.Sh. */
  teacherName?: string;
  /** Hujjat tili */
  language?: "uz" | "uz-cyrl" | "ru" | "en";
  /** O'quv yili */
  year?: string | number;
  /** Foydalanuvchi ID (agar avtorizatsiyadan o'tgan bo'lsa) */
  userId?: string;
  /** Oldindan berilgan hujjat ID (ixtiyoriy) */
  documentId?: string;
  /**
   * Hujjat oxiriga QR-kod joylashtirish (Standart: false — akademik hujjatlarga
   * QR-kod avtomatik joylashtirilmaydi, faqat maxsus so'ralganda qo'shiladi)
   */
  includeQrVerification?: boolean;
  /** QR-kodni alohida yangi sahifaga chiqarish yoki oxirgi sahifa pastiga joylash */
  qrOnSeparatePage?: boolean;
}

export interface AcademicVerificationPayload {
  code: string;
  topic: string;
  workType: string;
  subject: string;
  university: string;
  faculty?: string;
  studentName: string;
  teacherName?: string;
  language: "uz" | "uz-cyrl" | "ru" | "en";
  pagesEstimate: number;
  wordCount: number;
  issuedAt: string;
  contentHash: string;
}

export interface AcademicDocxExportResult {
  buffer: Buffer;
  fileName: string;
  verificationCode: string;
  verificationUrl: string;
  verificationPayload: AcademicVerificationPayload;
}

const EPHEMERAL_VERIFY_SECRET = "__docnovaEphemeralVerifySecret";

function getVerifySecret(): string {
  const configured =
    process.env.ENCRYPTION_KEY?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim();
  if (configured) {
    return configured;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Verification secret (ENCRYPTION_KEY, AUTH_SECRET, or NEXTAUTH_SECRET) must be configured in production."
    );
  }

  const g = globalThis as unknown as Record<string, string | undefined>;
  if (!g[EPHEMERAL_VERIFY_SECRET]) {
    g[EPHEMERAL_VERIFY_SECRET] = crypto.randomBytes(32).toString("hex");
  }
  return g[EPHEMERAL_VERIFY_SECRET]!;
}

/**
 * Bazaviy sayt URL manzilini aniqlash (QR-kod havolasi uchun)
 */
export function getAppBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envUrl && envUrl.startsWith("http")) {
    return envUrl.replace(/\/+$/, "");
  }
  return "https://www.docnova.uz";
}

/**
 * Hujjat uchun noyob, o'qishga qulay va kriptografik himoyalangan ID yaratish
 * Format: DN-2026-XXXXXXXX
 */
export function generateVerificationCode(topic: string, studentName = ""): string {
  const year = new Date().getFullYear();
  const randomBytes = crypto.randomBytes(4).toString("hex").toUpperCase();
  const hashSuffix = crypto
    .createHmac("sha256", getVerifySecret())
    .update(`${topic}|${studentName}|${Date.now()}|${randomBytes}`)
    .digest("hex")
    .slice(0, 4)
    .toUpperCase();
  return `DN-${year}-${randomBytes}${hashSuffix}`;
}

/**
 * Hujjat ma'lumotlaridan kriptografik imzo (HMAC-SHA256) olish
 */
export function signVerificationData(code: string, contentHash: string): string {
  return crypto
    .createHmac("sha256", getVerifySecret())
    .update(`${code}:${contentHash}`)
    .digest("hex")
    .slice(0, 16);
}

/**
 * Hujjat verifikatsiya ma'lumotlarini Neon PostgreSQL bazasiga saqlash
 * va QR-kod uchun to'liq URL qaytarish
 */
export async function registerDocumentVerification(
  payload: AcademicVerificationPayload
): Promise<string> {
  const baseUrl = getAppBaseUrl();
  const signature = signVerificationData(payload.code, payload.contentHash);

  // Bazaga yozish (VerificationToken jadvali orqali 5 yil muddatga saqlanadi)
  try {
    const { prisma } = await import("@/lib/prisma");
    const tokenKey = `doc_verify_${payload.code}`;
    const encodedData = Buffer.from(
      JSON.stringify({ ...payload, sig: signature }),
      "utf-8"
    ).toString("base64");
    const expires = new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000); // 5 yil

    if (prisma?.verificationToken?.upsert) {
      await prisma.verificationToken.upsert({
        where: { token: tokenKey },
        update: {
          identifier: encodedData,
          expires,
        },
        create: {
          token: tokenKey,
          identifier: encodedData,
          expires,
        },
      });
    }
  } catch (dbErr) {
    // Agar DB ulanishida vaqtinchalik uzilish bo'lsa ham, URL dagi imzolangan kompaktni o'qiydi
    console.warn("[DOC_VERIFY_DB_SAVE_WARN]", dbErr);
  }

  // Qisqa fallback parametrlar (hatto DB o'chirilgan muhitda ham verifikatsiya 100% ishlashi uchun)
  const compactMeta = Buffer.from(
    JSON.stringify({
      t: payload.topic.slice(0, 140),
      w: payload.workType.slice(0, 60),
      s: payload.subject.slice(0, 80),
      u: payload.university.slice(0, 80),
      n: payload.studentName.slice(0, 60),
      d: payload.issuedAt,
      p: payload.pagesEstimate,
      h: payload.contentHash,
      sig: signature,
    }),
    "utf-8"
  ).toString("base64url");

  return `${baseUrl}/verify/${encodeURIComponent(payload.code)}?d=${compactMeta}`;
}

/**
 * Verifikatsiya kodini bazadan yoki imzolangan kompakt parametrdan tekshirish
 */
export async function verifyDocumentByCode(
  code: string,
  compactParam?: string | null
): Promise<{
  verified: boolean;
  payload: AcademicVerificationPayload | null;
  signatureValid: boolean;
}> {
  const cleanCode = decodeURIComponent(code || "").trim();
  if (!cleanCode.startsWith("DN-")) {
    return { verified: false, payload: null, signatureValid: false };
  }

  // 1. Bazadan qidirish
  try {
    const { prisma } = await import("@/lib/prisma");
    if (prisma?.verificationToken?.findUnique) {
      const record = await prisma.verificationToken.findUnique({
        where: { token: `doc_verify_${cleanCode}` },
      });
      if (record && record.expires > new Date()) {
        const parsed = JSON.parse(
          Buffer.from(record.identifier, "base64").toString("utf-8")
        ) as AcademicVerificationPayload & { sig?: string };
        const expectedSig = signVerificationData(parsed.code, parsed.contentHash);
        return {
          verified: true,
          payload: parsed,
          signatureValid: !parsed.sig || parsed.sig === expectedSig,
        };
      }
    }
  } catch (err) {
    console.warn("[DOC_VERIFY_LOOKUP_WARN]", err);
  }

  // 2. Agar bazada topilmasa, URL ichidagi kriptografik kompakt ma'lumotni tekshirish
  if (compactParam) {
    try {
      const raw = JSON.parse(Buffer.from(compactParam, "base64url").toString("utf-8")) as {
        t?: string;
        w?: string;
        s?: string;
        u?: string;
        n?: string;
        d?: string;
        p?: number;
        h?: string;
        sig?: string;
      };
      if (raw && raw.t && raw.h && raw.sig) {
        const expectedSig = signVerificationData(cleanCode, raw.h);
        if (raw.sig !== expectedSig) {
          return { verified: false, payload: null, signatureValid: false };
        }
        const payload: AcademicVerificationPayload = {
          code: cleanCode,
          topic: raw.t,
          workType: raw.w || "Akademik hujjat",
          subject: raw.s || "Mutaxassislik fani",
          university: raw.u || "Oliy ta'lim muassasasi",
          studentName: raw.n || "Talaba",
          language: "uz",
          pagesEstimate: raw.p || 15,
          wordCount: (raw.p || 15) * 260,
          issuedAt: raw.d || new Date().toISOString(),
          contentHash: raw.h,
        };
        return {
          verified: true,
          payload,
          signatureValid: true,
        };
      }
    } catch {
      // Noto'g'ri base64url
    }
  }

  return { verified: false, payload: null, signatureValid: false };
}

/**
 * Yuqori aniqlikdagi (360x360px, Error Correction Level M/Q) QR-kod PNG buferini yaratish.
 * Telefon kamerasi 0.2 soniyada o'qishi uchun "quiet zone" (margin: 2) va yuqori kontrast berilgan.
 */
export async function generateHighResQrBuffer(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, {
    type: "png",
    width: 360,
    margin: 2,
    errorCorrectionLevel: "M",
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });
}

/**
 * XML / DOCX ichida xatolik keltirib chiqaruvchi noo'rin control belgilarni tozalash
 * (Microsoft Word va LibreOffice "File is corrupted" xatosining oldini oladi)
 */
function sanitizeXmlText(input: string): string {
  if (!input) return "";
  // XML 1.0 da ruxsat etilmagan control characters (0x00-0x08, 0x0B, 0x0C, 0x0E-0x1F) ni olib tashlaymiz
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").replace(/\uFFFD/g, "");
}

/**
 * Ichki Markdown formatlashni (`**qalin**`, `*kursiv*`, `` `kod` ``)
 * docx `TextRun` massiviga aylantirish
 */
function parseInlineMarkdownToRuns(
  text: string,
  options: {
    sizeHalfPt?: number;
    bold?: boolean;
    italics?: boolean;
    color?: string;
  } = {}
): TextRun[] {
  const clean = sanitizeXmlText(text);
  const size = options.sizeHalfPt ?? 28; // 14pt = 28 half-points
  const runs: TextRun[] = [];

  // **bold**, __bold__, *italic* tokenlarini ajratish
  const tokenRegex = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*\n]+\*|`[^`\n]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(clean)) !== null) {
    if (match.index > lastIndex) {
      runs.push(
        new TextRun({
          text: clean.slice(lastIndex, match.index),
          font: "Times New Roman",
          size,
          bold: options.bold,
          italics: options.italics,
          color: options.color ?? "000000",
        })
      );
    }

    const token = match[0];
    if (
      (token.startsWith("**") && token.endsWith("**")) ||
      (token.startsWith("__") && token.endsWith("__"))
    ) {
      runs.push(
        new TextRun({
          text: token.slice(2, -2),
          font: "Times New Roman",
          size,
          bold: true,
          italics: options.italics,
          color: options.color ?? "000000",
        })
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      runs.push(
        new TextRun({
          text: token.slice(1, -1),
          font: "Times New Roman",
          size,
          bold: options.bold,
          italics: true,
          color: options.color ?? "000000",
        })
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      runs.push(
        new TextRun({
          text: token.slice(1, -1),
          font: "Times New Roman",
          size,
          bold: options.bold,
          color: options.color ?? "000000",
        })
      );
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < clean.length) {
    runs.push(
      new TextRun({
        text: clean.slice(lastIndex),
        font: "Times New Roman",
        size,
        bold: options.bold,
        italics: options.italics,
        color: options.color ?? "000000",
      })
    );
  }

  if (runs.length === 0) {
    runs.push(
      new TextRun({
        text: clean,
        font: "Times New Roman",
        size,
        bold: options.bold,
        italics: options.italics,
        color: options.color ?? "000000",
      })
    );
  }

  return runs;
}

/**
 * Mundarija (Reja) satrini aniqlash: "KIRISH ................... 3"
 */
function parseTocEntry(line: string): { title: string; page: string; isSub: boolean } | null {
  const clean = line.trim();
  const match = clean.match(/^([^\n]+?)\s*(?:[\.·…\-]\s*){2,}\s*(\d+)\s*$/);
  if (!match) return null;

  const rawTitle = match[1]
    .replace(/^\s*[-*•]\s*/, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .trim();
  const page = match[2].trim();

  if (!rawTitle || !page) return null;
  const isSub = /^\d+\.\d+/.test(rawTitle);
  return { title: rawTitle, page, isSub };
}

/**
 * Markdown jadval satrlaridan haqiqiy OpenXML `Table` obyektini qurish
 */
function buildDocxTable(tableRows: string[][]): Table {
  const colCount = Math.max(1, ...tableRows.map((r) => r.length));
  const colWidthPercent = Math.floor(100 / colCount);

  const cellBorders = {
    top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
    bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
    left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
    right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
  };

  const rows = tableRows.map((rowCells, rowIndex) => {
    const isHeader = rowIndex === 0;
    const normalizedCells = Array.from({ length: colCount }, (_, idx) => rowCells[idx] ?? "");

    return new TableRow({
      tableHeader: isHeader,
      cantSplit: true,
      children: normalizedCells.map(
        (cellText) =>
          new TableCell({
            width: { size: colWidthPercent, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            borders: cellBorders,
            shading: isHeader
              ? { fill: "F1F5F9", type: ShadingType.CLEAR, color: "auto" }
              : undefined,
            margins: {
              top: convertMillimetersToTwip(1.8),
              bottom: convertMillimetersToTwip(1.8),
              left: convertMillimetersToTwip(2.2),
              right: convertMillimetersToTwip(2.2),
            },
            children: [
              new Paragraph({
                alignment: isHeader ? AlignmentType.CENTER : AlignmentType.LEFT,
                spacing: { before: 40, after: 40, line: 276, lineRule: LineRuleType.AUTO },
                indent: { firstLine: 0 },
                children: parseInlineMarkdownToRuns(cellText, {
                  sizeHalfPt: 24, // Jadval ichida GOST bo'yicha 12pt (24 half-points)
                  bold: isHeader,
                }),
              }),
            ],
          })
      ),
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
  });
}

/**
 * Markdown matnini GOST / MOVSO RUz standartiga to'liq javob beruvchi
 * `Paragraph` va `Table` elementlariga aylantirish
 */
function parseMarkdownBlockToDocxNodes(
  markdown: string,
  options: { isCoverPage?: boolean } = {}
): Array<Paragraph | Table> {
  const nodes: Array<Paragraph | Table> = [];
  const lines = sanitizeXmlText(markdown).replace(/\r\n/g, "\n").split("\n");

  let inTable = false;
  let tableRows: string[][] = [];
  let isCover = Boolean(options.isCoverPage);

  const flushTable = () => {
    if (tableRows.length > 0) {
      nodes.push(buildDocxTable(tableRows));
      nodes.push(
        new Paragraph({
          spacing: { before: 60, after: 60 },
          children: [],
        })
      );
      tableRows = [];
    }
    inTable = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // 1. Markdown jadval qatorlarini yig'ish
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const cells = trimmed
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());
      if (cells.every((c) => /^:?-+:?$/.test(c))) {
        continue;
      }
      inTable = true;
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      flushTable();
    }

    if (!trimmed) {
      continue;
    }

    // 2. Sahifa uzilishi (<!-- PAGE_BREAK --> yoki ---)
    if (trimmed === "<!-- PAGE_BREAK -->") {
      isCover = false;
      nodes.push(
        new Paragraph({
          children: [new PageBreak()],
        })
      );
      continue;
    }

    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      // Agar titul sahifaning ichida bo'lsak va hali "Toshkent — 2026" o'tmagan bo'lsa,
      // chiziqni dekorativ separator sifatida qoldiramiz, aks holda yangi sahifaga o'tkazamiz
      if (isCover) {
        nodes.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 120 },
            indent: { firstLine: 0 },
            border: {
              bottom: { style: BorderStyle.SINGLE, size: 6, color: "64748B", space: 4 },
            },
            children: [],
          })
        );
      } else {
        nodes.push(
          new Paragraph({
            children: [new PageBreak()],
          })
        );
      }
      continue;
    }

    // Agar "MUNDARIJA", "СОДЕРЖАНИЕ", "REJA", "KIRISH", "ВВЕДЕНИЕ", "INTRODUCTION" boshlansa, cover page tugagan bo'ladi
    if (
      /^#{1,3}\s*(MUNDARIJA|REJA|СОДЕРЖАНИЕ|KIRISH|ВВЕДЕНИЕ|INTRODUCTION|МУНДАРИЖА|КИРИШ)\b/i.test(
        trimmed
      )
    ) {
      if (isCover) {
        isCover = false;
        nodes.push(new Paragraph({ children: [new PageBreak()] }));
      }
    }

    // 3. Mundarija (TOC) qatorlari: nuqtali tab-stop bilan o'ngga tekislangan sahifa raqami
    const toc = parseTocEntry(trimmed);
    if (toc) {
      nodes.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          indent: {
            left: toc.isSub ? convertMillimetersToTwip(8) : 0,
            firstLine: 0,
          },
          spacing: {
            before: 60,
            after: 60,
            line: 360,
            lineRule: LineRuleType.AUTO,
          },
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: convertMillimetersToTwip(165), // A4 (210mm) - Left(30mm) - Right(15mm) = 165mm
              leader: LeaderType.DOT,
            },
          ],
          children: [
            new TextRun({
              text: toc.title,
              font: "Times New Roman",
              size: 28,
              bold: !toc.isSub,
              color: "000000",
            }),
            new TextRun({
              text: `\t${toc.page}`,
              font: "Times New Roman",
              size: 28,
              bold: !toc.isSub,
              color: "000000",
            }),
          ],
        })
      );
      continue;
    }

    // 4. H1 Sarlavha (# ...)
    if (trimmed.startsWith("# ")) {
      const h1Text = trimmed.slice(2).replace(/\*\*/g, "").trim();
      nodes.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          keepNext: true,
          keepLines: true,
          indent: { firstLine: 0 },
          spacing: {
            before: isCover ? 180 : 280,
            after: isCover ? 140 : 200,
            line: 360,
            lineRule: LineRuleType.AUTO,
          },
          children: [
            new TextRun({
              text: h1Text.toUpperCase(),
              font: "Times New Roman",
              size: 32, // 16pt
              bold: true,
              color: "000000",
            }),
          ],
        })
      );
      continue;
    }

    // 5. H2 Sarlavha (## ...)
    if (trimmed.startsWith("## ")) {
      const h2Text = trimmed.slice(3).replace(/\*\*/g, "").trim();
      const isCenteredChapter =
        isCover ||
        /^(MUNDARIJA|REJA|KIRISH|XULOSA|FOYDALANILGAN|СОДЕРЖАНИЕ|ВВЕДЕНИЕ|ЗАКЛЮЧЕНИЕ|СПИСОК|ГЛАВА|CHAPTER|INTRODUCTION|CONCLUSION|REFERENCES|[IVXLCDM]+\s+BOB)/i.test(
          h2Text
        );

      nodes.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          alignment: isCenteredChapter ? AlignmentType.CENTER : AlignmentType.LEFT,
          keepNext: true,
          keepLines: true,
          indent: { firstLine: isCenteredChapter ? 0 : convertMillimetersToTwip(12.5) },
          spacing: {
            before: 240,
            after: 160,
            line: 360,
            lineRule: LineRuleType.AUTO,
          },
          children: [
            new TextRun({
              text: isCenteredChapter ? h2Text.toUpperCase() : h2Text,
              font: "Times New Roman",
              size: 28, // 14pt bold
              bold: true,
              color: "000000",
            }),
          ],
        })
      );
      continue;
    }

    // 6. H3 / H4 Sarlavha (### ... / #### ...)
    if (trimmed.startsWith("### ") || trimmed.startsWith("#### ")) {
      const prefixLen = trimmed.startsWith("#### ") ? 5 : 4;
      const h3Text = trimmed.slice(prefixLen).replace(/\*\*/g, "").trim();
      nodes.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          alignment: isCover ? AlignmentType.CENTER : AlignmentType.LEFT,
          keepNext: true,
          keepLines: true,
          indent: { firstLine: isCover ? 0 : convertMillimetersToTwip(12.5) },
          spacing: {
            before: 200,
            after: 120,
            line: 360,
            lineRule: LineRuleType.AUTO,
          },
          children: parseInlineMarkdownToRuns(h3Text, {
            sizeHalfPt: 28,
            bold: true,
          }),
        })
      );
      continue;
    }

    // 7. Ro'yxat elementlari (- ..., * ..., • ...)
    if (/^[-*•]\s+/.test(trimmed)) {
      const itemText = trimmed.replace(/^[-*•]\s+/, "").trim();
      nodes.push(
        new Paragraph({
          alignment: AlignmentType.BOTH,
          widowControl: true,
          indent: {
            left: convertMillimetersToTwip(12.5),
            hanging: convertMillimetersToTwip(5),
          },
          spacing: {
            before: 40,
            after: 80,
            line: 360,
            lineRule: LineRuleType.AUTO,
          },
          children: [
            new TextRun({
              text: "• ",
              font: "Times New Roman",
              size: 28,
              bold: true,
              color: "000000",
            }),
            ...parseInlineMarkdownToRuns(itemText, { sizeHalfPt: 28 }),
          ],
        })
      );
      continue;
    }

    // 8. Raqamlangan ro'yxat / Adabiyotlar (1. ..., 2. ...)
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numberedMatch) {
      nodes.push(
        new Paragraph({
          alignment: AlignmentType.BOTH,
          widowControl: true,
          indent: {
            firstLine: convertMillimetersToTwip(12.5),
          },
          spacing: {
            before: 40,
            after: 80,
            line: 360,
            lineRule: LineRuleType.AUTO,
          },
          children: [
            new TextRun({
              text: `${numberedMatch[1]}. `,
              font: "Times New Roman",
              size: 28,
              bold: true,
              color: "000000",
            }),
            ...parseInlineMarkdownToRuns(numberedMatch[2], { sizeHalfPt: 28 }),
          ],
        })
      );
      continue;
    }

    // 9. Oddiy akademik abzas (yoki Titul sahifadagi ma'lumot qatori)
    const cleanNoStars = trimmed.replace(/\*/g, "").trim();
    const isCityYearLine = /^[A-Za-z'ʻʼ\u0400-\u04FF\s\(\)\.,]+[—\-–]\s*\d{4}\s*$/i.test(
      cleanNoStars
    );

    if (isCityYearLine) {
      isCover = false;
      nodes.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          indent: { firstLine: 0 },
          spacing: {
            before: 360,
            after: 120,
            line: 360,
            lineRule: LineRuleType.AUTO,
          },
          children: parseInlineMarkdownToRuns(trimmed, {
            sizeHalfPt: 28,
            bold: true,
          }),
        })
      );
      continue;
    }

    const isStudentTeacherBlock =
      /^\*\*(Tayyorladi|Guruhi?|Vazifa berdi|Bajaruvchi|Ilmiy rahbar|Tekshirdi|Qabul qildi)\*\*/i.test(
        trimmed
      );

    if (isCover && isStudentTeacherBlock) {
      nodes.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          indent: { firstLine: 0, right: convertMillimetersToTwip(10) },
          spacing: {
            before: 40,
            after: 40,
            line: 300,
            lineRule: LineRuleType.AUTO,
          },
          children: parseInlineMarkdownToRuns(trimmed, { sizeHalfPt: 26 }),
        })
      );
      continue;
    }

    nodes.push(
      new Paragraph({
        alignment: isCover ? AlignmentType.CENTER : AlignmentType.BOTH,
        widowControl: true,
        indent: {
          firstLine: isCover ? 0 : convertMillimetersToTwip(12.5), // GOST: 1.25 sm abzats
        },
        spacing: {
          before: 0,
          after: 120, // 6pt abzaslararo masofa
          line: 360, // 1.5 qator oralig'i (240 * 1.5 = 360 twips)
          lineRule: LineRuleType.AUTO,
        },
        children: parseInlineMarkdownToRuns(trimmed, { sizeHalfPt: 28 }),
      })
    );
  }

  if (inTable) {
    flushTable();
  }

  return nodes;
}

/**
 * Hujjatning oxirgi sahifasiga qo'shiladigan rasmiy QR-Kod va Verifikatsiya bloki.
 * Maketni buzmaydi (`cantSplit: true`), telefon kamerasi osongina o'qiydi (115x115px display, 360x360px manba)
 * va ustiga bosilganda haqiqiylikni tekshiruvchi sahifani ochadi.
 */
async function buildQrVerificationFooterNodes(params: {
  verificationCode: string;
  verificationUrl: string;
  payload: AcademicVerificationPayload;
  separatePage?: boolean;
}): Promise<Array<Paragraph | Table>> {
  const { verificationCode, verificationUrl, payload, separatePage = false } = params;
  const qrPngBuffer = await generateHighResQrBuffer(verificationUrl);
  const isRu = payload.language === "ru";

  const formattedDate = new Date(payload.issuedAt).toLocaleDateString(isRu ? "ru-RU" : "uz-UZ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const subtleBorder = {
    style: BorderStyle.SINGLE,
    size: 6,
    color: "CBD5E1",
  };

  const verificationTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        cantSplit: true, // QR-kod va uning matni hech qachon ikki sahifaga bo'linib qolmaydi
        children: [
          // Chap ustun: QR-kod tasviri
          new TableCell({
            width: { size: 26, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            borders: {
              top: subtleBorder,
              bottom: subtleBorder,
              left: subtleBorder,
              right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            },
            shading: { fill: "F8FAFC", type: ShadingType.CLEAR, color: "auto" },
            margins: {
              top: convertMillimetersToTwip(3),
              bottom: convertMillimetersToTwip(3),
              left: convertMillimetersToTwip(3),
              right: convertMillimetersToTwip(2),
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                indent: { firstLine: 0 },
                spacing: { before: 20, after: 20 },
                children: [
                  new ExternalHyperlink({
                    link: verificationUrl,
                    children: [
                      new ImageRun({
                        data: qrPngBuffer,
                        transformation: {
                          width: 115,
                          height: 115,
                        },
                        type: "png",
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // O'ng ustun: Hujjat haqiqiyligi pasporti va bosiladigan havola
          new TableCell({
            width: { size: 74, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            borders: {
              top: subtleBorder,
              bottom: subtleBorder,
              left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              right: subtleBorder,
            },
            shading: { fill: "F8FAFC", type: ShadingType.CLEAR, color: "auto" },
            margins: {
              top: convertMillimetersToTwip(3),
              bottom: convertMillimetersToTwip(3),
              left: convertMillimetersToTwip(2),
              right: convertMillimetersToTwip(4),
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                indent: { firstLine: 0 },
                spacing: { before: 0, after: 60, line: 260, lineRule: LineRuleType.AUTO },
                children: [
                  new TextRun({
                    text: isRu
                      ? "✓ СЕРТИФИКАТ ПОДЛИННОСТИ ДОКУМЕНТА DOCNOVA AI"
                      : "✓ DOCNOVA AI — HUJJAT HAQIQIYLIGINI TASDIQLASH PASPORTI",
                    font: "Times New Roman",
                    size: 22, // 11pt
                    bold: true,
                    color: "0F172A",
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.LEFT,
                indent: { firstLine: 0 },
                spacing: { before: 0, after: 40, line: 260, lineRule: LineRuleType.AUTO },
                children: [
                  new TextRun({
                    text: isRu ? "ID документа: " : "Hujjat raqami (ID): ",
                    font: "Times New Roman",
                    size: 20, // 10pt
                    bold: true,
                    color: "334155",
                  }),
                  new TextRun({
                    text: `${verificationCode}   |   `,
                    font: "Times New Roman",
                    size: 20,
                    bold: true,
                    color: "0284C7",
                  }),
                  new TextRun({
                    text: isRu ? "Дата: " : "Sana: ",
                    font: "Times New Roman",
                    size: 20,
                    bold: true,
                    color: "334155",
                  }),
                  new TextRun({
                    text: formattedDate,
                    font: "Times New Roman",
                    size: 20,
                    color: "334155",
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.LEFT,
                indent: { firstLine: 0 },
                spacing: { before: 0, after: 40, line: 260, lineRule: LineRuleType.AUTO },
                children: [
                  new TextRun({
                    text: isRu ? "Тип и тема: " : "Ish turi va mavzu: ",
                    font: "Times New Roman",
                    size: 20,
                    bold: true,
                    color: "334155",
                  }),
                  new TextRun({
                    text: `${payload.workType} — «${payload.topic.slice(0, 95)}${payload.topic.length > 95 ? "..." : ""}»`,
                    font: "Times New Roman",
                    size: 20,
                    color: "1E293B",
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.LEFT,
                indent: { firstLine: 0 },
                spacing: { before: 0, after: 60, line: 260, lineRule: LineRuleType.AUTO },
                children: [
                  new TextRun({
                    text: isRu
                      ? "Наведите камеру смартфона на QR-код или перейдите по ссылке для проверки подлинности: "
                      : "Hujjat haqiqiyligini tekshirish uchun telefon kamerasini QR-kodga yo'naltiring yoki havolani bosing: ",
                    font: "Times New Roman",
                    size: 18, // 9pt
                    italics: true,
                    color: "475569",
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.LEFT,
                indent: { firstLine: 0 },
                spacing: { before: 0, after: 0, line: 240, lineRule: LineRuleType.AUTO },
                children: [
                  new ExternalHyperlink({
                    link: verificationUrl,
                    children: [
                      new TextRun({
                        text: `${getAppBaseUrl()}/verify/${verificationCode}`,
                        font: "Times New Roman",
                        size: 20,
                        bold: true,
                        underline: {},
                        color: "2563EB",
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const nodes: Array<Paragraph | Table> = [];
  if (separatePage) {
    nodes.push(new Paragraph({ children: [new PageBreak()] }));
  } else {
    nodes.push(
      new Paragraph({
        spacing: { before: 280, after: 120 },
        children: [],
      })
    );
  }
  nodes.push(verificationTable);

  return nodes;
}

/**
 * ASOSIY GENERATOR:
 * Markdown yoki sahifalangan akademik kontentdan 100% standartga mos
 * haqiqiy Microsoft Word (.docx) fayl va oxirgi sahifada QR-kod yaratish.
 */
export async function generateAcademicDocx(
  input: AcademicDocxExportInput
): Promise<AcademicDocxExportResult> {
  const topic = (input.topic || "Akademik Hujjat").trim();
  const workType = (input.workType || "Kurs ishi").trim();
  const subject = (input.subject || "Mutaxassislik fani").trim();
  const university = (input.university || "Oliy ta'lim muassasasi").trim();
  const studentName = (input.studentName || "Talaba").trim();
  const language = input.language || "uz";

  // 1. To'liq matnni yig'ish va statistikani hisoblash
  const combinedMarkdown =
    input.pages && input.pages.length > 0
      ? input.pages.map((p) => p.content).join("\n\n---\n\n")
      : input.markdownContent || "";

  const wordCount = combinedMarkdown
    .replace(/[#*|_\-]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;

  const pagesEstimate =
    input.pages && input.pages.length > 0
      ? input.pages.length
      : Math.max(1, Math.round(wordCount / 260));

  const contentHash = crypto
    .createHash("sha256")
    .update(`${topic}|${workType}|${combinedMarkdown.slice(0, 4000)}`)
    .digest("hex")
    .slice(0, 16);

  // 2. Noyob verifikatsiya kodi va URL yaratish
  const verificationCode =
    input.documentId && input.documentId.startsWith("DN-")
      ? input.documentId
      : generateVerificationCode(topic, studentName);

  const verificationPayload: AcademicVerificationPayload = {
    code: verificationCode,
    topic,
    workType,
    subject,
    university,
    faculty: input.faculty,
    studentName,
    teacherName: input.teacherName,
    language,
    pagesEstimate,
    wordCount,
    issuedAt: new Date().toISOString(),
    contentHash,
  };

  const verificationUrl = await registerDocumentVerification(verificationPayload);

  // 3. Sahifalar yoki Markdown matnni DOCX elementlariga o'girish
  const documentChildren: Array<Paragraph | Table> = [];

  if (input.pages && input.pages.length > 0) {
    input.pages.forEach((page, pageIdx) => {
      if (pageIdx > 0) {
        documentChildren.push(
          new Paragraph({
            children: [new PageBreak()],
          })
        );
      }
      const pageNodes = parseMarkdownBlockToDocxNodes(page.content, {
        isCoverPage: pageIdx === 0 || page.type === "title",
      });
      documentChildren.push(...pageNodes);
    });
  } else {
    const nodes = parseMarkdownBlockToDocxNodes(combinedMarkdown, {
      isCoverPage: true,
    });
    documentChildren.push(...nodes);
  }

  // 4. Akademik hujjatlarga QR-kod avtomatik joylashtirilmaydi (10-bo'lim qoidasi).
  // Faqat includeQrVerification === true bo'lgandagina qo'shiladi.
  if (input.includeQrVerification === true) {
    const qrFooterNodes = await buildQrVerificationFooterNodes({
      verificationCode,
      verificationUrl,
      payload: verificationPayload,
      separatePage: Boolean(input.qrOnSeparatePage),
    });
    documentChildren.push(...qrFooterNodes);
  }

  // 5. Rasmiy GOST / MOVSO RUz sahifa va shrift sozlamalari bilan Document yaratish
  const doc = new Document({
    creator: "DocNova AI Academic Platform",
    title: `${workType}: ${topic}`,
    subject: `${subject} — ${topic}`,
    description: `DocNova AI tomonidan yaratilgan va tasdiqlangan akademik hujjat (${verificationCode})`,
    styles: {
      default: {
        document: {
          run: {
            font: {
              ascii: "Times New Roman",
              hAnsi: "Times New Roman",
              cs: "Times New Roman",
              eastAsia: "Times New Roman",
            },
            size: 28, // 14pt
            color: "000000",
          },
          paragraph: {
            spacing: {
              line: 360, // 1.5 interval
              lineRule: LineRuleType.AUTO,
              after: 120,
            },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          titlePage: true, // 1-betda (Titul varag'ida) sahifa raqami ko'rsatilmaydi
          page: {
            size: {
              width: convertMillimetersToTwip(210), // A4 eni: 210 mm
              height: convertMillimetersToTwip(297), // A4 bo'yi: 297 mm
            },
            margin: {
              top: convertMillimetersToTwip(20), // Yuqoridan: 20 mm (2 sm)
              bottom: convertMillimetersToTwip(20), // Pastdan: 20 mm (2 sm)
              left: convertMillimetersToTwip(30), // Chapdan (muqovalash uchun): 30 mm (3 sm)
              right: convertMillimetersToTwip(15), // O'ngdan: 15 mm (1.5 sm)
              header: convertMillimetersToTwip(12.5),
              footer: convertMillimetersToTwip(12.5),
            },
          },
        },
        footers: {
          // 1-bet uchun bo'sh kolontitul (Titul varag'i raqamlanmaydi)
          first: new Footer({
            children: [],
          }),
          // 2-betdan boshlab pastki markazda sahifa raqami (GOST standarti)
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                indent: { firstLine: 0 },
                spacing: { before: 0, after: 0 },
                children: [
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: "Times New Roman",
                    size: 24, // 12pt
                    color: "000000",
                  }),
                ],
              }),
            ],
          }),
        },
        children: documentChildren,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);

  // Xavfsiz va tushunarli fayl nomi (.docx)
  const cleanWorkPrefix = workType
    .replace(/[^a-zA-Z0-9\u0400-\u04FF]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 24);
  const cleanTopicSlug = topic
    .replace(/[^a-zA-Z0-9\u0400-\u04FF]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 45);

  const fileName = input.includeQrVerification
    ? `${cleanWorkPrefix || "Hujjat"}_${cleanTopicSlug || "DocNova"}_${verificationCode}.docx`
    : `${cleanWorkPrefix || "Hujjat"}_${cleanTopicSlug || "DocNova"}.docx`;

  return {
    buffer,
    fileName,
    verificationCode,
    verificationUrl,
    verificationPayload,
  };
}
