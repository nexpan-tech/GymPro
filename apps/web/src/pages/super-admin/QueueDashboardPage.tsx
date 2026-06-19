import { useCallback, useEffect, useState } from "react";
import { ListTodo, RefreshCw, AlertTriangle } from "lucide-react";
import Page from "@/components/ui/Page";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatTile, SectionHeader, EmptyMomentumState } from "@/components/premium";
import { useToast } from "@/hooks/useToast";
import { superAdminService } from "@/services/superAdmin.service";

interface QueueStat { name: string; waiting: number; active: number; completed: number; failed: number; delayed: number }
interface QueuePayload { available: boolean; reason?: string; queues: QueueStat[] }

export default function QueueDashboardPage() {
  const toast = useToast();
  const [data, setData] = useState<QueuePayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await superAdminService.getQueue());
    } catch {
      toast.error("Failed to load queue stats.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 20_000);
    return () => clearInterval(id);
  }, [load]);

  const totals = (data?.queues ?? []).reduce(
    (acc, q) => ({ waiting: acc.waiting + q.waiting, active: acc.active + q.active, completed: acc.completed + q.completed, failed: acc.failed + q.failed }),
    { waiting: 0, active: 0, completed: 0, failed: 0 },
  );

  return (
    <Page
      title="Queue Dashboard"
      eyebrow="Operations"
      description="Background job queues — waiting, active, completed, and failed counts in real time."
      action={<Button variant="secondary" iconLeft={<RefreshCw className="h-4 w-4" />} onClick={() => void load()}>Refresh</Button>}
    >
      {loading && !data ? (
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height="h-28" />)}</div>
      ) : !data || !data.available ? (
        <div className="surface-card">
          <EmptyMomentumState
            icon={<ListTodo />}
            title="Queue inspection unavailable"
            description={data?.reason ?? "The job queue (Redis/BullMQ) isn't reachable right now. Stats will appear once it's connected."}
            action={<Button variant="secondary" onClick={() => void load()}>Retry</Button>}
          />
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            <StatTile label="Waiting" value={totals.waiting} icon={<ListTodo />} tone="neutral" />
            <StatTile label="Active" value={totals.active} icon={<RefreshCw />} tone="energy" />
            <StatTile label="Completed" value={totals.completed} icon={<ListTodo />} tone="neutral" />
            <StatTile label="Failed" value={totals.failed} icon={<AlertTriangle />} tone={totals.failed > 0 ? "energy" : "neutral"} />
          </div>

          <div>
            <SectionHeader eyebrow="Per queue" title="Job queues" />
            {data.queues.length === 0 ? (
              <div className="surface-card p-8 text-center text-sm text-(--text-muted)">No queues reporting.</div>
            ) : (
              <div className="surface-card overflow-hidden p-0">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-(--surface-secondary) text-xs uppercase tracking-wide text-(--text-muted)">
                    <tr><th className="px-5 py-3 font-bold">Queue</th><th className="px-5 py-3 font-bold">Waiting</th><th className="px-5 py-3 font-bold">Active</th><th className="px-5 py-3 font-bold">Completed</th><th className="px-5 py-3 font-bold">Failed</th><th className="px-5 py-3 font-bold">Delayed</th></tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.queues.map((q) => (
                      <tr key={q.name} className="hover:bg-(--surface-hover)">
                        <td className="px-5 py-3 font-semibold text-(--text-primary)">{q.name}</td>
                        <td className="px-5 py-3 tabular-nums text-(--text-secondary)">{q.waiting}</td>
                        <td className="px-5 py-3 tabular-nums text-(--text-secondary)">{q.active}</td>
                        <td className="px-5 py-3 tabular-nums text-(--text-secondary)">{q.completed}</td>
                        <td className={`px-5 py-3 tabular-nums font-semibold ${q.failed > 0 ? "text-primary" : "text-(--text-secondary)"}`}>{q.failed}</td>
                        <td className="px-5 py-3 tabular-nums text-(--text-secondary)">{q.delayed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <p className="text-xs text-(--text-muted)">Auto-refreshes every 20s.</p>
        </div>
      )}
    </Page>
  );
}
