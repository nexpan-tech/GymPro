import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip,
} from "recharts";
import { Plus, TrendingDown, TrendingUp, Minus, Target, CalendarRange } from "lucide-react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/forms/Input";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/hooks/useToast";
import {
  progressService,
  type ProgressEntry, type ChartSeries, type ProgressSummary,
  type ProgressGoal, type MonthlyReport, type Trend,
} from "@/services/progress.service";

interface Props {
  scope: string; // "my" or "member/<id>"
  canEdit?: boolean;
}

const ENTRY_FIELDS: { key: string; label: string; unit: string }[] = [
  { key: "weight", label: "Weight", unit: "kg" },
  { key: "height", label: "Height", unit: "cm" },
  { key: "bodyFatPercentage", label: "Body Fat", unit: "%" },
  { key: "muscleMass", label: "Muscle Mass", unit: "kg" },
  { key: "chest", label: "Chest", unit: "cm" },
  { key: "waist", label: "Waist", unit: "cm" },
  { key: "hips", label: "Hips", unit: "cm" },
  { key: "arms", label: "Arms", unit: "cm" },
  { key: "thighs", label: "Thighs", unit: "cm" },
];

const CHART_METRICS = [
  { metric: "weight", label: "Weight (kg)", color: "#6366f1" },
  { metric: "bmi", label: "BMI", color: "#0ea5e9" },
  { metric: "bodyFatPercentage", label: "Body Fat (%)", color: "#f59e0b" },
  { metric: "waist", label: "Waist (cm)", color: "#10b981" },
];

function TrendIcon({ trend }: { trend: Trend }) {
  if (trend === "UP") return <TrendingUp className="h-4 w-4 text-amber-500" />;
  if (trend === "DOWN") return <TrendingDown className="h-4 w-4 text-emerald-500" />;
  return <Minus className="h-4 w-4 text-(--text-muted)" />;
}

