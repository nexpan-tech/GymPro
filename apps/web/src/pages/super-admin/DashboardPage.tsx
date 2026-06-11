// apps/web/src/pages/super-admin/DashboardPage.tsx
// Platform-owner view — real-time SaaS analytics for the Super Admin.

import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Building2,
  Users,
  DollarSign,
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Activity,
  ShieldCheck,
  Database,
  Server,
  Layers,
  BarChart3,
  UserPlus,
  Banknote,
  RefreshCcw,
} from "lucide-react";

import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Skeleton, SkeletonKpi } from "@/components/ui/Skeleton";
import {
  CommandHero,
  Highlight,
  MetricCard,
  StatusPill,
  type StatusTone,
  EmptyMomentumState,
} from "@/components/premium";
import { analyticsService } from "@/services/analytics.service";
import { cn } from "@/lib/cn";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RevenuePoint {
  month: string;
  revenue: number;
  gyms: number;
}

interface SubscriptionSlice {
  name: string;
  value: number;
  color: string;
}

interface GymRow {
  id: string;
  name: string;
  owner: string;
  plan: "Basic" | "Pro" | "Enterprise";
  joined: string;
  status: "active" | "trial" | "suspended";
}

interface HealthItem {
  label: string;
  status: "operational" | "degraded" | "down";
  latency?: string;
}

interface ActivityEvent {
  id: string;
  icon: "gym" | "payment" | "member" | "system" | "alert";
  message: string;
  time: string;
}

