"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

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
