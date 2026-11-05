import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { checkPdfLimit, increasePdfLimit } from "@/lib/pdf-limit";
import { PDFDocument } from "pdf-lib";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 1. Session check - if authenticated, check user limits, otherwise allow guest usage
    const session = await getServerSession(authOptions).catch(() => null);
    if (session?.user?.id) {
      const hasLimit = await checkPdfLimit(session.user.id).catch(() => true);
      if (!hasLimit) {
        return NextResponse.json(
          { error: "Kunlik PDF amallar limitingiz tugagan. Davom etish uchun tarifni yangilang.", requireUpgrade: true },
          { status: 403 }
        );
      }
    }

    // 2. Parse uploaded file
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file || typeof file !== "object" || !("arrayBuffer" in file)) {
      return NextResponse.json({ error: "PDF fayl yuklanishi shart" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      return NextResponse.json({ error: "Yuklangan PDF fayli bo'sh" }, { status: 400 });
    }

    const originalSize = arrayBuffer.byteLength;

    // 3. Load & compress PDF document
    const pdf = await PDFDocument.load(arrayBuffer, {
      ignoreEncryption: true,
      throwOnInvalidObject: false,
      updateMetadata: false,
    });

    // Save with object streams to compress structure and strip redundancy
    const compressedPdfBytes = await pdf.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 50,
      updateFieldAppearances: false,
    });

    // Determine final output size
    const compressedSize = Math.min(originalSize, compressedPdfBytes.byteLength);
    const finalBuffer = compressedPdfBytes.byteLength <= originalSize
      ? compressedPdfBytes
      : Buffer.from(arrayBuffer);

    // Track usage if authenticated
    if (session?.user?.id) {
      await increasePdfLimit(session.user.id).catch((err) => {
        console.warn("[PDF Compress] Limit oshirishda xatolik:", err);
      });
    }

    return new NextResponse(Buffer.from(finalBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="docnova_compressed_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}"`,
        "X-Original-Size": originalSize.toString(),
        "X-Compressed-Size": compressedSize.toString(),
        "Content-Length": finalBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("[PDF Compress API] Fatal error:", error);
    const message = error instanceof Error ? error.message : "PDF siqish jarayonida server xatoligi yuz berdi";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
