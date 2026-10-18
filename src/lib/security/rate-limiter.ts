import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { prisma } from "@/lib/prisma";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const isDev = process.env.NODE_ENV === "development";

// Upstash Redis client if configured in environment
let upstashRedisClient: Redis | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    upstashRedisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch (err) {
    console.error("[UPSTASH_INIT_ERR] Failed to initialize Upstash Redis:", err);
  }
}

class RateLimiter {
  private store: RateLimitStore = {};
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private upstashLimiter: Ratelimit | null = null;

  constructor(windowMs: number = 900000, maxRequests: number = 5) {
    this.windowMs = windowMs; // Default 15 minutes
    this.maxRequests = maxRequests; // Default 5 requests

    if (upstashRedisClient) {
      try {
        const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
        this.upstashLimiter = new Ratelimit({
          redis: upstashRedisClient,
          limiter: Ratelimit.slidingWindow(maxRequests, `${windowSec} s`),
          analytics: false,
        });
      } catch (err) {
        console.error("[UPSTASH_RATELIMITER_INIT_ERR]", err);
      }
    }
  }

  getKey(request: NextRequest): string {
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";
    return `${ip}:${userAgent}`;
  }

  isLimited(key: string): boolean {
    const now = Date.now();
    const record = this.store[key];

    if (!record || now > record.resetTime) {
      this.store[key] = {
        count: 1,
        resetTime: now + this.windowMs,
      };
      return false;
    }

    record.count++;

    if (record.count > this.maxRequests) {
      return true;
    }

    return false;
  }

  getRemainingRequests(key: string): number {
    const record = this.store[key];
    if (!record || Date.now() > record.resetTime) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - record.count);
  }

  getResetTime(key: string): number {
    const record = this.store[key];
    if (!record || Date.now() > record.resetTime) {
      return 0;
    }
    return record.resetTime;
  }

  /**
   * Distributed rate limit check across multiple serverless lambda instances.
   * Uses Upstash Redis if configured, or PostgreSQL VerificationToken with fail-safe memory fallback.
   */
  async checkDistributed(key: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    // 1. Try Upstash Redis if configured
    if (this.upstashLimiter) {
      try {
        const res = await this.upstashLimiter.limit(key);
        return {
          allowed: res.success,
          remaining: res.remaining,
          resetTime: res.reset,
        };
      } catch (err) {
        console.warn("[UPSTASH_RATELIMIT_FAILOPEN]", err);
      }
    }

    // 2. Fallback to PostgreSQL distributed token bucket
    const now = new Date();
    const safeKey = `rl_${key.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80)}`;

    try {
      return await prisma.$transaction(async (tx) => {
        const existing = await tx.verificationToken.findUnique({
          where: { token: safeKey },
        });

        if (!existing || existing.expires <= now) {
          // Token expired or first request in window: reset window
          const resetExpires = new Date(now.getTime() + this.windowMs);
          await tx.verificationToken.upsert({
            where: { token: safeKey },
            update: {
              identifier: "1",
              expires: resetExpires,
            },
            create: {
              token: safeKey,
              identifier: "1",
              expires: resetExpires,
            },
          });
          return {
            allowed: true,
            remaining: this.maxRequests - 1,
            resetTime: resetExpires.getTime(),
          };
        }

        const currentCount = parseInt(existing.identifier, 10) || 1;
        const resetTime = existing.expires.getTime();

        if (currentCount >= this.maxRequests) {
          return {
            allowed: false,
            remaining: 0,
            resetTime,
          };
        }

        // Increment count
        await tx.verificationToken.update({
          where: { token: safeKey },
          data: { identifier: (currentCount + 1).toString() },
        });

        return {
          allowed: true,
          remaining: Math.max(0, this.maxRequests - (currentCount + 1)),
          resetTime,
        };
      });
    } catch {
      // 3. Fail-safe: if DB is under heavy load or unavailable, fall back to local token bucket
      const limited = this.isLimited(key);
      return {
        allowed: !limited,
        remaining: this.getRemainingRequests(key),
        resetTime: this.getResetTime(key),
      };
    }
  }

  /**
   * Synchronous middleware (backward compatible with existing Next.js route handlers)
   */
  middleware(request: NextRequest): NextResponse | null {
    if (isDev) return null;
    if (request.method === "GET") return null;

    const key = this.getKey(request);

    if (this.isLimited(key)) {
      const resetTime = this.getResetTime(key);
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

      return NextResponse.json(
        {
          error: "Too many requests",
          message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
          retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": retryAfter.toString(),
            "X-RateLimit-Limit": this.maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": resetTime.toString(),
          },
        }
      );
    }

    return null;
  }

  /**
   * Asynchronous distributed middleware for modern App Router endpoints
   */
  async middlewareAsync(request: NextRequest): Promise<NextResponse | null> {
    if (isDev) return null;
    if (request.method === "GET") return null;

    const key = this.getKey(request);
    const result = await this.checkDistributed(key);

    if (!result.allowed) {
      const retryAfter = Math.max(1, Math.ceil((result.resetTime - Date.now()) / 1000));

      return NextResponse.json(
        {
          error: "Too many requests",
          message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
          retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": retryAfter.toString(),
            "X-RateLimit-Limit": this.maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": result.resetTime.toString(),
          },
        }
      );
    }

    return null;
  }
}

// Configured rate limiters for different functional domains
export const authRateLimiter = new RateLimiter(900000, 5); // 5 requests per 15 minutes
export const registerRateLimiter = new RateLimiter(3600000, 3); // 3 registrations per hour
export const passwordResetRateLimiter = new RateLimiter(3600000, 3); // 3 password resets per hour
export const generalRateLimiter = new RateLimiter(60000, 100); // 100 requests per minute
export const aiDemoRateLimiter = new RateLimiter(60000, 5); // 5 requests per minute for public demo

export { RateLimiter };
