import { useCallback, useEffect, useState } from "react";
import { Salad } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { memberService } from "@/services/member.service";
import { dietService, type DietPlanFull } from "@/services/diet.service";
import type { Member } from "@/types/member.types";

const DAYS = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
] as const;

function mealTypeLabel(t: string) {
  return t
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function DietPlanPage() {
  const [member, setMember] = useState<Member | null>(null);
  const [plan, setPlan] = useState<DietPlanFull | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPlan = useCallback(async () => {
    try {
      const [profile, data] = await Promise.all([
        memberService.getMyProfile(),
        dietService.getMy(),
      ]);
      setMember(profile);
      setPlan(data);
    } catch (error) {
      console.error("Failed to load diet plan:", error);
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlan();
  }, [loadPlan]);

  if (loading) {
    return <div className="text-(--text-secondary)">Loading diet plan...</div>;
  }

  const meals = plan?.meals ?? [];
  const daysWithMeals = DAYS.filter((day) =>
    meals.some((m) => (m.dayOfWeek ?? "").toLowerCase() === day),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Diet Plan"
        description="Your trainer-assigned weekly nutrition plan."
      />

      <Card variant="premium">
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500 to-teal-600 text-white">
              <Salad className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-semibold text-(--text-secondary)">
                Nutrition Goal
              </p>
              <h2 className="text-2xl font-black text-(--text-primary)">
                {plan?.goal || member?.fitnessGoal || "No goal assigned"}
              </h2>
            </div>
          </div>

          {plan?.notes && (
            <p className="mt-5 rounded-2xl bg-(--surface-secondary) p-4 text-sm leading-6 text-(--text-secondary)">
              {plan.notes}
            </p>
          )}
        </CardContent>
      </Card>

      {meals.length === 0 ? (
        <Card variant="glass">
          <CardContent>
            <p className="py-6 text-center text-sm text-(--text-secondary)">
              No diet plan assigned yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {daysWithMeals.map((day) => {
            const dayMeals = meals.filter(
              (m) => (m.dayOfWeek ?? "").toLowerCase() === day,
            );
            return (
              <Card key={day} variant="glass" hover>
                <CardHeader>
                  <CardTitle className="capitalize">{day}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dayMeals.map((m) => (
                      <div key={m.id} className="border-b border-(--border) pb-2 last:border-0">
                        <p className="text-xs font-semibold uppercase text-emerald-500">
                          {mealTypeLabel(m.mealType)}
                        </p>
                        <p className="text-sm font-medium text-(--text-primary)">
                          {m.title}
                        </p>
                        {m.description ? (
                          <p className="text-xs text-(--text-secondary)">{m.description}</p>
                        ) : null}
                        <p className="mt-1 text-xs text-(--text-muted)">
                          {m.calories != null ? `${m.calories} kcal` : ""}
                          {m.protein != null ? `  ·  P ${m.protein}g` : ""}
                          {m.carbs != null ? `  ·  C ${m.carbs}g` : ""}
                          {m.fats != null ? `  ·  F ${m.fats}g` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
