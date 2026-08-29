import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/auth.config";
import { storage } from "@/lib/storage";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported file type (JPEG, PNG, WEBP only)" }, { status: 400 });
    }

    // Check if user already has an avatar and delete it from storage
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatar: true },
    });

    if (user?.avatar && user.avatar.startsWith("/uploads/")) {
      await storage.deleteFile(user.avatar).catch(console.error);
    }

    // Upload new file
    const pathPrefix = `avatars/${session.user.id}`;
    const url = await storage.uploadFile(file, pathPrefix);

    // Save to DB
    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatar: url },
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json({ error: "Failed to upload avatar" }, { status: 500 });
  }
}
