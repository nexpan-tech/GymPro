import { router } from "expo-router";
import { CheckCircle2, Circle, Dumbbell } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TouchableOpacity, ScrollView, View } from "react-native";

import {
  workoutService,
  type WorkoutPlan,
} from "../../src/services/workout.service";
import { useTheme } from "../../src/theme";
import {
  AppCard,
  AppEmptyState,
  AppHeader,
  AppLoadingState,
  AppScreen,
  AppText,
} from "../../src/components/ui";

// ─── day config ──────────────────────────────────────────────────────────────
// Workout plans store exercises against a numeric dayNumber (1 = Mon … 7 = Sun).

const DAYS: { dayNumber: number; label: string }[] = [
  { dayNumber: 1, label: "Mon" },
  { dayNumber: 2, label: "Tue" },
  { dayNumber: 3, label: "Wed" },
  { dayNumber: 4, label: "Thu" },
  { dayNumber: 5, label: "Fri" },
  { dayNumber: 6, label: "Sat" },
  { dayNumber: 7, label: "Sun" },
];

function todayNumber(): number {
  const js = new Date().getDay(); // 0 = Sun … 6 = Sat
  return js === 0 ? 7 : js;
}

function dayLabel(dayNumber: number): string {
  return DAYS.find((d) => d.dayNumber === dayNumber)?.label ?? "Day";
}

// ─── screen ──────────────────────────────────────────────────────────────────

export default function WorkoutScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState<number>(todayNumber());
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const loadPlan = useCallback(async () => {
    try {
      const plans = await workoutService.getMyPlans();
      const active = plans[0] ?? null;
      setPlan(active);

      // Seed completion state from already-recorded completions.
      const seeded: Record<string, boolean> = {};
      for (const comp of active?.completions ?? []) {
        if (comp.workoutExerciseId) seeded[comp.workoutExerciseId] = true;
      }
      setCompleted(seeded);
    } catch (err) {
      console.log("Workout load failed", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlan();
  }, [loadPlan]);

  const exercises = useMemo(
    () => (plan?.exercises ?? []).filter((e) => e.dayNumber === activeDay),
    [plan, activeDay],
  );

  const doneCount = exercises.filter((e) => completed[e.id]).length;

  async function markDone(exerciseId: string) {
    if (!plan || completed[exerciseId] || saving) return;
    setSaving(exerciseId);
    try {
      await workoutService.complete({
        workoutPlanId: plan.id,
        workoutExerciseId: exerciseId,
        dayNumber: activeDay,
      });
      setCompleted((prev) => ({ ...prev, [exerciseId]: true }));
    } catch (err) {
      console.log("Mark complete failed", err);
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <AppScreen>
        <AppHeader title="Workout Plan" onBack={() => router.back()} />
        <AppLoadingState rows={4} />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <AppHeader
        title="Workout Plan"
        subtitle={plan?.title || "Your weekly training schedule"}
        onBack={() => router.back()}
      />

      {/* Day tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
      >
        {DAYS.map((day) => {
          const isActive = day.dayNumber === activeDay;
          const isToday = day.dayNumber === todayNumber();
          return (
            <TouchableOpacity
              key={day.dayNumber}
              onPress={() => setActiveDay(day.dayNumber)}
              activeOpacity={0.8}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: theme.radius.md,
                backgroundColor: isActive ? c.primary : c.surface,
                borderWidth: 1,
                borderColor: isActive ? c.primary : isToday ? c.primary : c.border,
              }}
            >
              <AppText
                variant="label"
                style={{
                  color: isActive ? c.onPrimary : isToday ? c.primary : c.textMuted,
                }}
              >
                {day.label}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Progress summary */}
      {exercises.length > 0 ? (
        <AppCard>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View
              style={{
                height: 44,
                width: 44,
                borderRadius: theme.radius.md,
                backgroundColor: c.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Dumbbell color="#fff" size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="caption" color="textSecondary">
                {dayLabel(activeDay)} Progress
              </AppText>
              <AppText variant="subtitle" style={{ marginTop: 2 }}>
                {doneCount} / {exercises.length} exercises done
              </AppText>
            </View>
            {doneCount === exercises.length && exercises.length > 0 ? (
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: theme.radius.sm,
                  backgroundColor: c.successSoft,
                  borderWidth: 1,
                  borderColor: c.success,
                }}
              >
                <AppText variant="caption" style={{ color: c.success }}>
                  Complete!
                </AppText>
              </View>
            ) : null}
          </View>

          <View
            style={{
              marginTop: 12,
              height: 5,
              borderRadius: 3,
              backgroundColor: c.muted,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: "100%",
                width:
                  exercises.length > 0
                    ? `${Math.round((doneCount / exercises.length) * 100)}%`
                    : "0%",
                borderRadius: 3,
                backgroundColor: c.primary,
              }}
            />
          </View>
        </AppCard>
      ) : null}

      {/* Exercise list */}
      {exercises.length === 0 ? (
        <AppEmptyState
          emoji="🛌"
          title="Rest day"
          description={`No exercises assigned for ${dayLabel(activeDay)}.`}
        />
      ) : (
        <View style={{ gap: 10 }}>
          {exercises.map((ex) => {
            const done = !!completed[ex.id];
            const detailParts = [
              `${ex.sets} × ${ex.reps}`,
              ex.restSeconds ? `${ex.restSeconds}s rest` : null,
              ex.exercise.muscleGroup,
            ].filter(Boolean);
            return (
              <TouchableOpacity
                key={ex.id}
                onPress={() => markDone(ex.id)}
                activeOpacity={0.85}
                disabled={done || saving === ex.id}
              >
                <AppCard style={{ borderColor: done ? c.success : c.border }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                    {done ? (
                      <CheckCircle2 color={c.success} size={24} />
                    ) : (
                      <Circle color={c.textMuted} size={24} />
                    )}
                    <View style={{ flex: 1 }}>
                      <AppText
                        variant="bodyStrong"
                        style={{
                          color: done ? c.textMuted : c.textPrimary,
                          textDecorationLine: done ? "line-through" : "none",
                        }}
                      >
                        {ex.exercise.name}
                      </AppText>
                      {detailParts.length > 0 ? (
                        <AppText variant="caption" color="textMuted" style={{ marginTop: 3 }}>
                          {detailParts.join(" · ")}
                        </AppText>
                      ) : null}
                      {ex.notes ? (
                        <AppText variant="caption" color="textSecondary" style={{ marginTop: 3 }}>
                          {ex.notes}
                        </AppText>
                      ) : null}
                    </View>
                    <View
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: theme.radius.sm,
                        backgroundColor: done ? c.successSoft : c.muted,
                      }}
                    >
                      <AppText
                        variant="caption"
                        style={{ color: done ? c.success : c.textSecondary }}
                      >
                        {saving === ex.id ? "Saving…" : done ? "Done" : "Mark Done"}
                      </AppText>
                    </View>
                  </View>
                </AppCard>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </AppScreen>
  );
}
