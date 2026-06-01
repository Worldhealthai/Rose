import Link from "next/link";
import { Icon } from "@/components/icons";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-forest-500/15 text-forest-300 ring-1 ring-forest-500/25">
        <Icon name="rose" className="h-7 w-7" />
      </span>
      <div>
        <h1 className="text-xl font-bold">Page not found</h1>
        <p className="mt-1 text-sm text-ink-muted">
          That page doesn&apos;t exist or has moved.
        </p>
      </div>
      <Link href="/" className="btn-primary">
        Back to Rose
      </Link>
    </main>
  );
}
