import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import {
  ALLOWED_DIRECT_UPLOAD_MIME_TYPES,
  DIRECT_UPLOAD_MAX_BYTES,
  type DirectUploadFolder,
  isAllowedDirectUploadFile,
  isValidDirectStoragePath,
} from "@/lib/storage/direct-upload-shared";
import {
  createSupabaseSignedUploadUrl,
  getActiveDirectStorageProvider,
} from "@/lib/storage/direct-upload-server";

export const dynamic = "force-dynamic";

const ALLOWED_FOLDERS: DirectUploadFolder[] = ["samples", "topics", "pdf"];

export async function GET() {
  const provider = getActiveDirectStorageProvider();
  return NextResponse.json({
    available: Boolean(provider),
    provider,
    maxBytes: DIRECT_UPLOAD_MAX_BYTES,
  });
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Noto'g'ri JSON so'rovi." }, { status: 400 });
  }

  // 1. Supabase Storage Signed Upload URL handshake
  if (body.action === "create-signed-url") {
    try {
      const folder = ALLOWED_FOLDERS.includes(body.folder as DirectUploadFolder)
        ? (body.folder as DirectUploadFolder)
        : "samples";
      const fileName = typeof body.fileName === "string" ? body.fileName : "";
      const fileSize = typeof body.fileSize === "number" ? body.fileSize : 0;
      const mimeType = typeof body.mimeType === "string" ? body.mimeType : "";

      if (!fileName || fileSize <= 0) {
        return NextResponse.json(
          { error: "Fayl nomi va hajmi ko'rsatilishi shart." },
          { status: 400 }
        );
      }

      const signed = await createSupabaseSignedUploadUrl({
        folder,
        fileName,
        fileSize,
        mimeType,
      });

      return NextResponse.json(signed);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Signed Upload URL yaratishda xatolik yuz berdi.";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  // 2. Vercel Blob Client Upload token exchange
  if (body.type === "blob.generate-client-token" || body.type === "blob.upload-completed") {
    try {
      const jsonResponse = await handleUpload({
        body: body as unknown as HandleUploadBody,
        request,
        onBeforeGenerateToken: async (pathname) => {
          if (!isValidDirectStoragePath(pathname) || !isAllowedDirectUploadFile(pathname)) {
            throw new Error("Ruxsat etilmagan fayl turi yoki yo'li.");
          }

          return {
            allowedContentTypes: ALLOWED_DIRECT_UPLOAD_MIME_TYPES,
            maximumSizeInBytes: DIRECT_UPLOAD_MAX_BYTES,
            addRandomSuffix: true,
            ttlDays: 1,
          };
        },
        onUploadCompleted: async () => {
          // Processing routes handle reading and cleaning up temporary blobs
        },
      });

      return NextResponse.json(jsonResponse);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Yuklash tokenini yaratishda xatolik yuz berdi.";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  return NextResponse.json({ error: "Noto'g'ri yuklash so'rovi." }, { status: 400 });
}
