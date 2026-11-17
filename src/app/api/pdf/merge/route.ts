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
  const uploadedRefs: UploadedStorageFile[] = [];

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

    // 2. Collect input PDF buffers from either direct storage refs (JSON) or FormData fallback
    const contentType = (req.headers.get("content-type") || "").toLowerCase();
    const inputDocs: Array<{ name: string; buffer: Buffer }> = [];

    if (contentType.includes("application/json")) {
      const body = (await req.json().catch(() => ({}))) as {
        storageFiles?: UploadedStorageFile[];
      };
      const refs = Array.isArray(body.storageFiles) ? body.storageFiles : [];
      if (refs.length < 2) {
        return NextResponse.json(
          { error: "Birlashtirish uchun kamida 2 ta PDF fayl yuklanishi shart." },
          { status: 400 }
        );
      }
      uploadedRefs.push(...refs);

      for (const ref of refs) {
        const downloaded = await downloadUploadedStorageFile(ref, DIRECT_UPLOAD_MAX_BYTES);
        inputDocs.push({
          name: ref.fileName || ref.path.split("/").pop() || "document.pdf",
          buffer: downloaded.buffer,
        });
      }
    } else {
      const formData = await req.formData();
      const rawFiles = formData.getAll("files");

      for (const item of rawFiles) {
        if (item && typeof item === "object" && "arrayBuffer" in item) {
          const f = item as File;
          inputDocs.push({
            name: f.name || "document.pdf",
            buffer: Buffer.from(await f.arrayBuffer()),
          });
        }
      }

      if (inputDocs.length < 2) {
        return NextResponse.json(
          { error: "Birlashtirish uchun kamida 2 ta PDF fayl yuklanishi shart." },
          { status: 400 }
        );
      }
    }

    // 3. Create merged PDF document
    const mergedPdf = await PDFDocument.create();

    for (const item of inputDocs) {
      try {
        if (!item.buffer || item.buffer.byteLength === 0) {
          console.warn(`[PDF Merge] Bo'sh fayl o'tkazib yuborildi: ${item.name}`);
          continue;
        }

        const pdf = await PDFDocument.load(item.buffer, {
          ignoreEncryption: true,
          throwOnInvalidObject: false,
          updateMetadata: false,
        });

        const pageIndices = pdf.getPageIndices();
        if (pageIndices.length > 0) {
          const copiedPages = await mergedPdf.copyPages(pdf, pageIndices);
          for (const page of copiedPages) {
            mergedPdf.addPage(page);
          }
        }
      } catch (fileErr) {
        console.error(`[PDF Merge] Faylni yuklashda xatolik (${item.name}):`, fileErr);
        throw new Error(
          `"${item.name}" faylini o'qishda xatolik yuz berdi. PDF formati to'g'riligini tekshiring.`
        );
      }
    }

    if (mergedPdf.getPageCount() === 0) {
      return NextResponse.json(
        { error: "Yuklangan fayllarda sahifalar mavjud emas yoki fayllar buzilgan." },
        { status: 400 }
      );
    }

    const mergedPdfBytes = Buffer.from(await mergedPdf.save({ useObjectStreams: true }));

    // Track usage if authenticated
    if (session?.user?.id) {
      await increasePdfLimit(session.user.id).catch((err) => {
        console.warn("[PDF Merge] Limit oshirishda xatolik:", err);
      });
    }

    if (mergedPdfBytes.byteLength > SERVERLESS_SAFE_BODY_BYTES) {
      const storedOutput = await storeProcessedOutputAndGetDownloadUrl({
        buffer: mergedPdfBytes,
        fileName: "docnova_merged.pdf",
        mimeType: "application/pdf",
      });

      if (storedOutput) {
        return NextResponse.json({
          downloadUrl: storedOutput.downloadUrl,
          fileName: "docnova_merged.pdf",
          totalSize: mergedPdfBytes.byteLength,
        });
      }
    }

    return new NextResponse(new Uint8Array(mergedPdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="docnova_merged.pdf"',
        "Content-Length": mergedPdfBytes.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("[PDF Merge API] Fatal error:", error);
    const message =
      error instanceof Error ? error.message : "PDF birlashtirishda server xatoligi yuz berdi";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (uploadedRefs.length > 0) {
      await Promise.all(uploadedRefs.map((ref) => deleteUploadedStorageFile(ref)));
    }
  }
}
