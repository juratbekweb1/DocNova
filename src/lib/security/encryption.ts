import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const EPHEMERAL_ENCRYPTION_KEY = "__docnovaEphemeralEncryptionKey";

function resolveEncryptionKey(): Buffer {
  const configured = process.env.ENCRYPTION_KEY?.trim();
  if (configured) {
    return Buffer.from(configured.padEnd(32, "0").slice(0, 32));
  }

  const rootSecret = process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
  if (rootSecret) {
    return crypto.createHash("sha256").update(`docnova-encryption-key:${rootSecret}`).digest();
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "ENCRYPTION_KEY (or AUTH_SECRET/NEXTAUTH_SECRET) must be configured in production."
    );
  }

  const g = globalThis as unknown as Record<string, Buffer | undefined>;
  if (!g[EPHEMERAL_ENCRYPTION_KEY]) {
    g[EPHEMERAL_ENCRYPTION_KEY] = crypto.randomBytes(32);
  }
  return g[EPHEMERAL_ENCRYPTION_KEY]!;
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, resolveEncryptionKey(), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

export function decrypt(hash: string): string {
  const parts = hash.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted format");
  }
  const iv = Buffer.from(parts[0], "hex");
  const authTag = Buffer.from(parts[1], "hex");
  const encryptedText = Buffer.from(parts[2], "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, resolveEncryptionKey(), iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText, undefined, "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
