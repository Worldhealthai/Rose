import { prisma } from "@/lib/prisma";
import { money, CURRENCY_SYMBOL } from "@/lib/money";
import { shiftHours } from "@/lib/calc";
import {
  today as todayFn,
  addDays,
  startOfMonth,
  toISODate,
  formatShort,
  localDayISO,
} from "@/lib/dates";
import { entryHours } from "@/lib/timeclock";
import { avatarUrl } from "@/lib/avatar";
import { PageHeader, Card, StatCard, SectionTitle, Badge } from "@/components/ui";
import { Flash } from "@/components/Flash";
import { Icon } from "@/components/icons";
import { Avatar } from "@/components/Avatar";
import { FormButton } from "@/components/FormButton";
import { Popover } from "@/components/Popover";
import { logWagePayment, updateWagePayment, deleteWagePayment } from "./actions";

export const dynamic = "force-dynamic";

type PayDefaults = {
  id?: string;
  amount: string;
  date: string;
  periodEnd: string;
  note: string;
};

/** Shared add/edit form used inside the payment popovers. */
function PaymentFields({
  action,
  employeeId,
  defaults,
  submitLabel,
  savedLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  employeeId?: string;
  defaults: PayDefaults;
  submitLabel: string;
  savedLabel: string;
}) {
  return (
    <form action={action} className="space-y-3">
      {employeeId && <input type="hidden" name="employeeId" value={employeeId} />}
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}
      <div>
        <label className="label">Amount paid ({CURRENCY_SYMBOL})</label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint">
            {CURRENCY_SYMBOL}
          </span>
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            defaultValue={defaults.amount}
            placeholder="0.00"
            className="input pl-7"
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label">Paid on</label>
          <input name="date" type="date" defaultValue={defaults.date} className="input" />
        </div>
        <div>
          <label className="label">Paid up to</label>
          <input
            name="periodEnd"
            type="date"
            defaultValue={defaults.periodEnd}
            className="input"
          />
        </div>
      </div>
      <p className="-mt-1 text-xs text-ink-faint">
        Leave &ldquo;Paid up to&rdquo; empty for a one-off amount — it just comes
        off what&apos;s owed. Set a date to mark them settled up to that day.
      </p>
      <div>
        <label className="label">Note (optional)</label>
        <input
          name="note"
          defaultValue={defaults.note}
          placeholder="e.g. bi-weekly"
          className="input"
        />
      </div>
      <FormButton className="btn-primary w-full" savedLabel={savedLabel}>
        {submitLabel}
      </FormButton>
    </form>
  );
}

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: { ok?: string; error?: string };
}) {
  const today = todayFn();
  const monthStart = startOfMonth(today);
  const windowStart = addDays(today, -91); // bound the "earned since" lookup
  const todayISO = toISODate(today);

  const [employees, payments, shifts, timeEntries] = await Promise.all([
    prisma.employee.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.expense.findMany({
      where: {
        category: "Wages",
        employeeId: { not: null },
        date: { gte: addDays(today, -365) },
      },
      orderBy: { date: "desc" },
    }),
    prisma.shift.findMany({
      where: { date: { gte: windowStart, lte: today }, employeeId: { not: null } },
      select: { employeeId: true, date: true, start: true, end: true },
    }),
    prisma.timeEntry.findMany({
      where: { clockIn: { gte: addDays(windowStart, -1), lt: addDays(today, 2) } },
    }),
  ]);

  const payByEmp = new Map<string, typeof payments>();
  for (const p of payments) {
    if (!p.employeeId) continue;
    (payByEmp.get(p.employeeId) ?? payByEmp.set(p.employeeId, []).get(p.employeeId)!).push(p);
  }
  const shiftsByEmp = new Map<string, typeof shifts>();
  for (const s of shifts) {
    if (!s.employeeId) continue;
    (shiftsByEmp.get(s.employeeId) ?? shiftsByEmp.set(s.employeeId, []).get(s.employeeId)!).push(s);
  }
  const entriesByEmp = new Map<string, typeof timeEntries>();
  for (const t of timeEntries) {
    (entriesByEmp.get(t.employeeId) ?? entriesByEmp.set(t.employeeId, []).get(t.employeeId)!).push(t);
  }

  // For each person: the latest date they're paid up to, and an estimate of
  // what they've earned since then (clocked hours if any, else rota'd hours).
  const cards = employees.map((e) => {
    const history = payByEmp.get(e.id) ?? [];
    const paidUntil = history.reduce<Date | null>(
      (max, p) => (p.periodEnd && (!max || p.periodEnd > max) ? p.periodEnd : max),
      null,
    );
    const afterPaid = paidUntil ? addDays(paidUntil, 1) : windowStart;
    const earnStart = afterPaid > windowStart ? afterPaid : windowStart;
    const earnStartISO = toISODate(earnStart);

    const clockedH = (entriesByEmp.get(e.id) ?? [])
      .filter((t) => {
        const d = localDayISO(t.clockIn);
        return d >= earnStartISO && d <= todayISO;
      })
      .reduce((h, t) => h + entryHours(t), 0);
    const rotaH = (shiftsByEmp.get(e.id) ?? [])
      .filter((s) => s.date >= earnStart && s.date <= today)
      .reduce((h, s) => h + shiftHours(s.start, s.end), 0);
    const usedClocked = clockedH > 0;
    const earnedH = usedClocked ? clockedH : rotaH;
    const earnedPay = earnedH * e.hourlyRate;

    // One-off payments (no "paid up to" date) made since the last settled date
    // come straight off the balance.
    const adHocPaid = history
      .filter((p) => !p.periodEnd && p.date >= earnStart)
      .reduce((s, p) => s + p.amount, 0);
    const owed = earnedPay - adHocPaid;

    const source = usedClocked ? "clocked" : "rota'd";
    const basis = paidUntil
      ? `${earnedH.toFixed(1)}h ${source} since ${formatShort(paidUntil)}`
      : `${earnedH.toFixed(1)}h ${source} · last 90 days`;
    const owedSub =
      adHocPaid > 0
        ? `${money(earnedPay)} earned − ${money(adHocPaid)} paid`
        : basis;

    return { e, history, paidUntil, owed, owedSub };
  });

  const outstanding = cards.reduce((s, c) => s + Math.max(0, c.owed), 0);
  const paidThisMonth = payments
    .filter((p) => p.date >= monthStart)
    .reduce((a, b) => a + b.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll"
        subtitle="Log payments — the balance owed updates as you go"
      />
      <Flash ok={searchParams.ok} error={searchParams.error} />

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Outstanding (est.)"
          value={money(outstanding)}
          sub="since each was last paid"
          icon="wallet"
        />
        <StatCard
          label="Paid this month"
          value={money(paidThisMonth)}
          icon="cash"
          accent="#22d3ee"
        />
      </div>

      <div>
        <SectionTitle>Staff</SectionTitle>
        {employees.length === 0 ? (
          <Card>
            <p className="py-6 text-center text-sm text-ink-muted">
              No team members yet.
            </p>
          </Card>
        ) : (
          <ul className="space-y-3">
            {cards.map((c) => (
              <Card as="li" key={c.e.id}>
                <div className="flex items-center gap-3">
                  <Avatar name={c.e.name} src={avatarUrl(c.e)} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">{c.e.name}</p>
                    <p className="text-xs text-ink-faint">
                      {c.e.position ?? "Team"} · {money(c.e.hourlyRate)}/hr
                    </p>
                  </div>
                  {c.paidUntil ? (
                    <Badge color="#37c97e">
                      <Icon name="check" className="h-3.5 w-3.5" />
                      Paid to {formatShort(c.paidUntil)}
                    </Badge>
                  ) : c.history.length > 0 ? (
                    <Badge color="#9fb8aa" tone="outline">
                      No date set
                    </Badge>
                  ) : (
                    <Badge color="#9fb8aa" tone="outline">
                      Not paid yet
                    </Badge>
                  )}
                </div>

                <div className="mt-3 flex items-end justify-between gap-3 rounded-xl bg-canvas/40 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
                      Owed (est.)
                    </p>
                    <p className="text-lg font-bold leading-tight text-ink">
                      {money(Math.max(0, c.owed))}
                    </p>
                  </div>
                  <p className="shrink-0 text-right text-[11px] text-ink-faint">
                    {c.owedSub}
                    {c.owed < -0.005 && (
                      <>
                        <br />
                        <span className="font-medium text-forest-300">
                          {money(-c.owed)} in credit
                        </span>
                      </>
                    )}
                  </p>
                </div>

                <Popover
                  title={`Log payment · ${c.e.name}`}
                  triggerIcon="plus"
                  triggerLabel="Log payment"
                  triggerClassName="btn-primary mt-2 w-full"
                >
                  <PaymentFields
                    action={logWagePayment}
                    employeeId={c.e.id}
                    defaults={{
                      amount: c.owed > 0.005 ? c.owed.toFixed(2) : "",
                      date: todayISO,
                      periodEnd: "",
                      note: "",
                    }}
                    submitLabel="Log payment"
                    savedLabel="Logged ✓"
                  />
                </Popover>

                {c.history.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer list-none text-xs font-medium text-forest-300">
                      Payment history ({c.history.length})
                    </summary>
                    <ul className="mt-2 divide-y divide-border-soft">
                      {c.history.map((p) => (
                        <li
                          key={p.id}
                          className="flex items-center justify-between gap-2 py-2 text-sm"
                        >
                          <span className="min-w-0">
                            <span className="font-medium text-ink">
                              {money(p.amount)}
                            </span>
                            <span className="ml-2 text-xs text-ink-faint">
                              paid {formatShort(p.date)}
                              {p.periodEnd ? ` · up to ${formatShort(p.periodEnd)}` : ""}
                              {p.note ? ` · ${p.note}` : ""}
                            </span>
                          </span>
                          <Popover
                            title="Edit payment"
                            triggerClassName="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-faint hover:bg-elevated hover:text-ink"
                          >
                            <PaymentFields
                              action={updateWagePayment}
                              defaults={{
                                id: p.id,
                                amount: p.amount.toFixed(2),
                                date: toISODate(p.date),
                                periodEnd: p.periodEnd ? toISODate(p.periodEnd) : "",
                                note: p.note ?? "",
                              }}
                              submitLabel="Save changes"
                              savedLabel="Updated ✓"
                            />
                            <form action={deleteWagePayment} className="mt-2">
                              <input type="hidden" name="id" value={p.id} />
                              <FormButton
                                className="btn-ghost w-full text-danger hover:bg-danger/10"
                                savedLabel="Deleted ✓"
                              >
                                <Icon name="trash" className="h-4 w-4" />
                                Delete payment
                              </FormButton>
                            </form>
                          </Popover>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </Card>
            ))}
          </ul>
        )}
        <p className="mt-3 text-center text-xs text-ink-faint">
          Logged payments are saved as Wages in Expenses and count towards profit.
        </p>
      </div>
    </div>
  );
}
