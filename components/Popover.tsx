"use client";

import { useEffect, useState } from "react";
import { Icon, type IconName } from "./icons";

/**
 * A dismissable popup: bottom sheet on mobile, centered modal on desktop.
 * Closes on backdrop tap, Escape, or the ✕ button.
 */
export function Popover({
  title,
  triggerIcon = "edit",
  triggerLabel,
  triggerClassName,
  children,
}: {
  title: string;
  triggerIcon?: IconName;
  triggerLabel?: string;
  triggerClassName?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={triggerLabel ?? title}
        className={
          triggerClassName ??
          "grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-faint hover:bg-elevated hover:text-ink"
        }
      >
        <Icon name={triggerIcon} className="h-4 w-4" />
        {triggerLabel && <span className="ml-1.5 text-sm">{triggerLabel}</span>}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 max-h-[88vh] w-full overflow-y-auto rounded-t-3xl border border-border bg-surface p-5 shadow-2xl sm:max-w-md sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-ink">{title}</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid h-9 w-9 place-items-center rounded-lg text-ink-muted hover:bg-elevated hover:text-ink"
              >
                <Icon name="plus" className="h-5 w-5 rotate-45" />
              </button>
            </div>
            {children}
          </div>
        </div>
      )}
    </>
  );
}
