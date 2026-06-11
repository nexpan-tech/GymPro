import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, IndianRupee, CheckCircle2, Clock, AlertCircle, RefreshCw } from "lucide-react";
import PaymentsTable from "@/components/tables/PaymentsTable";
import {
  CommandHero,
  Highlight,
  MetricCard,
  SectionHeader,
  EmptyMomentumState,
} from "@/components/premium";
import { paymentService } from "@/services/payment.service";
import type { Payment } from "@/types/payment.types";

const inr = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const filteredPayments = useMemo(() => {
    const q = search.toLowerCase();
    return payments.filter((payment) => {
      const method = payment.method?.toLowerCase() ?? "";
      const status = payment.status?.toLowerCase() ?? "";
      const amountStr = payment.amount?.toString() ?? "";
      return method.includes(q) || status.includes(q) || amountStr.includes(q);
    });
  }, [search, payments]);

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await paymentService.list();
      const data = res.data?.payments ?? [];
      setPayments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load payments:", error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPayments();
  }, [loadPayments]);

  // ── Derived revenue metrics (display-only; no logic changed) ────────────────
  const totalRevenue = filteredPayments.reduce(
    (sum, payment) => (payment.status === "PAID" ? sum + payment.amount : sum),
    0
  );
  const pendingAmount = filteredPayments.reduce(
    (sum, payment) => (payment.status === "PENDING" ? sum + payment.amount : sum),
    0
  );
  const paidCount = filteredPayments.filter((p) => p.status === "PAID").length;
  const pendingCount = filteredPayments.filter((p) => p.status === "PENDING").length;
  const collectionRate =
    paidCount + pendingCount > 0
      ? Math.round((paidCount / (paidCount + pendingCount)) * 100)
      : 0;

  return (
    <div className="space-y-8">
      {/* ── Revenue Command Center hero ─────────────────────────────────────── */}
      <CommandHero
        eyebrow="Revenue Command Center"
        title={
          <>
            Every rupee, <Highlight>accounted for.</Highlight>
          </>
        }
        subtitle="Track collections, chase dues, and keep your cash flow strong — all in one place."
        stats={[
          { label: "Collected", value: loading ? "—" : inr(totalRevenue) },
          { label: "Collection rate", value: loading ? "—" : `${collectionRate}%` },
        ]}
        actions={
          <button
            onClick={() => void loadPayments()}
            className="press inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/8 px-4 py-2 text-xs font-bold text-white/85 transition-colors hover:bg-white/15 hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        }
      />

      {/* ── KPI row ─────────────────────────────────────────────────────────── */}
      <div className="grid gap-5 stagger sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Collected"
          value={loading ? "—" : inr(totalRevenue)}
          icon={<IndianRupee />}
          tone="energy"
          loading={loading}
        />
        <MetricCard
          label="Paid Payments"
          value={loading ? "—" : paidCount.toLocaleString("en-IN")}
          icon={<CheckCircle2 />}
          tone="neutral"
          changeLabel="settled"
          loading={loading}
        />
        <MetricCard
          label="Pending Payments"
          value={loading ? "—" : pendingCount.toLocaleString("en-IN")}
          icon={<Clock />}
          tone="neutral"
          changeLabel="awaiting collection"
          loading={loading}
        />
        <MetricCard
          label="Outstanding Dues"
          value={loading ? "—" : inr(pendingAmount)}
          icon={<AlertCircle />}
          tone={pendingAmount > 0 ? "energy" : "neutral"}
          changeLabel={pendingAmount > 0 ? "Requires follow-up" : "All clear"}
          trend={pendingAmount > 0 ? "down" : "flat"}
          loading={loading}
        />
      </div>

      {/* ── Transactions ────────────────────────────────────────────────────── */}
      <div>
        <SectionHeader
          eyebrow="Transactions"
          title="Collections ledger"
          action={
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--text-muted)" />
              <input
                type="text"
                placeholder="Search by amount, method, or status…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-64 rounded-xl border border-border bg-(--surface-solid) pl-9 pr-3 text-sm text-(--text-primary) outline-none transition-colors placeholder:text-(--text-muted) focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
              />
            </div>
          }
        />

        {loading ? (
          <div className="surface-card p-10 text-center text-sm text-(--text-muted)">
            Loading collections…
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="surface-card">
            <EmptyMomentumState
              icon={<IndianRupee />}
              title="Your revenue story starts here"
              description="Record a payment or let members pay online — every transaction will flow into this ledger."
            />
          </div>
        ) : (
          <PaymentsTable payments={filteredPayments} />
        )}
      </div>
    </div>
  );
}
