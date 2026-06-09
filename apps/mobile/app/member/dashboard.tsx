import { router, useFocusEffect } from "expo-router";
import {
  Bell,
  Calendar,
  CheckCircle2,
  CreditCard,
  Crown,
  DoorOpen,
  Dumbbell,
  Flame,
  ImagePlus,
  LogIn,
  LogOut,
  Salad,
  Star,
  Target,
  Wallet,
} from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { Alert, ScrollView, TouchableOpacity, View } from "react-native";

import { attendanceService } from "../../src/services/attendance.service";
import { memberService } from "../../src/services/member.service";
import { membershipService } from "../../src/services/membership.service";
import { workoutService } from "../../src/services/workout.service";
import { dietService } from "../../src/services/diet.service";
import { useAuthStore } from "../../src/stores/auth.store";
import { useTheme } from "../../src/theme";
import {
  AppCard,
  AppScreen,
  AppText,
  AppLoadingState,
} from "../../src/components/ui";
import type { Attendance } from "../../src/types/attendance.types";
import type { Member } from "../../src/types/member.types";

// ─── helpers (unchanged) ──────────────────────────────────────────────────────

function greet(name: string) {
  const h = new Date().getHours();
  const salutation =
    h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return `${salutation}, ${name.split(" ")[0]}`;
}

