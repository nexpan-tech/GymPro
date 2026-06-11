import { router } from "expo-router";
import { Clock, Flame, Medal, Trophy } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  ProgressBar,
  ScorePill,
} from "../../src/components/ui";

function daysLeft(endDate: string): number {
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / 86_400_000);
}

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

  const myPart = useCallback(
    (ch: Challenge) => (memberId ? ch.participants?.find((p) => p.memberId === memberId) : undefined),
    [memberId],
  );

  // Rank within a challenge = position by progress (desc).
  const myRank = useCallback(
    (ch: Challenge): { rank: number; total: number } | null => {
      if (!memberId || !ch.participants?.length) return null;
      const sorted = [...ch.participants].sort((a, b) => b.progress - a.progress);
      const idx = sorted.findIndex((p) => p.memberId === memberId);
      return idx >= 0 ? { rank: idx + 1, total: sorted.length } : null;
    },
    [memberId],
  );

  const stats = useMemo(() => {
    const active = challenges.filter((ch) => ch.status === "ACTIVE").length;
    const joined = challenges.filter((ch) => myPart(ch)).length;
    const completed = challenges.filter((ch) => myPart(ch)?.isCompleted).length;
    return { active, joined, completed };
  }, [challenges, myPart]);

  if (loading) {
    return (
      <AppScreen>
        <AppHeader title="Arena" onBack={() => router.back()} />
        <AppLoadingState rows={3} />
      </AppScreen>
    );
  }

  return (
    <AppScreen onRefresh={load} refreshing={false}>
      <AppHeader title="Competitive Arena" subtitle="Join, compete, climb the ranks" onBack={() => router.back()} />

      {/* ── Arena summary ───────────────────────────────────────────────────── */}
      {challenges.length > 0 ? (
        <View style={{ flexDirection: "row", gap: 10 }}>
          <ScorePill value={`${stats.active}`} label="Live now" emphasis />
          <ScorePill value={`${stats.joined}`} label="Joined" />
          <ScorePill value={`${stats.completed}`} label="Conquered" />
        </View>
      ) : null}

      {challenges.length === 0 ? (
        <AppEmptyState
          emoji="🏆"
          title="The arena is being set"
          description="No live challenges yet. When they drop, this is where you turn effort into bragging rights."
        />
      ) : (
        <View style={{ gap: 12 }}>
          {challenges.map((ch) => {
            const part = myPart(ch);
            const rank = myRank(ch);
            const pct = ch.targetValue && part ? Math.min(1, part.progress / ch.targetValue) : 0;
            const left = daysLeft(ch.endDate);
            const closed = ch.status === "COMPLETED" || ch.status === "CANCELLED";
            return (
              <AppCard key={ch.id} style={{ borderColor: part?.isCompleted ? c.primary : c.border }}>
                {/* Header */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Trophy color={c.primary} size={16} />
                      <AppText variant="bodyStrong" style={{ flex: 1 }}>{ch.title}</AppText>
                    </View>
                    <AppText variant="caption" color="textSecondary" style={{ marginTop: 4 }}>
                      {ch.description || ch.type}
                    </AppText>
                  </View>
                  <AppBadge label={ch.status} tone={ch.status === "ACTIVE" ? "success" : "info"} />
                </View>

                {/* Meta row: time left + rank */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginTop: 10 }}>
                  {ch.status === "ACTIVE" && left >= 0 ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                      <Clock color={c.textMuted} size={13} />
                      <AppText variant="caption" color="textMuted">
                        {left === 0 ? "Ends today" : `${left}d left`}
                      </AppText>
                    </View>
                  ) : null}
                  {rank ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                      <Medal color={c.primary} size={13} />
                      <AppText variant="caption" color="primary" style={{ fontWeight: "800" }}>
                        Rank #{rank.rank} of {rank.total}
                      </AppText>
                    </View>
                  ) : null}
                </View>

                {/* Progress / join */}
                {part ? (
                  <View style={{ marginTop: 12 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                      <AppText variant="caption" color="textMuted">Your progress</AppText>
                      <AppText variant="caption" color="textSecondary" style={{ fontWeight: "800" }}>
                        {part.progress}{ch.targetValue ? ` / ${ch.targetValue}` : ""}
                      </AppText>
                    </View>
                    <ProgressBar progress={pct} />
                    {part.isCompleted ? (
                      <View
                        style={{
                          marginTop: 12,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          borderRadius: theme.radius.md,
                          backgroundColor: c.primarySoft,
                          borderWidth: 1,
                          borderColor: "rgba(231,55,37,0.35)",
                        }}
                      >
                        <Flame color={c.primary} size={16} />
                        <AppText variant="caption" style={{ color: c.primary, flex: 1, fontWeight: "700" }}>
                          Challenge conquered 🚀 — you proved what you're made of.
                        </AppText>
                      </View>
                    ) : null}
                  </View>
                ) : (
                  <AppButton
                    size="sm"
                    style={{ marginTop: 12 }}
                    loading={joining === ch.id}
                    disabled={closed}
                    onPress={() => join(ch)}
                  >
                    {closed ? "Closed" : "Enter the challenge"}
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
