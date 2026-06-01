import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { money, CURRENCY_SYMBOL } from "@/lib/money";
import { CHANNELS, incomeTotal, sumIncome, pct } from "@/lib/calc";
import {
  today as todayFn,
  parseDay,
  startOfMonth,
  endOfMonth,
  addMonths,
  toISODate,
  formatMonth,
  formatDay,
  relativeDay,
} from "@/lib/dates";
import { PageHeader, Card, StatCard, SectionTitle, Badge } from "@/components/ui";
import { Flash } from "@/components/Flash";
import { BarTrend, StackedBar } from "@/components/charts";
import { Icon } from "@/components/icons";
import { upsertIncome, deleteIncome } from "./actions";

export const dynamic = "force-dynamic";

const monthParam = (d: Date) => d.toISOString().slice(0, 7);

function MoneyField({
  name,
  label,
  color,
  value,
}: {
  name: string;
  label: string;
  color: string;
  value?: number;
}) {
  return (
    <div>
      <label className="label flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint">
          {CURRENCY_SYMBOL}
        </span>
        <input
          name={name}
          type="number"
          step="0.01"
          min="0"
          inputMode="decimal"
          defaultValue={value ?? ""}
          placeholder="0.00"
          className="input pl-7"
        />
      </div>
    </div>
  );
}

