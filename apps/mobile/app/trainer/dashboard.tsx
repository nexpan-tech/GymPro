import { router } from "expo-router";
import {
  Bell,
  CalendarCheck,
  ClipboardList,
  Dumbbell,
  User,
  Users,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AppCard from "../../src/components/AppCard";
import { trainerApi } from "../../src/api/trainer.api";
import type { TrainerStats, WorkoutPlan } from "../../src/api/trainer.api";
import { useAuthStore } from "../../src/stores/auth.store";
import { useSocket } from "../../src/hooks/useSocket";
import type { AssignedMember } from "../../src/types/trainer.types";
import type { Attendance } from "../../src/types/attendance.types";

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function isToday(dateStr: string): boolean {
  const now = new Date();
  const target = new Date(dateStr);
  return (
    now.getFullYear() === target.getFullYear() &&
    now.getMonth() === target.getMonth() &&
    now.getDate() === target.getDate()
  );
}

function daysAgo(dateStr: string): string {
  const now = new Date();
  const target = new Date(dateStr);
  const diffMs = now.getTime() - target.getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export default function TrainerDashboardScreen() {
  const { user } = useAuthStore();
  const { on } = useSocket();

  const [stats, setStats] = useState<TrainerStats | null>(null);
  const [members, setMembers] = useState<AssignedMember[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<Attendance[]>([]);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      const [statsData, membersData, attendanceData, plansData] =
        await Promise.all([
          trainerApi.getTrainerStats().catch(() => null),
          trainerApi.getAssignedMembers().catch(() => [] as AssignedMember[]),
          trainerApi.getTodayAttendance().catch(() => [] as Attendance[]),
          trainerApi.getMyWorkoutPlans().catch(() => [] as WorkoutPlan[]),
        ]);
      setStats(statsData);
      setMembers(Array.isArray(membersData) ? membersData : []);
      setTodayAttendance(Array.isArray(attendanceData) ? attendanceData : []);
      setWorkoutPlans(Array.isArray(plansData) ? plansData : []);
    } catch (error) {
      console.log("Dashboard load failed", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    on("attendance:update", () => {
      void trainerApi
        .getTodayAttendance()
        .then((data) =>
          setTodayAttendance(Array.isArray(data) ? data : [])
        )
        .catch(() => {});
    });
  }, [on]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadDashboard();
  }

  const checkedInMemberIds = new Set(
    todayAttendance.map((a) => a.memberId).filter(Boolean)
  );

  const inactiveMembers = members.filter(
    (m) => !checkedInMemberIds.has(m.id)
  );

  const previewMembers = members.slice(0, 5);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#6366f1" />
      </View>
    );
  }

  const trainerName = user?.name ?? "Trainer";
  const gymId = user?.gymId ?? "";

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>TRAINER</Text>
            </View>
            {gymId ? (
              <Text style={styles.gymLabel} numberOfLines={1}>
                {gymId}
              </Text>
            ) : null}
          </View>
          <Text style={styles.greeting}>Hi, {trainerName}</Text>
          <Text style={styles.subtitle}>Your trainer command center</Text>
        </View>
      </View>

      {/* Stats Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statsRow}
      >
        <EmojiStatCard
          emoji="👥"
          label="My Members"
          value={stats?.totalAssignedMembers ?? members.length}
          color="#4f46e5"
        />
        <EmojiStatCard
          emoji="✅"
          label="Today's Check-ins"
          value={stats?.attendancesToday ?? todayAttendance.length}
          color="#059669"
        />
        <EmojiStatCard
          emoji="🔔"
          label="Pending Reviews"
          value={inactiveMembers.length}
          color="#d97706"
        />
        <EmojiStatCard
          emoji="📋"
          label="Active Plans"
          value={stats?.workoutPlansCreated ?? workoutPlans.length}
          color="#7c3aed"
        />
      </ScrollView>

      {/* Members Needing Attention */}
      <SectionHeader title="Members needing attention" />
      {inactiveMembers.length === 0 ? (
        <AppCard style={{ marginBottom: 20 }}>
          <View style={styles.emptyAttention}>
            <Text style={styles.emptyEmoji}>🎉</Text>
            <Text style={styles.emptyTitle}>All members are active!</Text>
            <Text style={styles.emptySubtitle}>
              Everyone has checked in today.
            </Text>
          </View>
        </AppCard>
      ) : (
        <View style={{ gap: 10, marginBottom: 20 }}>
          {inactiveMembers.slice(0, 5).map((m) => (
            <AppCard key={m.id}>
              <View style={styles.attentionRow}>
                <View style={styles.attentionAvatar}>
                  <Text style={styles.attentionInitials}>
                    {(m.user?.name ?? "M")
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.attentionName}>
                    {m.user?.name ?? "Member"}
                  </Text>
                  <Text style={styles.attentionSub}>Not checked in today</Text>
                </View>
                <TouchableOpacity
                  style={styles.viewBtn}
                  onPress={() =>
                    router.push({
                      pathname: "/trainer/member-detail",
                      params: { memberId: m.id },
                    })
                  }
                >
                  <Text style={styles.viewBtnText}>View</Text>
                </TouchableOpacity>
              </View>
            </AppCard>
          ))}
        </View>
      )}

      {/* My Members Preview */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>My Members</Text>
        <TouchableOpacity onPress={() => router.push("/trainer/members")}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      {previewMembers.length === 0 ? (
        <AppCard style={{ marginBottom: 20 }}>
          <Text style={styles.emptySubtitle}>No members assigned yet.</Text>
        </AppCard>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingRight: 4, marginBottom: 20 }}
        >
          {previewMembers.map((m) => (
            <TouchableOpacity
              key={m.id}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: "/trainer/member-detail",
                  params: { memberId: m.id },
                })
              }
            >
              <MiniMemberCard member={m} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Today's Activity */}
      <SectionHeader title="Today's Activity" />
      {todayAttendance.length === 0 ? (
        <AppCard style={{ marginBottom: 20 }}>
          <Text style={styles.emptySubtitle}>
            No check-ins recorded yet today.
          </Text>
        </AppCard>
      ) : (
        <View style={{ gap: 10, marginBottom: 20 }}>
          {todayAttendance.slice(0, 8).map((a) => (
            <AppCard key={a.id}>
              <View style={styles.activityRow}>
                <View style={styles.activityDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityName}>
                    Member check-in
                  </Text>
                  <Text style={styles.activityTime}>
                    {formatTime(a.checkInAt)}
                  </Text>
                </View>
                <View style={styles.checkBadge}>
                  <Text style={styles.checkBadgeText}>Checked In</Text>
                </View>
              </View>
            </AppCard>
          ))}
        </View>
      )}

      {/* Quick Actions */}
      <SectionHeader title="Quick Actions" />
      <View style={styles.quickGrid}>
        <QuickAction
          icon={Users}
          label="View Members"
          color="#4f46e5"
          onPress={() => router.push("/trainer/members")}
        />
        <QuickAction
          icon={Dumbbell}
          label="Manage Workouts"
          color="#7c3aed"
          onPress={() => router.push("/trainer/workouts")}
        />
        <QuickAction
          icon={CalendarCheck}
          label="View Attendance"
          color="#059669"
          onPress={() => router.push("/trainer/attendance")}
        />
        <QuickAction
          icon={User}
          label="My Profile"
          color="#0891b2"
          onPress={() => router.push("/trainer/profile")}
        />
      </View>
    </ScrollView>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text style={styles.sectionTitle}>{title}</Text>
  );
}