function todayLabel() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function isToday(dateStr: string) {
  const now = new Date();
  const d = new Date(dateStr);
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function daysRemaining(endDate?: string | null) {
  if (!endDate) return null;
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function membershipProgress(startDate?: string | null, endDate?: string | null) {
  if (!startDate || !endDate) return 0;
  const total = new Date(endDate).getTime() - new Date(startDate).getTime();
  const elapsed = Date.now() - new Date(startDate).getTime();
  return Math.min(1, Math.max(0, elapsed / total));
}

function currentStreak(records: Attendance[]) {
  if (!records.length) return 0;
  const sorted = [...records].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  let streak = 0;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  for (const r of sorted) {
    const d = new Date(r.date);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((cursor.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0 || diff === 1) {
      streak++;
      cursor = d;
    } else {
      break;
    }
  }
  return streak;
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── main screen ─────────────────────────────────────────────────────────────

export default function MemberDashboardScreen() {
  const { user } = useAuthStore();
  const { theme } = useTheme();
  const c = theme.colors;

  const [member, setMember] = useState<Member | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [membership, setMembership] = useState<Awaited<
    ReturnType<typeof membershipService.getMyMembership>
  > | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<Awaited<
    ReturnType<typeof workoutService.getByMember>
  > | null>(null);
  const [dietPlan, setDietPlan] = useState<Awaited<
    ReturnType<typeof dietService.getMyPlan>
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      const [profile, records] = await Promise.all([
        memberService.getMyProfile(),
        attendanceService.getMyAttendance(),
      ]);

      setMember(profile);
      setAttendance(Array.isArray(records) ? records : []);

      if (profile?.id) {
        const [mem, wp, dp] = await Promise.allSettled([
          membershipService.getMyMembership(),
          workoutService.getByMember(profile.id),
          dietService.getMyPlan(),
        ]);
        if (mem.status === "fulfilled") setMembership(mem.value);
        if (wp.status === "fulfilled") setWorkoutPlan(wp.value);
        if (dp.status === "fulfilled") setDietPlan(dp.value);
      }
    } catch (err) {
      console.log("Dashboard load failed", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refetch whenever the dashboard regains focus (e.g. returning from the
  // QR scanner) so Recent Check-ins / occupancy never show stale data.
  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, [loadDashboard]),
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadDashboard();
  }

  const displayName = member?.user?.name || user?.name || "Member";
  const streak = useMemo(() => currentStreak(attendance), [attendance]);
  const daysLeft = useMemo(() => daysRemaining(membership?.endDate), [membership]);
  const progress = useMemo(
    () => membershipProgress(membership?.startDate, membership?.endDate),
    [membership],
  );
  const recentAttendance = useMemo(
    () =>
      [...attendance]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3),
    [attendance],
  );
  const todayActive = useMemo(
    () => attendance.find((r) => isToday(r.date) && r.status === "CHECKED_IN") ?? null,
    [attendance],
  );
  const isInside = todayActive !== null;

  const todayDayName = new Date()
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();

  // Workout plans store exercises against a numeric dayNumber (1=Mon … 7=Sun).
  const todayWorkoutNumber = new Date().getDay() === 0 ? 7 : new Date().getDay();
  const firstWorkoutPlan = workoutPlan?.[0] ?? null;
  const exerciseCount = firstWorkoutPlan
    ? firstWorkoutPlan.exercises.filter((e) => e.dayNumber === todayWorkoutNumber)
        .length
    : 0;

  // Diet plans store structured meals against a lowercase dayOfWeek.
  const mealCount = (dietPlan?.meals ?? []).filter(
    (m) => (m.dayOfWeek ?? "").toLowerCase() === todayDayName,
  ).length;

  if (loading) {
    return (
      <AppScreen>
        <View style={{ gap: 8, marginBottom: 8 }}>
          <AppText variant="overline" color="primary">
            GymPro Member
          </AppText>
          <AppText variant="title">{greet(displayName)}</AppText>
        </View>
        <AppLoadingState rows={3} />
      </AppScreen>
    );
  }

  return (
    <AppScreen onRefresh={handleRefresh} refreshing={refreshing}>
      {/* Header */}
      <View style={{ marginBottom: 8 }}>
        <AppText variant="overline" color="primary">
          GymPro Member
        </AppText>
        <AppText variant="title" style={{ marginTop: 6 }}>
          {greet(displayName)}
        </AppText>
        <AppText variant="caption" color="textMuted" style={{ marginTop: 4 }}>
          {todayLabel()}
        </AppText>
      </View>

      {/* Stats Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingBottom: 4 }}
      >
        <StatBadge icon={<Flame color="#f97316" size={16} />} label="Streak" value={`${streak}d`} />
        <StatBadge icon={<Star color={c.warning} size={16} />} label="XP" value={`${attendance.length * 50}`} />
        <StatBadge icon={<Target color={c.primary} size={16} />} label="Goals" value="0" />
        <StatBadge
          icon={<Calendar color={c.success} size={16} />}
          label="Days Left"
          value={daysLeft !== null ? `${daysLeft}` : "—"}
        />
      </ScrollView>

      {/* Today's Cards */}
      <View style={{ flexDirection: "row", gap: 12 }}>
        <AppCard style={{ flex: 1 }}>
          <View
            style={{
              height: 38,
              width: 38,
              borderRadius: theme.radius.md,
              backgroundColor: c.primary,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 10,
            }}
          >
            <Dumbbell color="#fff" size={18} />
          </View>
          <AppText variant="caption" color="textSecondary">
            Today's Workout
          </AppText>
          <AppText variant="subtitle" numberOfLines={1} style={{ marginTop: 4 }}>
            {firstWorkoutPlan?.title || "Not assigned"}
          </AppText>
          {exerciseCount > 0 ? (
            <AppText variant="caption" color="textMuted" style={{ marginTop: 3 }}>
              {exerciseCount} exercise{exerciseCount !== 1 ? "s" : ""}
            </AppText>
          ) : null}
          <TouchableOpacity
            onPress={() => router.push("/member/workout")}
            activeOpacity={0.8}
            style={{
              marginTop: 12,
              height: 34,
              borderRadius: theme.radius.sm,
              backgroundColor: c.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppText variant="caption" style={{ color: c.onPrimary }}>
              Start Workout
            </AppText>
          </TouchableOpacity>
        </AppCard>

        <AppCard style={{ flex: 1 }}>
          <View
            style={{
              height: 38,
              width: 38,
              borderRadius: theme.radius.md,
              backgroundColor: c.success,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 10,
            }}
          >
            <Salad color="#fff" size={18} />
          </View>
          <AppText variant="caption" color="textSecondary">
            Today's Diet
          </AppText>
          <AppText variant="subtitle" numberOfLines={1} style={{ marginTop: 4 }}>
            {dietPlan?.goal || "Not assigned"}
          </AppText>
          {mealCount > 0 ? (
            <AppText variant="caption" color="textMuted" style={{ marginTop: 3 }}>
              {mealCount} meal{mealCount !== 1 ? "s" : ""}
            </AppText>
          ) : null}
          <TouchableOpacity
            onPress={() => router.push("/member/diet")}
            activeOpacity={0.8}
            style={{
              marginTop: 12,
              height: 34,
              borderRadius: theme.radius.sm,
              backgroundColor: c.success,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppText variant="caption" style={{ color: "#fff" }}>
              View Diet
            </AppText>
          </TouchableOpacity>
        </AppCard>
      </View>

      {/* Membership Card */}
      <AppCard variant="elevated">
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <CreditCard color={c.primary} size={18} />
              <AppText variant="overline" color="primary">
                Membership
              </AppText>
            </View>
            <AppText variant="heading" style={{ marginTop: 8 }}>
              {membership?.planRef?.name ?? membership?.plan ?? "No active plan"}
            </AppText>
            <AppText variant="caption" color="textMuted" style={{ marginTop: 4 }}>
              {daysLeft !== null
                ? `${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining`
                : "—"}
            </AppText>
          </View>

          {daysLeft !== null && daysLeft < 30 ? (
            <TouchableOpacity
              onPress={() => router.push("/member/renew-membership")}
              activeOpacity={0.8}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: theme.radius.sm,
                backgroundColor: c.dangerSoft,
                borderWidth: 1,
                borderColor: c.danger,
              }}
            >
              <AppText variant="label" style={{ color: c.danger }}>
                Renew
              </AppText>
            </TouchableOpacity>
          ) : null}
        </View>

        <View
          style={{
            marginTop: 16,
            height: 6,
            borderRadius: 3,
            backgroundColor: c.muted,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              height: "100%",
              width: `${Math.round((1 - progress) * 100)}%`,
              borderRadius: 3,
              backgroundColor: daysLeft !== null && daysLeft < 10 ? c.danger : c.primary,
            }}
          />
        </View>
      </AppCard>

      {/* Attendance — two clear QR actions */}
      <AppText variant="heading">Attendance</AppText>
      <AppCard>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <View
            style={{
              height: 44,
              width: 44,
              borderRadius: theme.radius.md,
              backgroundColor: isInside ? c.successSoft : c.muted,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <DoorOpen color={isInside ? c.success : c.textMuted} size={22} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="bodyStrong">
              Status: {isInside ? "Inside" : "Outside"}
            </AppText>
            <AppText variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
              {isInside && todayActive
                ? `Checked in at ${formatTime(todayActive.checkInAt || todayActive.date)}`
                : "You are not checked in"}
            </AppText>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            disabled={isInside}
            activeOpacity={0.8}
            onPress={() => router.push("/member/scanner?action=checkin")}
            style={{
              flex: 1,
              padding: 14,
              borderRadius: theme.radius.md,
              borderWidth: 1,
              borderColor: c.success,
              backgroundColor: c.muted,
              opacity: isInside ? 0.45 : 1,
            }}
          >
            <LogIn color={c.success} size={20} />
            <AppText variant="bodyStrong" style={{ marginTop: 8 }}>
              Check In
            </AppText>
            <AppText variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
              {isInside ? "Already checked in" : "Scan gym QR to enter"}
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={!isInside}
            activeOpacity={0.8}
            onPress={() => router.push("/member/scanner?action=checkout")}
            style={{
              flex: 1,
              padding: 14,
              borderRadius: theme.radius.md,
              borderWidth: 1,
              borderColor: c.primary,
              backgroundColor: c.muted,
              opacity: !isInside ? 0.45 : 1,
            }}
          >
            <LogOut color={c.primary} size={20} />
            <AppText variant="bodyStrong" style={{ marginTop: 8 }}>
              Check Out
            </AppText>
            <AppText variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
              {isInside ? "Scan gym QR to exit" : "No active check-in"}
            </AppText>
          </TouchableOpacity>
        </View>
      </AppCard>

      {/* Quick Actions */}
      <AppText variant="heading">Quick Actions</AppText>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        <QuickAction
          icon={<Crown color={c.primary} size={22} />}
          label="Membership"
          onPress={() => router.push("/member/membership")}
        />
        <QuickAction
          icon={<Wallet color={c.success} size={22} />}
          label="Payments"
          onPress={() => router.push("/member/payments")}
        />
        <QuickAction
          icon={<CreditCard color="#f97316" size={22} />}
          label="Renew"
          onPress={() => router.push("/member/renew-membership")}
        />
        <QuickAction
          icon={<ImagePlus color={c.success} size={22} />}
          label="Progress"
          onPress={() => router.push("/member/progress")}
        />
        <QuickAction
          icon={<Bell color={c.warning} size={22} />}
          label="Alerts"
          onPress={() => router.push("/member/notifications")}
        />
        <QuickAction
          icon={<Target color="#f97316" size={22} />}
          label="Goals"
          onPress={() =>
            Alert.alert(
              "Coming Soon",
              "Goals tracking will be available in the next update.",
            )
          }
        />
      </View>

      {/* Recent Check-ins */}
      <AppText variant="heading">Recent Check-ins</AppText>
      {recentAttendance.length === 0 ? (
        <AppCard>
          <View style={{ alignItems: "center", paddingVertical: 12, gap: 10 }}>
            <Calendar color={c.textMuted} size={28} />
            <AppText
              variant="bodyStrong"
              color="textSecondary"
              style={{ textAlign: "center" }}
            >
              No attendance records yet.{"\n"}Scan the QR code to check in.
            </AppText>
          </View>
        </AppCard>
      ) : (
        <View style={{ gap: 8 }}>
          {recentAttendance.map((record) => (
            <AppCard key={record.id}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View
                  style={{
                    height: 40,
                    width: 40,
                    borderRadius: theme.radius.md,
                    backgroundColor: c.muted,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckCircle2
                    color={isToday(record.date) ? c.success : c.primary}
                    size={20}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyStrong">
                    {new Date(record.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </AppText>
                  <AppText variant="caption" color="textMuted" style={{ marginTop: 2 }}>
                    In {formatTime(record.checkInAt || record.date)}
                    {record.checkOutAt ? ` · Out ${formatTime(record.checkOutAt)}` : ""}
                  </AppText>
                </View>
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: theme.radius.sm,
                    backgroundColor:
                      record.status === "CHECKED_IN" ? c.successSoft : c.muted,
                    borderWidth: 1,
                    borderColor:
                      record.status === "CHECKED_IN" ? c.success : c.border,
                  }}
                >
                  <AppText
                    variant="caption"
                    style={{
                      color:
                        record.status === "CHECKED_IN" ? c.success : c.textSecondary,
                    }}
                  >
                    {record.status === "CHECKED_IN" ? "Inside" : "Left"}
                  </AppText>
                </View>
              </View>
            </AppCard>
          ))}
        </View>
      )}
    </AppScreen>
  );
}

// ─── local components ─────────────────────────────────────────────────────────

function StatBadge({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <View
      style={{
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: theme.radius.lg,
        paddingHorizontal: 16,
        paddingVertical: 12,
        alignItems: "center",
        minWidth: 76,
        gap: 4,
      }}
    >
      {icon}
      <AppText style={{ fontSize: 18, fontWeight: "900", marginTop: 2 }}>
        {value}
      </AppText>
      <AppText variant="caption" color="textMuted">
        {label}
      </AppText>
    </View>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        width: "22%",
        aspectRatio: 1,
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: theme.radius.lg,
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        flexGrow: 1,
        paddingVertical: 14,
      }}
    >
      {icon}
      <AppText variant="caption" color="textSecondary">
        {label}
      </AppText>
    </TouchableOpacity>
  );
}
