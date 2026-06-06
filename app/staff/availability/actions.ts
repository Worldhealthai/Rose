"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { parseDay, startOfWeek, toISODate } from "@/lib/dates";

export async function saveAvailability(formData: FormData) {
  const me = await requireStaff();
  const weekStart = startOfWeek(parseDay(String(formData.get("weekStart"))));

  const rows = [];
  for (let d = 0; d < 7; d++) {
    rows.push({
      employeeId: me.id,
      weekStart,
      dayOfWeek: d,
      available: formData.get(`available_${d}`) === "on",
      preferredStart: String(formData.get(`start_${d}`) ?? "").trim() || null,
      preferredEnd: String(formData.get(`end_${d}`) ?? "").trim() || null,
      note: String(formData.get(`note_${d}`) ?? "").trim() || null,
    });
  }

  // Replace this week's rows.
  await prisma.$transaction([
    prisma.availability.deleteMany({ where: { employeeId: me.id, weekStart } }),
    prisma.availability.createMany({ data: rows }),
  ]);

  revalidatePath("/staff/availability");
  revalidatePath("/admin/rota");
  redirect(
    `/staff/availability?week=${toISODate(weekStart)}&ok=${encodeURIComponent("Availability saved.")}`,
  );
}
