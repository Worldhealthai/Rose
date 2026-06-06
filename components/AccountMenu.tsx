"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar } from "./Avatar";
import { Icon } from "./icons";
import { LanguageToggle } from "./LanguageToggle";
import { signOut } from "@/app/login/actions";
import type { Locale } from "@/lib/i18n";

/** Tap-the-avatar account dropdown: links + language + sign out. */
export function AccountMenu({
  name,
  avatar,
  locale,
  links,
  signOutLabel,
}: {
  name: string;
  avatar?: string | null;
  locale?: Locale;
  links: { href: string; label: string }[];
  signOutLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-haspopup="menu"
      >
        <Avatar name={name} src={avatar} size={36} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-border bg-surface p-2 shadow-2xl">
            <p className="px-3 py-2 text-sm font-semibold text-ink">{name}</p>
            <div className="border-t border-border-soft py-1">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-ink-muted hover:bg-elevated hover:text-ink"
                >
                  {l.label}
                  <Icon name="chevronRight" className="h-4 w-4 opacity-60" />
                </Link>
              ))}
            </div>
            {locale && (
              <div className="border-t border-border-soft px-3 py-2">
                <LanguageToggle current={locale} />
              </div>
            )}
            <div className="border-t border-border-soft pt-1">
              <form action={signOut}>
                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-danger hover:bg-danger/10">
                  <Icon name="logout" className="h-4 w-4" />
                  {signOutLabel}
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
