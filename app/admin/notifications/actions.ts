"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/auth";

/** Save a Web Push subscription for the current user. */
export async function subscribePush(json: string) {
  const me = await requireUser();
  let sub: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  try {
    sub = JSON.parse(json);
  } catch {
    return;
  }
  const endpoint = sub?.endpoint;
  const p256dh = sub?.keys?.p256dh;
  const auth = sub?.keys?.auth;
  if (!endpoint || !p256dh || !auth) return;
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { endpoint, p256dh, auth, employeeId: me.id },
    update: { p256dh, auth, employeeId: me.id },
  });
}

export async function unsubscribePush(endpoint: string) {
  await requireUser();
  if (endpoint) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint } });
  }
}

export async function markAllRead() {
  await requireAdmin();
  await prisma.notification.updateMany({
    where: { read: false },
    data: { read: true },
  });
  revalidatePath("/admin/notifications");
  revalidatePath("/admin");
  redirect("/admin/notifications");
}

export async function clearNotifications() {
  await requireAdmin();
  await prisma.notification.deleteMany({});
  revalidatePath("/admin/notifications");
  revalidatePath("/admin");
  redirect("/admin/notifications");
}
