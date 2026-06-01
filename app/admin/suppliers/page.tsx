import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";
import { Flash } from "@/components/Flash";
import { Icon } from "@/components/icons";
import { createSupplier } from "./actions";

export const dynamic = "force-dynamic";

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: { ok?: string; error?: string };
}) {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
    include: { products: { select: { needed: true } } },
  });

  return (
    <div>
      <PageHeader title="Suppliers" subtitle="Contacts & where you order from" />
      <Flash ok={searchParams.ok} error={searchParams.error} />

      <details className="card mb-5 p-0">
        <summary className="flex cursor-pointer list-none items-center gap-2 p-4 font-semibold text-forest-200">
          <Icon name="plus" className="h-5 w-5" />
          Add supplier
        </summary>
        <form
          action={createSupplier}
          className="space-y-3 border-t border-border-soft p-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Supplier name</label>
              <input name="name" className="input" required placeholder="e.g. Prime Meats" />
            </div>
            <div>
              <label className="label">Category</label>
              <input name="category" className="input" placeholder="Meat, Veg, Drinks…" />
            </div>
            <div>
              <label className="label">Contact name</label>
              <input name="contactName" className="input" placeholder="Who you speak to" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input name="phone" className="input" placeholder="07… / 020…" />
            </div>
            <div>
              <label className="label">Email</label>
              <input name="email" type="email" className="input" placeholder="orders@…" />
            </div>
            <div>
              <label className="label">Website</label>
              <input name="website" className="input" placeholder="https://…" />
            </div>
          </div>
          <div>
            <label className="label">Address</label>
            <input name="address" className="input" placeholder="Optional" />
          </div>
          <div>
            <label className="label">Notes</label>
            <input
              name="notes"
              className="input"
              placeholder="Order days, account no., minimum order…"
            />
          </div>
          <button className="btn-primary">Add supplier</button>
        </form>
      </details>

      {suppliers.length === 0 ? (
        <EmptyState
          icon="truck"
          title="No suppliers yet"
          hint="Add your suppliers so their contact details are one tap away when it's time to order."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {suppliers.map((s) => {
            const needed = s.products.filter((p) => p.needed).length;
            return (
              <Card as="li" key={s.id} className="!p-0">
                <Link
                  href={`/admin/suppliers/${s.id}`}
                  className="block p-4 transition hover:bg-elevated/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{s.name}</p>
                      {s.category && (
                        <span className="mt-1 inline-block">
                          <Badge color="#34d399">{s.category}</Badge>
                        </span>
                      )}
                    </div>
                    <Icon
                      name="chevronRight"
                      className="mt-1 h-5 w-5 shrink-0 text-ink-faint"
                    />
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-ink-muted">
                    {s.contactName && (
                      <p className="flex items-center gap-2">
                        <Icon name="user" className="h-4 w-4 text-ink-faint" />
                        {s.contactName}
                      </p>
                    )}
                    {s.phone && (
                      <p className="flex items-center gap-2">
                        <Icon name="phone" className="h-4 w-4 text-ink-faint" />
                        {s.phone}
                      </p>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge color="#9fb8aa" tone="outline">
                      {s.products.length} product
                      {s.products.length === 1 ? "" : "s"}
                    </Badge>
                    {needed > 0 && (
                      <Badge color="#f59e0b">{needed} to order</Badge>
                    )}
                  </div>
                </Link>
              </Card>
            );
          })}
        </ul>
      )}
    </div>
  );
}
