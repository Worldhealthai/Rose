import { requireAdmin } from "@/lib/auth";
import { PortalShell, type NavItem } from "@/components/PortalShell";

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "dashboard", exact: true },
  { href: "/admin/rota", label: "Rota", icon: "calendar" },
  { href: "/admin/employees", label: "Team", icon: "users" },
  { href: "/admin/income", label: "Income", icon: "cash" },
  { href: "/admin/suppliers", label: "Suppliers", icon: "truck" },
  { href: "/admin/orders", label: "Order list", icon: "cart" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();
  return (
    <PortalShell
      user={{ name: user.name, role: user.role }}
      subtitle="Management"
      items={NAV}
      mobileNav="drawer"
    >
      {children}
    </PortalShell>
  );
}
