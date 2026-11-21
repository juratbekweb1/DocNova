import { randomBytes } from "crypto";
import { hash } from "bcryptjs";

export interface PasswordResetRepository {
  create(input: { email: string; token: string; expiresAt: Date }): Promise<unknown>;
  findValidToken(token: string): Promise<unknown | null>;
  markUsed(token: string): Promise<unknown>;
  invalidateAllForEmail(email: string): Promise<unknown>;
  updateUserPassword?(email: string, passwordHash: string): Promise<unknown>;
}

export class PasswordResetService {
  constructor(private readonly repository: PasswordResetRepository) {}

  async requestReset(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const token = this.generateToken();

    // Always return success to prevent user enumeration
    await this.repository.create({
      email: normalizedEmail,
      token,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    });

    return {
      success: true,
      token,
      message: "If an account exists, you will receive a password reset email.",
    };
  }

  async verifyToken(token: string) {
    const record = await this.repository.findValidToken(token);

    if (!record) {
      return { valid: false };
    }

    return { valid: true };
  }

  async resetPassword(token: string, newPassword: string) {
    const record = (await this.repository.findValidToken(token)) as { email: string } | null;

    if (!record || !record.email) {
      throw new Error("Invalid or expired reset token");
    }

    const hashedPassword = await hash(newPassword, 12);

    if (this.repository.updateUserPassword) {
      await this.repository.updateUserPassword(record.email, hashedPassword);
    }

    await this.repository.markUsed(token);
    await this.repository.invalidateAllForEmail(record.email);

    return { success: true };
  }

  private generateToken(): string {
    return randomBytes(32).toString("hex");
  }
}
