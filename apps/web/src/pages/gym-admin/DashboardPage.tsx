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
  UserCheck,
  IdCard,
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

import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  CommandHero,
  Highlight,
  MetricCard,
  SectionHeader,
  StatusPill,
  StatTile,
  ActionCard,
  EmptyMomentumState,
} from "@/components/premium";

import { useAuthStore } from "@/store/auth.store";
import { dashboardService } from "@/services/dashboard.service";
import { memberService } from "@/services/member.service";
import { membershipService, type MembershipRecord } from "@/services/membership.service";
import { paymentService } from "@/services/payment.service";
import { trainerService } from "@/services/trainer.service";
import type { DashboardAnalytics } from "@/types/analytics.types";
import type { Member } from "@/types/member.types";
import type { Trainer } from "@/types/user.types";
import OnboardingChecklist from "@/components/gym-admin/OnboardingChecklist";

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
    <div className="rounded-xl border border-border bg-(--glass-strong) px-3 py-2 text-sm shadow-xl backdrop-blur-xl">
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
  // Staff + membership breakdown — members and staff are counted separately.
  const trainerCount = statsData?.trainers ?? 0;
  const receptionistCount = statsData?.receptionists ?? 0;
  const staffCount = statsData?.staff ?? 0;
  const totalMemberships = statsData?.totalMemberships ?? 0;
  const activeMemberships = statsData?.activeMemberships ?? 0;

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
    { icon: <UserPlus className="h-5 w-5" />, label: "Add Member", path: "/gym-admin/members" },
    { icon: <CreditCard className="h-5 w-5" />, label: "Record Payment", path: "/gym-admin/payments" },
    { icon: <ClipboardCheck className="h-5 w-5" />, label: "Mark Attendance", path: "/gym-admin/attendance" },
    { icon: <Bell className="h-5 w-5" />, label: "Send Notification", path: "/gym-admin/notifications" },
    { icon: <BarChart2 className="h-5 w-5" />, label: "View Reports", path: "/gym-admin/analytics" },
  ];

  // Momentum sparklines for the KPI row.
  const attendanceSpark = weeklyAttendanceData.map((d) => d.count);
  const revenueSpark = revenueTrendData.map((r) => r.revenue);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  // ── Hero copy ───────────────────────────────────────────────────────────────
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const ownerFirstName = (user?.name ?? "Coach").split(" ")[0];
  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <div className="space-y-8">

      {/* First-customer onboarding checklist — auto-hides once set up. */}
      <OnboardingChecklist />

      {/* ── Command-center Hero ───────────────────────────────────────────── */}
      <CommandHero
        eyebrow={`${greeting}, ${ownerFirstName} · ${todayStr}`}
        title={
          <>
            Today is another opportunity to
            <br className="hidden sm:block" /> build{" "}
            <Highlight>stronger members.</Highlight>
          </>
        }
        subtitle="Your command center for growth, retention, and performance — all in real time."
        stats={[
          { label: "Checked in today", value: kpiLoading ? "—" : attendanceToday.toLocaleString("en-IN") },
          { label: "Active members", value: kpiLoading ? "—" : activeMembers.toLocaleString("en-IN") },
        ]}
        actions={
          <button
            onClick={() => window.location.reload()}
            className="press inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/8 px-4 py-2 text-xs font-bold text-white/85 transition-colors hover:bg-white/15 hover:text-white"
            title="Refresh data"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh data
          </button>
        }
      />

      {/* ── SECTION 1 — KPI Row ────────────────────────────────────────────── */}
      <div className="grid gap-5 stagger sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Active Members"
          value={kpiLoading ? "—" : activeMembers.toLocaleString("en-IN")}
          change={memberChange}
          changeLabel="vs last month"
          icon={<Users />}
          tone="energy"
          loading={kpiLoading}
          onClick={() => navigate("/gym-admin/members")}
        />

        <MetricCard
          label="Revenue This Month"
          value={kpiLoading ? "—" : formatCurrency(revenueThisMonth)}
          change={revenueChange}
          changeLabel="vs last month"
          icon={<TrendingUp />}
          spark={revenueSpark}
          tone="neutral"
          loading={kpiLoading}
          onClick={() => navigate("/gym-admin/analytics")}
        />

        <MetricCard
          label="Today's Attendance"
          value={kpiLoading ? "—" : attendanceToday.toLocaleString("en-IN")}
          change={attendanceChange}
          changeLabel="vs yesterday"
          icon={<CheckSquare />}
          spark={attendanceSpark}
          tone="energy"
          loading={kpiLoading}
          onClick={() => navigate("/gym-admin/attendance")}
        />

        <MetricCard
          label="Pending Dues"
          value={kpiLoading ? "—" : formatCurrency(pendingDues)}
          changeLabel={pendingDues > 0 ? "Requires action" : "All clear"}
          trend={pendingDues > 0 ? "down" : "flat"}
          icon={<AlertCircle />}
          tone={pendingDues > 0 ? "energy" : "neutral"}
          loading={kpiLoading}
          onClick={() => navigate("/gym-admin/payments")}
        />
      </div>

      {/* ── Team & Memberships breakdown (members vs staff counted separately) ── */}
      <div>
        <SectionHeader eyebrow="Team & Memberships" title="Your gym at a glance" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatTile label="Trainers" value={kpiLoading ? "—" : trainerCount.toLocaleString("en-IN")} icon={<Dumbbell />} tone="neutral" onClick={() => navigate("/gym-admin/trainers")} />
          <StatTile label="Receptionists" value={kpiLoading ? "—" : receptionistCount.toLocaleString("en-IN")} icon={<UserCheck />} tone="neutral" onClick={() => navigate("/gym-admin/admins")} />
          <StatTile label="Total Staff" value={kpiLoading ? "—" : staffCount.toLocaleString("en-IN")} icon={<Users />} tone="neutral" />
          <StatTile label="Total Memberships" value={kpiLoading ? "—" : totalMemberships.toLocaleString("en-IN")} icon={<IdCard />} tone="neutral" onClick={() => navigate("/gym-admin/memberships")} />
          <StatTile label="Active Memberships" value={kpiLoading ? "—" : activeMemberships.toLocaleString("en-IN")} icon={<CreditCard />} tone="energy" onClick={() => navigate("/gym-admin/memberships")} />
        </div>
      </div>

      {/* ── SECTION 2 — Quick Actions ─────────────────────────────────────── */}
      <div>
        <SectionHeader eyebrow="Quick Actions" title="Run your gym in one tap" />
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
          {quickActions.map((action) => (
            <ActionCard
              key={action.label}
              compact
              icon={action.icon}
              title={action.label}
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
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary"
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
                      <stop offset="0%" stopColor="#e73725" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#ec5848" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(143,143,143,0.12)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 12, fill: "var(--text-secondary, #767676)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--text-secondary, #767676)" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: "rgba(231,55,37,0.06)", radius: 6 }}
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
                className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-muted-foreground"
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
                      <stop offset="0%" stopColor="#767676" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#767676" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(143,143,143,0.12)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: "var(--text-secondary, #767676)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--text-secondary, #767676)" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) =>
                      v >= 1000 ? `₹${(v / 1000).toFixed(0)}K` : `₹${v}`
                    }
                  />
                  <Tooltip
                    content={<ChartTooltip prefix="₹" />}
                    cursor={{ stroke: "#767676", strokeWidth: 1, strokeDasharray: "4 4" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#767676"
                    strokeWidth={2.5}
                    fill="url(#revenueGradient)"
                    dot={{ fill: "#767676", r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: "#767676", strokeWidth: 2, stroke: "#fff" }}
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
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary"
              >
                All <ChevronRight className="h-3.5 w-3.5" />
              </button>
            }
          />
          <CardContent>
            {membersLoading ? (
              <MemberRowSkeleton />
            ) : !recentMembers?.length ? (
              <EmptyMomentumState
                size="sm"
                icon={<Users />}
                title="Start building your community"
                description="Add your first member and begin their transformation journey."
                action={
                  <button
                    onClick={() => navigate("/gym-admin/members")}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Add member →
                  </button>
                }
              />
            ) : (
              <ul className="divide-y divide-border">
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
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary ring-1 ring-primary/20">
                          {memberDisplayName(member).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-(--text-primary)">
                            {memberDisplayName(member)}
                          </p>
                          <p className="truncate text-xs text-(--text-muted)">{plan}</p>
                        </div>
                      </div>
                      <StatusPill tone={isActive ? "active" : "pending"} size="sm">
                        {isActive ? "Active" : member.status.charAt(0) + member.status.slice(1).toLowerCase()}
                      </StatusPill>
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
                className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-muted-foreground"
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
              <EmptyMomentumState
                size="sm"
                icon={<RefreshCw />}
                title="Every membership is current"
                description="No renewals due this week — your retention game is strong."
              />
            ) : (
              <ul className="divide-y divide-border">
                {upcomingRenewals.map((m) => {
                  const urgency =
                    m.daysLeft === 0
                      ? ("expired" as const)
                      : m.daysLeft <= 2
                      ? ("active" as const)
                      : ("neutral" as const);
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
                      <StatusPill tone={urgency} size="sm">
                        {label}
                      </StatusPill>
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
              <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-muted-foreground opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-muted-foreground" />
                </span>
                Live
              </span>
            }
          />
          <CardContent>
            {activityLoading ? (
              <ActivityFeedSkeleton />
            ) : !activityFeed?.length ? (
              <EmptyMomentumState
                size="sm"
                icon={<Activity />}
                title="The floor is quiet — for now"
                description="Check-ins and payments will light up here as your day kicks off."
              />
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
                            ? "bg-muted text-muted-foreground"
                            : "bg-primary text-white"
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
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary"
              >
                Manage <ChevronRight className="h-3.5 w-3.5" />
              </button>
            }
          />
          <CardContent>
            {paymentLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
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
                {/* Total Collected — neutral */}
                <div className="flex items-center justify-between rounded-2xl border border-border bg-(--surface-secondary) px-4 py-3 lift">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted ring-1 ring-border">
                      <TrendingUp className="h-4 w-4 text-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-(--text-primary)">Total Collected</p>
                      <p className="text-xs text-(--text-muted)">All time</p>
                    </div>
                  </div>
                  <p className="metric-number text-lg text-(--text-primary)">
                    {formatCurrency(paymentSummary?.totalRevenue ?? 0)}
                  </p>
                </div>

                {/* Paid This Month — positive, red accent on the number */}
                <div className="flex items-center justify-between rounded-2xl border border-border bg-(--surface-secondary) px-4 py-3 lift">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-(--text-primary)">Paid This Month</p>
                      <p className="text-xs text-(--text-muted)">
                        {paymentSummary?.transactionCount ?? 0} transactions
                      </p>
                    </div>
                  </div>
                  <p className="metric-number text-lg text-primary">
                    {formatCurrency(paymentSummary?.totalPaid ?? 0)}
                  </p>
                </div>

                {/* Pending — neutral */}
                <div className="flex items-center justify-between rounded-2xl border border-border bg-(--surface-secondary) px-4 py-3 lift">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted ring-1 ring-border">
                      <Clock className="h-4 w-4 text-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-(--text-primary)">Pending</p>
                      <p className="text-xs text-(--text-muted)">Awaiting collection</p>
                    </div>
                  </div>
                  <p className="metric-number text-lg text-(--text-primary)">
                    {formatCurrency(paymentSummary?.totalPending ?? 0)}
                  </p>
                </div>

                {/* Overdue — the only solid-red row; demands action */}
                <div className="flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/7 px-4 py-3 lift">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-(image:--gradient-primary) text-white glow-red-sm">
                      <AlertCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-(--text-primary)">Overdue</p>
                      <p className="text-xs font-medium text-primary">Requires immediate action</p>
                    </div>
                  </div>
                  <p className="metric-number text-lg text-primary">
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
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary"
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
              <EmptyMomentumState
                size="sm"
                icon={<Dumbbell />}
                title="Build your coaching team"
                description="Add trainers to assign members and track their performance."
                action={
                  <button
                    onClick={() => navigate("/gym-admin/trainers")}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Add trainer →
                  </button>
                }
              />
            ) : (
              <ul className="divide-y divide-border">
                {trainers.slice(0, 6).map((trainer) => (
                  <li
                    key={trainer.id}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    {/* Avatar */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary ring-1 ring-primary/20">
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
                    <StatusPill tone="active" size="sm">
                      Active
                    </StatusPill>
                  </li>
                ))}

                {trainers.length > 6 && (
                  <li className="pt-3 text-center">
                    <button
                      onClick={() => navigate("/gym-admin/trainers")}
                      className="text-xs font-semibold text-primary hover:underline"
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
