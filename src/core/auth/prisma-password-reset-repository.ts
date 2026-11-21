import { prisma } from "../../lib/prisma";
import type { PasswordResetRepository } from "./password-reset-service";

export class PrismaPasswordResetRepository implements PasswordResetRepository {
  async create(input: { email: string; token: string; expiresAt: Date }) {
    return prisma.passwordReset.create({
      data: {
        email: input.email,
        token: input.token,
        expires: input.expiresAt,
      },
    });
  }

  async findValidToken(token: string) {
    return prisma.passwordReset.findFirst({
      where: {
        token,
        usedAt: null,
        expires: { gt: new Date() },
      },
    });
  }

  async markUsed(token: string) {
    return prisma.passwordReset.updateMany({
      where: { token },
      data: { usedAt: new Date() },
    });
  }

  async invalidateAllForEmail(email: string) {
    return prisma.passwordReset.updateMany({
      where: { email, usedAt: null },
      data: { usedAt: new Date() },
    });
  }

  async updateUserPassword(email: string, passwordHash: string) {
    return prisma.user.update({
      where: { email },
      data: {
        passwordHash,
        sessionVersion: { increment: 1 },
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  }
}
