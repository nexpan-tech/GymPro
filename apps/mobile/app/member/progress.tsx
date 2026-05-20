import { router } from "expo-router";
import { Activity, ArrowLeft, Ruler, Scale, Target } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AppCard from "../../src/components/AppCard";
import { memberService } from "../../src/services/member.service";
import type { Member } from "../../src/types/member.types";

export default function ProgressScreen() {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProgress = useCallback(async () => {
    try {
      const profile = await memberService.getMyProfile();
      setMember(profile);
    } catch (error) {
      console.log("Progress load failed", error);
      setMember(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProgress();
  }, [loadProgress]);

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

      <View style={styles.grid}>
        <MetricCard
          icon={Scale}
          label="Weight"
          value={member?.weight ? `${member.weight} kg` : "Not set"}
          color="#2563eb"
        />
        <MetricCard
          icon={Ruler}
          label="Height"
          value={member?.height ? `${member.height} cm` : "Not set"}
          color="#7c3aed"
        />
        <MetricCard
          icon={Target}
          label="Goal"
          value={member?.fitnessGoal || "Not set"}
          color="#059669"
        />
        <MetricCard
          icon={Activity}
          label="Status"
          value="Active"
          color="#f59e0b"
        />
      </View>

      <AppCard style={{ marginTop: 20 }}>
        <Text style={styles.summaryTitle}>Progress Summary</Text>

        <Text style={styles.summaryText}>
          Your current fitness goal is{" "}
          {member?.fitnessGoal || "not set yet"}. As your trainer updates your
          stats, this page will show richer progress charts, body measurements,
          and transformation history.
        </Text>

        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>

        <Text style={styles.progressLabel}>Estimated profile completion: 68%</Text>
      </AppCard>
    </ScrollView>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <ArrowLeft color="#f8fafc" size={22} />
      </TouchableOpacity>

      <View>
        <Text style={styles.title}>Progress</Text>
        <Text style={styles.subtitle}>Track your fitness transformation</Text>
      </View>
    </View>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Scale;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <AppCard style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: color }]}>
        <Icon color="#fff" size={22} />
      </View>

      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </AppCard>
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
  title: {
    color: "#f8fafc",
    fontSize: 28,
    fontWeight: "900" as const,
  },
  subtitle: {
    color: "#94a3b8",
    marginTop: 4,
  },
  grid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 12,
    justifyContent: "space-between" as const,
  },
  metricCard: {
    width: "48%" as const,
  },
  metricIcon: {
    height: 46,
    width: 46,
    borderRadius: 18,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 14,
  },
  metricLabel: {
    color: "#94a3b8",
    fontWeight: "700" as const,
  },
  metricValue: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "900" as const,
    marginTop: 6,
  },
  summaryTitle: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "900" as const,
  },
  summaryText: {
    color: "#94a3b8",
    lineHeight: 23,
    marginTop: 10,
  },
  progressTrack: {
    height: 14,
    borderRadius: 99,
    backgroundColor: "#1e293b",
    overflow: "hidden" as const,
    marginTop: 22,
  },
  progressFill: {
    width: "68%" as const,
    height: "100%" as const,
    borderRadius: 99,
    backgroundColor: "#4f46e5",
  },
  progressLabel: {
    color: "#94a3b8",
    fontWeight: "700" as const,
    marginTop: 10,
  },
};