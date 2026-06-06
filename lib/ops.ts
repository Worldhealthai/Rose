import "server-only";
import { prisma } from "./prisma";
import { today } from "./dates";
import type { ChecklistItem } from "@/components/ChecklistView";

/**
 * Today's checklist. Pass an employeeId to get that staff member's view:
 * their assigned tasks plus the ones assigned to everyone. Omit it (admin)
 * to get every active task.
 */
export async function getChecklistToday(
  employeeId?: string,
): Promise<ChecklistItem[]> {
  const d = today();
  const tasks = await prisma.task.findMany({
    where: {
      active: true,
      ...(employeeId
        ? { OR: [{ assigneeId: null }, { assigneeId: employeeId }] }
        : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      completions: { where: { date: d } },
      assignee: { select: { name: true } },
    },
  });
  return tasks.map((t) => ({
    id: t.id,
    title: t.title,
    area: t.area,
    done: t.completions.length > 0,
    doneByName: t.completions[0]?.doneByName ?? null,
    assigneeId: t.assigneeId,
    assigneeName: t.assignee?.name ?? null,
  }));
}
