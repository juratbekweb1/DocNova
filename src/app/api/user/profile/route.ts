import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  username: z.string().min(3).max(30).optional(),
  displayName: z.string().max(50).optional(),
  bio: z.string().max(500).optional(),
  country: z.string().max(100).optional(),
  language: z.string().max(10).optional(),
  theme: z.string().max(20).optional(),
  timezone: z.string().max(50).optional(),
});

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsedData = updateProfileSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsedData.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsedData.data;

    // Check if username is already taken by someone else
    if (data.username) {
      const existingUser = await prisma.user.findUnique({ where: { username: data.username } });
      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json({ error: "Username is already taken" }, { status: 400 });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data,
    });

    return NextResponse.json({
      success: true,
      user: {
        name: updatedUser.name,
        username: updatedUser.username,
        displayName: updatedUser.displayName,
        bio: updatedUser.bio,
        country: updatedUser.country,
        language: updatedUser.language,
        theme: updatedUser.theme,
        timezone: updatedUser.timezone,
      },
      message: "Profile updated successfully.",
    });
  } catch (error) {
    console.error("Profile Update Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
