"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { parseMoney } from "@/lib/money";
import { parseDay, startOfMonth } from "@/lib/dates";

const BASE = "/admin/expenses";
const monthParam = (d: Date) => d.toISOString().slice(0, 7);

export async function createExpense(formData: FormData) {
  await requireAdmin();
  const date = parseDay(String(formData.get("date")));
  await prisma.expense.create({
    data: {
      date,
      category: String(formData.get("category") ?? "Other").trim() || "Other",
      amount: parseMoney(formData.get("amount")),
      supplierId: String(formData.get("supplierId") ?? "") || null,
      note: String(formData.get("note") ?? "").trim() || null,
    },
  });
  revalidatePath(BASE);
  revalidatePath("/admin");
  redirect(`${BASE}?month=${monthParam(startOfMonth(date))}&ok=${encodeURIComponent("Expense added.")}`);
}

export async function deleteExpense(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const month = String(formData.get("month") ?? "");
  if (id) await prisma.expense.delete({ where: { id } });
  revalidatePath(BASE);
  revalidatePath("/admin");
  redirect(`${BASE}${month ? `?month=${month}` : ""}`);
}
