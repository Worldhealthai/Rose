import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, Badge, DetailRow, SectionTitle } from "@/components/ui";
import { Flash } from "@/components/Flash";
import { Icon } from "@/components/icons";
import { NeededToggle } from "@/components/NeededToggle";
import { QuantityInput } from "@/components/QuantityInput";
import { updateSupplier, deleteSupplier } from "../actions";
import {
  createProduct,
  deleteProduct,
  setNeededNote,
  clearSupplierNeeded,
} from "@/app/admin/orders/actions";

export const dynamic = "force-dynamic";

export default async function SupplierProfile({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { ok?: string; error?: string };
}) {
  const supplier = await prisma.supplier.findUnique({
    where: { id: params.id },
    include: {
      products: { orderBy: [{ needed: "desc" }, { name: "asc" }] },
    },
  });
  if (!supplier) notFound();

  const returnTo = `/admin/suppliers/${supplier.id}`;
  const neededCount = supplier.products.filter((p) => p.needed).length;
  const website = supplier.website
    ? supplier.website.startsWith("http")
      ? supplier.website
      : `https://${supplier.website}`
    : null;

  return (
    <div className="space-y-5">
      <Link
        href="/admin/suppliers"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <Icon name="chevronLeft" className="h-4 w-4" />
        All suppliers
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{supplier.name}</h1>
          {supplier.category && (
            <span className="mt-1.5 inline-block">
              <Badge color="#34d399">{supplier.category}</Badge>
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {supplier.phone && (
            <a href={`tel:${supplier.phone}`} className="btn-primary">
              <Icon name="phone" className="h-4 w-4" />
              Call
            </a>
          )}
          {supplier.email && (
            <a href={`mailto:${supplier.email}`} className="btn-secondary">
              <Icon name="mail" className="h-4 w-4" />
              Email
            </a>
          )}
        </div>
      </div>

      <Flash ok={searchParams.ok} error={searchParams.error} />

      {/* Contact details */}
      <Card>
        <SectionTitle>Contact details</SectionTitle>
        <div className="divide-y divide-border-soft">
          {supplier.contactName && (
            <DetailRow icon="user" label="Contact">
              {supplier.contactName}
            </DetailRow>
          )}
          {supplier.phone && (
            <DetailRow icon="phone" label="Phone">
              <a className="text-forest-300 hover:underline" href={`tel:${supplier.phone}`}>
                {supplier.phone}
              </a>
            </DetailRow>
          )}
          {supplier.email && (
            <DetailRow icon="mail" label="Email">
              <a className="text-forest-300 hover:underline" href={`mailto:${supplier.email}`}>
                {supplier.email}
              </a>
            </DetailRow>
          )}
          {website && (
            <DetailRow icon="globe" label="Website">
              <a
                className="text-forest-300 hover:underline"
                href={website}
                target="_blank"
                rel="noreferrer"
              >
                {supplier.website}
              </a>
            </DetailRow>
          )}
          {supplier.address && (
            <DetailRow icon="pin" label="Address">
              {supplier.address}
            </DetailRow>
          )}
          {supplier.notes && (
            <DetailRow icon="edit" label="Notes">
              {supplier.notes}
            </DetailRow>
          )}
          {!supplier.contactName &&
            !supplier.phone &&
            !supplier.email &&
            !website &&
            !supplier.address &&
            !supplier.notes && (
              <p className="py-3 text-sm text-ink-muted">
                No contact details yet — add them below.
              </p>
            )}
        </div>
      </Card>

      {/* Products / order list for this supplier */}
      <Card>
        <SectionTitle
          action={
            neededCount > 0 ? (
              <form action={clearSupplierNeeded}>
                <input type="hidden" name="supplierId" value={supplier.id} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <button className="text-xs font-medium text-forest-300 hover:underline">
                  Mark all ordered
                </button>
              </form>
            ) : null
          }
        >
          Products ({supplier.products.length})
        </SectionTitle>

        {supplier.products.length === 0 ? (
          <p className="py-2 text-sm text-ink-muted">
            No products yet. Add what you order from {supplier.name} below.
          </p>
        ) : (
          <ul className="divide-y divide-border-soft">
            {supplier.products.map((p) => (
              <li key={p.id} className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{p.name}</p>
                    <p className="text-xs text-ink-faint">
                      {[p.category, p.unit, p.parLevel && `par: ${p.parLevel}`]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <NeededToggle id={p.id} needed={p.needed} returnTo={returnTo} />
                    <form action={deleteProduct}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <button
                        className="grid h-8 w-8 place-items-center rounded-lg text-ink-faint hover:bg-danger/10 hover:text-danger"
                        aria-label={`Delete ${p.name}`}
                      >
                        <Icon name="trash" className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </div>
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
        )}

        {/* Add product */}
        <details className="mt-3 border-t border-border-soft pt-3">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-forest-300">
            <Icon name="plus" className="h-4 w-4" />
            Add product
          </summary>
          <form action={createProduct} className="mt-3 grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="supplierId" value={supplier.id} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <div className="sm:col-span-2">
              <label className="label">Product name</label>
              <input name="name" className="input" required placeholder="e.g. Beef mince" />
            </div>
            <div>
              <label className="label">Unit</label>
              <input name="unit" className="input" placeholder="kg, box, case…" />
            </div>
            <div>
              <label className="label">Category</label>
              <input name="category" className="input" placeholder="Optional" />
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-sm text-ink-muted">
                <input
                  type="checkbox"
                  name="needed"
                  className="h-4 w-4 accent-forest-500"
                />
                Add straight to the order list
              </label>
            </div>
            <div className="sm:col-span-2">
              <button className="btn-primary">Add product</button>
            </div>
          </form>
        </details>
      </Card>

      {/* Edit / delete supplier */}
      <details className="card p-0">
        <summary className="flex cursor-pointer list-none items-center gap-2 p-4 font-semibold text-ink-muted">
          <Icon name="settings" className="h-5 w-5" />
          Edit supplier
        </summary>
        <div className="space-y-4 border-t border-border-soft p-4">
          <form action={updateSupplier} className="space-y-3">
            <input type="hidden" name="id" value={supplier.id} />
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Name</label>
                <input name="name" defaultValue={supplier.name} className="input" required />
              </div>
              <div>
                <label className="label">Category</label>
                <input
                  name="category"
                  defaultValue={supplier.category ?? ""}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Contact name</label>
                <input
                  name="contactName"
                  defaultValue={supplier.contactName ?? ""}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Phone</label>
                <input name="phone" defaultValue={supplier.phone ?? ""} className="input" />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  name="email"
                  type="email"
                  defaultValue={supplier.email ?? ""}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Website</label>
                <input
                  name="website"
                  defaultValue={supplier.website ?? ""}
                  className="input"
                />
              </div>
            </div>
            <div>
              <label className="label">Address</label>
              <input
                name="address"
                defaultValue={supplier.address ?? ""}
                className="input"
              />
            </div>
            <div>
              <label className="label">Notes</label>
              <input name="notes" defaultValue={supplier.notes ?? ""} className="input" />
            </div>
            <button className="btn-primary">Save changes</button>
          </form>
          <form action={deleteSupplier} className="border-t border-border-soft pt-4">
            <input type="hidden" name="id" value={supplier.id} />
            <button className="btn-danger">
              <Icon name="trash" className="h-4 w-4" />
              Delete supplier
            </button>
          </form>
        </div>
      </details>
    </div>
  );
}
