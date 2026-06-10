import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  landingPathFor,
  ensureBootstrapAdmin,
  getCurrentUserSafe,
} from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { avatarUrl } from "@/lib/avatar";
import { getDict, isRTL } from "@/lib/i18n";
import { LoginPicker } from "@/components/LoginPicker";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/Logo";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // Only bounce to a portal if the session maps to a real, active account.
  // A stale cookie (deleted/deactivated user) falls through and shows the
  // login screen instead of redirect-looping; signing in replaces the cookie.
  const [me, rows] = await Promise.all([
    getCurrentUserSafe(),
    prisma.employee
      .findMany({
        where: { active: true, role: "STAFF" },
        orderBy: { name: "asc" },
        select: { id: true, username: true, name: true, avatar: true, updatedAt: true },
      })
      .catch(() => []),
  ]);
  if (me) redirect(landingPathFor(me.role === "ADMIN" ? "ADMIN" : "STAFF"));

  const locale = getLocale();
  const t = getDict(locale);

  // First run on a fresh database: make sure an admin account exists.
  // Only worth checking when there are no staff accounts yet.
  if (rows.length === 0) await ensureBootstrapAdmin();

  const staff = rows.map((r) => ({
    username: r.username,
    name: r.name,
    avatar: avatarUrl(r),
  }));

  return (
    <main
      className="flex min-h-screen items-center justify-center px-4 py-10"
      dir={isRTL(locale) ? "rtl" : "ltr"}
    >
      <div className="w-full max-w-sm">
        <div className="mb-7 flex flex-col items-center text-center">
          <Logo size={104} />
          <h1 className="mt-4 text-2xl font-bold tracking-tight">
            Rose Bar &amp; Restaurant
          </h1>
          <p className="mt-1 text-sm text-ink-muted">{t.login.subtitle}</p>
        </div>
        <div className="card p-6">
          <LoginPicker staff={staff} t={t.login} />
        </div>
        <div className="mt-6 flex justify-center">
          <LanguageSwitcher current={locale} />
        </div>
      </div>
    </main>
  );
}
