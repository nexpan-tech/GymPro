import { router } from "expo-router";
import { Dumbbell, LogOut, Mail, Users } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";

import { trainerApi } from "../../src/api/trainer.api";
import type { TrainerStats } from "../../src/api/trainer.api";
import { useAuthStore } from "../../src/stores/auth.store";
import { useTheme } from "../../src/theme";
import {
  AppAvatar,
  AppBadge,
  AppButton,
  AppCard,
  AppScreen,
  AppText,
  ThemeToggle,
} from "../../src/components/ui";

export default function TrainerProfileScreen() {
  const { user, logout } = useAuthStore();
  const { theme } = useTheme();
  const c = theme.colors;

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
      <View
        style={{
          flex: 1,
          backgroundColor: c.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }

  const displayName = user?.name ?? "Trainer";
  const displayEmail = user?.email ?? "";
  const gymId = user?.gymId ?? "—";

  return (
    <AppScreen>
      <View style={{ marginBottom: 8 }}>
        <AppText variant="title">Profile</AppText>
        <AppText variant="caption" color="textMuted" style={{ marginTop: 4 }}>
          Your trainer account
        </AppText>
      </View>

      {/* Avatar Card */}
      <AppCard variant="elevated" style={{ alignItems: "center", paddingVertical: 28, gap: 10 }}>
        <AppAvatar name={displayName} size={90} />
        <AppText variant="heading" style={{ textAlign: "center" }}>
          {displayName}
        </AppText>
        {displayEmail ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Mail color={c.textMuted} size={14} />
            <AppText variant="caption" color="textMuted">
              {displayEmail}
            </AppText>
          </View>
        ) : null}
        <AppBadge label="TRAINER" tone="primary" />
        {gymId !== "—" ? (
          <AppText variant="caption" color="textSecondary">
            Gym: {gymId}
          </AppText>
        ) : null}
      </AppCard>

      {/* Stats */}
      <AppText variant="overline" color="textMuted">
        Stats
      </AppText>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <StatBlock icon={Users} label="Assigned Members" value={stats?.totalAssignedMembers ?? 0} color={c.primary} />
        <StatBlock icon={Dumbbell} label="Workout Plans" value={stats?.workoutPlansCreated ?? 0} color={c.info} />
      </View>

      {/* Appearance */}
      <AppText variant="overline" color="textMuted">
        Appearance
      </AppText>
      <AppCard>
        <ThemeToggle />
      </AppCard>

      {/* Logout */}
      <AppButton variant="danger" onPress={handleLogout} icon={<LogOut color="#fff" size={20} />}>
        Logout
      </AppButton>
    </AppScreen>
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
  const { theme } = useTheme();
  return (
    <AppCard style={{ flex: 1, gap: 4 }}>
      <View
        style={{
          height: 44,
          width: 44,
          borderRadius: theme.radius.md,
          backgroundColor: color,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 8,
        }}
      >
        <Icon color="#fff" size={20} />
      </View>
      <AppText style={{ fontSize: 28, fontWeight: "900" }}>{value}</AppText>
      <AppText variant="caption" color="textSecondary">
        {label}
      </AppText>
    </AppCard>
  );
}
