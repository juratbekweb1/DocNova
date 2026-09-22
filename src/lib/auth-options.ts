import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";

import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";
import {
  checkAccountLockout,
  recordFailedLoginAttempt,
  recordSuccessfulLogin,
} from "@/lib/security/account-lockout";

export const authOptions = {
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60,
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
  providers: [
    ...authConfig.providers,
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        if (!credentials?.email || typeof credentials.email !== 'string' || !credentials.email.trim()) {
          throw new Error('Email requirement failed: valid email string is required.');
        }

        if (!credentials?.password) {
          return null;
        }

        const email = credentials.email.trim().toLowerCase();

        let lockoutResult;
        try {
          lockoutResult = await checkAccountLockout(email);
        } catch (error: any) {
          if (error.code === 'ECONNREFUSED' || (error.message && error.message.includes('invocation'))) {
            throw new Error('Ma\'lumotlar bazasiga ulanib bo\'lmadi. Iltimos, PostgreSQL ishlayotganiga va DATABASE_URL to\'g\'riligiga ishonch hosil qiling.');
          }
          throw error;
        }
        if (lockoutResult.isLocked) {
          throw new Error(
            `Account is locked. Please try again in ${Math.ceil(
              (lockoutResult.lockoutExpires!.getTime() - Date.now()) / 60000
            )} minutes.`
          );
        }

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            passwordHash: true,
            role: true,
            username: true,
            displayName: true,
            avatar: true,
            theme: true,
            language: true,
            sessionVersion: true,
            twoFactorEnabled: true,
            twoFactorSecret: true,
          },
        });

        if (!user || !user.passwordHash) {
          await recordFailedLoginAttempt(email);
          return null;
        }

        const bcrypt = await import("bcryptjs");
        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isPasswordValid) {
          await recordFailedLoginAttempt(email);
          return null;
        }

        if (user.twoFactorEnabled && user.twoFactorSecret) {
          const { totpCode } = credentials as Record<string, string>;
          if (!totpCode) {
            throw new Error("2FA token required");
          }
          
          const { decrypt } = await import("@/lib/security/encryption");
          const { authenticator } = await import("otplib");
          
          const secret = decrypt(user.twoFactorSecret);
          const isValid = authenticator.verify({ token: totpCode, secret });
          
          if (!isValid) {
            // Check if it's a backup code
            const backupCode = await prisma.backupRecoveryCode.findUnique({
              where: { code: totpCode },
            });
            
            if (backupCode && !backupCode.used && backupCode.userId === user.id) {
              await prisma.backupRecoveryCode.update({
                where: { id: backupCode.id },
                data: { used: true, usedAt: new Date() },
              });
            } else {
              await recordFailedLoginAttempt(email);
              throw new Error("Invalid 2FA token");
            }
          }
        }

        await recordSuccessfulLogin(email);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar,
          theme: user.theme,
          language: user.language,
          sessionVersion: user.sessionVersion,
          twoFactorEnabled: user.twoFactorEnabled,
        };
      },
    }),
  ],
};
