import { describe, it, expect, vi } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";

vi.mock("@/core/auth/password-reset-service", () => ({
  PasswordResetService: class {
    requestReset = vi.fn().mockResolvedValue({
      success: true,
      message: "If an account exists, you will receive a password reset email.",
    });
  },
}));

vi.mock("@/core/auth/prisma-password-reset-repository", () => ({
  PrismaPasswordResetRepository: class {},
}));

describe("POST /api/auth/forgot-password", () => {
  it("rejects invalid email with 400", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "invalid-email" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("email");
  });

  it("accepts valid email and returns 200", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "student@example.uz" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
