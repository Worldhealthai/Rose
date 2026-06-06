"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n";

export function LanguageSwitcher({ current }: { current: Locale }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function choose(locale: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <div className="inline-flex rounded-xl border border-border p-0.5 text-sm">
      <button
        type="button"
        onClick={() => choose("en")}
        className={`rounded-lg px-3 py-1.5 font-medium transition ${
          current === "en" ? "bg-forest-500/20 text-forest-100" : "text-ink-muted"
        }`}
      >
        English
      </button>
      <button
        type="button"
        onClick={() => choose("fa")}
        className={`rounded-lg px-3 py-1.5 font-medium transition ${
          current === "fa" ? "bg-forest-500/20 text-forest-100" : "text-ink-muted"
        }`}
      >
        فارسی
      </button>
    </div>
  );
}
