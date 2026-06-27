import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { shiftHours, elapsedShiftHours } from "@/lib/calc";
import {
  today as todayFn,
  weekDays,
  startOfMonth,
  endOfMonth,
  toISODate,
  relativeDay,
  formatLongDay,
  formatShort,
  formatClock,
  localDayISO,
} from "@/lib/dates";
import { entryHours, sumEntryHours, fmtHours } from "@/lib/timeclock";
import { money } from "@/lib/money";
import { Card, StatCard, SectionTitle, EmptyState, Badge } from "@/components/ui";
import { Icon } from "@/components/icons";
import { RefreshButton } from "@/components/forms";
import { FormButton } from "@/components/FormButton";
import { Popover } from "@/components/Popover";
import {
  clockIn,
  clockOut,
  updateMyTimeEntry,
  deleteMyTimeEntry,
} from "./actions";

export const dynamic = "force-dynamic";

type Shift = Awaited<ReturnType<typeof prisma.shift.findMany>>[number];

export default async function StaffHome() {
  const me = await requireStaff();
  const dict = getDict(getLocale());
  const t = dict.home;
  const tc = dict.clock;
  const today = todayFn();
  const week = weekDays(today);
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const [upcoming, weekShifts, monthShifts, weekEntries] = await Promise.all([
    prisma.shift.findMany({
      where: { employeeId: me.id, date: { gte: today } },
      orderBy: [{ date: "asc" }, { start: "asc" }],
      take: 40,
    }),
    prisma.shift.findMany({
      where: { employeeId: me.id, date: { gte: week[0], lte: week[6] } },
    }),
    prisma.shift.findMany({
      where: { employeeId: me.id, date: { gte: monthStart, lte: monthEnd } },
    }),
    prisma.timeEntry.findMany({
      where: {
        employeeId: me.id,
        OR: [{ clockOut: null }, { clockIn: { gte: week[0] } }],
      },
      orderBy: { clockIn: "asc" },
    }),
  ]);

  const hoursOf = (rows: Shift[]) =>
    rows.reduce((h, s) => h + shiftHours(s.start, s.end), 0);
  const weekHours = hoursOf(weekShifts);
  const monthHours = hoursOf(monthShifts);
  const nextShift = upcoming[0];
  const firstName = me.name.split(" ")[0];

  // Time clock state
  const now = new Date();
  const openEntry = weekEntries.find((e) => !e.clockOut) ?? null;
  const todayISO = localDayISO(now);
  const todayEntries = weekEntries.filter(
    (e) => localDayISO(e.clockIn) === todayISO,
  );
  // What to show in the editable log: today's entries, plus any still-open
  // entry from an earlier day (a forgotten check-out) so it can be fixed.
  const logEntries =
    openEntry && !todayEntries.some((e) => e.id === openEntry.id)
      ? [openEntry, ...todayEntries]
      : todayEntries;
  const workedToday = sumEntryHours(todayEntries, now);
  const workedWeek = sumEntryHours(
    weekEntries.filter((e) => e.clockIn >= week[0]),
    now,
  );
  // What those hours are worth (hidden if no hourly rate is set).
  const showPay = me.hourlyRate > 0;
  const hoursLine = (h: number) =>
    showPay ? `${fmtHours(h)} · ${money(h * me.hourlyRate)}` : fmtHours(h);

  // Earned so far this week, from the rota: past days count in full, today's
  // shifts count the part that's already happened (restaurant local time).
  const nowHHMM = formatClock(now);
  const rotaHoursSoFar = weekShifts.reduce((h, s) => {
    const dayISO = toISODate(s.date);
    if (dayISO > todayISO) return h;
    if (dayISO < todayISO) return h + shiftHours(s.start, s.end);
    return h + elapsedShiftHours(s.start, s.end, nowHHMM);
  }, 0);
  const rotaEarnedSoFar = rotaHoursSoFar * me.hourlyRate;

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
        <h1 className="text-2xl font-bold tracking-tight">
          {t.hi} {firstName} 👋
        </h1>
        <p className="mt-1 text-sm text-ink-muted">{t.schedule}</p>
      </div>

      {/* Time clock */}
      <div
        className={`card overflow-hidden p-0 ${
          openEntry ? "ring-1 ring-forest-500/50" : ""
        }`}
      >
        <div className="bg-forest-500/10 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-forest-300">
            {tc.title}
          </p>
        </div>
        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              {openEntry ? (
                <p className="flex items-center gap-2 font-semibold text-ink">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-forest-400" />
                  {tc.checkedInSince} {formatClock(openEntry.clockIn)}
                </p>
              ) : (
                <p className="font-medium text-ink-muted">{tc.notCheckedIn}</p>
              )}
            </div>
            {openEntry ? (
              <RefreshButton
                action={clockOut}
                fields={{}}
                className="btn-danger !px-5 !py-3 text-base"
                pendingLabel="…"
              >
                <Icon name="clock" className="h-5 w-5" />
                {tc.checkOut}
              </RefreshButton>
            ) : (
              <RefreshButton
                action={clockIn}
                fields={{}}
                className="btn-primary !px-5 !py-3 text-base"
                pendingLabel="…"
              >
                <Icon name="clock" className="h-5 w-5" />
                {tc.checkIn}
              </RefreshButton>
            )}
          </div>

          {/* What's been logged today, and what it's worth */}
          <div className="rounded-xl bg-canvas/40 p-3">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
              {tc.todayLog}
            </p>
            {logEntries.length === 0 ? (
              <p className="text-xs text-ink-faint">{tc.noEntries}</p>
            ) : (
              <ul className="space-y-1">
                {logEntries.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="text-ink">
                      {localDayISO(e.clockIn) !== todayISO && (
                        <span className="mr-1 text-ink-faint">
                          {formatShort(e.clockIn)}
                        </span>
                      )}
                      {formatClock(e.clockIn)}–
                      {e.clockOut ? formatClock(e.clockOut) : tc.now}
                    </span>
                    <span className="flex items-center gap-1.5 text-ink-muted">
                      {hoursLine(entryHours(e, now))}
                      <Popover
                        title={tc.editEntry}
                        triggerClassName="grid h-7 w-7 shrink-0 place-items-center rounded-md text-ink-faint hover:bg-elevated hover:text-ink"
                      >
                        <form action={updateMyTimeEntry} className="space-y-3">
                          <input type="hidden" name="id" value={e.id} />
                          <input
                            type="hidden"
                            name="date"
                            value={localDayISO(e.clockIn)}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="label">{tc.checkIn}</label>
                              <input
                                name="in"
                                type="time"
                                defaultValue={formatClock(e.clockIn)}
                                className="input"
                                required
                              />
                            </div>
                            <div>
                              <label className="label">{tc.checkOut}</label>
                              <input
                                name="out"
                                type="time"
                                defaultValue={
                                  e.clockOut ? formatClock(e.clockOut) : ""
                                }
                                className="input"
                              />
                            </div>
                          </div>
                          <p className="text-xs text-ink-faint">{tc.editHint}</p>
                          <FormButton
                            className="btn-primary w-full"
                            savedLabel={tc.saved}
                          >
                            {tc.save}
                          </FormButton>
                        </form>
                        <form action={deleteMyTimeEntry} className="mt-2">
                          <input type="hidden" name="id" value={e.id} />
                          <FormButton
                            className="btn-ghost w-full text-danger hover:bg-danger/10"
                            savedLabel={tc.deleted}
                          >
                            <Icon name="trash" className="h-4 w-4" />
                            {tc.delete}
                          </FormButton>
                        </form>
                      </Popover>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-2 space-y-1 border-t border-border-soft pt-2">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="font-medium text-ink">{tc.workedToday}</span>
                <span className="font-semibold text-forest-200">
                  {hoursLine(workedToday)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 text-xs text-ink-muted">
                <span>{tc.workedWeek}</span>
                <span>{hoursLine(workedWeek)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {nextShift && (
        <div className="card overflow-hidden p-0">
          <div className="bg-forest-500/10 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-forest-300">
              {t.nextShift}
            </p>
          </div>
          <div className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="text-lg font-bold text-ink">
                {relativeDay(nextShift.date)}
              </p>
              <p className="text-sm text-ink-muted">
                {nextShift.role ?? me.position ?? t.shift} ·{" "}
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

      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label={t.thisWeek}
          value={`${weekHours.toFixed(1)}h`}
          sub={showPay ? `${money(rotaEarnedSoFar)} ${t.earnedSoFar}` : undefined}
          icon="clock"
        />
        <StatCard
          label={t.thisMonth}
          value={`${monthHours.toFixed(1)}h`}
          icon="calendar"
          accent="#34d399"
        />
        <StatCard
          label={t.upcoming}
          value={upcoming.length}
          sub={t.shiftsLabel}
          icon="trend"
          accent="#22d3ee"
        />
      </div>

      <Link
        href="/staff/availability"
        className="card flex items-center gap-3 p-4 transition hover:bg-elevated/40"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-forest-500/15 text-forest-300">
          <Icon name="star" className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="font-semibold text-ink">{t.setAvailability}</p>
          <p className="text-sm text-ink-muted">{t.setAvailabilityHint}</p>
        </div>
        <Icon name="chevronRight" className="h-5 w-5 text-ink-faint" />
      </Link>

      <div>
        <SectionTitle>{t.upcomingShifts}</SectionTitle>
        {groups.length === 0 ? (
          <EmptyState
            icon="calendar"
            title={t.noUpcoming}
            hint={t.noUpcomingHint}
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
                    <Card
                      as="li"
                      key={s.id}
                      className="flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="font-medium text-ink">
                          {s.start}–{s.end}
                        </p>
                        <p className="text-xs text-ink-muted">
                          {s.role ?? me.position ?? t.shift} ·{" "}
                          {shiftHours(s.start, s.end)}h
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
