"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";

function refresh() {
  revalidatePath("/staff");
  revalidatePath("/admin");
  revalidatePath("/admin/rota");
  revalidatePath("/admin/payroll");
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
