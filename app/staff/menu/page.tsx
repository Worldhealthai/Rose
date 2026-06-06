import { requireStaff } from "@/lib/auth";
import { getMenuItems } from "@/lib/ops";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { MenuView } from "@/components/MenuView";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function StaffMenuPage() {
  await requireStaff();
  const t = getDict(getLocale());
  const items = await getMenuItems();
  return (
    <div>
      <PageHeader title={t.menu.title} subtitle={t.menu.subtitle} />
      <MenuView items={items} t={t.menu} />
    </div>
  );
}
