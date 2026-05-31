import { router } from "expo-router";
import { Plus } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { trainerApi } from "../../src/api/trainer.api";
import type { WorkoutPlan } from "../../src/api/trainer.api";
import AppCard from "../../src/components/AppCard";

type Difficulty = "Beginner" | "Intermediate" | "Advanced" | "Unknown";

function getDifficulty(plan: WorkoutPlan): Difficulty {
  const exercises = plan.exercises ?? [];
  const count = exercises.length;
  if (count === 0) return "Unknown";
  if (count <= 3) return "Beginner";
  if (count <= 7) return "Intermediate";
  return "Advanced";
}

function difficultyColor(d: Difficulty): string {
  if (d === "Beginner") return "#059669";
  if (d === "Intermediate") return "#d97706";
  if (d === "Advanced") return "#dc2626";
  return "#64748b";
}

export default function TrainerWorkoutsScreen() {
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPlans = useCallback(async () => {
    try {
      const data = await trainerApi.getMyWorkoutPlans();
      setPlans(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("Workouts load failed", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadPlans();
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.headerArea}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Workout Plans</Text>
            <Text style={styles.subtitle}>
              {plans.length} plan{plans.length !== 1 ? "s" : ""} created
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            activeOpacity={0.85}
            onPress={() => {
              // Navigate to workout creation (not in scope — placeholder)
            }}
          >
            <Plus color="#fff" size={22} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={plans}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>No workout plans yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap the + button to create your first plan.
            </Text>
          </View>
        }
        renderItem={({ item }) => <WorkoutPlanCard plan={item} />}
      />
    </View>
  );
}

function WorkoutPlanCard({ plan }: { plan: WorkoutPlan }) {
  const difficulty = getDifficulty(plan);
  const diffColor = difficultyColor(difficulty);
  const exerciseCount = plan.exercises?.length ?? 0;
  const assignedTo = plan.memberId ? "Assigned Member" : "Template";

  return (
    <AppCard style={{ marginBottom: 12 }}>
      <View style={styles.planRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.planTitle}>{plan.name}</Text>
          <Text style={styles.planAssigned}>{assignedTo}</Text>
          <View style={styles.planMeta}>
            <Text style={styles.metaText}>
              {exerciseCount} exercise{exerciseCount !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        <View
          style={[styles.diffBadge, { backgroundColor: diffColor + "22", borderColor: diffColor + "55" }]}
        >
          <Text style={[styles.diffText, { color: diffColor }]}>
            {difficulty}
          </Text>
        </View>
      </View>

      {plan.description ? (
        <Text style={styles.planDescription} numberOfLines={2}>
          {plan.description}
        </Text>
      ) : null}

      {plan.createdAt ? (
        <Text style={styles.planDate}>
          Created{" "}
          {new Date(plan.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </Text>
      ) : null}
    </AppCard>
  );
}

const styles = {
  screen: { flex: 1, backgroundColor: "#020617" },
  center: {
    flex: 1,
    backgroundColor: "#020617",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  headerArea: {
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
  },
  title: {
    color: "#f8fafc",
    fontSize: 30,
    fontWeight: "900" as const,
  },
  subtitle: {
    color: "#94a3b8",
    marginTop: 4,
  },
  addBtn: {
    height: 48,
    width: 48,
    borderRadius: 18,
    backgroundColor: "#4f46e5",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  planRow: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 12,
    marginBottom: 8,
  },
  planTitle: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "900" as const,
    marginBottom: 4,
  },
  planAssigned: {
    color: "#64748b",
    fontSize: 12,
    marginBottom: 6,
  },
  planMeta: {
    flexDirection: "row" as const,
    gap: 8,
  },
  metaText: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "700" as const,
  },
  diffBadge: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-start" as const,
  },
  diffText: {
    fontSize: 11,
    fontWeight: "900" as const,
  },
  planDescription: {
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  planDate: {
    color: "#475569",
    fontSize: 11,
    marginTop: 8,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingTop: 60,
    gap: 10,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 8 },
  emptyTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "900" as const,
  },
  emptySubtitle: {
    color: "#94a3b8",
    textAlign: "center" as const,
  },
};
