import { useEffect, useState, type ReactNode } from "react";
import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip,
} from "recharts";
import { IndianRupee, TrendingUp, Building2, Clock, TrendingDown } from "lucide-react";
import Page from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/common/EmptyState";
import {
  billingService, type SaaSOverview, type RevenuePoint,
} from "@/services/billing.service";

const inr = (n: number) =>
  `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export default function BillingPage() {
  const [overview, setOverview] = useState<SaaSOverview | null>(null);
  const [trend, setTrend] = useState<RevenuePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([billingService.adminOverview(), billingService.adminRevenueTrend(6)])
      .then(([o, t]) => {
        if (!active) return;
        setOverview(o);
        setTrend(t);
      })
      .catch(() => active && setError("Failed to load SaaS billing analytics."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <Page title="SaaS Billing" description="GymPro platform revenue — subscriptions across all gyms.">
      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height="h-24" />)}
        </div>
      ) : error ? (
        <EmptyState title="Couldn't load analytics" message={error} />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="MRR" value={inr(overview?.mrr ?? 0)} icon={<IndianRupee className="h-5 w-5" />} tone="indigo" />
            <Stat label="ARR" value={inr(overview?.arr ?? 0)} icon={<TrendingUp className="h-5 w-5" />} tone="emerald" />
            <Stat label="Active Gyms" value={String(overview?.activeGyms ?? 0)} icon={<Building2 className="h-5 w-5" />} tone="indigo" />
            <Stat label="Trial Gyms" value={String(overview?.trialGyms ?? 0)} icon={<Clock className="h-5 w-5" />} tone="amber" />
          </div>

          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <Card variant="solid" className="p-5">
              <h3 className="mb-4 text-sm font-semibold text-(--text-primary)">Revenue (last 6 months)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="saasRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value) => inr(Number(value))} contentStyle={{ borderRadius: 12, border: "1px solid rgba(148,163,184,0.15)", backgroundColor: "rgba(15,23,42,0.95)", color: "#fff" }} />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#saasRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            <Card variant="solid" className="p-5">
              <h3 className="mb-4 text-sm font-semibold text-(--text-primary)">Churn</h3>
              <div className="flex items-center gap-3">
                <TrendingDown className="h-8 w-8 text-red-500" />
                <div>
                  <div className="text-3xl font-black text-(--text-primary)">{overview?.churnRate ?? 0}%</div>
                  <div className="text-xs text-(--text-secondary)">last 30 days</div>
                </div>
              </div>
              <p className="mt-4 text-sm text-(--text-secondary)">
                {overview?.cancelledLast30 ?? 0} subscription{(overview?.cancelledLast30 ?? 0) !== 1 ? "s" : ""} cancelled in the last 30 days.
              </p>
            </Card>
          </div>
        </div>
      )}
    </Page>
  );
}

function Stat({ label, value, icon, tone }: { label: string; value: string; icon: ReactNode; tone: "indigo" | "emerald" | "amber" }) {
  const c = tone === "emerald" ? "text-emerald-500" : tone === "amber" ? "text-amber-500" : "text-indigo-500";
  return (
    <Card variant="solid" className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-(--text-secondary)">{label}</span>
        <span className={c}>{icon}</span>
      </div>
      <div className="mt-2 text-2xl font-bold text-(--text-primary)">{value}</div>
    </Card>
  );
}
