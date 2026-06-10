import { requireAdmin } from "@/lib/auth";
import { getUnreadNotifications } from "@/lib/notify";
import { getUnreadChatCount } from "@/lib/chat";
import { avatarUrl } from "@/lib/avatar";
import { PortalShell, type NavItem } from "@/components/PortalShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();
  const [unread, unreadChat] = await Promise.all([
    getUnreadNotifications(),
    getUnreadChatCount(user.id, user.chatLastReadAt),
  ]);

  const NAV: NavItem[] = [
    { href: "/admin", label: "Dashboard", icon: "dashboard", exact: true },
    { href: "/admin/notifications", label: "Notifications", icon: "bell", badge: unread },
    { href: "/admin/chat", label: "Chat", icon: "message", badge: unreadChat },
    { href: "/admin/rota", label: "Rota", icon: "calendar" },
    { href: "/admin/time-off", label: "Time off", icon: "sun" },
    { href: "/admin/employees", label: "Team", icon: "users" },
    { href: "/admin/payroll", label: "Payroll", icon: "wallet" },
    { href: "/admin/income", label: "Income", icon: "cash" },
    { href: "/admin/expenses", label: "Expenses", icon: "receipt" },
    { href: "/admin/settings", label: "Settings", icon: "settings" },
  ];

  return (
    <PortalShell
      user={{ name: user.name, role: user.role, avatar: avatarUrl(user) }}
      subtitle="Management"
      items={NAV}
      mobileNav="drawer"
      alert={{ href: "/admin/notifications", count: unread + unreadChat }}
    >
      {children}
    </PortalShell>
  );
}
