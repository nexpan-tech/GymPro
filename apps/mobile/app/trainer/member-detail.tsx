import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Dumbbell, Salad } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { trainerApi } from "../../src/api/trainer.api";
import AppButton from "../../src/components/AppButton";
import AppCard from "../../src/components/AppCard";
import { dietService } from "../../src/services/diet.service";
import type { DietPlan } from "../../src/services/diet.service";
import { workoutService } from "../../src/services/workout.service";
import type { WorkoutPlan } from "../../src/services/workout.service";
import type { AssignedMember } from "../../src/types/trainer.types";
import type { Attendance } from "../../src/types/attendance.types";

type Tab = "overview" | "workouts" | "diet" | "progress";

export default function MemberDetailScreen() {
  const { memberId } = useLocalSearchParams<{ memberId: string }>();

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
      const memberAttendance = (
        Array.isArray(todayData) ? todayData : []
      ).filter((a) => a.memberId === memberId);
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
      <View style={styles.center}>
        <ActivityIndicator color="#6366f1" />
      </View>
    );
  }

  if (!member) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Member not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: "#818cf8", fontWeight: "800" as const }}>
            Go back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const name = member.user?.name ?? "Member";
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      {/* Back */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.back()}
        activeOpacity={0.8}
      >
        <ArrowLeft color="#f8fafc" size={20} />
      </TouchableOpacity>

      {/* Member Header */}
      <AppCard style={{ marginBottom: 20 }}>
        <View style={styles.memberHeader}>
          <View style={styles.bigAvatar}>
            <Text style={styles.bigInitials}>{initials}</Text>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.memberName}>{name}</Text>
            {member.user?.email ? (
              <Text style={styles.memberEmail}>{member.user.email}</Text>
            ) : null}
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>
                {member.fitnessGoal ?? "General Fitness"}
              </Text>
            </View>
          </View>
        </View>
      </AppCard>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {(["overview", "workouts", "diet", "progress"] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabItem, activeTab === t && styles.tabItemActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === t && styles.tabTextActive,
              ]}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <OverviewTab member={member} />
      )}
      {activeTab === "workouts" && (
        <WorkoutsTab
          workout={workout}
          memberId={memberId ?? ""}
          daysCount={workoutDaysCount}
        />
      )}
      {activeTab === "diet" && (
        <DietTab
          diet={diet}
          memberId={memberId ?? ""}
          daysCount={dietDaysCount}
        />
      )}
      {activeTab === "progress" && (
        <ProgressTab attendance={attendance} streak={streak} />
      )}

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <AppButton
          style={{ flex: 1, backgroundColor: "#4f46e5" }}
          onPress={() =>
            router.push({
              pathname: "/trainer/workouts",
              params: { memberId },
            })
          }
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Dumbbell color="#fff" size={18} />
            <Text style={{ color: "#fff", fontWeight: "900" as const, fontSize: 14 }}>
              Edit Workout
            </Text>
          </View>
        </AppButton>
        <AppButton
          style={{ flex: 1, backgroundColor: "#059669" }}
          onPress={() =>
            router.push({
              pathname: "/trainer/workouts",
              params: { memberId, mode: "diet" },
            })
          }
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Salad color="#fff" size={18} />
            <Text style={{ color: "#fff", fontWeight: "900" as const, fontSize: 14 }}>
              Edit Diet
            </Text>
          </View>
        </AppButton>
      </View>
    </ScrollView>
  );
}

function OverviewTab({ member }: { member: AssignedMember }) {
  return (
    <View style={{ gap: 12, marginBottom: 20 }}>
      <InfoItem label="Fitness Goal" value={member.fitnessGoal ?? "Not set"} />
      <InfoItem label="Phone" value={member.phone ?? "Not provided"} />
      <InfoItem label="Trainer" value="You" />
      <InfoItem label="Gym" value={member.gymId ?? "—"} />
    </View>
  );
}

function WorkoutsTab({
  workout,
  memberId,
  daysCount,
}: {
  workout: WorkoutPlan | null;
  memberId: string;
  daysCount: number;
}) {
  if (!workout) {
    return (
      <AppCard style={{ marginBottom: 20 }}>
        <Text style={styles.noDataText}>No workout plan assigned.</Text>
        <Text style={styles.noDataSub}>
          Use the Edit Workout button to create one.
        </Text>
      </AppCard>
    );
  }

  const DAYS: (keyof WorkoutPlan)[] = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  return (
    <View style={{ gap: 12, marginBottom: 20 }}>
      <AppCard>
        <Text style={styles.planTitle}>Workout Plan</Text>
        {workout.goal ? (
          <Text style={styles.planGoal}>Goal: {workout.goal}</Text>
        ) : null}
        <Text style={styles.planMeta}>
          {daysCount} day{daysCount !== 1 ? "s" : ""} scheduled
        </Text>
      </AppCard>
      {DAYS.map((day) => {
        const val = (workout as unknown as Record<string, unknown>)[day] as string | null;
        if (!val) return null;
        return (
          <AppCard key={day}>
            <Text style={styles.dayLabel}>
              {day.charAt(0).toUpperCase() + day.slice(1)}
            </Text>
            <Text style={styles.dayValue}>{val}</Text>
          </AppCard>
        );
      })}
    </View>
  );
}

