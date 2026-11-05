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

    // 2. Parse uploaded multipart/form-data files
    const formData = await req.formData();
    const rawFiles = formData.getAll("files");

    const files: File[] = [];
    for (const item of rawFiles) {
      if (item && typeof item === "object" && "arrayBuffer" in item) {
        files.push(item as File);
      }
    }

    if (files.length < 2) {
      return NextResponse.json(
        { error: "Birlashtirish uchun kamida 2 ta PDF fayl yuklanishi shart." },
        { status: 400 }
      );
    }

    // 3. Create merged PDF document
    const mergedPdf = await PDFDocument.create();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const arrayBuffer = await file.arrayBuffer();
        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
          console.warn(`[PDF Merge] Bo'sh fayl o'tkazib yuborildi: ${file.name}`);
          continue;
        }

        // ignoreEncryption: true enables parsing protected/bank/Chrome PDFs safely
        const pdf = await PDFDocument.load(arrayBuffer, {
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
        console.error(`[PDF Merge] Faylni yuklashda xatolik (${file.name}):`, fileErr);
        // If a specific file fails, continue with others if possible or report
        throw new Error(`"${file.name}" faylini o'qishda xatolik yuz berdi. PDF formati to'g'riligini tekshiring.`);
      }
    }

    if (mergedPdf.getPageCount() === 0) {
      return NextResponse.json(
        { error: "Yuklangan fayllarda sahifalar mavjud emas yoki fayllar buzilgan." },
        { status: 400 }
      );
    }

    // Save with object streams compression
    const mergedPdfFile = await mergedPdf.save({ useObjectStreams: true });

    // Track usage if authenticated
    if (session?.user?.id) {
      await increasePdfLimit(session.user.id).catch((err) => {
        console.warn("[PDF Merge] Limit oshirishda xatolik:", err);
      });
    }

    return new NextResponse(Buffer.from(mergedPdfFile), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="docnova_merged.pdf"',
        "Content-Length": mergedPdfFile.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("[PDF Merge API] Fatal error:", error);
    const message = error instanceof Error ? error.message : "PDF birlashtirishda server xatoligi yuz berdi";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
