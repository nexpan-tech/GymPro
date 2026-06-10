import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";

import {
  gamificationService,
  type Challenge,
} from "../../src/services/gamification.service";
import { useTheme } from "../../src/theme";
import {
  AppBadge,
  AppButton,
  AppCard,
  AppEmptyState,
  AppHeader,
  AppLoadingState,
  AppScreen,
  AppText,
} from "../../src/components/ui";

export default function ChallengesScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [list, summary] = await Promise.all([
        gamificationService.challenges().catch(() => []),
        gamificationService.mySummary().catch(() => null),
      ]);
      setChallenges(list);
      setMemberId(summary?.memberId ?? null);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function join(ch: Challenge) {
    if (!memberId) return;
    setJoining(ch.id);
    try {
      await gamificationService.joinChallenge(ch.id, memberId);
      await load();
    } catch {
      /* surfaced by refresh */
    } finally {
      setJoining(null);
    }
  }

  if (loading) {
    return (
      <AppScreen>
        <AppHeader title="Challenges" onBack={() => router.back()} />
        <AppLoadingState rows={3} />
      </AppScreen>
    );
  }

  const myPart = (ch: Challenge) => (memberId ? ch.participants?.find((p) => p.memberId === memberId) : undefined);

  return (
    <AppScreen onRefresh={load} refreshing={false}>
      <AppHeader title="Challenges" subtitle="Join and climb the leaderboard" onBack={() => router.back()} />
      {challenges.length === 0 ? (
        <AppEmptyState emoji="🏆" title="No challenges yet" description="Your gym hasn't published any challenges." />
      ) : (
        <View style={{ gap: 12 }}>
          {challenges.map((ch) => {
            const part = myPart(ch);
            const pct = ch.targetValue && part ? Math.min(100, Math.round((part.progress / ch.targetValue) * 100)) : 0;
            return (
              <AppCard key={ch.id}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <AppText variant="bodyStrong">{ch.title}</AppText>
                  <AppBadge label={ch.status} tone={ch.status === "ACTIVE" ? "success" : "info"} />
                </View>
                <AppText variant="caption" color="textSecondary" style={{ marginTop: 4 }}>
                  {ch.description || ch.type}
                </AppText>
                {part ? (
                  <View style={{ marginTop: 10 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <AppText variant="caption" color="textMuted">Progress</AppText>
                      <AppText variant="caption" color="textMuted">{part.progress}{ch.targetValue ? ` / ${ch.targetValue}` : ""}</AppText>
                    </View>
                    <View style={{ height: 8, borderRadius: 4, backgroundColor: c.muted, overflow: "hidden", marginTop: 4 }}>
                      <View style={{ height: "100%", width: `${pct}%`, backgroundColor: c.primary }} />
                    </View>
                    {part.isCompleted && <AppBadge label="Completed 🎉" tone="success" />}
                  </View>
                ) : (
                  <AppButton
                    size="sm"
                    style={{ marginTop: 10 }}
                    loading={joining === ch.id}
                    disabled={ch.status === "COMPLETED" || ch.status === "CANCELLED"}
                    onPress={() => join(ch)}
                  >
                    Join challenge
                  </AppButton>
                )}
              </AppCard>
            );
          })}
        </View>
      )}
    </AppScreen>
  );
}
