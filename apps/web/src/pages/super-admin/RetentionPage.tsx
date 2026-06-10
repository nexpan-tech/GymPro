import { useEffect, useState, type ReactNode } from "react";
import { HeartPulse, TrendingDown, Percent, FlaskConical } from "lucide-react";
import Page from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { retentionService, type PlatformRetention } from "@/services/retention.service";

export default function SuperAdminRetentionPage() {
  const [data, setData] = useState<PlatformRetention | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    retentionService
      .platform()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Page title="Platform Retention" description="Retention, churn, and conversion across all gyms.">
      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height="h-24" />)}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Retention Rate" value={`${data?.retentionRate ?? 0}%`} icon={<HeartPulse className="h-5 w-5" />} tone="emerald" />
            <Stat label="Churn Rate" value={`${data?.churnRate ?? 0}%`} icon={<TrendingDown className="h-5 w-5" />} tone="rose" />
            <Stat label="Lead Conversion" value={`${data?.leadConversionRate ?? 0}%`} icon={<Percent className="h-5 w-5" />} />
            <Stat label="Trial Conversion" value={`${data?.trialConversionRate ?? 0}%`} icon={<FlaskConical className="h-5 w-5" />} tone="amber" />
          </div>

          <Card variant="solid" className="overflow-hidden p-0">
            <div className="border-b border-(--border) px-5 py-3 text-sm font-semibold text-(--text-primary)">
              Gym conversion leaderboard
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-(--border) text-xs uppercase tracking-wide text-(--text-secondary)">
                  <tr>
                    <th className="px-4 py-2 font-medium">Gym</th>
                    <th className="px-4 py-2 font-medium">Members</th>
                    <th className="px-4 py-2 font-medium">At-risk</th>
                    <th className="px-4 py-2 font-medium">Leads</th>
                    <th className="px-4 py-2 font-medium">Lead conversion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--border)">
                  {(data?.perGym ?? []).map((g) => (
                    <tr key={g.gymId}>
                      <td className="px-4 py-2 font-medium text-(--text-primary)">{g.name}</td>
                      <td className="px-4 py-2">{g.members}</td>
                      <td className="px-4 py-2 text-(--text-secondary)">{g.atRisk}</td>
                      <td className="px-4 py-2 text-(--text-secondary)">{g.leads}</td>
                      <td className="px-4 py-2 font-semibold">{g.leadConversionRate}%</td>
                    </tr>
                  ))}
                  {(data?.perGym ?? []).length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-(--text-secondary)">No gyms yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </Page>
  );
}

function Stat({ label, value, icon, tone }: { label: string; value: string; icon: ReactNode; tone?: "emerald" | "rose" | "amber" }) {
  const color = tone === "emerald" ? "text-emerald-500" : tone === "rose" ? "text-rose-500" : tone === "amber" ? "text-amber-500" : "text-indigo-500";
  return (
    <Card variant="solid" className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-(--text-secondary)">{label}</span>
        <span className={color}>{icon}</span>
      </div>
      <div className="mt-2 text-2xl font-bold text-(--text-primary)">{value}</div>
    </Card>
  );
}
