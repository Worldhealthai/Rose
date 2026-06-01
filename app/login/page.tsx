import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { landingPathFor } from "@/lib/auth";
import { LoginPicker } from "@/components/LoginPicker";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect(landingPathFor(session.role));

  const staff = await prisma.employee.findMany({
    where: { active: true, role: "STAFF" },
    orderBy: { name: "asc" },
    select: { username: true, name: true, avatar: true },
  });

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-7 flex flex-col items-center text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-forest-500/15 text-forest-300 ring-1 ring-forest-500/25">
            <Icon name="rose" className="h-7 w-7" />
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">
            Rose Restaurant
          </h1>
          <p className="mt-1 text-sm text-ink-muted">Sign in to your portal</p>
        </div>
        <div className="card p-6">
          <LoginPicker staff={staff} />
        </div>
        <p className="mt-6 text-center text-xs text-ink-faint">
          Staff &amp; management portal
        </p>
      </div>
    </main>
  );
}
