import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import { Icon } from "@/components/icons";
import { QuantityInput } from "@/components/QuantityInput";
import { ToggleCheck } from "@/components/ToggleCheck";
import {
  createProduct,
  setNeededNote,
  toggleProductNeeded,
} from "@/app/admin/orders/actions";

export const dynamic = "force-dynamic";

export default async function StaffOrdersPage({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  await requireStaff();
  const t = getDict(getLocale()).orders;
  const onlyNeeded = searchParams.filter === "needed";
  const returnTo = `/staff/orders${onlyNeeded ? "?filter=needed" : ""}`;

  const [suppliers, products] = await Promise.all([
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({
      include: { supplier: true },
      orderBy: [{ needed: "desc" }, { name: "asc" }],
    }),
  ]);

  const neededTotal = products.filter((p) => p.needed).length;
  const visible = onlyNeeded ? products.filter((p) => p.needed) : products;

  type P = (typeof products)[number];
  const groups: { name: string; items: P[] }[] = [];
  for (const s of suppliers) {
    const items = visible.filter((p) => p.supplierId === s.id);
    if (items.length) groups.push({ name: s.name, items });
  }
  const orphan = visible.filter((p) => !p.supplierId);
  if (orphan.length) groups.push({ name: "—", items: orphan });

  return (
    <div className="space-y-5">
      <PageHeader title={t.title} subtitle={t.subtitle} />

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-warning/15 text-warning">
            <Icon name="cart" className="h-5 w-5" />
          </span>
          <span>
            <span className="font-semibold text-ink">{neededTotal}</span>{" "}
            {t.toOrder}
          </span>
        </div>
        <div className="flex rounded-xl border border-border p-0.5 text-sm">
          <Link
            href="/staff/orders"
            className={`rounded-lg px-3 py-1.5 font-medium ${!onlyNeeded ? "bg-forest-500/20 text-forest-100" : "text-ink-muted"}`}
          >
            {t.all}
          </Link>
          <Link
            href="/staff/orders?filter=needed"
            className={`rounded-lg px-3 py-1.5 font-medium ${onlyNeeded ? "bg-forest-500/20 text-forest-100" : "text-ink-muted"}`}
          >
            {t.toOrderTab}
          </Link>
        </div>
      </div>

      <details className="card p-0">
        <summary className="flex cursor-pointer list-none items-center gap-2 p-4 font-semibold text-forest-200">
          <Icon name="plus" className="h-5 w-5" />
          {t.addItem}
        </summary>
        <form action={createProduct} className="grid gap-3 border-t border-border-soft p-4 sm:grid-cols-2">
          <input type="hidden" name="returnTo" value={returnTo} />
          <input type="hidden" name="needed" value="on" />
          <div className="sm:col-span-2">
            <label className="label">{t.whatDoWeNeed}</label>
            <input name="name" className="input" required placeholder="…" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">{t.supplier}</label>
            <select name="supplierId" defaultValue="" className="input">
              <option value="">{t.notSure}</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <button className="btn-primary">{t.addToList}</button>
          </div>
        </form>
      </details>

      {groups.length === 0 ? (
        <EmptyState
          icon="cart"
          title={onlyNeeded ? t.nothingToOrder : t.noItems}
          hint={onlyNeeded ? t.nothingHint : t.noItemsHint}
        />
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <Card key={g.name}>
              <p className="mb-1 flex items-center gap-2 font-semibold text-ink">
                <Icon name="truck" className="h-4 w-4 text-forest-300" />
                {g.name}
              </p>
              <ul className="space-y-1.5">
                {g.items.map((p) => (
                  <li key={p.id}>
                    <ToggleCheck
                      action={toggleProductNeeded}
                      fields={{ id: p.id, returnTo }}
                      checked={p.needed}
                      title={p.name}
                      subtitle={p.unit ?? undefined}
                      strike={false}
                      accent="#f59e0b"
                    />
                    {p.needed && (
                      <QuantityInput
                        action={setNeededNote}
                        id={p.id}
                        returnTo={returnTo}
                        defaultValue={p.neededNote ?? ""}
                      />
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
