"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <p className="text-lg font-semibold text-ink">Something went wrong</p>
      <p className="text-sm text-ink-muted">Please try again.</p>
      <button onClick={() => reset()} className="btn-primary">
        Try again
      </button>
    </div>
  );
}
