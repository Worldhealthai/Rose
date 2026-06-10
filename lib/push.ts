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

export type PushPayload = { title: string; body: string; url?: string; tag?: string };

type Sub = { id: string; endpoint: string; p256dh: string; auth: string };

async function deliver(subs: Sub[], payload: PushPayload): Promise<void> {
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
  await deliver(subs, payload);
}

/**
 * Push a chat message to everyone subscribed except the sender, linking each
 * person to their own portal's chat page. Best-effort.
 */
export async function sendChatPush(
  senderId: string,
  senderName: string,
  message: string,
): Promise<void> {
  if (!ensureConfigured()) return;
  let subs;
  try {
    subs = await prisma.pushSubscription.findMany({
      where: { NOT: { employeeId: senderId } },
      include: { employee: { select: { role: true } } },
    });
  } catch {
    return;
  }
  const text = message.length > 120 ? message.slice(0, 117) + "…" : message;
  const admins = subs.filter((s) => s.employee?.role === "ADMIN");
  const staff = subs.filter((s) => s.employee?.role !== "ADMIN");
  await Promise.all([
    deliver(admins, { title: senderName, body: text, url: "/admin/chat", tag: "rose-chat" }),
    deliver(staff, { title: senderName, body: text, url: "/staff/chat", tag: "rose-chat" }),
  ]);
}
