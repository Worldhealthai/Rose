"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { parseMoney } from "@/lib/money";
import { parseDay, startOfMonth, addMonths, today } from "@/lib/dates";

const BASE = "/admin/expenses";

/**
 * Add an expense for a chosen month (stored on the 1st). If "repeat" is set it
 * becomes a fixed monthly cost (a recurring template) instead of a one-off.
 */
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

  const category = String(formData.get("category") ?? "Other").trim() || "Other";
  const note = String(formData.get("note") ?? "").trim() || null;
  const repeat = formData.get("repeat") === "on";

  if (repeat) {
    await prisma.recurringExpense.create({
      data: { category, amount, note, startMonth: date },
    });
  } else {
    await prisma.expense.create({
      data: {
        date,
        category,
        amount,
        supplierId: String(formData.get("supplierId") ?? "") || null,
        note,
      },
    });
  }
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

/**
 * Stop a recurring expense. It keeps appearing through last month (history is
 * preserved) but no longer counts this month onward. One added by mistake this
 * month disappears entirely (start month is after the new end month).
 */
export async function stopRecurring(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const month = String(formData.get("month") ?? "");
  if (id) {
    const endMonth = addMonths(startOfMonth(today()), -1);
    await prisma.recurringExpense.update({ where: { id }, data: { endMonth } });
  }
  revalidatePath(BASE);
  revalidatePath("/admin");
  redirect(`${BASE}${month ? `?month=${month}` : ""}`);
}
