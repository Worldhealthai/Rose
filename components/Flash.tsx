import { Icon } from "./icons";

/** Renders an ok/error banner from ?ok= / ?error= search params. */
export function Flash({ ok, error }: { ok?: string; error?: string }) {
  if (!ok && !error) return null;
  const isError = Boolean(error);
  return (
    <div
      className={`mb-4 flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm ${
        isError
          ? "border-danger/30 bg-danger/10 text-danger"
          : "border-forest-500/30 bg-forest-500/10 text-forest-200"
      }`}
      role="status"
    >
      <Icon name={isError ? "alert" : "check"} className="h-4 w-4 shrink-0" />
      <span>{error ?? ok}</span>
    </div>
  );
}
