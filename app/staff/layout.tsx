import { requireStaff } from "@/lib/auth";
import { PortalShell, type NavItem } from "@/components/PortalShell";

const NAV: NavItem[] = [
  { href: "/staff", label: "Shifts", icon: "calendar", exact: true },
  { href: "/staff/checklist", label: "Tasks", icon: "clipboard" },
  { href: "/staff/menu", label: "Menu", icon: "book" },
  { href: "/staff/orders", label: "Orders", icon: "cart" },
  { href: "/staff/profile", label: "You", icon: "user" },
];

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireStaff();
  return (
    <PortalShell
      user={{ name: user.name, role: user.role, avatar: user.avatar }}
      subtitle="Staff portal"
      items={NAV}
      mobileNav="tabs"
    >
      {children}
    </PortalShell>
  );
}
