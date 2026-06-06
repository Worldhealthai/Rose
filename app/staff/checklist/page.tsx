import { requireStaff } from "@/lib/auth";
import { getChecklistToday } from "@/lib/ops";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { ChecklistView } from "@/components/ChecklistView";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function StaffChecklistPage() {
  const me = await requireStaff();
  const t = getDict(getLocale());
  const items = await getChecklistToday(me.id);
  return (
    <div>
      <PageHeader title={t.checklist.title} subtitle={t.checklist.subtitle} />
      <ChecklistView items={items} t={t.checklist} />
    </div>
  );
}
