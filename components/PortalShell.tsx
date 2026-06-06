"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon, type IconName } from "./icons";
import { Avatar } from "./Avatar";
import { Logo } from "./Logo";
import { LanguageToggle } from "./LanguageToggle";
import type { Locale } from "@/lib/i18n";
import { signOut } from "@/app/login/actions";

export type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  exact?: boolean;
};

function useIsActive() {
  const pathname = usePathname();
  return (item: NavItem) =>
    item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(item.href + "/");
}

function Brand({ subtitle }: { subtitle: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Logo size={36} />
      <div className="leading-tight">
        <p className="font-bold tracking-tight text-ink">Rose</p>
        <p className="text-[11px] font-medium uppercase tracking-wider text-forest-300/80">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function SignOut({ compact = false }: { compact?: boolean }) {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className={
          compact
            ? "btn-ghost w-full justify-start px-2 py-2 text-sm"
            : "btn-ghost w-full justify-start"
        }
      >
        <Icon name="logout" className="h-4 w-4" />
        Sign out
      </button>
    </form>
  );
}

export function PortalShell({
  user,
  subtitle,
  items,
  mobileNav = "drawer",
  dir = "ltr",
  localeToggle,
  children,
}: {
  user: { name: string; role: string; avatar?: string | null };
  subtitle: string;
  items: NavItem[];
  mobileNav?: "tabs" | "drawer";
  dir?: "ltr" | "rtl";
  localeToggle?: Locale;
  children: React.ReactNode;
}) {
  const isActive = useIsActive();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen" dir={dir}>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border-soft bg-surface/70 p-4 backdrop-blur md:flex">
        <div className="px-2 py-2">
          <Brand subtitle={subtitle} />
        </div>
        <nav className="mt-4 flex-1 space-y-1">
          {items.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-forest-500/15 text-forest-100 ring-1 ring-inset ring-forest-500/25"
                    : "text-ink-muted hover:bg-surface hover:text-ink"
                }`}
              >
                <Icon name={item.icon} className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-2 border-t border-border-soft pt-3">
          <div className="mb-2 flex items-center gap-2.5 px-2">
            <Avatar name={user.name} src={user.avatar} size={36} />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-medium text-ink">
                {user.name}
              </p>
              <p className="text-[11px] capitalize text-ink-faint">
                {user.role.toLowerCase()}
              </p>
            </div>
          </div>
          {localeToggle && (
            <div className="mb-2 px-2">
              <LanguageToggle current={localeToggle} />
            </div>
          )}
          <SignOut compact />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border-soft bg-canvas/85 px-4 py-3 backdrop-blur md:hidden">
        <Brand subtitle={subtitle} />
        <div className="flex items-center gap-2">
          {localeToggle && <LanguageToggle current={localeToggle} />}
          {mobileNav === "drawer" ? (
            <button
              onClick={() => setOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-border text-ink"
              aria-label="Open menu"
            >
              <Icon name="menu" className="h-5 w-5" />
            </button>
          ) : (
            <Avatar name={user.name} src={user.avatar} size={36} />
          )}
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileNav === "drawer" && open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-72 max-w-[80%] flex-col border-l border-border-soft bg-surface p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <Brand subtitle={subtitle} />
              <button
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-lg text-ink-muted hover:bg-elevated"
                aria-label="Close menu"
              >
                <Icon name="plus" className="h-5 w-5 rotate-45" />
              </button>
            </div>
            <nav className="mt-5 flex-1 space-y-1">
              {items.map((item) => {
                const active = isActive(item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                      active
                        ? "bg-forest-500/15 text-forest-100 ring-1 ring-inset ring-forest-500/25"
                        : "text-ink-muted hover:bg-elevated hover:text-ink"
                    }`}
                  >
                    <Icon name={item.icon} className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-border-soft pt-3">
              <p className="mb-2 px-2 text-sm text-ink-muted">{user.name}</p>
              <SignOut compact />
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom tabs */}
      {mobileNav === "tabs" && (
        <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border-soft bg-canvas/90 backdrop-blur md:hidden">
          {items.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                  active ? "text-forest-300" : "text-ink-faint"
                }`}
              >
                <Icon name={item.icon} className="h-[22px] w-[22px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}

      {/* Content */}
      <main
        className={`md:pl-64 ${mobileNav === "tabs" ? "pb-24 md:pb-0" : "pb-10"}`}
      >
        <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-7">
          {children}
        </div>
      </main>
    </div>
  );
}
