"use client";

import { createContext, useCallback, useEffect, useState } from "react";
import { Icon, type IconName } from "./icons";

/** Lets content inside a Popover close it (e.g. after a successful save). */
export const PopoverCloseCtx = createContext<(() => void) | null>(null);

/**
 * A dismissable popup: bottom sheet on mobile, centered modal on desktop.
 * Closes on backdrop tap, Escape, or the ✕ button. The title bar stays
 * pinned while the body scrolls, and the panel is capped to the viewport
 * height, so a long form never spills off-screen on short windows or when
 * the on-screen keyboard is open.
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
          className="fixed inset-0 z-50 flex flex-col items-center justify-end sm:justify-center sm:p-6"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-border bg-surface shadow-2xl sm:max-h-[85dvh] sm:max-w-md sm:rounded-3xl">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border-soft px-5 py-4">
              <h3 className="text-base font-semibold text-ink">{title}</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-muted hover:bg-elevated hover:text-ink"
              >
                <Icon name="plus" className="h-5 w-5 rotate-45" />
              </button>
            </div>
            <div className="min-h-0 overflow-y-auto overscroll-contain px-5 py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
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