function EmojiStatCard({
  emoji,
  label,
  value,
  color,
}: {
  emoji: string;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MiniMemberCard({ member }: { member: AssignedMember }) {
  const name = member.user?.name ?? "Member";
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.miniCard}>
      <View style={styles.miniAvatar}>
        <Text style={styles.miniInitials}>{initials}</Text>
      </View>
      <Text style={styles.miniName} numberOfLines={1}>
        {name}
      </Text>
      <Text style={styles.miniGoal} numberOfLines={1}>
        {member.fitnessGoal ?? "General Fitness"}
      </Text>
    </View>
  );
}

function QuickAction({
  icon: Icon,
  label,
  color,
  onPress,
}: {
  icon: typeof Users;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.quickCard}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={[styles.quickIcon, { backgroundColor: color }]}>
        <Icon color="#fff" size={22} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
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
  },
  headerRow: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    marginBottom: 24,
  },
  badgeRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    marginBottom: 6,
  },
  badge: {
    backgroundColor: "rgba(99,102,241,0.18)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.4)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    color: "#818cf8",
    fontSize: 11,
    fontWeight: "900" as const,
    letterSpacing: 1.5,
  },
  gymLabel: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "700" as const,
    flex: 1,
  },
  greeting: {
    color: "#f8fafc",
    fontSize: 30,
    fontWeight: "900" as const,
  },
  subtitle: {
    color: "#94a3b8",
    marginTop: 6,
  },
  statsRow: {
    gap: 12,
    paddingRight: 4,
    marginBottom: 24,
  },
  statCard: {
    width: 140,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.18)",
    borderLeftWidth: 4,
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  statEmoji: { fontSize: 22, marginBottom: 8 },
  statValue: {
    color: "#f8fafc",
    fontSize: 28,
    fontWeight: "900" as const,
  },
  statLabel: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700" as const,
    marginTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "900" as const,
    marginBottom: 12,
  },
  viewAllText: {
    color: "#6366f1",
    fontWeight: "800" as const,
    fontSize: 14,
  },
  attentionRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  attentionAvatar: {
    height: 42,
    width: 42,
    borderRadius: 14,
    backgroundColor: "#312e81",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  attentionInitials: {
    color: "#c7d2fe",
    fontSize: 14,
    fontWeight: "900" as const,
  },
  attentionName: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "900" as const,
  },
  attentionSub: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 2,
  },
  viewBtn: {
    backgroundColor: "rgba(99,102,241,0.15)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.35)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  viewBtnText: {
    color: "#818cf8",
    fontWeight: "900" as const,
    fontSize: 13,
  },
  emptyAttention: {
    alignItems: "center" as const,
    paddingVertical: 8,
  },
  emptyEmoji: { fontSize: 36, marginBottom: 8 },
  emptyTitle: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "900" as const,
    marginBottom: 4,
  },
  emptySubtitle: {
    color: "#94a3b8",
    fontSize: 14,
    textAlign: "center" as const,
  },
  miniCard: {
    width: 120,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.18)",
    borderRadius: 20,
    padding: 14,
    alignItems: "center" as const,
    gap: 8,
  },
  miniAvatar: {
    height: 50,
    width: 50,
    borderRadius: 18,
    backgroundColor: "#312e81",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  miniInitials: {
    color: "#c7d2fe",
    fontSize: 16,
    fontWeight: "900" as const,
  },
  miniName: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "900" as const,
    textAlign: "center" as const,
  },
  miniGoal: {
    color: "#64748b",
    fontSize: 11,
    textAlign: "center" as const,
  },
  activityRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  activityDot: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: "#22c55e",
  },
  activityName: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "800" as const,
  },
  activityTime: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 2,
  },
  checkBadge: {
    backgroundColor: "rgba(34,197,94,0.12)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.3)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  checkBadgeText: {
    color: "#4ade80",
    fontSize: 11,
    fontWeight: "900" as const,
  },
  quickGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 12,
    marginBottom: 20,
  },
  quickCard: {
    width: "47%" as const,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.18)",
    borderRadius: 20,
    padding: 18,
    alignItems: "center" as const,
    gap: 12,
  },
  quickIcon: {
    height: 52,
    width: 52,
    borderRadius: 18,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  quickLabel: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "900" as const,
    textAlign: "center" as const,
  },
};
