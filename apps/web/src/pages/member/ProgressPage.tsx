import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
} from "recharts";
import {
  TrendingUp, TrendingDown, Minus, Flame, Trophy, Target, Activity,
  Plus, Sparkles, Award, CalendarCheck, Scale,
} from "lucide-react";
import Page from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/forms/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/common/EmptyState";
import { api } from "@/lib/api";
import {
  progressService, type ProgressSummary, type ChartSeries, type ProgressGoal,
} from "@/services/progress.service";
import { memberService, type MemberStreak } from "@/services/member.service";
import { attendanceService } from "@/services/attendance.service";

const SCOPE = "my";

const METRIC_META: Record<string, { label: string; unit: string }> = {
  weight: { label: "Weight", unit: "kg" },
  bmi: { label: "BMI", unit: "" },
  bodyFatPercentage: { label: "Body Fat", unit: "%" },
  muscleMass: { label: "Muscle Mass", unit: "kg" },
  waist: { label: "Waist", unit: "cm" },
  chest: { label: "Chest", unit: "cm" },
  arms: { label: "Arms", unit: "cm" },
  hips: { label: "Hips", unit: "cm" },
  thighs: { label: "Thighs", unit: "cm" },
};
const BODY_ORDER = ["weight", "bmi", "bodyFatPercentage", "muscleMass", "waist", "chest", "arms", "hips", "thighs"];

interface EarnedBadge { id: string; earnedAt: string; badge: { name: string; description?: string | null; icon?: string | null } }

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "UP") return <TrendingUp className="h-4 w-4 text-(--success)" />;
  if (trend === "DOWN") return <TrendingDown className="h-4 w-4 text-(--flame)" />;
  return <Minus className="h-4 w-4 text-(--text-muted)" />;
}

function dayKey(d: Date) { return d.toISOString().slice(0, 10); }

