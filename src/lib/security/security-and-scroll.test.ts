import fs from "fs";
import path from "path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    securityLog: { create: vi.fn() },
    user: { count: vi.fn() },
    document: { count: vi.fn() },
    transaction: { aggregate: vi.fn() },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

describe("Security hardening", () => {
  const origEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...origEnv };
    vi.clearAllMocks();
  });

  it("never exposes static fallback secrets for internal logging", async () => {
    delete process.env.INTERNAL_SECRET;
    process.env.AUTH_SECRET = "test-auth-secret-32-chars-minimum";

    const { getInternalSecret, verifySharedSecret } = await import("./internal-secret");
    const derived = getInternalSecret();

    expect(derived).toBeTruthy();
    expect(derived).not.toBe("fallback-secret-for-dev");
    expect(verifySharedSecret("fallback-secret-for-dev", derived)).toBe(false);
    expect(verifySharedSecret(derived, derived)).toBe(true);

    vi.stubEnv("NODE_ENV", "production");
    delete process.env.AUTH_SECRET;
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.ENCRYPTION_KEY;
    expect(getInternalSecret()).toBeNull();
    vi.unstubAllEnvs();
  });

  it("rejects forged fallback-secret-for-dev on /api/security/log", async () => {
    delete process.env.INTERNAL_SECRET;
    process.env.AUTH_SECRET = "unit-test-auth-secret-value";

    const { POST } = await import("@/app/api/security/log/route");
    const { getInternalSecret } = await import("./internal-secret");

    const badReq = new Request("http://localhost/api/security/log", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-secret": "fallback-secret-for-dev",
      },
      body: JSON.stringify({ eventType: "RATE_LIMIT" }),
    });
    const badRes = await POST(badReq);
    expect(badRes.status).toBe(401);

    const goodSecret = getInternalSecret()!;
    const goodReq = new Request("http://localhost/api/security/log", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-secret": goodSecret,
      },
      body: JSON.stringify({ eventType: "RATE_LIMIT", path: "/api/chat" }),
    });
    const goodRes = await POST(goodReq);
    expect(goodRes.status).toBe(200);
    expect(mockPrisma.securityLog.create).toHaveBeenCalledTimes(1);
  });

  it("blocks hardcoded bot secret backdoor on /api/telegram/stats", async () => {
    const { GET } = await import("@/app/api/telegram/stats/route");

    delete process.env.BOT_SECRET;
    const unconfiguredRes = await GET(
      new NextRequest("http://localhost/api/telegram/stats?token=MY_SECRET_BOT_TOKEN_123")
    );
    expect(unconfiguredRes.status).toBe(503);

    process.env.BOT_SECRET = "real-telegram-bot-secret-xyz";
    const forgedRes = await GET(
      new NextRequest("http://localhost/api/telegram/stats?token=MY_SECRET_BOT_TOKEN_123")
    );
    expect(forgedRes.status).toBe(401);

    mockPrisma.user.count.mockResolvedValue(4);
    mockPrisma.document.count.mockResolvedValue(12);
    mockPrisma.transaction.aggregate.mockResolvedValue({ _sum: { amount: 150000 } });

    const validRes = await GET(
      new NextRequest("http://localhost/api/telegram/stats", {
        headers: { "x-bot-secret": "real-telegram-bot-secret-xyz" },
      })
    );
    expect(validRes.status).toBe(200);
    const json = await validRes.json();
    expect(json).toEqual({ newUsers: 4, newDocs: 12, income: 150000 });
  });

  it("encrypts/decrypts without hardcoded fallback key and fails closed in production", async () => {
    delete process.env.ENCRYPTION_KEY;
    process.env.AUTH_SECRET = "another-valid-secret-for-aes-gcm";
    const { encrypt, decrypt } = await import("./encryption");

    const cipher = encrypt("JBSWY3DPEHPK3PXP");
    expect(decrypt(cipher)).toBe("JBSWY3DPEHPK3PXP");

    vi.stubEnv("NODE_ENV", "production");
    delete process.env.AUTH_SECRET;
    delete process.env.NEXTAUTH_SECRET;
    expect(() => encrypt("test")).toThrow();
    vi.unstubAllEnvs();
  });

  it("keeps Supabase PostgreSQL RLS, deny-all policies, default privileges, and event trigger in remediation SQL", () => {
    const sqlPath = path.join(process.cwd(), "scripts", "supabase-security-remediation.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    expect(sql).toContain("ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain("deny_all_anon_authenticated");
    expect(sql).toContain("ALTER DEFAULT PRIVILEGES");
    expect(sql).toContain("security_invoker = true");
    expect(sql).toContain("SET search_path = pg_catalog, public");
    expect(sql).toContain("CREATE EVENT TRIGGER docnova_auto_enable_rls");
  });
});

describe("Mobile vertical scroll freeze prevention", () => {
  const read = (rel: string) => fs.readFileSync(path.join(process.cwd(), rel), "utf8");

  it("keeps html unrestricted and uses overflow-x-clip on body and main page wrappers", () => {
    const layout = read("src/app/layout.tsx");
    const css = read("src/app/globals.css");
    const wrapper = read("src/components/layout/app-layout-wrapper.tsx");
    const landing = read("src/components/marketing/landing-page.tsx");
    const cvBuilder = read("src/app/cv-builder/page.tsx");

    expect(layout).not.toMatch(/<html[^>]*h-full/);
    expect(layout).not.toMatch(/<html[^>]*overflow-x-hidden/);
    expect(layout).toContain("overflow-x-clip");

    const htmlCssBlock = css.match(/html\s*\{[^}]*\}/)?.[0] ?? "";
    expect(htmlCssBlock).not.toContain("overflow-x: hidden");
    expect(css).toContain("overflow-x: clip;");
    expect(css).not.toContain("overscroll-behavior-y: contain");
    expect(css).not.toContain("-webkit-overflow-scrolling: touch");

    expect(wrapper).toContain("overflow-x-clip");
    expect(wrapper).not.toContain("overflow-x-hidden");
    expect(landing).toContain("overflow-x-clip");
    expect(landing).not.toContain("overflow-x-hidden");
    expect(cvBuilder).not.toContain("overflow-x-hidden");
  });

  it("restores inline body overflow in MobileDrawer instead of computed style", () => {
    const drawer = read("src/components/layout/mobile-drawer.tsx");
    expect(drawer).toContain("const previousInlineOverflow = document.body.style.overflow;");
    expect(drawer).not.toContain("window.getComputedStyle(document.body).overflow");
  });

  it("keeps DashboardShell flex scroll containers shrinkable with min-h-0 and h-dvh", () => {
    const shell = read("src/components/layout/dashboard-shell.tsx");
    expect(shell).toContain("h-dvh");
    expect(shell).toContain("min-h-0");
  });
});
