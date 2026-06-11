import { useEffect, useState, type ReactNode } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { IndianRupee, Building2, Users, HeartPulse, TrendingDown, Trophy, Send } from "lucide-react";
import Page from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { enterpriseService, type EnterpriseOverview } from "@/services/enterprise.service";

const inr = (n: number) => `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export default function EnterpriseAnalyticsPage() {
  const [data, setData] = useState<EnterpriseOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    enterpriseService.overview().then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Page title="Enterprise Analytics"><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} height="h-24" />)}</div></Page>;

  return (
    <Page title="Enterprise Analytics" description="Platform-wide rollup across billing, retention, engagement, and communication.">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="MRR" value={inr(data?.revenue.mrr ?? 0)} icon={<IndianRupee className="h-5 w-5" />} />
          <Stat label="ARR" value={inr(data?.revenue.arr ?? 0)} icon={<IndianRupee className="h-5 w-5" />} tone="neutral" />
          <Stat label="Active Gyms" value={String(data?.members.activeGyms ?? 0)} icon={<Building2 className="h-5 w-5" />} />
          <Stat label="Active Members" value={String(data?.members.activeMembers ?? 0)} icon={<Users className="h-5 w-5" />} />
          <Stat label="Retention" value={`${data?.retention.retentionRate ?? 0}%`} icon={<HeartPulse className="h-5 w-5" />} tone="neutral" />
          <Stat label="Churn" value={`${data?.retention.churnRate ?? 0}%`} icon={<TrendingDown className="h-5 w-5" />} tone="rose" />
          <Stat label="Engagement (challenges)" value={String(data?.engagement.challengeParticipations ?? 0)} icon={<Trophy className="h-5 w-5" />} tone="steel" />
          <Stat label="Messages sent" value={String(data?.communication.messagesSent ?? 0)} icon={<Send className="h-5 w-5" />} />
        </div>

        <Card variant="solid" className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-(--text-primary)">Platform revenue trend</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.revenue.revenueTrend ?? []}>
                <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#e73725" stopOpacity={0.4} /><stop offset="95%" stopColor="#e73725" stopOpacity={0} /></linearGradient></defs>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => inr(Number(value))} />
                <Area type="monotone" dataKey="revenue" stroke="#e73725" fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card variant="solid" className="overflow-hidden p-0">
          <div className="border-b border-border px-5 py-3 text-sm font-semibold text-(--text-primary)">Top gyms</div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-(--text-secondary)">
                <tr><th className="px-4 py-2">Gym</th><th className="px-4 py-2">Members</th><th className="px-4 py-2">At-risk</th><th className="px-4 py-2">Lead conversion</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(data?.topGyms ?? []).map((g) => (
                  <tr key={g.gymId}><td className="px-4 py-2 font-medium text-(--text-primary)">{g.name}</td><td className="px-4 py-2">{g.members}</td><td className="px-4 py-2 text-(--text-secondary)">{g.atRisk}</td><td className="px-4 py-2 font-semibold">{g.leadConversionRate}%</td></tr>
                ))}
                {(data?.topGyms ?? []).length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-(--text-secondary)">No gyms yet.</td></tr>}
              </tbody>
            </table>
          </div>
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
