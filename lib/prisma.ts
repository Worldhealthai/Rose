import { PrismaClient } from "@prisma/client";

// On serverless (Vercel) + Supabase, use the transaction pooler (port 6543) with
// PgBouncer mode so connections are multiplexed and short-lived. This avoids the
// intermittent "connection" failures you get from holding session-mode
// connections across many serverless invocations. Works whether the configured
// URL is the session (5432) or transaction (6543) pooler.
function resolveDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  try {
    const u = new URL(url);
    if (u.hostname.endsWith(".pooler.supabase.com")) {
      u.port = "6543";
      u.searchParams.set("pgbouncer", "true");
      if (!u.searchParams.has("connection_limit")) {
        u.searchParams.set("connection_limit", "1");
      }
      return u.toString();
    }
  } catch {
    // Not a parseable URL — let Prisma surface the error itself.
  }
  return url;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const datasourceUrl = resolveDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(datasourceUrl ? { datasourceUrl } : {}),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
