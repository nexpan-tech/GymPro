import { router } from "expo-router";
import { ArrowLeft, Crown } from "lucide-react-native";
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
  membershipService,
  type Membership,
} from "../../src/services/membership.service";

export default function MembershipScreen() {
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMembership = useCallback(async () => {
    try {
      const data = await membershipService.getMyMembership();
      setMembership(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMembership();
  }, [loadMembership]);

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

      <AppCard>
        <View style={styles.hero}>
          <View style={styles.icon}>
            <Crown color="#fff" size={28} />
          </View>

          <Text style={styles.planName}>
            {membership?.name || "Gold Membership"}
          </Text>

          <Text style={styles.status}>
            {membership?.status || "ACTIVE"}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Price</Text>
          <Text style={styles.value}>₹{membership?.price || 0}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Duration</Text>
          <Text style={styles.value}>
            {membership?.durationInDays || 0} Days
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Expires</Text>
          <Text style={styles.value}>
            {membership?.endDate
              ? new Date(membership.endDate).toLocaleDateString()
              : "N/A"}
          </Text>
        </View>
      </AppCard>
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
        <Text style={styles.title}>Membership</Text>
        <Text style={styles.subtitle}>Your active subscription</Text>
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
  hero: {
    alignItems: "center" as const,
    marginBottom: 28,
  },
  icon: {
    height: 70,
    width: 70,
    borderRadius: 24,
    backgroundColor: "#4f46e5",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 18,
  },
  planName: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900" as const,
  },
  status: {
    color: "#34d399",
    marginTop: 6,
    fontWeight: "800" as const,
  },
  row: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    marginBottom: 18,
  },
  label: {
    color: "#94a3b8",
    fontWeight: "700" as const,
  },
  value: {
    color: "#fff",
    fontWeight: "900" as const,
  },
};