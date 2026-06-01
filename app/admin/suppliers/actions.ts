"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const BASE = "/admin/suppliers";

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

function supplierData(fd: FormData) {
  return {
    name: str(fd, "name"),
    category: str(fd, "category") || null,
    contactName: str(fd, "contactName") || null,
    phone: str(fd, "phone") || null,
    email: str(fd, "email") || null,
    website: str(fd, "website") || null,
    address: str(fd, "address") || null,
    notes: str(fd, "notes") || null,
  };
}

export async function createSupplier(formData: FormData) {
  await requireAdmin();
  const data = supplierData(formData);
  if (!data.name) redirect(`${BASE}?error=${encodeURIComponent("Supplier name is required.")}`);
  const created = await prisma.supplier.create({ data });
  revalidatePath(BASE);
  redirect(`${BASE}/${created.id}?ok=${encodeURIComponent("Supplier added.")}`);
}

export async function updateSupplier(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  if (!id) redirect(`${BASE}?error=Missing supplier.`);
  const data = supplierData(formData);
  if (!data.name) {
    redirect(`${BASE}/${id}?error=${encodeURIComponent("Supplier name is required.")}`);
  }
  await prisma.supplier.update({ where: { id }, data });
  revalidatePath(BASE);
  revalidatePath(`${BASE}/${id}`);
  redirect(`${BASE}/${id}?ok=${encodeURIComponent("Supplier updated.")}`);
}

export async function deleteSupplier(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  if (!id) redirect(`${BASE}?error=Missing supplier.`);
  // Products keep existing but become unassigned (onDelete: SetNull).
  await prisma.supplier.delete({ where: { id } });
  revalidatePath(BASE);
  revalidatePath("/admin/orders");
  redirect(`${BASE}?ok=${encodeURIComponent("Supplier deleted.")}`);
}
