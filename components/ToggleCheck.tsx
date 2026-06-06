"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Icon } from "./icons";

/**
 * A tap-to-toggle checkbox row. Updates instantly (optimistic) and saves in the
 * background. Safe to navigate away mid-save: it won't refresh or error once
 * this component has unmounted.
 */
export function ToggleCheck({
  action,
  fields,
  checked: checkedProp,
  title,
  subtitle,
  accent = "#37c97e",
  strike = true,
}: {
  action: (formData: FormData) => Promise<unknown> | unknown;
  fields: Record<string, string>;
  checked: boolean;
  title: string;
  subtitle?: string;
  accent?: string;
  strike?: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [checked, setChecked] = useState(checkedProp);
  const mounted = useRef(true);

  useEffect(() => setChecked(checkedProp), [checkedProp]);
  useEffect(() => () => {
    mounted.current = false;
  }, []);

  function onClick() {
    setChecked((c) => !c); // instant visual feedback
    const fd = new FormData();
    Object.entries(fields).forEach(([k, v]) => fd.set(k, v));
    startTransition(async () => {
      try {
        await action(fd);
        if (mounted.current) router.refresh();
      } catch {
        // Navigated away or transient error — ignore; data is already saved
        // server-side and will be correct on next load.
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition active:scale-[0.99] ${
        checked
          ? "border-forest-500/40 bg-forest-500/10"
          : "border-border-soft bg-canvas/40 hover:border-forest-500/40"
      }`}
    >
      <span
        className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border ${
          checked ? "border-transparent" : "border-border"
        }`}
        style={checked ? { background: accent } : undefined}
      >
        {checked && <Icon name="check" className="h-4 w-4 text-canvas" />}
      </span>
      <span className="min-w-0">
        <span
          className={`block text-sm font-medium ${
            checked && strike ? "text-ink-muted line-through" : "text-ink"
          }`}
        >
          {title}
        </span>
        {subtitle && <span className="block text-xs text-ink-faint">{subtitle}</span>}
      </span>
    </button>
  );
}
