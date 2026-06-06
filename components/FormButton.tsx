"use client";

import { useFormStatus } from "react-dom";

/**
 * A submit button that shows an instant pending state (spinner + disabled) while
 * its form's server action runs — so taps feel responsive even on a slow link.
 * Use inside any <form action={serverAction}>.
 */
export function FormButton({
  children,
  className = "btn-primary",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {pending && (
        <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent opacity-70" />
      )}
      {children}
    </button>
  );
}
