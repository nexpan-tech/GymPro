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
  AppButton,
  AppCard,
  AppHeader,
  AppLoadingState,
  AppScreen,
  AppText,
} from "../../src/components/ui";

function toneFor(status?: string) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "EXPIRED" || status === "CANCELLED") return "danger" as const;
  return "warning" as const;
}

function planLabel(m?: Membership | null) {
  return m?.planRef?.name ?? m?.plan ?? "No active plan";
}

function fmt(d?: string) {
  return d ? new Date(d).toLocaleDateString() : "—";
}

/** Derive a human renewal status from the live membership state. */
function renewalStatus(m?: Membership | null) {
  const status = m?.effectiveStatus ?? m?.status;
  if (!m || status === "EXPIRED" || status === "CANCELLED") return "Renewal due";
  const days = m.daysRemaining ?? 0;
  if (status === "FROZEN") return "Frozen";
  if (days <= 7) return "Renew now";
  if (days <= 30) return "Renew soon";
  return "Up to date";
}

export default function MembershipScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [current, setCurrent] = useState<Membership | null>(null);
  const [history, setHistory] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMembership = useCallback(async () => {
    try {
      const { current: cur, history: hist } = await membershipService.getMy();
      setCurrent(cur);
      setHistory(hist);
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

  const status = current?.effectiveStatus ?? current?.status;
  const isActive = status === "ACTIVE";

  return (
    <AppScreen>
      <AppHeader
        title="Membership"
        subtitle="Your plan & status"
        onBack={() => router.back()}
      />

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
          <AppText variant="title">{planLabel(current)}</AppText>
          <AppBadge label={status ?? "NONE"} tone={toneFor(status)} />
        </View>

        {current ? (
          <>
            <Row label="Status" value={isActive ? "Active" : (status ?? "—")} />
            <Row label="Start date" value={fmt(current.startDate)} />
            <Row label="End date" value={fmt(current.endDate)} />
            <Row label="Days remaining" value={`${current.daysRemaining ?? 0} days`} />
            <Row label="Amount" value={`₹${current.amount ?? 0}`} />
            <Row label="Payment" value={current.paymentStatus ?? "—"} />
            <Row label="Renewal" value={renewalStatus(current)} />
            {status === "FROZEN" && (
              <Row
                label="Frozen"
                value={`${fmt(current.freezeStartDate ?? undefined)} → ${fmt(
                  current.freezeEndDate ?? undefined
                )}`}
              />
            )}
          </>
        ) : (
          <AppText variant="body" color="textSecondary" style={{ textAlign: "center" }}>
            You don't have a membership yet. Choose a plan to get started.
          </AppText>
        )}
      </AppCard>

      {/* Primary actions */}
      <View style={{ gap: 12 }}>
        <AppButton onPress={() => router.push("/member/renew-membership")}>
          {current ? "Renew Membership" : "Choose a Plan"}
        </AppButton>
        <AppButton variant="secondary" onPress={() => router.push("/member/payments")}>
          View Payment History
        </AppButton>
      </View>

      {history.length > 0 && (
        <View style={{ marginTop: 8, gap: 12 }}>
          <AppText variant="bodyStrong" color="textSecondary">
            History
          </AppText>
          {history.map((m) => (
            <AppCard key={m.id}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <AppText variant="bodyStrong">{planLabel(m)}</AppText>
                <AppBadge
                  label={m.effectiveStatus ?? m.status ?? "—"}
                  tone={toneFor(m.effectiveStatus ?? m.status)}
                />
              </View>
              <Row label="Period" value={`${fmt(m.startDate)} → ${fmt(m.endDate)}`} />
              <Row label="Amount" value={`₹${m.amount ?? 0}`} />
            </AppCard>
          ))}
        </View>
      )}
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