export default function ProgressManager({ scope, canEdit = true }: Props) {
  const toast = useToast();
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [charts, setCharts] = useState<ChartSeries[]>([]);
  const [timeline, setTimeline] = useState<ProgressEntry[]>([]);
  const [goals, setGoals] = useState<ProgressGoal[]>([]);
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);

  const [entryOpen, setEntryOpen] = useState(false);
  const [entryForm, setEntryForm] = useState<Record<string, string>>({});
  const [entryNotes, setEntryNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const [goalOpen, setGoalOpen] = useState(false);
  const [goalForm, setGoalForm] = useState({ title: "", metric: "weight", targetValue: "", unit: "kg" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, c, t, g, r] = await Promise.all([
        progressService.getSummary(scope),
        progressService.getCharts(scope),
        progressService.getTimeline(scope),
        progressService.listGoals(scope),
        progressService.getMonthlyReport(scope),
      ]);
      setSummary(s); setCharts(c); setTimeline(t); setGoals(g); setReport(r);
    } catch {
      toast.error("Failed to load progress.");
    } finally {
      setLoading(false);
    }
  }, [scope, toast]);

  useEffect(() => { void load(); }, [load]);

  const chartFor = useMemo(() => {
    const map = new Map(charts.map((c) => [c.metric, c]));
    return (metric: string) => map.get(metric);
  }, [charts]);

  async function saveEntry() {
    const payload: Record<string, number | string> = {};
    for (const f of ENTRY_FIELDS) {
      const v = entryForm[f.key]?.trim();
      if (v) payload[f.key] = Number(v);
    }
    if (Object.keys(payload).length === 0) return toast.error("Enter at least one measurement.");
    if (entryNotes.trim()) payload.notes = entryNotes.trim();
    setSaving(true);
    try {
      await progressService.createEntry(scope, payload);
      toast.success("Progress entry saved.");
      setEntryOpen(false); setEntryForm({}); setEntryNotes("");
      await load();
    } catch {
      toast.error("Failed to save entry.");
    } finally {
      setSaving(false);
    }
  }

  async function saveGoal() {
    if (!goalForm.title.trim()) return toast.error("Goal title is required.");
    const target = Number(goalForm.targetValue);
    if (Number.isNaN(target)) return toast.error("Enter a valid target value.");
    setSaving(true);
    try {
      const startValue = goalForm.metric ? summary?.metrics?.[goalForm.metric]?.latest : undefined;
      await progressService.createGoal(scope, {
        title: goalForm.title.trim(),
        metric: goalForm.metric || undefined,
        targetValue: target,
        startValue: typeof startValue === "number" ? startValue : undefined,
        unit: goalForm.unit || undefined,
      });
      toast.success("Goal created.");
      setGoalOpen(false); setGoalForm({ title: "", metric: "weight", targetValue: "", unit: "kg" });
      await load();
    } catch {
      toast.error("Failed to create goal.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height="h-24" />)}</div>;
  }

  const m = summary?.metrics ?? {};
  const hasData = (summary?.entryCount ?? 0) > 0;

  return (
    <div className="space-y-6">
      {/* Action bar */}
      {canEdit && (
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" iconLeft={<Target className="h-4 w-4" />} onClick={() => setGoalOpen(true)}>Add Goal</Button>
          <Button iconLeft={<Plus className="h-4 w-4" />} onClick={() => setEntryOpen(true)}>Add Progress Entry</Button>
        </div>
      )}

      {/* Latest metric cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { key: "weight", label: "Weight", unit: "kg" },
          { key: "bmi", label: "BMI", unit: "" },
          { key: "bodyFatPercentage", label: "Body Fat", unit: "%" },
          { key: "waist", label: "Waist", unit: "cm" },
        ].map((card) => {
          const data = m[card.key];
          return (
            <Card key={card.key} variant="solid" className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-(--text-secondary)">{card.label}</span>
                {data ? <TrendIcon trend={data.trend} /> : null}
              </div>
              <div className="mt-2 text-2xl font-bold text-(--text-primary)">
                {data ? `${data.latest}${card.unit}` : "—"}
              </div>
              {data?.changeSinceFirst != null && (
                <div className="mt-1 text-xs text-(--text-muted)">
                  {data.changeSinceFirst > 0 ? "+" : ""}{data.changeSinceFirst}{card.unit} since first
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {!hasData ? (
        <EmptyState
          icon={<TrendingUp className="h-7 w-7" />}
          title="No progress yet"
          message={canEdit ? "Add the first progress entry to start tracking." : "No measurements recorded yet."}
          action={canEdit ? <Button iconLeft={<Plus className="h-4 w-4" />} onClick={() => setEntryOpen(true)}>Add Progress Entry</Button> : undefined}
        />
      ) : (
        <>
          {/* Charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            {CHART_METRICS.map(({ metric, label, color }) => {
              const series = chartFor(metric);
              if (!series || series.points.length === 0) return null;
              return (
                <Card key={metric} variant="solid" className="p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-(--text-primary)">{label}</h3>
                    <span className="flex items-center gap-1 text-xs text-(--text-secondary)">
                      <TrendIcon trend={series.trend} />
                      {series.change > 0 ? "+" : ""}{series.change}
                    </span>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={series.points}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(148,163,184,0.15)", backgroundColor: "rgba(15,23,42,0.95)", color: "#fff" }} />
                      <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} dot={{ r: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              );
            })}
          </div>

          {/* Goals + Monthly report */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card variant="solid" className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-(--text-primary)">Goals</h3>
                {canEdit && <Button size="sm" variant="ghost" iconLeft={<Target className="h-4 w-4" />} onClick={() => setGoalOpen(true)}>Add</Button>}
              </div>
              {goals.length === 0 ? (
                <p className="py-4 text-center text-sm text-(--text-secondary)">No goals set.</p>
              ) : (
                <div className="space-y-4">
                  {goals.map((g) => (
                    <div key={g.id}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-(--text-primary)">{g.title}</span>
                        <Badge variant={g.status === "ACTIVE" ? "info" : "success"}>{g.progressPercent}%</Badge>
                      </div>
                      <div className="mt-1 text-xs text-(--text-muted)">
                        {g.currentValue ?? "—"}{g.unit} → {g.targetValue}{g.unit}
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-(--surface-secondary)">
                        <div className="h-full rounded-full bg-[image:var(--gradient-primary)]" style={{ width: `${g.progressPercent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card variant="solid" className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <CalendarRange className="h-4 w-4 text-indigo-500" />
                <h3 className="text-sm font-semibold text-(--text-primary)">Monthly Report — {report?.month}</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <ReportStat label="Entries this month" value={String(report?.entriesThisMonth ?? 0)} />
                <ReportStat label="Consistency" value={`${report?.consistencyScore ?? 0}%`} />
                {report && Object.entries(report.headline).map(([k, v]) => (
                  <ReportStat
                    key={k}
                    label={k === "bodyFatPercentage" ? "Body fat" : k.toUpperCase()}
                    value={v.latest != null ? `${v.latest}${v.changeFromMonthStart != null ? ` (${v.changeFromMonthStart > 0 ? "+" : ""}${v.changeFromMonthStart})` : ""}` : "—"}
                  />
                ))}
              </div>
            </Card>
          </div>

          {/* Timeline */}
          <Card variant="solid" className="overflow-hidden p-0">
            <div className="border-b border-(--border) px-5 py-3 text-sm font-semibold text-(--text-primary)">Timeline</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-(--border) text-xs uppercase tracking-wide text-(--text-secondary)">
                  <tr>
                    <th className="px-4 py-2 font-medium">Date</th>
                    <th className="px-4 py-2 font-medium">Weight</th>
                    <th className="px-4 py-2 font-medium">BMI</th>
                    <th className="px-4 py-2 font-medium">Body Fat</th>
                    <th className="px-4 py-2 font-medium">Waist</th>
                    <th className="px-4 py-2 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--border)">
                  {timeline.map((e) => (
                    <tr key={e.id}>
                      <td className="px-4 py-2 text-(--text-secondary)">{new Date(e.recordedAt).toLocaleDateString()}</td>
                      <td className="px-4 py-2">{e.weight ?? "—"}</td>
                      <td className="px-4 py-2">{e.bmi ?? "—"}</td>
                      <td className="px-4 py-2">{e.bodyFatPercentage != null ? `${e.bodyFatPercentage}%` : "—"}</td>
                      <td className="px-4 py-2">{e.waist ?? "—"}</td>
                      <td className="px-4 py-2 text-(--text-muted)">{e.notes ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Add entry modal */}
      <Modal
        open={entryOpen}
        onClose={() => !saving && setEntryOpen(false)}
        title="Add Progress Entry"
        description="Numeric measurements only. BMI is calculated automatically."
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setEntryOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={saveEntry} loading={saving}>Save Entry</Button>
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ENTRY_FIELDS.map((f) => (
            <Input
              key={f.key}
              label={`${f.label} (${f.unit})`}
              type="number"
              value={entryForm[f.key] ?? ""}
              onChange={(e) => setEntryForm((p) => ({ ...p, [f.key]: e.target.value }))}
            />
          ))}
        </div>
        <div className="mt-3">
          <Input label="Notes (optional)" value={entryNotes} onChange={(e) => setEntryNotes(e.target.value)} />
        </div>
      </Modal>

      {/* Add goal modal */}
      <Modal
        open={goalOpen}
        onClose={() => !saving && setGoalOpen(false)}
        title="Add Goal"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setGoalOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={saveGoal} loading={saving}>Create Goal</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input label="Title" placeholder="e.g. Reach 75kg" value={goalForm.title} onChange={(e) => setGoalForm((p) => ({ ...p, title: e.target.value }))} />
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Metric</label>
            <select
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              value={goalForm.metric}
              onChange={(e) => setGoalForm((p) => ({ ...p, metric: e.target.value }))}
            >
              <option value="weight">Weight</option>
              <option value="bodyFatPercentage">Body Fat %</option>
              <option value="muscleMass">Muscle Mass</option>
              <option value="waist">Waist</option>
              <option value="chest">Chest</option>
            </select>
          </div>
          <Input label="Target Value" type="number" value={goalForm.targetValue} onChange={(e) => setGoalForm((p) => ({ ...p, targetValue: e.target.value }))} />
          <Input label="Unit" value={goalForm.unit} onChange={(e) => setGoalForm((p) => ({ ...p, unit: e.target.value }))} />
        </div>
      </Modal>
    </div>
  );
}

function ReportStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-(--surface-secondary) p-3">
      <div className="text-xs text-(--text-secondary)">{label}</div>
      <div className="mt-1 font-semibold text-(--text-primary)">{value}</div>
    </div>
  );
}
