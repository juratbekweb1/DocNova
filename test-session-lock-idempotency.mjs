import assert from "node:assert";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

console.log("=== STARTING SESSION LOCK, IDEMPOTENCY & TIMEOUT RECOVERY AUDIT ===");

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Replicate pure DB lock logic from src/lib/telegram-lock.ts to test directly against DB
async function acquireUserLock(telegramId, leaseSeconds = 150) {
  const lockKey = `tg_lock_${telegramId}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + leaseSeconds * 1000);
  const newJobId = crypto.randomUUID();

  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.verificationToken.findUnique({
        where: { token: lockKey },
      });

      if (existing) {
        if (existing.expires > now) {
          return {
            acquired: false,
            reason: "BUSY",
            message: "Hozirda boshqa akademik jarayon bajarilmoqda.",
          };
        }

        // Lock expired -> recover
        await tx.verificationToken.delete({
          where: { token: lockKey },
        });
      }

      await tx.verificationToken.create({
        data: {
          token: lockKey,
          identifier: `job_${newJobId}`,
          expires: expiresAt,
        },
      });

      return {
        acquired: true,
        jobId: newJobId,
      };
    });
  } catch (err) {
    if (err?.code === "P2002") {
      return {
        acquired: false,
        reason: "LOCKED",
        message: "Hozirda boshqa akademik jarayon bajarilmoqda.",
      };
    }
    console.error("[ACQUIRE_LOCK_ERR]", err);
    return {
      acquired: false,
      reason: "ERROR",
    };
  }
}

async function releaseUserLock(telegramId, jobId) {
  const lockKey = `tg_lock_${telegramId}`;
  try {
    const res = await prisma.verificationToken.deleteMany({
      where: {
        token: lockKey,
        identifier: `job_${jobId}`,
      },
    });
    return res.count > 0;
  } catch (err) {
    console.error("[RELEASE_LOCK_ERR]", err);
    return false;
  }
}

async function isJobActive(telegramId, jobId) {
  const lockKey = `tg_lock_${telegramId}`;
  try {
    const existing = await prisma.verificationToken.findUnique({
      where: { token: lockKey },
    });
    if (!existing) return false;
    if (existing.identifier !== `job_${jobId}`) return false;
    if (existing.expires <= new Date()) return false;
    return true;
  } catch (err) {
    return false;
  }
}

async function forceReleaseUserLock(telegramId) {
  const lockKey = `tg_lock_${telegramId}`;
  await prisma.verificationToken.deleteMany({
    where: { token: lockKey },
  });
}

async function claimTelegramUpdate(updateId) {
  const key = `tg_upd_${updateId}`;
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  try {
    await prisma.verificationToken.create({
      data: {
        token: key,
        identifier: "PROCESSED",
        expires,
      },
    });
    return { isFirstAttempt: true };
  } catch (err) {
    if (err?.code === "P2002") {
      return { isFirstAttempt: false };
    }
    return { isFirstAttempt: true };
  }
}

async function setBotSession(telegramId, state) {
  const sessKey = `tg_sess_${telegramId}`;
  const base64Json = Buffer.from(
    JSON.stringify({ ...state, _ts: Date.now() })
  ).toString("base64");
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.verificationToken.upsert({
    where: { token: sessKey },
    update: {
      identifier: base64Json,
      expires,
    },
    create: {
      token: sessKey,
      identifier: base64Json,
      expires,
    },
  });
}

async function getBotSession(telegramId) {
  const sessKey = `tg_sess_${telegramId}`;
  const record = await prisma.verificationToken.findUnique({
    where: { token: sessKey },
  });
  if (record && record.expires > new Date()) {
    const jsonStr = Buffer.from(record.identifier, "base64").toString("utf-8");
    return JSON.parse(jsonStr);
  }
  return null;
}

async function runAudit() {
  const testTgId1 = 888001;
  const testTgId2 = 888002;
  const testUpdateId = 777001;

  // Cleanup any old test rows before starting
  await forceReleaseUserLock(testTgId1);
  await forceReleaseUserLock(testTgId2);
  await prisma.verificationToken.deleteMany({
    where: {
      token: {
        in: [
          `tg_lock_${testTgId1}`,
          `tg_lock_${testTgId2}`,
          `tg_upd_${testUpdateId}`,
          `tg_sess_${testTgId1}`,
          `tg_sess_${testTgId2}`,
        ],
      },
    },
  });

  console.log("\n--- TEST 1: Atomic Concurrency (Parallel Lock Acquisition for Same User) ---");
  {
    // Launch 2 parallel lock attempts simultaneously
    const [resA, resB] = await Promise.all([
      acquireUserLock(testTgId1, 60),
      acquireUserLock(testTgId1, 60),
    ]);

    console.log("Result A:", resA);
    console.log("Result B:", resB);

    const acquiredCount = (resA.acquired ? 1 : 0) + (resB.acquired ? 1 : 0);
    assert.strictEqual(
      acquiredCount,
      1,
      "Exactly ONE parallel request must acquire the lock; the other must be rejected"
    );

    const activeJob = resA.acquired ? resA.jobId : resB.jobId;
    const active = await isJobActive(testTgId1, activeJob);
    assert.strictEqual(active, true, "Winner job must be active in DB");

    // Clean up
    await releaseUserLock(testTgId1, activeJob);
    console.log("[PASS] Test 1: Atomic Concurrency & Mutual Exclusion Verified");
  }

  console.log("\n--- TEST 2: Multi-User Isolation (User A does not block User B) ---");
  {
    const [userA, userB] = await Promise.all([
      acquireUserLock(testTgId1, 60),
      acquireUserLock(testTgId2, 60),
    ]);

    assert.strictEqual(userA.acquired, true, "User A must acquire lock");
    assert.strictEqual(userB.acquired, true, "User B must acquire lock concurrently");

    // Cleanup
    await releaseUserLock(testTgId1, userA.jobId);
    await releaseUserLock(testTgId2, userB.jobId);
    console.log("[PASS] Test 2: Multi-User Isolation Verified");
  }

  console.log("\n--- TEST 3: Telegram Webhook Idempotency (Duplicate update_id deduplication) ---");
  {
    const attempt1 = await claimTelegramUpdate(testUpdateId);
    assert.strictEqual(attempt1.isFirstAttempt, true, "First update attempt must be accepted");

    const attempt2 = await claimTelegramUpdate(testUpdateId);
    assert.strictEqual(
      attempt2.isFirstAttempt,
      false,
      "Duplicate update attempt (retry) must be detected as duplicate"
    );

    const attempt3 = await claimTelegramUpdate(testUpdateId);
    assert.strictEqual(
      attempt3.isFirstAttempt,
      false,
      "Subsequent retry must also be detected as duplicate"
    );

    // Cleanup
    await prisma.verificationToken.deleteMany({
      where: { token: `tg_upd_${testUpdateId}` },
    });
    console.log("[PASS] Test 3: Webhook Retry Idempotency Verified (No duplicate execution)");
  }

  console.log("\n--- TEST 4: Timeout & Lock Recovery (Auto-takeover on expired lease) ---");
  {
    const staleJobId = crypto.randomUUID();
    // Simulate expired lock from a crashed / timed out job
    await prisma.verificationToken.create({
      data: {
        token: `tg_lock_${testTgId1}`,
        identifier: `job_${staleJobId}`,
        expires: new Date(Date.now() - 5000), // 5s in past
      },
    });

    // Stale job should no longer be active
    const isStaleActive = await isJobActive(testTgId1, staleJobId);
    assert.strictEqual(isStaleActive, false, "Stale job must not be reported as active");

    // New request arrives and must automatically recover the expired lock
    const recoverRes = await acquireUserLock(testTgId1, 60);
    assert.strictEqual(recoverRes.acquired, true, "New job must automatically recover expired lock");
    assert.notStrictEqual(recoverRes.jobId, staleJobId, "New job gets a fresh jobId");

    await releaseUserLock(testTgId1, recoverRes.jobId);
    console.log("[PASS] Test 4: Expired Lock Auto-Recovery Verified");
  }

  console.log("\n--- TEST 5: Stale Delayed Job Discard (No version overwrite) ---");
  {
    // Job 1 acquires lock
    const job1 = await acquireUserLock(testTgId1, 60);
    assert.strictEqual(job1.acquired, true);

    // Later, user cancels or lock is force-released, and Job 2 starts
    await forceReleaseUserLock(testTgId1);
    const job2 = await acquireUserLock(testTgId1, 60);
    assert.strictEqual(job2.acquired, true);

    // Stale Job 1 finally finishes and tries to check if it's active
    const job1Active = await isJobActive(testTgId1, job1.jobId);
    assert.strictEqual(job1Active, false, "Stale Job 1 must be flagged as inactive");

    // Stale Job 1 tries to release the lock
    const releasedByJob1 = await releaseUserLock(testTgId1, job1.jobId);
    assert.strictEqual(releasedByJob1, false, "Job 1 release must fail and NOT delete Job 2's lock");

    // Job 2 is still active!
    const job2Active = await isJobActive(testTgId1, job2.jobId);
    assert.strictEqual(job2Active, true, "Job 2 lock must remain intact and valid");

    await releaseUserLock(testTgId1, job2.jobId);
    console.log("[PASS] Test 5: Stale Delayed Job Discard & Lock Protection Verified");
  }

  console.log("\n--- TEST 6: Atomic Session Upsert (Elimination of deleteMany + create race) ---");
  {
    // Run 5 simultaneous upserts
    await Promise.all([
      setBotSession(testTgId1, { type: "coursework", step: "topic", topic: "Topic A" }),
      setBotSession(testTgId1, { type: "coursework", step: "subject", topic: "Topic B" }),
      setBotSession(testTgId1, { type: "coursework", step: "editing", docId: "doc_123" }),
      setBotSession(testTgId1, { type: "referat", step: "length", topic: "Topic C" }),
      setBotSession(testTgId1, { type: "bmi", step: "confirm", topic: "Topic D" }),
    ]);

    // Check row count in VerificationToken for this session key
    const rows = await prisma.verificationToken.findMany({
      where: { token: `tg_sess_${testTgId1}` },
    });
    assert.strictEqual(rows.length, 1, "Exactly ONE session record must exist in DB (no duplicates)");

    const readState = await getBotSession(testTgId1);
    assert.ok(readState && readState.type, "Session must be valid JSON");

    // Cleanup
    await prisma.verificationToken.deleteMany({
      where: { token: `tg_sess_${testTgId1}` },
    });
    console.log("[PASS] Test 6: Atomic Session Upsert Verified");
  }

  console.log("\n--- TEST 7: Force Release (/cancel command) ---");
  {
    const lock = await acquireUserLock(testTgId1, 100);
    assert.strictEqual(lock.acquired, true);

    await forceReleaseUserLock(testTgId1);

    const lockAfterCancel = await acquireUserLock(testTgId1, 100);
    assert.strictEqual(
      lockAfterCancel.acquired,
      true,
      "Immediately after /cancel, new lock can be acquired without delay"
    );

    await releaseUserLock(testTgId1, lockAfterCancel.jobId);
    console.log("[PASS] Test 7: Force Release on /cancel Verified");
  }

  console.log("\n=======================================================");
  console.log("🎉 ALL 7 AUDIT SUITES PASSED FLAWLESSLY WITH REAL POSTGRESQL!");
  console.log("=======================================================");
}

runAudit()
  .catch((e) => {
    console.error("FATAL AUDIT FAILURE:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
