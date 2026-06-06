import { Card, SectionTitle, EmptyState } from "./ui";
import { Icon } from "./icons";
import { ToggleCheck } from "./ToggleCheck";
import type { Dict } from "@/lib/i18n";
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
  assigneeId: string | null;
  assigneeName: string | null;
};

type EmployeeLite = { id: string; name: string };

function AssigneeSelect({
  employees,
  defaultValue,
}: {
  employees: EmployeeLite[];
  defaultValue?: string | null;
}) {
  return (
    <select name="assigneeId" defaultValue={defaultValue ?? ""} className="input">
      <option value="">Everyone</option>
      {employees.map((e) => (
        <option key={e.id} value={e.id}>
          {e.name}
        </option>
      ))}
    </select>
  );
}

export function ChecklistView({
  items,
  t,
  isAdmin = false,
  employees = [],
}: {
  items: ChecklistItem[];
  t: Dict["checklist"];
  isAdmin?: boolean;
  employees?: EmployeeLite[];
}) {
  const doneCount = items.filter((i) => i.done).length;

  const groups = new Map<string, ChecklistItem[]>();
  for (const it of items) {
    const key = it.area || t.general;
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(it);
  }

  function subtitleFor(it: ChecklistItem): string | undefined {
    if (it.done && it.doneByName) return `${t.doneBy} ${it.doneByName}`;
    if (it.assigneeId) return isAdmin ? `For ${it.assigneeName}` : t.forYou;
    return undefined;
  }

  return (
    <div className="space-y-5">
      {items.length === 0 ? (
        <EmptyState
          icon="check"
          title={t.noTasks}
          hint={
            isAdmin
              ? "Add daily jobs below — they reset every morning."
              : t.noTasksStaff
          }
        />
      ) : (
        <>
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-ink-muted">{t.progress}</span>
              <span className="text-sm font-semibold text-forest-200">
                {doneCount}/{items.length} {t.done}
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
                    subtitle={subtitleFor(it)}
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
            Manage &amp; assign tasks
          </summary>
          <div className="space-y-4 border-t border-border-soft p-4">
            <form action={createTask} className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="label">New task</label>
                  <input name="title" className="input" placeholder="e.g. Clean beer keg" required />
                </div>
                <div>
                  <label className="label">Area</label>
                  <input name="area" className="input" placeholder="Bar, Kitchen…" />
                </div>
                <div>
                  <label className="label">Assign to</label>
                  <AssigneeSelect employees={employees} />
                </div>
              </div>
              <button className="btn-primary">Add task</button>
            </form>

            <ul className="divide-y divide-border-soft">
              {items.map((it) => (
                <li key={it.id} className="py-2">
                  <details>
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm">
                      <span className="text-ink">
                        {it.title}
                        <span className="ml-2 text-xs text-ink-faint">
                          · {it.assigneeName ?? "Everyone"}
                        </span>
                      </span>
                      <Icon name="edit" className="h-4 w-4 shrink-0 text-ink-faint" />
                    </summary>
                    <div className="mt-2 flex flex-wrap items-end gap-2">
                      <form action={updateTask} className="flex flex-1 flex-wrap items-end gap-2">
                        <input type="hidden" name="id" value={it.id} />
                        <input type="hidden" name="active" value="on" />
                        <input name="title" defaultValue={it.title} className="input !py-1.5 min-w-[8rem] flex-1" />
                        <input name="area" defaultValue={it.area ?? ""} placeholder="Area" className="input !py-1.5 w-24" />
                        <div className="w-32">
                          <AssigneeSelect employees={employees} defaultValue={it.assigneeId} />
                        </div>
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
