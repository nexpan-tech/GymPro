import { useEffect, useMemo, useState } from "react";
import { Target, Plus, Pencil, Trash2, Trophy, CheckCircle2 } from "lucide-react";
import Page from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/forms/Input";
import Select from "@/components/forms/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/common/EmptyState";
import { useCelebrate } from "@/components/premium/CelebrationProvider";
import { progressService, type ProgressGoal } from "@/services/progress.service";

const SCOPE = "my";

// Goal "types" map onto the existing Goal.metric/unit fields (no schema change).
const GOAL_TYPES = [
  { value: "weight_loss", label: "Weight loss", metric: "weight", unit: "kg" },
  { value: "muscle_gain", label: "Muscle gain", metric: "muscleMass", unit: "kg" },
  { value: "attendance", label: "Attendance", metric: "attendance", unit: "sessions" },
  { value: "workout_frequency", label: "Workout frequency", metric: "workouts", unit: "per week" },
  { value: "nutrition", label: "Nutrition", metric: "nutrition", unit: "%" },
  { value: "custom", label: "Custom", metric: "", unit: "" },
] as const;

function typeForMetric(metric?: string | null) {
  return GOAL_TYPES.find((t) => t.metric && t.metric === metric) ?? GOAL_TYPES[GOAL_TYPES.length - 1];
}

function statusVariant(status: string): "info" | "success" | "danger" | "default" {
  switch (status) {
    case "COMPLETED": return "success";
    case "FAILED": return "danger";
    case "CANCELLED": return "default";
    default: return "info";
  }
}

interface FormState {
  type: string;
  title: string;
  startValue: string;
  currentValue: string;
  targetValue: string;
  unit: string;
  targetDate: string;
  status: string;
}