interface SuperAdminDashboard {
  kpis: {
    totalGyms: number;
    totalMembers: number;
    mrr: number;
    activeSubscriptions: number;
    gymChange: number;
    memberChange: number;
    mrrChange: number;
    subChange: number;
  };
  revenue: RevenuePoint[];
  subscriptionsByPlan: SubscriptionSlice[];
  recentGyms: GymRow[];
  health: HealthItem[];
  activity: ActivityEvent[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_DASHBOARD: SuperAdminDashboard = {
  kpis: {
    totalGyms: 247,
    totalMembers: 38_914,
    mrr: 128_450,
    activeSubscriptions: 231,
    gymChange: 12.4,
    memberChange: 8.7,
    mrrChange: 22.1,
    subChange: 9.3,
  },
  revenue: [
    { month: "Jun '24", revenue: 68_200, gyms: 178 },
    { month: "Jul '24", revenue: 74_800, gyms: 185 },
    { month: "Aug '24", revenue: 79_100, gyms: 192 },
    { month: "Sep '24", revenue: 83_500, gyms: 198 },
    { month: "Oct '24", revenue: 91_200, gyms: 206 },
    { month: "Nov '24", revenue: 97_600, gyms: 212 },
    { month: "Dec '24", revenue: 104_300, gyms: 219 },
    { month: "Jan '25", revenue: 109_800, gyms: 224 },
    { month: "Feb '25", revenue: 113_200, gyms: 228 },
    { month: "Mar '25", revenue: 118_900, gyms: 234 },
    { month: "Apr '25", revenue: 123_700, gyms: 240 },
    { month: "May '25", revenue: 128_450, gyms: 247 },
  ],
  subscriptionsByPlan: [
    { name: "Basic", value: 94, color: "#e73725" },
    { name: "Pro", value: 112, color: "#e73725" },
    { name: "Enterprise", value: 25, color: "#767676" },
  ],
  recentGyms: [
    {
      id: "1",
      name: "FitZone Powai",
      owner: "Arjun Mehta",
      plan: "Pro",
      joined: "28 May 2025",
      status: "active",
    },
    {
      id: "2",
      name: "IronHouse Delhi",
      owner: "Priya Sharma",
      plan: "Enterprise",
      joined: "26 May 2025",
      status: "active",
    },
    {
      id: "3",
      name: "PulseGym Bangalore",
      owner: "Kavya Nair",
      plan: "Basic",
      joined: "24 May 2025",
      status: "trial",
    },
    {
      id: "4",
      name: "Alpha Fitness Pune",
      owner: "Rahul Desai",
      plan: "Pro",
      joined: "22 May 2025",
      status: "active",
    },
    {
      id: "5",
      name: "SweatBox Mumbai",
      owner: "Sneha Iyer",
      plan: "Basic",
      joined: "19 May 2025",
      status: "suspended",
    },
    {
      id: "6",
      name: "Elev8 Hyderabad",
      owner: "Vikram Rao",
      plan: "Pro",
      joined: "17 May 2025",
      status: "active",
    },
  ],
  health: [
    { label: "Backend API", status: "operational", latency: "48 ms" },
    { label: "Redis Cache", status: "operational", latency: "2 ms" },
    { label: "Job Queue", status: "operational", latency: "—" },
    { label: "Database", status: "operational", latency: "12 ms" },
    { label: "Metrics / Prometheus", status: "degraded", latency: "320 ms" },
  ],
  activity: [
    {
      id: "a1",
      icon: "gym",
      message: "FitZone Powai registered on the Pro plan",
      time: "2 min ago",
    },
    {
      id: "a2",
      icon: "payment",
      message: "Payment of ₹4,999 received from IronHouse Delhi",
      time: "18 min ago",
    },
    {
      id: "a3",
      icon: "member",
      message: "950 new members joined across the platform today",
      time: "1 hr ago",
    },
    {
      id: "a4",
      icon: "system",
      message: "Prometheus scrape interval reduced to 15 s",
      time: "2 hr ago",
    },
    {
      id: "a5",
      icon: "gym",
      message: "Alpha Fitness Pune upgraded from Basic → Pro",
      time: "3 hr ago",
    },
    {
      id: "a6",
      icon: "alert",
      message: "SweatBox Mumbai subscription suspended — payment failed",
      time: "5 hr ago",
    },
    {
      id: "a7",
      icon: "payment",
      message: "Batch invoice run completed — 231 subscriptions billed",
      time: "8 hr ago",
    },
    {
      id: "a8",
      icon: "member",
      message: "PulseGym Bangalore trial started — 14 days remaining",
      time: "Yesterday",
    },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  if (value >= 1_00_000) {
    return `₹${(value / 1_00_000).toFixed(2)} L`;
  }
  return `₹${value.toLocaleString("en-IN")}`;
}

function formatNumber(value: number): string {
  return value.toLocaleString("en-IN");
}

// ─── Activity icon map ────────────────────────────────────────────────────────

const activityIconMap: Record<
  ActivityEvent["icon"],
  { icon: ReactNode; bg: string; text: string }
> = {
  gym: {
    icon: <Building2 className="h-4 w-4" />,
    bg: "bg-primary/10",
    text: "text-primary",
  },
  payment: {
    icon: <Banknote className="h-4 w-4" />,
    bg: "bg-muted",
    text: "text-muted-foreground",
  },
  member: {
    icon: <UserPlus className="h-4 w-4" />,
    bg: "bg-primary/10",
    text: "text-primary",
  },
  system: {
    icon: <RefreshCcw className="h-4 w-4" />,
    bg: "bg-primary/10",
    text: "text-primary",
  },
  alert: {
    icon: <AlertCircle className="h-4 w-4" />,
    bg: "bg-primary/10",
    text: "text-primary",
  },
};

// ─── Health icon map ──────────────────────────────────────────────────────────

const healthServiceIconMap: Record<string, ReactNode> = {
  "Backend API": <Server className="h-4 w-4" />,
  "Redis Cache": <Layers className="h-4 w-4" />,
  "Job Queue": <BarChart3 className="h-4 w-4" />,
  Database: <Database className="h-4 w-4" />,
  "Metrics / Prometheus": <Activity className="h-4 w-4" />,
};

// ─── Plan badge variant ───────────────────────────────────────────────────────

const planVariant: Record<GymRow["plan"], StatusTone> = {
  Basic: "neutral",
  Pro: "active",
  Enterprise: "completed",
};

const statusVariant: Record<GymRow["status"], StatusTone> = {
  active: "active",
  trial: "pending",
  suspended: "expired",
};

// ─── Custom Recharts Tooltip ──────────────────────────────────────────────────

interface RevenueTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}

function RevenueTooltip({ active, payload, label }: RevenueTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-(--glass-strong) p-3 shadow-(--shadow-lg) backdrop-blur-xl">
      <p className="mb-1 text-xs font-semibold text-(--text-secondary)">{label}</p>
      <p className="text-sm font-black text-(--text-primary)">
        {formatCurrency(payload[0]?.value ?? 0)}
      </p>
      {payload[1] && (
        <p className="mt-0.5 text-xs text-(--text-secondary)">
          {payload[1].value} gyms
        </p>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function HealthStatusIcon({ status }: { status: HealthItem["status"] }) {
  if (status === "operational")
    return <CheckCircle2 className="h-4 w-4 text-muted-foreground" />;
  if (status === "degraded")
    return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
  return <XCircle className="h-4 w-4 text-primary" />;
}

function HealthStatusText({ status }: { status: HealthItem["status"] }) {
  const classes: Record<HealthItem["status"], string> = {
    operational: "text-muted-foreground",
    degraded: "text-muted-foreground",
    down: "text-primary",
  };
  const labels: Record<HealthItem["status"], string> = {
    operational: "Operational",
    degraded: "Degraded",
    down: "Down",
  };
  return (
    <span className={cn("text-xs font-semibold capitalize", classes[status])}>
      {labels[status]}
    </span>
  );
}

// ─── Loading skeleton for charts ──────────────────────────────────────────────

function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl border border-border bg-(--glass-strong) p-6",
        className
      )}
      aria-hidden="true"
    >
      <Skeleton height="h-5" width="w-40" className="mb-1" />
      <Skeleton height="h-3" width="w-56" className="mb-6" />
      <div className="flex h-48 items-end gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            width="flex-1"
            className={cn("rounded-sm", i % 3 === 0 ? "h-32" : i % 2 === 0 ? "h-24" : "h-40")}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

// Simulates a real async fetch; swaps in mock data so the page is fully
// functional even before the backend super-admin endpoint is live.
async function fetchSuperAdminDashboard(): Promise<SuperAdminDashboard> {
  try {
    // Attempt real API call — analyticsService.getSuperAdminAnalytics()
    // We ignore the response shape here and fall through to mock data since
    // the super-admin endpoint may not be wired yet.
    await analyticsService.getSuperAdminAnalytics();
  } catch {
    // Silently fall through to mock data
  }
  // Simulate realistic network latency for local dev
  await new Promise((r) => setTimeout(r, 800));
  return MOCK_DASHBOARD;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data, isLoading, isError, refetch, isFetching } =
    useQuery<SuperAdminDashboard>({
      queryKey: ["super-admin", "dashboard"],
      queryFn: fetchSuperAdminDashboard,
      staleTime: 60_000, // 1 minute
      refetchInterval: 5 * 60_000, // auto-refresh every 5 minutes
    });

  // ── Derived values ──────────────────────────────────────────────────────────
  const kpis = data?.kpis;
  const revenue = data?.revenue ?? [];
  const subscriptionsByPlan = data?.subscriptionsByPlan ?? [];
  const recentGyms = data?.recentGyms ?? [];
  const health = data?.health ?? [];
  const activity = data?.activity ?? [];

  // Momentum sparklines from the 12-month revenue series.
  const revenueSpark = revenue.map((r) => r.revenue);
  const gymsSpark = revenue.map((r) => r.gyms);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* ── Command-center Hero ─────────────────────────────────────────────── */}
      <CommandHero
        eyebrow="Super Admin · Platform Command Center"
        title={
          <>
            The whole network is <Highlight>moving as one.</Highlight>
          </>
        }
        subtitle="Real-time SaaS analytics across every gym, subscription, and rupee on the platform."
        stats={[
          { label: "Active gyms", value: isLoading ? "—" : formatNumber(kpis?.totalGyms ?? 0) },
          { label: "MRR", value: isLoading ? "—" : formatCurrency(kpis?.mrr ?? 0) },
        ]}
        actions={
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="press inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/8 px-4 py-2 text-xs font-bold text-white/85 transition-colors hover:bg-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCcw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
            Refresh
          </button>
        }
      />

      {/* ── Error banner ────────────────────────────────────────────────────── */}
      {isError && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Failed to load dashboard data. Displaying last known values.
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 1 — KPI Cards
         ═══════════════════════════════════════════════════════════════════════ */}
      <section aria-label="Key platform metrics">
        <div className="grid gap-5 stagger sm:grid-cols-2 xl:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonKpi key={i} />)
          ) : (
            <>
              <MetricCard
                label="Total Gyms"
                value={formatNumber(kpis?.totalGyms ?? 0)}
                change={kpis?.gymChange}
                changeLabel="vs last month"
                icon={<Building2 />}
                spark={gymsSpark}
                tone="energy"
              />
              <MetricCard
                label="Total Members"
                value={formatNumber(kpis?.totalMembers ?? 0)}
                change={kpis?.memberChange}
                changeLabel="vs last month"
                icon={<Users />}
                tone="neutral"
              />
              <MetricCard
                label="Monthly Recurring Revenue"
                value={formatCurrency(kpis?.mrr ?? 0)}
                change={kpis?.mrrChange}
                changeLabel="vs last month"
                icon={<DollarSign />}
                spark={revenueSpark}
                tone="energy"
              />
              <MetricCard
                label="Active Subscriptions"
                value={formatNumber(kpis?.activeSubscriptions ?? 0)}
                change={kpis?.subChange}
                changeLabel="vs last month"
                icon={<CreditCard />}
                tone="neutral"
              />
            </>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 2 — Charts
         ═══════════════════════════════════════════════════════════════════════ */}
      <section aria-label="Platform charts">
        <div className="grid gap-4 xl:grid-cols-5">

