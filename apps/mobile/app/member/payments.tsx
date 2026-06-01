import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";

import { paymentService, type Payment } from "../../src/services/payment.service";
import {
  AppBadge,
  AppCard,
  AppEmptyState,
  AppHeader,
  AppLoadingState,
  AppScreen,
  AppText,
} from "../../src/components/ui";

export default function PaymentsScreen() {
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

  if (loading) {
    return (
      <AppScreen>
        <AppHeader title="Payments" onBack={() => router.back()} />
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
      <AppHeader title="Payments" subtitle="Your payment history" onBack={() => router.back()} />

      {payments.length === 0 ? (
        <AppEmptyState
          emoji="💳"
          title="No payments yet"
          description="Your payment history will appear here once you have transactions."
        />
      ) : (
        <View style={{ gap: 14 }}>
          {payments.map((item) => {
            const tone =
              item.status === "PAID" || item.status === "SUCCESS" || item.status === "COMPLETED"
                ? "success"
                : item.status === "FAILED"
                  ? "danger"
                  : "warning";
            return (
              <AppCard key={item.id}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View>
                    <AppText style={{ fontSize: 22, fontWeight: "900" }}>₹{item.amount}</AppText>
                    <AppText variant="caption" color="textSecondary" style={{ marginTop: 4 }}>
                      {item.method || "UPI"}
                    </AppText>
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
      )}
    </AppScreen>
  );
}
