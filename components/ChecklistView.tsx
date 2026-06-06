import { EmptyState } from "./ui";
import { Icon } from "./icons";
import { ChecklistClient } from "./ChecklistClient";
import type { Dict } from "@/lib/i18n";
import { createTask, updateTask, deleteTask } from "@/app/admin/checklist/actions";

export type { ChecklistItem } from "./ChecklistClient";
import type { ChecklistItem } from "./ChecklistClient";

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
        <ChecklistClient items={items} t={t} isAdmin={isAdmin} />
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
