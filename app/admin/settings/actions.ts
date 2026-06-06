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
import { COMMISSION_KEYS } from "@/lib/settings";

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

export async function updateCommission(formData: FormData) {
  await requireAdmin();
  const save = async (key: string, raw: FormDataEntryValue | null) => {
    const n = parseFloat(String(raw ?? "").trim());
    const value = isFinite(n) && n >= 0 && n <= 100 ? String(n) : "0";
    await prisma.setting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  };
  await save(COMMISSION_KEYS.justEat, formData.get("justEat"));
  await save(COMMISSION_KEYS.uberEats, formData.get("uberEats"));
  await save(COMMISSION_KEYS.deliveroo, formData.get("deliveroo"));
  revalidatePath(BASE);
  revalidatePath("/admin");
  revalidatePath("/admin/income");
  redirect(`${BASE}?ok=${encodeURIComponent("Commission saved.")}`);
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
