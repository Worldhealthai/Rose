"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

/**
 * Inline "how much to order" note that saves automatically on blur / Enter and
 * shows clear feedback. Safe to navigate away mid-save.
 */
export function QuantityInput({
  action,
  id,
  returnTo,
  defaultValue = "",
}: {
  action: (formData: FormData) => Promise<unknown> | unknown;
  id: string;
  returnTo: string;
  defaultValue?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const lastSaved = useRef(defaultValue);
  const mounted = useRef(true);

  useEffect(() => () => {
    mounted.current = false;
  }, []);

  function save(value: string) {
    if (value === lastSaved.current) return;
    const fd = new FormData();
    fd.set("id", id);
    fd.set("returnTo", returnTo);
    fd.set("neededNote", value);
    startTransition(async () => {
      try {
        await action(fd);
        lastSaved.current = value;
        if (!mounted.current) return;
        router.refresh();
        setSaved(true);
        setTimeout(() => mounted.current && setSaved(false), 1600);
      } catch {
        // Navigated away or transient error — ignore.
      }
    });
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <input
        defaultValue={defaultValue}
        placeholder="How much to order? e.g. 2 cases"
        className="input !py-1.5 text-sm"
        onBlur={(e) => save(e.target.value.trim())}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
          }
        }}
      />
      <span className="w-16 shrink-0 text-xs text-ink-faint">
        {pending ? "Saving…" : saved ? "Saved ✓" : ""}
      </span>
    </div>
  );
}
