"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/auth";
import { createNotification } from "@/lib/notify";

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

function safeReturn(fd: FormData, fallback = "/admin/orders"): string {
  const r = String(fd.get("returnTo") ?? "");
  return r.startsWith("/admin") || r.startsWith("/staff") ? r : fallback;
}

function revalidateFor(supplierId?: string | null) {
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  if (supplierId) revalidatePath(`/admin/suppliers/${supplierId}`);
}

export async function createProduct(formData: FormData) {
  const me = await requireUser();
  const name = str(formData, "name");
  const returnTo = safeReturn(formData);
  if (!name) redirect(returnTo);
  const supplierId = str(formData, "supplierId") || null;
  const needed = formData.get("needed") === "on";
  await prisma.product.create({
    data: {
      name,
      supplierId,
      unit: str(formData, "unit") || null,
      category: str(formData, "category") || null,
      parLevel: str(formData, "parLevel") || null,
      needed,
    },
  });
  if (needed && me.role === "STAFF") {
    await createNotification(
      "order",
      `${me.name} added "${name}" to the order list`,
      "/admin/orders?filter=needed",
    );
  }
  revalidateFor(supplierId);
  redirect(returnTo);
}

export async function updateProduct(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const returnTo = safeReturn(formData);
  if (!id) redirect(returnTo);
  const supplierId = str(formData, "supplierId") || null;
  await prisma.product.update({
    where: { id },
    data: {
      name: str(formData, "name"),
      supplierId,
      unit: str(formData, "unit") || null,
      category: str(formData, "category") || null,
      parLevel: str(formData, "parLevel") || null,
    },
  });
  revalidateFor(supplierId);
  redirect(returnTo);
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const returnTo = safeReturn(formData);
  if (!id) redirect(returnTo);
  const p = await prisma.product.delete({ where: { id } });
  revalidateFor(p.supplierId);
  redirect(returnTo);
}

/** Flip a product's "needed" flag. Stays in place (no redirect). */
export async function toggleProductNeeded(formData: FormData) {
  const me = await requireUser();
  const id = str(formData, "id");
  if (!id) return;
  const p = await prisma.product.findUnique({ where: { id } });
  if (!p) return;
  await prisma.product.update({
    where: { id },
    data: { needed: !p.needed, neededNote: p.needed ? null : p.neededNote },
  });
  // Newly flagged (was not needed) by a staff member → notify.
  if (!p.needed && me.role === "STAFF") {
    await createNotification(
      "order",
      `${me.name} flagged "${p.name}" to order`,
      "/admin/orders?filter=needed",
    );
  }
  revalidateFor(p.supplierId);
}

/** Save the "how much to order" note for a needed product. */
export async function setNeededNote(formData: FormData) {
  await requireUser();
  const id = str(formData, "id");
  if (!id) return;
  const p = await prisma.product.update({
    where: { id },
    data: { neededNote: str(formData, "neededNote") || null },
  });
  revalidateFor(p.supplierId);
}

/** Mark everything from a supplier as ordered (clears the needed flags). */
export async function clearSupplierNeeded(formData: FormData) {
  await requireAdmin();
  const supplierId = str(formData, "supplierId") || null;
  const returnTo = safeReturn(formData);
  await prisma.product.updateMany({
    where: supplierId ? { supplierId } : { supplierId: null },
    data: { needed: false, neededNote: null },
  });
  revalidateFor(supplierId);
  redirect(returnTo);
}
