import { NextResponse } from "next/server";
import { logSecurityEvent } from "@/lib/security-logger";

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const secret = req.headers.get("x-internal-secret");
    if (secret !== (process.env.INTERNAL_SECRET || "fallback-secret-for-dev")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { eventType, ipAddress, path, userAgent, details } = body;

    if (!eventType) {
      return NextResponse.json({ error: "Missing eventType" }, { status: 400 });
    }

    await logSecurityEvent({
      eventType,
      ipAddress,
      path,
      userAgent,
      details,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[SECURITY_LOG_ENDPOINT_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
