import { useCallback, useEffect, useState } from "react";
import { Activity, Database, Server, Cpu, Building2, Users, RefreshCw, Layers } from "lucide-react";
import Page from "@/components/ui/Page";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatTile, SectionHeader, StatusPill, type StatusTone, EmptyMomentumState } from "@/components/premium";
import { useToast } from "@/hooks/useToast";
import { superAdminService, type PlatformMetrics } from "@/services/superAdmin.service";

function statusTone(s: string): StatusTone {
  if (["connected", "ok", "running", "healthy"].includes(s)) return "completed";
  if (["down", "unavailable"].includes(s)) return "expired";
  return "pending";
}

export function formatUptime(sec: number): string {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function PlatformMetricsPage() {
  const toast = useToast();
  const [data, setData] = useState<PlatformMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await superAdminService.getMetrics());
    } catch {
      toast.error("Failed to load platform metrics.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 30_000); // live-ish refresh
    return () => clearInterval(id);
  }, [load]);

  return (
    <Page
      title="Platform Metrics"
      eyebrow="Operations"
      description="Live API, database, cache, queue, and resource metrics for the platform."
      action={<Button variant="secondary" iconLeft={<RefreshCw className="h-4 w-4" />} onClick={() => void load()}>Refresh</Button>}
    >
      {loading && !data ? (
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} height="h-28" />)}</div>
      ) : !data ? (
        <div className="surface-card"><EmptyMomentumState icon={<Activity />} title="Metrics unavailable" description="We couldn't reach the metrics endpoint. Try refreshing." action={<Button variant="secondary" onClick={() => void load()}>Retry</Button>} /></div>
      ) : (
        <div className="space-y-8">
          {/* Service status */}
          <div>
            <SectionHeader eyebrow="Health" title="Service status" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <ServiceCard icon={<Server />} label="API" status={data.api.status} extra={`${data.api.env} · Node ${data.api.nodeVersion}`} />
              <ServiceCard icon={<Database />} label="Database" status={data.database.status} />
              <ServiceCard icon={<Layers />} label="Redis" status={data.redis.status} />
              <ServiceCard icon={<Activity />} label="Queue" status={data.queue.status} />
            </div>
          </div>

          {/* Resource + platform metrics */}
          <div>
            <SectionHeader eyebrow="Resources" title="Process & platform" />
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              <StatTile label="Uptime" value={formatUptime(data.api.uptimeSeconds)} icon={<Activity />} tone="energy" />
              <StatTile label="Heap used" value={`${data.memory.heapUsedMb} MB`} icon={<Cpu />} tone="neutral" hint={`of ${data.memory.heapTotalMb} MB · RSS ${data.memory.rssMb} MB`} />
              <StatTile label="Active gyms" value={data.platform.activeGyms} icon={<Building2 />} tone="neutral" />
              <StatTile label="Active users" value={data.platform.activeUsers} icon={<Users />} tone="neutral" />
            </div>
          </div>

          {/* Queue depth */}
          {data.queue.queues.length > 0 && (
            <div>
              <SectionHeader eyebrow="Queues" title="Job queues" />
              <div className="surface-card overflow-hidden p-0">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-(--surface-secondary) text-xs uppercase tracking-wide text-(--text-muted)">
                    <tr><th className="px-5 py-3 font-bold">Queue</th><th className="px-5 py-3 font-bold">Waiting</th><th className="px-5 py-3 font-bold">Active</th><th className="px-5 py-3 font-bold">Completed</th><th className="px-5 py-3 font-bold">Failed</th><th className="px-5 py-3 font-bold">Delayed</th></tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.queue.queues.map((q) => (
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
            </div>
          )}

          <p className="text-xs text-(--text-muted)">Last updated {new Date(data.timestamp).toLocaleTimeString()} · auto-refreshes every 30s.</p>
        </div>
      )}
    </Page>
  );

  function ServiceCard({ icon, label, status, extra }: { icon: React.ReactNode; label: string; status: string; extra?: string }) {
    return (
      <div className="surface-card flex items-center justify-between gap-3 p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 [&_svg]:h-5 [&_svg]:w-5">{icon}</span>
          <div>
            <p className="font-black text-(--text-primary)">{label}</p>
            {extra && <p className="text-xs text-(--text-muted)">{extra}</p>}
          </div>
        </div>
        <StatusPill tone={statusTone(status)} size="sm">{status}</StatusPill>
      </div>
    );
  }
}
