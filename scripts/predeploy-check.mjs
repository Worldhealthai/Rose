// Runs during the Vercel build, before `prisma db push`.
// Prints the database host (never the password) and fails fast with a clear
// message when the connection string is one Vercel can't reach.

const url = process.env.DATABASE_URL;

if (!url) {
  console.error("\n❌ DATABASE_URL is not set for this deployment.");
  console.error(
    "   Add it in Vercel → Settings → Environment Variables and tick",
  );
  console.error("   Production, Preview AND Development, then redeploy.\n");
  process.exit(1);
}

let host = "";
let port = "";
let user = "";
try {
  const u = new URL(url);
  host = u.hostname;
  port = u.port || "5432";
  user = u.username;
} catch {
  console.error("\n❌ DATABASE_URL doesn't look like a valid URL.");
  console.error(
    "   Common cause: the password contains special characters (@ : / # ?)",
  );
  console.error(
    "   that must be percent-encoded — or it still says [YOUR-PASSWORD].",
  );
  console.error("   Easiest fix: set a Supabase DB password with only letters and numbers.\n");
  process.exit(1);
}

console.log(`\n🔌 Database host: ${host}:${port}  (user: ${user})`);

if (host.startsWith("db.") && host.endsWith(".supabase.co")) {
  console.error(
    "\n❌ That's Supabase's DIRECT connection, which Vercel can't reach (it's IPv6-only).",
  );
  console.error("   Use the SESSION POOLER string instead:");
  console.error("   Supabase → Connect → Session pooler");
  console.error(
    "   (host looks like  aws-0-<region>.pooler.supabase.com  on port 5432)\n",
  );
  process.exit(1);
}

if (port === "6543") {
  console.warn(
    "\n⚠ Port 6543 is the TRANSACTION pooler. Use the SESSION pooler (port 5432)",
  );
  console.warn("   so creating tables works reliably.\n");
}

if (host.endsWith(".pooler.supabase.com")) {
  console.log("✓ Using the Supabase pooler. Creating tables…\n");
} else {
  console.log("✓ Host set. Creating tables…\n");
}
