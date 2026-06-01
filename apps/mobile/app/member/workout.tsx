import { router } from "expo-router";
import { CheckCircle2, Circle, Dumbbell } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { TouchableOpacity, ScrollView, View } from "react-native";

import { memberService } from "../../src/services/member.service";
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

// ─── day config (unchanged) ──────────────────────────────────────────────────

const DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

type DayKey = (typeof DAY_KEYS)[number];

const DAY_LABELS: Record<DayKey, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

function todayKey(): DayKey {
  const map: DayKey[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return map[new Date().getDay()];
}

interface Exercise {
  id: string;
  name: string;
  detail: string;
}

function parseExercises(raw: string | null | undefined): Exercise[] {
  if (!raw) return [];
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, i) => {
      const dashIdx = line.indexOf(" - ");
      if (dashIdx > -1) {
        return {
          id: String(i),
          name: line.slice(0, dashIdx),
          detail: line.slice(dashIdx + 3),
        };
      }
      return { id: String(i), name: line, detail: "" };
    });
}

// ─── screen ──────────────────────────────────────────────────────────────────

export default function WorkoutScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState<DayKey>(todayKey());
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  const loadPlan = useCallback(async () => {
    try {
      const profile = await memberService.getMyProfile();
      if (profile?.id) {
        const data = await workoutService.getByMember(profile.id);
        setPlan(data);
      }
    } catch (err) {
      console.log("Workout load failed", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlan();
  }, [loadPlan]);

  function toggleExercise(key: string) {
    setCompleted((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const exercises = parseExercises(plan?.[activeDay] ?? null);
  const doneCount = exercises.filter((e) => completed[`${activeDay}:${e.id}`]).length;

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
        subtitle={plan?.goal || "Your weekly training schedule"}
        onBack={() => router.back()}
      />

      {/* Day tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
      >
        {DAY_KEYS.map((day) => {
          const isActive = day === activeDay;
          const isToday = day === todayKey();
          return (
            <TouchableOpacity
              key={day}
              onPress={() => setActiveDay(day)}
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
                {DAY_LABELS[day]}
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
                {DAY_LABELS[activeDay]} Progress
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
          description={`No exercises assigned for ${DAY_LABELS[activeDay]}.`}
        />
      ) : (
        <View style={{ gap: 10 }}>
          {exercises.map((exercise) => {
            const key = `${activeDay}:${exercise.id}`;
            const done = !!completed[key];
            return (
              <TouchableOpacity
                key={key}
                onPress={() => toggleExercise(key)}
                activeOpacity={0.85}
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
                        {exercise.name}
                      </AppText>
                      {exercise.detail ? (
                        <AppText variant="caption" color="textMuted" style={{ marginTop: 3 }}>
                          {exercise.detail}
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
                        {done ? "Done" : "Mark Done"}
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
