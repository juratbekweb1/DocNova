import "dotenv/config";
import assert from "node:assert";
import { PrismaClient, SubscriptionTier } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  checkUserLimit,
  getUserSubscription as getLimitsSubscription,
  deductUserAiCredit,
  trackAIUsage,
} from "./src/lib/limits.ts";
import { getUserSubscription as getBillingSubscription } from "./src/lib/billing/subscription.ts";
import { checkPdfLimit } from "./src/lib/pdf-limit.ts";
import { getLinkedUser } from "./src/lib/telegram-docnova-ai.ts";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

console.log("=== STARTING DOCNOVA AI SUPER ADMIN UNLIMITED ACCESS AUDIT ===");

async function runTests() {
  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  [PASS] Test ${total}: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] Test ${total}: ${name}`);
      console.error(err);
      process.exitCode = 1;
    }
  }

  async function asyncTest(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  [PASS] Test ${total}: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] Test ${total}: ${name}`);
      console.error(err);
      process.exitCode = 1;
    }
  }

  // Retrieve users from PostgreSQL
  const adminUser = await prisma.user.findUnique({
    where: { email: "juratbekashirboyev295@gmail.com" },
  });
  assert(adminUser, "Super admin user must exist in DB");
  console.log(`Found Super Admin User: ${adminUser.email} (Role: ${adminUser.role}, TelegramId: ${adminUser.telegramId})`);

  const freeUser = await prisma.user.findUnique({
    where: { email: "nodirmatqurbonov579@gmail.com" },
  });
  assert(freeUser, "Free regular user must exist in DB");
  console.log(`Found Regular User: ${freeUser.email} (Role: ${freeUser.role})`);

  console.log("\n--- Category 1: Super Admin Role Verification & Telegram Linkage ---");

  await asyncTest("Super Admin account has verified SUPER_ADMIN role in database", async () => {
    assert.strictEqual(adminUser.role, "SUPER_ADMIN", "User role must be SUPER_ADMIN");
  });

  await asyncTest("Telegram ID linkage resolves accurately to SUPER_ADMIN", async () => {
    const linked = await getLinkedUser(adminUser.telegramId);
    assert(linked, "Linked user must be found");
    assert.strictEqual(linked.id, adminUser.id);
    assert.strictEqual(linked.role, "SUPER_ADMIN");
    assert.strictEqual(linked.isTelegramLinked, true);
  });

  console.log("\n--- Category 2: Centralized Limit Bypass (checkUserLimit) ---");

  await asyncTest("Super Admin receives allowed: true and unlimited: true for coursework", async () => {
    const res = await checkUserLimit(adminUser.id, "coursework");
    assert.strictEqual(res.allowed, true);
    assert.strictEqual(res.limitExceeded, false);
    assert.strictEqual(res.unlimited, true);
    assert(res.remaining > 1000);
  });

  await asyncTest("Super Admin receives allowed: true for rewrite, presentation, chat, mock_test", async () => {
    for (const feat of ["rewrite", "presentation", "chat", "mock_test", "resume_analysis"]) {
      const res = await checkUserLimit(adminUser.id, feat);
      assert.strictEqual(res.allowed, true, `Feature ${feat} must be allowed for super admin`);
      assert.strictEqual(res.limitExceeded, false);
      assert.strictEqual(res.unlimited, true);
    }
  });

  console.log("\n--- Category 3: Subscription & Feature Flag Bypass ---");

  await asyncTest("Limits getUserSubscription reports PREMIUM, isProOrPremium: true, isSuperAdmin: true", async () => {
    const sub = await getLimitsSubscription(adminUser.id);
    assert.strictEqual(sub.isProOrPremium, true);
    assert.strictEqual(sub.isSuperAdmin, true);
    assert.strictEqual(sub.plan, "PREMIUM");
  });

  await asyncTest("Billing getUserSubscription reports isPremium: true for Super Admin", async () => {
    const sub = await getBillingSubscription(adminUser.id);
    assert.strictEqual(sub.isPremium, true);
    assert.strictEqual(sub.features.unlimited, true);
  });

  await asyncTest("checkPdfLimit returns true for Super Admin", async () => {
    const allowed = await checkPdfLimit(adminUser.id);
    assert.strictEqual(allowed, true);
  });

  console.log("\n--- Category 4: Multi-Tenant Safety & Free User Limit Enforcement ---");

  await asyncTest("Regular USER is not granted Super Admin bypass", async () => {
    const sub = await getLimitsSubscription(freeUser.id);
    assert.strictEqual(sub.isSuperAdmin, false);
    assert.strictEqual(sub.isProOrPremium, false);
    assert.strictEqual(sub.plan, "FREE");
  });

  await asyncTest("Regular Free user limit behaves according to FREE quota", async () => {
    const res = await checkUserLimit(freeUser.id, "coursework");
    // Free limit for coursework is 3
    assert.strictEqual(res.totalLimit, 3);
    assert.strictEqual(res.unlimited, undefined);
  });

  console.log("\n--- Category 5: AIUsage Tracking & Analytics Preservation ---");

  await asyncTest("trackAIUsage successfully logs token and cost records for Super Admin actions", async () => {
    const testFeature = "SUPER_ADMIN_AUDIT_TEST";
    await trackAIUsage({
      userId: adminUser.id,
      plan: "PREMIUM",
      feature: testFeature,
      provider: "gemini",
      model: "gemini-1.5-flash",
      status: "SUCCESS",
      inputTokens: 1500,
      outputTokens: 800,
      requestDurationMs: 420,
    });

    const logged = await prisma.aIUsage.findFirst({
      where: {
        userId: adminUser.id,
        feature: testFeature,
      },
      orderBy: { createdAt: "desc" },
    });

    assert(logged, "AIUsage record must exist");
    assert.strictEqual(logged.inputTokens, 1500);
    assert.strictEqual(logged.outputTokens, 800);
    assert.strictEqual(logged.totalTokens, 2300);
    assert(logged.estimatedCostUsd > 0);
    assert.strictEqual(logged.status, "SUCCESS");

    // Clean up test record
    await prisma.aIUsage.delete({ where: { id: logged.id } });
  });

  await asyncTest("deductUserAiCredit increments user count without throwing or blocking", async () => {
    const countBefore = (await prisma.user.findUnique({ where: { id: adminUser.id } })).aiUsageCount;
    await deductUserAiCredit(adminUser.id);
    const countAfter = (await prisma.user.findUnique({ where: { id: adminUser.id } })).aiUsageCount;
    assert.strictEqual(countAfter, countBefore + 1);
  });

  console.log("\n--- Category 6: Fencing Tokens & Session Locks Integrity ---");

  await asyncTest("Transactional session lock & lease structures remain uncompromised", async () => {
    const { getBotSession, setBotSession, clearBotSession } = await import("./src/lib/telegram-docnova-ai.ts");
    await setBotSession(adminUser.telegramId, { type: "coursework", step: "topic" });
    const session = await getBotSession(adminUser.telegramId);
    assert.strictEqual(session.type, "coursework");
    assert.strictEqual(session.step, "topic");
    await clearBotSession(adminUser.telegramId);
    const cleared = await getBotSession(adminUser.telegramId);
    assert.strictEqual(cleared, null);
  });

  console.log(`\n========================================`);
  console.log(`TEST SUMMARY: ${passed}/${total} TESTS PASSED`);
  console.log(`========================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runTests()
  .catch((err) => {
    console.error("FATAL ERROR IN TEST SUITE:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
