import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Switch, View } from "react-native";

import {
  getMyInvoices, getMyMembershipStatus,
  type Invoice, type MemberSubscription,
} from "../../src/api/invoice.api";
import { useTheme } from "../../src/theme";
import {
  AppBadge, AppCard, AppEmptyState, AppHeader,
  AppLoadingState, AppScreen, AppText,
} from "../../src/components/ui";

const inr = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export default function InvoicesScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [sub, setSub] = useState<MemberSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  // Autopay is a client-side scaffold (no backend autopay engine yet).
  const [autopay, setAutopay] = useState(false);

  const load = useCallback(async () => {
    try {
      const [inv, s] = await Promise.all([
        getMyInvoices(),
        getMyMembershipStatus().catch(() => null),
      ]);
      setInvoices(inv);
      setSub(s);
    } catch (err) {
      console.log("Invoices load failed", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return (
      <AppScreen>
        <AppHeader title="Invoices" onBack={() => router.back()} />
        <AppLoadingState rows={4} />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <AppHeader title="Invoices & Billing" subtitle="GST invoices and subscription" onBack={() => router.back()} />

      {/* Subscription status */}
      <AppCard>
        <AppText variant="label" color="textSecondary">Subscription Status</AppText>
        {sub ? (
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <View>
              <AppText variant="bodyStrong">{sub.planName ?? "Membership"}</AppText>
              {sub.endDate ? (
                <AppText variant="caption" color="textMuted">Renews {new Date(sub.endDate).toLocaleDateString()}</AppText>
              ) : null}
            </View>
            <AppBadge label={sub.status} tone={sub.status === "ACTIVE" ? "success" : "warning"} />
          </View>
        ) : (
          <AppText variant="body" color="textSecondary" style={{ marginTop: 6 }}>No active membership.</AppText>
        )}
      </AppCard>

      {/* Autopay (scaffold) */}
      <AppCard>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <AppText variant="bodyStrong">Autopay</AppText>
            <AppText variant="caption" color="textMuted">
              Automatically renew membership on expiry (coming soon).
            </AppText>
          </View>
          <Switch value={autopay} onValueChange={setAutopay} trackColor={{ true: c.primary }} />
        </View>
      </AppCard>

      {/* Invoices */}
      {invoices.length === 0 ? (
        <AppEmptyState emoji="🧾" title="No invoices" description="Your GST invoices will appear here." />
      ) : (
        <View style={{ gap: 8 }}>
          {invoices.map((i) => (
            <AppCard key={i.id}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <AppText variant="bodyStrong">{i.invoiceNumber}</AppText>
                <AppBadge label={i.status} tone={i.status === "PAID" ? "success" : "warning"} />
              </View>
              <AppText variant="caption" color="textMuted" style={{ marginTop: 4 }}>
                {new Date(i.invoiceDate).toLocaleDateString()}
              </AppText>
              <AppText variant="caption" color="textSecondary" style={{ marginTop: 6 }}>
                Subtotal {inr(i.subtotal)}  ·  {i.igst > 0 ? `IGST ${inr(i.igst)}` : `GST ${inr(i.gstAmount)}`}
              </AppText>
              <AppText variant="bodyStrong" style={{ marginTop: 4 }}>Total {inr(i.totalAmount)}</AppText>
            </AppCard>
          ))}
        </View>
      )}
    </AppScreen>
  );
}
