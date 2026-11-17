import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { checkPdfLimit, increasePdfLimit } from "@/lib/pdf-limit";
import pdfParse from "pdf-parse";
import {
  deleteUploadedStorageFile,
  downloadUploadedStorageFile,
} from "@/lib/storage/direct-upload-server";
import {
  DIRECT_UPLOAD_MAX_BYTES,
  type UploadedStorageFile,
} from "@/lib/storage/direct-upload-shared";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let uploadedRef: UploadedStorageFile | null = null;

  try {
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

    const contentType = (req.headers.get("content-type") || "").toLowerCase();
    let buffer: Buffer;

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
      buffer = downloaded.buffer;
    } else {
      const formData = await req.formData();
      const file = formData.get("file") as File;

      if (!file || typeof file !== "object" || !("arrayBuffer" in file)) {
        return NextResponse.json({ error: "PDF fayl yuklanishi shart" }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    if (!buffer || buffer.byteLength === 0) {
      return NextResponse.json({ error: "Yuklangan PDF fayli bo'sh" }, { status: 400 });
    }

    type PdfParseFn = (dataBuffer: Buffer) => Promise<{ text: string }>;
    const pdfModule = pdfParse as unknown as PdfParseFn | { default?: PdfParseFn };
    const parsePdf: PdfParseFn =
      typeof pdfModule === "function" ? pdfModule : pdfModule.default || (pdfParse as PdfParseFn);
    const data = await parsePdf(buffer);

    if (session?.user?.id) {
      await increasePdfLimit(session.user.id).catch((err) => {
        console.warn("[PDF to Word] Limit oshirishda xatolik:", err);
      });
    }

    return NextResponse.json({ text: data.text });
  } catch (error) {
    console.error("[PDF to Word API] Error:", error);
    const message =
      error instanceof Error ? error.message : "PDF matnini ajratib olishda xatolik yuz berdi";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (uploadedRef) {
      await deleteUploadedStorageFile(uploadedRef);
    }
  }
}
