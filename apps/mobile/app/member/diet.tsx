import { router } from "expo-router";
import { ArrowLeft, Salad } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AppCard from "../../src/components/AppCard";
import { dietService, type DietPlan } from "../../src/services/diet.service";
import { memberService } from "../../src/services/member.service";
import type { Member } from "../../src/types/member.types";

const days = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export default function DietScreen() {
  const [member, setMember] = useState<Member | null>(null);
  const [plan, setPlan] = useState<DietPlan | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPlan = useCallback(async () => {
    try {
      const profile = await memberService.getMyProfile();
      setMember(profile);

      if (profile?.id) {
        const data = await dietService.getByMember(profile.id);
        setPlan(data);
      }
    } catch (error) {
      console.log("Diet load failed", error);
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlan();
  }, [loadPlan]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#818cf8" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Header title="Diet Plan" subtitle="Your weekly nutrition schedule" />

      <AppCard style={{ marginBottom: 20 }}>
        <View style={styles.heroRow}>
          <View style={styles.heroIcon}>
            <Salad color="#fff" size={28} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.heroLabel}>Nutrition Goal</Text>
            <Text style={styles.heroTitle}>
              {plan?.goal || member?.fitnessGoal || "No goal assigned"}
            </Text>
          </View>
        </View>

        {plan?.notes && <Text style={styles.notes}>{plan.notes}</Text>}
      </AppCard>

      <View style={{ gap: 12 }}>
        {days.map((day) => (
          <AppCard key={day}>
            <Text style={styles.dayTitle}>
              {day.charAt(0).toUpperCase() + day.slice(1)}
            </Text>
            <Text style={styles.dayText}>
              {plan?.[day] || "No diet assigned"}
            </Text>
          </AppCard>
        ))}
      </View>
    </ScrollView>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <ArrowLeft color="#f8fafc" size={22} />
      </TouchableOpacity>

      <View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = {
  screen: { flex: 1, backgroundColor: "#020617" },
  content: { padding: 20, paddingTop: 64, paddingBottom: 40 },
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
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.18)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  title: { color: "#f8fafc", fontSize: 28, fontWeight: "900" as const },
  subtitle: { color: "#94a3b8", marginTop: 4 },
  heroRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 16,
  },
  heroIcon: {
    height: 58,
    width: 58,
    borderRadius: 22,
    backgroundColor: "#059669",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  heroLabel: { color: "#94a3b8", fontWeight: "700" as const },
  heroTitle: {
    color: "#f8fafc",
    fontSize: 22,
    fontWeight: "900" as const,
    marginTop: 4,
  },
  notes: {
    color: "#94a3b8",
    lineHeight: 22,
    marginTop: 16,
  },
  dayTitle: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "900" as const,
    marginBottom: 8,
  },
  dayText: {
    color: "#94a3b8",
    lineHeight: 22,
  },
};