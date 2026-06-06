import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import { Icon, type IconName } from "@/components/icons";
import { markAllRead, clearNotifications } from "./actions";

export const dynamic = "force-dynamic";

function timeAgo(d: Date): string {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

const TYPE_ICON: Record<string, IconName> = {
  availability: "star",
  timeoff: "sun",
  order: "cart",
};

export default async function NotificationsPage() {
  const items = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 60,
  });
  const unread = items.filter((i) => !i.read).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notifications"
        subtitle="Staff activity"
        action={
          unread > 0 ? (
            <form action={markAllRead}>
              <button className="btn-secondary">
                <Icon name="check" className="h-4 w-4" />
                Mark all read
              </button>
            </form>
          ) : undefined
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon="bell"
          title="No notifications"
          hint="You'll be alerted here when staff update availability, request time off, or flag items to order."
        />
      ) : (
        <>
          <ul className="space-y-2">
            {items.map((n) => {
              const inner = (
                <div
                  className={`card flex items-start gap-3 p-3.5 transition ${
                    !n.read
                      ? "border-forest-500/40 bg-forest-500/[0.06]"
                      : ""
                  } ${n.link ? "hover:bg-elevated/40" : ""}`}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-forest-500/10 text-forest-300">
                    <Icon name={TYPE_ICON[n.type] ?? "bell"} className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink">{n.message}</p>
                    <p className="mt-0.5 text-xs text-ink-faint">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.read && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-forest-400" />
                  )}
                </div>
              );
              return (
                <li key={n.id}>
                  {n.link ? <Link href={n.link}>{inner}</Link> : inner}
                </li>
              );
            })}
          </ul>
          <form action={clearNotifications}>
            <button className="btn-ghost text-sm text-ink-faint">Clear all</button>
          </form>
        </>
      )}
    </div>
  );
}
