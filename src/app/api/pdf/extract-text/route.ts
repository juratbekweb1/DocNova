import { NextRequest, NextResponse } from "next/server";
import { sanitizePromptText } from "@/components/ui/secure-file-upload-zone";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Fayl topilmadi" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Fayl hajmi 10 MB dan oshmasligi kerak" }, { status: 400 });
    }

    const lowerName = file.name.toLowerCase();
    let rawText = "";

    if (lowerName.endsWith(".txt")) {
      rawText = await file.text();
    } else if (lowerName.endsWith(".docx")) {
      const mammoth = await import("mammoth");
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await mammoth.extractRawText({ buffer });
      rawText = result.value || "";
    } else if (lowerName.endsWith(".pdf")) {
      const pdfParseModule = await import("pdf-parse");
      const pdfParse = pdfParseModule.default || pdfParseModule;
      const buffer = Buffer.from(await file.arrayBuffer());
      const data = await pdfParse(buffer);
      rawText = data.text || "";
    } else {
      return NextResponse.json(
        { error: "Faqat .txt, .docx va .pdf qabul qilinadi" },
        { status: 400 }
      );
    }

    const sanitized = sanitizePromptText(rawText);

    return NextResponse.json({
      success: true,
      text: sanitized,
      charCount: sanitized.length,
      fileName: file.name,
    });
  } catch (err: unknown) {
    console.error("[EXTRACT_TEXT_API_ERR]", err);
    const msg = err instanceof Error ? err.message : "Faylni tahlil qilishda xatolik";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
