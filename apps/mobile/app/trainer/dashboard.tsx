import { router } from "expo-router";
import {
  CalendarCheck,
  Dumbbell,
  User,
  Users,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AppCard from "../../src/components/ui/AppCard";
import { AppScreen } from "../../src/components/ui";
import { trainerApi } from "../../src/api/trainer.api";
import type { TrainerStats, WorkoutPlan } from "../../src/api/trainer.api";
import { useAuthStore } from "../../src/stores/auth.store";
import { useSocket } from "../../src/hooks/useSocket";
import { useTheme, type Theme } from "../../src/theme";
import type { AssignedMember } from "../../src/types/trainer.types";
import type { Attendance } from "../../src/types/attendance.types";

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function TrainerDashboardScreen() {
  const { user } = useAuthStore();
  const { on } = useSocket();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

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

  // Realtime: refresh today's attendance when the backend emits an update.
  useEffect(() => {
    on("attendance:update", () => {
      void trainerApi
        .getTodayAttendance()
        .then((data) => setTodayAttendance(Array.isArray(data) ? data : []))
        .catch(() => {});
    });
  }, [on]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadDashboard();
  }

  const checkedInMemberIds = new Set(
    todayAttendance.map((a) => a.memberId).filter(Boolean),
  );
  const inactiveMembers = members.filter((m) => !checkedInMemberIds.has(m.id));
  const previewMembers = members.slice(0, 5);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  const trainerName = user?.name ?? "Trainer";
  const gymId = user?.gymId ?? "";

  return (
    <AppScreen onRefresh={handleRefresh} refreshing={refreshing}>
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
        <EmojiStatCard emoji="👥" label="My Members" value={stats?.totalAssignedMembers ?? members.length} color={theme.colors.primary} />
        <EmojiStatCard emoji="✅" label="Today's Check-ins" value={stats?.attendancesToday ?? todayAttendance.length} color={theme.colors.success} />
        <EmojiStatCard emoji="🔔" label="Pending Reviews" value={inactiveMembers.length} color={theme.colors.warning} />
        <EmojiStatCard emoji="📋" label="Active Plans" value={stats?.workoutPlansCreated ?? workoutPlans.length} color={theme.colors.info} />
      </ScrollView>

      {/* Members Needing Attention */}
      <Text style={styles.sectionTitle}>Members needing attention</Text>
      {inactiveMembers.length === 0 ? (
        <AppCard style={{ marginBottom: 20 }}>
          <View style={styles.emptyAttention}>
            <Text style={styles.emptyEmoji}>🎉</Text>
            <Text style={styles.emptyTitle}>All members are active!</Text>
            <Text style={styles.emptySubtitle}>Everyone has checked in today.</Text>
          </View>
        </AppCard>
      ) : (
        <View style={{ gap: 10, marginBottom: 20 }}>
          {inactiveMembers.slice(0, 5).map((m) => (
            <AppCard key={m.id}>
              <View style={styles.attentionRow}>
                <View style={styles.attentionAvatar}>
                  <Text style={styles.attentionInitials}>
                    {(m.user?.name ?? "M").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.attentionName}>{m.user?.name ?? "Member"}</Text>
                  <Text style={styles.attentionSub}>Not checked in today</Text>
                </View>
                <TouchableOpacity
                  style={styles.viewBtn}
                  onPress={() => router.push({ pathname: "/trainer/member-detail", params: { memberId: m.id } })}
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
              onPress={() => router.push({ pathname: "/trainer/member-detail", params: { memberId: m.id } })}
            >
              <MiniMemberCard member={m} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Today's Activity */}
      <Text style={styles.sectionTitle}>Today's Activity</Text>
      {todayAttendance.length === 0 ? (
        <AppCard style={{ marginBottom: 20 }}>
          <Text style={styles.emptySubtitle}>No check-ins recorded yet today.</Text>
        </AppCard>
      ) : (
        <View style={{ gap: 10, marginBottom: 20 }}>
          {todayAttendance.slice(0, 8).map((a) => (
            <AppCard key={a.id}>
              <View style={styles.activityRow}>
                <View style={styles.activityDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityName}>Member check-in</Text>
                  <Text style={styles.activityTime}>{formatTime(a.checkInAt)}</Text>
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
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickGrid}>
        <QuickAction icon={Users} label="View Members" color={theme.colors.primary} onPress={() => router.push("/trainer/members")} />
        <QuickAction icon={Dumbbell} label="Manage Workouts" color={theme.colors.info} onPress={() => router.push("/trainer/workouts")} />
        <QuickAction icon={CalendarCheck} label="View Attendance" color={theme.colors.success} onPress={() => router.push("/trainer/attendance")} />
        <QuickAction icon={User} label="My Profile" color={theme.colors.warning} onPress={() => router.push("/trainer/profile")} />
      </View>
    </AppScreen>
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
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MiniMemberCard({ member }: { member: AssignedMember }) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const name = member.user?.name ?? "Member";
  const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  return (
    <View style={styles.miniCard}>
      <View style={styles.miniAvatar}>
        <Text style={styles.miniInitials}>{initials}</Text>
      </View>
      <Text style={styles.miniName} numberOfLines={1}>{name}</Text>
      <Text style={styles.miniGoal} numberOfLines={1}>{member.fitnessGoal ?? "General Fitness"}</Text>
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
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <TouchableOpacity style={styles.quickCard} activeOpacity={0.85} onPress={onPress}>
      <View style={[styles.quickIcon, { backgroundColor: color }]}>
        <Icon color="#fff" size={22} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function makeStyles(theme: Theme) {
  const c = theme.colors;
  return StyleSheet.create({
    center: { flex: 1, backgroundColor: c.background, alignItems: "center", justifyContent: "center" },
    headerRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
    badgeRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 },
    badge: {
      backgroundColor: c.primarySoft,
      borderWidth: 1,
      borderColor: c.primary,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 3,
    },
    badgeText: { color: c.primary, fontSize: 11, fontWeight: "900", letterSpacing: 1.5 },
    gymLabel: { color: c.textMuted, fontSize: 12, fontWeight: "700", flex: 1 },
    greeting: { color: c.textPrimary, fontSize: 30, fontWeight: "900" },
    subtitle: { color: c.textSecondary, marginTop: 6 },
    statsRow: { gap: 12, paddingRight: 4 },
    statCard: {
      width: 140,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderLeftWidth: 4,
      borderRadius: theme.radius.lg,
      padding: 16,
      ...theme.shadows.sm,
    },
    statEmoji: { fontSize: 22, marginBottom: 8 },
    statValue: { color: c.textPrimary, fontSize: 28, fontWeight: "900" },
    statLabel: { color: c.textSecondary, fontSize: 12, fontWeight: "700", marginTop: 4 },
    sectionHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    sectionTitle: { color: c.textPrimary, fontSize: 18, fontWeight: "900" },
    viewAllText: { color: c.primary, fontWeight: "800", fontSize: 14 },
    attentionRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    attentionAvatar: {
      height: 42,
      width: 42,
      borderRadius: theme.radius.md,
      backgroundColor: c.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    attentionInitials: { color: c.primary, fontSize: 14, fontWeight: "900" },
    attentionName: { color: c.textPrimary, fontSize: 15, fontWeight: "900" },
    attentionSub: { color: c.textSecondary, fontSize: 12, marginTop: 2 },
    viewBtn: {
      backgroundColor: c.primarySoft,
      borderWidth: 1,
      borderColor: c.primary,
      borderRadius: theme.radius.sm,
      paddingHorizontal: 14,
      paddingVertical: 6,
    },
    viewBtnText: { color: c.primary, fontWeight: "900", fontSize: 13 },
    emptyAttention: { alignItems: "center", paddingVertical: 8 },
    emptyEmoji: { fontSize: 36, marginBottom: 8 },
    emptyTitle: { color: c.textPrimary, fontSize: 16, fontWeight: "900", marginBottom: 4 },
    emptySubtitle: { color: c.textSecondary, fontSize: 14, textAlign: "center" },
    miniCard: {
      width: 120,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: theme.radius.lg,
      padding: 14,
      alignItems: "center",
      gap: 8,
    },
    miniAvatar: {
      height: 50,
      width: 50,
      borderRadius: theme.radius.lg,
      backgroundColor: c.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    miniInitials: { color: c.primary, fontSize: 16, fontWeight: "900" },
    miniName: { color: c.textPrimary, fontSize: 13, fontWeight: "900", textAlign: "center" },
    miniGoal: { color: c.textMuted, fontSize: 11, textAlign: "center" },
    activityRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    activityDot: { height: 10, width: 10, borderRadius: 5, backgroundColor: c.success },
    activityName: { color: c.textPrimary, fontSize: 14, fontWeight: "800" },
    activityTime: { color: c.textMuted, fontSize: 12, marginTop: 2 },
    checkBadge: {
      backgroundColor: c.successSoft,
      borderWidth: 1,
      borderColor: c.success,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    checkBadgeText: { color: c.success, fontSize: 11, fontWeight: "900" },
    quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    quickCard: {
      width: "47%",
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: theme.radius.lg,
      padding: 18,
      alignItems: "center",
      gap: 12,
    },
    quickIcon: {
      height: 52,
      width: 52,
      borderRadius: theme.radius.lg,
      alignItems: "center",
      justifyContent: "center",
    },
    quickLabel: { color: c.textPrimary, fontSize: 13, fontWeight: "900", textAlign: "center" },
  });
}
