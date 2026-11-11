import crypto from "crypto";

const EPHEMERAL_GLOBAL_KEY = "__docnovaEphemeralInternalSecret";

function getDerivedServerSecret(): string | null {
  const configured = process.env.INTERNAL_SECRET?.trim();
  if (configured) {
    return configured;
  }

  const rootSecret =
    process.env.AUTH_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    process.env.ENCRYPTION_KEY?.trim();

  if (rootSecret) {
    return crypto
      .createHmac("sha256", rootSecret)
      .update("docnova-internal-secret-v1")
      .digest("hex");
  }

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const g = globalThis as unknown as Record<string, string | undefined>;
  if (!g[EPHEMERAL_GLOBAL_KEY]) {
    g[EPHEMERAL_GLOBAL_KEY] = crypto.randomBytes(32).toString("hex");
  }
  return g[EPHEMERAL_GLOBAL_KEY]!;
}

/**
 * Returns an unforgeable per-deployment internal secret (never a static hardcoded string).
 * Returns `null` in production if neither `INTERNAL_SECRET` nor `AUTH_SECRET`/`NEXTAUTH_SECRET`/`ENCRYPTION_KEY` is configured.
 */
export function getInternalSecret(): string | null {
  return getDerivedServerSecret();
}

/**
 * Constant-time equality check over SHA-256 digests so secret lengths never leak timing.
 */
export function verifySharedSecret(
  provided: string | null | undefined,
  expected: string | null | undefined
): boolean {
  if (!provided || !expected) {
    return false;
  }
  const providedDigest = crypto.createHash("sha256").update(provided).digest();
  const expectedDigest = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(providedDigest, expectedDigest);
}
