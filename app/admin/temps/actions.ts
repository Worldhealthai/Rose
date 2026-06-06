"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, requireAdmin } from "@/lib/auth";
import { parseDay } from "@/lib/dates";

function safeReturn(fd: FormData, fallback = "/admin/temps"): string {
  const r = String(fd.get("returnTo") ?? "");
  return r.startsWith("/admin") || r.startsWith("/staff") ? r : fallback;
}

export async function addTempLog(formData: FormData) {
  const me = await requireUser();
  const date = parseDay(String(formData.get("date") ?? ""));
  const unit = String(formData.get("unit") ?? "").trim();
  const temp = parseFloat(String(formData.get("temp") ?? "").trim());
  const returnTo = safeReturn(formData);
  if (unit && isFinite(temp)) {
    await prisma.tempLog.create({
      data: { date, unit, temp, byId: me.id, byName: me.name },
    });
  }
  revalidatePath("/admin/temps");
  revalidatePath("/staff/checklist");
  redirect(returnTo);
}

export async function deleteTempLog(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const returnTo = safeReturn(formData);
  if (id) await prisma.tempLog.delete({ where: { id } });
  revalidatePath("/admin/temps");
  redirect(returnTo);
}
