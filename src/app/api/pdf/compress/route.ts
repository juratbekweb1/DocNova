import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { checkPdfLimit, increasePdfLimit } from "@/lib/pdf-limit";
import { PDFDocument } from "pdf-lib";
import {
  deleteUploadedStorageFile,
  downloadUploadedStorageFile,
  storeProcessedOutputAndGetDownloadUrl,
} from "@/lib/storage/direct-upload-server";
import {
  DIRECT_UPLOAD_MAX_BYTES,
  SERVERLESS_SAFE_BODY_BYTES,
  type UploadedStorageFile,
} from "@/lib/storage/direct-upload-shared";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let uploadedRef: UploadedStorageFile | null = null;

  try {
    // 1. Session check - if authenticated, check user limits, otherwise allow guest usage
    const session = await getServerSession(authOptions).catch(() => null);
    if (session?.user?.id) {
      const hasLimit = await checkPdfLimit(session.user.id).catch(() => true);
      if (!hasLimit) {
        return NextResponse.json(
          {
            error: "Kunlik PDF amallar limitingiz tugagan. Davom etish uchun tarifni yangilang.",
            requireUpgrade: true,
          },
          { status: 403 }
        );
      }
    }

    // 2. Load PDF from either direct storage reference (JSON, no 4.5MB cap) or FormData fallback
    const contentType = (req.headers.get("content-type") || "").toLowerCase();
    let inputBytes: Buffer;
    let safeBaseName = "document.pdf";

    if (contentType.includes("application/json")) {
      const body = (await req.json().catch(() => ({}))) as {
        storageFile?: UploadedStorageFile;
      };
      if (!body.storageFile?.provider || !body.storageFile?.path) {
        return NextResponse.json(
          { error: "Yuklangan PDF fayl havolasi topilmadi." },
          { status: 400 }
        );
      }
      uploadedRef = body.storageFile;
      const downloaded = await downloadUploadedStorageFile(
        body.storageFile,
        DIRECT_UPLOAD_MAX_BYTES
      );
      inputBytes = downloaded.buffer;
      safeBaseName = body.storageFile.fileName || "document.pdf";
    } else {
      const formData = await req.formData();
      const file = formData.get("file") as File;

      if (!file || typeof file !== "object" || !("arrayBuffer" in file)) {
        return NextResponse.json({ error: "PDF fayl yuklanishi shart" }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      inputBytes = Buffer.from(arrayBuffer);
      safeBaseName = file.name || "document.pdf";
    }

    if (!inputBytes || inputBytes.byteLength === 0) {
      return NextResponse.json({ error: "Yuklangan PDF fayli bo'sh" }, { status: 400 });
    }

    const originalSize = inputBytes.byteLength;

    // 3. Load & compress PDF document
    const pdf = await PDFDocument.load(inputBytes, {
      ignoreEncryption: true,
      throwOnInvalidObject: false,
      updateMetadata: false,
    });

    const compressedPdfBytes = await pdf.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 50,
      updateFieldAppearances: false,
    });

    const compressedSize = Math.min(originalSize, compressedPdfBytes.byteLength);
    const finalBuffer =
      compressedPdfBytes.byteLength <= originalSize ? Buffer.from(compressedPdfBytes) : inputBytes;

    // Track usage if authenticated
    if (session?.user?.id) {
      await increasePdfLimit(session.user.id).catch((err) => {
        console.warn("[PDF Compress] Limit oshirishda xatolik:", err);
      });
    }

    const outputFileName = `docnova_compressed_${safeBaseName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

    // If result exceeds Vercel's safe serverless response threshold (3.5 MB),
    // store in cloud storage and return a direct signed download URL!
    if (finalBuffer.byteLength > SERVERLESS_SAFE_BODY_BYTES) {
      const storedOutput = await storeProcessedOutputAndGetDownloadUrl({
        buffer: finalBuffer,
        fileName: outputFileName,
        mimeType: "application/pdf",
      });

      if (storedOutput) {
        return NextResponse.json({
          downloadUrl: storedOutput.downloadUrl,
          fileName: outputFileName,
          originalSize,
          compressedSize,
        });
      }
    }

    return new NextResponse(new Uint8Array(finalBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${outputFileName}"`,
        "X-Original-Size": originalSize.toString(),
        "X-Compressed-Size": compressedSize.toString(),
        "Content-Length": finalBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("[PDF Compress API] Fatal error:", error);
    const message =
      error instanceof Error ? error.message : "PDF siqish jarayonida server xatoligi yuz berdi";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (uploadedRef) {
      await deleteUploadedStorageFile(uploadedRef);
    }
  }
}
