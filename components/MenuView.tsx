import { Card, SectionTitle, Badge, EmptyState } from "./ui";
import { Icon } from "./icons";
import { ToggleCheck } from "./ToggleCheck";
import { Popover } from "./Popover";
import { RefreshForm, RefreshButton, SubmitButton } from "./forms";
import { money } from "@/lib/money";
import type { Dict } from "@/lib/i18n";
import {
  toggleMenuAvailable,
  toggleMenuPlatform,
  setMenuNote,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "@/app/admin/menu/actions";

type Item = {
  id: string;
  name: string;
  category: string | null;
  price: number | null;
  available: boolean;
  unavailableNote: string | null;
  offJustEat: boolean;
  offUberEats: boolean;
  offDeliveroo: boolean;
};

const PLATFORMS = [
  { key: "justEat", label: "Just Eat", field: "offJustEat" },
  { key: "uberEats", label: "Uber Eats", field: "offUberEats" },
  { key: "deliveroo", label: "Deliveroo", field: "offDeliveroo" },
] as const;

export function MenuView({
  items,
  t,
  isAdmin = false,
}: {
  items: Item[];
  t: Dict["menu"];
  isAdmin?: boolean;
}) {
  const off = items.filter((i) => !i.available);
  const on = items.filter((i) => i.available);

  // Group available items by category
  const groups = new Map<string, Item[]>();
  for (const it of on) {
    const key = it.category || t.title;
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(it);
  }

  return (
    <div className="space-y-5">
      {/* 86'd items */}
      {off.length > 0 && (
        <div>
          <SectionTitle>
            {t.offMenu} ({off.length})
          </SectionTitle>
          <div className="space-y-3">
            {off.map((it) => (
              <div
                key={it.id}
                className="card border-warning/30 bg-warning/5 p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-ink">{it.name}</p>
                    {it.category && (
                      <p className="text-xs text-ink-faint">{it.category}</p>
                    )}
                  </div>
                  <RefreshButton
                    action={toggleMenuAvailable}
                    fields={{ id: it.id }}
                    className="btn-primary !py-2"
                    pendingLabel="…"
                  >
                    <Icon name="check" className="h-4 w-4" />
                    {t.backOn}
                  </RefreshButton>
                </div>
                <p className="mt-2 text-xs text-warning">{t.reminder}</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {PLATFORMS.map((p) => (
                    <ToggleCheck
                      key={p.key}
                      action={toggleMenuPlatform}
                      fields={{ id: it.id, platform: p.key }}
                      checked={it[p.field]}
                      title={p.label}
                      strike={false}
                    />
                  ))}
                </div>
                <RefreshForm action={setMenuNote} className="mt-2 flex gap-2">
                  <input type="hidden" name="id" value={it.id} />
                  <input
                    name="note"
                    defaultValue={it.unavailableNote ?? ""}
                    placeholder={t.whatsNeeded}
                    className="input !py-1.5 text-sm"
                  />
                  <SubmitButton className="btn-secondary !py-1.5">{t.save}</SubmitButton>
                </RefreshForm>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available menu */}
      {items.length === 0 ? (
        <EmptyState
          icon="alert"
          title={t.noItems}
          hint={isAdmin ? "Add your dishes below." : t.noItemsStaff}
        />
      ) : (
        [...groups.entries()].map(([cat, list]) => (
          <div key={cat}>
            <SectionTitle>{cat}</SectionTitle>
            <ul className="space-y-2">
              {list.map((it) => (
                <Card as="li" key={it.id} className="!p-0">
                  <div className="flex items-center justify-between gap-3 p-3.5">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{it.name}</p>
                      {isAdmin && it.price != null && (
                        <p className="text-xs text-ink-faint">{money(it.price)}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <RefreshButton
                        action={toggleMenuAvailable}
                        fields={{ id: it.id }}
                        className="btn-secondary !py-1.5 text-warning"
                        pendingLabel="…"
                      >
                        {t.markOff}
                      </RefreshButton>
                      {isAdmin && (
                        <Popover title="Edit item">
                          <form action={updateMenuItem} className="space-y-3">
                            <input type="hidden" name="id" value={it.id} />
                            <div>
                              <label className="label">Name</label>
                              <input name="name" defaultValue={it.name} className="input" />
                            </div>
                            <div>
                              <label className="label">Category</label>
                              <input name="category" defaultValue={it.category ?? ""} className="input" />
                            </div>
                            <div>
                              <label className="label">Price</label>
                              <input name="price" type="number" step="0.01" min="0" defaultValue={it.price ?? ""} className="input" />
                            </div>
                            <button className="btn-primary w-full">Save changes</button>
                          </form>
                          <form action={deleteMenuItem} className="mt-2">
                            <input type="hidden" name="id" value={it.id} />
                            <button className="btn-ghost w-full text-danger hover:bg-danger/10">
                              <Icon name="trash" className="h-4 w-4" />
                              Delete item
                            </button>
                          </form>
                        </Popover>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </ul>
          </div>
        ))
      )}

      {isAdmin && (
        <details className="card p-0">
          <summary className="flex cursor-pointer list-none items-center gap-2 p-4 font-semibold text-forest-200">
            <Icon name="plus" className="h-5 w-5" />
            Add menu item
          </summary>
          <form action={createMenuItem} className="grid gap-3 border-t border-border-soft p-4 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <label className="label">Name</label>
              <input name="name" className="input" required placeholder="e.g. Chicken Kebab" />
            </div>
            <div>
              <label className="label">Category</label>
              <input name="category" className="input" placeholder="Mains" />
            </div>
            <div>
              <label className="label">Price (optional)</label>
              <input name="price" type="number" step="0.01" min="0" className="input" placeholder="9.50" />
            </div>
            <div className="sm:col-span-3">
              <button className="btn-primary">Add item</button>
            </div>
          </form>
        </details>
      )}
    </div>
  );
}
