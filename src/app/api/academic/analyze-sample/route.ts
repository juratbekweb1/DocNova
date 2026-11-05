import { NextRequest } from "next/server";
import { POST as extractAndAnalyzePost } from "@/app/api/pdf/extract-text/route";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

/**
 * POST /api/academic/analyze-sample
 * Namuna faylni (.docx, .pdf, .txt) xavfsiz tahlil qilish,
 * tuzilmani aniqlash va eski shaxsiy ma'lumotlarni (PII) ajratish endpointi.
 */
export async function POST(req: NextRequest) {
  return extractAndAnalyzePost(req);
}
