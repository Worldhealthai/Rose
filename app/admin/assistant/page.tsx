import { requireAdmin } from "@/lib/auth";
import { PageHeader, Card } from "@/components/ui";
import { Icon } from "@/components/icons";
import { AssistantClient } from "./AssistantClient";

export const dynamic = "force-dynamic";

export default async function AssistantPage() {
  await requireAdmin();
  const configured = !!process.env.ANTHROPIC_API_KEY;

  return (
    <div>
      <PageHeader
        title="Assistant"
        subtitle="Ask about hours, pay & takings in plain English"
      />
      {configured ? (
        <AssistantClient />
      ) : (
        <Card>
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-warning/15 text-warning">
              <Icon name="alert" className="h-5 w-5" />
            </span>
            <div className="text-sm text-ink-muted">
              <p className="font-semibold text-ink">Assistant not switched on yet</p>
              <p className="mt-1">
                Add an <code className="text-forest-200">ANTHROPIC_API_KEY</code>{" "}
                environment variable (Vercel → Settings → Environment Variables),
                then redeploy. After that you can ask things like “from June 9, how
                much do I owe Sarina for the hours she worked?”.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
