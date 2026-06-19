import { useCallback, useEffect, useMemo, useState } from "react";
import { IndianRupee, FileText, RefreshCw, CheckCircle2, XCircle, TrendingUp } from "lucide-react";
import Page from "@/components/ui/Page";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatTile, SectionHeader, StatusPill, type StatusTone, EmptyMomentumState } from "@/components/premium";
import { useToast } from "@/hooks/useToast";
import {
  superAdminService,
  type SubscriptionRow,
  type SaaSInvoiceRow,
} from "@/services/superAdmin.service";

const inr = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function statusTone(s: string): StatusTone {
  switch (s) {
    case "PAID": return "completed";
    case "SENT": return "active";
    case "PENDING": case "NOT_BILLED": return "pending";
    case "OVERDUE": case "FAILED": return "expired";
    default: return "neutral";
  }
}

type Tab = "subscriptions" | "invoices";

export default function SuperAdminBillingPage() {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("subscriptions");
  const [month, setMonth] = useState(currentMonth());
  const [summary, setSummary] = useState<{ mrr: number; arr: number; paid: number; pending: number; overdue: number } | null>(null);
  const [subs, setSubs] = useState<SubscriptionRow[]>([]);
  const [invoices, setInvoices] = useState<SaaSInvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, sub, inv] = await Promise.all([
        superAdminService.getBillingSummary(),
        superAdminService.getSubscriptions(),
        superAdminService.listInvoices(),
      ]);
      setSummary(s); setSubs(sub); setInvoices(inv);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load billing data.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { void load(); }, [load]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await superAdminService.generateInvoices(month);
      toast.success(`${res.created} invoice(s) generated for ${res.billingMonth} · ${inr(res.totalBilled)} billed${res.skipped ? ` · ${res.skipped} skipped` : ""}.`);
      await load();
      setTab("invoices");
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to generate invoices.");
    } finally {
      setGenerating(false);
    }
  }

  async function handlePay(inv: SaaSInvoiceRow) {
    setBusyId(inv.id);
    try {
      await superAdminService.recordPayment(inv.id);
      toast.success(`Payment recorded for ${inv.invoiceNumber}.`);
      await load();
    } catch {
      toast.error("Failed to record payment.");
    } finally {
      setBusyId(null);
    }
  }

  async function handlePdf(inv: SaaSInvoiceRow) {
    try {
      await superAdminService.downloadInvoicePdf(inv.id, inv.invoiceNumber);
    } catch {
      toast.error("Failed to download invoice PDF.");
    }
  }

  async function handleCancel(inv: SaaSInvoiceRow) {
    setBusyId(inv.id);
    try {
      await superAdminService.cancelInvoice(inv.id);
      toast.success(`Invoice ${inv.invoiceNumber} cancelled.`);
      await load();
    } catch {
      toast.error("Failed to cancel invoice.");
    } finally {
      setBusyId(null);
    }
  }

  const visibleInvoices = useMemo(
    () => invoices.filter((i) => !month || i.billingMonth === month || i.billingMonth == null),
    [invoices, month],
  );

  return (
    <Page
      title="SaaS Billing"
      eyebrow="Revenue Command Center"
      description="Per-active-member SaaS billing across every gym — generate GST invoices and record settlements."
      action={
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="eyebrow mb-1 block">Billing month</label>
            <input
              type="month"
              value={month}
              max={currentMonth()}
              onChange={(e) => setMonth(e.target.value)}
              className="h-10 rounded-xl border border-border bg-(--surface-solid) px-3 text-sm text-(--text-primary) outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
            />
          </div>
          <Button iconLeft={<FileText className="h-4 w-4" />} loading={generating} onClick={() => void handleGenerate()}>
            Generate invoices
          </Button>
          <Button variant="secondary" iconLeft={<RefreshCw className="h-4 w-4" />} onClick={() => void load()}>Refresh</Button>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Revenue summary (real) */}
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-5">
          <StatTile label="MRR (per-member)" value={loading ? "—" : inr(summary?.mrr ?? 0)} icon={<IndianRupee />} tone="energy" />
          <StatTile label="ARR" value={loading ? "—" : inr(summary?.arr ?? 0)} icon={<TrendingUp />} tone="neutral" />
          <StatTile label="Paid" value={loading ? "—" : inr(summary?.paid ?? 0)} icon={<CheckCircle2 />} tone="neutral" />
          <StatTile label="Pending" value={loading ? "—" : inr(summary?.pending ?? 0)} icon={<FileText />} tone="neutral" />
          <StatTile label="Overdue" value={loading ? "—" : inr(summary?.overdue ?? 0)} icon={<XCircle />} tone={(summary?.overdue ?? 0) > 0 ? "energy" : "neutral"} />
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <Button size="sm" variant={tab === "subscriptions" ? "primary" : "secondary"} onClick={() => setTab("subscriptions")}>Subscriptions</Button>
          <Button size="sm" variant={tab === "invoices" ? "primary" : "secondary"} onClick={() => setTab("invoices")}>Invoices</Button>
        </div>

        {loading ? (
          <div className="surface-card p-4"><div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height="h-12" />)}</div></div>
        ) : tab === "subscriptions" ? (
          subs.length === 0 ? (
            <div className="surface-card"><EmptyMomentumState icon={<IndianRupee />} title="No gyms to bill yet" description="Create gyms and set their per-member price to see SaaS subscriptions here." /></div>
          ) : (
            <div className="surface-card overflow-hidden p-0">
              <SectionHeader eyebrow="Every gym" title="Subscriptions" className="px-5 pt-5" />
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-(--surface-secondary) text-xs uppercase tracking-wide text-(--text-muted)">
                    <tr>
                      <th className="px-5 py-3 font-bold">Gym</th>
                      <th className="px-5 py-3 font-bold">Active members</th>
                      <th className="px-5 py-3 font-bold">₹ / member</th>
                      <th className="px-5 py-3 font-bold">Subtotal</th>
                      <th className="px-5 py-3 font-bold">GST</th>
                      <th className="px-5 py-3 font-bold">Monthly total</th>
                      <th className="px-5 py-3 font-bold">Status</th>
                      <th className="px-5 py-3 font-bold">Pending</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {subs.map((s) => (
                      <tr key={s.gymId} className="hover:bg-(--surface-hover)">
                        <td className="px-5 py-4">
                          <div className="font-bold text-(--text-primary)">{s.gymName}</div>
                          <div className="text-xs text-(--text-muted)">{s.ownerEmail}</div>
                        </td>
                        <td className="px-5 py-4 tabular-nums font-semibold text-(--text-primary)">{s.activeMemberCount}</td>
                        <td className="px-5 py-4 tabular-nums text-(--text-secondary)">{inr(s.pricePerActiveMember)}</td>
                        <td className="px-5 py-4 tabular-nums text-(--text-secondary)">{inr(s.subtotal)}</td>
                        <td className="px-5 py-4 tabular-nums text-(--text-secondary)">{inr(s.gstAmount)} <span className="text-(--text-muted)">({s.gstPercent}%)</span></td>
                        <td className="px-5 py-4 tabular-nums font-bold text-(--text-primary)">{inr(s.monthlyAmount)}</td>
                        <td className="px-5 py-4"><StatusPill tone={statusTone(s.billingStatus)} size="sm">{s.billingStatus.replace("_", " ")}</StatusPill></td>
                        <td className="px-5 py-4 tabular-nums text-primary">{s.pendingAmount > 0 ? inr(s.pendingAmount) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : visibleInvoices.length === 0 ? (
          <div className="surface-card"><EmptyMomentumState icon={<FileText />} title="No invoices yet" description="Pick a month and generate invoices to start billing your gyms." /></div>
        ) : (
          <div className="surface-card overflow-hidden p-0">
            <SectionHeader eyebrow="GST invoices" title="Invoices" className="px-5 pt-5" />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-(--surface-secondary) text-xs uppercase tracking-wide text-(--text-muted)">
                  <tr>
                    <th className="px-5 py-3 font-bold">Invoice</th>
                    <th className="px-5 py-3 font-bold">Gym</th>
                    <th className="px-5 py-3 font-bold">Month</th>
                    <th className="px-5 py-3 font-bold">Members</th>
                    <th className="px-5 py-3 font-bold">Subtotal + GST</th>
                    <th className="px-5 py-3 font-bold">Total</th>
                    <th className="px-5 py-3 font-bold">Status</th>
                    <th className="px-5 py-3 font-bold">Email</th>
                    <th className="px-5 py-3 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {visibleInvoices.map((i) => (
                    <tr key={i.id} className="hover:bg-(--surface-hover)">
                      <td className="px-5 py-4 font-mono text-xs text-(--text-secondary)">{i.invoiceNumber}</td>
                      <td className="px-5 py-4 font-semibold text-(--text-primary)">{i.gym?.name ?? "—"}</td>
                      <td className="px-5 py-4 text-(--text-secondary)">{i.billingMonth ?? "—"}</td>
                      <td className="px-5 py-4 tabular-nums text-(--text-secondary)">{i.activeMemberCount ?? "—"}</td>
                      <td className="px-5 py-4 tabular-nums text-(--text-secondary)">{inr(i.amount)} + {inr(i.gstAmount)}</td>
                      <td className="px-5 py-4 tabular-nums font-bold text-(--text-primary)">{inr(i.totalAmount)}</td>
                      <td className="px-5 py-4"><StatusPill tone={statusTone(i.effectiveStatus)} size="sm">{i.effectiveStatus}</StatusPill></td>
                      <td className="px-5 py-4 text-xs text-(--text-muted)">{i.emailStatus ?? "—"}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" iconLeft={<FileText className="h-3.5 w-3.5" />} onClick={() => void handlePdf(i)}>PDF</Button>
                          {i.status === "PAID" ? (
                            <span className="self-center text-xs font-semibold text-(--text-muted)">Settled</span>
                          ) : i.status === "CANCELLED" ? (
                            <span className="self-center text-xs text-(--text-muted)">Cancelled</span>
                          ) : (
                            <>
                              <Button size="sm" loading={busyId === i.id} onClick={() => void handlePay(i)}>Record payment</Button>
                              <Button size="sm" variant="ghost" onClick={() => void handleCancel(i)}>Cancel</Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}
