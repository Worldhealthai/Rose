import { requireStaff } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { getDict, isRTL } from "@/lib/i18n";
import { PortalShell, type NavItem } from "@/components/PortalShell";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireStaff();
  const locale = getLocale();
  const t = getDict(locale);

  const NAV: NavItem[] = [
    { href: "/staff", label: t.nav.shifts, icon: "calendar", exact: true },
    { href: "/staff/checklist", label: t.nav.tasks, icon: "clipboard" },
    { href: "/staff/menu", label: t.nav.menu, icon: "book" },
    { href: "/staff/orders", label: t.nav.orders, icon: "cart" },
    { href: "/staff/profile", label: t.nav.you, icon: "user" },
  ];

  return (
    <PortalShell
      user={{ name: user.name, role: user.role, avatar: user.avatar }}
      subtitle={t.nav.staffPortal}
      items={NAV}
      mobileNav="tabs"
      dir={isRTL(locale) ? "rtl" : "ltr"}
      localeToggle={locale}
    >
      {children}
    </PortalShell>
  );
}
