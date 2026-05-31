import { router } from "expo-router";
import {
  Bell,
  Calendar,
  Camera,
  CheckCircle2,
  CreditCard,
  Dumbbell,
  Flame,
  ImagePlus,
  Salad,
  Star,
  Target,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AppCard from "../../src/components/AppCard";
import { attendanceService } from "../../src/services/attendance.service";
import { memberService } from "../../src/services/member.service";
import { membershipService } from "../../src/services/membership.service";
import { workoutService } from "../../src/services/workout.service";
import { dietService } from "../../src/services/diet.service";
import { useAuthStore } from "../../src/stores/auth.store";
import type { Attendance } from "../../src/types/attendance.types";
import type { Member } from "../../src/types/member.types";

// ─── helpers ────────────────────────────────────────────────────────────────

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

function membershipProgress(
  startDate?: string | null,
  endDate?: string | null
) {
  if (!startDate || !endDate) return 0;
  const total = new Date(endDate).getTime() - new Date(startDate).getTime();
  const elapsed = Date.now() - new Date(startDate).getTime();
  return Math.min(1, Math.max(0, elapsed / total));
}

function currentStreak(records: Attendance[]) {
  if (!records.length) return 0;
  const sorted = [...records].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  let streak = 0;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  for (const r of sorted) {
    const d = new Date(r.date);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round(
      (cursor.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
    );
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

// ─── skeleton ────────────────────────────────────────────────────────────────

function SkeletonBox({
  width,
  height,
  borderRadius = 12,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
}) {
  return (
    <View
      style={{
        width: width as number,
        height,
        borderRadius,
        backgroundColor: "#1e293b",
      }}
    />
  );
}

// ─── main screen ─────────────────────────────────────────────────────────────

export default function MemberDashboardScreen() {
  const { user } = useAuthStore();

  const [member, setMember] = useState<Member | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [membership, setMembership] = useState<Awaited<
    ReturnType<typeof membershipService.getMyMembership>
  > | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<Awaited<
    ReturnType<typeof workoutService.getByMember>
  > | null>(null);
  const [dietPlan, setDietPlan] = useState<Awaited<
    ReturnType<typeof dietService.getByMember>
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
          dietService.getByMember(profile.id),
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

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadDashboard();
  }

  const displayName = member?.user?.name || user?.name || "Member";
  const streak = useMemo(() => currentStreak(attendance), [attendance]);
  const daysLeft = useMemo(
    () => daysRemaining(membership?.endDate),
    [membership]
  );
  const progress = useMemo(
    () => membershipProgress(membership?.startDate, membership?.endDate),
    [membership]
  );
  const recentAttendance = useMemo(
    () =>
      [...attendance]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3),
    [attendance]
  );

  // Count exercises from today's workout day
  const todayDayName = new Date()
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase() as keyof typeof workoutPlan;
  const todayWorkout = workoutPlan?.[todayDayName];
  const exerciseCount = todayWorkout
    ? String(todayWorkout).split("\n").filter(Boolean).length
    : 0;

  // Count diet meals
  const dietNotes = dietPlan?.[todayDayName as keyof typeof dietPlan];
  const mealCount = dietNotes
    ? String(dietNotes).split("\n").filter(Boolean).length
    : 0;

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#020617",
          padding: 20,
          paddingTop: 64,
        }}
      >
        <SkeletonBox width="60%" height={18} borderRadius={8} />
        <View style={{ height: 8 }} />
        <SkeletonBox width="80%" height={32} borderRadius={10} />
        <View style={{ height: 28 }} />
        <View style={{ flexDirection: "row", gap: 12 }}>
          {[0, 1, 2, 3].map((i) => (
            <SkeletonBox key={i} width={76} height={90} borderRadius={20} />
          ))}
        </View>
        <View style={{ height: 20 }} />
        <SkeletonBox width="100%" height={120} borderRadius={24} />
        <View style={{ height: 12 }} />
        <SkeletonBox width="100%" height={120} borderRadius={24} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#020617" }}
      contentContainerStyle={{ padding: 20, paddingTop: 64, paddingBottom: 48 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#6366f1"
        />
      }
    >
      {/* ── Header ────────────────────────────────────────── */}
      <View style={{ marginBottom: 24 }}>
        <Text
          style={{
            color: "#6366f1",
            fontSize: 12,
            fontWeight: "900",
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          GymPro Member
        </Text>
        <Text
          style={{
            color: "#f8fafc",
            fontSize: 28,
            fontWeight: "900",
            marginTop: 6,
          }}
        >
          {greet(displayName)}
        </Text>
        <Text style={{ color: "#64748b", marginTop: 4, fontSize: 13 }}>
          {todayLabel()}
        </Text>
      </View>

      {/* ── Stats Row ─────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingBottom: 4 }}
        style={{ marginBottom: 20 }}
      >
        <StatBadge icon={<Flame color="#f97316" size={16} />} label="Streak" value={`${streak}d`} />
        <StatBadge icon={<Star color="#f59e0b" size={16} />} label="XP" value={`${attendance.length * 50}`} />
        <StatBadge icon={<Target color="#818cf8" size={16} />} label="Goals" value="0" />
        <StatBadge
          icon={<Calendar color="#34d399" size={16} />}
          label="Days Left"
          value={daysLeft !== null ? `${daysLeft}` : "—"}
        />
      </ScrollView>

      {/* ── Today's Cards ─────────────────────────────────── */}
      <View
        style={{
          flexDirection: "row",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {/* Workout card */}
        <AppCard style={{ flex: 1 }}>
          <View
            style={{
              height: 38,
              width: 38,
              borderRadius: 14,
              backgroundColor: "#4f46e5",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 10,
            }}
          >
            <Dumbbell color="#fff" size={18} />
          </View>
          <Text style={{ color: "#94a3b8", fontSize: 11, fontWeight: "700" }}>
            Today's Workout
          </Text>
          <Text
            style={{
              color: "#f8fafc",
              fontSize: 15,
              fontWeight: "900",
              marginTop: 4,
            }}
            numberOfLines={1}
          >
            {workoutPlan?.goal || "Not assigned"}
          </Text>
          {exerciseCount > 0 && (
            <Text style={{ color: "#64748b", fontSize: 12, marginTop: 3 }}>
              {exerciseCount} exercise{exerciseCount !== 1 ? "s" : ""}
            </Text>
          )}
          <TouchableOpacity
            onPress={() => router.push("/member/workout")}
            activeOpacity={0.8}
            style={{
              marginTop: 12,
              height: 34,
              borderRadius: 12,
              backgroundColor: "#4f46e5",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "900" }}>
              Start Workout
            </Text>
          </TouchableOpacity>
        </AppCard>

        {/* Diet card */}
        <AppCard style={{ flex: 1 }}>
          <View
            style={{
              height: 38,
              width: 38,
              borderRadius: 14,
              backgroundColor: "#059669",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 10,
            }}
          >
            <Salad color="#fff" size={18} />
          </View>
          <Text style={{ color: "#94a3b8", fontSize: 11, fontWeight: "700" }}>
            Today's Diet
          </Text>
          <Text
            style={{
              color: "#f8fafc",
              fontSize: 15,
              fontWeight: "900",
              marginTop: 4,
            }}
            numberOfLines={1}
          >
            {dietPlan?.goal || "Not assigned"}
          </Text>
          {mealCount > 0 && (
            <Text style={{ color: "#64748b", fontSize: 12, marginTop: 3 }}>
              {mealCount} meal{mealCount !== 1 ? "s" : ""}
            </Text>
          )}
          <TouchableOpacity
            onPress={() => router.push("/member/diet")}
            activeOpacity={0.8}
            style={{
              marginTop: 12,
              height: 34,
              borderRadius: 12,
              backgroundColor: "#059669",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "900" }}>
              View Diet
            </Text>
          </TouchableOpacity>
        </AppCard>
      </View>

      {/* ── Membership Card ───────────────────────────────── */}
      <AppCard style={{ marginBottom: 20 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flex: 1 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <CreditCard color="#818cf8" size={18} />
              <Text
                style={{
                  color: "#818cf8",
                  fontSize: 11,
                  fontWeight: "800",
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                Membership
              </Text>
            </View>
            <Text
              style={{
                color: "#f8fafc",
                fontSize: 20,
                fontWeight: "900",
                marginTop: 8,
              }}
            >
              {membership?.name || "No active plan"}
            </Text>
            <Text style={{ color: "#64748b", marginTop: 4, fontSize: 13 }}>
              {daysLeft !== null
                ? `${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining`
                : "—"}
            </Text>
          </View>

          {daysLeft !== null && daysLeft < 30 && (
            <TouchableOpacity
              onPress={() => router.push("/member/membership")}
              activeOpacity={0.8}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 12,
                backgroundColor: "rgba(239,68,68,0.15)",
                borderWidth: 1,
                borderColor: "rgba(239,68,68,0.3)",
              }}
            >
              <Text
                style={{ color: "#f87171", fontWeight: "900", fontSize: 13 }}
              >
                Renew
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Progress bar */}
        <View
          style={{
            marginTop: 16,
            height: 6,
            borderRadius: 3,
            backgroundColor: "#1e293b",
            overflow: "hidden",
          }}
        >
          <View
            style={{
              height: "100%",
              width: `${Math.round((1 - progress) * 100)}%`,
              borderRadius: 3,
              backgroundColor:
                daysLeft !== null && daysLeft < 10 ? "#ef4444" : "#6366f1",
            }}
          />
        </View>
      </AppCard>

      {/* ── Quick Actions ─────────────────────────────────── */}
      <Text
        style={{
          color: "#f8fafc",
          fontSize: 16,
          fontWeight: "900",
          marginBottom: 12,
        }}
      >
        Quick Actions
      </Text>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 24,
        }}
      >
        <QuickAction
          icon={<Camera color="#6366f1" size={22} />}
          label="Scan QR"
          onPress={() => router.push("/member/scanner")}
        />
        <QuickAction
          icon={<ImagePlus color="#059669" size={22} />}
          label="Progress"
          onPress={() => router.push("/member/progress")}
        />
        <QuickAction
          icon={<Bell color="#f59e0b" size={22} />}
          label="Alerts"
          onPress={() => router.push("/member/notifications")}
        />
        <QuickAction
          icon={<Target color="#f97316" size={22} />}
          label="Goals"
          onPress={() =>
            Alert.alert(
              "Coming Soon",
              "Goals tracking will be available in the next update."
            )
          }
        />
      </View>

      {/* ── Recent Attendance ─────────────────────────────── */}
      <Text
        style={{
          color: "#f8fafc",
          fontSize: 16,
          fontWeight: "900",
          marginBottom: 12,
        }}
      >
        Recent Check-ins
      </Text>

      {recentAttendance.length === 0 ? (
        <AppCard>
          <View style={{ alignItems: "center", paddingVertical: 12 }}>
            <Calendar color="#475569" size={28} />
            <Text
              style={{
                color: "#64748b",
                marginTop: 10,
                fontWeight: "700",
                textAlign: "center",
              }}
            >
              No attendance records yet.{"\n"}Scan the QR code to check in.
            </Text>
          </View>
        </AppCard>
      ) : (
        <View style={{ gap: 8 }}>
          {recentAttendance.map((record) => (
            <AppCard key={record.id}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <View
                  style={{
                    height: 40,
                    width: 40,
                    borderRadius: 14,
                    backgroundColor: "#1e293b",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckCircle2
                    color={isToday(record.date) ? "#34d399" : "#6366f1"}
                    size={20}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: "#f8fafc",
                      fontWeight: "900",
                      fontSize: 14,
                    }}
                  >
                    {new Date(record.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                  <Text
                    style={{
                      color: "#64748b",
                      fontSize: 12,
                      marginTop: 2,
                    }}
                  >
                    Checked in at {formatTime(record.checkInAt || record.date)}
                  </Text>
                </View>
                {isToday(record.date) && (
                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 8,
                      backgroundColor: "rgba(52,211,153,0.12)",
                      borderWidth: 1,
                      borderColor: "rgba(52,211,153,0.3)",
                    }}
                  >
                    <Text
                      style={{
                        color: "#34d399",
                        fontSize: 11,
                        fontWeight: "800",
                      }}
                    >
                      Today
                    </Text>
                  </View>
                )}
              </View>
            </AppCard>
          ))}
        </View>
      )}
    </ScrollView>
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
  return (
    <View
      style={{
        backgroundColor: "#0f172a",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.14)",
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 12,
        alignItems: "center",
        minWidth: 76,
        gap: 4,
      }}
    >
      {icon}
      <Text
        style={{ color: "#f8fafc", fontWeight: "900", fontSize: 18, marginTop: 2 }}
      >
        {value}
      </Text>
      <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "700" }}>
        {label}
      </Text>
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
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        width: "22%",
        aspectRatio: 1,
        backgroundColor: "#0f172a",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.14)",
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        flexGrow: 1,
        paddingVertical: 14,
      }}
    >
      {icon}
      <Text style={{ color: "#94a3b8", fontSize: 11, fontWeight: "700" }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
