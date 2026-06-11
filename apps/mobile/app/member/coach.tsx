import { router } from "expo-router";
import { Crown, Dumbbell, Flame, MessageCircle, Salad, Sparkles, Trophy } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";

import {
  getMyRecommendations,
  getMyNudges,
  type Recommendation,
  type Nudge,
} from "../../src/api/ai.api";
import { useAuthStore } from "../../src/stores/auth.store";
import { useTheme } from "../../src/theme";
import {
  AppCard,
  AppEmptyState,
  AppHeader,
  AppLoadingState,
  AppScreen,
  AppText,
  CelebrationCard,
} from "../../src/components/ui";

const ICONS: Record<string, (c: string) => React.ReactNode> = {
  WORKOUT: (c) => <Dumbbell color={c} size={20} />,
  DIET: (c) => <Salad color={c} size={20} />,
  ENGAGEMENT: (c) => <Flame color={c} size={20} />,
  RENEWAL: (c) => <Crown color={c} size={20} />,
  CHALLENGE: (c) => <Trophy color={c} size={20} />,
};

function confidenceLabel(conf: number): string {
  if (conf >= 0.7) return "Strong match for you";
  if (conf >= 0.4) return "Worth a try";
  return "Something to consider";
}

export default function CoachScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { user } = useAuthStore();
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

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = (user?.name ?? "there").split(" ")[0];

  if (loading) {
    return (
      <AppScreen>
        <AppHeader title="Your Coach" onBack={() => router.back()} />
        <AppLoadingState rows={3} />
      </AppScreen>
    );
  }

  const opener =
    nudges[0]?.message ??
    "I've been watching your progress, and you're building real momentum. Let's keep it going today.";

  return (
    <AppScreen onRefresh={load} refreshing={false}>
      <AppHeader title="Your Coach" subtitle="A companion that learns from your training" onBack={() => router.back()} />

      {/* ── Coach greeting ──────────────────────────────────────────────────── */}
      <CelebrationCard
        icon={<Sparkles color="#FFFFFF" size={26} />}
        title={`${greeting}, ${firstName}`}
        message={opener}
      />

      {/* ── Today's focus (nudges) ──────────────────────────────────────────── */}
      {nudges.length > 0 ? (
        <>
          <AppText variant="heading">Today's focus</AppText>
          <View style={{ gap: 12 }}>
            {nudges.slice(0, 4).map((n, i) => (
              <AppCard key={`n${i}`}>
                <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
                  <View
                    style={{
                      height: 38,
                      width: 38,
                      borderRadius: theme.radius.md,
                      backgroundColor: c.primarySoft,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <MessageCircle color={c.primary} size={18} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodyStrong">{n.title}</AppText>
                    <AppText variant="body" color="textSecondary" style={{ marginTop: 4, lineHeight: 20 }}>
                      {n.message}
                    </AppText>
                  </View>
                </View>
              </AppCard>
            ))}
          </View>
        </>
      ) : null}

      {/* ── Recommendations ─────────────────────────────────────────────────── */}
      <AppText variant="heading" style={{ marginTop: 4 }}>What I'd recommend</AppText>
      {recs.length === 0 ? (
        <AppEmptyState
          emoji="🧠"
          title="You're right on track"
          description="Keep showing up — as your training data grows, I'll have sharper, more personal guidance for you."
        />
      ) : (
        <View style={{ gap: 12 }}>
          {recs.map((r, i) => (
            <AppCard key={`r${i}`}>
              <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
                <View
                  style={{
                    height: 40,
                    width: 40,
                    borderRadius: theme.radius.md,
                    backgroundColor: c.primarySoft,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {(ICONS[r.category] ?? ICONS.ENGAGEMENT)(c.primary)}
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyStrong">{r.title}</AppText>
                  <AppText variant="body" color="textSecondary" style={{ marginTop: 4, lineHeight: 20 }}>
                    {r.description}
                  </AppText>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 }}>
                    <Sparkles color={c.primary} size={12} />
                    <AppText variant="caption" color="primary" style={{ fontWeight: "700" }}>
                      {confidenceLabel(r.confidence)}
                    </AppText>
                  </View>
                </View>
              </View>
            </AppCard>
          ))}
        </View>
      )}

      {/* Closing line — human, supportive */}
      <AppText variant="caption" color="textMuted" style={{ textAlign: "center", marginTop: 8, lineHeight: 18 }}>
        I'm in your corner, every rep of the way. 💪
      </AppText>
    </AppScreen>
  );
}
