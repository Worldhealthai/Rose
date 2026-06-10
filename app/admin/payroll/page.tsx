import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { money, CURRENCY_SYMBOL } from "@/lib/money";
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
  formatDay,
  localDayISO,
} from "@/lib/dates";
import { entryHours } from "@/lib/timeclock";
import { avatarUrl } from "@/lib/avatar";
import { PageHeader, Card, StatCard, SectionTitle } from "@/components/ui";
import { Flash } from "@/components/Flash";
import { Icon } from "@/components/icons";
import { Avatar } from "@/components/Avatar";
import { FormButton } from "@/components/FormButton";
import { logWagePayment, deleteWagePayment } from "./actions";

export const dynamic = "force-dynamic";

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: { view?: string; anchor?: string; ok?: string; error?: string };
}) {
  const view = searchParams.view === "month" ? "month" : "week";
  const anchor = parseDay(searchParams.anchor);
  const today = todayFn();
  const monthStart = startOfMonth(today);

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

  const [employees, shifts, payments, timeEntries] = await Promise.all([
    prisma.employee.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
    prisma.shift.findMany({
      where: { date: { gte: start, lte: end }, employeeId: { not: null } },
    }),
    prisma.expense.findMany({
      where: {
        category: "Wages",
        employeeId: { not: null },
        date: { gte: addDays(today, -120) },
      },
      orderBy: { date: "desc" },
    }),
    prisma.timeEntry.findMany({
      where: { clockIn: { gte: addDays(start, -1), lt: addDays(end, 2) } },
    }),
  ]);

  const hoursByEmp = new Map<string, number>();
  for (const s of shifts) {
    if (!s.employeeId) continue;
    hoursByEmp.set(s.employeeId, (hoursByEmp.get(s.employeeId) ?? 0) + shiftHours(s.start, s.end));
  }

  // Actual clocked hours, attributed to the restaurant-local day they started.
  const periodDays = new Set<string>();
  for (let d = start; d <= end; d = addDays(d, 1)) periodDays.add(toISODate(d));
  const workedByEmp = new Map<string, number>();
  for (const e of timeEntries) {
    if (!periodDays.has(localDayISO(e.clockIn))) continue;
    workedByEmp.set(e.employeeId, (workedByEmp.get(e.employeeId) ?? 0) + entryHours(e));
  }
  const payByEmp = new Map<string, typeof payments>();
  for (const p of payments) {
    if (!p.employeeId) continue;
    (payByEmp.get(p.employeeId) ?? payByEmp.set(p.employeeId, []).get(p.employeeId)!).push(p);
  }

  // Pay from clocked hours when someone has clocked in this period; otherwise
  // fall back to their scheduled rota hours.
  const payHours = (id: string) => workedByEmp.get(id) ?? hoursByEmp.get(id) ?? 0;
  const estTotal = employees.reduce((s, e) => s + payHours(e.id) * e.hourlyRate, 0);
  const totalWorked = [...workedByEmp.values()].reduce((a, b) => a + b, 0);
  const totalHours = [...hoursByEmp.values()].reduce((a, b) => a + b, 0);
  const paidThisMonthTotal = payments
    .filter((p) => p.date >= monthStart)
    .reduce((a, b) => a + b.amount, 0);

  const periodHref = (a: Date) => `/admin/payroll?view=${view}&anchor=${toISODate(a)}`;

  return (
    <div className="space-y-6">
      <PageHeader title="Payroll" subtitle="Hours, estimated pay & wage payments" />
      <Flash ok={searchParams.ok} error={searchParams.error} />

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
        <StatCard
          label="Wage bill"
          value={money(estTotal)}
          sub="clocked, or rota if none"
          icon="wallet"
        />
        <StatCard
          label="Clocked hours"
          value={totalWorked.toFixed(1)}
          sub={`rota'd ${totalHours.toFixed(1)}h`}
          icon="clock"
          accent="#34d399"
        />
        <StatCard label="Paid this month" value={money(paidThisMonthTotal)} icon="cash" accent="#22d3ee" />
      </div>

      {/* Salary cards */}
      <div>
        <SectionTitle>Staff</SectionTitle>
        {employees.length === 0 ? (
          <Card>
            <p className="py-6 text-center text-sm text-ink-muted">No team members yet.</p>
          </Card>
        ) : (
          <ul className="space-y-3">
            {employees.map((e) => {
              const scheduled = hoursByEmp.get(e.id) ?? 0;
              const worked = workedByEmp.get(e.id) ?? 0;
              const hours = payHours(e.id);
              const estimate = hours * e.hourlyRate;
              const history = payByEmp.get(e.id) ?? [];
              const paidThisMonth = history
                .filter((p) => p.date >= monthStart)
                .reduce((a, b) => a + b.amount, 0);
              return (
                <Card as="li" key={e.id}>
                  <div className="flex items-center gap-3">
                    <Avatar name={e.name} src={avatarUrl(e)} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink">{e.name}</p>
                      <p className="text-xs text-ink-faint">
                        {e.position ?? "Team"} · {money(e.hourlyRate)}/hr
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-ink">{money(estimate)}</p>
                      <p className="text-[11px] text-ink-faint">
                        {worked > 0
                          ? `clocked ${worked.toFixed(1)}h`
                          : `rota ${scheduled.toFixed(1)}h`}{" "}
                        this {view}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between rounded-xl bg-canvas/40 px-3 py-2 text-sm">
                    <span className="text-ink-muted">Paid this month</span>
                    <span className="font-semibold text-forest-200">{money(paidThisMonth)}</span>
                  </div>

                  {/* Log a payment */}
                  <form action={logWagePayment} className="mt-3 flex flex-wrap items-end gap-2">
                    <input type="hidden" name="employeeId" value={e.id} />
                    <div className="w-28">
                      <label className="label">Pay ({CURRENCY_SYMBOL})</label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint">{CURRENCY_SYMBOL}</span>
                        <input name="amount" type="number" step="0.01" min="0" defaultValue={estimate > 0 ? estimate.toFixed(2) : ""} className="input pl-7 !py-2" placeholder="0.00" />
                      </div>
                    </div>
                    <input name="note" className="input !py-2 min-w-[8rem] flex-1" placeholder="Note (e.g. week ending…)" />
                    <FormButton className="btn-primary !py-2">Log payment</FormButton>
                  </form>

                  {/* History */}
                  {history.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer list-none text-xs font-medium text-forest-300">
                        Payment history ({history.length})
                      </summary>
                      <ul className="mt-2 divide-y divide-border-soft">
                        {history.map((p) => (
                          <li key={p.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                            <span className="min-w-0">
                              <span className="font-medium text-ink">{money(p.amount)}</span>
                              <span className="ml-2 text-xs text-ink-faint">
                                {formatDay(p.date)}
                                {p.note ? ` · ${p.note}` : ""}
                              </span>
                            </span>
                            <form action={deleteWagePayment}>
                              <input type="hidden" name="id" value={p.id} />
                              <button className="grid h-8 w-8 place-items-center rounded-lg text-ink-faint hover:bg-danger/10 hover:text-danger" aria-label="Delete payment">
                                <Icon name="trash" className="h-4 w-4" />
                              </button>
                            </form>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </Card>
              );
            })}
          </ul>
        )}
        <p className="mt-3 text-center text-xs text-ink-faint">
          Logged payments are added to Expenses (Wages) and count towards profit.
        </p>
      </div>
    </div>
  );
}
