import { authRateLimiter } from "@/lib/security/rate-limiter";
import { NextRequest } from "next/server";
import NextAuth from "next-auth/next";
import { authOptions } from "@/lib/auth-options";

export const runtime = 'nodejs';

// next-auth v4 App Router handler.
// Next.js 15+ passes params as a Promise, but next-auth v4 expects sync params.
// We must await the params and reconstruct a compatible context object.
const nextAuthHandler = NextAuth(authOptions);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  const rateLimitResponse = authRateLimiter.middleware(request);
  if (rateLimitResponse) return rateLimitResponse;

  const params = await context.params;
  return nextAuthHandler(request, { params });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  const rateLimitResponse = authRateLimiter.middleware(request);
  if (rateLimitResponse) return rateLimitResponse;

  const params = await context.params;
  return nextAuthHandler(request, { params });
}
