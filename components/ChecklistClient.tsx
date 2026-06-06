"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Card, SectionTitle } from "./ui";
import { Icon } from "./icons";
import { toggleTaskToday } from "@/app/admin/checklist/actions";
import type { Dict } from "@/lib/i18n";

export type ChecklistItem = {
  id: string;
  title: string;
  area: string | null;
  done: boolean;
  doneByName: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
};

/**
 * The interactive checklist: progress bar + tick rows share one piece of state,
 * so ticking a box updates BOTH instantly (the save happens in the background).
 */
export function ChecklistClient({
  items,
  t,
  isAdmin,
}: {
  items: ChecklistItem[];
  t: Dict["checklist"];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const mounted = useRef(true);
  const [done, setDone] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(items.map((i) => [i.id, i.done])),
  );

  useEffect(() => () => {
    mounted.current = false;
  }, []);
  // Re-sync when the server data updates (after a refresh / external change).
  useEffect(() => {
    setDone(Object.fromEntries(items.map((i) => [i.id, i.done])));
  }, [items]);

  const total = items.length;
  const doneCount = items.filter((i) => done[i.id]).length;

  function toggle(id: string) {
    setDone((d) => ({ ...d, [id]: !d[id] })); // instant: updates rows + progress
    const fd = new FormData();
    fd.set("taskId", id);
    startTransition(async () => {
      try {
        await toggleTaskToday(fd);
        if (mounted.current) router.refresh();
      } catch {
        // Navigated away or transient error — already saved server-side.
      }
    });
  }

  const groups = new Map<string, ChecklistItem[]>();
  for (const it of items) {
    const key = it.area || t.general;
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(it);
  }

  function subtitleFor(it: ChecklistItem): string | undefined {
    if (done[it.id] && it.doneByName) return `${t.doneBy} ${it.doneByName}`;
    if (it.assigneeId) return isAdmin ? `For ${it.assigneeName}` : t.forYou;
    return undefined;
  }

  return (
    <div className="space-y-5">
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-ink-muted">{t.progress}</span>
          <span className="text-sm font-semibold text-forest-200">
            {doneCount}/{total} {t.done}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-border-soft">
          <div
            className="h-full rounded-full bg-forest-500 transition-all duration-300"
            style={{ width: `${total ? (doneCount / total) * 100 : 0}%` }}
          />
        </div>
      </Card>

      {[...groups.entries()].map(([area, list]) => (
        <div key={area}>
          <SectionTitle>{area}</SectionTitle>
          <div className="space-y-2">
            {list.map((it) => {
              const checked = !!done[it.id];
              const subtitle = subtitleFor(it);
              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => toggle(it.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition active:scale-[0.99] ${
                    checked
                      ? "border-forest-500/40 bg-forest-500/10"
                      : "border-border-soft bg-canvas/40 hover:border-forest-500/40"
                  }`}
                >
                  <span
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border ${
                      checked ? "border-transparent bg-forest-500" : "border-border"
                    }`}
                  >
                    {checked && <Icon name="check" className="h-4 w-4 text-canvas" />}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={`block text-sm font-medium ${
                        checked ? "text-ink-muted line-through" : "text-ink"
                      }`}
                    >
                      {it.title}
                    </span>
                    {subtitle && (
                      <span className="block text-xs text-ink-faint">{subtitle}</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
