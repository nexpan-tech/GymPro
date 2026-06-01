import { Plus } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { trainerApi } from "../../src/api/trainer.api";
import type { WorkoutPlan } from "../../src/api/trainer.api";
import { useTheme, type Theme } from "../../src/theme";
import { AppCard, AppEmptyState, AppText } from "../../src/components/ui";

type Difficulty = "Beginner" | "Intermediate" | "Advanced" | "Unknown";

function getDifficulty(plan: WorkoutPlan): Difficulty {
  const count = (plan.exercises ?? []).length;
  if (count === 0) return "Unknown";
  if (count <= 3) return "Beginner";
  if (count <= 7) return "Intermediate";
  return "Advanced";
}

export default function TrainerWorkoutsScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => makeStyles(theme), [theme]);

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
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <View style={styles.headerArea}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <AppText variant="title">Workout Plans</AppText>
            <AppText variant="caption" color="textSecondary" style={{ marginTop: 4 }}>
              {plans.length} plan{plans.length !== 1 ? "s" : ""} created
            </AppText>
          </View>
          <TouchableOpacity style={styles.addBtn} activeOpacity={0.85} onPress={() => {}}>
            <Plus color="#fff" size={22} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={plans}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={c.primary} />
        }
        ListEmptyComponent={
          <AppEmptyState
            emoji="📋"
            title="No workout plans yet"
            description="Tap the + button to create your first plan."
          />
        }
        renderItem={({ item }) => <WorkoutPlanCard plan={item} />}
      />
    </SafeAreaView>
  );
}

function WorkoutPlanCard({ plan }: { plan: WorkoutPlan }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const difficulty = getDifficulty(plan);
  const diffColor =
    difficulty === "Beginner"
      ? c.success
      : difficulty === "Intermediate"
        ? c.warning
        : difficulty === "Advanced"
          ? c.danger
          : c.textMuted;
  const exerciseCount = plan.exercises?.length ?? 0;
  const assignedTo = plan.memberId ? "Assigned Member" : "Template";

  return (
    <AppCard style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
        <View style={{ flex: 1 }}>
          <AppText variant="subtitle">{plan.name}</AppText>
          <AppText variant="caption" color="textMuted" style={{ marginTop: 4 }}>
            {assignedTo}
          </AppText>
          <AppText variant="label" color="textSecondary" style={{ marginTop: 6 }}>
            {exerciseCount} exercise{exerciseCount !== 1 ? "s" : ""}
          </AppText>
        </View>
        <View style={[styles.diffBadge, { backgroundColor: diffColor + "22", borderColor: diffColor }]}>
          <Text style={{ color: diffColor, fontSize: 11, fontWeight: "900" }}>{difficulty}</Text>
        </View>
      </View>

      {plan.description ? (
        <AppText variant="caption" color="textSecondary" numberOfLines={2} style={{ lineHeight: 19, marginTop: 4 }}>
          {plan.description}
        </AppText>
      ) : null}

      {plan.createdAt ? (
        <AppText variant="caption" color="textMuted" style={{ marginTop: 8 }}>
          Created{" "}
          {new Date(plan.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </AppText>
      ) : null}
    </AppCard>
  );
}

function makeStyles(theme: Theme) {
  const c = theme.colors;
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.background },
    center: { flex: 1, backgroundColor: c.background, alignItems: "center", justifyContent: "center" },
    headerArea: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
    addBtn: {
      height: 48,
      width: 48,
      borderRadius: theme.radius.lg,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    list: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
    diffBadge: { borderWidth: 1, borderRadius: theme.radius.sm, paddingHorizontal: 10, paddingVertical: 5, alignSelf: "flex-start" },
  });
}
