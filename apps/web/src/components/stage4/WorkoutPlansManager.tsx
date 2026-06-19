import { useCallback, useEffect, useMemo, useState } from "react";
import { Dumbbell, Plus, Trash2, Pencil, Eye, CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/forms/Input";
import Select from "@/components/forms/Select";
import Textarea from "@/components/forms/Textarea";
import MemberMultiSelect from "@/components/forms/MemberMultiSelect";
import { useToast } from "@/hooks/useToast";
import { memberService } from "@/services/member.service";
import { exerciseService, type MuscleGroup } from "@/services/exercise.service";
import {
  workoutService,
  type Difficulty,
  type WorkoutPlanFull,
} from "@/services/workout.service";

const MUSCLE_GROUPS: MuscleGroup[] = [
  "CHEST", "BACK", "SHOULDERS", "BICEPS", "TRICEPS", "LEGS", "GLUTES", "CORE", "FULL_BODY",
];
const DIFFICULTIES: Difficulty[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
const DAYS = [
  { value: "1", label: "Day 1 (Mon)" },
  { value: "2", label: "Day 2 (Tue)" },
  { value: "3", label: "Day 3 (Wed)" },
  { value: "4", label: "Day 4 (Thu)" },
  { value: "5", label: "Day 5 (Fri)" },
  { value: "6", label: "Day 6 (Sat)" },
  { value: "7", label: "Day 7 (Sun)" },
];
const DAY_SHORT: Record<number, string> = { 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat", 7: "Sun" };

interface MemberOption { id: string; name: string; subtitle?: string }

interface StagedExercise {
  key: string;
  name: string;
  muscleGroup: MuscleGroup;
  dayNumber: number;
  sets: number;
  reps: string;
  restSeconds?: number;
  notes?: string;
  videoUrl?: string;
}

const emptyExercise = {
  name: "",
  muscleGroup: "CHEST" as MuscleGroup,
  dayNumber: "1",
  sets: "3",
  reps: "10",
  restSeconds: "60",
  notes: "",
  videoUrl: "",
};

/** Distinct dayNumbers used by a plan's exercises, ascending. */
function planDays(p: WorkoutPlanFull): number[] {
  return [...new Set((p.exercises ?? []).map((e) => e.dayNumber))].sort((a, b) => a - b);
}

export default function WorkoutPlansManager() {
  const toast = useToast();
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [plans, setPlans] = useState<WorkoutPlanFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // create-plan form
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("BEGINNER");
  const [durationWeeks, setDurationWeeks] = useState("4");
  const [exForm, setExForm] = useState({ ...emptyExercise });
  const [staged, setStaged] = useState<StagedExercise[]>([]);

  // detail / edit / delete
  const [detail, setDetail] = useState<WorkoutPlanFull | null>(null);
  const [editPlan, setEditPlan] = useState<WorkoutPlanFull | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", difficulty: "BEGINNER" as Difficulty, durationWeeks: "" });
  const [deleteTarget, setDeleteTarget] = useState<WorkoutPlanFull | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [memRes, planList] = await Promise.all([
        memberService.list(),
        workoutService.listPlans(),
      ]);
      setMembers(
        (memRes.data.members ?? []).map((m) => ({
          id: m.id,
          name: m.user?.name ?? "Member",
          subtitle: m.user?.email,
        })),
      );
      setPlans(planList);
    } catch {
      toast.error("Failed to load workout plans.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const memberName = useMemo(() => {
    const map = new Map(members.map((m) => [m.id, m.name]));
    return (id?: string | null) => (id ? map.get(id) ?? "—" : "Unassigned");
  }, [members]);

  function resetForm() {
    setMemberIds([]);
    setTitle("");
    setDescription("");
    setDifficulty("BEGINNER");
    setDurationWeeks("4");
    setExForm({ ...emptyExercise });
    setStaged([]);
  }

  function addStagedExercise() {
    if (!exForm.name.trim()) return toast.error("Enter an exercise name.");
    setStaged((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        name: exForm.name.trim(),
        muscleGroup: exForm.muscleGroup,
        dayNumber: Number(exForm.dayNumber),
        sets: Number(exForm.sets) || 1,
        reps: exForm.reps || "10",
        restSeconds: exForm.restSeconds ? Number(exForm.restSeconds) : undefined,
        notes: exForm.notes || undefined,
        videoUrl: exForm.videoUrl || undefined,
      },
    ]);
    setExForm({ ...emptyExercise, dayNumber: exForm.dayNumber });
  }

  async function handleSave() {
    if (memberIds.length === 0) return toast.error("Select at least one member to assign this plan to.");
    if (!title.trim()) return toast.error("Enter a workout plan name.");
    if (staged.length === 0) return toast.error("Add at least one exercise.");

    setSaving(true);
    try {
      // One plan is created per selected member (multi-assign).
      const result = await workoutService.createPlan({
        memberIds,
        title: title.trim(),
        description: description || undefined,
        difficulty,
        durationWeeks: durationWeeks ? Number(durationWeeks) : undefined,
      });
      const planList = result.plans ?? [result];

      // Create each exercise once, then attach it to every created plan so all
      // assigned members get an identical copy.
      for (const ex of staged) {
        const exercise = await exerciseService.create({
          name: ex.name,
          muscleGroup: ex.muscleGroup,
          difficulty,
          videoUrl: ex.videoUrl,
        });
        for (const plan of planList) {
          await workoutService.addExercise(plan.id, {
            exerciseId: exercise.id,
            dayNumber: ex.dayNumber,
            sets: ex.sets,
            reps: ex.reps,
            restSeconds: ex.restSeconds,
            notes: ex.notes,
          });
        }
      }

      toast.success(`Workout plan assigned to ${planList.length} member${planList.length === 1 ? "" : "s"}.`);
      setOpen(false);
      resetForm();
      await load();
    } catch {
      toast.error("Failed to save workout plan.");
    } finally {
      setSaving(false);
    }
  }

  function openEdit(p: WorkoutPlanFull) {
    setEditPlan(p);
    setEditForm({
      title: p.title,
      description: p.description ?? "",
      difficulty: p.difficulty,
      durationWeeks: p.durationWeeks != null ? String(p.durationWeeks) : "",
    });
  }

  async function handleEditSave() {
    if (!editPlan) return;
    if (!editForm.title.trim()) return toast.error("Enter a plan name.");
    setBusy(true);
    try {
      await workoutService.updatePlan(editPlan.id, {
        title: editForm.title.trim(),
        description: editForm.description || undefined,
        difficulty: editForm.difficulty,
        durationWeeks: editForm.durationWeeks ? Number(editForm.durationWeeks) : undefined,
      });
      toast.success("Workout plan updated.");
      setEditPlan(null);
      await load();
    } catch {
      toast.error("Failed to update plan.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await workoutService.deletePlan(deleteTarget.id);
      toast.success("Workout plan deleted.");
      setDeleteTarget(null);
      setDetail(null);
      await load();
    } catch {
      toast.error("Failed to delete plan.");
    } finally {
      setBusy(false);
    }
  }

  async function removeExerciseFromDetail(exerciseRowId: string) {
    if (!detail) return;
    setBusy(true);
    try {
      await workoutService.removeExercise(exerciseRowId);
      const fresh = await workoutService.getById(detail.id);
      setDetail(fresh);
      await load();
    } catch {
      toast.error("Failed to remove exercise.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workout Plans</h1>
          <p className="text-sm text-(--text-secondary)">
            Create workout plans and assign them to one or more of your members.
          </p>
        </div>
        <Button iconLeft={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>
          Create Workout Plan
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-(--text-secondary)">Loading…</p>
      ) : plans.length === 0 ? (
        <Card variant="default" padding="lg">
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Dumbbell className="h-8 w-8 text-(--text-muted)" />
            <p className="text-sm text-(--text-secondary)">
              No workout plans yet. Click <strong>Create Workout Plan</strong> to build one.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {plans.map((p) => {
            const days = planDays(p);
            return (
              <Card key={p.id} variant="default" padding="lg" className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold">{p.title}</h2>
                    <p className="text-xs text-(--text-muted)">
                      {p.difficulty} · {p.exercises?.length ?? 0} exercises ·{" "}
                      {p.completions?.length ?? 0} completions
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-(--surface-secondary) px-3 py-1 text-xs font-medium">
                    {memberName(p.memberId)}
                  </span>
                </div>

                {/* Day chips — make the schedule unmistakable on the card. */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-(--text-muted)" />
                  {days.length === 0 ? (
                    <span className="text-xs text-(--text-muted)">No days scheduled</span>
                  ) : (
                    days.map((d) => (
                      <span key={d} className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                        Day {d} · {DAY_SHORT[d]}
                      </span>
                    ))
                  )}
                </div>

                {p.description ? (
                  <p className="line-clamp-2 text-sm text-(--text-secondary)">{p.description}</p>
                ) : null}

                <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                  <Button variant="secondary" size="sm" iconLeft={<Eye className="h-4 w-4" />} onClick={() => setDetail(p)}>
                    View
                  </Button>
                  <Button variant="ghost" size="sm" iconLeft={<Pencil className="h-4 w-4" />} onClick={() => openEdit(p)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" iconLeft={<Trash2 className="h-4 w-4 text-primary" />} onClick={() => setDeleteTarget(p)}>
                    Delete
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create plan modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create Workout Plan"
        description="Build a plan and assign it to one or more members."
        size="xl"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : `Save & Assign${memberIds.length ? ` (${memberIds.length})` : ""}`}
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <MemberMultiSelect options={members} value={memberIds} onChange={setMemberIds} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Plan name / goal"
              placeholder="e.g. Push Pull Legs"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Select
              label="Difficulty"
              options={DIFFICULTIES.map((d) => ({ value: d, label: d }))}
              placeholder="Select difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            />
            <Input
              label="Duration (weeks)"
              type="number"
              value={durationWeeks}
              onChange={(e) => setDurationWeeks(e.target.value)}
            />
          </div>
          <Textarea
            label="Description (optional)"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* Exercise builder */}
          <div className="rounded-2xl border border-border p-4">
            <h3 className="mb-3 text-sm font-semibold">Add exercises</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Input
                label="Exercise name"
                placeholder="e.g. Bench Press"
                value={exForm.name}
                onChange={(e) => setExForm({ ...exForm, name: e.target.value })}
              />
              <Select
                label="Muscle group"
                options={MUSCLE_GROUPS.map((m) => ({ value: m, label: m.replace("_", " ") }))}
                placeholder="Muscle group"
                value={exForm.muscleGroup}
                onChange={(e) => setExForm({ ...exForm, muscleGroup: e.target.value as MuscleGroup })}
              />
              <Select
                label="Day"
                options={DAYS}
                placeholder="Day"
                value={exForm.dayNumber}
                onChange={(e) => setExForm({ ...exForm, dayNumber: e.target.value })}
              />
              <Input
                label="Sets"
                type="number"
                value={exForm.sets}
                onChange={(e) => setExForm({ ...exForm, sets: e.target.value })}
              />
              <Input
                label="Reps"
                placeholder="e.g. 8-12"
                value={exForm.reps}
                onChange={(e) => setExForm({ ...exForm, reps: e.target.value })}
              />
              <Input
                label="Rest (sec)"
                type="number"
                value={exForm.restSeconds}
                onChange={(e) => setExForm({ ...exForm, restSeconds: e.target.value })}
              />
              <Input
                label="Video URL (optional)"
                placeholder="https://…"
                value={exForm.videoUrl}
                onChange={(e) => setExForm({ ...exForm, videoUrl: e.target.value })}
              />
              <Input
                label="Notes (optional)"
                value={exForm.notes}
                onChange={(e) => setExForm({ ...exForm, notes: e.target.value })}
              />
              <div className="flex items-end">
                <Button
                  variant="secondary"
                  fullWidth
                  iconLeft={<Plus className="h-4 w-4" />}
                  onClick={addStagedExercise}
                >
                  Add exercise
                </Button>
              </div>
            </div>

            {staged.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {staged.map((ex) => (
                  <li
                    key={ex.key}
                    className="flex items-center justify-between gap-3 rounded-xl bg-(--surface-secondary) px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 truncate">
                      <strong>{ex.name}</strong> · {ex.muscleGroup} · Day {ex.dayNumber} ·{" "}
                      {ex.sets}×{ex.reps}
                      {ex.restSeconds ? ` · ${ex.restSeconds}s` : ""}
                    </span>
                    <button
                      type="button"
                      aria-label="Remove exercise"
                      onClick={() => setStaged((prev) => prev.filter((s) => s.key !== ex.key))}
                      className="shrink-0 rounded-lg p-1.5 text-(--text-secondary) hover:bg-(--surface-hover)"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-(--text-muted)">No exercises added yet.</p>
            )}
          </div>
        </div>
      </Modal>

      {/* Detail modal — full plan view */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.title ?? "Workout Plan"}
        description={detail ? `${detail.difficulty} · assigned to ${memberName(detail.memberId)}` : undefined}
        size="lg"
        footer={
          <div className="flex justify-between gap-3">
            <Button variant="ghost" iconLeft={<Trash2 className="h-4 w-4 text-primary" />} onClick={() => detail && setDeleteTarget(detail)}>
              Delete
            </Button>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => detail && openEdit(detail)}>Edit details</Button>
              <Button onClick={() => setDetail(null)}>Close</Button>
            </div>
          </div>
        }
      >
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Member" value={memberName(detail.memberId)} />
              <Stat label="Difficulty" value={detail.difficulty} />
              <Stat label="Duration" value={detail.durationWeeks ? `${detail.durationWeeks} wks` : "—"} />
              <Stat label="Completions" value={String(detail.completions?.length ?? 0)} />
            </div>
            {detail.description && (
              <p className="text-sm text-(--text-secondary)">{detail.description}</p>
            )}

            {planDays(detail).length === 0 ? (
              <p className="text-sm text-(--text-muted)">No exercises in this plan yet.</p>
            ) : (
              planDays(detail).map((day) => {
                const dayExercises = (detail.exercises ?? []).filter((e) => e.dayNumber === day);
                return (
                  <div key={day} className="rounded-xl border border-border">
                    <div className="flex items-center gap-2 border-b border-border bg-(--surface-secondary) px-4 py-2">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      <span className="text-sm font-bold text-(--text-primary)">Day {day} · {DAY_SHORT[day]}</span>
                      <span className="text-xs text-(--text-muted)">{dayExercises.length} exercise{dayExercises.length === 1 ? "" : "s"}</span>
                    </div>
                    <ul className="divide-y divide-border">
                      {dayExercises.map((e) => (
                        <li key={e.id} className="flex items-start justify-between gap-3 px-4 py-2.5">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-(--text-primary)">{e.exercise?.name}</p>
                            <p className="text-xs text-(--text-muted)">
                              {e.sets} sets × {e.reps} reps
                              {e.restSeconds ? ` · ${e.restSeconds}s rest` : ""}
                              {e.exercise?.muscleGroup ? ` · ${e.exercise.muscleGroup.replace("_", " ")}` : ""}
                            </p>
                            {e.notes && <p className="mt-0.5 text-xs text-(--text-secondary)">{e.notes}</p>}
                          </div>
                          <button
                            type="button"
                            aria-label="Remove exercise"
                            disabled={busy}
                            onClick={() => removeExerciseFromDetail(e.id)}
                            className="shrink-0 rounded-lg p-1.5 text-(--text-muted) hover:bg-primary/10 hover:text-primary disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })
            )}
          </div>
        )}
      </Modal>

      {/* Edit details modal */}
      <Modal
        open={!!editPlan}
        onClose={() => !busy && setEditPlan(null)}
        title="Edit Workout Plan"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setEditPlan(null)} disabled={busy}>Cancel</Button>
            <Button onClick={handleEditSave} loading={busy}>Save Changes</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Plan name" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
          <Textarea label="Description" rows={2} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Difficulty"
              options={DIFFICULTIES.map((d) => ({ value: d, label: d }))}
              value={editForm.difficulty}
              onChange={(e) => setEditForm({ ...editForm, difficulty: e.target.value as Difficulty })}
            />
            <Input label="Duration (weeks)" type="number" value={editForm.durationWeeks} onChange={(e) => setEditForm({ ...editForm, durationWeeks: e.target.value })} />
          </div>
          <p className="text-xs text-(--text-muted)">To add or remove exercises, use the View → plan detail.</p>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!deleteTarget}
        onClose={() => !busy && setDeleteTarget(null)}
        title="Delete workout plan?"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={busy}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} loading={busy}>Delete</Button>
          </div>
        }
      >
        <p className="text-sm text-(--text-secondary)">
          Permanently delete <strong className="text-(--text-primary)">{deleteTarget?.title}</strong> for{" "}
          <strong className="text-(--text-primary)">{memberName(deleteTarget?.memberId)}</strong>? This removes the plan,
          its exercises, and that member's completion history for it. This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-(--surface-secondary) px-3 py-2">
      <p className="text-[11px] font-bold uppercase tracking-wide text-(--text-muted)">{label}</p>
      <p className="mt-0.5 truncate text-sm font-bold text-(--text-primary)">{value}</p>
    </div>
  );
}
