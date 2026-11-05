import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { checkPdfLimit, increasePdfLimit } from "@/lib/pdf-limit";
import pdfParse from "pdf-parse";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
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

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file || typeof file !== "object" || !("arrayBuffer" in file)) {
      return NextResponse.json({ error: "PDF fayl yuklanishi shart" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      return NextResponse.json({ error: "Yuklangan PDF fayli bo'sh" }, { status: 400 });
    }

    const buffer = Buffer.from(arrayBuffer);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsePdf =
      typeof pdfParse === "function" ? pdfParse : (pdfParse as any)?.default || pdfParse;
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
  }
}
