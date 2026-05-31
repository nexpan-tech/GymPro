import { router } from "expo-router";
import { Dumbbell, LogOut, Mail, Users } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { trainerApi } from "../../src/api/trainer.api";
import type { TrainerStats } from "../../src/api/trainer.api";
import AppButton from "../../src/components/AppButton";
import AppCard from "../../src/components/AppCard";
import { useAuthStore } from "../../src/stores/auth.store";

export default function TrainerProfileScreen() {
  const { user, logout } = useAuthStore();

  const [stats, setStats] = useState<TrainerStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const data = await trainerApi.getTrainerStats().catch(() => null);
      setStats(data);
    } catch (error) {
      console.log("Profile load failed", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  async function handleLogout() {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/auth/login");
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#6366f1" />
      </View>
    );
  }

  const displayName = user?.name ?? "Trainer";
  const displayEmail = user?.email ?? "";
  const gymId = user?.gymId ?? "—";

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      {/* Avatar Card */}
      <AppCard style={{ marginBottom: 20, alignItems: "center" }}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        <Text style={styles.name}>{displayName}</Text>

        {displayEmail ? (
          <View style={styles.emailRow}>
            <Mail color="#64748b" size={14} />
            <Text style={styles.email}>{displayEmail}</Text>
          </View>
        ) : null}

        <View style={styles.trainerBadge}>
          <Text style={styles.trainerBadgeText}>TRAINER</Text>
        </View>

        {gymId !== "—" ? (
          <Text style={styles.gymName}>Gym: {gymId}</Text>
        ) : null}
      </AppCard>

      {/* Stats */}
      <Text style={styles.sectionTitle}>Stats</Text>
      <View style={styles.statsGrid}>
        <StatBlock
          icon={Users}
          label="Assigned Members"
          value={stats?.totalAssignedMembers ?? 0}
          color="#4f46e5"
        />
        <StatBlock
          icon={Dumbbell}
          label="Workout Plans"
          value={stats?.workoutPlansCreated ?? 0}
          color="#7c3aed"
        />
      </View>

      {/* Logout */}
      <AppButton
        onPress={handleLogout}
        style={{ marginTop: 24, backgroundColor: "#dc2626" }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <LogOut color="#fff" size={20} />
          <Text style={{ color: "#fff", fontWeight: "900" as const, fontSize: 15 }}>
            Logout
          </Text>
        </View>
      </AppButton>
    </ScrollView>
  );
}

function StatBlock({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <AppCard style={{ flex: 1 }}>
      <View
        style={[styles.statIcon, { backgroundColor: color }]}
      >
        <Icon color="#fff" size={20} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
  },
  avatar: {
    height: 90,
    width: 90,
    borderRadius: 32,
    backgroundColor: "#312e81",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 16,
  },
  avatarText: {
    color: "#c7d2fe",
    fontSize: 30,
    fontWeight: "900" as const,
  },
  name: {
    color: "#f8fafc",
    fontSize: 26,
    fontWeight: "900" as const,
    textAlign: "center" as const,
    marginBottom: 8,
  },
  emailRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    marginBottom: 12,
  },
  email: {
    color: "#64748b",
    fontSize: 13,
  },
  trainerBadge: {
    backgroundColor: "rgba(99,102,241,0.15)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.4)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 10,
  },
  trainerBadgeText: {
    color: "#818cf8",
    fontSize: 12,
    fontWeight: "900" as const,
    letterSpacing: 1.5,
  },
  gymName: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "700" as const,
  },
  sectionTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "900" as const,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row" as const,
    gap: 12,
  },
  statIcon: {
    height: 44,
    width: 44,
    borderRadius: 16,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 12,
  },
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
};
