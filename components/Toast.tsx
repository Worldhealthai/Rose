"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./icons";

/** Fire a transient confirmation toast from anywhere on the client. */
export function toast(message: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("rose-toast", { detail: message }));
  }
}

type Item = { id: number; msg: string };

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
      const msg = String((e as CustomEvent).detail ?? "");
      if (!msg) return;
      const id = Date.now() + Math.random();
      setItems((xs) => [...xs, { id, msg }]);
      setTimeout(
        () => setItems((xs) => xs.filter((x) => x.id !== id)),
        2400,
      );
    };
    window.addEventListener("rose-toast", onToast);
    return () => window.removeEventListener("rose-toast", onToast);
  }, []);

  if (!mounted || items.length === 0) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex flex-col items-center gap-2 px-4">
      {items.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center gap-2 rounded-full border border-forest-500/40 bg-surface px-4 py-2 text-sm font-medium text-ink shadow-2xl"
        >
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-forest-500 text-canvas">
            <Icon name="check" className="h-3.5 w-3.5" />
          </span>
          {t.msg}
        </div>
      ))}
    </div>,
    document.body,
  );
}
