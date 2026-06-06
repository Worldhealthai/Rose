"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/auth";
import { parseMoney } from "@/lib/money";

function str(fd: FormData, k: string): string {
  return String(fd.get(k) ?? "").trim();
}

function refresh() {
  revalidatePath("/admin/menu");
  revalidatePath("/staff/menu");
  revalidatePath("/admin");
  revalidatePath("/staff");
}

export async function createMenuItem(formData: FormData) {
  await requireAdmin();
  const name = str(formData, "name");
  if (!name) redirect("/admin/menu?error=Name+required");
  await prisma.menuItem.create({
    data: {
      name,
      category: str(formData, "category") || null,
      price: str(formData, "price") ? parseMoney(formData.get("price")) : null,
    },
  });
  refresh();
  redirect("/admin/menu?ok=Item+added");
}

export async function updateMenuItem(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  if (!id) redirect("/admin/menu");
  await prisma.menuItem.update({
    where: { id },
    data: {
      name: str(formData, "name"),
      category: str(formData, "category") || null,
      price: str(formData, "price") ? parseMoney(formData.get("price")) : null,
    },
  });
  refresh();
  redirect("/admin/menu?ok=Saved");
}

export async function deleteMenuItem(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  if (id) await prisma.menuItem.delete({ where: { id } });
  refresh();
  redirect("/admin/menu?ok=Item+removed");
}

/** Mark an item available/unavailable. Turning it back on clears the reminders. */
export async function toggleMenuAvailable(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const item = await prisma.menuItem.findUnique({ where: { id } });
  if (!item) return;
  const nowAvailable = !item.available;
  await prisma.menuItem.update({
    where: { id },
    data: nowAvailable
      ? {
          available: true,
          offJustEat: false,
          offUberEats: false,
          offDeliveroo: false,
          unavailableNote: null,
        }
      : { available: false },
  });
  refresh();
}

export async function toggleMenuPlatform(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const platform = String(formData.get("platform") ?? "");
  const field =
    platform === "justEat"
      ? "offJustEat"
      : platform === "uberEats"
        ? "offUberEats"
        : platform === "deliveroo"
          ? "offDeliveroo"
          : null;
  if (!id || !field) return;
  const item = await prisma.menuItem.findUnique({ where: { id } });
  if (!item) return;
  await prisma.menuItem.update({
    where: { id },
    data: { [field]: !item[field] },
  });
  refresh();
}

export async function setMenuNote(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.menuItem.update({
    where: { id },
    data: { unavailableNote: String(formData.get("note") ?? "").trim() || null },
  });
  refresh();
}
