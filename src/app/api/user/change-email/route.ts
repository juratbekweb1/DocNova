import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";

const changeEmailSchema = z.object({
  newEmail: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required to confirm email change"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsedData = changeEmailSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsedData.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { newEmail, password } = parsedData.data;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.email === newEmail) {
      return NextResponse.json({ error: "This is already your email" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email is already in use" }, { status: 400 });
    }

    if (user.passwordHash) {
      const bcrypt = await import("bcryptjs");
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return NextResponse.json({ error: "Invalid password" }, { status: 400 });
      }
    }

    // Generate email verification token for the new email
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

    await prisma.verificationToken.create({
      data: {
        identifier: newEmail,
        token,
        expires,
      },
    });

    // In a real application, you would send an email here with a link like:
    // /api/auth/verify-email?token=${token}&email=${newEmail}

    return NextResponse.json({
      success: true,
      message: "Verification email sent to new address (Simulated for now).",
      // Returning token only for testing purposes since we don't have an email provider setup
      testToken: token,
    });
  } catch (error) {
    console.error("Change Email Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
