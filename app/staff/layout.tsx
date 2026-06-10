import { requireStaff } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { getDict, isRTL } from "@/lib/i18n";
import { getUnreadChatCount } from "@/lib/chat";
import { PortalShell, type NavItem } from "@/components/PortalShell";

export const dynamic = "force-dynamic";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireStaff();
  const locale = getLocale();
  const t = getDict(locale);
  const unreadChat = await getUnreadChatCount(user.id, user.chatLastReadAt);

  const NAV: NavItem[] = [
    { href: "/staff", label: t.nav.shifts, icon: "calendar", exact: true },
    { href: "/staff/chat", label: t.nav.chat, icon: "message", badge: unreadChat },
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
      account={{
        links: [
          { href: "/staff/availability", label: t.nav.availability },
          { href: "/staff/profile", label: t.profile.title },
        ],
        signOutLabel: t.common.signOut,
      }}
    >
      {children}
    </PortalShell>
  );
}
