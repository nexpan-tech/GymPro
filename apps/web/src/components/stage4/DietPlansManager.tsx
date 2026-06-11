import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Salad, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/forms/Input";
import Select from "@/components/forms/Select";
import Textarea from "@/components/forms/Textarea";
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

interface MemberOption { id: string; name: string }

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

export default function DietPlansManager() {
  const toast = useToast();
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [plans, setPlans] = useState<DietPlanFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [memberId, setMemberId] = useState("");
  const [goal, setGoal] = useState("");
  const [notes, setNotes] = useState("");
  const [mealForm, setMealForm] = useState({ ...emptyMeal });
  const [staged, setStaged] = useState<StagedMeal[]>([]);

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
    setMemberId("");
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
    if (!memberId) return toast.error("Select a member to assign this plan to.");
    if (staged.length === 0) return toast.error("Add at least one meal.");

    setSaving(true);
    try {
      const plan = await dietService.createBuilderPlan({
        memberId,
        goal: goal || undefined,
        notes: notes || undefined,
      });

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

      toast.success("Diet plan created and assigned.");
      setOpen(false);
      resetForm();
      await load();
    } catch {
      toast.error("Failed to save diet plan.");
    } finally {
      setSaving(false);
    }
  }

  const memberOptions = members.map((m) => ({ value: m.id, label: m.name }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Diet Plans</h1>
          <p className="text-sm text-(--text-secondary)">
            Create diet plans with meals and macros, and assign them to your members.
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
                {p.notes ? <p className="text-sm text-(--text-secondary)">{p.notes}</p> : null}
                {p.meals?.length ? (
                  <ul className="space-y-1 text-sm text-(--text-secondary)">
                    {p.meals.slice(0, 4).map((m) => (
                      <li key={m.id}>
                        • {m.mealType.replace("_", " ")}: {m.title}
                        {m.calories ? ` — ${m.calories} kcal` : ""}
                      </li>
                    ))}
                    {p.meals.length > 4 ? (
                      <li className="text-(--text-muted)">+{p.meals.length - 4} more…</li>
                    ) : null}
                  </ul>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create Diet Plan"
        description="Build a meal plan and assign it to a member."
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
    </div>
  );
}
