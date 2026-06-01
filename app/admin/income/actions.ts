"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { parseMoney } from "@/lib/money";
import { parseDay, startOfMonth } from "@/lib/dates";

const BASE = "/admin/income";

function monthParam(d: Date): string {
  return d.toISOString().slice(0, 7);
}

function parseCovers(v: FormDataEntryValue | null): number | null {
  if (v == null || String(v).trim() === "") return null;
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export async function upsertIncome(formData: FormData) {
  await requireAdmin();
  const date = parseDay(String(formData.get("date")));
  const data = {
    zReport: parseMoney(formData.get("zReport")),
    justEat: parseMoney(formData.get("justEat")),
    uberEats: parseMoney(formData.get("uberEats")),
    deliveroo: parseMoney(formData.get("deliveroo")),
    covers: parseCovers(formData.get("covers")),
    notes: String(formData.get("notes") ?? "").trim() || null,
  };

  await prisma.dailyIncome.upsert({
    where: { date },
    create: { date, ...data },
    update: data,
  });

  revalidatePath(BASE);
  redirect(
    `${BASE}?month=${monthParam(startOfMonth(date))}&ok=${encodeURIComponent(
      "Takings saved.",
    )}`,
  );
}

export async function deleteIncome(formData: FormData) {
  await requireAdmin();
  const date = parseDay(String(formData.get("date")));
  await prisma.dailyIncome.deleteMany({ where: { date } });
  revalidatePath(BASE);
  redirect(
    `${BASE}?month=${monthParam(startOfMonth(date))}&ok=${encodeURIComponent(
      "Day removed.",
    )}`,
  );
}
