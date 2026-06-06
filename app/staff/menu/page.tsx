import { requireStaff } from "@/lib/auth";
import { getMenuItems } from "@/lib/ops";
import { MenuView } from "@/components/MenuView";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function StaffMenuPage() {
  await requireStaff();
  const items = await getMenuItems();
  return (
    <div>
      <PageHeader
        title="Menu"
        subtitle="Tap an item to mark it off if you run out"
      />
      <MenuView items={items} />
    </div>
  );
}
