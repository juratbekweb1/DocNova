// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

// Mock rate limiter to never block in tests
vi.mock("@/lib/security/rate-limiter", () => ({
  aiDemoRateLimiter: { middleware: vi.fn().mockReturnValue(null) },
  RateLimiter: vi.fn(),
}));

// Mock provider factory to use fallback (no real API calls in tests)
vi.mock("@/core/ai/provider-factory", () => ({
  getAIProvider: vi.fn().mockReturnValue({
    name: "fallback",
    complete: vi.fn().mockResolvedValue(
      JSON.stringify({
        summary: "An experienced developer with strong skills.",
        experience: [{ jobTitle: "Developer", bullets: ["Built scalable systems"] }],
        skills: ["TypeScript", "React", "Node.js"],
      })
    ),
    stream: vi.fn(),
    chat: vi.fn(),
  }),
}));

// Force development mode so origin check is skipped
vi.stubEnv("NODE_ENV", "development");

import { POST, GET } from "./route";

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost:3000/api/ai/generate-resume", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

describe("POST /api/ai/generate-resume", () => {
  // Test A: Missing rawInput → 400
  it("returns 400 when rawInput is missing", async () => {
    const req = makeRequest({});
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  // Test B: rawInput too short → 400
  it("returns 400 when rawInput is too short", async () => {
    const req = makeRequest({ rawInput: "short" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.message).toBeTruthy();
  });

  // Test C: rawInput too long → 400
  it("returns 400 when rawInput exceeds 1000 characters", async () => {
    const req = makeRequest({ rawInput: "x".repeat(1001) });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  // Test D: Valid input → 200 with structured data
  it("returns 200 with structured resume data for valid input", async () => {
    const req = makeRequest({
      rawInput: "I worked as a frontend developer for 3 years building React applications.",
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toMatchObject({
      provider: "fallback",
      summary: expect.any(String),
      experience: expect.any(Array),
      skills: expect.any(Array),
    });
  });

  // Test E: localhost should be accepted even outside development mode
  it("allows localhost requests when no app URL is configured", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");

    const req = makeRequest(
      {
        rawInput: "I worked as a frontend developer for 3 years building React applications.",
      },
      { origin: "http://localhost:3000" }
    );

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  // Test F: Malformed AI JSON response → 502
  it("returns 502 when provider returns unparseable JSON", async () => {
    const { getAIProvider } = await import("@/core/ai/provider-factory");
    vi.mocked(getAIProvider).mockReturnValueOnce({
      name: "fallback",
      complete: vi.fn().mockResolvedValue("this is not json at all!!!"),
      stream: vi.fn(),
      chat: vi.fn(),
    });

    const req = makeRequest({
      rawInput: "I worked as a developer for 5 years building great products.",
    }, { origin: "http://localhost:3000" });
    const res = await POST(req);
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.success).toBe(false);
    // Should not leak raw error details
    expect(JSON.stringify(json)).not.toContain("SyntaxError");
  });

  // Test G: GET method is rejected
  it("returns error for GET requests", async () => {
    const res = await GET();
    expect(res.status).toBe(405);
  });
});
