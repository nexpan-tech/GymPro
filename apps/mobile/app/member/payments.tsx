import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AppCard from "../../src/components/AppCard";
import {
  paymentService,
  type Payment,
} from "../../src/services/payment.service";

export default function PaymentsScreen() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPayments = useCallback(async () => {
    try {
      const data = await paymentService.getMyPayments();
      setPayments(data);
    } catch (error) {
      console.log(error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#818cf8" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Header />

      <View style={{ gap: 14 }}>
        {payments.map((item) => (
          <AppCard key={item.id}>
            <View style={styles.row}>
              <View>
                <Text style={styles.amount}>₹{item.amount}</Text>
                <Text style={styles.method}>
                  {item.method || "UPI"}
                </Text>
              </View>

              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.status}>{item.status}</Text>

                <Text style={styles.date}>
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString()
                    : ""}
                </Text>
              </View>
            </View>
          </AppCard>
        ))}
      </View>
    </ScrollView>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backButton}
      >
        <ArrowLeft color="#fff" size={22} />
      </TouchableOpacity>

      <View>
        <Text style={styles.title}>Payments</Text>
        <Text style={styles.subtitle}>Your payment history</Text>
      </View>
    </View>
  );
}

const styles = {
  screen: { flex: 1, backgroundColor: "#020617" },
  content: { padding: 20, paddingTop: 64 },
  center: {
    flex: 1,
    backgroundColor: "#020617",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 14,
    marginBottom: 24,
  },
  backButton: {
    height: 44,
    width: 44,
    borderRadius: 16,
    backgroundColor: "#0f172a",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900" as const,
  },
  subtitle: {
    color: "#94a3b8",
  },
  row: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  amount: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900" as const,
  },
  method: {
    color: "#94a3b8",
    marginTop: 4,
  },
  status: {
    color: "#34d399",
    fontWeight: "800" as const,
  },
  date: {
    color: "#94a3b8",
    marginTop: 4,
  },
};