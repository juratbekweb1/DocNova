import { NextRequest, NextResponse } from "next/server";
import { verifyDocumentByCode } from "@/lib/academic-docx-exporter";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params;
    const compactParam = req.nextUrl.searchParams.get("d");

    const result = await verifyDocumentByCode(code, compactParam);

    if (!result.verified || !result.payload) {
      return NextResponse.json(
        {
          verified: false,
          error: "Hujjat topilmadi yoki verifikatsiya kodi noto'g'ri",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      verified: true,
      signatureValid: result.signatureValid,
      document: result.payload,
    });
  } catch (error) {
    console.error("[ACADEMIC_VERIFY_API_ERROR]", error);
    return NextResponse.json(
      { verified: false, error: "Tekshirishda xatolik yuz berdi" },
      { status: 500 }
    );
  }
}
