"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";

type FormState = { pending: boolean; saved: boolean };
const FormCtx = createContext<FormState>({ pending: false, saved: false });

/**
 * A form that runs a server action and then forces an immediate client refresh,
 * so the UI updates instantly (no manual page reload). Exposes pending/saved
 * state to <SubmitButton> via context.
 */
export function RefreshForm({
  action,
  children,
  className,
  resetOnSuccess = false,
}: {
  action: (formData: FormData) => Promise<unknown> | unknown;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <FormCtx.Provider value={{ pending, saved }}>
      <form
        ref={formRef}
        className={className}
        action={(fd) =>
          startTransition(async () => {
            await action(fd);
            router.refresh();
            if (resetOnSuccess) formRef.current?.reset();
            setSaved(true);
            setTimeout(() => setSaved(false), 1800);
          })
        }
      >
        {children}
      </form>
    </FormCtx.Provider>
  );
}

export function SubmitButton({
  children,
  className = "btn-primary",
  pendingLabel = "Saving…",
  savedLabel = "Saved ✓",
}: {
  children: React.ReactNode;
  className?: string;
  pendingLabel?: string;
  savedLabel?: string;
}) {
  const { pending, saved } = useContext(FormCtx);
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? pendingLabel : saved ? savedLabel : children}
    </button>
  );
}
