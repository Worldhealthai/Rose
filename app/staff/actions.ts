"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { localTimeToDate } from "@/lib/dates";

function refresh() {
  revalidatePath("/staff");
  revalidatePath("/admin");
  revalidatePath("/admin/rota");
  revalidatePath("/admin/payroll");
}

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

const HHMM = /^\d{2}:\d{2}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

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

export async function clockIn() {
  const me = await requireStaff();
  const open = await prisma.timeEntry.findFirst({
    where: { employeeId: me.id, clockOut: null },
  });
  if (!open) {
    await prisma.timeEntry.create({
      data: { employeeId: me.id, clockIn: new Date() },
    });
  }
  refresh();
}

export async function clockOut() {
  const me = await requireStaff();
  const open = await prisma.timeEntry.findFirst({
    where: { employeeId: me.id, clockOut: null },
    orderBy: { clockIn: "desc" },
  });
  if (open) {
    await prisma.timeEntry.update({
      where: { id: open.id },
      data: { clockOut: new Date() },
    });
  }
  refresh();
}

/**
 * Let a staff member correct one of their own clock entries — e.g. set the
 * check-out time they forgot to log. Only ever touches the caller's entries.
 * Leave "out" empty to mark the entry as still open.
 */
export async function updateMyTimeEntry(formData: FormData) {
  const me = await requireStaff();
  const id = str(formData, "id");
  const dayISO = str(formData, "date");
  const inHHMM = str(formData, "in");
  const outHHMM = str(formData, "out");
  if (!id || !DAY.test(dayISO) || !HHMM.test(inHHMM)) return;

  const entry = await prisma.timeEntry.findUnique({
    where: { id },
    select: { employeeId: true },
  });
  if (!entry || entry.employeeId !== me.id) return; // not theirs — ignore

  const { clockIn, clockOut } = clockTimes(
    dayISO,
    inHHMM,
    HHMM.test(outHHMM) ? outHHMM : "",
  );
  await prisma.timeEntry.update({ where: { id }, data: { clockIn, clockOut } });
  refresh();
}

/** Delete one of the caller's own clock entries (e.g. an accidental check-in). */
export async function deleteMyTimeEntry(formData: FormData) {
  const me = await requireStaff();
  const id = str(formData, "id");
  if (!id) return;
  const entry = await prisma.timeEntry.findUnique({
    where: { id },
    select: { employeeId: true },
  });
  if (!entry || entry.employeeId !== me.id) return;
  await prisma.timeEntry.delete({ where: { id } });
  refresh();
}
