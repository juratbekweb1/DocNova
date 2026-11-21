import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PasswordResetService } from "@/core/auth/password-reset-service";
import { PrismaPasswordResetRepository } from "@/core/auth/prisma-password-reset-repository";

export const dynamic = "force-dynamic";

const resetSchema = z.object({
  token: z.string().min(1, "Tiklash tokeni ko'rsatilmagan"),
  password: z.string().min(8, "Yangi parol kamida 8 ta belgidan iborat bo'lishi kerak"),
});

const passwordResetService = new PasswordResetService(new PrismaPasswordResetRepository());

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = resetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Noto'g'ri ma'lumotlar. Parol kamida 8 ta belgidan iborat bo'lishi kerak." },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;
    await passwordResetService.resetPassword(token, password);

    return NextResponse.json({
      success: true,
      message:
        "Parol muvaffaqiyatli yangilandi. Endi yangi parol bilan tizimga kirishingiz mumkin.",
    });
  } catch (error) {
    console.error("[Reset Password API] Error:", error);
    const message =
      error instanceof Error ? error.message : "Parolni yangilashda xatolik yuz berdi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
