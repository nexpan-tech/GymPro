import { useEffect, useMemo, useState, type ReactNode } from "react";
import { IndianRupee, FileText, CheckCircle2, Crown } from "lucide-react";
import Page from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/common/EmptyState";
import { invoiceService, type Invoice } from "@/services/invoice.service";
import { billingService, type GymSubscription } from "@/services/billing.service";

const inr = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [subscription, setSubscription] = useState<GymSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      invoiceService.listForGym().catch(() => [] as Invoice[]),
      billingService.getMySubscription().catch(() => null),
    ])
      .then(([inv, sub]) => {
        if (!active) return;
        setInvoices(inv);
        setSubscription(sub);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const paid = invoices.filter((i) => i.status === "PAID");
    const revenue = paid.reduce((s, i) => s + i.totalAmount, 0);
    const gst = paid.reduce((s, i) => s + i.gstAmount, 0);
    return { revenue, gst, count: invoices.length, paid: paid.length };
  }, [invoices]);

  return (
    <Page title="Billing" description="Member billing — invoices, GST, and your GymPro subscription.">
      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height="h-24" />)}</div>
      ) : (
        <div className="space-y-6">
          {/* Revenue cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Invoiced Revenue" value={inr(stats.revenue)} icon={<IndianRupee className="h-5 w-5" />} />
            <Stat label="GST Collected" value={inr(stats.gst)} icon={<FileText className="h-5 w-5" />} />
            <Stat label="Invoices" value={String(stats.count)} icon={<FileText className="h-5 w-5" />} />
            <Stat label="Paid" value={String(stats.paid)} icon={<CheckCircle2 className="h-5 w-5" />} tone="neutral" />
          </div>

          {/* SaaS subscription status */}
          <Card variant="solid" className="p-5">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-(--text-primary)">GymPro Subscription</h3>
            </div>
            {subscription ? (
              <div className="mt-3 flex flex-wrap items-center gap-6 text-sm">
                <div><span className="text-(--text-secondary)">Plan: </span><strong>{subscription.plan?.name}</strong></div>
                <Badge variant={subscription.status === "ACTIVE" ? "success" : subscription.status === "TRIALING" ? "info" : "danger"}>{subscription.status}</Badge>
                <div className="text-(--text-secondary)">Renews {new Date(subscription.endDate).toLocaleDateString()}</div>
                <div className="text-(--text-secondary)">Auto-renew: {subscription.autoRenew ? "On" : "Off"}</div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-(--text-secondary)">No active GymPro subscription.</p>
            )}
          </Card>

          {/* Member invoices */}
          {invoices.length === 0 ? (
            <EmptyState icon={<FileText className="h-7 w-7" />} title="No invoices yet" message="Member invoices appear here as payments are recorded." />
          ) : (
            <Card variant="solid" className="overflow-hidden p-0">
              <div className="border-b border-border px-5 py-3 text-sm font-semibold text-(--text-primary)">Member Invoices</div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border text-xs uppercase tracking-wide text-(--text-secondary)">
                    <tr>
                      <th className="px-4 py-2 font-medium">Invoice #</th>
                      <th className="px-4 py-2 font-medium">Member</th>
                      <th className="px-4 py-2 font-medium">Subtotal</th>
                      <th className="px-4 py-2 font-medium">GST</th>
                      <th className="px-4 py-2 font-medium">Total</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {invoices.map((i) => (
                      <tr key={i.id}>
                        <td className="px-4 py-2 font-medium text-(--text-primary)">{i.invoiceNumber}</td>
                        <td className="px-4 py-2 text-(--text-secondary)">{i.member?.user?.name ?? i.customerName}</td>
                        <td className="px-4 py-2">{inr(i.subtotal)}</td>
                        <td className="px-4 py-2 text-(--text-secondary)">{inr(i.gstAmount)}</td>
                        <td className="px-4 py-2 font-semibold">{inr(i.totalAmount)}</td>
                        <td className="px-4 py-2"><Badge variant={i.status === "PAID" ? "success" : "info"}>{i.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </Page>
  );
}

function Stat({ label, value, icon, tone }: { label: string; value: string; icon: ReactNode; tone?: "neutral" }) {
  return (
    <Card variant="solid" className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-(--text-secondary)">{label}</span>
        <span className={tone === "neutral" ? "text-muted-foreground" : "text-primary"}>{icon}</span>
      </div>
      <div className="mt-2 text-2xl font-bold text-(--text-primary)">{value}</div>
    </Card>
  );
}
