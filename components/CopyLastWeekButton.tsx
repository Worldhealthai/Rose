"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./icons";
import { toast, toastUndo } from "./Toast";
import { copyLastWeek, undoCreatedShifts } from "@/app/admin/rota/actions";

/**
 * Copies last week's shifts into the current week and offers an Undo in the
 * confirmation toast — so an accidental tap is one click to reverse.
 */
export function CopyLastWeekButton({ week }: { week: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      aria-busy={pending}
      className="btn-ghost text-sm"
      onClick={() =>
        startTransition(async () => {
          try {
            const res = await copyLastWeek(week);
            router.refresh();
            if (res.created > 0) {
              toastUndo(
                `Copied ${res.created} shift${res.created === 1 ? "" : "s"} from last week`,
                async () => {
                  await undoCreatedShifts(res.ids);
                  router.refresh();
                  toast("Copy undone");
                },
              );
            } else {
              toast("Last week had no shifts to copy");
            }
          } catch {
            toast("Couldn't copy — please try again");
          }
        })
      }
    >
      {pending ? (
        <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent opacity-70" />
      ) : (
        <Icon name="calendar" className="h-4 w-4" />
      )}
      Copy last week&apos;s shifts
    </button>
  );
}
