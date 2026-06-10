import { useEffect, useState } from "react";
import { Flag } from "lucide-react";
import Page from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/hooks/useToast";
import { featureFlagService, type FeatureFlag } from "@/services/enterprise.service";
import { gymService, type PlatformGym } from "@/services/gym.service";

export default function FeatureFlagsPage() {
  const toast = useToast();
  const [gyms, setGyms] = useState<PlatformGym[]>([]);
  const [gymId, setGymId] = useState<string>("");
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await featureFlagService.seed().catch(() => undefined);
      const list = await gymService.list().catch(() => []);
      setGyms(list);
      if (list[0]) setGymId(list[0].id);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (gymId) featureFlagService.forGym(gymId).then(setFlags).catch(() => setFlags([]));
  }, [gymId]);

  async function toggle(f: FeatureFlag) {
    const next = !f.enabled;
    setFlags((prev) => prev.map((x) => (x.key === f.key ? { ...x, enabled: next, overridden: true } : x)));
    try { await featureFlagService.setForGym(gymId, f.key, next); toast.success(`${f.label} ${next ? "enabled" : "disabled"}`); }
    catch { toast.error("Update failed"); setFlags((prev) => prev.map((x) => (x.key === f.key ? { ...x, enabled: !next } : x))); }
  }

  if (loading) return <Page title="Feature Flags"><Skeleton height="h-64" /></Page>;

  return (
    <Page title="Feature Flags" description="Enable or disable platform modules per gym. Changes are audited.">
      <div className="space-y-4">
        <Card variant="solid" className="p-4">
          <label className="text-sm font-semibold text-(--text-secondary)">Gym</label>
          <select className="mt-1 w-full max-w-sm rounded-md border border-(--border) bg-(--surface) px-3 py-2 text-sm" value={gymId} onChange={(e) => setGymId(e.target.value)}>
            {gyms.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </Card>

        <div className="grid gap-3 md:grid-cols-2">
          {flags.map((f) => (
            <Card key={f.key} variant="solid" className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4 text-indigo-500" />
                    <span className="font-semibold text-(--text-primary)">{f.label}</span>
                    <Badge variant="default">{f.category}</Badge>
                    {f.overridden && <Badge variant="info">override</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-(--text-secondary)">{f.description}</p>
                </div>
                <button
                  onClick={() => toggle(f)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${f.enabled ? "bg-emerald-500" : "bg-(--surface-elevated) border border-(--border)"}`}
                  aria-label={`Toggle ${f.label}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${f.enabled ? "left-[22px]" : "left-0.5"}`} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Page>
  );
}
