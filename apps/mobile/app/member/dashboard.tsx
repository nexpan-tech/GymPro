import { router } from "expo-router";
import {
  CalendarCheck,
  CreditCard,
  Dumbbell,
  LogOut,
  QrCode,
  Salad,
  TrendingUp,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AppButton from "../../src/components/AppButton";
import AppCard from "../../src/components/AppCard";
import StatCard from "../../src/components/StatCard";
import { attendanceService } from "../../src/services/attendance.service";
import { memberService } from "../../src/services/member.service";
import { useAuthStore } from "../../src/store/auth.store";
import type { Attendance } from "../../src/types/attendance.types";
import type { Member } from "../../src/types/member.types";


function isToday(date: string) {
  const now = new Date();
  const target = new Date(date);

  return (
    now.getFullYear() === target.getFullYear() &&
    now.getMonth() === target.getMonth() &&
    now.getDate() === target.getDate()
  );
}

export default function MemberDashboardScreen() {
  const { user, logout } = useAuthStore();

  const [member, setMember] = useState<Member | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
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

  const checkedInToday = useMemo(
    () => attendance.some((item) => isToday(item.date)),
    [attendance]
  );

  const attendanceThisMonth = useMemo(() => {
    const now = new Date();

    return attendance.filter((item) => {
      const date = new Date(item.date);
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    }).length;
  }, [attendance]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadDashboard();
  }


  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#020617",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color="#818cf8" />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#020617" }}
      contentContainerStyle={{ padding: 20, paddingTop: 64, paddingBottom: 40 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 26,
        }}
      >
        <View>
          <Text
            style={{
              color: "#818cf8",
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
              fontSize: 30,
              fontWeight: "900",
              marginTop: 6,
            }}
          >
            Hi, {member?.user?.name || user?.name || "Member"}
          </Text>

          <Text style={{ color: "#94a3b8", marginTop: 6 }}>
            Your fitness command center
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          style={{
            height: 44,
            width: 44,
            borderRadius: 16,
            backgroundColor: "#0f172a",
            borderWidth: 1,
            borderColor: "rgba(148,163,184,0.18)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LogOut color="#f87171" size={20} />
        </TouchableOpacity>
      </View>

      <AppCard style={{ marginBottom: 20 }}>
        <Text style={{ color: "#94a3b8", fontWeight: "700" }}>
          Today’s Attendance
        </Text>

        <Text
          style={{
            color: "#f8fafc",
            fontSize: 28,
            fontWeight: "900",
            marginTop: 8,
          }}
        >
          {checkedInToday ? "Checked In" : "Not Checked In"}
        </Text>

        <Text style={{ color: "#94a3b8", lineHeight: 22, marginTop: 8 }}>
          {checkedInToday
            ? "Great job. Your attendance is marked for today."
            : "Scan your gym QR to mark today’s attendance."}
        </Text>

        <AppButton
        onPress={() => router.push("/member/scanner")}
        disabled={checkedInToday}
        style={{ marginTop: 18 }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <QrCode color="#fff" size={20} />
            <Text style={{ color: "#fff", fontWeight: "900", fontSize: 15 }}>
              {checkedInToday ? "Checked In Today" : "Scan QR Check-in"}
            </Text>
          </View>
        </AppButton>
      </AppCard>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 12,
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <StatCard
          label="This Month"
          value={attendanceThisMonth}
          icon={CalendarCheck}
          color="#2563eb"
        />
        <StatCard
          label="Total Visits"
          value={attendance.length}
          icon={TrendingUp}
          color="#7c3aed"
        />
        <StatCard
          label="Membership"
          value="Active"
          icon={CreditCard}
          color="#059669"
        />
        <StatCard label="Goal" value="68%" icon={Dumbbell} color="#f59e0b" />
      </View>

      <Text
        style={{
          color: "#f8fafc",
          fontSize: 18,
          fontWeight: "900",
          marginBottom: 12,
        }}
      >
        Quick Actions
      </Text>

      <View style={{ gap: 12 }}>
        <ActionCard
          icon={CalendarCheck}
          title="Attendance History"
          subtitle="View your check-in records"
          onPress={() => router.push("/member/attendance")}
        />
        <ActionCard
          icon={Dumbbell}
          title="Workout Plan"
          subtitle="Today’s trainer assigned workouts"
          onPress={() => router.push("/member/workout")}
        />
        <ActionCard
          icon={Salad}
          title="Diet Plan"
          subtitle="Your weekly nutrition schedule"
          onPress={() => router.push("/member/diet")}
        />
        <ActionCard
          icon={CreditCard}
          title="Membership"
          subtitle="Plan status and renewal details"
          onPress={() => router.push("/member/membership")}
        />
      </View>
    </ScrollView>
  );
}

function ActionCard({
  icon: Icon,
  title,
  subtitle,
  onPress,
}: {
  icon: typeof CalendarCheck;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <AppCard>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <View
            style={{
              height: 46,
              width: 46,
              borderRadius: 18,
              backgroundColor: "#1e293b",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon color="#818cf8" size={22} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ color: "#f8fafc", fontWeight: "900", fontSize: 15 }}>
              {title}
            </Text>
            <Text style={{ color: "#94a3b8", marginTop: 4 }}>{subtitle}</Text>
          </View>
        </View>
      </AppCard>
    </TouchableOpacity>
  );
}