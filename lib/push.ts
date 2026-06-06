import "server-only";
import webpush from "web-push";
import { prisma } from "./prisma";

let configured: boolean | null = null;

function ensureConfigured(): boolean {
  if (configured !== null) return configured;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) {
    configured = false;
    return false;
  }
  try {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || "mailto:admin@rose.local",
      pub,
      priv,
    );
    configured = true;
  } catch {
    configured = false;
  }
  return configured;
}

export type PushPayload = { title: string; body: string; url?: string };

/** Send a push to every admin's subscribed device. Best-effort. */
export async function sendPushToAdmins(payload: PushPayload): Promise<void> {
  if (!ensureConfigured()) return;
  let subs;
  try {
    subs = await prisma.pushSubscription.findMany({
      where: { employee: { role: "ADMIN" } },
    });
  } catch {
    return;
  }
  const body = JSON.stringify(payload);
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
        );
      } catch (err) {
        const code = (err as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) {
          await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
        }
      }
    }),
  );
}
