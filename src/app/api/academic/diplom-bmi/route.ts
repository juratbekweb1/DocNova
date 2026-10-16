export const maxDuration = 60;
import { NextRequest, NextResponse } from "next/server";
import { POST as handleAcademicPost } from "@/app/api/ai/academic/route";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const payload = {
      ...body,
      action: body.action || "generate-bmi",
    };

    const forwardReq = new Request(req.url, {
      method: "POST",
      headers: req.headers,
      body: JSON.stringify(payload),
    });

    return handleAcademicPost(forwardReq);
  } catch (error) {
    console.error("[DIPLOM_BMI_ROUTE_ERROR]", error);
    return NextResponse.json(
      { error: "Diplom / BMI yaratishda xatolik yuz berdi" },
      { status: 500 }
    );
  }
}
