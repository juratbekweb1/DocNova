import { NextResponse } from "next/server";
import type { NextRequest, NextFetchEvent } from "next/server";
import { getToken } from "next-auth/jwt";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Check if Upstash Redis is configured
const hasUpstashConfig = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

// Upstash rate limiters
const upstashAuthRateLimit = hasUpstashConfig
  ? new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(5, "1 m") })
  : null;

const upstashAiRateLimit = hasUpstashConfig
  ? new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(10, "1 m") })
  : null;

const upstashPublicRateLimit = hasUpstashConfig
  ? new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(60, "1 m") })
  : null;

// In-Memory Fallback
interface RateLimitInfo {
  count: number;
  resetTime: number;
}
const memoryStore = new Map<string, RateLimitInfo>();

function memoryRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  let record = memoryStore.get(key);

  if (!record || now > record.resetTime) {
    record = { count: 1, resetTime: now + windowMs };
  } else {
    record.count++;
  }
  memoryStore.set(key, record);
  return { success: record.count <= limit, limit, remaining: Math.max(0, limit - record.count), reset: record.resetTime };
}

export default async function proxy(request: NextRequest, event: NextFetchEvent) {
  const path = request.nextUrl.pathname;
  
  // 1. Rate limiting for API routes
  if (path.startsWith("/api/")) {
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
    let success = true;

    try {
      if (path.startsWith("/api/auth/")) {
        if (hasUpstashConfig) {
          const result = await upstashAuthRateLimit!.limit(`auth_${ip}`);
          success = result.success;
        } else {
          const result = memoryRateLimit(`auth_${ip}`, 5, 60000);
          success = result.success;
        }
      } else if (path.startsWith("/api/ai/")) {
        if (hasUpstashConfig) {
          const result = await upstashAiRateLimit!.limit(`ai_${ip}`);
          success = result.success;
        } else {
          const result = memoryRateLimit(`ai_${ip}`, 10, 60000);
          success = result.success;
        }
      } else {
        if (hasUpstashConfig) {
          const result = await upstashPublicRateLimit!.limit(`public_${ip}`);
          success = result.success;
        } else {
          const result = memoryRateLimit(`public_${ip}`, 60, 60000);
          success = result.success;
        }
      }
    } catch (error) {
      console.error("[RATE_LIMIT_ERROR]", error);
    }

    if (!success) {
      const logUrl = new URL("/api/security/log", request.url);
      event.waitUntil(
        fetch(logUrl, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "x-internal-secret": process.env.INTERNAL_SECRET || "fallback-secret-for-dev",
          },
          body: JSON.stringify({
            eventType: "RATE_LIMIT",
            ipAddress: ip,
            path: path,
            userAgent: request.headers.get("user-agent") || "Unknown",
          })
        }).catch(e => console.error("Logging failed", e))
      );
      
      return new NextResponse(
        JSON.stringify({ error: "Too Many Requests", message: "You have exceeded your rate limit." }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // 2. Auth for protected routes
  if (path.startsWith("/admin") || path.startsWith("/super-admin")) {
    const token = await getToken({ req: request });
    
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

  const response = NextResponse.next();

  // 3. Security Headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.stripe.com",
    "frame-src 'self' https://js.stripe.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
  
  response.headers.set("Content-Security-Policy", csp);
  response.headers.delete("X-Powered-By");

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|auth/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
