import { prisma } from "@/lib/prisma";
import { today as todayFn, formatDay, isSameDay } from "@/lib/dates";
import { PageHeader, Card, SectionTitle, Badge, EmptyState } from "@/components/ui";
import { Icon } from "@/components/icons";
import { FormButton } from "@/components/FormButton";
import { setTimeOffStatus, deleteTimeOff } from "./actions";

export const dynamic = "force-dynamic";

type Req = Awaited<
  ReturnType<typeof prisma.timeOff.findMany<{ include: { employee: true } }>>
>[number];

function range(r: Req) {
  return isSameDay(r.startDate, r.endDate)
    ? formatDay(r.startDate)
    : `${formatDay(r.startDate)} → ${formatDay(r.endDate)}`;
}

export default async function TimeOffPage() {
  const today = todayFn();
  const [pending, approved] = await Promise.all([
    prisma.timeOff.findMany({
      where: { status: "PENDING" },
      orderBy: { startDate: "asc" },
      include: { employee: true },
    }),
    prisma.timeOff.findMany({
      where: { status: "APPROVED", endDate: { gte: today } },
      orderBy: { startDate: "asc" },
      include: { employee: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Time off" subtitle="Holiday & day-off requests" />

      <div>
        <SectionTitle>
          Pending {pending.length > 0 && `(${pending.length})`}
        </SectionTitle>
        {pending.length === 0 ? (
          <EmptyState icon="sun" title="No pending requests" hint="Requests from staff appear here for you to approve." />
        ) : (
          <ul className="space-y-2">
            {pending.map((r) => (
              <Card as="li" key={r.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{r.employee.name}</p>
                    <p className="text-xs text-ink-muted">
                      {range(r)}
                      {r.note ? ` · ${r.note}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <form action={setTimeOffStatus}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="status" value="APPROVED" />
                      <FormButton className="btn-primary !py-2">
                        <Icon name="check" className="h-4 w-4" />
                        Approve
                      </FormButton>
                    </form>
                    <form action={setTimeOffStatus}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="status" value="DECLINED" />
                      <FormButton className="btn-secondary !py-2 text-danger">Decline</FormButton>
                    </form>
                  </div>
                </div>
              </Card>
            ))}
          </ul>
        )}
      </div>

      <div>
        <SectionTitle>Approved (upcoming)</SectionTitle>
        {approved.length === 0 ? (
          <Card>
            <p className="py-6 text-center text-sm text-ink-muted">No approved time off coming up.</p>
          </Card>
        ) : (
          <ul className="space-y-2">
            {approved.map((r) => (
              <Card as="li" key={r.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">
                    {r.employee.name}{" "}
                    <Badge color="#37c97e">approved</Badge>
                  </p>
                  <p className="text-xs text-ink-muted">
                    {range(r)}
                    {r.note ? ` · ${r.note}` : ""}
                  </p>
                </div>
                <form action={deleteTimeOff}>
                  <input type="hidden" name="id" value={r.id} />
                  <button className="grid h-9 w-9 place-items-center rounded-lg text-ink-faint hover:bg-danger/10 hover:text-danger" aria-label="Remove">
                    <Icon name="trash" className="h-4 w-4" />
                  </button>
                </form>
              </Card>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
