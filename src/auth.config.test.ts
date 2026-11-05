// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { authConfig } from "./auth.config";

vi.mock("./lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

describe("auth config", () => {
  it("includes login page settings", () => {
    expect(authConfig.pages?.signIn).toBe("/login");
  });

  it("exposes OAuth providers (Google and GitHub) with proper authorization params", () => {
    // authConfig now includes Google and GitHub OAuth providers
    expect(Array.isArray(authConfig.providers)).toBe(true);
    expect(authConfig.providers.length).toBeGreaterThanOrEqual(2);
    const providerIds = authConfig.providers.map((p: { id: string }) => p.id);
    expect(providerIds).toContain("google");
    expect(providerIds).toContain("github");

    // Check Google provider authorization parameters for seamless 1-click account selection
    const googleProvider = authConfig.providers.find(
      (p: { id: string }) => p.id === "google"
    ) as { options?: { authorization?: { params?: Record<string, string> } } };
    expect(googleProvider?.options?.authorization?.params?.prompt).toBe("select_account");
    expect(googleProvider?.options?.authorization?.params?.access_type).toBe("offline");
    expect(googleProvider?.options?.authorization?.params?.response_type).toBe("code");
  });

  it("configures secure SameSite=lax cookies for iOS/Safari compatibility", () => {
    expect(authConfig.cookies).toBeDefined();
    expect(authConfig.cookies?.sessionToken?.options?.sameSite).toBe("lax");
    expect(authConfig.cookies?.callbackUrl?.options?.sameSite).toBe("lax");
    expect(authConfig.cookies?.csrfToken?.options?.sameSite).toBe("lax");
    expect(authConfig.cookies?.pkceCodeVerifier?.options?.sameSite).toBe("lax");
    expect(authConfig.cookies?.state?.options?.sameSite).toBe("lax");
  });

  it("hydrates the user role from the database for OAuth sessions", async () => {
    const { prisma } = await import("./lib/prisma");
    const user = {
      id: "u_123",
      email: "admin@example.com",
      name: "Admin User",
      role: "SUPER_ADMIN",
      username: "admin",
      displayName: "Admin User",
      avatar: null,
      theme: null,
      language: null,
      sessionVersion: 1,
      twoFactorEnabled: false,
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(user as never);

    const jwtCallback = authConfig.callbacks?.jwt;
    const token = await jwtCallback?.({
      token: { sub: user.id },
      user: { id: user.id, email: user.email, name: user.name },
      trigger: undefined,
      session: undefined,
    } as never);

    expect(token?.role).toBe("SUPER_ADMIN");
    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: user.id },
      })
    );
  });
});
