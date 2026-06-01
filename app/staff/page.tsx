import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { money } from "@/lib/money";
import { shiftHours } from "@/lib/calc";
import {
  today as todayFn,
  weekDays,
  startOfMonth,
  endOfMonth,
  toISODate,
  relativeDay,
  formatLongDay,
  formatMonth,
} from "@/lib/dates";
import { Card, StatCard, SectionTitle, EmptyState, Badge } from "@/components/ui";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

type Shift = Awaited<ReturnType<typeof prisma.shift.findMany>>[number];

export default async function StaffHome() {
  const me = await requireStaff();
  const today = todayFn();
  const week = weekDays(today);
  const weekStart = week[0];
  const weekEnd = week[6];
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const [upcoming, weekShifts, monthShifts] = await Promise.all([
    prisma.shift.findMany({
      where: { employeeId: me.id, date: { gte: today } },
      orderBy: [{ date: "asc" }, { start: "asc" }],
      take: 40,
    }),
    prisma.shift.findMany({
      where: { employeeId: me.id, date: { gte: weekStart, lte: weekEnd } },
    }),
    prisma.shift.findMany({
      where: { employeeId: me.id, date: { gte: monthStart, lte: monthEnd } },
    }),
  ]);

  const hoursOf = (rows: Shift[]) =>
    rows.reduce((h, s) => h + shiftHours(s.start, s.end), 0);
  const weekHours = hoursOf(weekShifts);
  const monthHours = hoursOf(monthShifts);
  const nextShift = upcoming[0];
  const firstName = me.name.split(" ")[0];

  // Group upcoming by day
  const groups: { iso: string; date: Date; shifts: Shift[] }[] = [];
  for (const s of upcoming) {
    const iso = toISODate(s.date);
    const g = groups.find((x) => x.iso === iso);
    if (g) g.shifts.push(s);
    else groups.push({ iso, date: s.date, shifts: [s] });
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hi {firstName} 👋</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Here&apos;s your schedule for {formatMonth(today)}.
        </p>
      </div>

      {/* Next shift */}
      {nextShift && (
        <div className="card overflow-hidden p-0">
          <div className="bg-forest-500/10 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-forest-300">
              Next shift
            </p>
          </div>
          <div className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="text-lg font-bold text-ink">
                {relativeDay(nextShift.date)}
              </p>
              <p className="text-sm text-ink-muted">
                {nextShift.role ?? me.position ?? "Shift"} ·{" "}
                {shiftHours(nextShift.start, nextShift.end)}h
              </p>
            </div>
            <Badge color="#37c97e" tone="solid">
              <Icon name="clock" className="h-3.5 w-3.5" />
              {nextShift.start}–{nextShift.end}
            </Badge>
          </div>
        </div>
      )}

      {/* This week */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="This week" value={`${weekHours.toFixed(1)}h`} icon="clock" />
        <StatCard
          label="Est. pay"
          value={money(weekHours * me.hourlyRate)}
          icon="cash"
          accent="#34d399"
        />
        <StatCard
          label="This month"
          value={`${monthHours.toFixed(1)}h`}
          icon="calendar"
          accent="#22d3ee"
        />
      </div>

      {me.hourlyRate > 0 && (
        <p className="-mt-2 text-center text-xs text-ink-faint">
          Estimated pay is based on your {money(me.hourlyRate)}/hr rate.
        </p>
      )}

      {/* Upcoming list */}
      <div>
        <SectionTitle>Upcoming shifts</SectionTitle>
        {groups.length === 0 ? (
          <EmptyState
            icon="calendar"
            title="No upcoming shifts"
            hint="When your manager schedules you, your shifts will show up here."
          />
        ) : (
          <div className="space-y-4">
            {groups.map((g) => (
              <div key={g.iso}>
                <p className="mb-1.5 text-sm font-semibold text-ink">
                  {relativeDay(g.date)}
                  <span className="ml-2 font-normal text-ink-faint">
                    {formatLongDay(g.date)}
                  </span>
                </p>
                <ul className="space-y-2">
                  {g.shifts.map((s) => (
                    <Card as="li" key={s.id} className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-ink">
                          {s.start}–{s.end}
                        </p>
                        <p className="text-xs text-ink-muted">
                          {s.role ?? me.position ?? "Shift"} ·{" "}
                          {shiftHours(s.start, s.end)}h
                          {me.hourlyRate > 0 &&
                            ` · ${money(shiftHours(s.start, s.end) * me.hourlyRate)}`}
                        </p>
                      </div>
                      <Icon name="clock" className="h-5 w-5 text-forest-300" />
                    </Card>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
