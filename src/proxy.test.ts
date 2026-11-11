import { beforeEach, describe, expect, it, vi } from "vitest";

// The proxy module uses NextResponse.next() with no arguments
class MockResponse {
  public headers = new Headers();
}

vi.mock("next/server", () => ({
  NextResponse: {
    next: vi.fn(() => new MockResponse()),
  },
}));

describe("proxy middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("exports a default function and a matcher config", async () => {
    const { default: middleware, config } = await import("./proxy");

    expect(typeof middleware).toBe("function");
    // The matcher should exclude static files and api routes
    expect(Array.isArray(config.matcher)).toBe(true);
    expect(config.matcher.length).toBeGreaterThan(0);
  });

  it("sets X-Frame-Options and security headers", async () => {
    const { default: middleware } = await import("./proxy");

    const req = {
      headers: new Headers(),
      nextUrl: { pathname: "/dashboard" },
    };

    const response = await middleware(req as never, {} as never);

    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("X-XSS-Protection")).toBe("1; mode=block");
    expect(response.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });

  it("sets Strict-Transport-Security header", async () => {
    const { default: middleware } = await import("./proxy");

    const req = {
      headers: new Headers(),
      nextUrl: { pathname: "/" },
    };

    const response = await middleware(req as never, {} as never);

    const hsts = response.headers.get("Strict-Transport-Security");
    expect(hsts).toBeTruthy();
    expect(hsts).toContain("max-age=31536000");

    const csp = response.headers.get("Content-Security-Policy") || "";
    expect(csp).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/);
    expect(csp).not.toContain("script-src 'self' 'unsafe-eval' 'unsafe-inline'");
    expect(csp).toContain("object-src 'none'");
  });

  it("handles 100+ concurrent AI requests without 31st-request freeze and auto-balances across candidate models", async () => {
    const { GeminiRateLimiter } = await import("./lib/gemini");
    const limiter = new GeminiRateLimiter(30);

    const start = Date.now();
    await Promise.all(
      Array.from({ length: 100 }, (_, i) =>
        limiter.acquire("gemini-3.5-flash").then(() => {
          if (i % 2 === 0) limiter.recordSuccess("gemini-3.5-flash");
          limiter.release("gemini-3.5-flash");
        })
      )
    );
    const elapsedMs = Date.now() - start;

    expect(elapsedMs).toBeLessThan(1500);
    expect(limiter.getStats("gemini-3.5-flash").dynamicRpmLimit).toBeGreaterThan(300);

    limiter.recordThrottle("gemini-3.5-flash", false, false);
    const ranked = limiter.rankModels([
      "gemini-3.5-flash",
      "gemini-3.5-flash-lite",
      "gemini-3.8-flash",
    ]);
    expect(ranked[0]).toBe("gemini-3.5-flash-lite");
  });
});
