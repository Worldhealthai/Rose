import "server-only";
import { prisma } from "./prisma";
import { today } from "./dates";
import type { ChecklistItem } from "@/components/ChecklistView";

export async function getChecklistToday(): Promise<ChecklistItem[]> {
  const d = today();
  const tasks = await prisma.task.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { completions: { where: { date: d } } },
  });
  return tasks.map((t) => ({
    id: t.id,
    title: t.title,
    area: t.area,
    done: t.completions.length > 0,
    doneByName: t.completions[0]?.doneByName ?? null,
  }));
}

export function getMenuItems() {
  return prisma.menuItem.findMany({
    orderBy: [
      { available: "asc" }, // unavailable first
      { category: "asc" },
      { sortOrder: "asc" },
      { name: "asc" },
    ],
  });
}
