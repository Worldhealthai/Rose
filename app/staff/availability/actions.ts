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

export async function requestTimeOff(formData: FormData) {
  const me = await requireStaff();
  const startDate = parseDay(String(formData.get("startDate")));
  let endDate = parseDay(String(formData.get("endDate")));
  if (endDate < startDate) endDate = startDate;
  await prisma.timeOff.create({
    data: {
      employeeId: me.id,
      startDate,
      endDate,
      note: String(formData.get("note") ?? "").trim() || null,
    },
  });
  revalidatePath("/staff/availability");
  revalidatePath("/admin/time-off");
  revalidatePath("/admin/rota");
  redirect(`/staff/availability?ok=${encodeURIComponent("Time-off requested.")}`);
}

export async function cancelTimeOff(formData: FormData) {
  const me = await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (id) await prisma.timeOff.deleteMany({ where: { id, employeeId: me.id } });
  revalidatePath("/staff/availability");
  revalidatePath("/admin/time-off");
  revalidatePath("/admin/rota");
  redirect(`/staff/availability?ok=${encodeURIComponent("Request cancelled.")}`);
}
