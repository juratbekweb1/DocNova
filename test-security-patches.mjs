import "dotenv/config";
import assert from "node:assert";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { NextRequest } from "next/server";

import { POST as devUpgradeHandler } from "./src/app/api/checkout/dev-upgrade/route.ts";
import { POST as payxHandler } from "./src/app/api/payments/payx/route.ts";
import { POST as paymeHandler } from "./src/app/api/payments/payme/route.ts";
import { POST as clickHandler } from "./src/app/api/payments/click/route.ts";
import { RateLimiter } from "./src/lib/security/rate-limiter.ts";
import { checkUserLimit } from "./src/lib/limits.ts";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

console.log("===============================================================");
console.log(" DOCNOVA — CRITICAL SECURITY PATCHES & REGRESSION TEST SUITE  ");
console.log("===============================================================");

let total = 0;
let passed = 0;

async function runTest(name, fn) {
  total++;
  try {
    await fn();
    console.log(`  [PASS] Test ${total}: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] Test ${total}: ${name}`);
    console.error("         Error:", err.message || err);
    process.exitCode = 1;
  }
}

async function main() {
  // --------------------------------------------------------------------------
  // Category 1: Dev-Upgrade Route Guard
  // --------------------------------------------------------------------------
  console.log("\n--- Category 1: Dev-Upgrade Route Guard ---");

  await runTest("Dev-upgrade unconditionally returns 403 in production environment", async () => {
    const originalEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = "production";
      const req = new NextRequest("http://localhost:3000/api/checkout/dev-upgrade", {
        method: "POST",
        body: JSON.stringify({ planSlug: "premium" }),
      });
      const res = await devUpgradeHandler(req);
      assert.strictEqual(res.status, 403, "Must return status 403");
      const body = await res.json();
      assert.strictEqual(body.code, "ENDPOINT_DISABLED_IN_PRODUCTION");
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  await runTest("Dev-upgrade returns 401 when called without a valid admin session", async () => {
    const originalEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = "development";
      const req = new NextRequest("http://localhost:3000/api/checkout/dev-upgrade", {
        method: "POST",
        body: JSON.stringify({ planSlug: "premium" }),
      });
      const res = await devUpgradeHandler(req);
      assert.strictEqual(res.status, 401, "Unauthenticated session must return 401");
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  // --------------------------------------------------------------------------
  // Category 2: PayX Webhook Security (Fail-Closed & Amount Verification)
  // --------------------------------------------------------------------------
  console.log("\n--- Category 2: PayX Webhook Security ---");

  await runTest("PayX rejects request with 503 when webhook secret is unconfigured", async () => {
    const origSecret = process.env.PAYX_WEBHOOK_SECRET;
    const origKey = process.env.PAYX_API_KEY;
    try {
      delete process.env.PAYX_WEBHOOK_SECRET;
      delete process.env.PAYX_API_KEY;

      const req = new NextRequest("http://localhost:3000/api/payments/payx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: "test-ref", status: "paid" }),
      });
      const res = await payxHandler(req);
      assert.strictEqual(res.status, 503, "Unconfigured PayX must fail-closed with 503");
      const data = await res.json();
      assert.strictEqual(data.code, "PAYX_UNCONFIGURED");
    } finally {
      if (origSecret) process.env.PAYX_WEBHOOK_SECRET = origSecret;
      if (origKey) process.env.PAYX_API_KEY = origKey;
    }
  });

  await runTest("PayX rejects request with 401 when invalid authentication token is provided", async () => {
    const origSecret = process.env.PAYX_WEBHOOK_SECRET;
    try {
      process.env.PAYX_WEBHOOK_SECRET = "secure-test-webhook-secret-xyz";

      const req = new NextRequest("http://localhost:3000/api/payments/payx", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer wrong-token-value",
        },
        body: JSON.stringify({ reference: "test-ref", status: "paid" }),
      });
      const res = await payxHandler(req);
      assert.strictEqual(res.status, 401, "Invalid token must return 401");
      const data = await res.json();
      assert.strictEqual(data.code, "UNAUTHORIZED");
    } finally {
      process.env.PAYX_WEBHOOK_SECRET = origSecret;
    }
  });

  await runTest("PayX verifies amount integrity against database transaction", async () => {
    const secret = "secure-test-webhook-secret-xyz";
    const origSecret = process.env.PAYX_WEBHOOK_SECRET;
    try {
      process.env.PAYX_WEBHOOK_SECRET = secret;

      // Find any existing pending or valid user to create a temporary test transaction
      const user = await prisma.user.findFirst();
      assert(user, "User must exist");

      const testTx = await prisma.transaction.create({
        data: {
          userId: user.id,
          amount: 50000,
          status: "PENDING",
          provider: "PAYX",
        },
      });

      try {
        // Attempt webhook with manipulated amount (e.g. 1000 instead of 50000)
        const req = new NextRequest("http://localhost:3000/api/payments/payx", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${secret}`,
          },
          body: JSON.stringify({
            reference: testTx.id,
            status: "paid",
            amount: 1000, // Fraudulent amount
          }),
        });

        const res = await payxHandler(req);
        assert.strictEqual(res.status, 400, "Mismatched amount must return 400");
        const body = await res.json();
        assert(body.error.includes("Amount mismatch"), "Must report amount mismatch");
      } finally {
        await prisma.transaction.delete({ where: { id: testTx.id } });
      }
    } finally {
      process.env.PAYX_WEBHOOK_SECRET = origSecret;
    }
  });

  // --------------------------------------------------------------------------
  // Category 3: Payme & Click Webhook Security (Fail-Closed & Signatures)
  // --------------------------------------------------------------------------
  console.log("\n--- Category 3: Payme & Click Webhook Security ---");

  await runTest("Payme rejects request with 503 when PAYME_PASSWORD is unconfigured", async () => {
    const origPassword = process.env.PAYME_PASSWORD;
    try {
      delete process.env.PAYME_PASSWORD;

      const req = new NextRequest("http://localhost:3000/api/payments/payme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "CheckPerformTransaction" }),
      });
      const res = await paymeHandler(req);
      assert.strictEqual(res.status, 503, "Missing PAYME_PASSWORD must return 503");
      const data = await res.json();
      assert.strictEqual(data.error.code, -32504);
    } finally {
      if (origPassword) process.env.PAYME_PASSWORD = origPassword;
    }
  });

  await runTest("Payme rejects request with 401 when Basic auth is missing or invalid", async () => {
    const origPassword = process.env.PAYME_PASSWORD;
    try {
      process.env.PAYME_PASSWORD = "test-payme-secret";

      const req = new NextRequest("http://localhost:3000/api/payments/payme", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from("Paycom:wrong-password").toString("base64")}`,
        },
        body: JSON.stringify({ method: "CheckPerformTransaction" }),
      });
      const res = await paymeHandler(req);
      assert.strictEqual(res.status, 401, "Invalid password must return 401");
      const data = await res.json();
      assert.strictEqual(data.error.code, -32504);
    } finally {
      process.env.PAYME_PASSWORD = origPassword;
    }
  });

  await runTest("Click rejects request with 503 when CLICK_SECRET_KEY is missing or dummy", async () => {
    const origKey = process.env.CLICK_SECRET_KEY;
    try {
      process.env.CLICK_SECRET_KEY = "YOUR_CLICK_SECRET"; // Dummy value check

      const formData = new FormData();
      formData.append("click_trans_id", "123");
      formData.append("service_id", "1000");

      const req = new NextRequest("http://localhost:3000/api/payments/click", {
        method: "POST",
        body: formData,
      });
      const res = await clickHandler(req);
      assert.strictEqual(res.status, 503, "Dummy CLICK_SECRET_KEY must return 503");
      const data = await res.json();
      assert.strictEqual(data.error, "-8");
    } finally {
      process.env.CLICK_SECRET_KEY = origKey;
    }
  });

  await runTest("Click rejects invalid MD5 digital signature with error -1", async () => {
    const origKey = process.env.CLICK_SECRET_KEY;
    try {
      const secret = "test-click-secret-key-123";
      process.env.CLICK_SECRET_KEY = secret;

      const formData = new FormData();
      formData.append("click_trans_id", "12345");
      formData.append("service_id", "999");
      formData.append("merchant_trans_id", "mock-tx-123");
      formData.append("amount", "50000");
      formData.append("action", "0");
      formData.append("sign_time", "2026-10-18 20:00:00");
      formData.append("sign_string", "fraudulent_invalid_signature_hash");

      const req = new NextRequest("http://localhost:3000/api/payments/click", {
        method: "POST",
        body: formData,
      });
      const res = await clickHandler(req);
      const data = await res.json();
      assert.strictEqual(data.error, "-1", "Invalid signature must return error -1");
      assert.strictEqual(data.error_note, "SIGN CHECK FAILED");
    } finally {
      process.env.CLICK_SECRET_KEY = origKey;
    }
  });

  // --------------------------------------------------------------------------
  // Category 4: Multi-tier Rate Limiting
  // --------------------------------------------------------------------------
  console.log("\n--- Category 4: Multi-Tier Rate Limiting ---");

  await runTest("RateLimiter enforces window limit and blocks exceeding requests", () => {
    const limiter = new RateLimiter(60000, 3);
    const testKey = `test_ip_${Date.now()}`;

    assert.strictEqual(limiter.isLimited(testKey), false, "Req 1 should pass");
    assert.strictEqual(limiter.isLimited(testKey), false, "Req 2 should pass");
    assert.strictEqual(limiter.isLimited(testKey), false, "Req 3 should pass");
    assert.strictEqual(limiter.isLimited(testKey), true, "Req 4 must be rate-limited");
    assert.strictEqual(limiter.getRemainingRequests(testKey), 0, "Remaining requests should be 0");
  });

  await runTest("RateLimiter distributed check functions reliably with PostgreSQL fallback", async () => {
    const limiter = new RateLimiter(60000, 2);
    const distributedKey = `dist_test_${Date.now()}`;

    const res1 = await limiter.checkDistributed(distributedKey);
    assert.strictEqual(res1.allowed, true, "First distributed request should pass");
    assert.strictEqual(res1.remaining, 1, "Remaining count should be 1");

    const res2 = await limiter.checkDistributed(distributedKey);
    assert.strictEqual(res2.allowed, true, "Second distributed request should pass");
    assert.strictEqual(res2.remaining, 0, "Remaining count should be 0");

    const res3 = await limiter.checkDistributed(distributedKey);
    assert.strictEqual(res3.allowed, false, "Third distributed request must be blocked");
    assert.strictEqual(res3.remaining, 0, "Remaining count should remain 0");

    // Clean up test token from database
    const safeKey = `rl_${distributedKey.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80)}`;
    await prisma.verificationToken.deleteMany({ where: { token: safeKey } }).catch(() => {});
  });

  // --------------------------------------------------------------------------
  // Category 5: Super Admin Limit Bypass Preservation
  // --------------------------------------------------------------------------
  console.log("\n--- Category 5: Super Admin Limit Bypass ---");

  await runTest("Super Admin maintains unlimited bypass across AI features", async () => {
    const superAdmin = await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN" },
    });
    assert(superAdmin, "Super Admin user must exist in DB");

    const resCoursework = await checkUserLimit(superAdmin.id, "coursework");
    assert.strictEqual(resCoursework.allowed, true, "Super Admin coursework must be allowed");
    assert.strictEqual(resCoursework.unlimited, true, "Super Admin must have unlimited flag");

    const resRewrite = await checkUserLimit(superAdmin.id, "rewrite");
    assert.strictEqual(resRewrite.allowed, true, "Super Admin rewrite must be allowed");
    assert.strictEqual(resRewrite.unlimited, true, "Super Admin must have unlimited flag");
  });

  // --------------------------------------------------------------------------
  // Category 6: Error Boundaries & Client Resilience
  // --------------------------------------------------------------------------
  console.log("\n--- Category 6: Error Boundaries & Language Provider Resilience ---");

  await runTest("App Router root error boundary exists and is client-rendered", () => {
    const errorPath = path.join(process.cwd(), "src/app/error.tsx");
    assert(fs.existsSync(errorPath), "src/app/error.tsx must exist");
    const content = fs.readFileSync(errorPath, "utf-8");
    assert(content.includes('"use client"') || content.includes("'use client'"), "Must have 'use client'");
    assert(content.includes("reset"), "Must provide reset callback");
  });

  await runTest("Global error boundary exists and encapsulates root html/body", () => {
    const globalErrorPath = path.join(process.cwd(), "src/app/global-error.tsx");
    assert(fs.existsSync(globalErrorPath), "src/app/global-error.tsx must exist");
    const content = fs.readFileSync(globalErrorPath, "utf-8");
    assert(content.includes('"use client"') || content.includes("'use client'"), "Must have 'use client'");
    assert(content.includes("<html") && content.includes("<body"), "Must include <html> and <body> tags");
  });

  console.log("\n===============================================================");
  console.log(` RESULT: ${passed} / ${total} TESTS PASSED`);
  console.log("===============================================================\n");

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
