"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  requireStaff,
  getCurrentUser,
  hashPassword,
  passwordMatches,
  cleanAvatar,
} from "@/lib/auth";

const BASE = "/staff/profile";

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

export async function updateMyContact(formData: FormData) {
  const me = await requireStaff();
  await prisma.employee.update({
    where: { id: me.id },
    data: { phone: str(formData, "phone") || null },
  });
  revalidatePath(BASE);
  redirect(`${BASE}?ok=${encodeURIComponent("Profile updated.")}`);
}

export async function updateMyAvatar(formData: FormData) {
  const me = await requireStaff();
  await prisma.employee.update({
    where: { id: me.id },
    data: { avatar: cleanAvatar(formData.get("avatar")) },
  });
  revalidatePath(BASE);
  revalidatePath("/staff");
  redirect(`${BASE}?ok=${encodeURIComponent("Photo updated.")}`);
}

export async function changeMyPassword(formData: FormData) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  const current = str(formData, "current");
  const next = str(formData, "next");

  if (next.length < 6) {
    redirect(`${BASE}?error=${encodeURIComponent("New password must be at least 6 characters.")}`);
  }
  if (!(await passwordMatches(current, me.passwordHash))) {
    redirect(`${BASE}?error=${encodeURIComponent("Your current password is incorrect.")}`);
  }
  await prisma.employee.update({
    where: { id: me.id },
    data: { passwordHash: await hashPassword(next) },
  });
  redirect(`${BASE}?ok=${encodeURIComponent("Password updated.")}`);
}
