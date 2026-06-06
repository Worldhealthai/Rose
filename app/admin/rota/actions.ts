"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { parseDay, startOfWeek, addDays, toISODate } from "@/lib/dates";

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

function refresh() {
  revalidatePath("/admin/rota");
  revalidatePath("/admin");
  revalidatePath("/staff");
}

function weekRedirect(fd: FormData, fallbackDate: Date): never {
  const wk = str(fd, "week");
  const week = wk ? parseDay(wk) : startOfWeek(fallbackDate);
  redirect(`/admin/rota?week=${toISODate(startOfWeek(week))}`);
}

export async function createShift(formData: FormData) {
  await requireAdmin();
  const date = parseDay(str(formData, "date"));
  const start = str(formData, "start") || "09:00";
  const end = str(formData, "end") || "17:00";

  await prisma.shift.create({
    data: {
      date,
      start,
      end,
      role: str(formData, "role") || null,
      notes: str(formData, "notes") || null,
      employeeId: str(formData, "employeeId") || null,
    },
  });
  refresh();
  weekRedirect(formData, date);
}

export async function updateShift(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  if (!id) weekRedirect(formData, new Date());
  const updated = await prisma.shift.update({
    where: { id },
    data: {
      start: str(formData, "start") || "09:00",
      end: str(formData, "end") || "17:00",
      role: str(formData, "role") || null,
      employeeId: str(formData, "employeeId") || null,
    },
  });
  refresh();
  weekRedirect(formData, updated.date);
}

/** Duplicate last week's shifts into the week being viewed. */
export async function copyLastWeek(formData: FormData) {
  await requireAdmin();
  const week = startOfWeek(parseDay(str(formData, "week")));
  const lastStart = addDays(week, -7);
  const lastEnd = addDays(week, -1);
  const prev = await prisma.shift.findMany({
    where: { date: { gte: lastStart, lte: lastEnd } },
  });
  if (prev.length) {
    await prisma.shift.createMany({
      data: prev.map((s) => ({
        date: addDays(s.date, 7),
        start: s.start,
        end: s.end,
        role: s.role,
        employeeId: s.employeeId,
        published: s.published,
      })),
    });
  }
  refresh();
  redirect(`/admin/rota?week=${toISODate(week)}`);
}

export async function deleteShift(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  if (!id) weekRedirect(formData, new Date());
  const deleted = await prisma.shift.delete({ where: { id } });
  refresh();
  weekRedirect(formData, deleted.date);
}
