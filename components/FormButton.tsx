"use client";

import { useContext, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { PopoverCloseCtx } from "./Popover";
import { toast } from "./Toast";

/**
 * A submit button that shows an instant pending state (spinner + disabled) while
 * its form's server action runs — so taps feel responsive even on a slow link.
 * Use inside any <form action={serverAction}>.
 *
 * When the form is inside a <Popover>, or a `savedLabel` is given, a successful
 * submit shows a confirmation toast, closes the modal, and refreshes the page
 * data in place — so the action no longer needs to redirect. (The toast lives
 * at the app root, so it survives the refresh and the modal closing.)
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
  const router = useRouter();
  const closePopover = useContext(PopoverCloseCtx);
  const wasPending = useRef(false);

  useEffect(() => {
    const justFinished = wasPending.current && !pending;
    wasPending.current = pending;
    if (pending || !justFinished) return;
    // Only forms that confirm in place (in a popover, or with a saved label)
    // opt into this — plain redirecting forms elsewhere are left untouched.
    if (!closePopover && !savedLabel) return;

    if (typeof savedLabel === "string") toast(savedLabel);
    closePopover?.(); // close immediately so the refresh can't cancel it
    router.refresh(); // pull the updated data (the action just revalidated)
  }, [pending, savedLabel, closePopover, router]);

  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {pending && (
        <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent opacity-70" />
      )}
      {children}
    </button>
  );
}