export default function ProgressPage() {
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [charts, setCharts] = useState<ChartSeries[]>([]);
  const [goals, setGoals] = useState<ProgressGoal[]>([]);
  const [streak, setStreak] = useState<MemberStreak | null>(null);
  const [attendance, setAttendance] = useState<{ date: string }[]>([]);
  const [badges, setBadges] = useState<EarnedBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState("weight");
  const [logOpen, setLogOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [s, ch, g, st, att, bd] = await Promise.all([
      progressService.getSummary(SCOPE).catch(() => null),
      progressService.getCharts(SCOPE).catch(() => []),
      progressService.listGoals(SCOPE).catch(() => []),
      memberService.getStreak().catch(() => null),
      attendanceService.getMyAttendance().catch(() => []),
      api.get("/badges/me").then((r) => (r.data?.data ?? r.data) as EarnedBadge[]).catch(() => []),
    ]);
    setSummary(s);
    setCharts(ch);
    setGoals(g);
    setStreak(st);
    setAttendance(Array.isArray(att) ? att : []);
    setBadges(Array.isArray(bd) ? bd : []);
    if (ch.length && !ch.some((c) => c.metric === "weight")) setMetric(ch[0].metric);
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const attendedSet = useMemo(() => new Set(attendance.map((a) => a.date.slice(0, 10))), [attendance]);

  const insights = useMemo(() => {
    const out: string[] = [];
    if (streak) {
      if (streak.thisMonth.attended > 0) out.push(`You've attended ${streak.thisMonth.attended} session${streak.thisMonth.attended === 1 ? "" : "s"} this month.`);
      if (streak.current > 0 && streak.current >= streak.best) out.push(`Your ${streak.current}-day streak is your best yet — keep it alive! 🔥`);
      else if (streak.current > 0) out.push(`You're on a ${streak.current}-day streak — ${Math.max(1, streak.best - streak.current)} more to beat your record.`);
      if (streak.thisMonth.consistency >= 70) out.push(`You're training ${streak.thisMonth.consistency}% of operational days this month — elite consistency.`);
    }
    const w = summary?.metrics?.weight;
    if (w && Math.abs(w.changeSinceFirst) >= 0.1) {
      out.push(`Your weight is ${w.changeSinceFirst < 0 ? "down" : "up"} ${Math.abs(w.changeSinceFirst).toFixed(1)}kg since you started tracking.`);
    }
    // Month-over-month attendance.
    const now = new Date();
    const inMonth = (d: Date, delta: number) => d.getMonth() === (now.getMonth() + delta + 12) % 12;
    const thisM = attendance.filter((a) => inMonth(new Date(a.date), 0)).length;
    const lastM = attendance.filter((a) => inMonth(new Date(a.date), -1)).length;
    if (lastM > 0 && thisM > lastM) out.push(`You're training more than last month — ${thisM - lastM} more session${thisM - lastM === 1 ? "" : "s"} so far.`);
    const done = goals.filter((g) => g.status === "COMPLETED").length;
    if (goals.length) out.push(`You've completed ${done} of ${goals.length} goal${goals.length === 1 ? "" : "s"}.`);
    if (out.length === 0) out.push("Log a measurement and check in to start building your progress story.");
    return out.slice(0, 4);
  }, [streak, summary, attendance, goals]);

  const activeSeries = charts.find((c) => c.metric === metric) ?? charts[0];
  const bodyMetrics = BODY_ORDER.filter((m) => summary?.metrics?.[m]).map((m) => ({ key: m, ...summary!.metrics[m] }));
  const activeGoals = goals.filter((g) => g.status === "ACTIVE");
  const goalCompletion = goals.length ? Math.round((goals.filter((g) => g.status === "COMPLETED").length / goals.length) * 100) : 0;

  async function saveLog() {
    const payload: Record<string, number> = {};
    for (const [k, v] of Object.entries(form)) {
      const n = parseFloat(v);
      if (!Number.isNaN(n)) payload[k] = n;
    }
    if (Object.keys(payload).length === 0) { setLogOpen(false); return; }
    setSaving(true);
    try {
      await progressService.createEntry(SCOPE, payload);
      setForm({});
      setLogOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  const kpis = [
    { label: "Consistency", value: `${summary?.consistencyScore ?? streak?.thisMonth.consistency ?? 0}%`, Icon: Activity, accent: true },
    { label: "Current Streak", value: `${streak?.current ?? 0}d`, Icon: Flame, accent: false },
    { label: "Best Streak", value: `${streak?.best ?? 0}d`, Icon: Trophy, accent: false },
    { label: "Goals Done", value: `${goalCompletion}%`, Icon: Target, accent: false },
  ];

  if (loading) {
    return (
      <Page title="Progress" description="Your measurable fitness journey.">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height="h-24" />)}</div>
          <Skeleton height="h-64" />
        </div>
      </Page>
    );
  }

  return (
    <Page
      title="Progress"
      description="Your measurable fitness journey — metrics, streaks, and insights."
      action={<Button variant="primary" onClick={() => setLogOpen(true)} iconLeft={<Plus className="h-4 w-4" />}>Log measurement</Button>}
    >
      <div className="space-y-6">
        {/* KPI row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {kpis.map(({ label, value, Icon, accent }) => (
            <Card key={label} variant={accent ? "premium" : "solid"} className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-(--text-secondary)">{label}</p>
                <Icon className={`h-4 w-4 ${accent ? "text-(--flame)" : "text-(--text-muted)"}`} />
              </div>
              <p className="mt-2 text-3xl font-black text-(--text-primary)">{value}</p>
            </Card>
          ))}
        </div>

        {/* Smart insights */}
        <Card variant="solid" className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-(--flame)" />
            <h3 className="text-sm font-bold text-(--text-primary)">Smart insights</h3>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {insights.map((t, i) => (
              <div key={i} className="flex items-start gap-2 rounded-xl bg-(--surface-secondary) p-3">
                <span className="mt-0.5 text-(--flame)">▹</span>
                <p className="text-sm text-(--text-secondary)">{t}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Trend chart */}
        <Card variant="solid" className="p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-(--text-primary)">Trends</h3>
            <div className="flex flex-wrap gap-1.5">
              {charts.map((c) => (
                <button
                  key={c.metric}
                  onClick={() => setMetric(c.metric)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${metric === c.metric ? "bg-(--flame) text-white" : "bg-(--surface-secondary) text-(--text-secondary)"}`}
                >
                  {METRIC_META[c.metric]?.label ?? c.metric}
                </button>
              ))}
            </div>
          </div>
          {activeSeries && activeSeries.points.length > 0 ? (
            <div className="h-64 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activeSeries.points}>
                  <defs><linearGradient id="prog" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#e73725" stopOpacity={0.4} /><stop offset="95%" stopColor="#e73725" stopOpacity={0} /></linearGradient></defs>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" })} />
                  <YAxis tick={{ fontSize: 11 }} domain={["auto", "auto"]} width={36} />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#e73725" strokeWidth={2} fill="url(#prog)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-(--text-secondary)">Log a few measurements to see your trends.</div>
          )}
        </Card>

        {/* Body metrics */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-(--text-primary)"><Scale className="h-4 w-4" /> Body metrics</h3>
          {bodyMetrics.length === 0 ? (
            <EmptyState icon={<Scale className="h-7 w-7" />} title="No measurements yet" message="Log your first measurement to start tracking body metrics." action={<Button variant="secondary" onClick={() => setLogOpen(true)}>Log measurement</Button>} />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {bodyMetrics.map((m) => {
                const meta = METRIC_META[m.key] ?? { label: m.key, unit: "" };
                return (
                  <Card key={m.key} variant="solid" className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-(--text-secondary)">{meta.label}</p>
                      <TrendIcon trend={m.trend} />
                    </div>
                    <p className="mt-1 text-2xl font-black text-(--text-primary)">{m.latest}<span className="ml-1 text-sm font-semibold text-(--text-muted)">{meta.unit}</span></p>
                    {m.changeSinceFirst !== 0 && (
                      <p className="mt-0.5 text-xs text-(--text-muted)">{m.changeSinceFirst > 0 ? "+" : ""}{m.changeSinceFirst.toFixed(1)} since start</p>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Streak analytics + heatmap */}
        <Card variant="solid" className="p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-(--text-primary)"><Flame className="h-4 w-4 text-(--flame)" /> Streak analytics</h3>
          <div className="grid grid-cols-3 gap-4">
            <div><p className="text-2xl font-black text-(--text-primary)">{streak?.current ?? 0}</p><p className="text-xs text-(--text-secondary)">Current</p></div>
            <div><p className="text-2xl font-black text-(--text-primary)">{streak?.best ?? 0}</p><p className="text-xs text-(--text-secondary)">Best</p></div>
            <div><p className="text-2xl font-black text-(--text-primary)">{streak?.thisMonth.streak ?? 0}</p><p className="text-xs text-(--text-secondary)">This month</p></div>
          </div>
          {/* 12-week heatmap */}
          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold text-(--text-secondary)">Last 12 weeks</p>
            <div className="flex gap-1 overflow-x-auto">
              {Array.from({ length: 12 }).map((_, week) => (
                <div key={week} className="flex flex-col gap-1">
                  {Array.from({ length: 7 }).map((__, day) => {
                    const d = new Date();
                    d.setDate(d.getDate() - ((11 - week) * 7 + (6 - day)));
                    const attended = attendedSet.has(dayKey(d));
                    const isSunday = d.getDay() === 0;
                    return <div key={day} title={dayKey(d)} className={`h-3.5 w-3.5 rounded-sm ${attended ? "bg-(--flame)" : isSunday ? "bg-(--surface-secondary) opacity-40" : "bg-(--surface-secondary)"}`} />;
                  })}
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Goals + Achievements */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card variant="solid" className="p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-(--text-primary)"><Target className="h-4 w-4" /> Goal completion</h3>
            {activeGoals.length === 0 ? (
              <p className="text-sm text-(--text-secondary)">No active goals. Set one on the Goals page.</p>
            ) : (
              <div className="space-y-4">
                {activeGoals.slice(0, 4).map((g) => {
                  const pct = Math.max(0, Math.min(100, Math.round(g.progressPercent ?? 0)));
                  return (
                    <div key={g.id}>
                      <div className="mb-1 flex items-center justify-between text-sm"><span className="text-(--text-primary)">{g.title}</span><span className="font-semibold text-(--text-secondary)">{pct}%</span></div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-(--surface-secondary)"><div className="h-full rounded-full bg-(--flame)" style={{ width: `${pct}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card variant="solid" className="p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-(--text-primary)"><Award className="h-4 w-4" /> Achievements</h3>
            {badges.length === 0 ? (
              <p className="text-sm text-(--text-secondary)">No badges yet — keep training to earn them.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {badges.slice(0, 12).map((b) => (
                  <Badge key={b.id} variant="success" className="flex items-center gap-1"><CalendarCheck className="h-3 w-3" />{b.badge.name}</Badge>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Log measurement modal */}
      <Modal
        open={logOpen}
        onClose={() => setLogOpen(false)}
        title="Log a measurement"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setLogOpen(false)} disabled={saving}>Cancel</Button>
            <Button variant="primary" onClick={() => void saveLog()} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          {["weight", "bodyFatPercentage", "muscleMass", "waist", "chest", "arms"].map((k) => (
            <Input
              key={k}
              label={`${METRIC_META[k]?.label ?? k}${METRIC_META[k]?.unit ? ` (${METRIC_META[k].unit})` : ""}`}
              type="number"
              value={form[k] ?? ""}
              onChange={(e) => setForm({ ...form, [k]: e.target.value })}
            />
          ))}
        </div>
      </Modal>
    </Page>
  );
}
