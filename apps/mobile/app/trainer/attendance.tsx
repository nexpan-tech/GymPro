import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { trainerApi } from "../../src/api/trainer.api";
import { useSocket } from "../../src/hooks/useSocket";
import type { AssignedMember } from "../../src/types/trainer.types";
import type { Attendance } from "../../src/types/attendance.types";
import { api } from "../../src/api/client";
import { useTheme, type Theme } from "../../src/theme";
import { AppAvatar, AppCard, AppEmptyState, AppText } from "../../src/components/ui";

function todayLabel(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

interface MemberRow {
  member: AssignedMember;
  attendance: Attendance | null;
}

export default function TrainerAttendanceScreen() {
  const { on } = useSocket();
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [rows, setRows] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [members, todayAttendance] = await Promise.all([
        trainerApi.getAssignedMembers().catch(() => [] as AssignedMember[]),
        trainerApi.getTodayAttendance().catch(() => [] as Attendance[]),
      ]);

      const attendanceMap = new Map<string, Attendance>();
      for (const a of Array.isArray(todayAttendance) ? todayAttendance : []) {
        if (a.memberId) attendanceMap.set(a.memberId, a);
      }

      const mapped: MemberRow[] = (Array.isArray(members) ? members : []).map((m) => ({
        member: m,
        attendance: attendanceMap.get(m.id) ?? null,
      }));

      setRows(mapped);
    } catch (error) {
      console.log("Attendance load failed", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Realtime refresh on backend attendance updates.
  useEffect(() => {
    on("attendance:update", () => {
      void loadData();
    });
  }, [on, loadData]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
  }

  async function handleManualCheckIn(member: AssignedMember) {
    Alert.alert("Manual Check-in", `Mark attendance for ${member.user?.name ?? "this member"}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Check In",
        onPress: async () => {
          setCheckingIn(member.id);
          try {
            const today = new Date().toISOString().split("T")[0];
            await api.post("/attendance", {
              memberId: member.id,
              gymId: member.gymId,
              date: today,
              checkInAt: new Date().toISOString(),
              method: "MANUAL",
            });
            await loadData();
          } catch {
            Alert.alert("Check-in failed", "Could not record attendance. Please try again.");
          } finally {
            setCheckingIn(null);
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }

  const checkedInCount = rows.filter((r) => r.attendance !== null).length;

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <View style={styles.headerArea}>
        <AppText variant="title">Today's Attendance</AppText>
        <AppText variant="caption" color="textSecondary" style={{ marginTop: 4, marginBottom: 16 }}>
          {todayLabel()}
        </AppText>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <SummaryBadge label="Checked In" value={checkedInCount} color={c.success} />
          <SummaryBadge label="Not Yet" value={rows.length - checkedInCount} color={c.warning} />
          <SummaryBadge label="Total" value={rows.length} color={c.primary} />
        </View>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item) => item.member.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={c.primary} />
        }
        ListEmptyComponent={
          <AppEmptyState
            emoji="📅"
            title="No members assigned"
            description="Once members are assigned to you, their attendance will appear here."
          />
        }
        renderItem={({ item }) => (
          <AttendanceRow
            row={item}
            checkingIn={checkingIn === item.member.id}
            onCheckIn={() => handleManualCheckIn(item.member)}
          />
        )}
      />
    </SafeAreaView>
  );
}

function AttendanceRow({
  row,
  checkingIn,
  onCheckIn,
}: {
  row: MemberRow;
  checkingIn: boolean;
  onCheckIn: () => void;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const name = row.member.user?.name ?? "Member";
  const checked = row.attendance !== null;

  return (
    <AppCard style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <AppAvatar name={name} size={46} />
        <View style={{ flex: 1 }}>
          <AppText variant="bodyStrong">{name}</AppText>
          {checked ? (
            <AppText variant="caption" style={{ color: c.success, marginTop: 2 }}>
              {formatTime(row.attendance!.checkInAt)}
            </AppText>
          ) : (
            <AppText variant="caption" color="textMuted" style={{ marginTop: 2 }}>
              Not checked in yet
            </AppText>
          )}
        </View>

        {checked ? (
          <View style={styles.checkedBadge}>
            <Text style={{ color: c.success, fontWeight: "900", fontSize: 13 }}>✓ In</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.checkInBtn, checkingIn && { opacity: 0.6 }]}
            onPress={onCheckIn}
            disabled={checkingIn}
            activeOpacity={0.8}
          >
            {checkingIn ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={{ color: c.onPrimary, fontWeight: "900", fontSize: 13 }}>Check In</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </AppCard>
  );
}

function SummaryBadge({ label, value, color }: { label: string; value: number; color: string }) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={[styles.summaryCard, { borderColor: color }]}>
      <Text style={{ fontSize: 22, fontWeight: "900", color }}>{value}</Text>
      <AppText variant="caption" color="textMuted" style={{ marginTop: 2 }}>
        {label}
      </AppText>
    </View>
  );
}

function makeStyles(theme: Theme) {
  const c = theme.colors;
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.background },
    center: { flex: 1, backgroundColor: c.background, alignItems: "center", justifyContent: "center" },
    headerArea: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
    summaryCard: {
      flex: 1,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderRadius: theme.radius.md,
      padding: 12,
      alignItems: "center",
    },
    list: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },
    checkedBadge: {
      backgroundColor: c.successSoft,
      borderWidth: 1,
      borderColor: c.success,
      borderRadius: theme.radius.sm,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    checkInBtn: {
      backgroundColor: c.primary,
      borderRadius: theme.radius.sm,
      paddingHorizontal: 14,
      paddingVertical: 8,
      minWidth: 80,
      alignItems: "center",
    },
  });
}
