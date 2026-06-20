import { useEffect, useMemo, useState, type ReactNode } from "react";
import { IndianRupee, FileText, CheckCircle2, Crown } from "lucide-react";
import Page from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/common/EmptyState";
import { invoiceService, type Invoice } from "@/services/invoice.service";
import { licenseService, type GymLicenseDetail } from "@/services/license.service";

const inr = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [license, setLicense] = useState<GymLicenseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      invoiceService.listForGym().catch(() => [] as Invoice[]),
      licenseService.myLicense().catch(() => null),
    ])
      .then(([inv, lic]) => {
        if (!active) return;
        setInvoices(inv);
        setLicense(lic);
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

          {/* GymPro License (read-only) */}
          <Card variant="solid" className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-(--text-primary)">GymPro License</h3>
              </div>
              {license?.license && (
                <Badge variant={license.license.status === "ACTIVE" ? "success" : license.license.status === "TRIALING" ? "info" : "danger"}>
                  {license.license.isTrial ? "TRIAL" : license.license.status}
                </Badge>
              )}
            </div>
            {license?.license ? (
              <div className="mt-3 space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-lg font-bold text-(--text-primary)">{license.license.name}</p>
                  <p className="text-sm font-semibold text-(--text-primary)">{inr(license.license.monthlyPrice)}<span className="text-xs font-normal text-(--text-secondary)">/{license.license.interval === "YEARLY" ? "yr" : "mo"}</span></p>
                </div>
                {/* Capacity utilization */}
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-(--text-secondary)">{license.usage.activeMembers} / {license.usage.capacity ?? "∞"} active members</span>
                    <span className="font-semibold text-(--text-primary)">{license.usage.utilizationPct}% · {license.usage.tierMessage}</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-(--surface-secondary)">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, license.usage.utilizationPct)}%`, background: license.usage.utilizationPct >= 90 ? "var(--flame)" : license.usage.utilizationPct >= 80 ? "var(--accent, var(--flame))" : "var(--success)" }} />
                  </div>
                </div>
                {/* Branch + staff usage */}
                {(license.usage.branches || license.usage.staff) && (
                  <div className="grid grid-cols-2 gap-4">
                    {license.usage.branches && (
                      <div>
                        <div className="mb-1 flex items-center justify-between text-xs"><span className="text-(--text-secondary)">Branches</span><span className="font-semibold text-(--text-primary)">{license.usage.branches.used} / {license.usage.branches.capacity ?? "∞"}</span></div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-(--surface-secondary)"><div className="h-full rounded-full" style={{ width: `${license.usage.branches.capacity ? Math.min(100, license.usage.branches.utilizationPct) : 4}%`, background: license.usage.branches.utilizationPct >= 90 ? "var(--flame)" : "var(--success)" }} /></div>
                      </div>
                    )}
                    {license.usage.staff && (
                      <div>
                        <div className="mb-1 flex items-center justify-between text-xs"><span className="text-(--text-secondary)">Staff</span><span className="font-semibold text-(--text-primary)">{license.usage.staff.used} / {license.usage.staff.capacity ?? "∞"}</span></div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-(--surface-secondary)"><div className="h-full rounded-full" style={{ width: `${license.usage.staff.capacity ? Math.min(100, license.usage.staff.utilizationPct) : 4}%`, background: license.usage.staff.utilizationPct >= 90 ? "var(--flame)" : "var(--success)" }} /></div>
                      </div>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
                  <div><span className="text-(--text-secondary)">Remaining: </span><strong className="text-(--text-primary)">{license.usage.remaining ?? "∞"}</strong></div>
                  <div><span className="text-(--text-secondary)">Renews: </span><strong className="text-(--text-primary)">{fmtDate(license.license.renewalDate)}</strong></div>
                  <div><span className="text-(--text-secondary)">Billing: </span><strong className="text-(--text-primary)">{license.billing.billingStatus}</strong></div>
                  <div><span className="text-(--text-secondary)">Next: </span><strong className="text-(--text-primary)">{inr(license.billing.nextInvoiceTotal)}</strong></div>
                </div>
                {license.usage.tier !== "HEALTHY" && (
                  <p className="rounded-xl bg-(--surface-secondary) p-3 text-xs text-(--text-secondary)">
                    {license.usage.tier === "FULL"
                      ? "Your license is full — contact GymPro to upgrade and activate more members."
                      : "You're approaching your licensed capacity. Contact GymPro to upgrade your plan."}
                  </p>
                )}
                <p className="text-xs text-(--text-muted)">License changes are managed by GymPro. Contact support to upgrade.</p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-(--text-secondary)">No GymPro license assigned yet. Contact GymPro to activate your plan.</p>
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
