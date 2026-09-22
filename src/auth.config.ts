import type { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import { normalizeRole } from "@/lib/roles";

export const authConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = normalizeRole(token.role) ?? "USER";
        session.user.username = token.username as string | null;
        session.user.displayName = token.displayName as string | null;
        session.user.avatar = token.avatar as string | null;
        session.user.theme = token.theme as string | null;
        session.user.language = token.language as string | null;
        session.user.sessionVersion = token.sessionVersion as number;
        session.user.twoFactorEnabled = token.twoFactorEnabled as boolean;
      }
      return session;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        const u = user as unknown as Record<string, unknown>;
        const directRole = normalizeRole(u.role);

        if (directRole) {
          token.role = directRole;
        }

        token.username = u.username;
        token.displayName = u.displayName;
        token.avatar = u.avatar;
        token.theme = u.theme;
        token.language = u.language;
        token.sessionVersion = u.sessionVersion;
        token.twoFactorEnabled = u.twoFactorEnabled;
      }

      if (token.id && !token.role) {
        const { prisma } = await import("@/lib/prisma");
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        });

        token.role = normalizeRole(dbUser?.role) ?? "USER";
      }

      if (!token.role) {
        token.role = "USER";
      }

      // Handle session updates (e.g., when user updates profile)
      if (trigger === "update" && session) {
        if (session.username) token.username = session.username;
        if (session.displayName) token.displayName = session.displayName;
        if (session.avatar) token.avatar = session.avatar;
        if (session.theme) token.theme = session.theme;
        if (session.language) token.language = session.language;
        if (session.sessionVersion !== undefined) token.sessionVersion = session.sessionVersion;
        if (session.twoFactorEnabled !== undefined) token.twoFactorEnabled = session.twoFactorEnabled;
      }

      return token;
    },
  },
} satisfies AuthOptions;
