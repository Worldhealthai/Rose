"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  requireAdmin,
  getCurrentUser,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";

const BASE = "/admin/settings";

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

export async function updateRestaurantName(formData: FormData) {
  await requireAdmin();
  const value = str(formData, "restaurantName") || "Rose Restaurant";
  await prisma.setting.upsert({
    where: { key: "restaurantName" },
    create: { key: "restaurantName", value },
    update: { value },
  });
  revalidatePath(BASE);
  redirect(`${BASE}?ok=${encodeURIComponent("Settings saved.")}`);
}

export async function changeMyPassword(formData: FormData) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  const current = str(formData, "current");
  const next = str(formData, "next");

  if (next.length < 6) {
    redirect(`${BASE}?error=${encodeURIComponent("New password must be at least 6 characters.")}`);
  }
  const ok = await verifyPassword(current, me.passwordHash);
  if (!ok) {
    redirect(`${BASE}?error=${encodeURIComponent("Your current password is incorrect.")}`);
  }
  await prisma.employee.update({
    where: { id: me.id },
    data: { passwordHash: await hashPassword(next) },
  });
  redirect(`${BASE}?ok=${encodeURIComponent("Password updated.")}`);
}
