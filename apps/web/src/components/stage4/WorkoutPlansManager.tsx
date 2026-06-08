import { useCallback, useEffect, useMemo, useState } from "react";
import { Dumbbell, Plus, Trash2, UserPlus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/forms/Input";
import Select from "@/components/forms/Select";
import Textarea from "@/components/forms/Textarea";
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

interface MemberOption { id: string; name: string }

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

export default function WorkoutPlansManager() {
  const toast = useToast();
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [plans, setPlans] = useState<WorkoutPlanFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // create-plan form
  const [memberId, setMemberId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("BEGINNER");
  const [durationWeeks, setDurationWeeks] = useState("4");
  const [exForm, setExForm] = useState({ ...emptyExercise });
  const [staged, setStaged] = useState<StagedExercise[]>([]);

  // assign modal
  const [assignFor, setAssignFor] = useState<WorkoutPlanFull | null>(null);
  const [assignMemberId, setAssignMemberId] = useState("");

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
    setMemberId("");
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
    if (!memberId) return toast.error("Select a member to assign this plan to.");
    if (!title.trim()) return toast.error("Enter a workout plan name.");
    if (staged.length === 0) return toast.error("Add at least one exercise.");

    setSaving(true);
    try {
      const plan = await workoutService.createPlan({
        memberId,
        title: title.trim(),
        description: description || undefined,
        difficulty,
        durationWeeks: durationWeeks ? Number(durationWeeks) : undefined,
      });

      for (const ex of staged) {
        const exercise = await exerciseService.create({
          name: ex.name,
          muscleGroup: ex.muscleGroup,
          difficulty,
          videoUrl: ex.videoUrl,
        });
        await workoutService.addExercise(plan.id, {
          exerciseId: exercise.id,
          dayNumber: ex.dayNumber,
          sets: ex.sets,
          reps: ex.reps,
          restSeconds: ex.restSeconds,
          notes: ex.notes,
        });
      }

      toast.success("Workout plan created and assigned.");
      setOpen(false);
      resetForm();
      await load();
    } catch {
      toast.error("Failed to save workout plan.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAssign() {
    if (!assignFor || !assignMemberId) return;
    setSaving(true);
    try {
      await workoutService.assign(assignFor.id, assignMemberId);
      toast.success("Plan assigned.");
      setAssignFor(null);
      setAssignMemberId("");
      await load();
    } catch {
      toast.error("Failed to assign plan.");
    } finally {
      setSaving(false);
    }
  }

  const memberOptions = members.map((m) => ({ value: m.id, label: m.name }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workout Plans</h1>
          <p className="text-sm text-(--text-secondary)">
            Create workout plans and assign them to your members.
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
          {plans.map((p) => (
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
              {p.description ? (
                <p className="text-sm text-(--text-secondary)">{p.description}</p>
              ) : null}
              {p.exercises?.length ? (
                <ul className="space-y-1 text-sm text-(--text-secondary)">
                  {p.exercises.slice(0, 4).map((e) => (
                    <li key={e.id}>
                      • {e.exercise?.name} — {e.sets}×{e.reps}
                      {e.restSeconds ? ` (${e.restSeconds}s rest)` : ""}
                    </li>
                  ))}
                  {p.exercises.length > 4 ? (
                    <li className="text-(--text-muted)">+{p.exercises.length - 4} more…</li>
                  ) : null}
                </ul>
              ) : null}
              <div>
                <Button
                  variant="secondary"
                  size="sm"
                  iconLeft={<UserPlus className="h-4 w-4" />}
                  onClick={() => {
                    setAssignFor(p);
                    setAssignMemberId(p.memberId ?? "");
                  }}
                >
                  Assign to member
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create plan modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create Workout Plan"
        description="Build a plan and assign it to a member."
        size="xl"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save & Assign"}
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Assign to member"
              options={memberOptions}
              placeholder="Select a member"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
            />
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
          <div className="rounded-2xl border border-(--border) p-4">
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

      {/* Assign modal */}
      <Modal
        open={!!assignFor}
        onClose={() => setAssignFor(null)}
        title="Assign plan to member"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setAssignFor(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={saving || !assignMemberId}>
              {saving ? "Assigning…" : "Assign"}
            </Button>
          </div>
        }
      >
        <Select
          label="Member"
          options={memberOptions}
          placeholder="Select a member"
          value={assignMemberId}
          onChange={(e) => setAssignMemberId(e.target.value)}
        />
      </Modal>
    </div>
  );
}
