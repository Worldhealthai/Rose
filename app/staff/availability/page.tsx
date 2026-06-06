import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import {
  WEEKDAYS,
  parseDay,
  startOfWeek,
  addDays,
  toISODate,
  formatShort,
  today as todayFn,
} from "@/lib/dates";
import { PageHeader, Card } from "@/components/ui";
import { Flash } from "@/components/Flash";
import { Icon } from "@/components/icons";
import { saveAvailability } from "./actions";

export const dynamic = "force-dynamic";

export default async function AvailabilityPage({
  searchParams,
}: {
  searchParams: { week?: string; ok?: string; error?: string };
}) {
  const me = await requireStaff();
  const weekStart = startOfWeek(parseDay(searchParams.week));
  const weekEnd = addDays(weekStart, 6);
  const rows = await prisma.availability.findMany({
    where: { employeeId: me.id, weekStart },
  });
  const byDay = new Map(rows.map((r) => [r.dayOfWeek, r]));
  const wk = (d: Date) => `/staff/availability?week=${toISODate(d)}`;

  return (
    <div>
      <PageHeader
        title="Availability"
        subtitle="Set your preferences for each week"
      />
      <Flash ok={searchParams.ok} error={searchParams.error} />

      {/* Week navigation */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <Link href={wk(addDays(weekStart, -7))} className="btn-secondary !px-3" aria-label="Previous week">
          <Icon name="chevronLeft" className="h-4 w-4" />
        </Link>
        <div className="text-center">
          <p className="font-semibold text-ink">
            Week of {formatShort(weekStart)}
          </p>
          <p className="text-xs text-ink-faint">
            {formatShort(weekStart)} – {formatShort(weekEnd)}
          </p>
        </div>
        <Link href={wk(addDays(weekStart, 7))} className="btn-secondary !px-3" aria-label="Next week">
          <Icon name="chevronRight" className="h-4 w-4" />
        </Link>
      </div>

      <form action={saveAvailability} className="space-y-3">
        <input type="hidden" name="weekStart" value={toISODate(weekStart)} />
        {WEEKDAYS.map((day, d) => {
          const r = byDay.get(d);
          const available = r ? r.available : true;
          return (
            <div key={d} className="card p-3.5">
              <label className="flex cursor-pointer items-center justify-between gap-3">
                <span className="font-semibold text-ink">{day}</span>
                <span className="flex items-center gap-2 text-sm text-ink-muted">
                  Available
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
                  <span className="mb-1 block text-xs text-ink-faint">From</span>
                  <input type="time" name={`start_${d}`} defaultValue={r?.preferredStart ?? ""} className="input !py-2" />
                </div>
                <div>
                  <span className="mb-1 block text-xs text-ink-faint">Until</span>
                  <input type="time" name={`end_${d}`} defaultValue={r?.preferredEnd ?? ""} className="input !py-2" />
                </div>
              </div>
              <input
                name={`note_${d}`}
                defaultValue={r?.note ?? ""}
                placeholder="Note (optional) — e.g. evenings only"
                className="input mt-2 !py-2 text-sm"
              />
            </div>
          );
        })}

        <div className="sticky bottom-20 z-10 md:bottom-2">
          <button className="btn-primary w-full shadow-lg">
            Save availability for this week
          </button>
        </div>
      </form>
    </div>
  );
}
