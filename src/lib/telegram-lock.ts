import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export interface LockResult {
  acquired: boolean;
  jobId?: string;
  reason?: "LOCKED" | "BUSY" | "ERROR";
  message?: string;
}

export type AcademicTaskStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
export type AcademicTaskStage =
  | "INIT"
  | "LIMIT_CHECK"
  | "GEMINI_GEN"
  | "DOCX_BUILD"
  | "DB_SAVE"
  | "TG_SEND"
  | "COMPLETED"
  | "FAILED";

export interface AcademicTaskRecord {
  taskId: string;
  telegramId: string | number;
  userId: string;
  workType: string;
  topic: string;
  subject?: string;
  status: AcademicTaskStatus;
  stage: AcademicTaskStage;
  docId?: string;
  fileName?: string;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Creates a durable academic task record in PostgreSQL using VerificationToken.
 * Tracks task lifecycle through PENDING -> RUNNING -> COMPLETED / FAILED states.
 */
export async function createAcademicTask(params: {
  taskId: string;
  telegramId: string | number;
  userId: string;
  workType: string;
  topic: string;
  subject?: string;
}): Promise<void> {
  const key = `tg_task_${params.taskId}`;
  const now = Date.now();
  const task: AcademicTaskRecord = {
    taskId: params.taskId,
    telegramId: params.telegramId,
    userId: params.userId,
    workType: params.workType,
    topic: params.topic,
    subject: params.subject,
    status: "RUNNING",
    stage: "INIT",
    createdAt: now,
    updatedAt: now,
  };

  const payload = Buffer.from(JSON.stringify(task)).toString("base64");
  const expires = new Date(now + 24 * 60 * 60 * 1000); // 24-hour retention

  try {
    await prisma.verificationToken.upsert({
      where: { token: key },
      update: {
        identifier: payload,
        expires,
      },
      create: {
        token: key,
        identifier: payload,
        expires,
      },
    });
  } catch (err) {
    console.error("[CREATE_ACADEMIC_TASK_ERR]", err);
  }
}

/**
 * Updates the stage of an active academic task.
 */
export async function updateAcademicTaskStage(
  taskId: string,
  stage: AcademicTaskStage,
  extra?: { docId?: string; fileName?: string; error?: string }
): Promise<void> {
  const key = `tg_task_${taskId}`;
  try {
    const existing = await prisma.verificationToken.findUnique({
      where: { token: key },
    });
    if (!existing) return;

    const task = JSON.parse(
      Buffer.from(existing.identifier, "base64").toString("utf-8")
    ) as AcademicTaskRecord;
    task.stage = stage;
    task.updatedAt = Date.now();
    if (extra?.docId) task.docId = extra.docId;
    if (extra?.fileName) task.fileName = extra.fileName;
    if (extra?.error) task.error = extra.error;

    await prisma.verificationToken.update({
      where: { token: key },
      data: {
        identifier: Buffer.from(JSON.stringify(task)).toString("base64"),
      },
    });
  } catch (err) {
    console.error("[UPDATE_ACADEMIC_TASK_STAGE_ERR]", err);
  }
}

/**
 * Marks an academic task as completed with its generated document ID.
 */
export async function completeAcademicTask(
  taskId: string,
  docId: string,
  fileName: string
): Promise<void> {
  const key = `tg_task_${taskId}`;
  try {
    const existing = await prisma.verificationToken.findUnique({
      where: { token: key },
    });
    if (!existing) return;

    const task = JSON.parse(
      Buffer.from(existing.identifier, "base64").toString("utf-8")
    ) as AcademicTaskRecord;
    task.status = "COMPLETED";
    task.stage = "COMPLETED";
    task.docId = docId;
    task.fileName = fileName;
    task.updatedAt = Date.now();

    await prisma.verificationToken.update({
      where: { token: key },
      data: {
        identifier: Buffer.from(JSON.stringify(task)).toString("base64"),
      },
    });
  } catch (err) {
    console.error("[COMPLETE_ACADEMIC_TASK_ERR]", err);
  }
}

/**
 * Marks an academic task as failed with an error description.
 */
export async function failAcademicTask(taskId: string, error: string): Promise<void> {
  const key = `tg_task_${taskId}`;
  try {
    const existing = await prisma.verificationToken.findUnique({
      where: { token: key },
    });
    if (!existing) return;

    const task = JSON.parse(
      Buffer.from(existing.identifier, "base64").toString("utf-8")
    ) as AcademicTaskRecord;
    task.status = "FAILED";
    task.stage = "FAILED";
    task.error = error;
    task.updatedAt = Date.now();

    await prisma.verificationToken.update({
      where: { token: key },
      data: {
        identifier: Buffer.from(JSON.stringify(task)).toString("base64"),
      },
    });
  } catch (err) {
    console.error("[FAIL_ACADEMIC_TASK_ERR]", err);
  }
}

/**
 * Retrieves an academic task record by task ID.
 */
export async function getAcademicTask(taskId: string): Promise<AcademicTaskRecord | null> {
  const key = `tg_task_${taskId}`;
  try {
    const existing = await prisma.verificationToken.findUnique({
      where: { token: key },
    });
    if (!existing) return null;
    return JSON.parse(
      Buffer.from(existing.identifier, "base64").toString("utf-8")
    ) as AcademicTaskRecord;
  } catch (err) {
    console.error("[GET_ACADEMIC_TASK_ERR]", err);
    return null;
  }
}

/**
 * Atomically acquires a distributed lock in PostgreSQL for a Telegram user.
 * Prevents parallel AI operations, double-billing, and race conditions.
 * Includes timeout recovery (auto-takeover if existing lock expired or associated task finished).
 */
export async function acquireUserLock(
  telegramId: string | number,
  leaseSeconds = 70
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
        let isStale = existing.expires <= now;

        // If the lock timestamp is not yet expired, check if the task already finished, failed, or timed out
        if (!isStale && existing.identifier.startsWith("job_")) {
          const oldJobId = existing.identifier.replace(/^job_/, "");
          const taskKey = `tg_task_${oldJobId}`;
          const oldTaskRow = await tx.verificationToken.findUnique({
            where: { token: taskKey },
          });
          if (oldTaskRow) {
            try {
              const oldTask = JSON.parse(
                Buffer.from(oldTaskRow.identifier, "base64").toString("utf-8")
              ) as AcademicTaskRecord;
              if (oldTask.status === "COMPLETED" || oldTask.status === "FAILED") {
                isStale = true; // Job already finished! Lock is safe to reclaim immediately.
              } else if (Date.now() - (oldTask.updatedAt || oldTask.createdAt || 0) > 60_000) {
                // Task was left in RUNNING/PENDING for >60s without any updates (serverless container died/timed out)
                isStale = true;
                oldTask.status = "FAILED";
                oldTask.error = "Avvalgi jarayon 60 soniyadan ortiq javobsiz qoldi va to'xtatildi.";
                oldTask.updatedAt = Date.now();
                await tx.verificationToken.update({
                  where: { token: taskKey },
                  data: {
                    identifier: Buffer.from(JSON.stringify(oldTask)).toString("base64"),
                  },
                });
              }
            } catch {
              // ignore parse errors
            }
          } else {
            // Task record does not exist; if lock has been held for >60s, reclaim it
            const lockAgeMs = now.getTime() - (existing.expires.getTime() - leaseSeconds * 1000);
            if (lockAgeMs > 60_000) {
              isStale = true;
            }
          }
        }

        if (!isStale) {
          // Lock is actively held by a genuinely running job
          return {
            acquired: false,
            reason: "BUSY",
            message:
              "⏳ Hozirda boshqa akademik jarayon bajarilmoqda. Iltimos, u yakunlanishini kuting.",
          };
        }

        // Lock expired or previous job finished -> safely recover
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
  persisted: boolean;
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
          persisted: true,
          status: "FIRST_ATTEMPT",
        };
      }

      // If already completed: definitely duplicate retry of an already finished task
      if (existing.identifier === "COMPLETED") {
        return {
          canProcess: false,
          isDuplicate: true,
          persisted: true,
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
          persisted: true,
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
          persisted: true,
          status: "RETRY_ALLOWED",
        };
      }

      // Still actively processing in another in-flight worker: return 200 OK so Telegram doesn't storm retries
      return {
        canProcess: false,
        isDuplicate: true,
        persisted: true,
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
        persisted: true,
        status: "IN_PROGRESS",
      };
    }
    console.error("[CLAIM_TELEGRAM_UPDATE_ERR]", err);
    // On unexpected DB error, fail-open to avoid losing user message, but note persisted = false
    return {
      canProcess: true,
      isDuplicate: false,
      persisted: false,
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