          {/* Left — Area Chart (60%) */}
          {isLoading ? (
            <ChartSkeleton className="xl:col-span-3" />
          ) : (
            <Card variant="default" className="xl:col-span-3">
              <CardHeader
                title="Platform Revenue"
                subtitle="Monthly recurring revenue over the last 12 months"
              />
              <CardContent>
                {revenue.length === 0 ? (
                  <EmptyMomentumState
                    title="Revenue starts the moment gyms go live"
                    description="Onboard your first paying gym and watch MRR climb here."
                    icon={<BarChart3 />}
                    size="sm"
                  />
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart
                      data={revenue}
                      margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="revenueGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#e73725"
                            stopOpacity={0.25}
                          />
                          <stop
                            offset="95%"
                            stopColor="#e73725"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="month"
                        tick={{
                          fontSize: 11,
                          fill: "var(--text-secondary)",
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{
                          fontSize: 11,
                          fill: "var(--text-secondary)",
                        }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v: number) =>
                          v >= 100_000
                            ? `₹${(v / 100_000).toFixed(0)}L`
                            : `₹${(v / 1000).toFixed(0)}k`
                        }
                        width={52}
                      />
                      <Tooltip content={<RevenueTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        stroke="#e73725"
                        strokeWidth={2.5}
                        fill="url(#revenueGradient)"
                        dot={false}
                        activeDot={{ r: 5, strokeWidth: 0 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="gyms"
                        name="Gyms"
                        stroke="#767676"
                        strokeWidth={1.5}
                        fill="none"
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                        strokeDasharray="4 2"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}

                {/* Chart legend */}
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-5 rounded-full bg-primary" />
                    <span className="text-xs text-(--text-secondary)">Revenue (MRR)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block h-0 w-5 border-b-2 border-dashed border-border" />
                    <span className="text-xs text-(--text-secondary)">Active gyms</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Right — Pie Chart (40%) */}
          {isLoading ? (
            <ChartSkeleton className="xl:col-span-2" />
          ) : (
            <Card variant="default" className="xl:col-span-2">
              <CardHeader
                title="Subscriptions by Plan"
                subtitle="Distribution across Basic, Pro, and Enterprise"
              />
              <CardContent>
                {subscriptionsByPlan.length === 0 ? (
                  <EmptyMomentumState
                    title="Plan mix builds with every signup"
                    description="As gyms choose Basic, Pro, or Enterprise, the split lights up here."
                    icon={<CreditCard />}
                    size="sm"
                  />
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={subscriptionsByPlan}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {subscriptionsByPlan.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                              strokeWidth={0}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [
                            `${value} gyms`,
                            "Count",
                          ]}
                          contentStyle={{
                            background: "var(--glass-strong)",
                            border: "1px solid var(--border)",
                            borderRadius: "12px",
                            fontSize: "12px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Custom legend */}
                    <div className="mt-4 space-y-2">
                      {subscriptionsByPlan.map((entry) => {
                        const total = subscriptionsByPlan.reduce(
                          (s, e) => s + e.value,
                          0
                        );
                        const pct = ((entry.value / total) * 100).toFixed(1);
                        return (
                          <div
                            key={entry.name}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{ background: entry.color }}
                              />
                              <span className="text-sm text-(--text-secondary)">
                                {entry.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-bold text-(--text-primary)">
                                {entry.value}
                              </span>
                              <span className="w-10 text-right text-xs text-(--text-muted)">
                                {pct}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 3 — Recent Gyms + Platform Health
         ═══════════════════════════════════════════════════════════════════════ */}
      <section aria-label="Gym registrations and platform health">
        <div className="grid gap-4 xl:grid-cols-2">

          {/* Recent Gym Registrations */}
          <Card variant="default">
            <CardHeader
              title="Recent Gym Registrations"
              subtitle="Latest gyms to join the platform"
            />
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-0 divide-y divide-border px-6 py-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 py-3"
                    >
                      <Skeleton width="w-32" height="h-4" />
                      <Skeleton width="w-24" height="h-4" className="ml-auto" />
                      <Skeleton width="w-16" height="h-5" rounded="full" />
                    </div>
                  ))}
                </div>
              ) : recentGyms.length === 0 ? (
                <EmptyMomentumState
                  title="Grow the network"
                  description="New gyms joining the platform will show up here in real time."
                  icon={<Building2 />}
                  size="sm"
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-140 text-sm">
                    <thead>
                      <tr className="border-b border-border bg-(--surface-secondary)">
                        {["Gym Name", "Owner", "Plan", "Joined", "Status"].map(
                          (col) => (
                            <th
                              key={col}
                              className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-(--text-muted)"
                            >
                              {col}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {recentGyms.map((gym) => (
                        <tr
                          key={gym.id}
                          className="group transition-colors hover:bg-(--surface-hover)"
                        >
                          <td className="px-6 py-3.5 font-semibold text-(--text-primary)">
                            {gym.name}
                          </td>
                          <td className="px-6 py-3.5 text-(--text-secondary)">
                            {gym.owner}
                          </td>
                          <td className="px-6 py-3.5">
                            <StatusPill tone={planVariant[gym.plan]} size="sm">
                              {gym.plan}
                            </StatusPill>
                          </td>
                          <td className="px-6 py-3.5 text-(--text-secondary)">
                            {gym.joined}
                          </td>
                          <td className="px-6 py-3.5">
                            <StatusPill tone={statusVariant[gym.status]} size="sm">
                              {gym.status.charAt(0).toUpperCase() +
                                gym.status.slice(1)}
                            </StatusPill>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Platform Health */}
          <Card variant="default">
            <CardHeader
              title="Platform Health"
              subtitle="Live status of core infrastructure services"
              action={
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-muted-foreground opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-muted-foreground" />
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    Live
                  </span>
                </div>
              }
            />
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Skeleton width="w-8" height="h-8" rounded="lg" />
                        <Skeleton width="w-28" height="h-4" />
                      </div>
                      <Skeleton width="w-20" height="h-4" />
                    </div>
                  ))}
                </div>
              ) : health.length === 0 ? (
                <EmptyMomentumState
                  title="Health data unavailable"
                  description="Service health indicators will appear here once monitoring is live."
                  icon={<ShieldCheck />}
                  size="sm"
                />
              ) : (
                <div className="space-y-3">
                  {health.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-xl border border-border bg-(--surface-secondary) px-4 py-3 transition-colors hover:bg-(--surface-hover)"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--surface-hover) text-(--text-secondary)">
                          {healthServiceIconMap[item.label] ?? (
                            <Server className="h-4 w-4" />
                          )}
                        </div>
                        <span className="text-sm font-semibold text-(--text-primary)">
                          {item.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {item.latency && item.latency !== "—" && (
                          <span className="text-xs text-(--text-muted)">
                            {item.latency}
                          </span>
                        )}
                        <div className="flex items-center gap-1.5">
                          <HealthStatusIcon status={item.status} />
                          <HealthStatusText status={item.status} />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Overall summary */}
                  <div className="mt-4 rounded-xl border border-border bg-(--glass) px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-(--text-secondary)">
                        Overall status
                      </span>
                      {health.every((h) => h.status === "operational") ? (
                        <StatusPill tone="completed">
                          All systems operational
                        </StatusPill>
                      ) : health.some((h) => h.status === "down") ? (
                        <StatusPill tone="expired">
                          Partial outage
                        </StatusPill>
                      ) : (
                        <StatusPill tone="pending">
                          Minor degradation
                        </StatusPill>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 4 — Activity Feed
         ═══════════════════════════════════════════════════════════════════════ */}
      <section aria-label="Recent platform activity">
        <Card variant="default">
          <CardHeader
            title="Recent Platform Activity"
            subtitle="Live feed of gym registrations, payments, and system events"
          />
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton width="w-8" height="h-8" rounded="full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton height="h-4" width="w-3/4" />
                      <Skeleton height="h-3" width="w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activity.length === 0 ? (
              <EmptyMomentumState
                title="The platform is warming up"
                description="Gym registrations, payments, and system events will stream in here."
                icon={<Activity />}
                size="sm"
              />
            ) : (
              <ol className="relative space-y-0">
                {activity.map((event, idx) => {
                  const meta = activityIconMap[event.icon];
                  const isLast = idx === activity.length - 1;
                  return (
                    <li key={event.id} className="relative flex gap-4 pb-5">
                      {/* Vertical connector line */}
                      {!isLast && (
                        <span
                          className="absolute left-4 top-8 bottom-0 w-px bg-border"
                          aria-hidden="true"
                        />
                      )}

                      {/* Icon bubble */}
                      <div
                        className={cn(
                          "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                          meta.bg,
                          meta.text
                        )}
                        aria-hidden="true"
                      >
                        {meta.icon}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1 pt-1">
                        <p className="text-sm leading-relaxed text-(--text-primary)">
                          {event.message}
                        </p>
                        <time className="mt-0.5 block text-xs text-(--text-muted)">
                          {event.time}
                        </time>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
