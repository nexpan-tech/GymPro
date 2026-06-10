import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";

import {
  gamificationService,
  type MemberSummary,
  type EarnedBadge,
} from "../../src/services/gamification.service";
import { useTheme } from "../../src/theme";
import {
  AppBadge,
  AppCard,
  AppHeader,
  AppLoadingState,
  AppScreen,
  AppText,
} from "../../src/components/ui";

export default function AchievementsScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const [summary, setSummary] = useState<MemberSummary | null>(null);
  const [badges, setBadges] = useState<EarnedBadge[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [s, b] = await Promise.all([
        gamificationService.mySummary().catch(() => null),
        gamificationService.myBadges().catch(() => []),
      ]);
      setSummary(s);
      setBadges(b);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return (
      <AppScreen>
        <AppHeader title="Achievements" onBack={() => router.back()} />
        <AppLoadingState rows={3} />
      </AppScreen>
    );
  }

  const streak = (t: string) => summary?.streaks.find((s) => s.type === t);

  return (
    <AppScreen onRefresh={load} refreshing={false}>
      <AppHeader title="Achievements" subtitle="Points, level, streaks & badges" onBack={() => router.back()} />

      {/* Level + points */}
      <AppCard variant="elevated">
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <AppText variant="caption" color="textSecondary">Level</AppText>
            <AppText style={{ fontSize: 32, fontWeight: "900" }}>{summary?.level ?? 1}</AppText>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <AppText variant="caption" color="textSecondary">Points balance</AppText>
            <AppText style={{ fontSize: 28, fontWeight: "900", color: c.primary }}>{summary?.balance ?? 0}</AppText>
            <AppText variant="caption" color="textMuted">{summary?.lifetimePoints ?? 0} lifetime</AppText>
          </View>
        </View>
      </AppCard>

      {/* Streaks */}
      <View style={{ flexDirection: "row", gap: 12 }}>
        {(["ATTENDANCE", "WORKOUT", "DIET"] as const).map((t) => (
          <AppCard key={t} style={{ flex: 1, alignItems: "center", gap: 2 }}>
            <AppText style={{ fontSize: 22 }}>🔥</AppText>
            <AppText style={{ fontSize: 20, fontWeight: "900" }}>{streak(t)?.current ?? 0}</AppText>
            <AppText variant="caption" color="textMuted">{t === "ATTENDANCE" ? "Gym" : t === "WORKOUT" ? "Workout" : "Diet"}</AppText>
            <AppText variant="caption" color="textMuted">best {streak(t)?.longest ?? 0}</AppText>
          </AppCard>
        ))}
      </View>

      {/* Badges */}
      <AppText variant="bodyStrong" color="textSecondary" style={{ marginTop: 8 }}>
        Badges ({summary?.badgeCount ?? badges.length})
      </AppText>
      {badges.length === 0 ? (
        <AppCard><AppText variant="body" color="textSecondary" style={{ textAlign: "center" }}>No badges yet — keep training to earn your first!</AppText></AppCard>
      ) : (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {badges.map((b) => (
            <AppCard key={b.id} style={{ width: "47%", alignItems: "center", gap: 4 }}>
              <AppText style={{ fontSize: 30 }}>{b.badge.icon || "🏅"}</AppText>
              <AppText variant="bodyStrong" style={{ textAlign: "center" }}>{b.badge.name}</AppText>
              <AppBadge label={b.badge.type} tone="info" />
            </AppCard>
          ))}
        </View>
      )}
    </AppScreen>
  );
}
