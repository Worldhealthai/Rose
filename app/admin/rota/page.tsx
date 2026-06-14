import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/money";
import { shiftHours } from "@/lib/calc";
import {
  today as todayFn,
  parseDay,
  startOfWeek,
  weekDays,
  addDays,
  toISODate,
  formatShort,
  formatClock,
  localDayISO,
  WEEKDAYS,
} from "@/lib/dates";
import { entryHours, fmtHours } from "@/lib/timeclock";
import { PageHeader, Card, StatCard, Badge } from "@/components/ui";
import { Icon } from "@/components/icons";
import { Popover } from "@/components/Popover";
import { FormButton } from "@/components/FormButton";
import {
  createShift,
  updateShift,
  deleteShift,
  copyLastWeek,
  addTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
} from "./actions";

export const dynamic = "force-dynamic";

type ShiftWithEmployee = Awaited<
  ReturnType<typeof prisma.shift.findMany<{ include: { employee: true } }>>
>[number];
type EmployeeLite = { id: string; name: string; position: string | null };
type PrefLite = {
  name: string;
  start: string | null;
  end: string | null;
  note: string | null;
};
type ClockedLite = {
  id: string;
  employeeId: string;
  name: string;
  in: string;
  out: string | null;
  hours: number;
};

function EmployeeSelect({
  employees,
  defaultValue,
}: {
  employees: EmployeeLite[];
  defaultValue?: string | null;
}) {
  return (
    <select name="employeeId" defaultValue={defaultValue ?? ""} className="input">
      <option value="">Open shift</option>
      {employees.map((e) => (
        <option key={e.id} value={e.id}>
          {e.name}
          {e.position ? ` · ${e.position}` : ""}
        </option>
      ))}
    </select>
  );
}

