import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export interface LockResult {
  acquired: boolean;
  jobId?: string;
  reason?: "LOCKED" | "BUSY" | "ERROR";
  message?: string;
}

/**
 * Atomically acquires a distributed lock in PostgreSQL for a Telegram user.
 * Prevents parallel AI operations, double-billing, and race conditions.
 * Includes timeout recovery (auto-takeover if existing lock expired).
 */
export async function acquireUserLock(
  telegramId: string | number,
  leaseSeconds = 150
): Promise<LockResult> {
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
          // Lock is actively held by a running job
          return {
            acquired: false,
            reason: "BUSY",
            message:
              "⏳ Hozirda boshqa akademik jarayon bajarilmoqda. Iltimos, u yakunlanishini kuting.",
          };
        }

        // Lock expired (previous job crashed or timed out) -> safely recover
        await tx.verificationToken.delete({
          where: { token: lockKey },
        });
      }

      // Create new lock row with unique token constraint
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
  } catch (err: unknown) {
    const prismaErr = err as { code?: string };
    if (prismaErr?.code === "P2002") {
      // Concurrent insert at the exact same millisecond: PostgreSQL unique constraint prevented conflict
      return {
        acquired: false,
        reason: "LOCKED",
        message:
          "⏳ Hozirda boshqa akademik jarayon bajarilmoqda. Iltimos, u yakunlanishini kuting.",
      };
    }
    console.error("[ACQUIRE_USER_LOCK_ERR]", err);
    return {
      acquired: false,
      reason: "ERROR",
      message: "Tizimda vaqtincha xatolik yuz berdi.",
    };
  }
}

/**
 * Releases the distributed lock only if the calling job is the active owner.
 * If the lock was superseded or expired, it does not delete someone else's new lock.
 */
export async function releaseUserLock(
  telegramId: string | number,
  jobId: string
): Promise<boolean> {
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
    console.error("[RELEASE_USER_LOCK_ERR]", err);
    return false;
  }
}

/**
 * Checks if a job is still the active lock owner and has not expired.
 * Used before committing document updates to discard stale delayed responses.
 */
export async function isJobActive(telegramId: string | number, jobId: string): Promise<boolean> {
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
    console.error("[IS_JOB_ACTIVE_ERR]", err);
    return false;
  }
}

/**
 * Renews the lease for an actively running job, extending its expiration.
 * Prevents long AI operations (>150s) from expiring and being preempted
 * while the model is actively generating responses.
 */
export async function renewUserLock(
  telegramId: string | number,
  jobId: string,
  extendSeconds = 120
): Promise<boolean> {
  const lockKey = `tg_lock_${telegramId}`;
  const newExpires = new Date(Date.now() + extendSeconds * 1000);
  try {
    const res = await prisma.verificationToken.updateMany({
      where: {
        token: lockKey,
        identifier: `job_${jobId}`,
      },
      data: {
        expires: newExpires,
      },
    });
    return res.count > 0;
  } catch (err) {
    console.error("[RENEW_USER_LOCK_ERR]", err);
    return false;
  }
}

/**
 * Force-releases lock for a user (e.g. when /cancel is invoked).
 */
export async function forceReleaseUserLock(telegramId: string | number): Promise<void> {
  const lockKey = `tg_lock_${telegramId}`;
  try {
    await prisma.verificationToken.deleteMany({
      where: { token: lockKey },
    });
  } catch (err) {
    console.error("[FORCE_RELEASE_USER_LOCK_ERR]", err);
  }
}

export interface UpdateClaimResult {
  canProcess: boolean;
  isDuplicate: boolean;
  status: "FIRST_ATTEMPT" | "IN_PROGRESS" | "ALREADY_COMPLETED" | "RETRY_ALLOWED";
}

/**
 * Atomic idempotency key check for Telegram webhook retries with a 3-state machine:
 * - PROCESSING: Worker is actively running. Concurrent retries within 180s return HTTP 200 without re-running AI.
 * - COMPLETED: Handler succeeded. Any future retry returns HTTP 200 without re-running AI.
 * - FAILED: Handler threw error. Telegram retries are safely permitted to re-process.
 */
export async function claimTelegramUpdate(updateId: number | string): Promise<UpdateClaimResult> {
  const key = `tg_upd_${updateId}`;
  const now = new Date();
  const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24-hour retention

  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.verificationToken.findUnique({
        where: { token: key },
      });

      if (!existing) {
        // First attempt ever: claim it atomically
        await tx.verificationToken.create({
          data: {
            token: key,
            identifier: "PROCESSING",
            expires,
          },
        });
        return {
          canProcess: true,
          isDuplicate: false,
          status: "FIRST_ATTEMPT",
        };
      }

      // If already completed: definitely duplicate retry of an already finished task
      if (existing.identifier === "COMPLETED") {
        return {
          canProcess: false,
          isDuplicate: true,
          status: "ALREADY_COMPLETED",
        };
      }

      // If previous attempt failed: allow Telegram retry to safely re-process!
      if (existing.identifier === "FAILED") {
        await tx.verificationToken.update({
          where: { token: key },
          data: {
            identifier: "PROCESSING",
            expires,
          },
        });
        return {
          canProcess: true,
          isDuplicate: false,
          status: "RETRY_ALLOWED",
        };
      }

      // If still "PROCESSING": check if the worker crashed or is still active
      // Serverless worker lease: 180 seconds
      const processingAgeMs = now.getTime() - (existing.expires.getTime() - 24 * 60 * 60 * 1000);
      if (processingAgeMs > 180 * 1000) {
        // Previous worker crashed or timed out without completing: safely take over for retry!
        await tx.verificationToken.update({
          where: { token: key },
          data: {
            identifier: "PROCESSING",
            expires,
          },
        });
        return {
          canProcess: true,
          isDuplicate: false,
          status: "RETRY_ALLOWED",
        };
      }

      // Still actively processing in another in-flight worker: return 200 OK so Telegram doesn't storm retries
      return {
        canProcess: false,
        isDuplicate: true,
        status: "IN_PROGRESS",
      };
    });
  } catch (err: unknown) {
    const prismaErr = err as { code?: string };
    if (prismaErr?.code === "P2002") {
      // Race condition on insert: another worker just inserted this key
      return {
        canProcess: false,
        isDuplicate: true,
        status: "IN_PROGRESS",
      };
    }
    console.error("[CLAIM_TELEGRAM_UPDATE_ERR]", err);
    // On unexpected DB error, fail-open to avoid losing user message
    return {
      canProcess: true,
      isDuplicate: false,
      status: "FIRST_ATTEMPT",
    };
  }
}

/**
 * Marks a Telegram webhook update as successfully completed.
 */
export async function markTelegramUpdateSuccess(updateId: number | string): Promise<void> {
  const key = `tg_upd_${updateId}`;
  try {
    await prisma.verificationToken.updateMany({
      where: { token: key },
      data: { identifier: "COMPLETED" },
    });
  } catch (err) {
    console.error("[MARK_TELEGRAM_UPDATE_SUCCESS_ERR]", err);
  }
}

/**
 * Marks a Telegram webhook update as failed so a retry is permitted.
 */
export async function markTelegramUpdateFailed(updateId: number | string): Promise<void> {
  const key = `tg_upd_${updateId}`;
  try {
    await prisma.verificationToken.updateMany({
      where: { token: key },
      data: { identifier: "FAILED" },
    });
  } catch (err) {
    console.error("[MARK_TELEGRAM_UPDATE_FAILED_ERR]", err);
  }
}
