import "server-only";
import { prisma } from "./prisma";
import { sendPushToAdmins } from "./push";

/**
 * Create an admin-facing notification (and send a phone push). Best-effort:
 * never let a failed notification break the user's action.
 */
export async function createNotification(
  type: "availability" | "timeoff" | "order",
  message: string,
  link?: string,
): Promise<void> {
  try {
    await prisma.notification.create({
      data: { type, message, link: link ?? null },
    });
  } catch {
    // ignore
  }
  await sendPushToAdmins({
    title: "Rose",
    body: message,
    url: link ?? "/admin/notifications",
  });
}

export function getUnreadNotifications() {
  return prisma.notification.count({ where: { read: false } });
}
