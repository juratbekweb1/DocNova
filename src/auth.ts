import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./lib/prisma";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { NextAuthAuthService } from "./core/auth";
import { checkAccountLockout, recordFailedLoginAttempt, recordSuccessfulLogin } from "./lib/security/account-lockout";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
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

        // Check account lockout with database error handling
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
          throw new Error(`Account is locked. Please try again in ${Math.ceil((lockoutResult.lockoutExpires!.getTime() - Date.now()) / 60000)} minutes.`);
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
            organizations: {
              include: {
                organization: true,
              },
            },
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

        // Record successful login
        await recordSuccessfulLogin(email);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
});

export const authService = new NextAuthAuthService();
