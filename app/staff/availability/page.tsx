import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import {
  parseDay,
  startOfWeek,
  addDays,
  toISODate,
  formatShort,
  formatDay,
  isSameDay,
  today as todayFn,
} from "@/lib/dates";
import { PageHeader, Card, SectionTitle, Badge } from "@/components/ui";
import { Flash } from "@/components/Flash";
import { Icon } from "@/components/icons";
import { saveAvailability, requestTimeOff, cancelTimeOff } from "./actions";

export const dynamic = "force-dynamic";

export default async function AvailabilityPage({
  searchParams,
}: {
  searchParams: { week?: string; ok?: string; error?: string };
}) {
  const me = await requireStaff();
  const dict = getDict(getLocale());
  const t = dict.availability;
  const tt = dict.timeoff;
  const weekStart = startOfWeek(parseDay(searchParams.week));
  const weekEnd = addDays(weekStart, 6);
  const today = todayFn();
  const [rows, timeOff] = await Promise.all([
    prisma.availability.findMany({ where: { employeeId: me.id, weekStart } }),
    prisma.timeOff.findMany({
      where: { employeeId: me.id },
      orderBy: { startDate: "desc" },
      take: 12,
    }),
  ]);
  const byDay = new Map(rows.map((r) => [r.dayOfWeek, r]));
  const wk = (d: Date) => `/staff/availability?week=${toISODate(d)}`;
  const statusLabel = (s: string) =>
    s === "APPROVED" ? tt.approved : s === "DECLINED" ? tt.declined : tt.pending;
  const statusColor = (s: string) =>
    s === "APPROVED" ? "#37c97e" : s === "DECLINED" ? "#f0635a" : "#f59e0b";

  return (
    <div>
      <PageHeader title={t.title} subtitle={t.subtitle} />
      <Flash ok={searchParams.ok} error={searchParams.error} />

      <div className="mb-4 flex items-center justify-between gap-2">
        <Link href={wk(addDays(weekStart, -7))} className="btn-secondary !px-3" aria-label="←">
          <Icon name="chevronLeft" className="h-4 w-4" />
        </Link>
        <div className="text-center">
          <p className="font-semibold text-ink">
            {t.weekOf} {formatShort(weekStart)}
          </p>
          <p className="text-xs text-ink-faint">
            {formatShort(weekStart)} – {formatShort(weekEnd)}
          </p>
        </div>
        <Link href={wk(addDays(weekStart, 7))} className="btn-secondary !px-3" aria-label="→">
          <Icon name="chevronRight" className="h-4 w-4" />
        </Link>
      </div>

      <form action={saveAvailability} className="space-y-3">
        <input type="hidden" name="weekStart" value={toISODate(weekStart)} />
        {dict.weekdays.map((day, d) => {
          const r = byDay.get(d);
          const available = r ? r.available : true;
          return (
            <div key={d} className="card p-3.5">
              <label className="flex cursor-pointer items-center justify-between gap-3">
                <span className="font-semibold text-ink">{day}</span>
                <span className="flex items-center gap-2 text-sm text-ink-muted">
                  {t.available}
                  <input
                    type="checkbox"
                    name={`available_${d}`}
                    defaultChecked={available}
                    className="h-5 w-5 accent-forest-500"
                  />
                </span>
              </label>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <span className="mb-1 block text-xs text-ink-faint">{t.from}</span>
                  <input type="time" name={`start_${d}`} defaultValue={r?.preferredStart ?? ""} className="input !py-2" />
                </div>
                <div>
                  <span className="mb-1 block text-xs text-ink-faint">{t.until}</span>
                  <input type="time" name={`end_${d}`} defaultValue={r?.preferredEnd ?? ""} className="input !py-2" />
                </div>
              </div>
              <input
                name={`note_${d}`}
                defaultValue={r?.note ?? ""}
                placeholder={t.note}
                className="input mt-2 !py-2 text-sm"
              />
            </div>
          );
        })}

        <div className="sticky bottom-20 z-10 md:bottom-2">
          <button className="btn-primary w-full shadow-lg">{t.save}</button>
        </div>
      </form>

      {/* Time off */}
      <div className="mt-8">
        <SectionTitle>{tt.title}</SectionTitle>
        <Card className="mb-3">
          <form action={requestTimeOff} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="mb-1 block text-xs text-ink-faint">{tt.from}</span>
                <input type="date" name="startDate" defaultValue={toISODate(today)} className="input !py-2" required />
              </div>
              <div>
                <span className="mb-1 block text-xs text-ink-faint">{tt.until}</span>
                <input type="date" name="endDate" defaultValue={toISODate(today)} className="input !py-2" required />
              </div>
            </div>
            <input name="note" placeholder={tt.reason} className="input !py-2 text-sm" />
            <button className="btn-secondary w-full">{tt.request}</button>
          </form>
        </Card>

        {timeOff.length === 0 ? (
          <p className="text-sm text-ink-faint">{tt.none}</p>
        ) : (
          <ul className="space-y-2">
            {timeOff.map((r) => (
              <Card as="li" key={r.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">
                    {isSameDay(r.startDate, r.endDate)
                      ? formatDay(r.startDate)
                      : `${formatDay(r.startDate)} → ${formatDay(r.endDate)}`}
                  </p>
                  {r.note && <p className="text-xs text-ink-faint">{r.note}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge color={statusColor(r.status)}>{statusLabel(r.status)}</Badge>
                  <form action={cancelTimeOff}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="grid h-8 w-8 place-items-center rounded-lg text-ink-faint hover:bg-danger/10 hover:text-danger" aria-label={tt.cancel}>
                      <Icon name="trash" className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </Card>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
