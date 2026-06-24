import { useEffect, useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from "recharts";
import {
  Users, UserCheck, UserX, IndianRupee, TrendingUp, AlertCircle, CalendarCheck,
  Dumbbell, Salad, HeartPulse, TrendingDown, Trophy, Gift, Share2, Clock,
} from "lucide-react";
import Page from "@/components/ui/Page";
import { Skeleton } from "@/components/ui/Skeleton";
import { SectionHeader, StatTile, InsightCard, type InsightTone } from "@/components/premium";
import { api } from "@/lib/api";
import { retentionService } from "@/services/retention.service";
import { gamificationService } from "@/services/gamification.service";

const inr = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

interface Dashboard { totalMembers: number; activeMembers: number; totalRevenue: number; pendingDues: number; activeMemberships: number; expiredMemberships: number; churnRiskMembers: number; retentionRate: number }
interface Attendance { totalAttendance: number; peakHour: string | null; attendanceByDate: Record<string, number> }

async function get<T>(path: string): Promise<T | null> {
  try { const res = await api.get(path); return (res.data?.data ?? res.data) as T; } catch { return null; }
}

interface Insight { tone: InsightTone; title: string; description: string; metric?: string; metricLabel?: string }

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [dash, setDash] = useState<Dashboard | null>(null);
  const [att, setAtt] = useState<Attendance | null>(null);
  const [training, setTraining] = useState<{ workouts: number; diet: number }>({ workouts: 0, diet: 0 });
  const [ret, setRet] = useState<Awaited<ReturnType<typeof retentionService.overview>> | null>(null);
  const [eng, setEng] = useState<Awaited<ReturnType<typeof gamificationService.analytics>> | null>(null);

  useEffect(() => {
    (async () => {
      const [d, a, engRows, r, g] = await Promise.all([
        get<Dashboard>("/intelligence/dashboard"),
        get<Attendance>("/intelligence/attendance"),
        get<{ workoutCompletionCount: number; mealCount: number }[]>("/intelligence/engagement"),
        retentionService.overview().catch(() => null),
        gamificationService.analytics().catch(() => null),
      ]);
      setDash(d); setAtt(a); setRet(r); setEng(g);
      const rows = engRows ?? [];
      setTraining({
        workouts: rows.reduce((s, x) => s + (x.workoutCompletionCount || 0), 0),
        diet: rows.reduce((s, x) => s + (x.mealCount || 0), 0),
      });
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <Page title="Analytics" eyebrow="Executive Intelligence"><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} height="h-28" />)}</div></Page>;
  }

  const attendanceTrend = Object.entries(att?.attendanceByDate ?? {})
    .sort((a, b) => a[0].localeCompare(b[0])).slice(-14)
    .map(([date, count]) => ({ date: date.slice(5), count }));
  const renewalRate = dash && (dash.activeMemberships + dash.expiredMemberships) > 0
    ? Math.round((dash.activeMemberships / (dash.activeMemberships + dash.expiredMemberships)) * 100) : 0;

  // ── Derived executive insights — what changed, why, what to do ──────────────
  const churn = ret?.churnRate ?? 0;
  const dues = dash?.pendingDues ?? 0;
  const challenge = eng?.challengeParticipationRate ?? 0;
  const atRisk = ret?.atRiskMembers ?? 0;

  const insights: Insight[] = [];
  if (churn > 5) {
    insights.push({ tone: "warning", title: "Churn is climbing", metric: `${churn}%`, metricLabel: "churn",
      description: `Churn is at ${churn}%${atRisk ? ` with ${atRisk} member${atRisk === 1 ? "" : "s"} flagged at-risk` : ""}. Trigger a retention campaign and have trainers reach out this week.` });
  } else {
    insights.push({ tone: "win", title: "Retention is holding strong", metric: `${churn}%`, metricLabel: "churn",
      description: `Churn is just ${churn}% — members are staying. Keep the momentum with consistent check-ins and recognition.` });
  }
  if (dues > 0) {
    insights.push({ tone: "warning", title: "Dues left on the table", metric: inr(dues), metricLabel: "pending",
      description: `${inr(dues)} is still outstanding. A reminder nudge today protects this month's cash flow.` });
  }
  if (renewalRate < 80) {
    insights.push({ tone: "opportunity", title: "Renewal upside available", metric: `${renewalRate}%`, metricLabel: "renewal",
      description: `Renewal rate is ${renewalRate}%. Re-engage expired members with a comeback offer to recover lost revenue.` });
  }
  if (challenge < 30) {
    insights.push({ tone: "opportunity", title: "Spark engagement with a challenge", metric: `${challenge}%`, metricLabel: "joined",
      description: `Only ${challenge}% of members join challenges. Launch a 7-day streak challenge to lift participation.` });
  }
  if (att?.peakHour) {
    insights.push({ tone: "neutral", title: "Staff around your peak", metric: att.peakHour, metricLabel: "busiest",
      description: `Your floor is busiest around ${att.peakHour}. Schedule trainers and classes to match demand.` });
  }
  const shownInsights = insights.slice(0, 4);

  return (
    <Page title="Analytics" eyebrow="Executive Intelligence" description="What changed, why it matters, and what to do next — straight from your gym's live data.">
      <div className="space-y-9">
        {/* ── Insights ──────────────────────────────────────────────────────── */}
        {shownInsights.length > 0 && (
          <div>
            <SectionHeader eyebrow="Insights" title="What needs your attention" />
            <div className="grid gap-4 lg:grid-cols-2">
              {shownInsights.map((ins, i) => (
                <InsightCard key={i} tone={ins.tone} title={ins.title} description={ins.description} metric={ins.metric} metricLabel={ins.metricLabel} />
              ))}
            </div>
          </div>
        )}

        {/* ── Membership ────────────────────────────────────────────────────── */}
        <div>
          <SectionHeader eyebrow="Membership" title="Who's in your gym" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile label="Active Members" value={String(dash?.activeMembers ?? 0)} icon={<UserCheck />} tone="energy" />
            <StatTile label="Active Memberships" value={String(dash?.activeMemberships ?? 0)} icon={<CalendarCheck />} tone="neutral" />
            <StatTile label="Expired Memberships" value={String(dash?.expiredMemberships ?? 0)} icon={<UserX />} tone="neutral" />
            <StatTile label="Total Members" value={String(dash?.totalMembers ?? 0)} icon={<Users />} tone="neutral" />
            <StatTile label="Renewal Rate" value={`${renewalRate}%`} icon={<TrendingUp />} tone="energy" />
          </div>
        </div>

        {/* ── Revenue ───────────────────────────────────────────────────────── */}
        <div>
          <SectionHeader eyebrow="Revenue" title="The money story" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile label="Total Revenue" value={inr(dash?.totalRevenue ?? 0)} icon={<IndianRupee />} tone="energy" />
            <StatTile label="Outstanding Dues" value={inr(dash?.pendingDues ?? 0)} icon={<AlertCircle />} tone={dues > 0 ? "energy" : "neutral"} />
            <StatTile label="Avg Retention Score" value={String(ret?.avgRetentionScore ?? 0)} icon={<HeartPulse />} tone="neutral" />
            <StatTile label="Churn Rate" value={`${ret?.churnRate ?? 0}%`} icon={<TrendingDown />} tone={churn > 5 ? "energy" : "neutral"} />
          </div>
        </div>

        {/* ── Attendance chart ──────────────────────────────────────────────── */}
        <div className="surface-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-black text-(--text-primary)"><CalendarCheck className="h-4 w-4 text-primary" /> Attendance · last 14 days</h3>
            <span className="text-xs font-semibold text-(--text-muted)">{att?.peakHour ? `Peak ${att.peakHour}` : ""} · {att?.totalAttendance ?? 0} total</span>
          </div>
          <div className="h-56">
            {attendanceTrend.length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceTrend}>
                  <defs><linearGradient id="att" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#e73725" stopOpacity={0.4} /><stop offset="95%" stopColor="#e73725" stopOpacity={0} /></linearGradient></defs>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} /><Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#e73725" strokeWidth={2.5} fill="url(#att)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── Training + retention risk ─────────────────────────────────────── */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="surface-card p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-black text-(--text-primary)"><Dumbbell className="h-4 w-4 text-primary" /> Training completion</h3>
            <div className="grid grid-cols-2 gap-4">
              <StatTile label="Workouts completed" value={String(training.workouts)} icon={<Dumbbell />} tone="energy" />
              <StatTile label="Diet logged" value={String(training.diet)} icon={<Salad />} tone="neutral" />
            </div>
          </div>
          <div className="surface-card p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-(--text-primary)"><HeartPulse className="h-4 w-4 text-primary" /> Retention risk</h3>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ret ? (["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((k) => ({ level: k, count: ret.riskBreakdown[k] })) : []}>
                  <XAxis dataKey="level" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} /><Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {["#767676", "#767676", "#a11f13", "#e73725"].map((c, i) => <Cell key={i} fill={c} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs font-medium text-(--text-secondary)">Retention rate {ret?.retentionRate ?? 0}% · {ret?.atRiskMembers ?? 0} at-risk members</p>
          </div>
        </div>

        {/* ── Engagement ────────────────────────────────────────────────────── */}
        <div>
          <SectionHeader eyebrow="Engagement" title="Momentum & community" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile label="Challenge participation" value={`${eng?.challengeParticipationRate ?? 0}%`} icon={<Trophy />} tone="neutral" />
            <StatTile label="Reward redemptions" value={String(eng?.rewardRedemptions ?? 0)} icon={<Gift />} tone="energy" />
            <StatTile label="Referral conversion" value={`${eng?.referralConversionRate ?? 0}%`} icon={<Share2 />} tone="neutral" />
            <StatTile label="Avg level" value={String(eng?.avgLevel ?? 1)} icon={<TrendingUp />} tone="energy" />
          </div>
        </div>

        <p className="flex items-center gap-1.5 text-xs text-(--text-muted)">
          <Clock className="h-3.5 w-3.5" /> Live data — refreshes on each visit.
        </p>
      </div>
    </Page>
  );
}

function Empty() { return <div className="flex h-full items-center justify-center text-sm text-(--text-secondary)">No data yet</div>; }
