"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { parseMoney } from "@/lib/money";
import { today } from "@/lib/dates";

function refresh() {
  revalidatePath("/admin/payroll");
  revalidatePath("/admin/expenses");
  revalidatePath("/admin");
}

/** Record a wage payment to an employee — stored as a Wages expense. */
export async function logWagePayment(formData: FormData) {
  await requireAdmin();
  const employeeId = String(formData.get("employeeId") ?? "");
  const amount = parseMoney(formData.get("amount"));
  if (!employeeId || amount <= 0) redirect("/admin/payroll");
  await prisma.expense.create({
    data: {
      date: today(),
      category: "Wages",
      amount,
      employeeId,
      note: String(formData.get("note") ?? "").trim() || null,
    },
  });
  refresh();
  redirect(`/admin/payroll?ok=${encodeURIComponent("Payment logged.")}`);
}

export async function deleteWagePayment(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await prisma.expense.delete({ where: { id } });
  refresh();
  redirect("/admin/payroll");
}
