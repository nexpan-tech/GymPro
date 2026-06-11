import { useEffect, useState, type ReactNode } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { ShieldAlert, HeartPulse, TrendingDown, RefreshCw } from "lucide-react";
import Page from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/hooks/useToast";
import {
  retentionService,
  type RetentionOverview,
  type ChurnRow,
  type PredictionRow,
  type RiskLevel,
} from "@/services/retention.service";

const RISK_COLOR: Record<RiskLevel, string> = {
  LOW: "#767676",
  MEDIUM: "#767676",
  HIGH: "#767676",
  CRITICAL: "#e73725",
};
const riskBadge = (l: RiskLevel | null) =>
  l === "CRITICAL" || l === "HIGH" ? "danger" : l === "MEDIUM" ? "warning" : "success";

export default function RetentionPage() {
  const toast = useToast();
  const [overview, setOverview] = useState<RetentionOverview | null>(null);
  const [churn, setChurn] = useState<ChurnRow[]>([]);
  const [predictions, setPredictions] = useState<PredictionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [recomputing, setRecomputing] = useState(false);

  async function load() {
    const [o, c, p] = await Promise.all([
      retentionService.overview().catch(() => null),
      retentionService.churn().catch(() => []),
      retentionService.predictions().catch(() => []),
    ]);
    setOverview(o);
    setChurn(c);
    setPredictions(p);
    setLoading(false);
  }
  useEffect(() => {
    void load();
  }, []);

  async function recompute() {
    setRecomputing(true);
    try {
      await retentionService.recompute();
      toast.success("Scores recomputed");
      await load();
    } catch {
      toast.error("Recompute failed");
    } finally {
      setRecomputing(false);
    }
  }

  const riskData = overview
    ? (Object.keys(overview.riskBreakdown) as RiskLevel[]).map((k) => ({ level: k, count: overview.riskBreakdown[k] }))
    : [];
  const predByMember = new Map(predictions.map((p) => [p.memberId, p]));

  return (
    <Page
      title="Retention & Risk"
      description="Member retention scores, churn risk, and rule-based renewal predictions."
      action={
        <Button variant="secondary" iconLeft={<RefreshCw className="h-4 w-4" />} loading={recomputing} onClick={recompute}>
          Recompute Scores
        </Button>
      }
    >
      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height="h-24" />)}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Headline metrics */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Retention Rate" value={`${overview?.retentionRate ?? 0}%`} icon={<HeartPulse className="h-5 w-5" />} tone="neutral" />
            <Stat label="Churn Rate" value={`${overview?.churnRate ?? 0}%`} icon={<TrendingDown className="h-5 w-5" />} tone="rose" />
            <Stat label="At-Risk Members" value={String(overview?.atRiskMembers ?? 0)} icon={<ShieldAlert className="h-5 w-5" />} tone="steel" />
            <Stat label="Avg Retention Score" value={String(overview?.avgRetentionScore ?? 0)} icon={<HeartPulse className="h-5 w-5" />} />
          </div>

          {/* Risk breakdown chart */}
          <Card variant="solid" className="p-5">
            <h3 className="mb-3 text-sm font-semibold text-(--text-primary)">Risk distribution</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskData}>
                  <XAxis dataKey="level" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {riskData.map((d) => (
                      <Cell key={d.level} fill={RISK_COLOR[d.level as RiskLevel]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* At-risk member table with churn + renewal prediction */}
          <Card variant="solid" className="overflow-hidden p-0">
            <div className="border-b border-border px-5 py-3 text-sm font-semibold text-(--text-primary)">
              Members by churn risk
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase tracking-wide text-(--text-secondary)">
                  <tr>
                    <th className="px-4 py-2 font-medium">Member</th>
                    <th className="px-4 py-2 font-medium">Risk</th>
                    <th className="px-4 py-2 font-medium">Risk score</th>
                    <th className="px-4 py-2 font-medium">Retention</th>
                    <th className="px-4 py-2 font-medium">Days inactive</th>
                    <th className="px-4 py-2 font-medium">Renewal likelihood</th>
                    <th className="px-4 py-2 font-medium">Signals</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {churn.slice(0, 50).map((m) => {
                    const pred = predByMember.get(m.memberId);
                    return (
                      <tr key={m.memberId}>
                        <td className="px-4 py-2 font-medium text-(--text-primary)">{m.name}</td>
                        <td className="px-4 py-2"><Badge variant={riskBadge(m.riskLevel)}>{m.riskLevel}</Badge></td>
                        <td className="px-4 py-2">{m.riskScore}</td>
                        <td className="px-4 py-2 text-(--text-secondary)">{m.retentionScore}</td>
                        <td className="px-4 py-2 text-(--text-secondary)">{m.daysInactive ?? "—"}</td>
                        <td className="px-4 py-2">{pred ? `${Math.round(pred.renewal.predictionScore * 100)}%` : `${m.renewalProbability}%`}</td>
                        <td className="px-4 py-2 text-xs text-(--text-secondary)">{pred?.churn.factors.slice(0, 3).join(", ") || "—"}</td>
                      </tr>
                    );
                  })}
                  {churn.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-6 text-center text-(--text-secondary)">No member data yet. Recompute scores to populate.</td></tr>
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

function Stat({ label, value, icon, tone }: { label: string; value: string; icon: ReactNode; tone?: "neutral" | "rose" | "steel" }) {
  const color = tone === "neutral" ? "text-muted-foreground" : tone === "rose" ? "text-primary" : tone === "steel" ? "text-muted-foreground" : "text-primary";
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
