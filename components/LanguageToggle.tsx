"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n";

/** A single button that flips between English and Persian (shows the other language). */
export function LanguageToggle({ current }: { current: Locale }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const next: Locale = current === "fa" ? "en" : "fa";
  const label = next === "fa" ? "فارسی" : "English";

  return (
    <button
      type="button"
      onClick={() => {
        document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
        startTransition(() => router.refresh());
      }}
      className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-ink-muted transition hover:border-forest-500/50 hover:text-ink"
    >
      {label}
    </button>
  );
}
