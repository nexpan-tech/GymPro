import { useCallback, useEffect, useState } from "react";
import { Activity, Database, Server, Layers, Cog, RefreshCw, AlertTriangle } from "lucide-react";
import Page from "@/components/ui/Page";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { SectionHeader, StatusPill, type StatusTone, EmptyMomentumState, StatTile } from "@/components/premium";
import { useToast } from "@/hooks/useToast";
import { superAdminService } from "@/services/superAdmin.service";
import { formatUptime } from "./PlatformMetricsPage";

interface Monitoring {
  services: { backend: { status: string; uptimeSeconds: number }; database: { status: string }; redis: { status: string }; queue: { status: string } };
  workers: { status: string; failedJobs: number | null };
  environment: string;
  version: string;
  uptimeSeconds: number;
  timestamp: string;
}

function tone(s: string): StatusTone {
  if (["healthy", "active", "connected", "ok"].includes(s)) return "completed";
  if (["down", "unavailable"].includes(s)) return "expired";
  return "pending";
}

export default function SystemMonitorPage() {
  const toast = useToast();
  const [data, setData] = useState<Monitoring | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await superAdminService.getMonitoring());
    } catch {
      toast.error("Failed to load system monitoring.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { void load(); }, [load]);

  const services = data
    ? [
        { icon: <Server />, label: "Backend API", status: data.services.backend?.status },
        { icon: <Database />, label: "Database", status: data.services.database?.status },
        { icon: <Layers />, label: "Redis", status: data.services.redis?.status },
        { icon: <Activity />, label: "Job Queue", status: data.services.queue?.status },
      ]
    : [];

  return (
    <Page
      title="System Monitoring"
      eyebrow="Operations"
      description="Live health of every core service, workers, and the running build."
      action={<Button variant="secondary" iconLeft={<RefreshCw className="h-4 w-4" />} onClick={() => void load()}>Refresh</Button>}
    >
      {loading && !data ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height="h-20" />)}</div>
      ) : !data ? (
        <div className="surface-card"><EmptyMomentumState icon={<Activity />} title="Monitoring unavailable" description="We couldn't reach the monitoring endpoint." action={<Button variant="secondary" onClick={() => void load()}>Retry</Button>} /></div>
      ) : (
        <div className="space-y-8">
          <div>
            <SectionHeader eyebrow="Services" title="Health checks" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {services.map((s) => (
                <div key={s.label} className="surface-card flex items-center justify-between gap-3 p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 [&_svg]:h-5 [&_svg]:w-5">{s.icon}</span>
                    <p className="font-black text-(--text-primary)">{s.label}</p>
                  </div>
                  <StatusPill tone={tone(s.status)} size="sm">{s.status}</StatusPill>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionHeader eyebrow="Runtime" title="Workers & build" />
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              <div className="surface-card flex items-center justify-between p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 [&_svg]:h-5 [&_svg]:w-5"><Cog /></span>
                  <p className="font-black text-(--text-primary)">Workers</p>
                </div>
                <StatusPill tone={tone(data.workers.status)} size="sm">{data.workers.status}</StatusPill>
              </div>
              <StatTile
                label="Failed jobs"
                value={data.workers.failedJobs == null ? "—" : data.workers.failedJobs}
                icon={<AlertTriangle />}
                tone={(data.workers.failedJobs ?? 0) > 0 ? "energy" : "neutral"}
              />
              <StatTile label="Uptime" value={formatUptime(data.uptimeSeconds)} icon={<Activity />} tone="neutral" />
              <StatTile label="Environment" value={data.environment} icon={<Server />} tone="neutral" hint={`build ${data.version}`} />
            </div>
          </div>

          <p className="text-xs text-(--text-muted)">Last checked {new Date(data.timestamp).toLocaleTimeString()}.</p>
        </div>
      )}
    </Page>
  );
}
