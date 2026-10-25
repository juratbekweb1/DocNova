import { authRateLimiter } from "@/lib/security/rate-limiter";
import { NextRequest } from "next/server";
import NextAuth from "next-auth/next";
import { authOptions } from "@/lib/auth-options";

export const runtime = "nodejs";

// next-auth v4 App Router handler.
// Next.js 15+ passes params as a Promise, but next-auth v4 expects sync params.
// We must await the params and reconstruct a compatible context object.
const nextAuthHandler = NextAuth(authOptions);

// Only credential login attempts (brute-force target) are rate limited.
// NextAuth internal calls (_log, session, csrf, providers, signout, OAuth callbacks)
// are called automatically by the client and must never be throttled.
function isCredentialLogin(request: NextRequest): boolean {
  return request.method === "POST" && request.nextUrl.pathname.endsWith("/callback/credentials");
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  const params = await context.params;
  return nextAuthHandler(request, { params });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  if (isCredentialLogin(request)) {
    const rateLimitResponse = authRateLimiter.middleware(request);
    if (rateLimitResponse) return rateLimitResponse;
  }

  const params = await context.params;
  return nextAuthHandler(request, { params });
}
