import { prisma } from "@/lib/prisma";
import { getChecklistToday } from "@/lib/ops";
import { ChecklistView } from "@/components/ChecklistView";
import { PageHeader } from "@/components/ui";
import { Flash } from "@/components/Flash";

export const dynamic = "force-dynamic";

export default async function AdminChecklistPage({
  searchParams,
}: {
  searchParams: { ok?: string; error?: string };
}) {
  const [items, employees] = await Promise.all([
    getChecklistToday(),
    prisma.employee.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  return (
    <div>
      <PageHeader title="Daily checklist" subtitle="Jobs to be done — resets each day" />
      <Flash ok={searchParams.ok} error={searchParams.error} />
      <ChecklistView items={items} isAdmin employees={employees} />
    </div>
  );
}
