import type { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import { normalizeRole } from "@/lib/roles";

const isProduction = process.env.NODE_ENV === "production";
const useSecureCookies = isProduction;
const cookiePrefix = useSecureCookies ? "__Secure-" : "";
const hostCookiePrefix = useSecureCookies ? "__Host-" : "";

export const authConfig = {
  useSecureCookies,
  cookies: {
    sessionToken: {
      name: `${cookiePrefix}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    callbackUrl: {
      name: `${cookiePrefix}next-auth.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    csrfToken: {
      name: `${hostCookiePrefix}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    pkceCodeVerifier: {
      name: `${cookiePrefix}next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
        maxAge: 900,
      },
    },
    state: {
      name: `${cookiePrefix}next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
        maxAge: 900,
      },
    },
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      const target = url.startsWith("/") ? `${baseUrl}${url}` : url;
      if (!target.startsWith(baseUrl)) {
        return `${baseUrl}/?auth=success`;
      }
      const parsed = new URL(target);
      if (
        parsed.pathname.startsWith("/telegram/connect") ||
        parsed.pathname.startsWith("/checkout") ||
        parsed.pathname.startsWith("/reset-password")
      ) {
        return target;
      }
      if (
        parsed.pathname === "/dashboard" ||
        parsed.pathname === "/login" ||
        parsed.pathname === "/register" ||
        parsed.pathname === "/"
      ) {
        return `${baseUrl}/?auth=success`;
      }
      return target;
    },
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

        token.username = (u.username as string) || (user.email ? user.email.split("@")[0] : null);
        token.displayName = (u.displayName as string) || user.name || null;
        token.avatar = (u.avatar as string) || user.image || null;
        token.theme = (u.theme as string) || "light";
        token.language = (u.language as string) || "uz";
        token.sessionVersion = u.sessionVersion;
        token.twoFactorEnabled = u.twoFactorEnabled;
      }

      if (token.id && (!token.role || trigger === "update")) {
        try {
          const { prisma } = await import("@/lib/prisma");
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true },
          });

          if (dbUser?.role) {
            token.role = normalizeRole(dbUser.role) ?? "USER";
          }
        } catch {
          // Ignore DB lookup errors in edge/jwt contexts
        }
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
        if (session.twoFactorEnabled !== undefined)
          token.twoFactorEnabled = session.twoFactorEnabled;
      }

      return token;
    },
  },
} satisfies AuthOptions;
