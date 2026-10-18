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

/**
 * Atomic idempotency key check for Telegram webhook retries.
 * Uses PostgreSQL unique constraint on token to prevent duplicate update executions.
 */
export async function claimTelegramUpdate(
  updateId: number | string
): Promise<{ isFirstAttempt: boolean }> {
  const key = `tg_upd_${updateId}`;
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24-hour retention

  try {
    await prisma.verificationToken.create({
      data: {
        token: key,
        identifier: "PROCESSED",
        expires,
      },
    });
    return { isFirstAttempt: true };
  } catch (err: unknown) {
    const prismaErr = err as { code?: string };
    if (prismaErr?.code === "P2002") {
      // Exactly this update_id was already claimed by an in-flight or completed execution
      return { isFirstAttempt: false };
    }
    console.error("[CLAIM_TELEGRAM_UPDATE_ERR]", err);
    // On unexpected DB error, fail open to avoid dropping legitimate user actions
    return { isFirstAttempt: true };
  }
}
