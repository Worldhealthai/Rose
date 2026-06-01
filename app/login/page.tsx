import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { landingPathFor } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";
import { Icon } from "@/components/icons";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect(landingPathFor(session.role));

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
          <p className="mt-1 text-sm text-ink-muted">
            Sign in to your portal
          </p>
        </div>
        <div className="card p-6">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-xs text-ink-faint">
          Staff &amp; management portal
        </p>
      </div>
    </main>
  );
}
