import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { WEEKDAYS } from "@/lib/dates";
import { PageHeader } from "@/components/ui";
import { Flash } from "@/components/Flash";
import { saveAvailability } from "./actions";

export const dynamic = "force-dynamic";

export default async function AvailabilityPage({
  searchParams,
}: {
  searchParams: { ok?: string; error?: string };
}) {
  const me = await requireStaff();
  const rows = await prisma.availability.findMany({
    where: { employeeId: me.id },
  });
  const byDay = new Map(rows.map((r) => [r.dayOfWeek, r]));

  return (
    <div>
      <PageHeader
        title="Availability"
        subtitle="Let your manager know when you can work"
      />
      <Flash ok={searchParams.ok} error={searchParams.error} />

      <form action={saveAvailability} className="space-y-3">
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
                  <input
                    type="time"
                    name={`start_${d}`}
                    defaultValue={r?.preferredStart ?? ""}
                    className="input !py-2"
                  />
                </div>
                <div>
                  <span className="mb-1 block text-xs text-ink-faint">Until</span>
                  <input
                    type="time"
                    name={`end_${d}`}
                    defaultValue={r?.preferredEnd ?? ""}
                    className="input !py-2"
                  />
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
            Save availability
          </button>
        </div>
      </form>
    </div>
  );
}
