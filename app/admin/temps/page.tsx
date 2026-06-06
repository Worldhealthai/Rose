import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  today as todayFn,
  parseDay,
  addDays,
  toISODate,
  formatDay,
} from "@/lib/dates";
import { PageHeader, Card, SectionTitle } from "@/components/ui";
import { Icon } from "@/components/icons";
import { addTempLog, deleteTempLog } from "./actions";

export const dynamic = "force-dynamic";

const UNITS = [
  "Walk-in fridge",
  "Under-counter fridge",
  "Display fridge",
  "Freezer",
  "Hot hold",
];

export default async function TempsPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const today = todayFn();
  const date = parseDay(searchParams.date);
  const dateISO = toISODate(date);
  const isToday = dateISO === toISODate(today);
  const returnTo = `/admin/temps?date=${dateISO}`;

  const readings = await prisma.tempLog.findMany({
    where: { date },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Temperature log" subtitle="Daily food-safety records" />

      {/* Add */}
      <Card>
        <SectionTitle>Log a reading</SectionTitle>
        <form action={addTempLog} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="date" value={dateISO} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <div className="min-w-[10rem] flex-1">
            <label className="label">Unit</label>
            <input name="unit" list="temp-units" className="input" placeholder="e.g. Walk-in fridge" required />
            <datalist id="temp-units">
              {UNITS.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </div>
          <div className="w-28">
            <label className="label">Temp (°C)</label>
            <input name="temp" type="number" step="0.1" className="input" placeholder="4.0" required />
          </div>
          <button className="btn-primary">Log</button>
        </form>
      </Card>

      {/* Date nav */}
      <div className="flex items-center justify-between gap-2">
        <Link href={`/admin/temps?date=${toISODate(addDays(date, -1))}`} className="btn-secondary !px-3" aria-label="Previous day">
          <Icon name="chevronLeft" className="h-4 w-4" />
        </Link>
        <div className="text-center">
          <p className="font-semibold text-ink">{formatDay(date)}</p>
          {!isToday && (
            <Link href="/admin/temps" className="text-xs text-forest-300 hover:underline">Today</Link>
          )}
        </div>
        <Link href={`/admin/temps?date=${toISODate(addDays(date, 1))}`} className="btn-secondary !px-3" aria-label="Next day">
          <Icon name="chevronRight" className="h-4 w-4" />
        </Link>
      </div>

      {/* Readings */}
      <div>
        <SectionTitle>{formatDay(date)}</SectionTitle>
        {readings.length === 0 ? (
          <Card>
            <p className="py-6 text-center text-sm text-ink-muted">No readings logged for this day.</p>
          </Card>
        ) : (
          <ul className="space-y-2">
            {readings.map((r) => (
              <Card as="li" key={r.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">
                    {r.unit}
                    <span className="ml-2 text-forest-200">{r.temp}°C</span>
                  </p>
                  {r.byName && <p className="text-xs text-ink-faint">by {r.byName}</p>}
                </div>
                <form action={deleteTempLog}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <button className="grid h-9 w-9 place-items-center rounded-lg text-ink-faint hover:bg-danger/10 hover:text-danger" aria-label="Delete">
                    <Icon name="trash" className="h-4 w-4" />
                  </button>
                </form>
              </Card>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
