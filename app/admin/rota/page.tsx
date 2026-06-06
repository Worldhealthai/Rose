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
  WEEKDAYS,
} from "@/lib/dates";
import { PageHeader, Card, StatCard, Badge } from "@/components/ui";
import { Icon } from "@/components/icons";
import { createShift, updateShift, deleteShift } from "./actions";

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
  weekISO,
  isToday,
}: {
  day: Date;
  shifts: ShiftWithEmployee[];
  employees: EmployeeLite[];
  prefs: PrefLite[];
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
                <details className="relative">
                  <summary className="grid h-7 w-7 cursor-pointer list-none place-items-center rounded-lg text-ink-faint hover:bg-elevated hover:text-ink">
                    <Icon name="edit" className="h-3.5 w-3.5" />
                  </summary>
                  <div className="absolute right-0 z-10 mt-1 w-60 rounded-xl border border-border bg-elevated p-3 shadow-card">
                    <form action={updateShift} className="space-y-2">
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="week" value={weekISO} />
                      <EmployeeSelect
                        employees={employees}
                        defaultValue={s.employeeId}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          name="start"
                          type="time"
                          defaultValue={s.start}
                          className="input"
                        />
                        <input
                          name="end"
                          type="time"
                          defaultValue={s.end}
                          className="input"
                        />
                      </div>
                      <input
                        name="role"
                        defaultValue={s.role ?? ""}
                        placeholder="Role (optional)"
                        className="input"
                      />
                      <button className="btn-primary w-full !py-2">Save</button>
                    </form>
                    <form action={deleteShift} className="mt-2">
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="week" value={weekISO} />
                      <button className="btn-ghost w-full !py-2 text-danger hover:bg-danger/10">
                        <Icon name="trash" className="h-4 w-4" />
                        Delete shift
                      </button>
                    </form>
                  </div>
                </details>
              </div>
            </li>
          ))}
        </ul>
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
          <button className="btn-secondary w-full">Add shift</button>
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

  const [shifts, employees, avail] = await Promise.all([
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
  ]);

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

  const byDay = new Map<string, ShiftWithEmployee[]>();
  for (const s of shifts) {
    const k = toISODate(s.date);
    (byDay.get(k) ?? byDay.set(k, []).get(k)!).push(s);
  }

  const totalHours = shifts.reduce((h, s) => h + shiftHours(s.start, s.end), 0);
  const totalLabour = shifts.reduce(
    (c, s) => c + (s.employee ? shiftHours(s.start, s.end) * s.employee.hourlyRate : 0),
    0,
  );

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

      {/* Week summary */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Shifts" value={shifts.length} icon="calendar" />
        <StatCard
          label="Hours"
          value={totalHours.toFixed(1)}
          icon="clock"
          accent="#34d399"
        />
        <StatCard
          label="Est. labour"
          value={money(totalLabour)}
          icon="cash"
          accent="#22d3ee"
        />
      </div>

      {employees.length === 0 && (
        <div className="card border-warning/30 bg-warning/10 p-4 text-sm text-ink">
          Add team members first so you can assign them to shifts.{" "}
          <Link href="/admin/employees" className="font-medium text-forest-200 underline">
            Go to Team →
          </Link>
        </div>
      )}

      {/* Days */}
      <div className="grid gap-3 md:grid-cols-2">
        {days.map((day, i) => (
          <DayCard
            key={toISODate(day)}
            day={day}
            shifts={byDay.get(toISODate(day)) ?? []}
            employees={employees}
            prefs={prefsByDay.get(i) ?? []}
            weekISO={weekISO}
            isToday={toISODate(day) === toISODate(today)}
          />
        ))}
      </div>
    </div>
  );
}