function DietTab({
  diet,
  memberId,
  daysCount,
}: {
  diet: DietPlan | null;
  memberId: string;
  daysCount: number;
}) {
  if (!diet) {
    return (
      <AppCard style={{ marginBottom: 20 }}>
        <Text style={styles.noDataText}>No diet plan assigned.</Text>
        <Text style={styles.noDataSub}>
          Use the Edit Diet button to create one.
        </Text>
      </AppCard>
    );
  }

  const DAYS: (keyof DietPlan)[] = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  return (
    <View style={{ gap: 12, marginBottom: 20 }}>
      <AppCard>
        <Text style={styles.planTitle}>Diet Plan</Text>
        {diet.goal ? (
          <Text style={styles.planGoal}>Goal: {diet.goal}</Text>
        ) : null}
        <Text style={styles.planMeta}>
          {daysCount} day{daysCount !== 1 ? "s" : ""} scheduled
        </Text>
      </AppCard>
      {DAYS.map((day) => {
        const val = (diet as unknown as Record<string, unknown>)[day] as string | null;
        if (!val) return null;
        return (
          <AppCard key={day}>
            <Text style={styles.dayLabel}>
              {day.charAt(0).toUpperCase() + day.slice(1)}
            </Text>
            <Text style={styles.dayValue}>{val}</Text>
          </AppCard>
        );
      })}
    </View>
  );
}

function ProgressTab({
  attendance,
  streak,
}: {
  attendance: Attendance[];
  streak: number;
}) {
  return (
    <View style={{ gap: 12, marginBottom: 20 }}>
      <AppCard>
        <Text style={styles.planTitle}>Attendance Streak</Text>
        <Text style={styles.streakValue}>{streak}</Text>
        <Text style={styles.streakLabel}>check-ins recorded</Text>
      </AppCard>

      {attendance.length === 0 ? (
        <AppCard>
          <Text style={styles.noDataText}>No recent check-ins.</Text>
        </AppCard>
      ) : (
        attendance.map((a) => (
          <AppCard key={a.id}>
            <View style={styles.checkInRow}>
              <View style={styles.checkInDot} />
              <View>
                <Text style={styles.checkInDate}>
                  {new Date(a.date).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
                <Text style={styles.checkInTime}>
                  Checked in at{" "}
                  {new Date(a.checkInAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
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
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </AppCard>
  );
}

const styles = {
  screen: { flex: 1, backgroundColor: "#020617" },
  content: { padding: 20, paddingTop: 64, paddingBottom: 40 },
  center: {
    flex: 1,
    backgroundColor: "#020617",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    padding: 20,
  },
  errorText: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "900" as const,
  },
  backBtn: {
    height: 44,
    width: 44,
    borderRadius: 16,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.18)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 20,
  },
  memberHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 16,
  },
  bigAvatar: {
    height: 64,
    width: 64,
    borderRadius: 22,
    backgroundColor: "#312e81",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  bigInitials: {
    color: "#c7d2fe",
    fontSize: 22,
    fontWeight: "900" as const,
  },
  memberName: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "900" as const,
  },
  memberEmail: {
    color: "#64748b",
    fontSize: 13,
  },
  planBadge: {
    alignSelf: "flex-start" as const,
    backgroundColor: "rgba(99,102,241,0.15)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.35)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 4,
  },
  planBadgeText: {
    color: "#818cf8",
    fontSize: 11,
    fontWeight: "900" as const,
  },
  tabBar: {
    flexDirection: "row" as const,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.18)",
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center" as const,
  },
  tabItemActive: {
    backgroundColor: "#4f46e5",
  },
  tabText: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "800" as const,
  },
  tabTextActive: {
    color: "#fff",
  },
  infoLabel: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700" as const,
    marginBottom: 4,
  },
  infoValue: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "900" as const,
  },
  noDataText: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "800" as const,
    marginBottom: 6,
  },
  noDataSub: {
    color: "#94a3b8",
    fontSize: 13,
  },
  planTitle: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "900" as const,
    marginBottom: 6,
  },
  planGoal: {
    color: "#818cf8",
    fontSize: 13,
    fontWeight: "700" as const,
    marginBottom: 4,
  },
  planMeta: {
    color: "#94a3b8",
    fontSize: 13,
  },
  dayLabel: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700" as const,
    marginBottom: 4,
    textTransform: "capitalize" as const,
  },
  dayValue: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "800" as const,
    lineHeight: 20,
  },
  streakValue: {
    color: "#6366f1",
    fontSize: 48,
    fontWeight: "900" as const,
    marginVertical: 4,
  },
  streakLabel: {
    color: "#94a3b8",
    fontSize: 13,
  },
  checkInRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  checkInDot: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: "#22c55e",
  },
  checkInDate: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "900" as const,
  },
  checkInTime: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: "row" as const,
    gap: 12,
    marginTop: 4,
  },
};
