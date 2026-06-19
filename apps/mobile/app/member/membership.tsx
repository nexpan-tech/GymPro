import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { CheckCircle2, Crown, Dumbbell, Salad, Snowflake, Sparkles, TrendingUp, Trophy } from "lucide-react-native";
import { type ReactNode, useCallback, useEffect, useState } from "react";
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
  ProgressBar,
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

function renewalStatus(m?: Membership | null) {
  const status = m?.effectiveStatus ?? m?.status;
  if (!m || status === "EXPIRED" || status === "CANCELLED") return "Renewal due";
  const days = m.daysRemaining ?? 0;
  if (status === "FROZEN") return "Frozen";
  if (days <= 7) return "Renew now";
  if (days <= 30) return "Renew soon";
  return "Up to date";
}

function periodProgress(m?: Membership | null) {
  if (!m?.startDate || !m?.endDate) return 0;
  const s = new Date(m.startDate).getTime();
  const e = new Date(m.endDate).getTime();
  if (e <= s) return 1;
  return Math.min(1, Math.max(0, (Date.now() - s) / (e - s)));
}

const BENEFITS: { icon: (c: string) => ReactNode; label: string }[] = [
  { icon: (c) => <Dumbbell color={c} size={16} />, label: "Full gym & equipment access" },
  { icon: (c) => <Salad color={c} size={16} />, label: "Personal workout & diet plans" },
  { icon: (c) => <TrendingUp color={c} size={16} />, label: "Progress & attendance tracking" },
  { icon: (c) => <Trophy color={c} size={16} />, label: "Rewards, challenges & community" },
];

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
  const days = current?.daysRemaining ?? 0;
  const remaining = 1 - periodProgress(current);
  // Every membership (current + past) that has a recorded freeze window.
  const freezeHistory = [...(current ? [current] : []), ...history].filter((m) => m.freezeStartDate);

  const confidence = !current
    ? "Choose a plan to unlock everything GymPro has to offer."
    : days <= 7
      ? "Your membership ends soon — renew now to keep your access and streak alive."
      : days <= 30
        ? "Renewing early keeps your momentum unbroken. You've got this."
        : "You're all set. Keep showing up and making every session count.";

  return (
    <AppScreen>
      <AppHeader
        title="Membership"
        subtitle="Your premium plan"
        onBack={() => router.back()}
      />

      {/* ── Premium membership card ─────────────────────────────────────────── */}
      <LinearGradient
        colors={["#1a1a1a", "#010000"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: theme.radius.xl,
          padding: theme.spacing.lg,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.1)",
          overflow: "hidden",
        }}
      >
        <View
          style={{
            position: "absolute",
            top: -50,
            right: -40,
            height: 150,
            width: 150,
            borderRadius: 999,
            backgroundColor: c.primary,
            opacity: 0.22,
          }}
        />
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Crown color={c.primary} size={18} />
            <AppText variant="overline" style={{ color: "rgba(255,255,255,0.6)", letterSpacing: 1.5 }}>
              GymPro Membership
            </AppText>
          </View>
          <AppBadge label={status ?? "NONE"} tone={toneFor(status)} />
        </View>

        <AppText style={{ fontSize: 26, fontWeight: "900", color: "#FFFFFF", marginTop: 14 }}>
          {planLabel(current)}
        </AppText>

        {current ? (
          <>
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8, marginTop: 16 }}>
              <AppText style={{ fontSize: 40, fontWeight: "900", color: c.primary, letterSpacing: -1.5 }}>
                {days}
              </AppText>
              <AppText variant="body" style={{ color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>
                day{days === 1 ? "" : "s"} remaining
              </AppText>
            </View>
            <View style={{ marginTop: 12 }}>
              <ProgressBar progress={remaining} track="rgba(255,255,255,0.14)" />
            </View>
            <AppText variant="caption" style={{ color: "rgba(255,255,255,0.5)", marginTop: 8 }}>
              {fmt(current.startDate)} → {fmt(current.endDate)} · {renewalStatus(current)}
            </AppText>
          </>
        ) : (
          <AppText variant="body" style={{ color: "rgba(255,255,255,0.7)", marginTop: 12 }}>
            You don't have an active membership yet.
          </AppText>
        )}
      </LinearGradient>

      {/* ── Renewal confidence ──────────────────────────────────────────────── */}
      <AppCard>
        <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
          <View
            style={{
              height: 40,
              width: 40,
              borderRadius: theme.radius.md,
              backgroundColor: c.primarySoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkles color={c.primary} size={18} />
          </View>
          <AppText variant="body" color="textSecondary" style={{ flex: 1, lineHeight: 20 }}>
            {confidence}
          </AppText>
        </View>
      </AppCard>

      {/* Primary actions */}
      <View style={{ gap: 12 }}>
        <AppButton onPress={() => router.push("/member/renew-membership")}>
          {current ? "Renew Membership" : "Choose a Plan"}
        </AppButton>
        <AppButton variant="secondary" onPress={() => router.push("/member/payments")}>
          View Wallet
        </AppButton>
      </View>

      {/* ── Benefits ────────────────────────────────────────────────────────── */}
      <AppCard>
        <AppText variant="heading" style={{ marginBottom: 12 }}>What's included</AppText>
        <View style={{ gap: 12 }}>
          {BENEFITS.map((b, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View
                style={{
                  height: 32,
                  width: 32,
                  borderRadius: theme.radius.sm,
                  backgroundColor: c.primarySoft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {b.icon(c.primary)}
              </View>
              <AppText variant="body" style={{ flex: 1 }}>{b.label}</AppText>
              <CheckCircle2 color={c.primary} size={16} />
            </View>
          ))}
        </View>
      </AppCard>

      {/* Details */}
      {current ? (
        <AppCard>
          <AppText variant="heading" style={{ marginBottom: 12 }}>Plan details</AppText>
          <Row label="Status" value={isActive ? "Active" : (status ?? "—")} />
          <Row label="Amount" value={`₹${current.amount ?? 0}`} />
          <Row label="Payment" value={current.paymentStatus ?? "—"} />
          {status === "FROZEN" && (
            <Row
              label="Frozen"
              value={`${fmt(current.freezeStartDate ?? undefined)} → ${fmt(current.freezeEndDate ?? undefined)}`}
            />
          )}
        </AppCard>
      ) : null}

      {/* Freeze history — every membership that was frozen */}
      {freezeHistory.length > 0 && (
        <View style={{ marginTop: 4, gap: 12 }}>
          <AppText variant="heading">Freeze history</AppText>
          {freezeHistory.map((m) => (
            <AppCard key={`fz-${m.id}`}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Snowflake color={c.primary} size={16} />
                <AppText variant="bodyStrong" style={{ flex: 1 }}>{planLabel(m)}</AppText>
              </View>
              <Row label="Frozen" value={`${fmt(m.freezeStartDate ?? undefined)} → ${fmt(m.freezeEndDate ?? undefined)}`} />
            </AppCard>
          ))}
        </View>
      )}

      {/* Membership history timeline */}
      {history.length > 0 && (
        <View style={{ marginTop: 4, gap: 12 }}>
          <AppText variant="heading">History</AppText>
          {history.map((m, i) => (
            <View key={m.id} style={{ flexDirection: "row", gap: 12 }}>
              {/* timeline rail */}
              <View style={{ alignItems: "center", width: 14 }}>
                <View style={{ height: 12, width: 12, borderRadius: 6, backgroundColor: c.primary, marginTop: 6 }} />
                {i < history.length - 1 ? <View style={{ flex: 1, width: 2, backgroundColor: c.border, marginTop: 2 }} /> : null}
              </View>
              <AppCard style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <AppText variant="bodyStrong">{planLabel(m)}</AppText>
                  <AppBadge label={m.effectiveStatus ?? m.status ?? "—"} tone={toneFor(m.effectiveStatus ?? m.status)} />
                </View>
                <Row label="Period" value={`${fmt(m.startDate)} → ${fmt(m.endDate)}`} />
                <Row label="Amount" value={`₹${m.amount ?? 0}`} />
                <Row label="Payment" value={m.paymentStatus ?? "—"} />
              </AppCard>
            </View>
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
        marginBottom: 12,
      }}
    >
      <AppText variant="bodyStrong" color="textSecondary">
        {label}
      </AppText>
      <AppText variant="bodyStrong">{value}</AppText>
    </View>
  );
}
