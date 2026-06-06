import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/money";
import { shiftHours } from "@/lib/calc";
import {
  today as todayFn,
  parseDay,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addMonths,
  toISODate,
  formatMonth,
  formatShort,
} from "@/lib/dates";
import { PageHeader, Card, StatCard, SectionTitle } from "@/components/ui";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: { view?: string; anchor?: string };
}) {
  const view = searchParams.view === "month" ? "month" : "week";
  const anchor = parseDay(searchParams.anchor);

  let start: Date, end: Date, prev: Date, next: Date, label: string;
  if (view === "month") {
    start = startOfMonth(anchor);
    end = endOfMonth(anchor);
    prev = addMonths(start, -1);
    next = addMonths(start, 1);
    label = formatMonth(start);
  } else {
    start = startOfWeek(anchor);
    end = addDays(start, 6);
    prev = addDays(start, -7);
    next = addDays(start, 7);
    label = `${formatShort(start)} – ${formatShort(end)}`;
  }

  const shifts = await prisma.shift.findMany({
    where: { date: { gte: start, lte: end }, employeeId: { not: null } },
    include: { employee: true },
  });

  type Row = { id: string; name: string; position: string | null; rate: number; hours: number };
  const map = new Map<string, Row>();
  for (const s of shifts) {
    if (!s.employee) continue;
    const r =
      map.get(s.employee.id) ??
      ({
        id: s.employee.id,
        name: s.employee.name,
        position: s.employee.position,
        rate: s.employee.hourlyRate,
        hours: 0,
      } satisfies Row);
    r.hours += shiftHours(s.start, s.end);
    map.set(s.employee.id, r);
  }
  const rows = [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  const totalHours = rows.reduce((h, r) => h + r.hours, 0);
  const totalPay = rows.reduce((p, r) => p + r.hours * r.rate, 0);

  const periodHref = (a: Date) => `/admin/payroll?view=${view}&anchor=${toISODate(a)}`;

  return (
    <div className="space-y-6">
      <PageHeader title="Payroll" subtitle="Staff hours & estimated pay" />

      {/* View toggle */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-xl border border-border p-0.5 text-sm">
          {(["week", "month"] as const).map((v) => (
            <Link
              key={v}
              href={`/admin/payroll?view=${v}`}
              className={`rounded-lg px-4 py-1.5 font-medium capitalize transition ${
                view === v ? "bg-forest-500/20 text-forest-100" : "text-ink-muted"
              }`}
            >
              {v}
            </Link>
          ))}
        </div>
      </div>

      {/* Period nav */}
      <div className="flex items-center justify-between gap-2">
        <Link href={periodHref(prev)} className="btn-secondary !px-3" aria-label="Previous">
          <Icon name="chevronLeft" className="h-4 w-4" />
        </Link>
        <div className="text-center">
          <p className="font-semibold text-ink">{label}</p>
          <Link href={`/admin/payroll?view=${view}`} className="text-xs text-forest-300 hover:underline">
            {view === "week" ? "This week" : "This month"}
          </Link>
        </div>
        <Link href={periodHref(next)} className="btn-secondary !px-3" aria-label="Next">
          <Icon name="chevronRight" className="h-4 w-4" />
        </Link>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Wage bill" value={money(totalPay)} icon="wallet" />
        <StatCard label="Total hours" value={totalHours.toFixed(1)} icon="clock" accent="#34d399" />
        <StatCard label="Staff" value={rows.length} icon="users" accent="#22d3ee" />
      </div>

      {/* Per-employee */}
      <div>
        <SectionTitle>By employee</SectionTitle>
        {rows.length === 0 ? (
          <Card>
            <p className="py-6 text-center text-sm text-ink-muted">
              No shifts scheduled for {label}.
            </p>
          </Card>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => (
              <Card as="li" key={r.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{r.name}</p>
                  <p className="text-xs text-ink-faint">
                    {r.position ?? "Team"} · {r.hours.toFixed(1)}h × {money(r.rate)}
                  </p>
                </div>
                <span className="text-lg font-bold text-ink">{money(r.hours * r.rate)}</span>
              </Card>
            ))}
          </ul>
        )}
        <p className="mt-3 text-center text-xs text-ink-faint">
          Estimated from scheduled shifts × hourly rate.
        </p>
      </div>
    </div>
  );
}
