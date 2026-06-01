import { router, useLocalSearchParams } from "expo-router";
import { Dumbbell, Salad } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { trainerApi } from "../../src/api/trainer.api";
import { dietService } from "../../src/services/diet.service";
import type { DietPlan } from "../../src/services/diet.service";
import { workoutService } from "../../src/services/workout.service";
import type { WorkoutPlan } from "../../src/services/workout.service";
import type { AssignedMember } from "../../src/types/trainer.types";
import type { Attendance } from "../../src/types/attendance.types";
import { useTheme, type Theme } from "../../src/theme";
import {
  AppAvatar,
  AppButton,
  AppCard,
  AppHeader,
  AppLoadingState,
  AppScreen,
  AppText,
} from "../../src/components/ui";

type Tab = "overview" | "workouts" | "diet" | "progress";

function useThemedStyles() {
  const { theme } = useTheme();
  return useMemo(() => makeStyles(theme), [theme]);
}

export default function MemberDetailScreen() {
  const { memberId } = useLocalSearchParams<{ memberId: string }>();
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useThemedStyles();

  const [member, setMember] = useState<AssignedMember | null>(null);
  const [workout, setWorkout] = useState<WorkoutPlan | null>(null);
  const [diet, setDiet] = useState<DietPlan | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const loadDetail = useCallback(async () => {
    if (!memberId) return;
    try {
      const [memberData, workoutData, dietData, todayData] = await Promise.all([
        trainerApi.getMemberDetail(memberId).catch(() => null),
        workoutService.getByMember(memberId).catch(() => null),
        dietService.getByMember(memberId).catch(() => null),
        trainerApi.getTodayAttendance().catch(() => [] as Attendance[]),
      ]);
      setMember(memberData);
      setWorkout(workoutData);
      setDiet(dietData);
      const memberAttendance = (Array.isArray(todayData) ? todayData : []).filter(
        (a) => a.memberId === memberId,
      );
      setAttendance(memberAttendance);
    } catch (error) {
      console.log("Member detail load failed", error);
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  if (loading) {
    return (
      <AppScreen>
        <AppHeader title="Member" onBack={() => router.back()} />
        <AppLoadingState rows={3} />
      </AppScreen>
    );
  }

  if (!member) {
    return (
      <View style={styles.center}>
        <AppText variant="heading">Member not found.</AppText>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <AppText variant="bodyStrong" color="primary">
            Go back
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  const name = member.user?.name ?? "Member";

  const DAYS: (keyof WorkoutPlan | keyof DietPlan)[] = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  const workoutDaysCount = workout
    ? DAYS.filter((d) => (workout as unknown as Record<string, unknown>)[d]).length
    : 0;
  const dietDaysCount = diet
    ? DAYS.filter((d) => (diet as unknown as Record<string, unknown>)[d]).length
    : 0;

  const streak = attendance.length;

  return (
    <AppScreen>
      <AppHeader title="Member" onBack={() => router.back()} />

      {/* Member Header */}
      <AppCard variant="elevated">
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <AppAvatar name={name} size={64} />
          <View style={{ flex: 1, gap: 4 }}>
            <AppText variant="heading">{name}</AppText>
            {member.user?.email ? (
              <AppText variant="caption" color="textMuted">
                {member.user.email}
              </AppText>
            ) : null}
            <View style={styles.planBadge}>
              <AppText variant="caption" color="primary">
                {member.fitnessGoal ?? "General Fitness"}
              </AppText>
            </View>
          </View>
        </View>
      </AppCard>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {(["overview", "workouts", "diet", "progress"] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabItem, activeTab === t && { backgroundColor: c.primary }]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabText, activeTab === t && { color: c.onPrimary }]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === "overview" && <OverviewTab member={member} />}
      {activeTab === "workouts" && (
        <WorkoutsTab workout={workout} daysCount={workoutDaysCount} />
      )}
      {activeTab === "diet" && <DietTab diet={diet} daysCount={dietDaysCount} />}
      {activeTab === "progress" && <ProgressTab attendance={attendance} streak={streak} />}

      {/* Actions */}
      <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
        <AppButton
          style={{ flex: 1 }}
          icon={<Dumbbell color="#fff" size={18} />}
          onPress={() => router.push({ pathname: "/trainer/workouts", params: { memberId } })}
        >
          Edit Workout
        </AppButton>
        <AppButton
          style={{ flex: 1, backgroundColor: c.success }}
          icon={<Salad color="#fff" size={18} />}
          onPress={() =>
            router.push({ pathname: "/trainer/workouts", params: { memberId, mode: "diet" } })
          }
        >
          Edit Diet
        </AppButton>
      </View>
    </AppScreen>
  );
}

function OverviewTab({ member }: { member: AssignedMember }) {
  return (
    <View style={{ gap: 12 }}>
      <InfoItem label="Fitness Goal" value={member.fitnessGoal ?? "Not set"} />
      <InfoItem label="Phone" value={member.phone ?? "Not provided"} />
      <InfoItem label="Trainer" value="You" />
      <InfoItem label="Gym" value={member.gymId ?? "—"} />
    </View>
  );
}

function WorkoutsTab({ workout, daysCount }: { workout: WorkoutPlan | null; daysCount: number }) {
  const styles = useThemedStyles();
  if (!workout) {
    return (
      <AppCard>
        <AppText variant="bodyStrong">No workout plan assigned.</AppText>
        <AppText variant="caption" color="textSecondary" style={{ marginTop: 6 }}>
          Use the Edit Workout button to create one.
        </AppText>
      </AppCard>
    );
  }
  const DAYS: (keyof WorkoutPlan)[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  return (
    <View style={{ gap: 12 }}>
      <AppCard>
        <AppText variant="subtitle">Workout Plan</AppText>
        {workout.goal ? (
          <AppText variant="caption" color="primary" style={{ marginTop: 4 }}>
            Goal: {workout.goal}
          </AppText>
        ) : null}
        <AppText variant="caption" color="textSecondary" style={{ marginTop: 4 }}>
          {daysCount} day{daysCount !== 1 ? "s" : ""} scheduled
        </AppText>
      </AppCard>
      {DAYS.map((day) => {
        const val = (workout as unknown as Record<string, unknown>)[day] as string | null;
        if (!val) return null;
        return (
          <AppCard key={day}>
            <Text style={styles.dayLabel}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
            <Text style={styles.dayValue}>{val}</Text>
          </AppCard>
        );
      })}
    </View>
  );
}

function DietTab({ diet, daysCount }: { diet: DietPlan | null; daysCount: number }) {
  const styles = useThemedStyles();
  if (!diet) {
    return (
      <AppCard>
        <AppText variant="bodyStrong">No diet plan assigned.</AppText>
        <AppText variant="caption" color="textSecondary" style={{ marginTop: 6 }}>
          Use the Edit Diet button to create one.
        </AppText>
      </AppCard>
    );
  }
  const DAYS: (keyof DietPlan)[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  return (
    <View style={{ gap: 12 }}>
      <AppCard>
        <AppText variant="subtitle">Diet Plan</AppText>
        {diet.goal ? (
          <AppText variant="caption" color="primary" style={{ marginTop: 4 }}>
            Goal: {diet.goal}
          </AppText>
        ) : null}
        <AppText variant="caption" color="textSecondary" style={{ marginTop: 4 }}>
          {daysCount} day{daysCount !== 1 ? "s" : ""} scheduled
        </AppText>
      </AppCard>
      {DAYS.map((day) => {
        const val = (diet as unknown as Record<string, unknown>)[day] as string | null;
        if (!val) return null;
        return (
          <AppCard key={day}>
            <Text style={styles.dayLabel}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
            <Text style={styles.dayValue}>{val}</Text>
          </AppCard>
        );
      })}
    </View>
  );
}

function ProgressTab({ attendance, streak }: { attendance: Attendance[]; streak: number }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useThemedStyles();
  return (
    <View style={{ gap: 12 }}>
      <AppCard>
        <AppText variant="subtitle">Attendance Streak</AppText>
        <Text style={[styles.streakValue, { color: c.primary }]}>{streak}</Text>
        <AppText variant="caption" color="textSecondary">
          check-ins recorded
        </AppText>
      </AppCard>

      {attendance.length === 0 ? (
        <AppCard>
          <AppText variant="bodyStrong">No recent check-ins.</AppText>
        </AppCard>
      ) : (
        attendance.map((a) => (
          <AppCard key={a.id}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={[styles.checkInDot, { backgroundColor: c.success }]} />
              <View>
                <AppText variant="bodyStrong">
                  {new Date(a.date).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </AppText>
                <AppText variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
                  Checked in at{" "}
                  {new Date(a.checkInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </AppText>
              </View>
            </View>
          </AppCard>
        ))
      )}
    </View>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <AppCard>
      <AppText variant="caption" color="textSecondary" style={{ marginBottom: 4 }}>
        {label}
      </AppText>
      <AppText variant="bodyStrong">{value}</AppText>
    </AppCard>
  );
}

function makeStyles(theme: Theme) {
  const c = theme.colors;
  return StyleSheet.create({
    center: {
      flex: 1,
      backgroundColor: c.background,
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    },
    planBadge: {
      alignSelf: "flex-start",
      backgroundColor: c.primarySoft,
      borderWidth: 1,
      borderColor: c.primary,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 3,
      marginTop: 4,
    },
    tabBar: {
      flexDirection: "row",
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: theme.radius.md,
      padding: 4,
      gap: 4,
    },
    tabItem: { flex: 1, paddingVertical: 8, borderRadius: theme.radius.sm, alignItems: "center" },
    tabText: { color: c.textMuted, fontSize: 12, fontWeight: "800" },
    dayLabel: { color: c.textSecondary, fontSize: 12, fontWeight: "700", marginBottom: 4, textTransform: "capitalize" },
    dayValue: { color: c.textPrimary, fontSize: 14, fontWeight: "800", lineHeight: 20 },
    streakValue: { fontSize: 48, fontWeight: "900", marginVertical: 4 },
    checkInDot: { height: 10, width: 10, borderRadius: 5 },
  });
}
