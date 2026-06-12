"use client";

import { createContext, useCallback, useEffect, useState } from "react";
import { Icon, type IconName } from "./icons";

/** Lets content inside a Popover close it (e.g. after a successful save). */
export const PopoverCloseCtx = createContext<(() => void) | null>(null);

/**
 * A dismissable popup: bottom sheet on mobile, centered modal on desktop.
 * Closes on backdrop tap, Escape, or the ✕ button. The overlay itself scrolls,
 * so content taller than the screen (small phones, keyboard open) stays
 * reachable.
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
  const close = useCallback(() => setOpen(false), []);

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
          className="fixed inset-0 z-50 overflow-y-auto overscroll-contain"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />
          <div
            className="flex min-h-full items-end justify-center sm:items-center sm:p-6"
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <div className="relative w-full rounded-t-3xl border border-border bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-w-md sm:rounded-3xl sm:pb-5">
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
              <PopoverCloseCtx.Provider value={close}>
                {children}
              </PopoverCloseCtx.Provider>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
