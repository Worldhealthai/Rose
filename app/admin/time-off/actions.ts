"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

function refresh() {
  revalidatePath("/admin/time-off");
  revalidatePath("/admin/rota");
  revalidatePath("/staff/availability");
}

export async function setTimeOffStatus(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (id && ["APPROVED", "DECLINED", "PENDING"].includes(status)) {
    await prisma.timeOff.update({ where: { id }, data: { status } });
  }
  refresh();
  redirect("/admin/time-off");
}

export async function deleteTimeOff(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await prisma.timeOff.delete({ where: { id } });
  refresh();
  redirect("/admin/time-off");
}
