import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Salad, Trash2, Pencil, Eye, CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/forms/Input";
import Select from "@/components/forms/Select";
import Textarea from "@/components/forms/Textarea";
import MemberMultiSelect from "@/components/forms/MemberMultiSelect";
import { useToast } from "@/hooks/useToast";
import { memberService } from "@/services/member.service";
import {
  dietService,
  type DietPlanFull,
  type MealType,
} from "@/services/diet.service";

const MEAL_TYPES: MealType[] = [
  "BREAKFAST", "LUNCH", "DINNER", "SNACK", "PRE_WORKOUT", "POST_WORKOUT",
];
const DAYS = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];
const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_SHORT: Record<string, string> = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun",
};

interface MemberOption { id: string; name: string; subtitle?: string }

interface StagedMeal {
  key: string;
  dayOfWeek: string;
  mealType: MealType;
  foodName: string;
  quantity: string;
  calories: string;
  protein: string;
  carbs: string;
  fats: string;
  notes: string;
}

const emptyMeal = {
  dayOfWeek: "monday",
  mealType: "BREAKFAST" as MealType,
  foodName: "",
  quantity: "",
  calories: "",
  protein: "",
  carbs: "",
  fats: "",
  notes: "",
};

const num = (v: string) => (v.trim() === "" ? undefined : Number(v));

/** Ordered weekdays a plan has meals for. */
function planDays(p: DietPlanFull): string[] {
  return DAY_ORDER.filter((d) => (p.meals ?? []).some((m) => (m.dayOfWeek ?? "").toLowerCase() === d));
}

