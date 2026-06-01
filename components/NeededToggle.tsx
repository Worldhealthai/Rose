import { toggleProductNeeded } from "@/app/admin/orders/actions";
import { Icon } from "./icons";

/** A submit button that flips a product's "needed" flag in place. */
export function NeededToggle({
  id,
  needed,
  returnTo,
}: {
  id: string;
  needed: boolean;
  returnTo: string;
}) {
  return (
    <form action={toggleProductNeeded}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <button
        type="submit"
        aria-pressed={needed}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
          needed
            ? "bg-warning/20 text-warning ring-1 ring-inset ring-warning/40"
            : "border border-border text-ink-muted hover:border-forest-500/50 hover:text-ink"
        }`}
      >
        {needed ? (
          <>
            <Icon name="check" className="h-3.5 w-3.5" />
            To order
          </>
        ) : (
          <>
            <Icon name="plus" className="h-3.5 w-3.5" />
            Add
          </>
        )}
      </button>
    </form>
  );
}
