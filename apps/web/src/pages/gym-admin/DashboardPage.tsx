// apps/web/src/pages/gym-admin/DashboardPage.tsx
// Primary business intelligence view for gym owners — premium BI dashboard.

import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  TrendingUp,
  CheckSquare,
  AlertCircle,
  UserPlus,
  CreditCard,
  ClipboardCheck,
  Bell,
  BarChart2,
  Clock,
  DollarSign,
  Dumbbell,
  RefreshCw,
  ChevronRight,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

import KpiCard from "@/components/ui/KpiCard";
import Badge from "@/components/ui/Badge";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

import { useAuthStore } from "@/store/auth.store";
import { dashboardService } from "@/services/dashboard.service";
import { memberService } from "@/services/member.service";
import { membershipService, type MembershipRecord } from "@/services/membership.service";
import { paymentService } from "@/services/payment.service";
import { trainerService } from "@/services/trainer.service";
import type { DashboardAnalytics } from "@/types/analytics.types";
import type { Member } from "@/types/member.types";
import type { Trainer } from "@/types/user.types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  if (value >= 100_000) return `₹${(value / 100_000).toFixed(1)}L`;
  if (value >= 1_000) return `₹${(value / 1_000).toFixed(1)}K`;
  return `₹${value.toLocaleString("en-IN")}`;
}

function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 86_400_000);
}

function memberDisplayName(member: Member): string {
  return member.user?.name ?? `Member #${member.id.slice(-4)}`;
}

// ─── Fallback chart data (shown when API data is missing) ────────────────────

const FALLBACK_WEEKLY_ATTENDANCE = [
  { day: "Mon", count: 0 },
  { day: "Tue", count: 0 },
  { day: "Wed", count: 0 },
  { day: "Thu", count: 0 },
  { day: "Fri", count: 0 },
  { day: "Sat", count: 0 },
  { day: "Sun", count: 0 },
];

const FALLBACK_REVENUE_TREND = [
  { month: "Jan", revenue: 0 },
  { month: "Feb", revenue: 0 },
  { month: "Mar", revenue: 0 },
  { month: "Apr", revenue: 0 },
  { month: "May", revenue: 0 },
  { month: "Jun", revenue: 0 },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
}

function QuickActionButton({ icon, label, onClick, color = "indigo" }: QuickActionProps) {
  const colorMap: Record<string, string> = {
    indigo: "bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 border-indigo-500/20",
    emerald: "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20",
    blue: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20",
    amber: "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20",
    violet: "bg-violet-500/10 text-violet-500 hover:bg-violet-500/20 border-violet-500/20",
  };

  return (
    <button
      onClick={onClick}
      className={`
        group flex shrink-0 flex-col items-center gap-2.5 rounded-2xl border
        px-5 py-4 text-center transition-all duration-200
        hover:-translate-y-0.5 hover:shadow-lg active:scale-95
        ${colorMap[color] ?? colorMap.indigo}
      `}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110">
        {icon}
      </span>
      <span className="whitespace-nowrap text-xs font-semibold">{label}</span>
    </button>
  );
}

// ─── Custom Chart Tooltip ─────────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
  prefix = "",
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  prefix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-(--border) bg-(--glass-strong) px-3 py-2 text-sm shadow-xl backdrop-blur-xl">
      <p className="font-semibold text-(--text-primary)">{label}</p>
      <p className="mt-0.5 text-(--text-secondary)">
        {prefix}
        {typeof payload[0]?.value === "number"
          ? payload[0].value.toLocaleString("en-IN")
          : "—"}
      </p>
    </div>
  );
}

// ─── Skeleton loaders ─────────────────────────────────────────────────────────

function ActivityFeedSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          <Skeleton width="w-8" height="h-8" rounded="full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton height="h-3.5" width="w-3/4" />
            <Skeleton height="h-3" width="w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function MemberRowSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Skeleton width="w-9" height="h-9" rounded="full" />
            <div className="space-y-1.5">
              <Skeleton height="h-3.5" width="w-28" />
              <Skeleton height="h-3" width="w-16" />
            </div>
          </div>
          <Skeleton height="h-5" width="w-14" rounded="full" />
        </div>
      ))}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const gymId = user?.gymId ?? "";

  // ── Data queries ───────────────────────────────────────────────────────────

  const { data: dashData, isLoading: dashLoading } = useQuery({
    queryKey: ["gym-dashboard", gymId],
    queryFn: () => dashboardService.getGymDashboard(gymId),
    enabled: Boolean(gymId),
    staleTime: 60_000,
    refetchInterval: 2 * 60_000, // refresh every 2 min for real-time feel
    select: (res) => res.data as DashboardAnalytics,
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["gym-quick-stats", gymId],
    queryFn: () => dashboardService.getStats({ gymId }),
    enabled: Boolean(gymId),
    staleTime: 60_000,
    refetchInterval: 2 * 60_000,
    select: (res) => res.data,
  });

  const { data: recentMembers, isLoading: membersLoading } = useQuery({
    queryKey: ["recent-members", gymId],
    queryFn: () => memberService.list({ gymId, limit: 5, page: 1 }),
    enabled: Boolean(gymId),
    staleTime: 5 * 60_000,
    select: (res) => {
      const members = res.data?.members ?? [];
      return [...members].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, 5);
    },
  });

  const { data: upcomingRenewals, isLoading: renewalsLoading } = useQuery({
    queryKey: ["upcoming-renewals", gymId],
    queryFn: () => membershipService.list({ currentOnly: true }),
    enabled: Boolean(gymId),
    staleTime: 5 * 60_000,
    select: (memberships: MembershipRecord[]) => {
      return memberships
        .map((m) => ({
          ...m,
          daysLeft: daysUntil(m.endDate),
          planName: m.planRef?.name ?? m.plan ?? "—",
        }))
        .filter((m) => m.daysLeft >= 0 && m.daysLeft <= 7)
        .sort((a, b) => a.daysLeft - b.daysLeft)
        .slice(0, 5);
    },
  });

  const { data: paymentSummary, isLoading: paymentLoading } = useQuery({
    queryKey: ["payment-summary", gymId],
    queryFn: () => paymentService.getSummary(gymId),
    enabled: Boolean(gymId),
    staleTime: 5 * 60_000,
    select: (res) => res.data,
  });

  const { data: trainers, isLoading: trainersLoading } = useQuery({
    queryKey: ["trainers", gymId],
    queryFn: () => trainerService.list({ gymId }),
    enabled: Boolean(gymId),
    staleTime: 5 * 60_000,
    select: (res) => (res.data?.trainers ?? []) as Trainer[],
  });

  const { data: activityFeed, isLoading: activityLoading } = useQuery({
    queryKey: ["activity-feed", gymId],
    queryFn: () => dashboardService.getRecentActivity({ gymId, limit: 8 }),
    enabled: Boolean(gymId),
    staleTime: 30_000,
    refetchInterval: 60_000, // live feed — refresh every minute
    select: (res) => res.data ?? [],
  });

  // ── Derived chart data ─────────────────────────────────────────────────────

  const weeklyAttendanceData = (() => {
    if (!dashData?.attendance?.length) return FALLBACK_WEEKLY_ATTENDANCE;
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const slice = dashData.attendance.slice(-7);
    return days.map((day, i) => ({
      day,
      count: slice[i]?.count ?? 0,
    }));
  })();

  const revenueTrendData = (() => {
    if (!dashData?.revenue?.length) return FALLBACK_REVENUE_TREND;
    return dashData.revenue.slice(-6).map((r) => ({
      month: r.month,
      revenue: r.revenue,
    }));
  })();

  // ── KPI values ─────────────────────────────────────────────────────────────

  const kpiLoading = statsLoading || dashLoading;

  const activeMembers = statsData?.activeMembers ?? 0;
  const revenueThisMonth = statsData?.revenueThisMonth ?? 0;
  const attendanceToday = statsData?.attendanceToday ?? 0;
  const pendingDues = statsData?.pendingDues ?? 0;

  // Compute percentage changes from statCards if backend provides them
  const memberChange = dashData?.stats?.find((s) =>
    s.title.toLowerCase().includes("member")
  )?.changePercent ?? undefined;
  const revenueChange = dashData?.stats?.find((s) =>
    s.title.toLowerCase().includes("revenue")
  )?.changePercent ?? undefined;
  const attendanceChange = dashData?.stats?.find((s) =>
    s.title.toLowerCase().includes("attendance")
  )?.changePercent ?? undefined;

  // ── Quick actions nav ──────────────────────────────────────────────────────

  const quickActions = [
    { icon: <UserPlus className="h-5 w-5" />, label: "Add Member", path: "/gym-admin/members", color: "indigo" },
    { icon: <CreditCard className="h-5 w-5" />, label: "Record Payment", path: "/gym-admin/payments", color: "emerald" },
    { icon: <ClipboardCheck className="h-5 w-5" />, label: "Mark Attendance", path: "/gym-admin/attendance", color: "blue" },
    { icon: <Bell className="h-5 w-5" />, label: "Send Notification", path: "/gym-admin/notifications", color: "amber" },
    { icon: <BarChart2 className="h-5 w-5" />, label: "View Reports", path: "/gym-admin/analytics", color: "violet" },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-(--text-muted) uppercase tracking-wider">
            Gym Admin
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-(--text-primary)">
            Business Dashboard
          </h1>
          <p className="mt-1 text-sm text-(--text-secondary)">
            Real-time overview of your gym's operations.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="
            inline-flex items-center gap-1.5 rounded-xl border border-(--border)
            bg-(--surface-secondary) px-3 py-2 text-xs font-semibold text-(--text-secondary)
            transition-all hover:bg-(--surface-hover) hover:text-(--text-primary)
          "
          title="Refresh data"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* ── SECTION 1 — KPI Row ────────────────────────────────────────────── */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Active Members"
          value={kpiLoading ? "—" : activeMembers.toLocaleString("en-IN")}
          change={memberChange}
          changeType={
            memberChange === undefined
              ? "neutral"
              : memberChange >= 0
              ? "up"
              : "down"
          }
          changeLabel="vs last month"
          icon={<Users className="h-5 w-5" />}
          color="indigo"
          loading={kpiLoading}
        />

        <KpiCard
          title="Revenue This Month"
          value={kpiLoading ? "—" : formatCurrency(revenueThisMonth)}
          change={revenueChange}
          changeType={
            revenueChange === undefined
              ? "neutral"
              : revenueChange >= 0
              ? "up"
              : "down"
          }
          changeLabel="vs last month"
          icon={<TrendingUp className="h-5 w-5" />}
          color="emerald"
          loading={kpiLoading}
        />

        <KpiCard
          title="Today's Attendance"
          value={kpiLoading ? "—" : attendanceToday.toLocaleString("en-IN")}
          change={attendanceChange}
          changeType={
            attendanceChange === undefined
              ? "neutral"
              : attendanceChange >= 0
              ? "up"
              : "down"
          }
          changeLabel="vs yesterday"
          icon={<CheckSquare className="h-5 w-5" />}
          color="sky"
          loading={kpiLoading}
        />

        <KpiCard
          title="Pending Dues"
          value={kpiLoading ? "—" : formatCurrency(pendingDues)}
          changeLabel="requires action"
          changeType={pendingDues > 0 ? "down" : "neutral"}
          change={pendingDues > 0 ? undefined : 0}
          icon={<AlertCircle className="h-5 w-5" />}
          color="amber"
          loading={kpiLoading}
        />
      </div>

      {/* ── SECTION 2 — Quick Actions ─────────────────────────────────────── */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-(--text-muted)">
          Quick Actions
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
          {quickActions.map((action) => (
            <QuickActionButton
              key={action.label}
              icon={action.icon}
              label={action.label}
              color={action.color}
              onClick={() => navigate(action.path)}
            />
          ))}
        </div>
      </div>

      {/* ── SECTION 3 — Charts Row ────────────────────────────────────────── */}
      <div className="grid gap-6 xl:grid-cols-2">

        {/* Attendance Bar Chart */}
        <Card variant="default">
          <CardHeader
            title="Attendance This Week"
            subtitle="Daily check-ins (Mon – Sun)"
            action={
              <button
                onClick={() => navigate("/gym-admin/attendance")}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-500 hover:text-indigo-400"
              >
                View all <ChevronRight className="h-3.5 w-3.5" />
              </button>
            }
          />
          <CardContent className="pt-4">
            {dashLoading ? (
              <Skeleton height="h-52" width="w-full" rounded="lg" />
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart
                  data={weeklyAttendanceData}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#818cf8" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(148,163,184,0.12)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 12, fill: "var(--text-secondary, #94a3b8)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--text-secondary, #94a3b8)" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: "rgba(99,102,241,0.06)", radius: 6 }}
                  />
                  <Bar
                    dataKey="count"
                    name="Check-ins"
                    fill="url(#barGradient)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Revenue Area Chart */}
        <Card variant="default">
          <CardHeader
            title="Revenue Trend"
            subtitle="Last 6 months"
            action={
              <button
                onClick={() => navigate("/gym-admin/analytics")}
                className="flex items-center gap-1 text-xs font-semibold text-emerald-500 hover:text-emerald-400"
              >
                Full report <ChevronRight className="h-3.5 w-3.5" />
              </button>
            }
          />
          <CardContent className="pt-4">
            {dashLoading ? (
              <Skeleton height="h-52" width="w-full" rounded="lg" />
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart
                  data={revenueTrendData}
                  margin={{ top: 4, right: 4, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(148,163,184,0.12)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: "var(--text-secondary, #94a3b8)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--text-secondary, #94a3b8)" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) =>
                      v >= 1000 ? `₹${(v / 1000).toFixed(0)}K` : `₹${v}`
                    }
                  />
                  <Tooltip
                    content={<ChartTooltip prefix="₹" />}
                    cursor={{ stroke: "#10b981", strokeWidth: 1, strokeDasharray: "4 4" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fill="url(#revenueGradient)"
                    dot={{ fill: "#10b981", r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── SECTION 4 — Three info cards ──────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* A — Recent Members */}
        <Card variant="default">
          <CardHeader
            title="Recent Members"
            subtitle="Newest joiners"
            action={
              <button
                onClick={() => navigate("/gym-admin/members")}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-500 hover:text-indigo-400"
              >
                All <ChevronRight className="h-3.5 w-3.5" />
              </button>
            }
          />
          <CardContent>
            {membersLoading ? (
              <MemberRowSkeleton />
            ) : !recentMembers?.length ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="mb-2 h-8 w-8 text-(--text-muted)" />
                <p className="text-sm text-(--text-muted)">No members yet</p>
              </div>
            ) : (
              <ul className="divide-y divide-(--border)">
                {recentMembers.map((member) => {
                  const plan = member.activeMembership?.planName ?? "—";
                  const isActive = member.status === "ACTIVE";
                  return (
                    <li
                      key={member.id}
                      className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {/* Avatar */}
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-sm font-bold text-indigo-500">
                          {memberDisplayName(member).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-(--text-primary)">
                            {memberDisplayName(member)}
                          </p>
                          <p className="truncate text-xs text-(--text-muted)">{plan}</p>
                        </div>
                      </div>
                      <Badge
                        variant={isActive ? "success" : "warning"}
                        dot
                        size="sm"
                      >
                        {isActive ? "Active" : member.status.charAt(0) + member.status.slice(1).toLowerCase()}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* B — Upcoming Renewals */}
        <Card variant="default">
          <CardHeader
            title="Upcoming Renewals"
            subtitle="Expiring in 7 days"
            action={
              <button
                onClick={() => navigate("/gym-admin/memberships")}
                className="flex items-center gap-1 text-xs font-semibold text-amber-500 hover:text-amber-400"
              >
                All <ChevronRight className="h-3.5 w-3.5" />
              </button>
            }
          />
          <CardContent>
            {renewalsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <Skeleton height="h-3.5" width="w-1/2" />
                    <Skeleton height="h-5" width="w-16" rounded="full" />
                  </div>
                ))}
              </div>
            ) : !upcomingRenewals?.length ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <RefreshCw className="mb-2 h-8 w-8 text-(--text-muted)" />
                <p className="text-sm text-(--text-muted)">No renewals due</p>
              </div>
            ) : (
              <ul className="divide-y divide-(--border)">
                {upcomingRenewals.map((m) => {
                  const urgency =
                    m.daysLeft === 0
                      ? "danger"
                      : m.daysLeft <= 2
                      ? "warning"
                      : "info";
                  const label =
                    m.daysLeft === 0
                      ? "Today"
                      : m.daysLeft === 1
                      ? "Tomorrow"
                      : `${m.daysLeft}d left`;
                  return (
                    <li
                      key={m.id}
                      className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-(--text-primary)">
                          {m.planName}
                        </p>
                        <p className="truncate text-xs text-(--text-muted)">
                          Ends {new Date(m.endDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                      </div>
                      <Badge variant={urgency} size="sm" dot>
                        {label}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* C — Today's Activity Feed */}
        <Card variant="default">
          <CardHeader
            title="Today's Activity"
            subtitle="Live check-ins & payments"
            action={
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-500">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Live
              </span>
            }
          />
          <CardContent>
            {activityLoading ? (
              <ActivityFeedSkeleton />
            ) : !activityFeed?.length ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Activity className="mb-2 h-8 w-8 text-(--text-muted)" />
                <p className="text-sm text-(--text-muted)">No activity yet today</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {activityFeed.map((item) => {
                  const isPayment = item.type === "payment" || item.message?.toLowerCase().includes("payment");
                  return (
                    <li key={item.id} className="flex items-start gap-3">
                      <div
                        className={`
                          flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs
                          ${isPayment
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-indigo-500/10 text-indigo-500"
                          }
                        `}
                      >
                        {isPayment
                          ? <DollarSign className="h-3.5 w-3.5" />
                          : <ClipboardCheck className="h-3.5 w-3.5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-snug text-(--text-primary)">
                          {item.message}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-(--text-muted)">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(item.time)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── SECTION 5 — Bottom Row: Payment Summary + Trainer Overview ─────── */}
      <div className="grid gap-6 xl:grid-cols-5">

        {/* Payment Summary (60%) */}
        <Card variant="default" className="xl:col-span-3">
          <CardHeader
            title="Payment Summary"
            subtitle="Collections overview"
            action={
              <button
                onClick={() => navigate("/gym-admin/payments")}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-500 hover:text-indigo-400"
              >
                Manage <ChevronRight className="h-3.5 w-3.5" />
              </button>
            }
          />
          <CardContent>
            {paymentLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-(--border) px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Skeleton width="w-8" height="h-8" rounded="lg" />
                      <Skeleton height="h-4" width="w-28" />
                    </div>
                    <Skeleton height="h-4" width="w-20" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2.5">
                {/* Total Collected */}
                <div className="flex items-center justify-between rounded-2xl bg-emerald-500/5 border border-emerald-500/15 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-(--text-primary)">Total Collected</p>
                      <p className="text-xs text-(--text-muted)">All time</p>
                    </div>
                  </div>
                  <p className="text-base font-black text-emerald-500">
                    {formatCurrency(paymentSummary?.totalRevenue ?? 0)}
                  </p>
                </div>

                {/* Paid This Month */}
                <div className="flex items-center justify-between rounded-2xl border border-(--border) bg-(--surface-secondary) px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10">
                      <CreditCard className="h-4 w-4 text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-(--text-primary)">Paid This Month</p>
                      <p className="text-xs text-(--text-muted)">
                        {paymentSummary?.transactionCount ?? 0} transactions
                      </p>
                    </div>
                  </div>
                  <p className="text-base font-black text-indigo-500">
                    {formatCurrency(paymentSummary?.totalPaid ?? 0)}
                  </p>
                </div>

                {/* Pending */}
                <div className="flex items-center justify-between rounded-2xl border border-amber-500/15 bg-amber-500/5 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-(--text-primary)">Pending</p>
                      <p className="text-xs text-(--text-muted)">Awaiting collection</p>
                    </div>
                  </div>
                  <p className="text-base font-black text-amber-500">
                    {formatCurrency(paymentSummary?.totalPending ?? 0)}
                  </p>
                </div>

                {/* Overdue */}
                <div className="flex items-center justify-between rounded-2xl border border-red-500/15 bg-red-500/5 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-(--text-primary)">Overdue</p>
                      <p className="text-xs text-red-400 font-medium">Requires immediate action</p>
                    </div>
                  </div>
                  <p className="text-base font-black text-red-500">
                    {formatCurrency(paymentSummary?.totalOverdue ?? 0)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trainer Overview (40%) */}
        <Card variant="default" className="xl:col-span-2">
          <CardHeader
            title="Trainer Overview"
            subtitle="Staff & assigned members"
            action={
              <button
                onClick={() => navigate("/gym-admin/trainers")}
                className="flex items-center gap-1 text-xs font-semibold text-violet-500 hover:text-violet-400"
              >
                All <ChevronRight className="h-3.5 w-3.5" />
              </button>
            }
          />
          <CardContent>
            {trainersLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton width="w-9" height="h-9" rounded="full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton height="h-3.5" width="w-3/4" />
                      <Skeleton height="h-3" width="w-1/2" />
                    </div>
                    <Skeleton height="h-6" width="w-10" rounded="lg" />
                  </div>
                ))}
              </div>
            ) : !trainers?.length ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Dumbbell className="mb-2 h-8 w-8 text-(--text-muted)" />
                <p className="text-sm text-(--text-muted)">No trainers added yet</p>
                <button
                  onClick={() => navigate("/gym-admin/trainers")}
                  className="mt-2 text-xs font-semibold text-indigo-500 hover:underline"
                >
                  Add trainer
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-(--border)">
                {trainers.slice(0, 6).map((trainer) => (
                  <li
                    key={trainer.id}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    {/* Avatar */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-sm font-bold text-violet-500">
                      {trainer.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-(--text-primary)">
                        {trainer.name}
                      </p>
                      <p className="truncate text-xs text-(--text-muted)">
                        {(trainer as Trainer).specialization ?? "General Trainer"}
                      </p>
                    </div>

                    {/* Active badge */}
                    <Badge variant="primary" size="sm">
                      Active
                    </Badge>
                  </li>
                ))}

                {trainers.length > 6 && (
                  <li className="pt-3 text-center">
                    <button
                      onClick={() => navigate("/gym-admin/trainers")}
                      className="text-xs font-semibold text-indigo-500 hover:underline"
                    >
                      +{trainers.length - 6} more trainers
                    </button>
                  </li>
                )}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
