import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";
import { Icon } from "@/components/icons";
import { NeededToggle } from "@/components/NeededToggle";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  setNeededNote,
  clearSupplierNeeded,
} from "./actions";

export const dynamic = "force-dynamic";

type ProductWithSupplier = Awaited<
  ReturnType<
    typeof prisma.product.findMany<{ include: { supplier: true } }>
  >
>[number];

type SupplierLite = { id: string; name: string };

function SupplierSelect({
  suppliers,
  defaultValue,
}: {
  suppliers: SupplierLite[];
  defaultValue?: string | null;
}) {
  return (
    <select name="supplierId" defaultValue={defaultValue ?? ""} className="input">
      <option value="">Unassigned</option>
      {suppliers.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  );
}

function ProductRow({
  p,
  suppliers,
  returnTo,
}: {
  p: ProductWithSupplier;
  suppliers: SupplierLite[];
  returnTo: string;
}) {
  return (
    <li className="py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{p.name}</p>
          <p className="text-xs text-ink-faint">
            {[p.category, p.unit, p.parLevel && `par: ${p.parLevel}`]
              .filter(Boolean)
              .join(" · ") || "—"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <NeededToggle id={p.id} needed={p.needed} returnTo={returnTo} />
          <details className="relative">
            <summary className="grid h-8 w-8 cursor-pointer list-none place-items-center rounded-lg text-ink-faint hover:bg-elevated hover:text-ink">
              <Icon name="edit" className="h-4 w-4" />
            </summary>
            <div className="absolute right-0 z-10 mt-1 w-64 rounded-xl border border-border bg-elevated p-3 shadow-card">
              <form action={updateProduct} className="space-y-2">
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <input name="name" defaultValue={p.name} className="input" placeholder="Name" />
                <SupplierSelect suppliers={suppliers} defaultValue={p.supplierId} />
                <div className="grid grid-cols-2 gap-2">
                  <input name="unit" defaultValue={p.unit ?? ""} className="input" placeholder="Unit" />
                  <input
                    name="category"
                    defaultValue={p.category ?? ""}
                    className="input"
                    placeholder="Category"
                  />
                </div>
                <input
                  name="parLevel"
                  defaultValue={p.parLevel ?? ""}
                  className="input"
                  placeholder="Par level (optional)"
                />
                <button className="btn-primary w-full !py-2">Save</button>
              </form>
              <form action={deleteProduct} className="mt-2">
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <button className="btn-ghost w-full !py-2 text-danger hover:bg-danger/10">
                  <Icon name="trash" className="h-4 w-4" />
                  Delete product
                </button>
              </form>
            </div>
          </details>
        </div>
      </div>
      {p.needed && (
        <form action={setNeededNote} className="mt-2 flex gap-2">
          <input type="hidden" name="id" value={p.id} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <input
            name="neededNote"
            defaultValue={p.neededNote ?? ""}
            placeholder="How much to order? e.g. 2 cases"
            className="input !py-1.5 text-sm"
          />
          <button className="btn-secondary !py-1.5">Save</button>
        </form>
      )}
    </li>
  );
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  const onlyNeeded = searchParams.filter === "needed";
  const returnTo = `/admin/orders${onlyNeeded ? "?filter=needed" : ""}`;

  const [suppliers, products] = await Promise.all([
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({
      include: { supplier: true },
      orderBy: [{ needed: "desc" }, { name: "asc" }],
    }),
  ]);

  const neededTotal = products.filter((p) => p.needed).length;
  const visible = onlyNeeded ? products.filter((p) => p.needed) : products;

  // Group by supplier (suppliers in name order, then Unassigned).
  const groups: { supplier: SupplierLite | null; items: ProductWithSupplier[] }[] =
    [];
  for (const s of suppliers) {
    const items = visible.filter((p) => p.supplierId === s.id);
    if (items.length) groups.push({ supplier: s, items });
  }
  const orphan = visible.filter((p) => !p.supplierId);
  if (orphan.length) groups.push({ supplier: null, items: orphan });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Order list"
        subtitle="Flag what you need, grouped by supplier"
        action={
          <Link href="/admin/suppliers" className="btn-secondary">
            <Icon name="truck" className="h-4 w-4" />
            Suppliers
          </Link>
        }
      />

      {/* Summary + filter toggle */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-warning/15 text-warning">
            <Icon name="cart" className="h-5 w-5" />
          </span>
          <span>
            <span className="font-semibold text-ink">{neededTotal}</span> item
            {neededTotal === 1 ? "" : "s"} to order
          </span>
        </div>
        <div className="flex rounded-xl border border-border p-0.5 text-sm">
          <Link
            href="/admin/orders"
            className={`rounded-lg px-3 py-1.5 font-medium ${
              !onlyNeeded ? "bg-forest-500/20 text-forest-100" : "text-ink-muted"
            }`}
          >
            All
          </Link>
          <Link
            href="/admin/orders?filter=needed"
            className={`rounded-lg px-3 py-1.5 font-medium ${
              onlyNeeded ? "bg-forest-500/20 text-forest-100" : "text-ink-muted"
            }`}
          >
            To order
          </Link>
        </div>
      </div>

      {/* Add product */}
      <details className="card p-0">
        <summary className="flex cursor-pointer list-none items-center gap-2 p-4 font-semibold text-forest-200">
          <Icon name="plus" className="h-5 w-5" />
          Add product
        </summary>
        <form
          action={createProduct}
          className="grid gap-3 border-t border-border-soft p-4 sm:grid-cols-2"
        >
          <input type="hidden" name="returnTo" value={returnTo} />
          <div className="sm:col-span-2">
            <label className="label">Product name</label>
            <input name="name" className="input" required placeholder="e.g. Tomatoes" />
          </div>
          <div>
            <label className="label">Supplier</label>
            <SupplierSelect suppliers={suppliers} />
          </div>
          <div>
            <label className="label">Unit</label>
            <input name="unit" className="input" placeholder="kg, box, case…" />
          </div>
          <div>
            <label className="label">Category</label>
            <input name="category" className="input" placeholder="Optional" />
          </div>
          <div>
            <label className="label">Par level</label>
            <input name="parLevel" className="input" placeholder="Optional" />
          </div>
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 text-sm text-ink-muted">
              <input type="checkbox" name="needed" className="h-4 w-4 accent-forest-500" />
              Add straight to the order list
            </label>
          </div>
          <div className="sm:col-span-2">
            <button className="btn-primary">Add product</button>
          </div>
        </form>
      </details>

      {/* Grouped list */}
      {groups.length === 0 ? (
        <EmptyState
          icon="cart"
          title={onlyNeeded ? "Nothing to order" : "No products yet"}
          hint={
            onlyNeeded
              ? "You're all stocked up. Flag products as you run low."
              : "Add the products you buy and link each to a supplier."
          }
        />
      ) : (
        <div className="space-y-4">
          {groups.map((g) => {
            const neededHere = g.items.filter((p) => p.needed).length;
            return (
              <Card key={g.supplier?.id ?? "unassigned"}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  {g.supplier ? (
                    <Link
                      href={`/admin/suppliers/${g.supplier.id}`}
                      className="group flex items-center gap-2 font-semibold text-ink hover:text-forest-200"
                    >
                      <Icon name="truck" className="h-4 w-4 text-forest-300" />
                      {g.supplier.name}
                      <span className="text-xs font-normal text-ink-faint group-hover:text-forest-300">
                        view contact →
                      </span>
                    </Link>
                  ) : (
                    <span className="flex items-center gap-2 font-semibold text-ink-muted">
                      <Icon name="alert" className="h-4 w-4" />
                      Unassigned
                    </span>
                  )}
                  {neededHere > 0 && g.supplier && (
                    <form action={clearSupplierNeeded}>
                      <input type="hidden" name="supplierId" value={g.supplier.id} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <button className="text-xs font-medium text-forest-300 hover:underline">
                        Mark all ordered
                      </button>
                    </form>
                  )}
                </div>
                <ul className="divide-y divide-border-soft">
                  {g.items.map((p) => (
                    <ProductRow
                      key={p.id}
                      p={p}
                      suppliers={suppliers}
                      returnTo={returnTo}
                    />
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
