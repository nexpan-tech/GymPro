import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { CheckCircle2, Circle, Clock, Dumbbell, Flame } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TouchableOpacity, View } from "react-native";

import {
  workoutService,
  type WorkoutAssignmentFull,
  type WorkoutWeek,
} from "../../src/services/workout.service";
import { personalWorkoutApi, type PersonalWorkout } from "../../src/api/personal.api";
import { useTheme } from "../../src/theme";
import { useCelebrate } from "../../src/components/CelebrationProvider";
import {
  AppBadge,
  AppCard,
  AppEmptyState,
  AppHeader,
  AppLoadingState,
  AppScreen,
  AppText,
  ProgressRing,
} from "../../src/components/ui";

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const cap = (s?: string | null) => (s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : "");

// Today's assigned workout — sourced from the calendar-day assignment engine
// (GET /workouts/today). The card can never show the wrong day.
export default function WorkoutScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const celebrate = useCelebrate();

  const [assignment, setAssignment] = useState<WorkoutAssignmentFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [week, setWeek] = useState<WorkoutWeek | null>(null);
  const [showWeek, setShowWeek] = useState(false);
  const [personal, setPersonal] = useState<PersonalWorkout[]>([]);

  const load = useCallback(async () => {
    try {
      const [today, p] = await Promise.all([
        workoutService.getToday(),
        personalWorkoutApi.list(false).catch(() => [] as PersonalWorkout[]),
      ]);
      setPersonal(p);
      const a = today.assignments[0] ?? null;
      setAssignment(a);
      if (a?.status === "COMPLETED") {
        const seeded: Record<string, boolean> = {};
        (a.workoutPlan.exercises ?? []).forEach((e) => { seeded[e.id] = true; });
        setCompleted(seeded);
      } else {
        setCompleted({});
      }
    } catch (err) {
      console.log("Workout load failed", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (showWeek && !week) void workoutService.getWeek(0).then(setWeek).catch(() => setWeek(null));
  }, [showWeek, week]);

  const personalToday = personal.filter((p) => (p.dayOfWeek ?? "").toLowerCase() === WEEKDAYS[new Date().getDay()]);

  const personalTodaySection = personalToday.length > 0 ? (
    <View style={{ gap: 8, marginTop: 8 }}>
      <AppText variant="overline" color="primary">Personal Plan · Today</AppText>
      {personalToday.map((p) => (
        <TouchableOpacity key={p.id} onPress={() => router.push("/member/personal-workouts")} activeOpacity={0.85}>
          <AppCard>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong" numberOfLines={1}>{p.title}</AppText>
                <AppText variant="caption" color="textMuted" numberOfLines={1}>
                  {p.exercises.length} exercise{p.exercises.length === 1 ? "" : "s"}{p.estMinutes ? ` · ~${p.estMinutes}m` : ""}{p.category ? ` · ${cap(p.category)}` : ""}
                </AppText>
              </View>
              <AppBadge label="Personal" tone="neutral" />
            </View>
          </AppCard>
        </TouchableOpacity>
      ))}
    </View>
  ) : null;

  const weekSection = (
    <View style={{ gap: 8, marginTop: 8 }}>
      <TouchableOpacity onPress={() => router.push("/member/personal-workouts")} activeOpacity={0.8}>
        <AppCard>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <AppText variant="bodyStrong">My Personal Workouts</AppText>
            <AppText variant="label" color="primary">Open →</AppText>
          </View>
          <AppText variant="caption" color="textMuted" style={{ marginTop: 2 }}>Your own private workouts — separate from trainer plans.</AppText>
        </AppCard>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setShowWeek((s) => !s)} activeOpacity={0.8}>
        <AppText variant="label" color="primary">{showWeek ? "Hide weekly schedule" : "View weekly schedule"}</AppText>
      </TouchableOpacity>
      {showWeek ? (
        !week ? (
          <AppText variant="caption" color="textMuted">Loading week…</AppText>
        ) : (
          week.days.map((d) => {
            const dayPersonal = personal.filter((p) => (p.dayOfWeek ?? "").toLowerCase() === d.weekday.toLowerCase());
            return (
            <AppCard key={d.date} style={{ opacity: d.status === "REST" && dayPersonal.length === 0 ? 0.6 : 1, borderColor: d.isToday ? c.primary : c.border }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flex: 1 }}>
                  <AppText variant="overline" color="textMuted">Trainer Assigned</AppText>
                  <AppText variant="bodyStrong" style={{ textTransform: "capitalize" }}>{d.weekday}{d.isToday ? " · Today" : ""}</AppText>
                  <AppText variant="caption" color="textMuted" numberOfLines={1}>
                    {d.plan ? `${d.plan.title} · ${d.plan.exerciseCount} ex · ~${d.plan.estMinutes}m` : "Rest day"}
                  </AppText>
                </View>
                <AppText variant="caption" style={{ color: d.status === "COMPLETED" ? c.success : d.status === "MISSED" ? c.danger : c.textMuted, fontWeight: "800" }}>
                  {d.status}
                </AppText>
              </View>
              {dayPersonal.length > 0 ? (
                <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: c.border }}>
                  <AppText variant="overline" color="primary">Personal Plan</AppText>
                  {dayPersonal.map((p) => (
                    <AppText key={p.id} variant="caption" color="textSecondary" numberOfLines={1} style={{ marginTop: 2 }}>
                      {p.title} · {p.exercises.length} ex{p.estMinutes ? ` · ~${p.estMinutes}m` : ""}
                    </AppText>
                  ))}
                </View>
              ) : null}
            </AppCard>
            );
          })
        )
      ) : null}
    </View>
  );

  const exercises = assignment?.workoutPlan.exercises ?? [];
  const doneCount = exercises.filter((e) => completed[e.id]).length;
  const allDone = exercises.length > 0 && doneCount === exercises.length;
  const progress = exercises.length > 0 ? doneCount / exercises.length : 0;
  const sessionDone = assignment?.status === "COMPLETED";

  const estMinutes = useMemo(
    () =>
      Math.max(
        exercises.length ? 5 : 0,
        Math.round(exercises.reduce((s, e) => s + e.sets * ((e.restSeconds || 45) + 35), 0) / 60),
      ),
    [exercises],
  );

  const focus = useMemo(() => {
    const set = new Set<string>();
    exercises.forEach((e) => e.exercise.muscleGroup && set.add(e.exercise.muscleGroup));
    return Array.from(set).slice(0, 3);
  }, [exercises]);

  async function markDone(ex: { id: string; dayNumber: number }) {
    if (!assignment || completed[ex.id] || saving) return;
    setSaving(ex.id);
    try {
      await workoutService.complete({
        workoutPlanId: assignment.workoutPlan.id,
        workoutExerciseId: ex.id,
        dayNumber: ex.dayNumber,
      });
      setCompleted((prev) => ({ ...prev, [ex.id]: true }));
    } catch (err) {
      console.log("Mark complete failed", err);
    } finally {
      setSaving(null);
    }
  }

  async function finishSession() {
    if (!assignment || finishing || sessionDone) return;
    setFinishing(true);
    try {
      await workoutService.completeAssignment(assignment.id);
      celebrate("WORKOUT");
      await load();
    } catch (err) {
      console.log("Finish session failed", err);
    } finally {
      setFinishing(false);
    }
  }

  if (loading) {
    return (
      <AppScreen>
        <AppHeader title="Today's Workout" onBack={() => router.back()} />
        <AppLoadingState rows={4} />
      </AppScreen>
    );
  }

  if (!assignment) {
    return (
      <AppScreen>
        <AppHeader title="Today's Workout" onBack={() => router.back()} />
        <AppEmptyState
          emoji="🛌"
          title="Rest & recover"
          description="No workout is scheduled for today. Recovery is where the gains lock in — hydrate, stretch, and come back strong."
        />
        {personalTodaySection}
        {weekSection}
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <AppHeader
        title="Today's Workout"
        subtitle={assignment.workoutPlan.title}
        onBack={() => router.back()}
      />

      {/* ── Session overview — premium dark command card ─────────────────────── */}
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
            position: "absolute", top: -50, right: -34, height: 140, width: 140,
            borderRadius: 999, backgroundColor: c.primary, opacity: allDone || sessionDone ? 0.32 : 0.2,
          }}
        />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 18 }}>
          <ProgressRing progress={sessionDone ? 1 : progress} size={92} dotSize={7} trackColor="rgba(255,255,255,0.16)">
            <AppText style={{ fontSize: 22, fontWeight: "900", color: "#FFFFFF" }}>
              {Math.round((sessionDone ? 1 : progress) * 100)}%
            </AppText>
          </ProgressRing>

          <View style={{ flex: 1, gap: 6 }}>
            <AppText variant="overline" style={{ color: "rgba(255,255,255,0.55)", letterSpacing: 1 }}>
              Today's Session
            </AppText>
            <AppText variant="heading" style={{ color: "#FFFFFF" }}>
              {sessionDone || allDone ? "Session complete 🔥" : `${doneCount} of ${exercises.length} done`}
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
                <AppText variant="caption" style={{ color: "rgba(255,255,255,0.7)" }}>~{estMinutes} min</AppText>
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
                  paddingHorizontal: 10, paddingVertical: 5, borderRadius: theme.radius.pill,
                  backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
                }}
              >
                <AppText variant="caption" style={{ color: "#FFFFFF" }}>{f}</AppText>
              </View>
            ))}
          </View>
        ) : null}

        {sessionDone ? (
          <View
            style={{
              marginTop: 14, flexDirection: "row", alignItems: "center", gap: 8,
              paddingHorizontal: 12, paddingVertical: 10, borderRadius: theme.radius.md,
              backgroundColor: "rgba(231,55,37,0.18)", borderWidth: 1, borderColor: "rgba(231,55,37,0.4)",
            }}
          >
            <Flame color={c.primary} size={16} />
            <AppText variant="caption" style={{ color: "#FFFFFF", flex: 1 }}>
              Every rep counted. You showed up today — that's how transformations are built.
            </AppText>
          </View>
        ) : null}
      </LinearGradient>

      {/* Exercise list */}
      {exercises.length === 0 ? (
        <AppEmptyState emoji="📋" title="No exercises" description="This workout has no exercises listed yet." />
      ) : (
        <View style={{ gap: 10 }}>
          {exercises.map((ex, idx) => {
            const done = !!completed[ex.id];
            const detailParts = [ex.restSeconds ? `${ex.restSeconds}s rest` : null, ex.exercise.muscleGroup].filter(Boolean);
            return (
              <TouchableOpacity key={ex.id} onPress={() => markDone(ex)} activeOpacity={0.85} disabled={done || saving === ex.id || sessionDone}>
                <AppCard style={{ borderColor: done ? c.primary : c.border }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                    <View
                      style={{
                        height: 34, width: 34, borderRadius: theme.radius.sm, alignItems: "center", justifyContent: "center",
                        backgroundColor: done ? c.primarySoft : c.muted, borderWidth: 1, borderColor: done ? c.primary : c.border,
                      }}
                    >
                      {done ? <CheckCircle2 color={c.primary} size={18} /> : (
                        <AppText style={{ fontWeight: "900", color: c.textSecondary }}>{idx + 1}</AppText>
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <AppText
                        variant="bodyStrong"
                        style={{ color: done ? c.textMuted : c.textPrimary, textDecorationLine: done ? "line-through" : "none" }}
                      >
                        {ex.exercise.name}
                      </AppText>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                        <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: theme.radius.sm, backgroundColor: c.primarySoft }}>
                          <AppText variant="caption" style={{ color: c.primary, fontWeight: "800" }}>{ex.sets} × {ex.reps}</AppText>
                        </View>
                        {detailParts.length > 0 ? <AppText variant="caption" color="textMuted">{detailParts.join(" · ")}</AppText> : null}
                      </View>
                      {ex.notes ? <AppText variant="caption" color="textSecondary" style={{ marginTop: 4 }}>{ex.notes}</AppText> : null}
                    </View>

                    {done || sessionDone ? null : <Circle color={c.textMuted} size={22} />}
                  </View>

                  {!done && !sessionDone ? (
                    <View style={{ marginTop: 12, height: 38, borderRadius: theme.radius.sm, backgroundColor: c.primary, alignItems: "center", justifyContent: "center" }}>
                      <AppText variant="label" style={{ color: c.onPrimary }}>{saving === ex.id ? "Saving…" : "Mark Done"}</AppText>
                    </View>
                  ) : null}
                </AppCard>
              </TouchableOpacity>
            );
          })}

          {/* Complete the whole session */}
          {!sessionDone ? (
            <TouchableOpacity onPress={finishSession} activeOpacity={0.85} disabled={finishing}>
              <View
                style={{
                  marginTop: 4, height: 50, borderRadius: theme.radius.md, alignItems: "center", justifyContent: "center",
                  flexDirection: "row", gap: 8, backgroundColor: allDone ? c.primary : c.surface, borderWidth: 1, borderColor: c.primary,
                }}
              >
                <CheckCircle2 color={allDone ? c.onPrimary : c.primary} size={18} />
                <AppText variant="label" style={{ color: allDone ? c.onPrimary : c.primary }}>
                  {finishing ? "Saving…" : "Complete session"}
                </AppText>
              </View>
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {personalTodaySection}
      {weekSection}
    </AppScreen>
  );
}
