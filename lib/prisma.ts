import { PrismaClient } from "@prisma/client";

// Supabase's transaction pooler (port 6543) doesn't work well with Prisma's
// prepared statements. If a Supabase pooler URL is given on 6543, use session
// mode (5432) on the same host instead — so it works no matter which string
// was pasted into the environment variables.
function resolveDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  try {
    const u = new URL(url);
    if (u.hostname.endsWith(".pooler.supabase.com") && u.port === "6543") {
      u.port = "5432";
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