function DayCard({
  day,
  shifts,
  employees,
  prefs,
  off,
  clocked,
  weekISO,
  isToday,
}: {
  day: Date;
  shifts: ShiftWithEmployee[];
  employees: EmployeeLite[];
  prefs: PrefLite[];
  off: string[];
  clocked: ClockedLite[];
  weekISO: string;
  isToday: boolean;
}) {
  const dayISO = toISODate(day);
  const hours = shifts.reduce((h, s) => h + shiftHours(s.start, s.end), 0);

  return (
    <Card className={isToday ? "ring-1 ring-forest-500/40" : ""}>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-ink">
            {WEEKDAYS[(day.getUTCDay() + 6) % 7]}
          </h3>
          {isToday && <Badge color="#37c97e">Today</Badge>}
        </div>
        <span className="text-xs text-ink-faint">{formatShort(day)}</span>
      </div>

      {off.length > 0 && (
        <div className="mb-2 flex flex-wrap items-center gap-1.5 rounded-xl bg-danger/10 px-2.5 py-1.5">
          <Icon name="sun" className="h-3.5 w-3.5 text-danger" />
          <span className="text-[11px] font-medium text-danger">
            Off: {off.join(", ")}
          </span>
        </div>
      )}

      {shifts.length === 0 ? (
        <p className="py-2 text-sm text-ink-faint">No shifts.</p>
      ) : (
        <ul className="space-y-1.5">
          {shifts.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-2 rounded-xl bg-canvas/40 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">
                  {s.employee?.name ?? "Open shift"}
                </p>
                <p className="text-xs text-ink-faint">
                  {[s.role ?? s.employee?.position, `${shiftHours(s.start, s.end)}h`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="rounded-lg bg-forest-500/10 px-2 py-1 text-xs font-medium text-forest-200">
                  {s.start}–{s.end}
                </span>
                <Popover title="Edit shift">
                  <form action={updateShift} className="space-y-3">
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="week" value={weekISO} />
                    <div>
                      <label className="label">Who</label>
                      <EmployeeSelect employees={employees} defaultValue={s.employeeId} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="label">Start</label>
                        <input name="start" type="time" defaultValue={s.start} className="input" />
                      </div>
                      <div>
                        <label className="label">End</label>
                        <input name="end" type="time" defaultValue={s.end} className="input" />
                      </div>
                    </div>
                    <div>
                      <label className="label">Role (optional)</label>
                      <input name="role" defaultValue={s.role ?? ""} className="input" />
                    </div>
                    <FormButton className="btn-primary w-full" savedLabel="Updated ✓">
                      Save changes
                    </FormButton>
                  </form>
                  <form action={deleteShift} className="mt-2">
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="week" value={weekISO} />
                    <FormButton className="btn-ghost w-full text-danger hover:bg-danger/10">
                      <Icon name="trash" className="h-4 w-4" />
                      Delete shift
                    </FormButton>
                  </form>
                </Popover>
              </div>
            </li>
          ))}
        </ul>
      )}

      {(clocked.length > 0 || employees.length > 0) && (
        <div className="mt-2 rounded-xl bg-forest-500/[0.07] p-2.5 ring-1 ring-inset ring-forest-500/20">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-forest-300">
              Clocked (actual)
            </p>
            <Popover
              title={`Add clock entry · ${formatShort(day)}`}
              triggerIcon="plus"
              triggerClassName="grid h-6 w-6 place-items-center rounded-md text-forest-300 hover:bg-forest-500/15"
            >
              <form action={addTimeEntry} className="space-y-3">
                <input type="hidden" name="date" value={dayISO} />
                <input type="hidden" name="week" value={weekISO} />
                <div>
                  <label className="label">Who</label>
                  <select name="employeeId" className="input" required defaultValue="">
                    <option value="" disabled>
                      Choose…
                    </option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label">Clock in</label>
                    <input name="in" type="time" className="input" required />
                  </div>
                  <div>
                    <label className="label">Clock out</label>
                    <input name="out" type="time" className="input" />
                  </div>
                </div>
                <p className="text-xs text-ink-faint">
                  Leave clock out empty if they&apos;re still working. An end time
                  earlier than the start rolls to the next day.
                </p>
                <FormButton className="btn-primary w-full" savedLabel="Added ✓">
                  Add entry
                </FormButton>
              </form>
            </Popover>
          </div>
          {clocked.length === 0 ? (
            <p className="text-xs text-ink-faint">No clock-ins.</p>
          ) : (
            <ul className="space-y-0.5">
              {clocked.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-ink">{c.name}</span>
                  <span className="flex items-center gap-1.5 text-ink-muted">
                    {c.in}–{c.out ?? "now"} · {fmtHours(c.hours)}
                    <Popover
                      title={`Edit clock entry · ${c.name}`}
                      triggerClassName="grid h-6 w-6 place-items-center rounded-md text-ink-faint hover:bg-elevated hover:text-ink"
                    >
                      <form action={updateTimeEntry} className="space-y-3">
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="date" value={dayISO} />
                        <input type="hidden" name="week" value={weekISO} />
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="label">Clock in</label>
                            <input name="in" type="time" defaultValue={c.in} className="input" required />
                          </div>
                          <div>
                            <label className="label">Clock out</label>
                            <input name="out" type="time" defaultValue={c.out ?? ""} className="input" />
                          </div>
                        </div>
                        <p className="text-xs text-ink-faint">
                          Leave clock out empty to keep them checked in.
                        </p>
                        <FormButton className="btn-primary w-full" savedLabel="Updated ✓">
                          Save times
                        </FormButton>
                      </form>
                      <form action={deleteTimeEntry} className="mt-2">
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="week" value={weekISO} />
                        <FormButton className="btn-ghost w-full text-danger hover:bg-danger/10">
                          <Icon name="trash" className="h-4 w-4" />
                          Delete entry
                        </FormButton>
                      </form>
                    </Popover>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {prefs.length > 0 && (
        <div className="mt-2 rounded-xl bg-canvas/40 p-2.5">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
            Available this week
          </p>
          <ul className="space-y-0.5">
            {prefs.map((p, i) => (
              <li key={i} className="flex items-center justify-between gap-2 text-xs">
                <span className="text-ink">{p.name}</span>
                <span className="text-right text-ink-faint">
                  {p.start && p.end ? `${p.start}–${p.end}` : "any time"}
                  {p.note ? ` · ${p.note}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <details className="mt-2">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-forest-300">
          <Icon name="plus" className="h-4 w-4" />
          Add shift
        </summary>
        <form action={createShift} className="mt-2 space-y-2">
          <input type="hidden" name="date" value={dayISO} />
          <input type="hidden" name="week" value={weekISO} />
          <EmployeeSelect employees={employees} />
          <div className="grid grid-cols-2 gap-2">
            <input name="start" type="time" defaultValue="09:00" className="input" />
            <input name="end" type="time" defaultValue="17:00" className="input" />
          </div>
          <input name="role" placeholder="Role (optional)" className="input" />
          <FormButton className="btn-secondary w-full" savedLabel="Added ✓">
            Add shift
          </FormButton>
        </form>
      </details>

      {hours > 0 && (
        <p className="mt-2 text-right text-xs text-ink-faint">
          {hours.toFixed(1)}h rota&apos;d
        </p>
      )}
    </Card>
  );
}

type PersonHours = {
  id: string;
  name: string;
  position: string | null;
  hours: number; // rota'd this week
  clocked: number; // actually clocked this week
};

/** Sidebar summary: hours each person is rota'd vs actually clocked this week. */
function WeekHoursCard({
  people,
  openHours,
  totalHours,
  clockedTotal,
  showClocked,
}: {
  people: PersonHours[];
  openHours: number;
  totalHours: number;
  clockedTotal: number;
  showClocked: boolean;
}) {
  return (
    <Card>
      <div className="mb-2 flex items-center gap-2">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-forest-500/15 text-forest-300">
          <Icon name="clock" className="h-4 w-4" />
        </span>
        <h3 className="font-semibold text-ink">Hours per person</h3>
      </div>
      {people.length === 0 && openHours === 0 ? (
        <p className="py-1 text-sm text-ink-faint">No shifts rota&apos;d yet.</p>
      ) : (
        <>
          {showClocked && (
            <div className="mb-1 flex items-center justify-end gap-3 pr-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
              <span className="w-12 text-right">Rota&apos;d</span>
              <span className="w-12 text-right">Clocked</span>
            </div>
          )}
          <ul className="divide-y divide-border-soft/60">
            {people.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-2 py-1.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{p.name}</p>
                  {p.position && (
                    <p className="truncate text-[11px] text-ink-faint">
                      {p.position}
                    </p>
                  )}
                </div>
                <span className="w-12 shrink-0 text-right text-xs font-semibold text-forest-200">
                  {p.hours.toFixed(1)}h
                </span>
                {showClocked && (
                  <span
                    className={`w-12 shrink-0 text-right text-xs ${
                      p.clocked > 0 ? "text-ink-muted" : "text-ink-faint/70"
                    }`}
                  >
                    {p.clocked > 0 ? `${p.clocked.toFixed(1)}h` : "—"}
                  </span>
                )}
              </li>
            ))}
            {openHours > 0 && (
              <li className="flex items-center justify-between gap-2 py-1.5">
                <p className="min-w-0 flex-1 truncate text-sm text-ink-muted">
                  Open shifts
                </p>
                <span className="w-12 shrink-0 text-right text-xs font-medium text-ink-faint">
                  {openHours.toFixed(1)}h
                </span>
                {showClocked && <span className="w-12 shrink-0" />}
              </li>
            )}
          </ul>
          <div className="mt-2 flex items-center justify-between gap-2 border-t border-border-soft pt-2">
            <span className="flex-1 text-sm font-medium text-ink">Total</span>
            <span className="w-12 text-right text-sm font-semibold text-forest-200">
              {totalHours.toFixed(1)}h
            </span>
            {showClocked && (
              <span className="w-12 text-right text-sm font-medium text-ink-muted">
                {clockedTotal.toFixed(1)}h
              </span>
            )}
          </div>
        </>
      )}
    </Card>
  );
}

export default async function RotaPage({
  searchParams,
}: {
  searchParams: { week?: string };
}) {
  const today = todayFn();
  const anchor = searchParams.week ? parseDay(searchParams.week) : today;
  const weekStart = startOfWeek(anchor);
  const days = weekDays(anchor);
  const weekEnd = days[6];
  const weekISO = toISODate(weekStart);

  const [shifts, employees, avail, timeOff, timeEntries] = await Promise.all([
    prisma.shift.findMany({
      where: { date: { gte: weekStart, lte: weekEnd } },
      include: { employee: true },
      orderBy: { start: "asc" },
    }),
    prisma.employee.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, position: true },
    }),
    prisma.availability.findMany({
      where: { weekStart, available: true },
      include: { employee: true },
    }),
    prisma.timeOff.findMany({
      where: {
        status: "APPROVED",
        startDate: { lte: weekEnd },
        endDate: { gte: weekStart },
      },
      include: { employee: true },
    }),
    prisma.timeEntry.findMany({
      where: {
        clockIn: { gte: addDays(weekStart, -1), lt: addDays(weekEnd, 2) },
      },
      include: { employee: { select: { name: true } } },
      orderBy: { clockIn: "asc" },
    }),
  ]);

  // Actual clock-ins, grouped by the restaurant-local day they started on.
  const clockedByDay = new Map<string, ClockedLite[]>();
  for (const e of timeEntries) {
    const k = localDayISO(e.clockIn);
    const list = clockedByDay.get(k) ?? [];
    list.push({
      id: e.id,
      employeeId: e.employeeId,
      name: e.employee.name,
      in: formatClock(e.clockIn),
      out: e.clockOut ? formatClock(e.clockOut) : null,
      hours: entryHours(e),
    });
    clockedByDay.set(k, list);
  }

  // Staff preferences for this week, grouped by weekday (0 = Mon ... 6 = Sun)
  const prefsByDay = new Map<number, PrefLite[]>();
  for (const a of avail) {
    const list = prefsByDay.get(a.dayOfWeek) ?? [];
    list.push({
      name: a.employee.name,
      start: a.preferredStart,
      end: a.preferredEnd,
      note: a.note,
    });
    prefsByDay.set(a.dayOfWeek, list);
  }

  // Approved time off, per weekday index
  const offByDay = new Map<number, string[]>();
  days.forEach((day, i) => {
    const names = timeOff
      .filter((o) => o.startDate <= day && o.endDate >= day)
      .map((o) => o.employee.name);
    if (names.length) offByDay.set(i, names);
  });

  const byDay = new Map<string, ShiftWithEmployee[]>();
  for (const s of shifts) {
    const k = toISODate(s.date);
    (byDay.get(k) ?? byDay.set(k, []).get(k)!).push(s);
  }

  const totalHours = shifts.reduce((h, s) => h + shiftHours(s.start, s.end), 0);
  // Actual clocked hours falling inside this week (open entries count to now).
  const clockedHours = days.reduce(
    (h, day) =>
      h +
      (clockedByDay.get(toISODate(day)) ?? []).reduce((x, c) => x + c.hours, 0),
    0,
  );
  const totalLabour = shifts.reduce(
    (c, s) => c + (s.employee ? shiftHours(s.start, s.end) * s.employee.hourlyRate : 0),
    0,
  );
  const openShifts = shifts.filter((s) => !s.employeeId).length;

  // Hours allocated to each person this week (open shifts pooled separately).
  const rotadByPerson = new Map<string, number>();
  let openHours = 0;
  for (const s of shifts) {
    const h = shiftHours(s.start, s.end);
    if (!s.employee) {
      openHours += h;
      continue;
    }
    rotadByPerson.set(s.employee.id, (rotadByPerson.get(s.employee.id) ?? 0) + h);
  }

  // Actual clocked hours per person, over the same week (open entries → now).
  const clockedByPerson = new Map<string, number>();
  for (const day of days) {
    for (const c of clockedByDay.get(toISODate(day)) ?? []) {
      clockedByPerson.set(
        c.employeeId,
        (clockedByPerson.get(c.employeeId) ?? 0) + c.hours,
      );
    }
  }

  // Name/position lookup: shifts carry the fullest record; fall back to the
  // active-employee list, then to whatever name a clock entry recorded.
  const empMeta = new Map<string, { name: string; position: string | null }>();
  for (const e of employees) empMeta.set(e.id, { name: e.name, position: e.position });
  for (const s of shifts) {
    if (s.employee) empMeta.set(s.employee.id, { name: s.employee.name, position: s.employee.position });
  }
  const clockedNames = new Map<string, string>();
  for (const list of clockedByDay.values())
    for (const c of list) clockedNames.set(c.employeeId, c.name);

  const personHours: PersonHours[] = [
    ...new Set([...rotadByPerson.keys(), ...clockedByPerson.keys()]),
  ]
    .map((id) => ({
      id,
      name: empMeta.get(id)?.name ?? clockedNames.get(id) ?? "Unknown",
      position: empMeta.get(id)?.position ?? null,
      hours: rotadByPerson.get(id) ?? 0,
      clocked: clockedByPerson.get(id) ?? 0,
    }))
    .sort(
      (a, b) =>
        b.hours - a.hours || b.clocked - a.clocked || a.name.localeCompare(b.name),
    );
  const anyClocked = clockedHours > 0;

  return (
    <div className="space-y-5">
      <PageHeader title="Rota" subtitle="Weekly shifts & scheduling" />

      {/* Week navigation */}
      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/admin/rota?week=${toISODate(addDays(weekStart, -7))}`}
          className="btn-secondary !px-3"
          aria-label="Previous week"
        >
          <Icon name="chevronLeft" className="h-4 w-4" />
        </Link>
        <div className="text-center">
          <p className="font-semibold text-ink">
            {formatShort(weekStart)} – {formatShort(weekEnd)}
          </p>
          <Link
            href="/admin/rota"
            className="text-xs text-forest-300 hover:underline"
          >
            This week
          </Link>
        </div>
        <Link
          href={`/admin/rota?week=${toISODate(addDays(weekStart, 7))}`}
          className="btn-secondary !px-3"
          aria-label="Next week"
        >
          <Icon name="chevronRight" className="h-4 w-4" />
        </Link>
      </div>

      <div className="flex justify-center">
        <form action={copyLastWeek}>
          <input type="hidden" name="week" value={weekISO} />
          <FormButton className="btn-ghost text-sm" savedLabel="Copied ✓">
            <Icon name="calendar" className="h-4 w-4" />
            Copy last week&apos;s shifts
          </FormButton>
        </form>
      </div>

      {/* Week summary */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Shifts" value={shifts.length} icon="calendar" />
        <StatCard
          label="Hours"
          value={totalHours.toFixed(1)}
          sub={`rota'd · ${fmtHours(clockedHours)} clocked`}
          icon="clock"
          accent="#34d399"
        />
        <StatCard
          label="Est. labour"
          value={money(totalLabour)}
          sub={
            openShifts > 0
              ? `${openShifts} open shift${openShifts === 1 ? "" : "s"} uncosted`
              : "assigned shifts"
          }
          icon="cash"
          accent="#22d3ee"
        />
      </div>

      {openShifts > 0 && (
        <div className="card flex items-center gap-3 border-warning/30 bg-warning/10 p-3.5 text-sm text-ink-muted">
          <Icon name="alert" className="h-5 w-5 shrink-0 text-warning" />
          <span>
            {openShifts} shift{openShifts === 1 ? " is" : "s are"} unassigned, so
            {openShifts === 1 ? " it doesn't" : " they don't"} count towards Est.
            labour. Tap a shift&apos;s pencil to assign someone (with an hourly
            rate) and it&apos;ll cost up.
          </span>
        </div>
      )}

      {employees.length === 0 && (
        <div className="card border-warning/30 bg-warning/10 p-4 text-sm text-ink">
          Add team members first so you can assign them to shifts.{" "}
          <Link href="/admin/employees" className="font-medium text-forest-200 underline">
            Go to Team →
          </Link>
        </div>
      )}

      {/* Per-person weekly hours (side panel on desktop) + days */}
      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[240px_1fr] lg:items-start">
        <aside className="lg:sticky lg:top-6">
          <WeekHoursCard
            people={personHours}
            openHours={openHours}
            totalHours={totalHours}
            clockedTotal={clockedHours}
            showClocked={anyClocked}
          />
        </aside>
        <div className="grid gap-3 md:grid-cols-2">
          {days.map((day, i) => (
            <DayCard
              key={toISODate(day)}
              day={day}
              shifts={byDay.get(toISODate(day)) ?? []}
              employees={employees}
              prefs={prefsByDay.get(i) ?? []}
              off={offByDay.get(i) ?? []}
              clocked={clockedByDay.get(toISODate(day)) ?? []}
              weekISO={weekISO}
              isToday={toISODate(day) === toISODate(today)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