export default async function IncomePage({
  searchParams,
}: {
  searchParams: { month?: string; date?: string; ok?: string; error?: string };
}) {
  const today = todayFn();
  const selectedDate = parseDay(searchParams.date);
  const monthAnchor = searchParams.month
    ? parseDay(`${searchParams.month}-01`)
    : today;
  const monthStart = startOfMonth(monthAnchor);
  const monthEnd = endOfMonth(monthAnchor);

  const [editingRow, monthRows] = await Promise.all([
    prisma.dailyIncome.findUnique({ where: { date: selectedDate } }),
    prisma.dailyIncome.findMany({
      where: { date: { gte: monthStart, lte: monthEnd } },
      orderBy: { date: "desc" },
    }),
  ]);

  const summary = sumIncome(monthRows);
  const avg = monthRows.length ? summary.total / monthRows.length : 0;
  const best =
    monthRows.length > 0
      ? monthRows.reduce((a, b) => (incomeTotal(b) > incomeTotal(a) ? b : a))
      : null;

  const byDay = new Map(monthRows.map((r) => [toISODate(r.date), r]));
  const daysInMonth = monthEnd.getUTCDate();
  const trend = Array.from({ length: daysInMonth }, (_, i) => {
    const iso = toISODate(
      new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth(), i + 1)),
    );
    const row = byDay.get(iso);
    return { label: String(i + 1), value: row ? incomeTotal(row) : 0 };
  });

  const editingDateISO = toISODate(selectedDate);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Income"
        subtitle="Daily takings, split by channel"
      />
      <Flash ok={searchParams.ok} error={searchParams.error} />

      {/* Entry / edit form */}
      <Card>
        <SectionTitle
          action={
            editingRow ? (
              <Link
                href={`/admin/income?month=${monthParam(monthStart)}&date=${toISODate(today)}`}
                className="text-xs font-medium text-forest-300 hover:underline"
              >
                + New day
              </Link>
            ) : null
          }
        >
          {editingRow
            ? `Edit ${formatDay(selectedDate)}`
            : "Enter a day's takings"}
        </SectionTitle>
        <form action={upsertIncome} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Date</label>
              <input
                name="date"
                type="date"
                defaultValue={editingDateISO}
                max={toISODate(today)}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Covers (optional)</label>
              <input
                name="covers"
                type="number"
                min="0"
                defaultValue={editingRow?.covers ?? ""}
                placeholder="No. of customers"
                className="input"
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MoneyField
              name="zReport"
              label="Z report (till)"
              color="#37c97e"
              value={editingRow?.zReport}
            />
            <MoneyField
              name="justEat"
              label="Just Eat"
              color="#f59e0b"
              value={editingRow?.justEat}
            />
            <MoneyField
              name="uberEats"
              label="Uber Eats"
              color="#34d399"
              value={editingRow?.uberEats}
            />
            <MoneyField
              name="deliveroo"
              label="Deliveroo"
              color="#22d3ee"
              value={editingRow?.deliveroo}
            />
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <input
              name="notes"
              defaultValue={editingRow?.notes ?? ""}
              placeholder="Anything notable about the day"
              className="input"
            />
          </div>
          <button className="btn-primary">
            {editingRow ? "Update day" : "Save takings"}
          </button>
        </form>
        {editingRow && (
          <form action={deleteIncome} className="mt-3">
            <input type="hidden" name="date" value={editingDateISO} />
            <button className="btn-ghost text-danger hover:bg-danger/10">
              <Icon name="trash" className="h-4 w-4" />
              Delete this day
            </button>
          </form>
        )}
      </Card>

      {/* Month navigation + summary */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <Link
            href={`/admin/income?month=${monthParam(addMonths(monthStart, -1))}`}
            className="btn-secondary !px-3"
            aria-label="Previous month"
          >
            <Icon name="chevronLeft" className="h-4 w-4" />
          </Link>
          <h2 className="text-lg font-semibold text-ink">
            {formatMonth(monthStart)}
          </h2>
          <Link
            href={`/admin/income?month=${monthParam(addMonths(monthStart, 1))}`}
            className="btn-secondary !px-3"
            aria-label="Next month"
          >
            <Icon name="chevronRight" className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Month total" value={money(summary.total)} icon="cash" />
          <StatCard
            label="Avg / day"
            value={money(avg)}
            sub={`${monthRows.length} days`}
            icon="trend"
            accent="#34d399"
          />
          <StatCard
            label="Best day"
            value={best ? money(incomeTotal(best)) : "—"}
            sub={best ? formatDay(best.date) : undefined}
            icon="star"
            accent="#22d3ee"
          />
          <StatCard
            label="Delivery share"
            value={`${pct(
              summary.justEat + summary.uberEats + summary.deliveroo,
              summary.total,
            )}%`}
            sub="of takings"
            icon="truck"
            accent="#f59e0b"
          />
        </div>
      </div>

      {/* Channel breakdown */}
      <Card>
        <SectionTitle>Channel breakdown · {formatMonth(monthStart)}</SectionTitle>
        <div className="mb-4">
          <StackedBar
            segments={CHANNELS.map((c) => ({
              label: c.label,
              value: summary[c.key],
              color: c.color,
            }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {CHANNELS.map((c) => (
            <div key={c.key} className="rounded-xl bg-canvas/40 p-3">
              <p className="flex items-center gap-2 text-xs text-ink-muted">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: c.color }}
                />
                {c.label}
              </p>
              <p className="mt-1 text-lg font-bold text-ink">
                {money(summary[c.key])}
              </p>
              <p className="text-xs text-ink-faint">
                {pct(summary[c.key], summary.total)}% of total
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Daily trend */}
      {monthRows.length > 0 && (
        <Card>
          <SectionTitle>Daily takings</SectionTitle>
          <BarTrend data={trend} formatValue={(v) => money(v)} />
        </Card>
      )}

      {/* Day list */}
      <div>
        <SectionTitle>Recorded days</SectionTitle>
        {monthRows.length === 0 ? (
          <Card>
            <p className="py-6 text-center text-sm text-ink-muted">
              No takings recorded for {formatMonth(monthStart)} yet.
            </p>
          </Card>
        ) : (
          <ul className="space-y-2.5">
            {monthRows.map((r) => {
              const total = incomeTotal(r);
              return (
                <Card as="li" key={r.id}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">
                        {formatDay(r.date)}
                      </p>
                      <p className="text-xs text-ink-faint">
                        {relativeDay(r.date)}
                        {r.covers ? ` · ${r.covers} covers` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-ink">
                        {money(total)}
                      </span>
                      <Link
                        href={`/admin/income?month=${monthParam(monthStart)}&date=${toISODate(r.date)}`}
                        className="grid h-9 w-9 place-items-center rounded-lg border border-border text-ink-muted hover:text-ink"
                        aria-label="Edit day"
                      >
                        <Icon name="edit" className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                  <div className="mt-2.5">
                    <StackedBar
                      segments={CHANNELS.map((c) => ({
                        label: c.label,
                        value: r[c.key],
                        color: c.color,
                      }))}
                    />
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
                    {CHANNELS.map((c) => (
                      <span
                        key={c.key}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="flex items-center gap-1.5 text-ink-faint">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: c.color }}
                          />
                          {c.label}
                        </span>
                        <span className="text-ink-muted">{money(r[c.key])}</span>
                      </span>
                    ))}
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
