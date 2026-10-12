import { PrismaClient } from "@prisma/client";
import { PGlite } from "@electric-sql/pglite";
import { PrismaPGlite } from "pglite-prisma-adapter";
import { Pool as PgPool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { env } from "../core/config/env";
import ws from "ws";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const isProduction = env.NODE_ENV === "production";
  const databaseUrl = process.env.DATABASE_URL || "";

  if (databaseUrl.includes("neon.tech")) {
    // Neon adapter
    neonConfig.webSocketConstructor = ws;
    const pool = new NeonPool({ connectionString: databaseUrl });
    const adapter = new PrismaNeon(pool as any);
    return new PrismaClient({ adapter, log: isProduction ? ["error"] : ["query", "error", "warn"] });
  } else if (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://")) {
    // Standard PG adapter
    const pool = new PgPool({ connectionString: databaseUrl });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter, log: isProduction ? ["error"] : ["query", "error", "warn"] });
  }

  // Fallback to local PGlite
  const client = new PGlite("./prisma/pglite");
  const adapter = new PrismaPGlite(client);
  return new PrismaClient({ adapter, log: ["query", "error", "warn"] });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
