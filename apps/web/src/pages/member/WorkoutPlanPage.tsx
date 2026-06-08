import { useCallback, useEffect, useState } from "react";
import { Dumbbell } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { memberService } from "@/services/member.service";
import { workoutService, type WorkoutPlanFull } from "@/services/workout.service";
import type { Member } from "@/types/member.types";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function WorkoutPlanPage() {
  const [member, setMember] = useState<Member | null>(null);
  const [plan, setPlan] = useState<WorkoutPlanFull | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPlan = useCallback(async () => {
    try {
      const [profile, plans] = await Promise.all([
        memberService.getMyProfile(),
        workoutService.getMy(),
      ]);
      setMember(profile);
      setPlan(plans[0] ?? null);
    } catch (error) {
      console.error("Failed to load workout plan:", error);
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlan();
  }, [loadPlan]);

  if (loading) {
    return <div className="text-(--text-secondary)">Loading workout plan...</div>;
  }

  const exercises = plan?.exercises ?? [];
  const dayNumbers = Array.from(new Set(exercises.map((e) => e.dayNumber))).sort(
    (a, b) => a - b,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workout Plan"
        description="Your trainer-assigned weekly workout schedule."
      />

      <Card variant="premium">
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-(image:--gradient-primary) text-white">
              <Dumbbell className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-semibold text-(--text-secondary)">
                Current Plan
              </p>
              <h2 className="text-2xl font-black text-(--text-primary)">
                {plan?.title || member?.fitnessGoal || "No plan assigned"}
              </h2>
            </div>
          </div>

          {plan?.description && (
            <p className="mt-5 rounded-2xl bg-(--surface-secondary) p-4 text-sm leading-6 text-(--text-secondary)">
              {plan.description}
            </p>
          )}
        </CardContent>
      </Card>

      {exercises.length === 0 ? (
        <Card variant="glass">
          <CardContent>
            <p className="py-6 text-center text-sm text-(--text-secondary)">
              No workout plan assigned yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {dayNumbers.map((dayNumber) => {
            const dayExercises = exercises.filter((e) => e.dayNumber === dayNumber);
            return (
              <Card key={dayNumber} variant="glass" hover>
                <CardHeader>
                  <CardTitle>{DAY_LABELS[dayNumber - 1] ?? `Day ${dayNumber}`}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dayExercises.map((e) => (
                      <div key={e.id} className="border-b border-(--border) pb-2 last:border-0">
                        <p className="text-sm font-medium text-(--text-primary)">
                          {e.exercise?.name}
                        </p>
                        <p className="text-xs text-(--text-secondary)">
                          {e.sets} × {e.reps}
                          {e.restSeconds ? `  ·  ${e.restSeconds}s rest` : ""}
                          {e.exercise?.muscleGroup ? `  ·  ${e.exercise.muscleGroup}` : ""}
                        </p>
                        {e.notes ? (
                          <p className="text-xs text-(--text-muted)">{e.notes}</p>
                        ) : null}
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
