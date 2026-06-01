"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";

export async function saveAvailability(formData: FormData) {
  const me = await requireStaff();

  const ops = [];
  for (let d = 0; d < 7; d++) {
    const available = formData.get(`available_${d}`) === "on";
    const preferredStart = String(formData.get(`start_${d}`) ?? "").trim() || null;
    const preferredEnd = String(formData.get(`end_${d}`) ?? "").trim() || null;
    const note = String(formData.get(`note_${d}`) ?? "").trim() || null;

    ops.push(
      prisma.availability.upsert({
        where: { employeeId_dayOfWeek: { employeeId: me.id, dayOfWeek: d } },
        create: {
          employeeId: me.id,
          dayOfWeek: d,
          available,
          preferredStart,
          preferredEnd,
          note,
        },
        update: { available, preferredStart, preferredEnd, note },
      }),
    );
  }
  await prisma.$transaction(ops);

  revalidatePath("/staff/availability");
  redirect(
    `/staff/availability?ok=${encodeURIComponent("Availability saved.")}`,
  );
}
