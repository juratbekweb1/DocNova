import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { docnovaAiBot } from "@/lib/telegram-docnova-ai";

export async function GET(req: NextRequest) {
  try {
    // 1. Strict Authentication: Must be SUPER_ADMIN / ADMIN or present the secure admin key
    const url = new URL(req.url);
    const adminKey = req.headers.get("x-admin-key") || url.searchParams.get("adminKey");
    const isSecretAuthorized = Boolean(
      process.env.DOCNOVA_AI_BOT_SECRET && adminKey === process.env.DOCNOVA_AI_BOT_SECRET
    );

    const session = await getServerSession(authOptions).catch(() => null);
    const isSessionAdmin = session?.user?.role === "SUPER_ADMIN" || session?.user?.role === "ADMIN";

    if (!isSessionAdmin && !isSecretAuthorized) {
      return NextResponse.json(
        {
          error:
            "Ruxsat berilmagan: Faqat tizim administratori (SUPER_ADMIN/ADMIN) yoki maxfiy adminKey bilan chaqirish mumkin.",
        },
        { status: 403 }
      );
    }

    if (!docnovaAiBot) {
      return NextResponse.json({ error: "DOCNOVA_AI_BOT_TOKEN sozlanmagan" }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.docnova.uz";
    const webhookUrl = `${appUrl}/api/telegram/docnova-ai/webhook`;
    const secret = process.env.DOCNOVA_AI_BOT_SECRET;

    await docnovaAiBot.api.setWebhook(webhookUrl, {
      secret_token: secret,
      allowed_updates: ["message", "callback_query"],
      drop_pending_updates: false,
    });

    const webhookInfo = await docnovaAiBot.api.getWebhookInfo();

    return NextResponse.json({
      success: true,
      webhookUrl,
      webhookInfo,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[SETUP_DOCNOVA_AI_WEBHOOK_ERR]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
