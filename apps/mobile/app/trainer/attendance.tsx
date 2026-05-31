import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { trainerApi } from "../../src/api/trainer.api";
import AppCard from "../../src/components/AppCard";
import { useSocket } from "../../src/hooks/useSocket";
import type { AssignedMember } from "../../src/types/trainer.types";
import type { Attendance } from "../../src/types/attendance.types";
import { api } from "../../src/api/client";

function todayLabel(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface MemberRow {
  member: AssignedMember;
  attendance: Attendance | null;
}

export default function TrainerAttendanceScreen() {
  const { on } = useSocket();

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

      const mapped: MemberRow[] = (
        Array.isArray(members) ? members : []
      ).map((m) => ({
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
    Alert.alert(
      "Manual Check-in",
      `Mark attendance for ${member.user?.name ?? "this member"}?`,
      [
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
            } catch (error) {
              Alert.alert(
                "Check-in failed",
                "Could not record attendance. Please try again."
              );
            } finally {
              setCheckingIn(null);
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#6366f1" />
      </View>
    );
  }

  const checkedInCount = rows.filter((r) => r.attendance !== null).length;

  return (
    <View style={styles.screen}>
      <View style={styles.headerArea}>
        <Text style={styles.title}>Today's Attendance</Text>
        <Text style={styles.dateLabel}>{todayLabel()}</Text>
        <View style={styles.summaryRow}>
          <SummaryBadge
            label="Checked In"
            value={checkedInCount}
            color="#22c55e"
          />
          <SummaryBadge
            label="Not Yet"
            value={rows.length - checkedInCount}
            color="#f59e0b"
          />
          <SummaryBadge label="Total" value={rows.length} color="#6366f1" />
        </View>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item) => item.member.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>📅</Text>
            <Text style={styles.emptyTitle}>No members assigned</Text>
            <Text style={styles.emptySubtitle}>
              Once members are assigned to you, their attendance will appear here.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <AttendanceRow
            row={item}
            checkingIn={checkingIn === item.member.id}
            onCheckIn={() => handleManualCheckIn(item.member)}
          />
        )}
      />
    </View>
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
  const name = row.member.user?.name ?? "Member";
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const checked = row.attendance !== null;

  return (
    <AppCard style={{ marginBottom: 12 }}>
      <View style={styles.rowLayout}>
        <View style={[styles.avatar, checked && styles.avatarChecked]}>
          <Text style={styles.initials}>{initials}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.memberName}>{name}</Text>
          {checked ? (
            <Text style={styles.checkedTime}>
              {formatTime(row.attendance!.checkInAt)}
            </Text>
          ) : (
            <Text style={styles.notYetText}>Not checked in yet</Text>
          )}
        </View>

        {checked ? (
          <View style={styles.checkedBadge}>
            <Text style={styles.checkedBadgeText}>✓ In</Text>
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
              <Text style={styles.checkInBtnText}>Check In</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </AppCard>
  );
}

function SummaryBadge({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={[styles.summaryCard, { borderColor: color + "44" }]}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
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
  title: {
    color: "#f8fafc",
    fontSize: 30,
    fontWeight: "900" as const,
  },
  dateLabel: {
    color: "#94a3b8",
    marginTop: 4,
    marginBottom: 16,
    fontSize: 13,
  },
  summaryRow: {
    flexDirection: "row" as const,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: "center" as const,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: "900" as const,
  },
  summaryLabel: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "700" as const,
    marginTop: 2,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  rowLayout: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  avatar: {
    height: 46,
    width: 46,
    borderRadius: 16,
    backgroundColor: "#1e293b",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  avatarChecked: {
    backgroundColor: "#14532d",
  },
  initials: {
    color: "#94a3b8",
    fontSize: 15,
    fontWeight: "900" as const,
  },
  memberName: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "900" as const,
  },
  checkedTime: {
    color: "#4ade80",
    fontSize: 12,
    marginTop: 2,
    fontWeight: "700" as const,
  },
  notYetText: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 2,
  },
  checkedBadge: {
    backgroundColor: "rgba(34,197,94,0.12)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.3)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  checkedBadgeText: {
    color: "#4ade80",
    fontWeight: "900" as const,
    fontSize: 13,
  },
  checkInBtn: {
    backgroundColor: "#4f46e5",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 80,
    alignItems: "center" as const,
  },
  checkInBtnText: {
    color: "#fff",
    fontWeight: "900" as const,
    fontSize: 13,
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
    lineHeight: 22,
  },
};