const emptyForm: FormState = {
  type: "weight_loss", title: "", startValue: "", currentValue: "", targetValue: "", unit: "kg", targetDate: "", status: "ACTIVE",
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<ProgressGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const celebrate = useCelebrate();

  async function load() {
    setLoading(true);
    try {
      setGoals(await progressService.listGoals(SCOPE));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { void load(); }, []);

  const stats = useMemo(() => {
    const active = goals.filter((g) => g.status === "ACTIVE");
    const completed = goals.filter((g) => g.status === "COMPLETED");
    const avg = active.length
      ? Math.round(active.reduce((s, g) => s + (g.progressPercent ?? 0), 0) / active.length)
      : 0;
    return { active: active.length, completed: completed.length, avg };
  }, [goals]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(g: ProgressGoal) {
    setEditingId(g.id);
    setForm({
      type: typeForMetric(g.metric).value,
      title: g.title,
      startValue: g.startValue?.toString() ?? "",
      currentValue: g.currentValue?.toString() ?? "",
      targetValue: g.targetValue?.toString() ?? "",
      unit: g.unit ?? "",
      targetDate: g.targetDate ? g.targetDate.slice(0, 10) : "",
      status: g.status,
    });
    setError(null);
    setModalOpen(true);
  }

  function onTypeChange(value: string) {
    const preset = GOAL_TYPES.find((t) => t.value === value) ?? GOAL_TYPES[0];
    setForm((f) => ({ ...f, type: value, unit: f.unit && editingId ? f.unit : preset.unit }));
  }

  async function save() {
    setError(null);
    const target = parseFloat(form.targetValue);
    if (!form.title.trim()) { setError("Give your goal a title."); return; }
    if (Number.isNaN(target)) { setError("Target value is required."); return; }

    const preset = GOAL_TYPES.find((t) => t.value === form.type) ?? GOAL_TYPES[0];
    const payload = {
      title: form.title.trim(),
      metric: preset.metric || undefined,
      unit: form.unit.trim() || undefined,
      startValue: form.startValue ? parseFloat(form.startValue) : undefined,
      currentValue: form.currentValue ? parseFloat(form.currentValue) : undefined,
      targetValue: target,
      targetDate: form.targetDate ? new Date(form.targetDate).toISOString() : undefined,
    };

    setSaving(true);
    try {
      if (editingId) {
        await progressService.updateGoal(SCOPE, editingId, { ...payload, status: form.status });
      } else {
        await progressService.createGoal(SCOPE, payload);
      }
      setModalOpen(false);
      await load();
    } catch {
      setError("Couldn't save the goal. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function markComplete(g: ProgressGoal) {
    await progressService.updateGoal(SCOPE, g.id, { status: "COMPLETED" });
    celebrate("GOAL", { message: `You crushed "${g.title}". Set the next one.` });
    await load();
  }

  async function remove(g: ProgressGoal) {
    if (!window.confirm(`Delete goal "${g.title}"?`)) return;
    await progressService.deleteGoal(SCOPE, g.id);
    await load();
  }

  return (
    <Page
      title="Goals"
      description="Set targets, track progress, and celebrate every milestone."
      action={<Button variant="primary" onClick={openCreate} iconLeft={<Plus className="h-4 w-4" />}>New Goal</Button>}
    >
      <div className="space-y-6">
        {/* Stats */}
        {!loading && goals.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <Card variant="solid" className="p-4 text-center">
              <p className="text-2xl font-bold text-(--text-primary)">{stats.active}</p>
              <p className="text-xs text-(--text-secondary)">Active</p>
            </Card>
            <Card variant="solid" className="p-4 text-center">
              <p className="text-2xl font-bold text-(--flame)">{stats.avg}%</p>
              <p className="text-xs text-(--text-secondary)">Avg progress</p>
            </Card>
            <Card variant="solid" className="p-4 text-center">
              <p className="text-2xl font-bold text-(--text-primary)">{stats.completed}</p>
              <p className="text-xs text-(--text-secondary)">Completed</p>
            </Card>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height="h-28" />)}</div>
        ) : goals.length === 0 ? (
          <EmptyState
            icon={<Target className="h-7 w-7" />}
            title="No goals yet"
            message="Create your first goal — weight, attendance, workouts, or anything you want to achieve."
            action={<Button variant="primary" onClick={openCreate}>Create a goal</Button>}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {goals.map((g) => {
              const pct = Math.max(0, Math.min(100, Math.round(g.progressPercent ?? 0)));
              const type = typeForMetric(g.metric);
              return (
                <Card key={g.id} variant="solid" className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-semibold text-(--text-primary)">{g.title}</h3>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="default">{type.label}</Badge>
                        <Badge variant={statusVariant(g.status)}>{g.status}</Badge>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {g.status === "ACTIVE" && (
                        <button onClick={() => void markComplete(g)} title="Mark complete" className="rounded-lg p-2 text-(--text-secondary) hover:bg-(--surface-hover) hover:text-(--success)">
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      )}
                      <button onClick={() => openEdit(g)} title="Edit" className="rounded-lg p-2 text-(--text-secondary) hover:bg-(--surface-hover)">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => void remove(g)} title="Delete" className="rounded-lg p-2 text-(--text-secondary) hover:bg-(--surface-hover) hover:text-(--danger)">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mt-4">
                    <div className="mb-1 flex items-center justify-between text-xs text-(--text-secondary)">
                      <span>
                        {g.currentValue ?? g.startValue ?? 0}{g.unit ? ` ${g.unit}` : ""} → {g.targetValue ?? 0}{g.unit ? ` ${g.unit}` : ""}
                      </span>
                      <span className="font-semibold text-(--text-primary)">{pct}%</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all ${g.status === "COMPLETED" ? "bg-(--success)" : "bg-(--flame)"}`}
                        style={{ width: `${g.status === "COMPLETED" ? 100 : pct}%` }}
                      />
                    </div>
                    {g.targetDate && (
                      <p className="mt-2 text-xs text-(--text-muted)">Target by {new Date(g.targetDate).toLocaleDateString()}</p>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit goal" : "New goal"}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button variant="primary" onClick={() => void save()} disabled={saving}>{saving ? "Saving…" : editingId ? "Save" : "Create"}</Button>
          </div>
        }
      >
        <div className="space-y-4">
          {error && <p className="rounded-lg bg-(--danger)/10 px-3 py-2 text-sm text-(--danger)">{error}</p>}
          <Select
            label="Goal type"
            options={GOAL_TYPES.map((t) => ({ label: t.label, value: t.value }))}
            value={form.type}
            onChange={(e) => onTypeChange(e.target.value)}
          />
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Lose 5kg by summer" />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Start" type="number" value={form.startValue} onChange={(e) => setForm({ ...form, startValue: e.target.value })} />
            <Input label="Current" type="number" value={form.currentValue} onChange={(e) => setForm({ ...form, currentValue: e.target.value })} />
            <Input label="Target" type="number" value={form.targetValue} onChange={(e) => setForm({ ...form, targetValue: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="kg / sessions / %" />
            <Input label="Target date" type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} />
          </div>
          {editingId && (
            <Select
              label="Status"
              options={["ACTIVE", "COMPLETED", "FAILED", "CANCELLED"].map((s) => ({ label: s, value: s }))}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            />
          )}
        </div>
      </Modal>
    </Page>
  );
}
