import { NextRequest, NextResponse } from "next/server";
import {
  analyzeSampleDocument,
  sanitizeSafeFileName,
  sanitizeUntrustedSampleText,
  validateSampleFileBuffer,
} from "@/lib/academic-sample-intelligence";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Fayl topilmadi" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const validation = validateSampleFileBuffer({
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      buffer,
    });

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    let rawText = "";

    try {
      if (validation.ext === ".txt") {
        rawText = buffer.toString("utf-8");
      } else if (validation.ext === ".docx") {
        const mammothModule = await import("mammoth");
        const mammoth =
          (mammothModule as unknown as { default?: typeof mammothModule }).default || mammothModule;
        const result = await mammoth.extractRawText({ buffer });
        rawText = result.value || "";
      } else if (validation.ext === ".pdf") {
        const pdfParseModule = await import("pdf-parse");
        const pdfParse = pdfParseModule.default || pdfParseModule;
        const data = await pdfParse(buffer);
        rawText = data.text || "";
      }
    } catch {
      return NextResponse.json(
        {
          error:
            "Fayl shikastlangan, parol bilan himoyalangan yoki matni ajratib olinmaydigan formatda. Iltimos, boshqa DOCX/PDF fayl yuklang yoki «Noldan yaratish» rejimidan foydalaning.",
        },
        { status: 422 }
      );
    }

    const sanitized = sanitizeUntrustedSampleText(rawText);
    if (!sanitized || sanitized.replace(/\s+/g, "").length < 20) {
      return NextResponse.json(
        {
          error:
            "Ushbu fayldan matn ajratib olinmadi (fayl bo'sh yoki faqat skanerlangan rasmdan iborat). Iltimos, matnli DOCX/PDF yuklang yoki «Noldan yaratish» rejimini tanlang.",
        },
        { status: 422 }
      );
    }

    const analysis = analyzeSampleDocument({
      rawText: sanitized,
      fileName: file.name,
      fileSize: file.size,
    });

    return NextResponse.json({
      success: true,
      text: analysis.structuralBlueprint,
      charCount: sanitized.length,
      fileName: sanitizeSafeFileName(file.name),
      analysis,
    });
  } catch {
    return NextResponse.json(
      { error: "Faylni tahlil qilishda kutilmagan xatolik yuz berdi." },
      { status: 500 }
    );
  }
}
