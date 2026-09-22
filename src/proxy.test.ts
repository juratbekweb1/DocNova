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
  });
});

