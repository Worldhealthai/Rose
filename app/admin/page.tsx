import Link from "next/link";
import { getDashboardData } from "@/lib/analytics";
import { money, moneyCompact } from "@/lib/money";
import { formatMonth, formatShort, relativeDay } from "@/lib/dates";
import { CHANNELS } from "@/lib/calc";
import { PageHeader, StatCard, Card, SectionTitle, Badge, Dot } from "@/components/ui";
import { BarTrend, Donut } from "@/components/charts";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const d = await getDashboardData();

  const channelSegments = CHANNELS.map((c) => ({
    label: c.label,
    value: d.monthSum[c.key],
    color: c.color,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={`Overview · ${formatMonth(d.monthLabel)}`}
        action={
          <Link href="/admin/income" className="btn-primary">
            <Icon name="plus" className="h-4 w-4" />
            Add today&apos;s takings
          </Link>
        }
      />

      {/* Headline stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Today"
          value={money(d.todayTotal)}
          sub={relativeDay(d.today)}
          icon="cash"
          accent="#37c97e"
        />
        <StatCard
          label="This week"
          value={money(d.weekSum.total)}
          sub="Mon–Sun"
          icon="trend"
          accent="#34d399"
        />
        <StatCard
          label="This month"
          value={money(d.monthSum.total)}
          sub={`Avg ${money(d.avgDay)}/day`}
          icon="calendar"
          accent="#22d3ee"
        />
        <StatCard
          label="To order"
          value={d.counts.productsNeeded}
          sub="items flagged"
          icon="cart"
          accent="#f59e0b"
        />
      </div>

      {/* Profit this month */}
      <div>
        <SectionTitle>Profit · {formatMonth(d.monthLabel)}</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Net income"
            value={money(d.monthNet)}
            sub="after delivery fees"
            icon="cash"
            accent="#34d399"
          />
          <StatCard
            label="Expenses"
            value={money(d.monthExpenses)}
            icon="cart"
            accent="#f0635a"
          />
          <StatCard
            label="Profit"
            value={money(d.monthProfit)}
            icon="trend"
            accent={d.monthProfit >= 0 ? "#37c97e" : "#f0635a"}
          />
        </div>
      </div>

      {/* Trend + channel mix */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle
            action={
              <span className="text-xs text-ink-faint">last 30 days</span>
            }
          >
            Daily income
          </SectionTitle>
          {d.hasAnyIncome ? (
            <BarTrend
              data={d.trend.map((t) => ({
                label: formatShort(t.date),
                value: t.value,
                highlight:
                  t.date.getTime() === d.today.getTime(),
              }))}
              formatValue={(v) => money(v)}
            />
          ) : (
            <p className="py-10 text-center text-sm text-ink-muted">
              No income recorded yet. Add your first day&apos;s takings to see
              trends here.
            </p>
          )}
        </Card>

        <Card>
          <SectionTitle>Channel mix · month</SectionTitle>
          <div className="flex flex-col items-center gap-4">
            <Donut
              segments={channelSegments}
              centerValue={moneyCompact(d.monthSum.total)}
              centerLabel="total"
            />
            <ul className="w-full space-y-1.5">
              {CHANNELS.map((c) => (
                <li
                  key={c.key}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="flex items-center gap-2 text-ink-muted">
                    <Dot color={c.color} />
                    {c.label}
                  </span>
                  <span className="font-medium text-ink">
                    {money(d.monthSum[c.key])}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      {/* Today's shifts + labour */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle
            action={
              <Link
                href="/admin/rota"
                className="text-xs font-medium text-forest-300 hover:underline"
              >
                Open rota
              </Link>
            }
          >
            Working today
          </SectionTitle>
          {d.todayShifts.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-muted">
              No shifts scheduled for today.
            </p>
          ) : (
            <ul className="divide-y divide-border-soft">
              {d.todayShifts.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">
                      {s.employee?.name ?? "Open shift"}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {s.role ?? s.employee?.position ?? "Shift"}
                    </p>
                  </div>
                  <Badge color="#37c97e">
                    <Icon name="clock" className="h-3.5 w-3.5" />
                    {s.start}–{s.end}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <SectionTitle>Labour · this week</SectionTitle>
          <div className="space-y-3">
            <div>
              <p className="text-3xl font-bold text-ink">
                {money(d.weekLabour)}
              </p>
              <p className="text-xs text-ink-muted">
                {d.weekHours.toFixed(1)} hours rota&apos;d
              </p>
            </div>
            <div className="rounded-xl bg-canvas/50 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-muted">Labour vs revenue</span>
                <span
                  className={`font-semibold ${
                    d.weekLabourPct > 35 ? "text-warning" : "text-forest-300"
                  }`}
                >
                  {d.weekSum.total > 0 ? `${d.weekLabourPct}%` : "—"}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-ink-faint">
                Target is usually under 30% of takings.
              </p>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-muted">Team members</span>
              <span className="font-medium text-ink">
                {d.counts.activeStaff}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Order reminder */}
      {d.counts.productsNeeded > 0 && (
        <Link href="/admin/orders" className="block">
          <div className="card flex items-center gap-3 border-warning/30 bg-warning/10 p-4 transition hover:bg-warning/15">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-warning/20 text-warning">
              <Icon name="cart" className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="font-semibold text-ink">
                {d.counts.productsNeeded} item
                {d.counts.productsNeeded === 1 ? "" : "s"} to order
              </p>
              <p className="text-sm text-ink-muted">
                Review your order list and contact suppliers.
              </p>
            </div>
            <Icon name="chevronRight" className="h-5 w-5 text-ink-faint" />
          </div>
        </Link>
      )}

      {d.counts.tasksOpen > 0 && (
        <Link href="/admin/checklist" className="block">
          <div className="card flex items-center gap-3 p-4 transition hover:bg-elevated/50">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-forest-500/15 text-forest-300">
              <Icon name="clipboard" className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="font-semibold text-ink">
                {d.counts.tasksOpen} task{d.counts.tasksOpen === 1 ? "" : "s"} left
                today
              </p>
              <p className="text-sm text-ink-muted">Check the daily checklist.</p>
            </div>
            <Icon name="chevronRight" className="h-5 w-5 text-ink-faint" />
          </div>
        </Link>
      )}

      {d.counts.menuOff > 0 && (
        <Link href="/admin/menu" className="block">
          <div className="card flex items-center gap-3 border-warning/30 bg-warning/10 p-4 transition hover:bg-warning/15">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-warning/20 text-warning">
              <Icon name="book" className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="font-semibold text-ink">
                {d.counts.menuOff} item{d.counts.menuOff === 1 ? "" : "s"} off the
                menu
              </p>
              <p className="text-sm text-ink-muted">
                Order ingredients &amp; update the apps.
              </p>
            </div>
            <Icon name="chevronRight" className="h-5 w-5 text-ink-faint" />
          </div>
        </Link>
      )}
    </div>
  );
}
