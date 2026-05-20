import { router } from "expo-router";
import { ArrowLeft, CalendarCheck } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AppCard from "../../src/components/AppCard";
import { attendanceService } from "../../src/services/attendance.service";
import type { Attendance } from "../../src/types/attendance.types";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AttendanceScreen() {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAttendance = useCallback(async () => {
    try {
      const data = await attendanceService.getMyAttendance();
      setRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("Attendance load failed", error);
      setRecords([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadAttendance();
  }, [loadAttendance]);

  const thisMonthCount = useMemo(() => {
    const now = new Date();

    return records.filter((item) => {
      const date = new Date(item.date);
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    }).length;
  }, [records]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#818cf8" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void loadAttendance();
          }}
        />
      }
    >
      <Header title="Attendance" subtitle="Your gym check-in history" />

      <View style={styles.statsRow}>
        <AppCard style={styles.statCard}>
          <Text style={styles.statLabel}>This Month</Text>
          <Text style={styles.statValue}>{thisMonthCount}</Text>
        </AppCard>

        <AppCard style={styles.statCard}>
          <Text style={styles.statLabel}>Total Visits</Text>
          <Text style={styles.statValue}>{records.length}</Text>
        </AppCard>
      </View>

      <Text style={styles.sectionTitle}>Recent Check-ins</Text>

      <View style={{ gap: 12 }}>
        {records.length > 0 ? (
          records.map((item) => (
            <AppCard key={item.id}>
              <View style={styles.recordRow}>
                <View style={styles.recordIcon}>
                  <CalendarCheck color="#34d399" size={22} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.recordTitle}>{formatDate(item.date)}</Text>
                  <Text style={styles.recordSub}>
                    Checked in at {formatTime(item.checkInAt)}
                  </Text>
                </View>

                <Text style={styles.presentBadge}>Present</Text>
              </View>
            </AppCard>
          ))
        ) : (
          <AppCard>
            <Text style={styles.emptyText}>No attendance records yet.</Text>
          </AppCard>
        )}
      </View>
    </ScrollView>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <ArrowLeft color="#f8fafc" size={22} />
      </TouchableOpacity>

      <View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = {
  screen: {
    flex: 1,
    backgroundColor: "#020617",
  },
  content: {
    padding: 20,
    paddingTop: 64,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    backgroundColor: "#020617",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 14,
    marginBottom: 24,
  },
  backButton: {
    height: 44,
    width: 44,
    borderRadius: 16,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.18)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  title: {
    color: "#f8fafc",
    fontSize: 28,
    fontWeight: "900" as const,
  },
  subtitle: {
    color: "#94a3b8",
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row" as const,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
  },
  statLabel: {
    color: "#94a3b8",
    fontWeight: "700" as const,
  },
  statValue: {
    color: "#f8fafc",
    fontSize: 32,
    fontWeight: "900" as const,
    marginTop: 8,
  },
  sectionTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "900" as const,
    marginBottom: 12,
  },
  recordRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 14,
  },
  recordIcon: {
    height: 46,
    width: 46,
    borderRadius: 18,
    backgroundColor: "rgba(52,211,153,0.12)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  recordTitle: {
    color: "#f8fafc",
    fontWeight: "900" as const,
    fontSize: 15,
  },
  recordSub: {
    color: "#94a3b8",
    marginTop: 4,
  },
  presentBadge: {
    color: "#34d399",
    fontSize: 12,
    fontWeight: "900" as const,
  },
  emptyText: {
    color: "#94a3b8",
    textAlign: "center" as const,
  },
};