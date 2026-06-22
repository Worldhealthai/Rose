"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { parseDay, startOfWeek, addDays, localTimeToDate } from "@/lib/dates";

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

function refresh() {
  revalidatePath("/admin/rota");
  revalidatePath("/admin");
  revalidatePath("/staff");
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
}

export async function updateShift(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  if (!id) return;
  await prisma.shift.update({
    where: { id },
    data: {
      start: str(formData, "start") || "09:00",
      end: str(formData, "end") || "17:00",
      role: str(formData, "role") || null,
      employeeId: str(formData, "employeeId") || null,
    },
  });
  refresh();
}

function refreshClock() {
  revalidatePath("/admin/rota");
  revalidatePath("/admin");
  revalidatePath("/admin/payroll");
  revalidatePath("/staff");
}

/** Resolve a day + "HH:mm" in/out pair to timestamps (overnight rolls to next day). */
function clockTimes(dayISO: string, inHHMM: string, outHHMM: string) {
  const clockIn = localTimeToDate(dayISO, inHHMM);
  let clockOut: Date | null = null;
  if (outHHMM) {
    clockOut = localTimeToDate(dayISO, outHHMM);
    if (clockOut <= clockIn) clockOut = new Date(clockOut.getTime() + 86_400_000);
  }
  return { clockIn, clockOut };
}

const HHMM = /^\d{2}:\d{2}$/;

/** Manually add a clock entry (e.g. someone forgot to check in). */
export async function addTimeEntry(formData: FormData) {
  await requireAdmin();
  const employeeId = str(formData, "employeeId");
  const dayISO = str(formData, "date");
  const inHHMM = str(formData, "in");
  const outHHMM = str(formData, "out");
  if (employeeId && /^\d{4}-\d{2}-\d{2}$/.test(dayISO) && HHMM.test(inHHMM)) {
    const { clockIn, clockOut } = clockTimes(
      dayISO,
      inHHMM,
      HHMM.test(outHHMM) ? outHHMM : "",
    );
    await prisma.timeEntry.create({
      data: { employeeId, clockIn, clockOut },
    });
  }
  refreshClock();
}

/** Edit a clock entry's in/out times. Leave "out" empty to keep it open. */
export async function updateTimeEntry(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const dayISO = str(formData, "date");
  const inHHMM = str(formData, "in");
  const outHHMM = str(formData, "out");
  if (id && /^\d{4}-\d{2}-\d{2}$/.test(dayISO) && HHMM.test(inHHMM)) {
    const { clockIn, clockOut } = clockTimes(
      dayISO,
      inHHMM,
      HHMM.test(outHHMM) ? outHHMM : "",
    );
    await prisma.timeEntry.update({ where: { id }, data: { clockIn, clockOut } });
  }
  refreshClock();
}

export async function deleteTimeEntry(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  if (id) await prisma.timeEntry.delete({ where: { id } });
  refreshClock();
}

/**
 * Duplicate last week's shifts into the week being viewed. Returns the ids of
 * the shifts it created so the action can be undone (see undoCreatedShifts).
 */
export async function copyLastWeek(
  weekISO: string,
): Promise<{ created: number; ids: string[] }> {
  await requireAdmin();
  const week = startOfWeek(parseDay(weekISO));
  const lastStart = addDays(week, -7);
  const lastEnd = addDays(week, -1);
  const prev = await prisma.shift.findMany({
    where: { date: { gte: lastStart, lte: lastEnd } },
  });
  const ids: string[] = [];
  if (prev.length) {
    const data = prev.map((s) => {
      const id = crypto.randomUUID();
      ids.push(id);
      return {
        id,
        date: addDays(s.date, 7),
        start: s.start,
        end: s.end,
        role: s.role,
        employeeId: s.employeeId,
        published: s.published,
      };
    });
    await prisma.shift.createMany({ data });
  }
  refresh();
  return { created: ids.length, ids };
}

/** Undo a copy-last-week by deleting exactly the shifts it created. */
export async function undoCreatedShifts(ids: string[]): Promise<void> {
  await requireAdmin();
  if (ids.length) await prisma.shift.deleteMany({ where: { id: { in: ids } } });
  refresh();
}

export async function deleteShift(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  if (!id) return;
  await prisma.shift.delete({ where: { id } });
  refresh();
}
