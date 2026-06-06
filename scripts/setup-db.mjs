// Runs during the Vercel build: checks the connection string, then creates the
// database tables with `prisma db push`. Prints the host (never the password)
// and fails fast with a plain-English message when something's wrong.

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
  console.error(
    "   must be percent-encoded — or it still contains [YOUR-PASSWORD].",
  );
  console.error(
    "   Easiest fix: reset the Supabase DB password to letters and numbers only.\n",
  );
  process.exit(1);
}

console.log(`\n🔌 Database host: ${u.hostname}:${u.port || "5432"}  (user: ${u.username})`);

if (u.hostname.startsWith("db.") && u.hostname.endsWith(".supabase.co")) {
  console.error(
    "\n❌ That's Supabase's DIRECT connection, which Vercel can't reach (IPv6-only).",
  );
  console.error(
    "   Use the Session pooler: Supabase → Connect → Session pooler",
  );
  console.error(
    "   (host ends in .pooler.supabase.com).\n",
  );
  process.exit(1);
}

// Supabase's transaction pooler (port 6543) can't run table creation reliably.
// Use session mode (5432) on the same host just for this step.
if (u.hostname.endsWith(".pooler.supabase.com") && u.port === "6543") {
  u.port = "5432";
  console.log("ℹ Using the session pooler (port 5432) to create tables.");
}

try {
  execFileSync("npx", ["--no-install", "prisma", "db", "push", "--skip-generate"], {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: u.toString() },
  });
} catch {
  console.error(
    "\n❌ Couldn't create the database tables — check the host and password above.\n",
  );
  process.exit(1);
}
