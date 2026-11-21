import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PasswordResetService } from "@/core/auth/password-reset-service";
import { PrismaPasswordResetRepository } from "@/core/auth/prisma-password-reset-repository";

export const dynamic = "force-dynamic";

const forgotSchema = z.object({
  email: z.string().email("Yaroqli email manzilini kiriting"),
});

const passwordResetService = new PasswordResetService(new PrismaPasswordResetRepository());

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = forgotSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Yaroqli email manzilini kiriting." }, { status: 400 });
    }

    const result = await passwordResetService.requestReset(parsed.data.email);

    return NextResponse.json({
      success: true,
      message:
        result.message ||
        "Agar ushbu email bilan hisob mavjud bo'lsa, parolni tiklash havolasi yuboriladi.",
    });
  } catch (error) {
    console.error("[Forgot Password API] Error:", error);
    return NextResponse.json(
      { error: "Parolni tiklash so'rovini qayta ishlashda xatolik yuz berdi." },
      { status: 500 }
    );
  }
}