export default function DietPlansManager() {
  const toast = useToast();
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [plans, setPlans] = useState<DietPlanFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [goal, setGoal] = useState("");
  const [notes, setNotes] = useState("");
  const [mealForm, setMealForm] = useState({ ...emptyMeal });
  const [staged, setStaged] = useState<StagedMeal[]>([]);

  // detail / edit / delete
  const [detail, setDetail] = useState<DietPlanFull | null>(null);
  const [editPlan, setEditPlan] = useState<DietPlanFull | null>(null);
  const [editForm, setEditForm] = useState({ goal: "", notes: "" });
  const [deleteTarget, setDeleteTarget] = useState<DietPlanFull | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [memRes, planList] = await Promise.all([
        memberService.list(),
        dietService.listBuilderPlans(),
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
      toast.error("Failed to load diet plans.");
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
    setGoal("");
    setNotes("");
    setMealForm({ ...emptyMeal });
    setStaged([]);
  }

  function addStagedMeal() {
    if (!mealForm.foodName.trim()) return toast.error("Enter a food name.");
    setStaged((prev) => [...prev, { key: crypto.randomUUID(), ...mealForm, foodName: mealForm.foodName.trim() }]);
    setMealForm({ ...emptyMeal, dayOfWeek: mealForm.dayOfWeek, mealType: mealForm.mealType });
  }

  async function handleSave() {
    if (memberIds.length === 0) return toast.error("Select at least one member to assign this plan to.");
    if (staged.length === 0) return toast.error("Add at least one meal.");

    setSaving(true);
    try {
      // One plan is upserted per selected member (multi-assign).
      const result = await dietService.createBuilderPlan({
        memberIds,
        goal: goal || undefined,
        notes: notes || undefined,
      });
      const planList = result.plans ?? [result];

      for (const plan of planList) {
        for (const m of staged) {
          const description = [m.quantity && `Qty: ${m.quantity}`, m.notes]
            .filter(Boolean)
            .join(" · ");
          await dietService.addMeal(plan.id, {
            dayOfWeek: m.dayOfWeek,
            mealType: m.mealType,
            title: m.foodName,
            description: description || undefined,
            calories: num(m.calories),
            protein: num(m.protein),
            carbs: num(m.carbs),
            fats: num(m.fats),
          });
        }
      }

      toast.success(`Diet plan assigned to ${planList.length} member${planList.length === 1 ? "" : "s"}.`);
      setOpen(false);
      resetForm();
      await load();
    } catch {
      toast.error("Failed to save diet plan.");
    } finally {
      setSaving(false);
    }
  }

  function openEdit(p: DietPlanFull) {
    setEditPlan(p);
    setEditForm({ goal: p.goal ?? "", notes: p.notes ?? "" });
  }

  async function handleEditSave() {
    if (!editPlan) return;
    setBusy(true);
    try {
      await dietService.updateBuilderPlan(editPlan.id, {
        goal: editForm.goal || undefined,
        notes: editForm.notes || undefined,
      });
      toast.success("Diet plan updated.");
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
      await dietService.deleteBuilderPlan(deleteTarget.id);
      toast.success("Diet plan deleted.");
      setDeleteTarget(null);
      setDetail(null);
      await load();
    } catch {
      toast.error("Failed to delete plan.");
    } finally {
      setBusy(false);
    }
  }

  async function removeMealFromDetail(mealId: string) {
    if (!detail) return;
    setBusy(true);
    try {
      await dietService.deleteMeal(mealId);
      const fresh = await dietService.getBuilderPlanById(detail.id);
      setDetail(fresh);
      await load();
    } catch {
      toast.error("Failed to remove meal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Diet Plans</h1>
          <p className="text-sm text-(--text-secondary)">
            Create diet plans with meals and macros, and assign them to one or more members.
          </p>
        </div>
        <Button iconLeft={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>
          Create Diet Plan
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-(--text-secondary)">Loading…</p>
      ) : plans.length === 0 ? (
        <Card variant="default" padding="lg">
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Salad className="h-8 w-8 text-(--text-muted)" />
            <p className="text-sm text-(--text-secondary)">
              No diet plans yet. Click <strong>Create Diet Plan</strong> to build one.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {plans.map((p) => {
            const totalCals = (p.meals ?? []).reduce((s, m) => s + (m.calories ?? 0), 0);
            const days = planDays(p);
            return (
              <Card key={p.id} variant="default" padding="lg" className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold">{p.goal || "Diet Plan"}</h2>
                    <p className="text-xs text-(--text-muted)">
                      {p.meals?.length ?? 0} meals · {totalCals} kcal total
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-(--surface-secondary) px-3 py-1 text-xs font-medium">
                    {memberName(p.memberId)}
                  </span>
                </div>

                {/* Day chips */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-(--text-muted)" />
                  {days.length === 0 ? (
                    <span className="text-xs text-(--text-muted)">No days scheduled</span>
                  ) : (
                    days.map((d) => (
                      <span key={d} className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                        {DAY_SHORT[d]}
                      </span>
                    ))
                  )}
                </div>

                {p.notes ? <p className="line-clamp-2 text-sm text-(--text-secondary)">{p.notes}</p> : null}

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
        title="Create Diet Plan"
        description="Build a meal plan and assign it to one or more members."
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
              label="Goal"
              placeholder="e.g. Fat loss / Lean bulk"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />
          </div>
          <Textarea
            label="Notes (optional)"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          {/* Meal builder */}
          <div className="rounded-2xl border border-border p-4">
            <h3 className="mb-3 text-sm font-semibold">Add meals</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Select
                label="Day"
                options={DAYS}
                placeholder="Day"
                value={mealForm.dayOfWeek}
                onChange={(e) => setMealForm({ ...mealForm, dayOfWeek: e.target.value })}
              />
              <Select
                label="Meal type"
                options={MEAL_TYPES.map((m) => ({ value: m, label: m.replace("_", " ") }))}
                placeholder="Meal type"
                value={mealForm.mealType}
                onChange={(e) => setMealForm({ ...mealForm, mealType: e.target.value as MealType })}
              />
              <Input
                label="Food name"
                placeholder="e.g. Oats & eggs"
                value={mealForm.foodName}
                onChange={(e) => setMealForm({ ...mealForm, foodName: e.target.value })}
              />
              <Input
                label="Quantity"
                placeholder="e.g. 100g / 2 cups"
                value={mealForm.quantity}
                onChange={(e) => setMealForm({ ...mealForm, quantity: e.target.value })}
              />
              <Input
                label="Calories"
                type="number"
                value={mealForm.calories}
                onChange={(e) => setMealForm({ ...mealForm, calories: e.target.value })}
              />
              <Input
                label="Protein (g)"
                type="number"
                value={mealForm.protein}
                onChange={(e) => setMealForm({ ...mealForm, protein: e.target.value })}
              />
              <Input
                label="Carbs (g)"
                type="number"
                value={mealForm.carbs}
                onChange={(e) => setMealForm({ ...mealForm, carbs: e.target.value })}
              />
              <Input
                label="Fat (g)"
                type="number"
                value={mealForm.fats}
                onChange={(e) => setMealForm({ ...mealForm, fats: e.target.value })}
              />
              <Input
                label="Notes (optional)"
                value={mealForm.notes}
                onChange={(e) => setMealForm({ ...mealForm, notes: e.target.value })}
              />
              <div className="flex items-end">
                <Button
                  variant="secondary"
                  fullWidth
                  iconLeft={<Plus className="h-4 w-4" />}
                  onClick={addStagedMeal}
                >
                  Add meal
                </Button>
              </div>
            </div>

            {staged.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {staged.map((m) => (
                  <li
                    key={m.key}
                    className="flex items-center justify-between gap-3 rounded-xl bg-(--surface-secondary) px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 truncate">
                      <strong>{m.foodName}</strong> · {m.mealType.replace("_", " ")} · {m.dayOfWeek}
                      {m.calories ? ` · ${m.calories} kcal` : ""}
                      {m.protein ? ` · P${m.protein}` : ""}
                      {m.carbs ? ` · C${m.carbs}` : ""}
                      {m.fats ? ` · F${m.fats}` : ""}
                    </span>
                    <button
                      type="button"
                      aria-label="Remove meal"
                      onClick={() => setStaged((prev) => prev.filter((s) => s.key !== m.key))}
                      className="shrink-0 rounded-lg p-1.5 text-(--text-secondary) hover:bg-(--surface-hover)"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-(--text-muted)">No meals added yet.</p>
            )}
          </div>
        </div>
      </Modal>

      {/* Detail modal — full plan view */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.goal || "Diet Plan"}
        description={detail ? `Assigned to ${memberName(detail.memberId)}` : undefined}
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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat label="Member" value={memberName(detail.memberId)} />
              <Stat label="Meals" value={String(detail.meals?.length ?? 0)} />
              <Stat label="Total kcal" value={String((detail.meals ?? []).reduce((s, m) => s + (m.calories ?? 0), 0))} />
            </div>
            {detail.notes && <p className="text-sm text-(--text-secondary)">{detail.notes}</p>}

            {planDays(detail).length === 0 ? (
              <p className="text-sm text-(--text-muted)">No meals in this plan yet.</p>
            ) : (
              planDays(detail).map((day) => {
                const dayMeals = (detail.meals ?? []).filter((m) => (m.dayOfWeek ?? "").toLowerCase() === day);
                return (
                  <div key={day} className="rounded-xl border border-border">
                    <div className="flex items-center gap-2 border-b border-border bg-(--surface-secondary) px-4 py-2">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      <span className="text-sm font-bold capitalize text-(--text-primary)">{day}</span>
                      <span className="text-xs text-(--text-muted)">{dayMeals.length} meal{dayMeals.length === 1 ? "" : "s"}</span>
                    </div>
                    <ul className="divide-y divide-border">
                      {dayMeals.map((m) => (
                        <li key={m.id} className="flex items-start justify-between gap-3 px-4 py-2.5">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-(--text-primary)">
                              <span className="text-primary">{m.mealType.replace("_", " ")}</span> · {m.title}
                            </p>
                            <p className="text-xs text-(--text-muted)">
                              {m.calories != null ? `${m.calories} kcal` : "—"}
                              {m.protein != null ? ` · P ${m.protein}g` : ""}
                              {m.carbs != null ? ` · C ${m.carbs}g` : ""}
                              {m.fats != null ? ` · F ${m.fats}g` : ""}
                            </p>
                            {m.description && <p className="mt-0.5 text-xs text-(--text-secondary)">{m.description}</p>}
                          </div>
                          <button
                            type="button"
                            aria-label="Remove meal"
                            disabled={busy}
                            onClick={() => removeMealFromDetail(m.id)}
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
        title="Edit Diet Plan"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setEditPlan(null)} disabled={busy}>Cancel</Button>
            <Button onClick={handleEditSave} loading={busy}>Save Changes</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Goal" value={editForm.goal} onChange={(e) => setEditForm({ ...editForm, goal: e.target.value })} />
          <Textarea label="Notes" rows={2} value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
          <p className="text-xs text-(--text-muted)">To add or remove meals, use the View → plan detail.</p>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!deleteTarget}
        onClose={() => !busy && setDeleteTarget(null)}
        title="Delete diet plan?"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={busy}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} loading={busy}>Delete</Button>
          </div>
        }
      >
        <p className="text-sm text-(--text-secondary)">
          Permanently delete the diet plan for{" "}
          <strong className="text-(--text-primary)">{memberName(deleteTarget?.memberId)}</strong>? This removes the plan,
          its meals, and that member's diet completion history for it. This cannot be undone.
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
