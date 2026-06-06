"use client";

import { useEffect, useState } from "react";
import { subscribePush, unsubscribePush } from "@/app/admin/notifications/actions";
import { Icon } from "./icons";

type State = "loading" | "unsupported" | "denied" | "on" | "off" | "working";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function PushToggle({ vapidKey }: { vapidKey?: string }) {
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window) ||
      !vapidKey
    ) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setState(sub ? "on" : "off"))
      .catch(() => setState("off"));
  }, [vapidKey]);

  async function enable() {
    if (!vapidKey) return;
    setState("working");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState(perm === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      await subscribePush(JSON.stringify(sub));
      setState("on");
    } catch {
      setState("off");
    }
  }

  async function disable() {
    setState("working");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await unsubscribePush(sub.endpoint);
        await sub.unsubscribe();
      }
      setState("off");
    } catch {
      setState("on");
    }
  }

  if (state === "loading") {
    return <div className="h-9 w-40 animate-pulse rounded-xl bg-border-soft" />;
  }
  if (state === "unsupported") {
    return (
      <p className="text-sm text-ink-muted">
        Phone alerts aren&apos;t supported on this browser. On iPhone, add Rose to
        your Home Screen first, then open it from there.
      </p>
    );
  }
  if (state === "denied") {
    return (
      <p className="text-sm text-ink-muted">
        Notifications are blocked. Allow notifications for this site in your
        browser/phone settings, then reload.
      </p>
    );
  }

  const on = state === "on";
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={on ? disable : enable}
        disabled={state === "working"}
        className={on ? "btn-secondary" : "btn-primary"}
      >
        <Icon name="bell" className="h-4 w-4" />
        {state === "working"
          ? "…"
          : on
            ? "Turn off phone alerts"
            : "Enable phone alerts"}
      </button>
      {on && (
        <span className="text-xs font-medium text-forest-300">On for this device</span>
      )}
    </div>
  );
}
