import { requireStaff } from "@/lib/auth";
import { money } from "@/lib/money";
import { PageHeader, Card, SectionTitle, DetailRow } from "@/components/ui";
import { Flash } from "@/components/Flash";
import { updateMyContact, changeMyPassword } from "./actions";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: { ok?: string; error?: string };
}) {
  const me = await requireStaff();

  return (
    <div className="space-y-5">
      <PageHeader title="Profile" subtitle="Your details & password" />
      <Flash ok={searchParams.ok} error={searchParams.error} />

      <Card>
        <SectionTitle>Your details</SectionTitle>
        <div className="divide-y divide-border-soft">
          <DetailRow icon="user" label="Name">
            {me.name}
          </DetailRow>
          <DetailRow icon="star" label="Position">
            {me.position ?? "—"}
          </DetailRow>
          <DetailRow icon="cash" label="Rate">
            {money(me.hourlyRate)}/hr
          </DetailRow>
          <DetailRow icon="mail" label="Email">
            {me.email}
          </DetailRow>
        </div>
        <p className="mt-3 text-xs text-ink-faint">
          Your name, position and pay rate are managed by your manager.
        </p>
      </Card>

      <Card>
        <SectionTitle>Contact number</SectionTitle>
        <form action={updateMyContact} className="flex items-end gap-2">
          <div className="flex-1">
            <label className="label">Phone</label>
            <input
              name="phone"
              defaultValue={me.phone ?? ""}
              className="input"
              placeholder="07…"
              inputMode="tel"
            />
          </div>
          <button className="btn-primary">Save</button>
        </form>
      </Card>

      <Card>
        <SectionTitle>Change password</SectionTitle>
        <form action={changeMyPassword} className="space-y-3">
          <div>
            <label className="label">Current password</label>
            <input
              name="current"
              type="password"
              className="input"
              autoComplete="current-password"
              required
            />
          </div>
          <div>
            <label className="label">New password</label>
            <input
              name="next"
              type="password"
              className="input"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>
          <button className="btn-primary">Update password</button>
        </form>
      </Card>
    </div>
  );
}
