import { useState } from "react";
import { Bot, Play, Clock } from "lucide-react";
import Page from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";
import { automationService } from "@/services/crm.service";

type JobKey = Parameters<typeof automationService.run>[0];

const AUTOMATIONS: { key: JobKey; name: string; schedule: string; description: string }[] = [
  { key: "score-recompute", name: "Retention score recompute", schedule: "Daily · 02:00", description: "Recompute & store every member's retention/risk score." },
  { key: "churn-risk", name: "Churn risk alerts", schedule: "Daily · 09:00", description: "Notify staff about HIGH/CRITICAL churn-risk members." },
  { key: "engagement-reminders", name: "Engagement reminders", schedule: "Daily · 09:15", description: "Missed-workout, goal, and attendance-drop nudges." },
  { key: "trial-conversion", name: "Trial conversion reminders", schedule: "Daily · 09:30", description: "Follow-ups for trials ending soon; lapse expired trials." },
  { key: "renewals", name: "Renewal reminders", schedule: "Daily · 08:45", description: "Memberships expiring within 7 days." },
  { key: "renewal-campaigns", name: "Renewal campaigns", schedule: "Daily · 08:15", description: "Expiry campaign messages (7/3/1 day + expired)." },
  { key: "dues", name: "Due reminders", schedule: "Daily · 08:00", description: "Pending/overdue payment reminders." },
  { key: "inactive-members", name: "Inactive member detection", schedule: "Daily · 08:30", description: "Flag members inactive for 7/14/30 days." },
];

export default function AutomationPage() {
  const toast = useToast();
  const [running, setRunning] = useState<string | null>(null);
  const [log, setLog] = useState<{ name: string; at: string; result: string }[]>([]);

  async function run(job: JobKey, name: string) {
    setRunning(job);
    try {
      const res = (await automationService.run(job)) as Record<string, unknown>;
      const summary = JSON.stringify(res);
      setLog((l) => [{ name, at: new Date().toLocaleTimeString(), result: summary.slice(0, 160) }, ...l].slice(0, 20));
      toast.success(`${name} ran`);
    } catch {
      toast.error(`${name} failed`);
    } finally {
      setRunning(null);
    }
  }

  return (
    <Page title="Automation" description="Retention & CRM automations — schedules and manual runs.">
      <div className="space-y-6">
        <div className="grid gap-3 md:grid-cols-2">
          {AUTOMATIONS.map((a) => (
            <Card key={a.key} variant="solid" className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-indigo-500" />
                    <span className="text-sm font-semibold text-(--text-primary)">{a.name}</span>
                    <Badge variant="success">Active</Badge>
                  </div>
                  <p className="mt-1 text-sm text-(--text-secondary)">{a.description}</p>
                  <div className="mt-2 flex items-center gap-1 text-xs text-(--text-secondary)">
                    <Clock className="h-3 w-3" /> {a.schedule}
                  </div>
                </div>
                <Button size="sm" variant="secondary" iconLeft={<Play className="h-3 w-3" />} loading={running === a.key} onClick={() => run(a.key, a.name)}>
                  Run now
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <Card variant="solid" className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-(--text-primary)">Run log (this session)</h3>
          {log.length === 0 ? (
            <p className="text-sm text-(--text-secondary)">Trigger an automation to see its result here.</p>
          ) : (
            <div className="space-y-2">
              {log.map((l, i) => (
                <div key={i} className="rounded-md border border-(--border) p-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-(--text-primary)">{l.name}</span>
                    <span className="text-(--text-secondary)">{l.at}</span>
                  </div>
                  <code className="mt-1 block break-all text-(--text-secondary)">{l.result}</code>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Page>
  );
}
