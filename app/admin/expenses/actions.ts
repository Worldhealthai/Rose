"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { parseMoney } from "@/lib/money";
import { parseDay, startOfMonth, today } from "@/lib/dates";

const BASE = "/admin/expenses";

/** Add an expense for a chosen month (stored on the 1st of that month). */
export async function createExpense(formData: FormData) {
  await requireAdmin();
  const month = String(formData.get("month") ?? "").trim();
  const dateStr = String(formData.get("date") ?? "").trim();
  const date = /^\d{4}-\d{2}$/.test(month)
    ? startOfMonth(parseDay(`${month}-01`))
    : dateStr
      ? parseDay(dateStr)
      : startOfMonth(today());
  const amount = parseMoney(formData.get("amount"));
  if (amount <= 0) return;

  await prisma.expense.create({
    data: {
      date,
      category: String(formData.get("category") ?? "Other").trim() || "Other",
      amount,
      supplierId: String(formData.get("supplierId") ?? "") || null,
      note: String(formData.get("note") ?? "").trim() || null,
    },
  });
  revalidatePath(BASE);
  revalidatePath("/admin");
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
