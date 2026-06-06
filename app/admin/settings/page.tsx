import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getCommissionRates } from "@/lib/settings";
import { CURRENCY_SYMBOL } from "@/lib/money";
import { PageHeader, Card, SectionTitle } from "@/components/ui";
import { Flash } from "@/components/Flash";
import { FormButton } from "@/components/FormButton";
import {
  updateRestaurantName,
  updateCommission,
  changeMyPassword,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { ok?: string; error?: string };
}) {
  const [me, nameSetting, rates] = await Promise.all([
    getCurrentUser(),
    prisma.setting.findUnique({ where: { key: "restaurantName" } }),
    getCommissionRates(),
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
          <FormButton className="btn-primary">Save</FormButton>
        </form>
      </Card>

      <Card>
        <SectionTitle>Delivery commission</SectionTitle>
        <p className="mb-3 text-sm text-ink-muted">
          The % each app keeps. Used to show your net income and profit.
        </p>
        <form action={updateCommission} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3 sm:max-w-md">
            <div>
              <label className="label">Just Eat (%)</label>
              <input name="justEat" type="number" step="0.5" min="0" max="100" defaultValue={Math.round(rates.justEat * 100) || ""} className="input" placeholder="0" />
            </div>
            <div>
              <label className="label">Uber Eats (%)</label>
              <input name="uberEats" type="number" step="0.5" min="0" max="100" defaultValue={Math.round(rates.uberEats * 100) || ""} className="input" placeholder="0" />
            </div>
            <div>
              <label className="label">Deliveroo (%)</label>
              <input name="deliveroo" type="number" step="0.5" min="0" max="100" defaultValue={Math.round(rates.deliveroo * 100) || ""} className="input" placeholder="0" />
            </div>
          </div>
          <FormButton className="btn-primary">Save commission</FormButton>
        </form>
        <p className="mt-2 text-xs text-ink-faint">
          Z report ({CURRENCY_SYMBOL} in-house) has no commission.
        </p>
      </Card>

      <Card>
        <SectionTitle>Your account</SectionTitle>
        <div className="mb-4 text-sm text-ink-muted">
          Signed in as <span className="font-medium text-ink">{me?.name}</span> ·
          username <span className="font-medium text-ink">@{me?.username}</span>
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
          <FormButton className="btn-primary">Change password</FormButton>
        </form>
      </Card>
    </div>
  );
}
