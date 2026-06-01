import { router } from "expo-router";
import { Crown } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";

import {
  membershipService,
  type Membership,
} from "../../src/services/membership.service";
import { useTheme } from "../../src/theme";
import {
  AppBadge,
  AppCard,
  AppHeader,
  AppLoadingState,
  AppScreen,
  AppText,
} from "../../src/components/ui";

export default function MembershipScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

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
      <AppScreen>
        <AppHeader title="Membership" onBack={() => router.back()} />
        <AppLoadingState rows={1} />
      </AppScreen>
    );
  }

  const statusTone =
    membership?.status === "ACTIVE"
      ? "success"
      : membership?.status === "EXPIRED"
        ? "danger"
        : "warning";

  return (
    <AppScreen>
      <AppHeader title="Membership" subtitle="Your active subscription" onBack={() => router.back()} />

      <AppCard variant="elevated">
        <View style={{ alignItems: "center", marginBottom: 24, gap: 12 }}>
          <View
            style={{
              height: 70,
              width: 70,
              borderRadius: theme.radius.xl,
              backgroundColor: c.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Crown color="#fff" size={28} />
          </View>
          <AppText variant="title">{membership?.name || "No active plan"}</AppText>
          <AppBadge label={membership?.status || "UNKNOWN"} tone={statusTone} />
        </View>

        <Row label="Price" value={`₹${membership?.price ?? 0}`} />
        <Row label="Duration" value={`${membership?.durationInDays ?? 0} Days`} />
        <Row
          label="Expires"
          value={
            membership?.endDate ? new Date(membership.endDate).toLocaleDateString() : "N/A"
          }
        />
      </AppCard>
    </AppScreen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 16,
      }}
    >
      <AppText variant="bodyStrong" color="textSecondary">
        {label}
      </AppText>
      <AppText variant="bodyStrong">{value}</AppText>
    </View>
  );
}
