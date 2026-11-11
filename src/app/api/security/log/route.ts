import { NextResponse } from "next/server";
import { logSecurityEvent, type SecurityEventType } from "@/lib/security-logger";
import { getInternalSecret, verifySharedSecret } from "@/lib/security/internal-secret";

export const runtime = "nodejs";

const ALLOWED_EVENT_TYPES = new Set<SecurityEventType>([
  "RATE_LIMIT",
  "BRUTE_FORCE",
  "MALICIOUS_PAYLOAD",
  "UNAUTHORIZED_ACCESS",
]);

export async function POST(req: Request) {
  try {
    const expectedSecret = getInternalSecret();
    if (!expectedSecret) {
      return NextResponse.json(
        { error: "Security logging secret is not configured" },
        { status: 503 }
      );
    }

    const secret = req.headers.get("x-internal-secret");
    if (!verifySharedSecret(secret, expectedSecret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { eventType, ipAddress, path, userAgent, details } = body ?? {};

    if (
      !eventType ||
      typeof eventType !== "string" ||
      !ALLOWED_EVENT_TYPES.has(eventType as SecurityEventType)
    ) {
      return NextResponse.json({ error: "Invalid or missing eventType" }, { status: 400 });
    }

    await logSecurityEvent({
      eventType: eventType as SecurityEventType,
      ipAddress: typeof ipAddress === "string" ? ipAddress.slice(0, 128) : undefined,
      path: typeof path === "string" ? path.slice(0, 512) : undefined,
      userAgent: typeof userAgent === "string" ? userAgent.slice(0, 512) : undefined,
      details: details && typeof details === "object" ? details : undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[SECURITY_LOG_ENDPOINT_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
