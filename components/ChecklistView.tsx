import { Card, SectionTitle, EmptyState } from "./ui";
import { Icon } from "./icons";
import { ToggleCheck } from "./ToggleCheck";
import {
  toggleTaskToday,
  createTask,
  updateTask,
  deleteTask,
} from "@/app/admin/checklist/actions";

export type ChecklistItem = {
  id: string;
  title: string;
  area: string | null;
  done: boolean;
  doneByName: string | null;
};

export function ChecklistView({
  items,
  isAdmin = false,
}: {
  items: ChecklistItem[];
  isAdmin?: boolean;
}) {
  const doneCount = items.filter((i) => i.done).length;

  // Group by area
  const groups = new Map<string, ChecklistItem[]>();
  for (const it of items) {
    const key = it.area || "General";
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(it);
  }

  return (
    <div className="space-y-5">
      {items.length === 0 ? (
        <EmptyState
          icon="check"
          title="No tasks yet"
          hint={
            isAdmin
              ? "Add daily jobs below — they reset every morning."
              : "Your manager hasn't added any tasks yet."
          }
        />
      ) : (
        <>
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-ink-muted">Today&apos;s progress</span>
              <span className="text-sm font-semibold text-forest-200">
                {doneCount}/{items.length} done
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-border-soft">
              <div
                className="h-full rounded-full bg-forest-500 transition-all"
                style={{
                  width: `${items.length ? (doneCount / items.length) * 100 : 0}%`,
                }}
              />
            </div>
          </Card>

          {[...groups.entries()].map(([area, list]) => (
            <div key={area}>
              <SectionTitle>{area}</SectionTitle>
              <div className="space-y-2">
                {list.map((it) => (
                  <ToggleCheck
                    key={it.id}
                    action={toggleTaskToday}
                    fields={{ taskId: it.id }}
                    checked={it.done}
                    title={it.title}
                    subtitle={it.done && it.doneByName ? `Done by ${it.doneByName}` : undefined}
                  />
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {isAdmin && (
        <details className="card p-0">
          <summary className="flex cursor-pointer list-none items-center gap-2 p-4 font-semibold text-forest-200">
            <Icon name="settings" className="h-5 w-5" />
            Manage tasks
          </summary>
          <div className="space-y-4 border-t border-border-soft p-4">
            <form action={createTask} className="flex flex-wrap items-end gap-2">
              <div className="min-w-[10rem] flex-1">
                <label className="label">New task</label>
                <input name="title" className="input" placeholder="e.g. Clean beer keg" required />
              </div>
              <div className="w-32">
                <label className="label">Area</label>
                <input name="area" className="input" placeholder="Bar" />
              </div>
              <button className="btn-primary">Add</button>
            </form>

            <ul className="divide-y divide-border-soft">
              {items.map((it) => (
                <li key={it.id} className="py-2">
                  <details>
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm">
                      <span className="text-ink">{it.title}</span>
                      <Icon name="edit" className="h-4 w-4 text-ink-faint" />
                    </summary>
                    <div className="mt-2 flex flex-wrap items-end gap-2">
                      <form action={updateTask} className="flex flex-1 flex-wrap items-end gap-2">
                        <input type="hidden" name="id" value={it.id} />
                        <input type="hidden" name="active" value="on" />
                        <div className="min-w-[10rem] flex-1">
                          <input name="title" defaultValue={it.title} className="input !py-1.5" />
                        </div>
                        <input name="area" defaultValue={it.area ?? ""} placeholder="Area" className="input !py-1.5 w-28" />
                        <button className="btn-secondary !py-1.5">Save</button>
                      </form>
                      <form action={deleteTask}>
                        <input type="hidden" name="id" value={it.id} />
                        <button className="btn-ghost !py-1.5 text-danger hover:bg-danger/10">
                          <Icon name="trash" className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          </div>
        </details>
      )}
    </div>
  );
}
