import { NextRequest, NextResponse } from "next/server";
import {
  analyzeSampleDocument,
  MAX_SAMPLE_FILE_BYTES,
  sanitizeSafeFileName,
  sanitizeUntrustedSampleText,
  validateSampleFileBuffer,
} from "@/lib/academic-sample-intelligence";
import {
  deleteUploadedStorageFile,
  downloadUploadedStorageFile,
} from "@/lib/storage/direct-upload-server";
import type { UploadedStorageFile } from "@/lib/storage/direct-upload-shared";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let uploadedRef: UploadedStorageFile | null = null;

  try {
    const contentType = (req.headers.get("content-type") || "").toLowerCase();
    let buffer: Buffer;
    let fileName: string;
    let fileSize: number;
    let mimeType: string;

    if (contentType.includes("application/json")) {
      const body = (await req.json().catch(() => ({}))) as {
        storageFile?: UploadedStorageFile;
      };
      const storageFile = body.storageFile;
      if (!storageFile || !storageFile.provider || !storageFile.path) {
        return NextResponse.json(
          { error: "Yuklangan fayl havolasi (storageFile) topilmadi." },
          { status: 400 }
        );
      }
      uploadedRef = storageFile;
      const downloaded = await downloadUploadedStorageFile(storageFile, MAX_SAMPLE_FILE_BYTES);
      buffer = downloaded.buffer;
      fileName = storageFile.fileName || storageFile.path.split("/").pop() || "namuna.pdf";
      fileSize = buffer.byteLength;
      mimeType = storageFile.mimeType || downloaded.mimeType;
    } else {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ error: "Fayl topilmadi" }, { status: 400 });
      }

      buffer = Buffer.from(await file.arrayBuffer());
      fileName = file.name;
      fileSize = file.size;
      mimeType = file.type;
    }

    const validation = validateSampleFileBuffer({
      fileName,
      fileSize,
      mimeType,
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
        const pdfParseModule = await import("pdf-parse/lib/pdf-parse.js");
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
      fileName,
      fileSize,
    });

    return NextResponse.json({
      success: true,
      text: analysis.structuralBlueprint,
      charCount: sanitized.length,
      fileName: sanitizeSafeFileName(fileName),
      analysis,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Faylni tahlil qilishda kutilmagan xatolik yuz berdi.";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (uploadedRef) {
      await deleteUploadedStorageFile(uploadedRef);
    }
  }
}
