import { router } from "expo-router";
import { Dumbbell, Salad, Flame, Crown, Trophy, Sparkles } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";

import {
  getMyRecommendations,
  getMyNudges,
  type Recommendation,
  type Nudge,
} from "../../src/api/ai.api";
import { useTheme } from "../../src/theme";
import {
  AppBadge,
  AppCard,
  AppEmptyState,
  AppHeader,
  AppLoadingState,
  AppScreen,
  AppText,
} from "../../src/components/ui";

const ICONS: Record<string, (c: string) => React.ReactNode> = {
  WORKOUT: (c) => <Dumbbell color={c} size={20} />,
  DIET: (c) => <Salad color={c} size={20} />,
  ENGAGEMENT: (c) => <Flame color={c} size={20} />,
  RENEWAL: (c) => <Crown color={c} size={20} />,
  CHALLENGE: (c) => <Trophy color={c} size={20} />,
};

export default function CoachScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [r, n] = await Promise.all([
        getMyRecommendations().catch(() => []),
        getMyNudges().catch(() => []),
      ]);
      setRecs(r);
      setNudges(n);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return (
      <AppScreen>
        <AppHeader title="Your AI Coach" onBack={() => router.back()} />
        <AppLoadingState rows={3} />
      </AppScreen>
    );
  }

  return (
    <AppScreen onRefresh={load} refreshing={false}>
      <AppHeader title="Your AI Coach" subtitle="Personalised tips from your activity" onBack={() => router.back()} />

      {/* Smart nudges — positive coaching only */}
      {nudges.length > 0 && (
        <View style={{ gap: 12 }}>
          {nudges.slice(0, 3).map((n, i) => (
            <AppCard key={`n${i}`} variant={i === 0 ? "elevated" : undefined}>
              <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
                <Sparkles color={c.primary} size={22} />
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyStrong">{n.title}</AppText>
                  <AppText variant="caption" color="textSecondary" style={{ marginTop: 4 }}>{n.message}</AppText>
                </View>
              </View>
            </AppCard>
          ))}
        </View>
      )}

      <AppText variant="bodyStrong" color="textSecondary" style={{ marginTop: 8 }}>Recommendations</AppText>
      {recs.length === 0 ? (
        <AppEmptyState emoji="🤖" title="You're on track!" description="Keep training — new recommendations appear as your activity grows." />
      ) : (
        <View style={{ gap: 12 }}>
          {recs.map((r, i) => (
            <AppCard key={`r${i}`}>
              <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
                {(ICONS[r.category] ?? ICONS.ENGAGEMENT)(c.primary)}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <AppText variant="bodyStrong" style={{ flex: 1 }}>{r.title}</AppText>
                    <AppBadge label={`${Math.round(r.confidence * 100)}%`} tone="info" />
                  </View>
                  <AppText variant="caption" color="textSecondary" style={{ marginTop: 4 }}>{r.description}</AppText>
                  <AppText variant="caption" color="textMuted" style={{ marginTop: 4 }}>{r.category}</AppText>
                </View>
              </View>
            </AppCard>
          ))}
        </View>
      )}
    </AppScreen>
  );
}
