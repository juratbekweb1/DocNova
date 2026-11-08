import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth-options";
import { generateAcademicDocx } from "@/lib/academic-docx-exporter";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Telegram WebApp va In-App brauzerlar (`blob:` yuklamalarni bloklovchi WebView'lar)
 * uchun 5 daqiqalik tezkor xotira keshi.
 * Bu orqali `GET /api/academic/export-docx?dl=<token>` haqiqiy HTTPS manzildan
 * faylni native OS downloader orqali yuklab bera oladi.
 */
interface CachedDocxEntry {
  buffer: Buffer;
  fileName: string;
  verificationCode: string;
  verificationUrl: string;
  ownerUserId?: string;
  expiresAt: number;
}

const DOCX_CACHE_TTL_MS = 5 * 60 * 1000; // 5 daqiqa
const docxDownloadCache = new Map<string, CachedDocxEntry>();

function cleanupExpiredCache() {
  const now = Date.now();
  for (const [key, entry] of docxDownloadCache.entries()) {
    if (entry.expiresAt <= now) {
      docxDownloadCache.delete(key);
    }
  }
}

const ExportDocxSchema = z.object({
  topic: z.string().min(1, "Mavzu kiritilishi shart").max(500),
  markdownContent: z.string().optional().default(""),
  pages: z
    .array(
      z.object({
        pageNumber: z.number(),
        type: z.string().optional(),
        title: z.string().optional(),
        content: z.string(),
      })
    )
    .optional(),
  workType: z.string().max(150).optional().default("Kurs ishi"),
  subject: z.string().max(250).optional().default("Mutaxassislik fani"),
  university: z.string().max(250).optional().default("Oliy ta'lim muassasasi"),
  faculty: z.string().max(250).optional(),
  studentName: z.string().max(150).optional().default("Talaba"),
  teacherName: z.string().max(150).optional(),
  language: z.enum(["uz", "uz-cyrl", "ru", "en"]).optional().default("uz"),
  year: z.union([z.string(), z.number()]).optional(),
  documentId: z.string().max(100).optional(),
  includeQrVerification: z.boolean().optional().default(false),
  qrOnSeparatePage: z.boolean().optional().default(false),
});

/**
 * GET /api/academic/export-docx?dl=<token>
 * Telegram WebApp (`Telegram.WebApp.downloadFile`) va In-App WebView'lar uchun
 * to'g'ridan-to'g'ri HTTPS `Content-Disposition: attachment` oqimi.
 * Foydalanuvchilararo fayl izolyatsiyasi (ownerUserId) tekshiriladi.
 */
export async function GET(req: NextRequest) {
  cleanupExpiredCache();
  const dlToken = req.nextUrl.searchParams.get("dl");

  if (!dlToken || !docxDownloadCache.has(dlToken)) {
    return NextResponse.json(
      { error: "Yuklab olish havolasi muddati tugagan. Iltimos, qayta yuklab oling." },
      { status: 404 }
    );
  }

  const entry = docxDownloadCache.get(dlToken)!;
  if (entry.ownerUserId) {
    const session = await getServerSession(authOptions).catch(() => null);
    if (!session?.user?.id || session.user.id !== entry.ownerUserId) {
      return NextResponse.json(
        { error: "Ushbu faylni yuklab olish uchun ruxsatingiz yo'q." },
        { status: 403 }
      );
    }
  }
  const asciiFileName = entry.fileName.replace(/[^\x20-\x7E]/g, "_");
  const utf8FileName = encodeURIComponent(entry.fileName);

  return new NextResponse(new Uint8Array(entry.buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${asciiFileName}"; filename*=UTF-8''${utf8FileName}`,
      "Content-Length": String(entry.buffer.byteLength),
      "Cache-Control": "private, no-transform, no-store, max-age=0",
      "X-DocNova-Verification-Code": entry.verificationCode,
      "X-DocNova-Verification-Url": entry.verificationUrl,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    cleanupExpiredCache();
    const session = await getServerSession(authOptions).catch(() => null);
    const body = await req.json();

    const parsed = ExportDocxSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Noto'g'ri so'rov ma'lumotlari",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const hasPages = Array.isArray(data.pages) && data.pages.length > 0;
    const hasMarkdown = Boolean(data.markdownContent && data.markdownContent.trim().length > 0);

    if (!hasPages && !hasMarkdown) {
      return NextResponse.json(
        { error: "Eksport qilish uchun hujjat matni bo'sh bo'lmasligi kerak" },
        { status: 400 }
      );
    }

    const exported = await generateAcademicDocx({
      topic: data.topic,
      markdownContent: data.markdownContent,
      pages: data.pages,
      workType: data.workType,
      subject: data.subject,
      university: data.university,
      faculty: data.faculty,
      studentName: data.studentName || session?.user?.name || "Talaba",
      teacherName: data.teacherName,
      language: data.language,
      year: data.year,
      userId: session?.user?.id,
      documentId: data.documentId,
      includeQrVerification: data.includeQrVerification,
      qrOnSeparatePage: data.qrOnSeparatePage,
    });

    // Telegram / In-App brauzer fallback uchun 5 daqiqalik yuklab olish tokenini saqlash
    const downloadToken = crypto.randomBytes(16).toString("hex");
    docxDownloadCache.set(downloadToken, {
      buffer: exported.buffer,
      fileName: exported.fileName,
      verificationCode: exported.verificationCode,
      verificationUrl: exported.verificationUrl,
      ownerUserId: session?.user?.id,
      expiresAt: Date.now() + DOCX_CACHE_TTL_MS,
    });

    const asciiFileName = exported.fileName.replace(/[^\x20-\x7E]/g, "_");
    const utf8FileName = encodeURIComponent(exported.fileName);

    return new NextResponse(new Uint8Array(exported.buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${asciiFileName}"; filename*=UTF-8''${utf8FileName}`,
        "Content-Length": String(exported.buffer.byteLength),
        "Cache-Control": "private, no-transform, no-store, max-age=0",
        "X-DocNova-Verification-Code": exported.verificationCode,
        "X-DocNova-Verification-Url": exported.verificationUrl,
        "X-DocNova-Download-Token": downloadToken,
      },
    });
  } catch (error) {
    console.error("[ACADEMIC_EXPORT_DOCX_ERROR]", error);
    return NextResponse.json(
      { error: "Word (.docx) faylni shakllantirishda xatolik yuz berdi" },
      { status: 500 }
    );
  }
}
