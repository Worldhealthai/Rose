import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { getChecklistToday } from "@/lib/ops";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { today as todayFn, toISODate } from "@/lib/dates";
import { ChecklistView } from "@/components/ChecklistView";
import { PageHeader, Card, SectionTitle } from "@/components/ui";
import { addTempLog } from "@/app/admin/temps/actions";

export const dynamic = "force-dynamic";

const UNITS = ["Walk-in fridge", "Under-counter fridge", "Display fridge", "Freezer", "Hot hold"];

export default async function StaffChecklistPage() {
  const me = await requireStaff();
  const t = getDict(getLocale());
  const today = todayFn();
  const [items, temps] = await Promise.all([
    getChecklistToday(me.id),
    prisma.tempLog.findMany({ where: { date: today }, orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title={t.checklist.title} subtitle={t.checklist.subtitle} />
      <ChecklistView items={items} t={t.checklist} />

      {/* Temperature log */}
      <div>
        <SectionTitle>{t.temps.title}</SectionTitle>
        <Card className="mb-3">
          <form action={addTempLog} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="date" value={toISODate(today)} />
            <input type="hidden" name="returnTo" value="/staff/checklist" />
            <div className="min-w-[9rem] flex-1">
              <label className="label">{t.temps.unit}</label>
              <input name="unit" list="temp-units" className="input" placeholder={t.temps.unitPlaceholder} required />
              <datalist id="temp-units">
                {UNITS.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </div>
            <div className="w-24">
              <label className="label">{t.temps.reading}</label>
              <input name="temp" type="number" step="0.1" className="input" placeholder="4.0" required />
            </div>
            <button className="btn-primary">{t.temps.add}</button>
          </form>
        </Card>

        {temps.length === 0 ? (
          <p className="text-sm text-ink-faint">{t.temps.none}</p>
        ) : (
          <ul className="space-y-2">
            {temps.map((r) => (
              <Card as="li" key={r.id} className="flex items-center justify-between gap-3">
                <span className="font-medium text-ink">{r.unit}</span>
                <span className="font-semibold text-forest-200">{r.temp}°C</span>
              </Card>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
