"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/auth";
import { today } from "@/lib/dates";

function str(fd: FormData, k: string): string {
  return String(fd.get(k) ?? "").trim();
}

function refresh() {
  revalidatePath("/admin/checklist");
  revalidatePath("/staff/checklist");
  revalidatePath("/admin");
  revalidatePath("/staff");
}

export async function createTask(formData: FormData) {
  await requireAdmin();
  const title = str(formData, "title");
  if (!title) redirect("/admin/checklist?error=Task+needs+a+title");
  await prisma.task.create({
    data: {
      title,
      area: str(formData, "area") || null,
      assigneeId: str(formData, "assigneeId") || null,
    },
  });
  refresh();
  redirect("/admin/checklist?ok=Task+added");
}

export async function updateTask(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  if (!id) redirect("/admin/checklist");
  await prisma.task.update({
    where: { id },
    data: {
      title: str(formData, "title"),
      area: str(formData, "area") || null,
      active: formData.get("active") === "on",
      assigneeId: str(formData, "assigneeId") || null,
    },
  });
  refresh();
  redirect("/admin/checklist?ok=Saved");
}

export async function deleteTask(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  if (id) await prisma.task.delete({ where: { id } });
  refresh();
  redirect("/admin/checklist?ok=Task+removed");
}

/** Tick / untick a task for today. Available to any signed-in user. */
export async function toggleTaskToday(formData: FormData) {
  const me = await requireUser();
  const taskId = String(formData.get("taskId") ?? "");
  if (!taskId) return;
  const date = today();
  const existing = await prisma.taskCompletion.findUnique({
    where: { taskId_date: { taskId, date } },
  });
  if (existing) {
    await prisma.taskCompletion.delete({ where: { id: existing.id } });
  } else {
    await prisma.taskCompletion.create({
      data: { taskId, date, doneById: me.id, doneByName: me.name },
    });
  }
  refresh();
}
