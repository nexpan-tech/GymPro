import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Share, View } from "react-native";

import {
  gamificationService,
  type MemberSummary,
  type Reward,
  type Redemption,
  type ReferralInfo,
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

export default function RewardsScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const [summary, setSummary] = useState<MemberSummary | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [referral, setReferral] = useState<ReferralInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [s, r, d, ref] = await Promise.all([
        gamificationService.mySummary().catch(() => null),
        gamificationService.rewards().catch(() => []),
        gamificationService.myRedemptions().catch(() => []),
        gamificationService.myReferralCode().catch(() => null),
      ]);
      setSummary(s); setRewards(r); setRedemptions(d); setReferral(ref);
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

  if (loading) {
    return (
      <AppScreen>
        <AppHeader title="Rewards" onBack={() => router.back()} />
        <AppLoadingState rows={3} />
      </AppScreen>
    );
  }

  const balance = summary?.balance ?? 0;

  return (
    <AppScreen onRefresh={load} refreshing={false}>
      <AppHeader title="Rewards" subtitle="Redeem points & refer friends" onBack={() => router.back()} />

      {/* Balance */}
      <AppCard variant="elevated">
        <AppText variant="caption" color="textSecondary">Your points balance</AppText>
        <AppText style={{ fontSize: 34, fontWeight: "900", color: c.primary }}>{balance}</AppText>
      </AppCard>

      {/* Referral code */}
      {referral && (
        <AppCard>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <AppText variant="caption" color="textSecondary">Your referral code</AppText>
              <AppText style={{ fontSize: 20, fontWeight: "900", marginTop: 2 }}>{referral.code}</AppText>
              <AppText variant="caption" color="textMuted">{referral.converted} converted · +{referral.rewardPerConversion} pts each</AppText>
            </View>
            <AppButton size="sm" variant="secondary" onPress={shareCode}>Share</AppButton>
          </View>
        </AppCard>
      )}

      {/* Rewards */}
      <AppText variant="bodyStrong" color="textSecondary" style={{ marginTop: 8 }}>Available rewards</AppText>
      {rewards.length === 0 ? (
        <AppEmptyState emoji="🎁" title="No rewards yet" description="Check back soon for rewards to redeem." />
      ) : (
        <View style={{ gap: 12 }}>
          {rewards.map((rw) => {
            const cost = rw.pointsCost || rw.xpCost || 0;
            const affordable = balance >= cost && (rw.stock == null || rw.stock > 0);
            return (
              <AppCard key={rw.id}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <AppText variant="bodyStrong">🎁 {rw.title}</AppText>
                    <AppText variant="caption" color="textSecondary">{rw.description || rw.type}</AppText>
                    <AppText variant="caption" color="textMuted" style={{ marginTop: 2 }}>
                      {cost} pts{rw.stock != null ? ` · ${rw.stock} left` : ""}
                    </AppText>
                  </View>
                  <AppButton size="sm" disabled={!affordable} loading={redeeming === rw.id} onPress={() => redeem(rw)}>
                    {affordable ? "Redeem" : "Locked"}
                  </AppButton>
                </View>
              </AppCard>
            );
          })}
        </View>
      )}

      {/* Redemption history */}
      {redemptions.length > 0 && (
        <>
          <AppText variant="bodyStrong" color="textSecondary" style={{ marginTop: 8 }}>My redemptions</AppText>
          <View style={{ gap: 8 }}>
            {redemptions.map((d) => (
              <AppCard key={d.id}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <AppText variant="body">{d.reward?.title ?? "Reward"}</AppText>
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
    </AppScreen>
  );
}
