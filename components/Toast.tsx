"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./icons";

type ToastDetail = {
  message: string;
  onUndo?: () => void | Promise<void>;
  undoLabel?: string;
};

function emit(detail: ToastDetail) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("rose-toast", { detail }));
  }
}

/** Fire a transient confirmation toast from anywhere on the client. */
export function toast(message: string) {
  emit({ message });
}

/** A confirmation toast with an Undo button; stays a bit longer to allow a tap. */
export function toastUndo(
  message: string,
  onUndo: () => void | Promise<void>,
  undoLabel = "Undo",
) {
  emit({ message, onUndo, undoLabel });
}

type Item = ToastDetail & { id: number };

/**
 * Listens for `toast()` calls and shows brief confirmation pills. Mounted once
 * in the layout (outside the page content), so a toast survives the router
 * refresh that follows a save — and stays visible after a modal closes.
 */
export function Toaster() {
  const [items, setItems] = useState<Item[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onToast = (e: Event) => {
      const detail = (e as CustomEvent).detail as ToastDetail | string;
      const d: ToastDetail =
        typeof detail === "string" ? { message: detail } : detail;
      if (!d?.message) return;
      const id = Date.now() + Math.random();
      setItems((xs) => [...xs, { ...d, id }]);
      // Undo toasts linger so there's time to tap; plain ones are brief.
      setTimeout(
        () => setItems((xs) => xs.filter((x) => x.id !== id)),
        d.onUndo ? 7000 : 2400,
      );
    };
    window.addEventListener("rose-toast", onToast);
    return () => window.removeEventListener("rose-toast", onToast);
  }, []);

  if (!mounted || items.length === 0) return null;

  const dismiss = (id: number) =>
    setItems((xs) => xs.filter((x) => x.id !== id));

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex flex-col items-center gap-2 px-4">
      {items.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center gap-3 rounded-full border border-forest-500/40 bg-surface py-2 pl-4 pr-2 text-sm font-medium text-ink shadow-2xl"
        >
          <span className="flex items-center gap-2">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-forest-500 text-canvas">
              <Icon name="check" className="h-3.5 w-3.5" />
            </span>
            {t.message}
          </span>
          {t.onUndo && (
            <button
              type="button"
              onClick={async () => {
                dismiss(t.id);
                await t.onUndo!();
              }}
              className="rounded-full bg-forest-500/15 px-3 py-1 text-xs font-semibold text-forest-200 transition hover:bg-forest-500/25"
            >
              {t.undoLabel ?? "Undo"}
            </button>
          )}
        </div>
      ))}
    </div>,
    document.body,
  );
}
