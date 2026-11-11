import { NextResponse } from "next/server";
import type { NextRequest, NextFetchEvent } from "next/server";
import { getToken } from "next-auth/jwt";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getInternalSecret } from "@/lib/security/internal-secret";

// Check if Upstash Redis is configured
const hasUpstashConfig =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

// Upstash rate limiters
const _upstashAuthRateLimit = hasUpstashConfig
  ? new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(5, "1 m") })
  : null;

const upstashAiRateLimit = hasUpstashConfig
  ? new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(60, "1 m") })
  : null;

const upstashPublicRateLimit = hasUpstashConfig
  ? new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(300, "1 m") })
  : null;

// In-Memory Fallback
interface RateLimitInfo {
  count: number;
  resetTime: number;
}
const memoryStore = new Map<string, RateLimitInfo>();

function getClientRateLimitKey(request: NextRequest, ip: string): string {
  const cookieHeader = request.headers.get("cookie") || "";
  const sessionMatch = cookieHeader.match(/(?:__Secure-)?next-auth\.session-token=([^;\s]+)/);
  if (sessionMatch && sessionMatch[1]) {
    // Isolate rate limit per logged-in user session so 100+ users on shared mobile CGNAT / Wi-Fi never block each other
    return `usr_${sessionMatch[1].slice(-24)}`;
  }
  return `ip_${ip}`;
}

function memoryRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  if (memoryStore.size > 2000) {
    for (const [k, v] of memoryStore.entries()) {
      if (now > v.resetTime) memoryStore.delete(k);
    }
  }
  let record = memoryStore.get(key);

  if (!record || now > record.resetTime) {
    record = { count: 1, resetTime: now + windowMs };
  } else {
    record.count++;
  }
  memoryStore.set(key, record);
  return {
    success: record.count <= limit,
    limit,
    remaining: Math.max(0, limit - record.count),
    reset: record.resetTime,
  };
}

export default async function proxy(request: NextRequest, event: NextFetchEvent) {
  const path = request.nextUrl.pathname;

  // 1. Rate limiting for API routes
  if (path.startsWith("/api/")) {
    const rawIp = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const ip = rawIp.split(",")[0].trim() || "127.0.0.1";
    const clientKey = getClientRateLimitKey(request, ip);
    let success = true;

    try {
      if (path.startsWith("/api/auth/") || path.startsWith("/api/payments/")) {
        // Never block authentication / OAuth callbacks or payment webhooks
        success = true;
      } else if (
        path.startsWith("/api/ai/") ||
        path.startsWith("/api/academic/") ||
        path === "/api/parse-topics"
      ) {
        if (hasUpstashConfig) {
          const result = await upstashAiRateLimit!.limit(`ai_${clientKey}`);
          success = result.success;
        } else {
          const result = memoryRateLimit(`ai_${clientKey}`, 60, 60000);
          success = result.success;
        }
      } else {
        if (hasUpstashConfig) {
          const result = await upstashPublicRateLimit!.limit(`public_${clientKey}`);
          success = result.success;
        } else {
          const result = memoryRateLimit(`public_${clientKey}`, 300, 60000);
          success = result.success;
        }
      }
    } catch (error) {
      console.error("[RATE_LIMIT_ERROR]", error);
    }

    if (!success) {
      const internalSecret = getInternalSecret();
      if (internalSecret) {
        const logUrl = new URL("/api/security/log", request.url);
        event.waitUntil(
          fetch(logUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-internal-secret": internalSecret,
            },
            body: JSON.stringify({
              eventType: "RATE_LIMIT",
              ipAddress: ip,
              path: path,
              userAgent: request.headers.get("user-agent") || "Unknown",
            }),
          }).catch((e) => console.error("Logging failed", e))
        );
      }

      return new NextResponse(
        JSON.stringify({
          error: "Too Many Requests",
          message: "You have exceeded your rate limit.",
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // 2. Auth for protected routes
  if (path.startsWith("/admin") || path.startsWith("/super-admin")) {
    const token = await getToken({
      req: request,
      secureCookie: process.env.NODE_ENV === "production",
    });

    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const role = typeof token?.role === "string" ? token.role.trim().toUpperCase() : "USER";
    const isSuperAdmin = role === "SUPER_ADMIN";
    const isAdmin = role === "ADMIN" || isSuperAdmin;

    if (path.startsWith("/super-admin") && !isSuperAdmin) {
      return NextResponse.redirect(new URL("/dashboard?error=access_denied", request.url));
    }

    if (path.startsWith("/admin") && !isAdmin) {
      return NextResponse.redirect(new URL("/dashboard?error=access_denied", request.url));
    }
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""} https://js.stripe.com https://accounts.google.com`,
    "style-src 'self' 'unsafe-inline' https://accounts.google.com",
    "img-src 'self' data: https: blob: https://lh3.googleusercontent.com",
    "font-src 'self' data:",
    "connect-src 'self' https: wss: data:",
    "frame-src 'self' https://js.stripe.com https://accounts.google.com",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self' https://accounts.google.com https://my.click.uz https://checkout.paycom.uz https://backend.payx.uz",
    "upgrade-insecure-requests",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // 3. Security Headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  response.headers.set("Content-Security-Policy", csp);
  response.headers.delete("X-Powered-By");

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|auth/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
