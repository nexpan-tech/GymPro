import { router } from "expo-router";
import { Crown, Flame, Trophy } from "lucide-react-native";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { gamificationService, type LeaderboardRow } from "../../src/services/gamification.service";
import { useTheme } from "../../src/theme";
import { AppCard, AppEmptyState, AppHeader, AppLoadingState, AppScreen, AppText } from "../../src/components/ui";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

// Phase O fix — gym-scoped leaderboard (was a broken Home link on mobile).
export default function LeaderboardScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    gamificationService.leaderboard().then(setRows).catch(() => setRows([])).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AppScreen>
        <AppHeader title="Leaderboard" onBack={() => router.back()} />
        <AppLoadingState rows={4} />
      </AppScreen>
    );
  }

  if (rows.length === 0) {
    return (
      <AppScreen>
        <AppHeader title="Leaderboard" onBack={() => router.back()} />
        <AppEmptyState emoji="🏆" title="No rankings yet" description="Check in, complete workouts, and earn XP to climb the leaderboard." />
      </AppScreen>
    );
  }

  const podium = [rows[1], rows[0], rows[2]].filter(Boolean) as LeaderboardRow[];
  const heights = [64, 84, 52];

  return (
    <AppScreen>
      <AppHeader title="Leaderboard" subtitle="Your gym's top members" onBack={() => router.back()} />

      {/* Podium */}
      <AppCard>
        <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: 14 }}>
          {podium.map((r) => {
            const place = r.rank - 1;
            return (
              <View key={r.memberId} style={{ alignItems: "center", width: 90 }}>
                {r.rank === 1 ? <Crown color={c.primary} size={20} style={{ marginBottom: 2 }} /> : null}
                <View style={{ height: 48, width: 48, borderRadius: 24, backgroundColor: c.muted, borderWidth: 2, borderColor: r.rank === 1 ? c.primary : c.border, alignItems: "center", justifyContent: "center" }}>
                  <AppText style={{ fontWeight: "900", color: c.textPrimary }}>{initials(r.name)}</AppText>
                </View>
                <AppText variant="caption" numberOfLines={1} style={{ marginTop: 4, fontWeight: "800" }}>{r.name}</AppText>
                <AppText variant="caption" color="textMuted">{r.xp ?? 0} XP</AppText>
                <View style={{ marginTop: 6, width: "100%", height: heights[place], borderTopLeftRadius: 8, borderTopRightRadius: 8, backgroundColor: "rgba(231,55,37,0.15)", alignItems: "center", paddingTop: 6 }}>
                  <AppText style={{ fontWeight: "900", color: c.primary }}>{r.rank}</AppText>
                </View>
              </View>
            );
          })}
        </View>
      </AppCard>

      {/* Full ranking */}
      <View style={{ gap: 8 }}>
        {rows.map((r) => (
          <AppCard key={r.memberId}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <AppText style={{ width: 24, fontWeight: "900", color: r.rank <= 3 ? c.primary : c.textSecondary }}>{r.rank}</AppText>
              <View style={{ height: 36, width: 36, borderRadius: 18, backgroundColor: c.muted, alignItems: "center", justifyContent: "center" }}>
                <AppText variant="caption" style={{ fontWeight: "900" }}>{initials(r.name)}</AppText>
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong" numberOfLines={1}>{r.name}</AppText>
                <AppText variant="caption" color="textMuted">Level {r.level ?? 1}</AppText>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Flame color={c.primary} size={13} />
                <AppText variant="caption" color="textMuted">{r.streak ?? 0}</AppText>
              </View>
              <AppText variant="bodyStrong" style={{ width: 64, textAlign: "right" }}>{r.xp ?? 0} XP</AppText>
            </View>
          </AppCard>
        ))}
      </View>

      <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 8 }}>
        <Trophy color={c.textMuted} size={16} />
      </View>
    </AppScreen>
  );
}
