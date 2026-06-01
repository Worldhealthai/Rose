import { requireStaff } from "@/lib/auth";
import { PortalShell, type NavItem } from "@/components/PortalShell";

const NAV: NavItem[] = [
  { href: "/staff", label: "Shifts", icon: "calendar", exact: true },
  { href: "/staff/availability", label: "Availability", icon: "star" },
  { href: "/staff/profile", label: "Profile", icon: "user" },
];

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireStaff();
  return (
    <PortalShell
      user={{ name: user.name, role: user.role }}
      subtitle="Staff portal"
      items={NAV}
      mobileNav="tabs"
    >
      {children}
    </PortalShell>
  );
}
