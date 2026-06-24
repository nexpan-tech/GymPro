import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Send, CheckCheck, XCircle, Clock, RefreshCw } from "lucide-react";
import Page from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/hooks/useToast";
import { commsService, type CommsAnalytics, type DeliveryLogRow } from "@/services/comms.service";

export default function CommunicationAnalyticsPage() {
  const toast = useToast();
  const [analytics, setAnalytics] = useState<CommsAnalytics | null>(null);
  const [logs, setLogs] = useState<DeliveryLogRow[]>([]);
  const [queues, setQueues] = useState<{ name: string; waiting: number; active: number; completed: number; failed: number; delayed: number }[]>([]);
  const [dlq, setDlq] = useState<{ id: string; originalQueue: string; errorMessage: string; attemptsMade: number }[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [a, l, q, d] = await Promise.all([
      commsService.analytics().catch(() => null),
      commsService.deliveryLogs().catch(() => []),
      commsService.queueHealth().catch(() => []),
      commsService.dlq().catch(() => []),
    ]);
    setAnalytics(a); setLogs(l); setQueues(q); setDlq(d); setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  // Defensive de-dupe (the backend also de-dupes): collapse rows that are the
  // same channel + recipient + title within the same minute so a real delivery
  // never appears twice in the table.
  const visibleLogs = useMemo(() => {
    const seen = new Set<string>();
    return logs.filter((l) => {
      const key = `${l.channel}|${l.recipientAddr ?? ""}|${l.title ?? ""}|${(l.createdAt ?? "").slice(0, 16)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [logs]);

  async function retry(id: string) {
    try { await commsService.retryDlq(id); toast.success("Requeued"); void load(); }
    catch { toast.error("Retry failed"); }
  }

  if (loading) return <Page title="Communication Analytics"><Skeleton height="h-64" /></Page>;

  return (
    <Page title="Communication Analytics" description="Delivery performance, channel breakdown, chat response time, and queue health.">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Notifications sent" value={String(analytics?.delivery.sent ?? 0)} icon={<Send className="h-5 w-5" />} />
          <Stat label="Read rate" value={`${analytics?.notifications.readRate ?? 0}%`} icon={<CheckCheck className="h-5 w-5" />} tone="neutral" />
          <Stat label="Failed" value={String(analytics?.delivery.failed ?? 0)} icon={<XCircle className="h-5 w-5" />} tone="rose" />
          <Stat label="Avg chat reply" value={`${analytics?.chat.avgResponseMinutes ?? 0}m`} icon={<Clock className="h-5 w-5" />} tone="steel" />
        </div>

        {/* Channel breakdown */}
        <Card variant="solid" className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-(--text-primary)">Channel performance</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {Object.entries(analytics?.channels ?? {}).map(([ch, v]) => (
              <div key={ch} className="rounded-lg border border-border p-3 text-sm">
                <div className="font-semibold text-(--text-primary)">{ch}</div>
                <div className="text-(--text-secondary)">✓ {v.sent} · ✗ {v.failed} · – {v.skipped}</div>
              </div>
            ))}
            {Object.keys(analytics?.channels ?? {}).length === 0 && <p className="text-sm text-(--text-secondary)">No deliveries yet.</p>}
          </div>
        </Card>

        {/* Queue health */}
        <Card variant="solid" className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-(--text-primary)">Queue health</h3>
            <Button size="sm" variant="secondary" iconLeft={<RefreshCw className="h-3 w-3" />} onClick={load}>Refresh</Button>
          </div>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
            {queues.map((q) => (
              <div key={q.name} className="rounded-lg border border-border p-3 text-sm">
                <div className="font-semibold text-(--text-primary)">{q.name}</div>
                <div className="text-(--text-secondary)">wait {q.waiting} · active {q.active} · done {q.completed} · failed {q.failed}</div>
              </div>
            ))}
          </div>
          {dlq.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">Dead-letter queue ({dlq.length})</div>
              <div className="space-y-2">
                {dlq.map((j) => (
                  <div key={j.id} className="flex items-center justify-between rounded-md border border-border p-2 text-xs">
                    <span className="truncate text-(--text-secondary)">[{j.originalQueue}] {j.errorMessage}</span>
                    <Button size="sm" variant="secondary" onClick={() => retry(j.id)}>Retry</Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Delivery logs */}
        <Card variant="solid" className="overflow-hidden p-0">
          <div className="border-b border-border px-5 py-3 text-sm font-semibold text-(--text-primary)">Recent deliveries</div>
          {visibleLogs.length === 0 ? <p className="px-5 py-6 text-sm text-(--text-secondary)">No delivery logs yet.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase tracking-wide text-(--text-secondary)">
                  <tr><th className="px-4 py-2">Channel</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Recipient</th><th className="px-4 py-2">Title</th><th className="px-4 py-2">When</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {visibleLogs.map((l) => (
                    <tr key={l.id}>
                      <td className="px-4 py-2">{l.channel}</td>
                      <td className="px-4 py-2"><Badge variant={l.status === "FAILED" ? "danger" : l.status === "SKIPPED" ? "warning" : "success"}>{l.status}</Badge></td>
                      <td className="px-4 py-2 text-(--text-secondary)">{l.recipientAddr ?? "—"}</td>
                      <td className="px-4 py-2 text-(--text-secondary)">{l.title ?? "—"}</td>
                      <td className="px-4 py-2 text-(--text-secondary)">{new Date(l.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </Page>
  );
}

function Stat({ label, value, icon, tone }: { label: string; value: string; icon: ReactNode; tone?: "neutral" | "rose" | "steel" }) {
  const color = tone === "neutral" ? "text-muted-foreground" : tone === "rose" ? "text-primary" : tone === "steel" ? "text-muted-foreground" : "text-primary";
  return (
    <Card variant="solid" className="p-5">
      <div className="flex items-center justify-between"><span className="text-sm text-(--text-secondary)">{label}</span><span className={color}>{icon}</span></div>
      <div className="mt-2 text-2xl font-bold text-(--text-primary)">{value}</div>
    </Card>
  );
}
