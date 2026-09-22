import { prisma } from "@/lib/prisma";

export type SecurityEventType = "RATE_LIMIT" | "BRUTE_FORCE" | "MALICIOUS_PAYLOAD" | "UNAUTHORIZED_ACCESS";

interface SecurityLogParams {
  eventType: SecurityEventType;
  ipAddress?: string;
  userAgent?: string;
  path?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details?: Record<string, any>;
}

export async function logSecurityEvent({
  eventType,
  ipAddress,
  userAgent,
  path,
  details,
}: SecurityLogParams) {
  try {
    await prisma.securityLog.create({
      data: {
        eventType,
        ipAddress: ipAddress || "Unknown",
        userAgent: userAgent || "Unknown",
        path: path || "Unknown",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        details: details ? (details as any) : null,
      },
    });
  } catch (error) {
    console.error("[SECURITY_LOGGER_ERROR] Failed to log security event", error);
  }
}
