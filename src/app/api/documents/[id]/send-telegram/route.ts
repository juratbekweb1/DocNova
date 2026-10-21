import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { sendDocumentToTelegram } from "@/lib/telegram";
import { PDFDocument, rgb } from "pdf-lib";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || !user.isTelegramLinked || !user.telegramChatId) {
      return NextResponse.json({ error: "Telegram not linked" }, { status: 400 });
    }

    const doc = await prisma.document.findFirst({
      where: { id, userId: user.id },
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found or access denied" }, { status: 404 });
    }

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    page.drawText(`Resume Preview (ID: ${doc.id})`, {
      x: 50,
      y: 700,
      size: 24,
      color: rgb(0, 0.53, 0.71),
    });
    page.drawText(`Title: ${(doc.title || "Document").slice(0, 60)}`, {
      x: 50,
      y: 675,
      size: 14,
    });
    page.drawText(`Generated for ${user.name || "User"}`, { x: 50, y: 650, size: 14 });
    page.drawText("This document was sent directly to your Telegram via DocNova bot.", {
      x: 50,
      y: 600,
      size: 12,
    });

    const pdfBytes = await pdfDoc.save();
    const fileBuffer = Buffer.from(pdfBytes);

    await sendDocumentToTelegram(
      user.telegramChatId,
      fileBuffer,
      `DocNova_Resume_${doc.id}.pdf`,
      "Here is your generated document!"
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[TELEGRAM_SEND_DOC_API_ERROR]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
