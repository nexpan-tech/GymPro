import { router } from "expo-router";
import { ArrowLeft, CheckCircle2, Circle, Dumbbell } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AppCard from "../../src/components/AppCard";
import { memberService } from "../../src/services/member.service";
import {
  workoutService,
  type WorkoutPlan,
} from "../../src/services/workout.service";

// ─── day config ──────────────────────────────────────────────────────────────

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

// ─── parse exercises from free-text ──────────────────────────────────────────

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
      // Try to split "Exercise Name - 3x12, 60s rest" style
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
  const doneCount = exercises.filter((e) => completed[`${activeDay}:${e.id}`])
    .length;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#6366f1" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft color="#f8fafc" size={22} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Workout Plan</Text>
          <Text style={styles.subtitle}>
            {plan?.goal || "Your weekly training schedule"}
          </Text>
        </View>
      </View>

      {/* Day tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
        style={{ marginBottom: 20 }}
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
                borderRadius: 14,
                backgroundColor: isActive ? "#4f46e5" : "#0f172a",
                borderWidth: 1,
                borderColor: isActive
                  ? "#4f46e5"
                  : isToday
                  ? "rgba(99,102,241,0.4)"
                  : "rgba(148,163,184,0.14)",
              }}
            >
              <Text
                style={{
                  color: isActive ? "#fff" : isToday ? "#818cf8" : "#64748b",
                  fontWeight: "800",
                  fontSize: 13,
                }}
              >
                {DAY_LABELS[day]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Progress summary */}
      {exercises.length > 0 && (
        <AppCard style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View
              style={{
                height: 44,
                width: 44,
                borderRadius: 16,
                backgroundColor: "#4f46e5",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Dumbbell color="#fff" size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "700" }}>
                {DAY_LABELS[activeDay]} Progress
              </Text>
              <Text
                style={{
                  color: "#f8fafc",
                  fontSize: 16,
                  fontWeight: "900",
                  marginTop: 2,
                }}
              >
                {doneCount} / {exercises.length} exercises done
              </Text>
            </View>
            {doneCount === exercises.length && exercises.length > 0 && (
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 10,
                  backgroundColor: "rgba(52,211,153,0.12)",
                  borderWidth: 1,
                  borderColor: "rgba(52,211,153,0.3)",
                }}
              >
                <Text
                  style={{ color: "#34d399", fontWeight: "900", fontSize: 12 }}
                >
                  Complete!
                </Text>
              </View>
            )}
          </View>

          {/* Progress bar */}
          <View
            style={{
              marginTop: 12,
              height: 5,
              borderRadius: 3,
              backgroundColor: "#1e293b",
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
                backgroundColor: "#4f46e5",
              }}
            />
          </View>
        </AppCard>
      )}

      {/* Exercise list */}
      {exercises.length === 0 ? (
        <AppCard>
          <View style={{ alignItems: "center", paddingVertical: 20 }}>
            <Dumbbell color="#334155" size={34} />
            <Text
              style={{
                color: "#475569",
                marginTop: 12,
                fontWeight: "700",
                textAlign: "center",
                lineHeight: 22,
              }}
            >
              Rest day — no exercises assigned{"\n"}for{" "}
              {DAY_LABELS[activeDay]}day.
            </Text>
          </View>
        </AppCard>
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
                <AppCard
                  style={{
                    borderColor: done
                      ? "rgba(52,211,153,0.3)"
                      : "rgba(148,163,184,0.14)",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 14,
                    }}
                  >
                    {done ? (
                      <CheckCircle2 color="#34d399" size={24} />
                    ) : (
                      <Circle color="#334155" size={24} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: done ? "#64748b" : "#f8fafc",
                          fontWeight: "900",
                          fontSize: 15,
                          textDecorationLine: done ? "line-through" : "none",
                        }}
                      >
                        {exercise.name}
                      </Text>
                      {exercise.detail ? (
                        <Text
                          style={{
                            color: "#64748b",
                            fontSize: 13,
                            marginTop: 3,
                          }}
                        >
                          {exercise.detail}
                        </Text>
                      ) : null}
                    </View>
                    <View
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 10,
                        backgroundColor: done ? "rgba(52,211,153,0.1)" : "#1e293b",
                      }}
                    >
                      <Text
                        style={{
                          color: done ? "#34d399" : "#94a3b8",
                          fontSize: 11,
                          fontWeight: "800",
                        }}
                      >
                        {done ? "Done" : "Mark Done"}
                      </Text>
                    </View>
                  </View>
                </AppCard>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = {
  screen: { flex: 1, backgroundColor: "#020617" },
  content: { padding: 20, paddingTop: 64, paddingBottom: 48 },
  center: {
    flex: 1,
    backgroundColor: "#020617",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 14,
    marginBottom: 24,
  },
  backButton: {
    height: 44,
    width: 44,
    borderRadius: 16,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.18)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  title: { color: "#f8fafc", fontSize: 26, fontWeight: "900" as const },
  subtitle: { color: "#94a3b8", marginTop: 4, fontSize: 13 },
};
