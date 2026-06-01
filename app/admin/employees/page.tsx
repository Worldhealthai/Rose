import { prisma } from "@/lib/prisma";
import { money, CURRENCY_SYMBOL } from "@/lib/money";
import { PageHeader, Card, Badge } from "@/components/ui";
import { Flash } from "@/components/Flash";
import { Icon } from "@/components/icons";
import { Avatar } from "@/components/Avatar";
import { AvatarUpload } from "@/components/AvatarUpload";
import {
  createEmployee,
  updateEmployee,
  setEmployeePassword,
  deleteEmployee,
} from "./actions";

export const dynamic = "force-dynamic";

type Employee = Awaited<ReturnType<typeof prisma.employee.findMany>>[number];

function EmployeeCard({ e }: { e: Employee }) {
  return (
    <Card as="li" className="!p-0 overflow-hidden">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
          <Avatar name={e.name} src={e.avatar} size={44} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate font-semibold text-ink">{e.name}</p>
              {e.role === "ADMIN" && (
                <Badge color="#22d3ee" tone="soft">
                  Admin
                </Badge>
              )}
              {!e.active && (
                <Badge color="#9fb8aa" tone="outline">
                  Inactive
                </Badge>
              )}
            </div>
            <p className="truncate text-xs text-ink-muted">
              @{e.username} · {e.position ?? "Team member"} ·{" "}
              {money(e.hourlyRate)}/hr
            </p>
          </div>
          <Icon
            name="chevronRight"
            className="h-5 w-5 shrink-0 text-ink-faint transition group-open:rotate-90"
          />
        </summary>

        <div className="space-y-4 border-t border-border-soft p-4">
          {/* Edit details */}
          <form action={updateEmployee} className="space-y-3">
            <input type="hidden" name="id" value={e.id} />
            <AvatarUpload displayName={e.name} current={e.avatar} />
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Name</label>
                <input name="name" defaultValue={e.name} className="input" required />
              </div>
              <div>
                <label className="label">Username (login)</label>
                <input
                  name="username"
                  defaultValue={e.username}
                  className="input"
                  autoCapitalize="none"
                  required
                />
              </div>
              <div>
                <label className="label">Email (optional)</label>
                <input
                  name="email"
                  type="email"
                  defaultValue={e.email ?? ""}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Position</label>
                <input
                  name="position"
                  defaultValue={e.position ?? ""}
                  className="input"
                  placeholder="Chef, Waiter…"
                />
              </div>
              <div>
                <label className="label">Hourly rate ({CURRENCY_SYMBOL})</label>
                <input
                  name="hourlyRate"
                  type="number"
                  step="0.25"
                  min="0"
                  defaultValue={e.hourlyRate}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Phone</label>
                <input
                  name="phone"
                  defaultValue={e.phone ?? ""}
                  className="input"
                  placeholder="07…"
                />
              </div>
              <div>
                <label className="label">Role</label>
                <select name="role" defaultValue={e.role} className="input">
                  <option value="STAFF">Staff</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-ink-muted">
              <input
                type="checkbox"
                name="active"
                defaultChecked={e.active}
                className="h-4 w-4 accent-forest-500"
              />
              Active (can sign in &amp; be rota&apos;d)
            </label>
            <button className="btn-primary">Save changes</button>
          </form>

          <div className="flex flex-wrap items-end gap-3 border-t border-border-soft pt-4">
            <form action={setEmployeePassword} className="flex items-end gap-2">
              <input type="hidden" name="id" value={e.id} />
              <div>
                <label className="label">Reset password</label>
                <input
                  name="password"
                  type="text"
                  className="input"
                  placeholder="New password"
                  minLength={6}
                />
              </div>
              <button className="btn-secondary">Set</button>
            </form>
            <form action={deleteEmployee} className="ml-auto">
              <input type="hidden" name="id" value={e.id} />
              <button className="btn-danger">
                <Icon name="trash" className="h-4 w-4" />
                Remove
              </button>
            </form>
          </div>
        </div>
      </details>
    </Card>
  );
}

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: { ok?: string; error?: string };
}) {
  const employees = await prisma.employee.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });
  const active = employees.filter((e) => e.active);
  const inactive = employees.filter((e) => !e.active);

  return (
    <div>
      <PageHeader
        title="Team"
        subtitle="Employees, pay rates & portal access"
      />
      <Flash ok={searchParams.ok} error={searchParams.error} />

      {/* Add */}
      <details className="card mb-5 p-0">
        <summary className="flex cursor-pointer list-none items-center gap-2 p-4 font-semibold text-forest-200">
          <Icon name="plus" className="h-5 w-5" />
          Add team member
        </summary>
        <form
          action={createEmployee}
          className="space-y-3 border-t border-border-soft p-4"
        >
          <AvatarUpload displayName="New team member" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Name</label>
              <input name="name" className="input" required placeholder="Full name" />
            </div>
            <div>
              <label className="label">Username (login)</label>
              <input
                name="username"
                className="input"
                required
                autoCapitalize="none"
                placeholder="e.g. maria"
              />
            </div>
            <div>
              <label className="label">Email (optional)</label>
              <input
                name="email"
                type="email"
                className="input"
                placeholder="name@rose.local"
              />
            </div>
            <div>
              <label className="label">Position</label>
              <input name="position" className="input" placeholder="Chef, Waiter…" />
            </div>
            <div>
              <label className="label">Hourly rate ({CURRENCY_SYMBOL})</label>
              <input
                name="hourlyRate"
                type="number"
                step="0.25"
                min="0"
                className="input"
                placeholder="11.50"
              />
            </div>
            <div>
              <label className="label">Phone</label>
              <input name="phone" className="input" placeholder="07…" />
            </div>
            <div>
              <label className="label">Role</label>
              <select name="role" defaultValue="STAFF" className="input">
                <option value="STAFF">Staff</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Temporary password</label>
            <input
              name="password"
              type="text"
              className="input sm:max-w-xs"
              required
              minLength={6}
              placeholder="At least 6 characters"
            />
          </div>
          <button className="btn-primary">Add team member</button>
        </form>
      </details>

      <ul className="space-y-3">
        {active.map((e) => (
          <EmployeeCard key={e.id} e={e} />
        ))}
      </ul>

      {inactive.length > 0 && (
        <>
          <h2 className="mb-3 mt-7 text-sm font-semibold uppercase tracking-wide text-ink-faint">
            Inactive
          </h2>
          <ul className="space-y-3">
            {inactive.map((e) => (
              <EmployeeCard key={e.id} e={e} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
