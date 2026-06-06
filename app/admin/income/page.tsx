import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { money, CURRENCY_SYMBOL } from "@/lib/money";
import { CHANNELS, incomeTotal, sumIncome, pct } from "@/lib/calc";
import {
  today as todayFn,
  parseDay,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  addMonths,
  addDays,
  toISODate,
  formatMonth,
  formatDay,
  formatLongDay,
  formatShort,
  relativeDay,
  WEEKDAYS_SHORT,
} from "@/lib/dates";
import { PageHeader, Card, StatCard, SectionTitle, Dot } from "@/components/ui";
import { BarTrend, StackedBar } from "@/components/charts";
import { Icon } from "@/components/icons";
import { RefreshForm, SubmitButton } from "@/components/forms";
import { upsertIncome, deleteIncome } from "./actions";

export const dynamic = "force-dynamic";

type View = "day" | "week" | "month";

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
        <Dot color={color} />
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
          className="input pl-8"
        />
      </div>
    </div>
  );
}

export default async function IncomePage({
  searchParams,
}: {
  searchParams: { view?: string; anchor?: string; date?: string };
}) {
  const today = todayFn();
  const view: View =
    searchParams.view === "day" || searchParams.view === "week"
      ? searchParams.view
      : "month";
  const anchor = parseDay(searchParams.anchor);

  // Work out the period being viewed.
  let periodStart: Date;
  let periodEnd: Date;
  let prevAnchor: Date;
  let nextAnchor: Date;
  let periodLabel: string;
  if (view === "day") {
    periodStart = anchor;
    periodEnd = anchor;
    prevAnchor = addDays(anchor, -1);
    nextAnchor = addDays(anchor, 1);
    periodLabel = formatLongDay(anchor);
  } else if (view === "week") {
    periodStart = startOfWeek(anchor);
    periodEnd = addDays(periodStart, 6);
    prevAnchor = addDays(periodStart, -7);
    nextAnchor = addDays(periodStart, 7);
    periodLabel = `${formatShort(periodStart)} – ${formatShort(periodEnd)}`;
  } else {
    periodStart = startOfMonth(anchor);
    periodEnd = endOfMonth(anchor);
    prevAnchor = addMonths(periodStart, -1);
    nextAnchor = addMonths(periodStart, 1);
    periodLabel = formatMonth(periodStart);
  }

  const selectedDate = searchParams.date
    ? parseDay(searchParams.date)
    : view === "day"
      ? anchor
      : today;

  const [editingRow, rows] = await Promise.all([
    prisma.dailyIncome.findUnique({ where: { date: selectedDate } }),
    prisma.dailyIncome.findMany({
      where: { date: { gte: periodStart, lte: periodEnd } },
      orderBy: { date: "desc" },
    }),
  ]);

  const summary = sumIncome(rows);
  const avg = rows.length ? summary.total / rows.length : 0;
  const best =
    rows.length > 0
      ? rows.reduce((a, b) => (incomeTotal(b) > incomeTotal(a) ? b : a))
      : null;
  const deliveryShare = pct(
    summary.justEat + summary.uberEats + summary.deliveroo,
    summary.total,
  );

  // Trend bars (week = 7 days, month = each day; none for a single day).
  const byDay = new Map(rows.map((r) => [toISODate(r.date), r]));
  const trendLen =
    view === "week" ? 7 : view === "month" ? periodEnd.getUTCDate() : 0;
  const trend = Array.from({ length: trendLen }, (_, i) => {
    const d = addDays(periodStart, i);
    const r = byDay.get(toISODate(d));
    return {
      label: view === "week" ? WEEKDAYS_SHORT[i] : String(i + 1),
      value: r ? incomeTotal(r) : 0,
    };
  });

  const editingDateISO = toISODate(selectedDate);
  const base = "/admin/income";
  const periodHref = (a: Date) => `${base}?view=${view}&anchor=${toISODate(a)}`;
  const editHref = (d: Date) =>
    `${base}?view=${view}&anchor=${toISODate(anchor)}&date=${toISODate(d)}`;

  const VIEWS: { key: View; label: string }[] = [
    { key: "day", label: "Day" },
    { key: "week", label: "Week" },
    { key: "month", label: "Month" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Income" subtitle="Daily takings, split by channel" />

      {/* Entry / edit form */}
      <Card>
        <SectionTitle
          action={
            <Link
              href={`${base}?view=${view}&anchor=${toISODate(anchor)}&date=${toISODate(today)}`}
              className="text-xs font-medium text-forest-300 hover:underline"
            >
              + New day
            </Link>
          }
        >
          {editingRow ? `Edit ${formatDay(selectedDate)}` : "Enter a day's takings"}
        </SectionTitle>
        <RefreshForm action={upsertIncome} className="space-y-4">
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
            {CHANNELS.map((c) => (
              <MoneyField
                key={c.key}
                name={c.key}
                label={c.label}
                color={c.color}
                value={editingRow?.[c.key]}
              />
            ))}
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
          <SubmitButton>{editingRow ? "Update day" : "Save takings"}</SubmitButton>
        </RefreshForm>
        {editingRow && (
          <RefreshForm action={deleteIncome} className="mt-3">
            <input type="hidden" name="date" value={editingDateISO} />
            <SubmitButton
              className="btn-ghost text-danger hover:bg-danger/10"
              pendingLabel="Deleting…"
              savedLabel="Deleted"
            >
              <Icon name="trash" className="h-4 w-4" />
              Delete this day
            </SubmitButton>
          </RefreshForm>
        )}
      </Card>

      {/* View switch */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-xl border border-border p-0.5 text-sm">
          {VIEWS.map((v) => (
            <Link
              key={v.key}
              href={`${base}?view=${v.key}`}
              className={`rounded-lg px-4 py-1.5 font-medium transition ${
                view === v.key
                  ? "bg-forest-500/20 text-forest-100"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              {v.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Period navigation */}
      <div className="flex items-center justify-between gap-2">
        <Link href={periodHref(prevAnchor)} className="btn-secondary !px-3" aria-label="Previous">
          <Icon name="chevronLeft" className="h-4 w-4" />
        </Link>
        <div className="text-center">
          <p className="font-semibold text-ink">{periodLabel}</p>
          <Link href={`${base}?view=${view}`} className="text-xs text-forest-300 hover:underline">
            {view === "day" ? "Today" : view === "week" ? "This week" : "This month"}
          </Link>
        </div>
        <Link href={periodHref(nextAnchor)} className="btn-secondary !px-3" aria-label="Next">
          <Icon name="chevronRight" className="h-4 w-4" />
        </Link>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={view === "day" ? "Day total" : `${view} total`}
          value={money(summary.total)}
          icon="cash"
        />
        {view === "day" ? (
          <StatCard
            label="Covers"
            value={best?.covers ?? rows[0]?.covers ?? "—"}
            icon="users"
            accent="#34d399"
          />
        ) : (
          <>
            <StatCard
              label="Avg / day"
              value={money(avg)}
              sub={`${rows.length} day${rows.length === 1 ? "" : "s"}`}
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
          </>
        )}
        <StatCard
          label="Delivery share"
          value={`${deliveryShare}%`}
          sub="of takings"
          icon="truck"
          accent="#f59e0b"
        />
      </div>

      {/* Channel breakdown */}
      <Card>
        <SectionTitle>Channel breakdown · {periodLabel}</SectionTitle>
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
                <Dot color={c.color} />
                {c.label}
              </p>
              <p className="mt-1 text-lg font-bold text-ink">{money(summary[c.key])}</p>
              <p className="text-xs text-ink-faint">
                {pct(summary[c.key], summary.total)}% of total
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Trend */}
      {trendLen > 0 && rows.length > 0 && (
        <Card>
          <SectionTitle>Daily takings</SectionTitle>
          <BarTrend data={trend} formatValue={(v) => money(v)} />
        </Card>
      )}

      {/* Day list */}
      <div>
        <SectionTitle>{view === "day" ? "This day" : "Recorded days"}</SectionTitle>
        {rows.length === 0 ? (
          <Card>
            <p className="py-6 text-center text-sm text-ink-muted">
              No takings recorded for {periodLabel} yet.
            </p>
          </Card>
        ) : (
          <ul className="space-y-2.5">
            {rows.map((r) => {
              const total = incomeTotal(r);
              return (
                <Card as="li" key={r.id}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{formatDay(r.date)}</p>
                      <p className="text-xs text-ink-faint">
                        {relativeDay(r.date)}
                        {r.covers ? ` · ${r.covers} covers` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-ink">{money(total)}</span>
                      <Link
                        href={editHref(r.date)}
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
                      <span key={c.key} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-ink-faint">
                          <Dot color={c.color} />
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
