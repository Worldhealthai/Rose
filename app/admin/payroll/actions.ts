"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { parseMoney } from "@/lib/money";
import { today, parseDay } from "@/lib/dates";

function refresh() {
  revalidatePath("/admin/payroll");
  revalidatePath("/admin/expenses");
  revalidatePath("/admin");
}

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

/** A yyyy-mm-dd form value → UTC-midnight Date, or null if blank/invalid. */
function dayOrNull(value: string): Date | null {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? parseDay(value) : null;
}

function fail(msg: string): never {
  redirect(`/admin/payroll?error=${encodeURIComponent(msg)}`);
}

/**
 * Record a wage payment to an employee — stored as a Wages expense so it still
 * counts towards profit. `date` is when it was paid; `periodEnd` is the date
 * it covers up to ("paid until").
 */
export async function logWagePayment(formData: FormData) {
  await requireAdmin();
  const employeeId = str(formData, "employeeId");
  const amount = parseMoney(formData.get("amount"));
  if (!employeeId) fail("Choose who the payment is for.");
  if (amount <= 0) fail("Enter an amount greater than zero.");
  await prisma.expense.create({
    data: {
      date: dayOrNull(str(formData, "date")) ?? today(),
      category: "Wages",
      amount,
      employeeId,
      periodEnd: dayOrNull(str(formData, "periodEnd")),
      note: str(formData, "note") || null,
    },
  });
  refresh();
  redirect(`/admin/payroll?ok=${encodeURIComponent("Payment logged.")}`);
}

/** Edit an existing wage payment (amount, dates, note). */
export async function updateWagePayment(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const amount = parseMoney(formData.get("amount"));
  if (!id) fail("Missing payment.");
  if (amount <= 0) fail("Enter an amount greater than zero.");
  await prisma.expense.update({
    where: { id },
    data: {
      amount,
      date: dayOrNull(str(formData, "date")) ?? today(),
      periodEnd: dayOrNull(str(formData, "periodEnd")),
      note: str(formData, "note") || null,
    },
  });
  refresh();
  redirect(`/admin/payroll?ok=${encodeURIComponent("Payment updated.")}`);
}

export async function deleteWagePayment(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  if (id) await prisma.expense.delete({ where: { id } });
  refresh();
  redirect(`/admin/payroll?ok=${encodeURIComponent("Payment deleted.")}`);
}
