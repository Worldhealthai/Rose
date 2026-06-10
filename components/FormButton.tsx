"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { PopoverCloseCtx } from "./Popover";

/**
 * A submit button that shows an instant pending state (spinner + disabled) while
 * its form's server action runs — so taps feel responsive even on a slow link.
 * Use inside any <form action={serverAction}>.
 *
 * Pass `savedLabel` (e.g. "Updated ✓") to flash a confirmation once the action
 * finishes; if the form lives inside a <Popover>, the popover then closes by
 * itself so you land back on the refreshed page.
 */
export function FormButton({
  children,
  className = "btn-primary",
  savedLabel,
}: {
  children: React.ReactNode;
  className?: string;
  savedLabel?: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  const closePopover = useContext(PopoverCloseCtx);
  const wasPending = useRef(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const justFinished = wasPending.current && !pending;
    wasPending.current = pending;
    if (pending) {
      setSaved(false);
      return;
    }
    if (!justFinished || !savedLabel) return;
    setSaved(true);
    const timers = [
      setTimeout(() => setSaved(false), 1800),
      setTimeout(() => closePopover?.(), 1100),
    ];
    return () => timers.forEach(clearTimeout);
  }, [pending, savedLabel, closePopover]);

  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {pending && (
        <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent opacity-70" />
      )}
      {saved ? savedLabel : children}
    </button>
  );
}
