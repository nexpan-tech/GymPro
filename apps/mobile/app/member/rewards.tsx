import { router } from "expo-router";
import { Gift, Lock, Sparkles, Star, Crown, CalendarClock } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Share, View } from "react-native";

import {
  gamificationService,
  type MemberSummary,
  type Reward,
  type Redemption,
  type ReferralInfo,
  type Referral,
} from "../../src/services/gamification.service";

// UI-only referral levels from successful (converted) referral count.
const REF_LEVELS = [
  { name: "Bronze", min: 0 }, { name: "Silver", min: 3 }, { name: "Gold", min: 10 },
  { name: "Diamond", min: 25 }, { name: "Elite", min: 50 },
] as const;
function refLevel(converted: number) {
  let i = 0;
  for (let k = 0; k < REF_LEVELS.length; k++) if (converted >= REF_LEVELS[k].min) i = k;
  const next = REF_LEVELS[i + 1] ?? null;
  return { name: REF_LEVELS[i].name, toNext: next ? Math.max(0, next.min - converted) : 0, next: next?.name ?? null };
}
const isSuccessful = (s: string) => s === "CONVERTED" || s === "REWARDED";
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
  CelebrationCard,
  ProgressBar,
  ScorePill,
} from "../../src/components/ui";

export default function RewardsScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const [summary, setSummary] = useState<MemberSummary | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [referral, setReferral] = useState<ReferralInfo | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [s, r, d, ref, refs] = await Promise.all([
        gamificationService.mySummary().catch(() => null),
        gamificationService.rewards().catch(() => []),
        gamificationService.myRedemptions().catch(() => []),
        gamificationService.myReferralCode().catch(() => null),
        gamificationService.myReferrals().catch(() => [] as Referral[]),
      ]);
      setSummary(s); setRewards(r); setRedemptions(d); setReferral(ref); setReferrals(refs);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function redeem(rw: Reward) {
    setRedeeming(rw.id);
    try {
      await gamificationService.redeem(rw.id);
      Alert.alert("Redeemed", `You redeemed "${rw.title}".`);
      await load();
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Could not redeem reward.";
      Alert.alert("Redeem failed", msg);
    } finally {
      setRedeeming(null);
    }
  }

  async function shareCode() {
    if (!referral) return;
    try { await Share.share({ message: referral.shareText }); } catch { /* cancelled */ }
  }

  const balance = summary?.balance ?? 0;

  const cost = (rw: Reward) => rw.pointsCost || rw.xpCost || 0;

  // The next reward the member is working toward (cheapest one not yet affordable).
  const nextReward = useMemo(() => {
    return rewards
      .map((r) => ({ r, cost: cost(r) }))
      .filter((x) => x.cost > balance)
      .sort((a, b) => a.cost - b.cost)[0] ?? null;
  }, [rewards, balance]);

  const affordableCount = useMemo(
    () => rewards.filter((r) => balance >= cost(r) && (r.stock == null || r.stock > 0)).length,
    [rewards, balance],
  );

  if (loading) {
    return (
      <AppScreen>
        <AppHeader title="Achievement Store" onBack={() => router.back()} />
        <AppLoadingState rows={3} />
      </AppScreen>
    );
  }

  return (
    <AppScreen onRefresh={load} refreshing={false}>
      <AppHeader title="Achievement Store" subtitle="Turn consistency into rewards" onBack={() => router.back()} />

      {/* ── Points hero ─────────────────────────────────────────────────────── */}
      <AppCard variant="elevated">
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <AppText variant="overline" color="primary">Points balance</AppText>
            <AppText style={{ fontSize: 40, fontWeight: "900", color: c.primary, letterSpacing: -1, marginTop: 2 }}>
              {balance}
            </AppText>
          </View>
          <View
            style={{
              height: 56,
              width: 56,
              borderRadius: theme.radius.lg,
              backgroundColor: c.primarySoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Star color={c.primary} size={26} />
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
          <ScorePill value={`L${summary?.level ?? 1}`} label="Level" emphasis />
          <ScorePill value={`${summary?.lifetimePoints ?? 0}`} label="Lifetime" />
          <ScorePill value={`${summary?.badgeCount ?? 0}`} label="Badges" />
        </View>

        {nextReward ? (
          <View style={{ marginTop: 16 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
              <AppText variant="caption" color="textSecondary" style={{ fontWeight: "700" }}>
                Next: {nextReward.r.title}
              </AppText>
              <AppText variant="caption" color="primary" style={{ fontWeight: "800" }}>
                {nextReward.cost - balance} pts to go
              </AppText>
            </View>
            <ProgressBar progress={balance / nextReward.cost} />
          </View>
        ) : rewards.length > 0 ? (
          <AppText variant="caption" color="primary" style={{ marginTop: 14 }}>
            🔥 You can afford {affordableCount} reward{affordableCount === 1 ? "" : "s"} right now — go claim them!
          </AppText>
        ) : null}
      </AppCard>

      {/* Referral hero */}
      {referral && (() => {
        const lvl = refLevel(referral.converted);
        const pending = Math.max(0, referral.total - referral.converted);
        return (
          <AppCard variant="elevated">
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Crown color={c.primary} size={14} />
                  <AppText variant="overline" color="primary">{lvl.name} Referrer</AppText>
                </View>
                <AppText variant="caption" color="textSecondary" style={{ marginTop: 6 }}>Your referral code</AppText>
                <AppText style={{ fontSize: 26, fontWeight: "900", letterSpacing: 2, marginTop: 2 }}>{referral.code}</AppText>
                <AppText variant="caption" color="textMuted" style={{ marginTop: 2 }}>+{referral.rewardPerConversion} pts when a friend joins & activates their first membership</AppText>
              </View>
              <AppButton size="sm" onPress={shareCode}>Share</AppButton>
            </View>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
              <ScorePill value={`${referral.total}`} label="Total" />
              <ScorePill value={`${pending}`} label="Pending" />
              <ScorePill value={`${referral.converted}`} label="Successful" emphasis />
            </View>
            {lvl.next ? (
              <AppText variant="caption" color="textMuted" style={{ marginTop: 10 }}>{lvl.toNext} more successful referral{lvl.toNext === 1 ? "" : "s"} → {lvl.next}</AppText>
            ) : (
              <AppText variant="caption" color="primary" style={{ marginTop: 10 }}>🏆 Elite tier — you're a top referrer!</AppText>
            )}
          </AppCard>
        );
      })()}

      {/* Referral history */}
      {referral && (
        <>
          <AppText variant="heading" style={{ marginTop: 8 }}>Referral history</AppText>
          {referrals.length === 0 ? (
            <AppEmptyState emoji="🤝" title="No referrals yet" description="Share your code — you earn points when a friend joins and activates their first membership." />
          ) : (
            <View style={{ gap: 8 }}>
              {referrals.map((rf) => (
                <AppCard key={rf.id}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View style={{ flex: 1 }}>
                      <AppText variant="bodyStrong" numberOfLines={1}>{rf.inviteeName ?? "Invited friend"}</AppText>
                      <AppText variant="caption" color="textMuted">
                        Registered {new Date(rf.createdAt).toLocaleDateString()}{rf.convertedAt ? ` · activated ${new Date(rf.convertedAt).toLocaleDateString()}` : ""}
                      </AppText>
                    </View>
                    <AppBadge
                      label={isSuccessful(rf.status) ? "Successful" : rf.status.charAt(0) + rf.status.slice(1).toLowerCase()}
                      tone={isSuccessful(rf.status) ? "success" : rf.status === "PENDING" ? "warning" : "neutral"}
                    />
                  </View>
                </AppCard>
              ))}
            </View>
          )}

          {/* Campaign empty state — no fake live campaigns */}
          <AppCard>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <CalendarClock color={c.textMuted} size={18} />
              <AppText variant="bodyStrong">Active campaigns</AppText>
            </View>
            <AppText variant="caption" color="textMuted" style={{ marginTop: 6 }}>
              When your gym runs a referral campaign, the countdown, campaign leaderboard, and bonus rewards will appear here.
            </AppText>
          </AppCard>
        </>
      )}

      {/* Rewards */}
      <AppText variant="heading" style={{ marginTop: 8 }}>Available rewards</AppText>
      {rewards.length === 0 ? (
        <AppEmptyState
          emoji="🎁"
          title="Greatness is loading"
          description="Your gym is preparing rewards worth chasing. Keep your streak alive — they're coming."
        />
      ) : (
        <View style={{ gap: 12 }}>
          {rewards.map((rw) => {
            const rwCost = cost(rw);
            const outOfStock = rw.stock != null && rw.stock <= 0;
            const affordable = balance >= rwCost && !outOfStock;
            const progress = rwCost > 0 ? Math.min(1, balance / rwCost) : 1;
            return (
              <AppCard key={rw.id} style={{ borderColor: affordable ? c.primary : c.border }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View
                    style={{
                      height: 44,
                      width: 44,
                      borderRadius: theme.radius.md,
                      backgroundColor: affordable ? c.primary : c.muted,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {affordable ? <Gift color="#FFFFFF" size={20} /> : <Lock color={c.textMuted} size={18} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodyStrong">{rw.title}</AppText>
                    <AppText variant="caption" color="textSecondary">{rw.description || rw.type}</AppText>
                    <AppText variant="caption" color="textMuted" style={{ marginTop: 2 }}>
                      {rwCost} pts{rw.stock != null ? ` · ${rw.stock} left` : ""}
                    </AppText>
                  </View>
                  <AppButton size="sm" disabled={!affordable} loading={redeeming === rw.id} onPress={() => redeem(rw)}>
                    {outOfStock ? "Sold out" : affordable ? "Redeem" : "Locked"}
                  </AppButton>
                </View>
                {!affordable && !outOfStock ? (
                  <View style={{ marginTop: 12 }}>
                    <ProgressBar progress={progress} height={6} />
                    <AppText variant="caption" color="textMuted" style={{ marginTop: 6 }}>
                      {rwCost - balance} more points to unlock
                    </AppText>
                  </View>
                ) : null}
              </AppCard>
            );
          })}
        </View>
      )}

      {/* Redemption history */}
      {redemptions.length > 0 && (
        <>
          <AppText variant="heading" style={{ marginTop: 8 }}>My redemptions</AppText>
          <View style={{ gap: 8 }}>
            {redemptions.map((d) => (
              <AppCard key={d.id}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                    <Sparkles color={c.primary} size={16} />
                    <AppText variant="body">{d.reward?.title ?? "Reward"}</AppText>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 4 }}>
                    <AppText variant="caption" color="textMuted">{d.pointsSpent} pts</AppText>
                    <AppBadge label={d.status} tone={d.status === "FULFILLED" ? "success" : "warning"} />
                  </View>
                </View>
              </AppCard>
            ))}
          </View>
        </>
      )}

      {/* Closing encouragement */}
      {rewards.length > 0 ? (
        <CelebrationCard
          emoji="⚡"
          title="Every rep earns points"
          message="Show up, train hard, log your wins — the store only gets better from here."
        />
      ) : null}
    </AppScreen>
  );
}
