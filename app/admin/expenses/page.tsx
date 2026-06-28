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
import { PageHeader, Card, StatCard, SectionTitle } from "@/components/ui";
import { Flash } from "@/components/Flash";
import { Icon } from "@/components/icons";
import { ExpenseForm } from "@/components/ExpenseForm";
import { deleteExpense } from "./actions";

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

  const rows = await prisma.expense.findMany({
    where: { date: { gte: monthStart, lte: monthEnd } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: {
      supplier: { select: { name: true } },
      employee: { select: { name: true } },
    },
  });

  const total = rows.reduce((s, r) => s + r.amount, 0);
  const byCat = new Map<string, number>();
  for (const r of rows) byCat.set(r.category, (byCat.get(r.category) ?? 0) + r.amount);
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
        {rows.length === 0 ? (
          <Card>
            <p className="py-6 text-center text-sm text-ink-muted">
              No expenses recorded for {formatMonth(monthStart)}.
            </p>
          </Card>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => {
              const name = r.note?.trim() || r.category;
              const sub = [
                r.note?.trim() ? r.category : null,
                r.employee?.name,
                r.supplier?.name,
              ]
                .filter(Boolean)
                .join(" · ");
              return (
                <Card
                  as="li"
                  key={r.id}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{name}</p>
                    {sub && (
                      <p className="truncate text-xs text-ink-muted">{sub}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-semibold text-ink">{money(r.amount)}</span>
                    <form action={deleteExpense}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="month" value={mp} />
                      <button
                        className="grid h-9 w-9 place-items-center rounded-lg text-ink-faint hover:bg-danger/10 hover:text-danger"
                        aria-label="Delete"
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
