import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/money";
import {
  today as todayFn,
  parseDay,
  startOfMonth,
  endOfMonth,
  addMonths,
  formatMonth,
} from "@/lib/dates";
import { PageHeader, Card, StatCard, SectionTitle, Badge } from "@/components/ui";
import { Flash } from "@/components/Flash";
import { Icon } from "@/components/icons";
import { ExpenseForm } from "@/components/ExpenseForm";
import { recurringForMonth } from "@/lib/expenses";
import { deleteExpense, stopRecurring } from "./actions";

export const dynamic = "force-dynamic";
const monthParam = (d: Date) => d.toISOString().slice(0, 7);

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: { month?: string; ok?: string; error?: string };
}) {
  const today = todayFn();
  const anchor = searchParams.month ? parseDay(`${searchParams.month}-01`) : today;
  const monthStart = startOfMonth(anchor);
  const monthEnd = endOfMonth(anchor);
  const mp = monthParam(monthStart);

  const [rows, recurring] = await Promise.all([
    prisma.expense.findMany({
      where: { date: { gte: monthStart, lte: monthEnd } },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      include: {
        supplier: { select: { name: true } },
        employee: { select: { name: true } },
      },
    }),
    recurringForMonth(monthStart),
  ]);

  // Fixed monthly costs show first, then this month's one-off expenses.
  type Item = {
    kind: "one" | "rec";
    id: string;
    category: string;
    note: string | null;
    amount: number;
    sub: string;
  };
  const items: Item[] = [
    ...recurring.map((r) => ({
      kind: "rec" as const,
      id: r.id,
      category: r.category,
      note: r.note,
      amount: r.amount,
      sub: r.category,
    })),
    ...rows.map((r) => ({
      kind: "one" as const,
      id: r.id,
      category: r.category,
      note: r.note,
      amount: r.amount,
      sub: [r.note?.trim() ? r.category : null, r.employee?.name, r.supplier?.name]
        .filter(Boolean)
        .join(" · "),
    })),
  ];

  const total = items.reduce((s, r) => s + r.amount, 0);
  const byCat = new Map<string, number>();
  for (const r of items) byCat.set(r.category, (byCat.get(r.category) ?? 0) + r.amount);
  const topCats = [...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <div className="space-y-6">
      <PageHeader title="Expenses" subtitle="Costs & outgoings, by month" />
      <Flash ok={searchParams.ok} error={searchParams.error} />

      {/* Add expense */}
      <Card>
        <SectionTitle>Add an expense</SectionTitle>
        <ExpenseForm defaultMonth={mp} />
      </Card>

      {/* Month nav */}
      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/admin/expenses?month=${monthParam(addMonths(monthStart, -1))}`}
          className="btn-secondary !px-3"
          aria-label="Previous month"
        >
          <Icon name="chevronLeft" className="h-4 w-4" />
        </Link>
        <div className="text-center">
          <p className="font-semibold text-ink">{formatMonth(monthStart)}</p>
          <Link href="/admin/expenses" className="text-xs text-forest-300 hover:underline">
            This month
          </Link>
        </div>
        <Link
          href={`/admin/expenses?month=${monthParam(addMonths(monthStart, 1))}`}
          className="btn-secondary !px-3"
          aria-label="Next month"
        >
          <Icon name="chevronRight" className="h-4 w-4" />
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total expenses" value={money(total)} icon="cash" accent="#f0635a" />
        {topCats.map(([c, amt]) => (
          <StatCard key={c} label={c} value={money(amt)} accent="#9fb8aa" />
        ))}
      </div>

      {/* List */}
      <div>
        <SectionTitle>{formatMonth(monthStart)}</SectionTitle>
        {items.length === 0 ? (
          <Card>
            <p className="py-6 text-center text-sm text-ink-muted">
              No expenses recorded for {formatMonth(monthStart)}.
            </p>
          </Card>
        ) : (
          <ul className="space-y-2">
            {items.map((r) => {
              const name = r.note?.trim() || r.category;
              return (
                <Card
                  as="li"
                  key={`${r.kind}-${r.id}`}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate font-medium text-ink">
                      <span className="truncate">{name}</span>
                      {r.kind === "rec" && (
                        <Badge color="#22d3ee" tone="soft">
                          Monthly
                        </Badge>
                      )}
                    </p>
                    {r.sub && (
                      <p className="truncate text-xs text-ink-muted">{r.sub}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-semibold text-ink">{money(r.amount)}</span>
                    <form action={r.kind === "rec" ? stopRecurring : deleteExpense}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="month" value={mp} />
                      <button
                        className="grid h-9 w-9 place-items-center rounded-lg text-ink-faint hover:bg-danger/10 hover:text-danger"
                        aria-label={r.kind === "rec" ? "Stop repeating" : "Delete"}
                      >
                        <Icon name="trash" className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </Card>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
