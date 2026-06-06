import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { PageHeader, Card, SectionTitle, DetailRow } from "@/components/ui";
import { Flash } from "@/components/Flash";
import { Icon } from "@/components/icons";
import { AvatarUpload } from "@/components/AvatarUpload";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { updateMyContact, updateMyAvatar, changeMyPassword } from "./actions";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: { ok?: string; error?: string };
}) {
  const me = await requireStaff();
  const locale = getLocale();
  const dict = getDict(locale);
  const t = dict.profile;

  return (
    <div className="space-y-5">
      <PageHeader title={t.title} subtitle={t.subtitle} />
      <Flash ok={searchParams.ok} error={searchParams.error} />

      <Card>
        <SectionTitle>{t.yourPhoto}</SectionTitle>
        <form action={updateMyAvatar}>
          <AvatarUpload displayName={me.name} current={me.avatar} autoSubmit size={96} />
        </form>
        <p className="mt-3 text-xs text-ink-faint">{t.photoHint}</p>
      </Card>

      <Card>
        <SectionTitle>{t.yourDetails}</SectionTitle>
        <div className="divide-y divide-border-soft">
          <DetailRow icon="user" label={t.name}>
            {me.name}
          </DetailRow>
          <DetailRow icon="user" label={t.username}>
            @{me.username}
          </DetailRow>
          <DetailRow icon="star" label={t.position}>
            {me.position ?? "—"}
          </DetailRow>
          <DetailRow icon="mail" label={t.email}>
            {me.email ?? "—"}
          </DetailRow>
        </div>
        <p className="mt-3 text-xs text-ink-faint">{t.managedByManager}</p>
      </Card>

      <Link
        href="/staff/availability"
        className="card flex items-center gap-3 p-4 transition hover:bg-elevated/40"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-forest-500/15 text-forest-300">
          <Icon name="star" className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="font-semibold text-ink">{t.myAvailability}</p>
          <p className="text-sm text-ink-muted">{t.availabilityHint}</p>
        </div>
        <Icon name="chevronRight" className="h-5 w-5 text-ink-faint" />
      </Link>

      <Card>
        <SectionTitle>{dict.lang.label}</SectionTitle>
        <LanguageSwitcher current={locale} />
      </Card>

      <Card>
        <SectionTitle>{t.contactNumber}</SectionTitle>
        <form action={updateMyContact} className="flex items-end gap-2">
          <div className="flex-1">
            <label className="label">{t.phone}</label>
            <input
              name="phone"
              defaultValue={me.phone ?? ""}
              className="input"
              placeholder="07…"
              inputMode="tel"
            />
          </div>
          <button className="btn-primary">{t.save}</button>
        </form>
      </Card>

      <Card>
        <SectionTitle>{t.changePassword}</SectionTitle>
        <form action={changeMyPassword} className="space-y-3">
          <div>
            <label className="label">{t.currentPassword}</label>
            <input
              name="current"
              type="password"
              className="input"
              autoComplete="current-password"
              required
            />
          </div>
          <div>
            <label className="label">{t.newPassword}</label>
            <input
              name="next"
              type="password"
              className="input"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>
          <button className="btn-primary">{t.updatePassword}</button>
        </form>
      </Card>
    </div>
  );
}
