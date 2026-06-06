import { requireStaff } from "@/lib/auth";
import { getChecklistToday } from "@/lib/ops";
import { ChecklistView } from "@/components/ChecklistView";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function StaffChecklistPage() {
  await requireStaff();
  const items = await getChecklistToday();
  return (
    <div>
      <PageHeader title="Checklist" subtitle="Today's jobs — tap to tick off" />
      <ChecklistView items={items} />
    </div>
  );
}
