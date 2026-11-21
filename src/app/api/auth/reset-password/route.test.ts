import { describe, it, expect, vi } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";

vi.mock("@/core/auth/password-reset-service", () => ({
  PasswordResetService: class {
    resetPassword = vi.fn().mockImplementation(async (token: string, pass: string) => {
      if (token === "expired-token") {
        throw new Error("Invalid or expired reset token");
      }
      return { success: true };
    });
  },
}));

vi.mock("@/core/auth/prisma-password-reset-repository", () => ({
  PrismaPasswordResetRepository: class {},
}));

describe("POST /api/auth/reset-password", () => {
  it("rejects short password (< 8 chars) with 400", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "valid-token", password: "123" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("kamida 8 ta belgi");
  });

  it("returns 400 when token is expired", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "expired-token", password: "NewStrongPassword123!" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Invalid or expired reset token");
  });

  it("accepts valid token and updates password successfully", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "valid-token", password: "NewStrongPassword123!" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
