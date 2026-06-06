import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { money, CURRENCY_SYMBOL } from "@/lib/money";
import { EXPENSE_CATEGORIES } from "@/lib/settings";
import {
  today as todayFn,
  parseDay,
  startOfMonth,
  endOfMonth,
  addMonths,
  toISODate,
  formatMonth,
  formatDay,
} from "@/lib/dates";
import { PageHeader, Card, StatCard, SectionTitle } from "@/components/ui";
import { Flash } from "@/components/Flash";
import { Icon } from "@/components/icons";
import { createExpense, deleteExpense } from "./actions";

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

  const [rows, suppliers] = await Promise.all([
    prisma.expense.findMany({
      where: { date: { gte: monthStart, lte: monthEnd } },
      orderBy: { date: "desc" },
      include: {
        supplier: { select: { name: true } },
        employee: { select: { name: true } },
      },
    }),
    prisma.supplier.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const total = rows.reduce((s, r) => s + r.amount, 0);
  const byCat = new Map<string, number>();
  for (const r of rows) byCat.set(r.category, (byCat.get(r.category) ?? 0) + r.amount);

  return (
    <div className="space-y-6">
      <PageHeader title="Expenses" subtitle="Costs & outgoings" />
      <Flash ok={searchParams.ok} error={searchParams.error} />

      {/* Add expense */}
      <Card>
        <SectionTitle>Add an expense</SectionTitle>
        <form action={createExpense} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="label">Date</label>
              <input name="date" type="date" defaultValue={toISODate(today)} max={toISODate(today)} className="input" required />
            </div>
            <div>
              <label className="label">Category</label>
              <select name="category" defaultValue="Stock" className="input">
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Amount ({CURRENCY_SYMBOL})</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint">{CURRENCY_SYMBOL}</span>
                <input name="amount" type="number" step="0.01" min="0" inputMode="decimal" className="input pl-8" placeholder="0.00" required />
              </div>
            </div>
            <div>
              <label className="label">Supplier (optional)</label>
              <select name="supplierId" defaultValue="" className="input">
                <option value="">—</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Note (optional)</label>
            <input name="note" className="input" placeholder="e.g. weekly meat order" />
          </div>
          <button className="btn-primary">Add expense</button>
        </form>
      </Card>

      {/* Month nav */}
      <div className="flex items-center justify-between gap-2">
        <Link href={`/admin/expenses?month=${monthParam(addMonths(monthStart, -1))}`} className="btn-secondary !px-3" aria-label="Previous month">
          <Icon name="chevronLeft" className="h-4 w-4" />
        </Link>
        <div className="text-center">
          <p className="font-semibold text-ink">{formatMonth(monthStart)}</p>
          <Link href="/admin/expenses" className="text-xs text-forest-300 hover:underline">This month</Link>
        </div>
        <Link href={`/admin/expenses?month=${monthParam(addMonths(monthStart, 1))}`} className="btn-secondary !px-3" aria-label="Next month">
          <Icon name="chevronRight" className="h-4 w-4" />
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total expenses" value={money(total)} icon="cash" accent="#f0635a" />
        {EXPENSE_CATEGORIES.filter((c) => byCat.get(c)).slice(0, 3).map((c) => (
          <StatCard key={c} label={c} value={money(byCat.get(c) ?? 0)} accent="#9fb8aa" />
        ))}
      </div>

      {/* List */}
      <div>
        <SectionTitle>{formatMonth(monthStart)}</SectionTitle>
        {rows.length === 0 ? (
          <Card>
            <p className="py-6 text-center text-sm text-ink-muted">No expenses recorded for {formatMonth(monthStart)}.</p>
          </Card>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => (
              <Card as="li" key={r.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-ink">
                    {money(r.amount)}
                    <span className="ml-2 text-xs font-normal text-ink-faint">{r.category}</span>
                  </p>
                  <p className="truncate text-xs text-ink-muted">
                    {formatDay(r.date)}
                    {r.employee ? ` · ${r.employee.name}` : ""}
                    {r.supplier ? ` · ${r.supplier.name}` : ""}
                    {r.note ? ` · ${r.note}` : ""}
                  </p>
                </div>
                <form action={deleteExpense}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="month" value={mp} />
                  <button className="grid h-9 w-9 place-items-center rounded-lg text-ink-faint hover:bg-danger/10 hover:text-danger" aria-label="Delete">
                    <Icon name="trash" className="h-4 w-4" />
                  </button>
                </form>
              </Card>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
