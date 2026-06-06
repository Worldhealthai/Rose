import { getMenuItems } from "@/lib/ops";
import { getDict } from "@/lib/i18n";
import { MenuView } from "@/components/MenuView";
import { PageHeader } from "@/components/ui";
import { Flash } from "@/components/Flash";

export const dynamic = "force-dynamic";

export default async function AdminMenuPage({
  searchParams,
}: {
  searchParams: { ok?: string; error?: string };
}) {
  const items = await getMenuItems();
  return (
    <div>
      <PageHeader title="Menu" subtitle="Dishes & availability" />
      <Flash ok={searchParams.ok} error={searchParams.error} />
      <MenuView items={items} t={getDict("en").menu} isAdmin />
    </div>
  );
}
