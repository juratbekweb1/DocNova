import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { registerRateLimiter } from "@/lib/security/rate-limiter";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = registerRateLimiter.middleware(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { email, name, password } = await request.json();

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: "Email, name, and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
    }

    // Hash password with high cost factor for premium security
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user and a default Personal Organization
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: hashedPassword,
        organizations: {
          create: {
            role: "OWNER",
            organization: {
              create: {
                name: `${name}'s Personal Workspace`,
                slug: `personal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              },
            },
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return NextResponse.json({ message: "User created successfully", user }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
