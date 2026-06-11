import { router } from "expo-router";
import { CheckCircle2, CreditCard, Wallet } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { View } from "react-native";

import { paymentService, type Payment } from "../../src/services/payment.service";
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
  ScorePill,
} from "../../src/components/ui";

function gatewayLabel(p: Payment) {
  if (p.gateway && p.gateway !== "MANUAL") return p.gateway;
  if (p.gateway === "MANUAL") return `${p.method || "Cash"} · Front desk`;
  return p.method || "UPI";
}

const isPaid = (p: Payment) =>
  p.status === "PAID" || p.status === "SUCCESS" || p.status === "COMPLETED";

export default function PaymentsScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPayments = useCallback(async () => {
    try {
      const data = await paymentService.getMyPayments();
      setPayments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log(error);
      setPayments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  const stats = useMemo(() => {
    const paid = payments.filter(isPaid);
    const totalPaid = paid.reduce((s, p) => s + (p.amount || 0), 0);
    const pending = payments.filter((p) => !isPaid(p) && p.status !== "FAILED").length;
    const last = [...paid].sort(
      (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
    )[0];
    return { totalPaid, count: paid.length, pending, last };
  }, [payments]);

  if (loading) {
    return (
      <AppScreen>
        <AppHeader title="Wallet" onBack={() => router.back()} />
        <AppLoadingState rows={3} />
      </AppScreen>
    );
  }

  return (
    <AppScreen
      onRefresh={() => {
        setRefreshing(true);
        void loadPayments();
      }}
      refreshing={refreshing}
    >
      <AppHeader
        title="Wallet"
        subtitle="Payments, simplified"
        onBack={() => router.back()}
        right={
          <AppButton size="sm" onPress={() => router.push("/member/renew-membership")}>
            Pay / Renew
          </AppButton>
        }
      />

      {/* ── Wallet hero ─────────────────────────────────────────────────────── */}
      <AppCard variant="elevated">
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <AppText variant="overline" color="primary">Total paid</AppText>
            <AppText style={{ fontSize: 36, fontWeight: "900", color: c.textPrimary, letterSpacing: -1, marginTop: 2 }}>
              ₹{stats.totalPaid.toLocaleString("en-IN")}
            </AppText>
          </View>
          <View
            style={{
              height: 54,
              width: 54,
              borderRadius: theme.radius.lg,
              backgroundColor: c.primarySoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Wallet color={c.primary} size={26} />
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
          <ScorePill value={`${stats.count}`} label="Payments" emphasis />
          <ScorePill value={`${stats.pending}`} label="Pending" />
          <ScorePill
            value={stats.last?.createdAt ? new Date(stats.last.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "—"}
            label="Last paid"
          />
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14 }}>
          <CheckCircle2 color={c.primary} size={15} />
          <AppText variant="caption" color="textSecondary" style={{ flex: 1 }}>
            {stats.pending > 0
              ? "You have a payment to complete — tap Pay / Renew to stay active."
              : "You're all settled. Payments are secure and tracked right here."}
          </AppText>
        </View>
      </AppCard>

      {payments.length === 0 ? (
        <AppEmptyState
          emoji="💳"
          title="Your wallet is ready"
          description="Every payment and renewal will land here — clear, secure, and always at your fingertips."
        />
      ) : (
        <>
          <AppText variant="heading">Recent activity</AppText>
          <View style={{ gap: 12 }}>
            {payments.map((item) => {
              const paid = isPaid(item);
              const tone = paid ? "success" : item.status === "FAILED" ? "danger" : "warning";
              return (
                <AppCard key={item.id}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                      <View
                        style={{
                          height: 42,
                          width: 42,
                          borderRadius: theme.radius.md,
                          backgroundColor: paid ? c.primarySoft : c.muted,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <CreditCard color={paid ? c.primary : c.textMuted} size={18} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <AppText style={{ fontSize: 20, fontWeight: "900" }}>₹{item.amount}</AppText>
                        <AppText variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
                          {gatewayLabel(item)}
                          {item.membershipId ? " · Membership" : ""}
                        </AppText>
                      </View>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 6 }}>
                      <AppBadge label={item.status} tone={tone} />
                      <AppText variant="caption" color="textMuted">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}
                      </AppText>
                    </View>
                  </View>
                </AppCard>
              );
            })}
          </View>
        </>
      )}
    </AppScreen>
  );
}
