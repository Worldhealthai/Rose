import { redirect } from "next/navigation";
import { getCurrentUserSafe, landingPathFor } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  // Validate the session against the database (not just the cookie), so a
  // stale cookie for a deleted/deactivated account can't redirect-loop.
  const user = await getCurrentUserSafe();
  if (!user) redirect("/login");
  redirect(landingPathFor(user.role === "ADMIN" ? "ADMIN" : "STAFF"));
}
