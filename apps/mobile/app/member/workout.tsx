import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { CheckCircle2, Circle, Clock, Dumbbell, Flame } from "lucide-react-native";
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
  ProgressRing,
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
  const allDone = exercises.length > 0 && doneCount === exercises.length;
  const progress = exercises.length > 0 ? doneCount / exercises.length : 0;

  // Per-day completion for the day tabs.
  const dayStats = useMemo(() => {
    const map: Record<number, { total: number; done: number }> = {};
    for (const e of plan?.exercises ?? []) {
      map[e.dayNumber] ??= { total: 0, done: 0 };
      map[e.dayNumber].total += 1;
      if (completed[e.id]) map[e.dayNumber].done += 1;
    }
    return map;
  }, [plan, completed]);

  // Rough session estimate: per exercise ≈ sets × (rest + ~35s working).
  const estMinutes = useMemo(
    () =>
      Math.max(
        exercises.length ? 5 : 0,
        Math.round(
          exercises.reduce((s, e) => s + e.sets * ((e.restSeconds || 45) + 35), 0) / 60,
        ),
      ),
    [exercises],
  );

  const focus = useMemo(() => {
    const set = new Set<string>();
    exercises.forEach((e) => e.exercise.muscleGroup && set.add(e.exercise.muscleGroup));
    return Array.from(set).slice(0, 3);
  }, [exercises]);

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
        title="Training Session"
        subtitle={plan?.title || "Your weekly training schedule"}
        onBack={() => router.back()}
      />

      {/* Day tabs with completion dots */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
      >
        {DAYS.map((day) => {
          const isActive = day.dayNumber === activeDay;
          const isToday = day.dayNumber === todayNumber();
          const ds = dayStats[day.dayNumber];
          const dayDone = ds && ds.total > 0 && ds.done === ds.total;
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
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
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
              {ds && ds.total > 0 ? (
                <View
                  style={{
                    height: 6,
                    width: 6,
                    borderRadius: 3,
                    backgroundColor: dayDone
                      ? isActive
                        ? c.onPrimary
                        : c.primary
                      : isActive
                        ? "rgba(255,255,255,0.4)"
                        : c.border,
                  }}
                />
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Session overview — premium dark command card ────────────────────── */}
      {exercises.length > 0 ? (
        <LinearGradient
          colors={["#161616", "#010000"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: theme.radius.xl,
            padding: theme.spacing.lg,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.08)",
            overflow: "hidden",
          }}
        >
          <View
            style={{
              position: "absolute",
              top: -50,
              right: -34,
              height: 140,
              width: 140,
              borderRadius: 999,
              backgroundColor: c.primary,
              opacity: allDone ? 0.32 : 0.2,
            }}
          />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 18 }}>
            <ProgressRing progress={progress} size={92} dotSize={7} trackColor="rgba(255,255,255,0.16)">
              <AppText style={{ fontSize: 22, fontWeight: "900", color: "#FFFFFF" }}>
                {Math.round(progress * 100)}%
              </AppText>
            </ProgressRing>

            <View style={{ flex: 1, gap: 6 }}>
              <AppText variant="overline" style={{ color: "rgba(255,255,255,0.55)", letterSpacing: 1 }}>
                {dayLabel(activeDay)} · Today's Session
              </AppText>
              <AppText variant="heading" style={{ color: "#FFFFFF" }}>
                {allDone ? "Session complete 🔥" : `${doneCount} of ${exercises.length} done`}
              </AppText>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 2 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <Dumbbell color={c.primary} size={13} />
                  <AppText variant="caption" style={{ color: "rgba(255,255,255,0.7)" }}>
                    {exercises.length} exercise{exercises.length === 1 ? "" : "s"}
                  </AppText>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <Clock color={c.primary} size={13} />
                  <AppText variant="caption" style={{ color: "rgba(255,255,255,0.7)" }}>
                    ~{estMinutes} min
                  </AppText>
                </View>
              </View>
            </View>
          </View>

          {focus.length > 0 ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
              {focus.map((f) => (
                <View
                  key={f}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: theme.radius.pill,
                    backgroundColor: "rgba(255,255,255,0.08)",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.12)",
                  }}
                >
                  <AppText variant="caption" style={{ color: "#FFFFFF" }}>
                    {f}
                  </AppText>
                </View>
              ))}
            </View>
          ) : null}

          {allDone ? (
            <View
              style={{
                marginTop: 14,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: theme.radius.md,
                backgroundColor: "rgba(231,55,37,0.18)",
                borderWidth: 1,
                borderColor: "rgba(231,55,37,0.4)",
              }}
            >
              <Flame color={c.primary} size={16} />
              <AppText variant="caption" style={{ color: "#FFFFFF", flex: 1 }}>
                Every rep counted. You showed up today — that's how transformations are built.
              </AppText>
            </View>
          ) : null}
        </LinearGradient>
      ) : null}

      {/* Exercise list */}
      {exercises.length === 0 ? (
        <AppEmptyState
          emoji="🛌"
          title="Rest & recover"
          description={`No exercises for ${dayLabel(activeDay)}. Recovery is where the gains lock in — hydrate, stretch, and come back strong.`}
        />
      ) : (
        <View style={{ gap: 10 }}>
          {exercises.map((ex, idx) => {
            const done = !!completed[ex.id];
            const detailParts = [
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
                <AppCard style={{ borderColor: done ? c.primary : c.border }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                    {/* Exercise number / done check */}
                    <View
                      style={{
                        height: 34,
                        width: 34,
                        borderRadius: theme.radius.sm,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: done ? c.primarySoft : c.muted,
                        borderWidth: 1,
                        borderColor: done ? c.primary : c.border,
                      }}
                    >
                      {done ? (
                        <CheckCircle2 color={c.primary} size={18} />
                      ) : (
                        <AppText style={{ fontWeight: "900", color: c.textSecondary }}>
                          {idx + 1}
                        </AppText>
                      )}
                    </View>

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
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                        {/* Sets × reps emphasized as a scoreboard chip */}
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: theme.radius.sm,
                            backgroundColor: c.primarySoft,
                          }}
                        >
                          <AppText variant="caption" style={{ color: c.primary, fontWeight: "800" }}>
                            {ex.sets} × {ex.reps}
                          </AppText>
                        </View>
                        {detailParts.length > 0 ? (
                          <AppText variant="caption" color="textMuted">
                            {detailParts.join(" · ")}
                          </AppText>
                        ) : null}
                      </View>
                      {ex.notes ? (
                        <AppText variant="caption" color="textSecondary" style={{ marginTop: 4 }}>
                          {ex.notes}
                        </AppText>
                      ) : null}
                    </View>

                    {/* Done indicator / circle */}
                    {done ? null : <Circle color={c.textMuted} size={22} />}
                  </View>

                  {!done ? (
                    <View
                      style={{
                        marginTop: 12,
                        height: 38,
                        borderRadius: theme.radius.sm,
                        backgroundColor: c.primary,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <AppText variant="label" style={{ color: c.onPrimary }}>
                        {saving === ex.id ? "Saving…" : "Mark Done"}
                      </AppText>
                    </View>
                  ) : null}
                </AppCard>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </AppScreen>
  );
}
