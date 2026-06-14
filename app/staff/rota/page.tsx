import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { shiftHours } from "@/lib/calc";
import {
  today as todayFn,
  parseDay,
  startOfWeek,
  weekDays,
  addDays,
  toISODate,
  formatShort,
  weekdayIndex,
} from "@/lib/dates";
import { PageHeader, Card, Badge } from "@/components/ui";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

// Read-only team rota for staff: who's working each day. There are no edit
// controls here, and the shift-mutating server actions all require an admin,
// so this view can only ever look.
export default async function StaffRotaPage({
  searchParams,
}: {
  searchParams: { week?: string };
}) {
  const me = await requireStaff();
  const t = getDict(getLocale());
  const tr = t.rota;
  const today = todayFn();
  const anchor = searchParams.week ? parseDay(searchParams.week) : today;
  const weekStart = startOfWeek(anchor);
  const days = weekDays(anchor);
  const weekEnd = days[6];

  // Assigned, published shifts only — no open slots, no draft rotas, no rates.
  const shifts = await prisma.shift.findMany({
    where: {
      date: { gte: weekStart, lte: weekEnd },
      employeeId: { not: null },
      published: true,
    },
    include: { employee: { select: { id: true, name: true, position: true } } },
    orderBy: { start: "asc" },
  });

  const byDay = new Map<string, typeof shifts>();
  for (const s of shifts) {
    const k = toISODate(s.date);
    (byDay.get(k) ?? byDay.set(k, []).get(k)!).push(s);
  }

  return (
    <div className="space-y-5">
      <PageHeader title={tr.title} subtitle={tr.subtitle} />

      {/* Week navigation */}
      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/staff/rota?week=${toISODate(addDays(weekStart, -7))}`}
          className="btn-secondary !px-3"
          aria-label={tr.prevWeek}
        >
          <Icon name="chevronLeft" className="h-4 w-4" />
        </Link>
        <div className="text-center">
          <p className="font-semibold text-ink">
            {formatShort(weekStart)} – {formatShort(weekEnd)}
          </p>
          <Link
            href="/staff/rota"
            className="text-xs text-forest-300 hover:underline"
          >
            {tr.thisWeek}
          </Link>
        </div>
        <Link
          href={`/staff/rota?week=${toISODate(addDays(weekStart, 7))}`}
          className="btn-secondary !px-3"
          aria-label={tr.nextWeek}
        >
          <Icon name="chevronRight" className="h-4 w-4" />
        </Link>
      </div>

      {/* Days */}
      <div className="grid gap-3 md:grid-cols-2">
        {days.map((day) => {
          const dayShifts = byDay.get(toISODate(day)) ?? [];
          const isToday = toISODate(day) === toISODate(today);
          return (
            <Card
              key={toISODate(day)}
              className={isToday ? "ring-1 ring-forest-500/40" : ""}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-ink">
                    {t.weekdays[weekdayIndex(day)]}
                  </h3>
                  {isToday && <Badge color="#37c97e">{tr.today}</Badge>}
                </div>
                <span className="text-xs text-ink-faint">{formatShort(day)}</span>
              </div>

              {dayShifts.length === 0 ? (
                <p className="py-2 text-sm text-ink-faint">{tr.noOne}</p>
              ) : (
                <ul className="space-y-1.5">
                  {dayShifts.map((s) => {
                    const mine = s.employee?.id === me.id;
                    const sub = [
                      s.role ?? s.employee?.position,
                      `${shiftHours(s.start, s.end)}h`,
                    ]
                      .filter(Boolean)
                      .join(" · ");
                    return (
                      <li
                        key={s.id}
                        className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 ${
                          mine
                            ? "bg-forest-500/15 ring-1 ring-inset ring-forest-500/30"
                            : "bg-canvas/40"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 truncate text-sm font-medium text-ink">
                            {s.employee?.name}
                            {mine && <Badge color="#37c97e">{tr.you}</Badge>}
                          </p>
                          {sub && <p className="text-xs text-ink-faint">{sub}</p>}
                        </div>
                        <span className="shrink-0 rounded-lg bg-forest-500/10 px-2 py-1 text-xs font-medium text-forest-200">
                          {s.start}–{s.end}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}

              {dayShifts.length > 0 && (
                <p className="mt-2 text-right text-xs text-ink-faint">
                  {dayShifts.length} {tr.onShift}
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
