import { router } from "expo-router";
import { Check } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Alert, TouchableOpacity, View } from "react-native";

import {
  membershipService,
  type MembershipPlanOption,
} from "../../src/services/membership.service";
import {
  paymentService,
  GatewayUnavailableError,
} from "../../src/services/payment.service";
import { useTheme } from "../../src/theme";
import {
  AppButton,
  AppCard,
  AppEmptyState,
  AppHeader,
  AppLoadingState,
  AppScreen,
  AppText,
} from "../../src/components/ui";

const inr = (n: number) =>
  `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

/** Plan price is GST-inclusive (gross), matching the backend invoice engine. */
function gstBreakdown(total: number, gstPercent: number) {
  const pct = gstPercent || 0;
  const subtotal = total / (1 + pct / 100);
  const gst = total - subtotal;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    gst: Math.round(gst * 100) / 100,
    total,
  };
}

export default function RenewMembershipScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [plans, setPlans] = useState<MembershipPlanOption[]>([]);
  const [gstPercent, setGstPercent] = useState(0);
  const [currentMembershipId, setCurrentMembershipId] = useState<string | undefined>();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const load = useCallback(async () => {
    try {
      const [{ gstPercent: pct, plans: list }, my] = await Promise.all([
        membershipService.getPlans(),
        membershipService.getMy().catch(() => ({ current: null, history: [] })),
      ]);
      setPlans(list);
      setGstPercent(pct);
      setCurrentMembershipId(my.current?.id);
      if (list.length === 1) setSelectedId(list[0].id);
    } catch (err) {
      console.log("Plan load failed", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = plans.find((p) => p.id === selectedId) ?? null;
  const breakdown = selected ? gstBreakdown(selected.price, gstPercent) : null;

  async function handlePay() {
    if (!selected) return;
    setPaying(true);
    try {
      await paymentService.createCheckoutOrder({
        amount: selected.price,
        membershipId: currentMembershipId,
      });
      // Order created on the gateway. The native Razorpay checkout SDK is not
      // bundled yet, so we cannot complete the handshake in-app here. When the
      // SDK/live keys are wired, open checkout → verifyCheckout → success.
      Alert.alert(
        "Almost there",
        "Your payment order was created. Secure checkout will open once the payment gateway is live.",
        [{ text: "OK", onPress: () => router.replace("/member/membership") }],
      );
    } catch (err) {
      if (err instanceof GatewayUnavailableError) {
        Alert.alert(
          "Payment gateway not live yet",
          "Online payments aren't enabled for your gym yet. Please pay at the front desk — your invoice will be emailed automatically.",
        );
      } else {
        Alert.alert("Payment failed", "Something went wrong. Please try again.");
      }
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <AppScreen>
        <AppHeader title="Renew Membership" onBack={() => router.back()} />
        <AppLoadingState rows={3} />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <AppHeader
        title="Renew Membership"
        subtitle="Choose a plan"
        onBack={() => router.back()}
      />

      {plans.length === 0 ? (
        <AppEmptyState
          emoji="📋"
          title="No plans available"
          description="Your gym hasn't published any membership plans yet. Please contact the front desk."
        />
      ) : (
        <>
          <View style={{ gap: 12 }}>
            {plans.map((p) => {
              const active = p.id === selectedId;
              return (
                <TouchableOpacity
                  key={p.id}
                  activeOpacity={0.85}
                  onPress={() => setSelectedId(p.id)}
                >
                  <AppCard
                    style={{
                      borderWidth: 2,
                      borderColor: active ? c.primary : c.border,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <View style={{ flex: 1, paddingRight: 12 }}>
                        <AppText variant="bodyStrong">{p.name}</AppText>
                        <AppText variant="caption" color="textMuted" style={{ marginTop: 2 }}>
                          {p.durationDays} days
                          {p.description ? ` · ${p.description}` : ""}
                        </AppText>
                      </View>
                      <AppText variant="subtitle">{inr(p.price)}</AppText>
                      {active ? (
                        <View style={{ marginLeft: 10 }}>
                          <Check color={c.primary} size={20} />
                        </View>
                      ) : null}
                    </View>
                  </AppCard>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Price summary */}
          {selected && breakdown ? (
            <AppCard variant="elevated" style={{ marginTop: 8 }}>
              <AppText variant="label" color="textSecondary">
                Payment Summary
              </AppText>
              <Row label="Subtotal" value={inr(breakdown.subtotal)} />
              <Row label={`GST (${gstPercent}%)`} value={inr(breakdown.gst)} />
              <View
                style={{
                  height: 1,
                  backgroundColor: c.border,
                  marginVertical: 6,
                }}
              />
              <Row label="Total" value={inr(breakdown.total)} strong />
              <AppButton
                style={{ marginTop: 14 }}
                loading={paying}
                disabled={paying}
                onPress={handlePay}
              >
                Pay Now
              </AppButton>
              <AppText
                variant="caption"
                color="textMuted"
                style={{ textAlign: "center", marginTop: 10 }}
              >
                Invoice will be sent to your registered email after payment.
              </AppText>
            </AppCard>
          ) : null}
        </>
      )}
    </AppScreen>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 12,
      }}
    >
      <AppText variant={strong ? "bodyStrong" : "body"} color={strong ? "textPrimary" : "textSecondary"}>
        {label}
      </AppText>
      <AppText variant="bodyStrong">{value}</AppText>
    </View>
  );
}
