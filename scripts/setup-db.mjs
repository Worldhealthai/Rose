// Runs during the Vercel build: checks the connection string, then creates the
// database tables with `prisma db push`. Prints the host (never the password).
// It retries and, if the database is momentarily busy, lets the build continue
// rather than blocking the whole deploy.

import { execFileSync } from "node:child_process";

const url = process.env.DATABASE_URL;

if (!url) {
  console.error("\n❌ DATABASE_URL is not set for this deployment.");
  console.error(
    "   Add it in Vercel → Settings → Environment Variables and tick",
  );
  console.error("   Production, Preview AND Development, then redeploy.\n");
  process.exit(1);
}

let u;
try {
  u = new URL(url);
} catch {
  console.error("\n❌ DATABASE_URL doesn't look like a valid URL.");
  console.error(
    "   Common cause: the password has special characters (@ : / # ?) that",
  );
  console.error("   must be percent-encoded — or it still contains [YOUR-PASSWORD].");
  process.exit(1);
}

console.log(`\n🔌 Database host: ${u.hostname}:${u.port || "5432"}  (user: ${u.username})`);

if (u.hostname.startsWith("db.") && u.hostname.endsWith(".supabase.co")) {
  console.error(
    "\n❌ That's Supabase's DIRECT connection, which Vercel can't reach (IPv6-only).",
  );
  console.error("   Use the Session pooler (Supabase → Connect → Session pooler).\n");
  process.exit(1);
}

// Table creation needs a session-mode connection (port 5432), one connection,
// and a short connect timeout so a busy pool fails fast and we can retry.
if (u.hostname.endsWith(".pooler.supabase.com")) {
  u.port = "5432";
  u.searchParams.delete("pgbouncer");
}
u.searchParams.set("connection_limit", "1");
u.searchParams.set("connect_timeout", "10");
const dbUrl = u.toString();

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

let ok = false;
for (let attempt = 1; attempt <= 5; attempt++) {
  try {
    execFileSync("npx", ["--no-install", "prisma", "db", "push", "--skip-generate"], {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: dbUrl },
    });
    ok = true;
    break;
  } catch {
    console.warn(
      `\n⚠ Database sync attempt ${attempt}/5 failed (the connection pool may be busy).`,
    );
    if (attempt < 5) sleep(2000 * attempt);
  }
}

if (!ok) {
  console.warn(
    "\n⚠ Skipping table sync for this deploy so the build can continue.",
  );
  console.warn(
    "  If you just changed the data model, redeploy once more and it will sync.\n",
  );
}

process.exit(0);
