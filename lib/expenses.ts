import "server-only";
import { prisma } from "./prisma";
import { startOfMonth, today } from "./dates";

export type RecurringRow = {
  id: string;
  category: string;
  note: string | null;
  amount: number;
};

/**
 * Fixed monthly expenses that apply to the given month — started on/before it
 * and not yet ended. Future months return none (we don't project costs that
 * haven't been incurred yet).
 */
export async function recurringForMonth(monthStart: Date): Promise<RecurringRow[]> {
  if (monthStart > startOfMonth(today())) return [];
  return prisma.recurringExpense.findMany({
    where: {
      startMonth: { lte: monthStart },
      OR: [{ endMonth: null }, { endMonth: { gte: monthStart } }],
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, category: true, note: true, amount: true },
  });
}
