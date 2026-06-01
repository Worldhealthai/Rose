import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader, Card, SectionTitle } from "@/components/ui";
import { Flash } from "@/components/Flash";
import { updateRestaurantName, changeMyPassword } from "./actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { ok?: string; error?: string };
}) {
  const [me, nameSetting] = await Promise.all([
    getCurrentUser(),
    prisma.setting.findUnique({ where: { key: "restaurantName" } }),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" subtitle="Restaurant & account" />
      <Flash ok={searchParams.ok} error={searchParams.error} />

      <Card>
        <SectionTitle>Restaurant</SectionTitle>
        <form action={updateRestaurantName} className="space-y-3">
          <div>
            <label className="label">Restaurant name</label>
            <input
              name="restaurantName"
              defaultValue={nameSetting?.value ?? "Rose Restaurant"}
              className="input sm:max-w-md"
            />
          </div>
          <button className="btn-primary">Save</button>
        </form>
      </Card>

      <Card>
        <SectionTitle>Your account</SectionTitle>
        <div className="mb-4 text-sm text-ink-muted">
          Signed in as <span className="font-medium text-ink">{me?.name}</span> ·{" "}
          {me?.email}
        </div>
        <form action={changeMyPassword} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 sm:max-w-md">
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
          </div>
          <button className="btn-primary">Change password</button>
        </form>
      </Card>
    </div>
  );
}
