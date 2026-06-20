import { useCallback, useEffect, useMemo, useState } from "react";
import { IndianRupee, FileText, RefreshCw, CheckCircle2, XCircle, Gauge, ShieldAlert, ArrowUpCircle, Plus, Crown } from "lucide-react";
import Page from "@/components/ui/Page";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import Modal from "@/components/ui/Modal";
import Input from "@/components/forms/Input";
import Select from "@/components/forms/Select";
import { StatTile, SectionHeader, StatusPill, type StatusTone, EmptyMomentumState } from "@/components/premium";
import { useToast } from "@/hooks/useToast";
import { superAdminService, type SaaSInvoiceRow } from "@/services/superAdmin.service";
import { licenseService, type GymLicenseRow, type LicensePlan, type DimensionUsage } from "@/services/license.service";

function DimBar({ label, u }: { label: string; u?: DimensionUsage }) {
  const cap = u?.capacity ?? null;
  const used = u?.used ?? 0;
  const pct = u?.utilizationPct ?? 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="text-(--text-secondary)">{label}</span>
        <span className="font-semibold text-(--text-primary)">{used} / {cap ?? "∞"}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-(--surface-secondary)">
        <div className="h-full rounded-full" style={{ width: `${cap ? Math.min(100, pct) : 4}%`, background: pct >= 90 ? "var(--flame)" : pct >= 80 ? "var(--accent, var(--flame))" : "var(--success)" }} />
      </div>
    </div>
  );
}

const inr = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");

function statusTone(s: string): StatusTone {
  switch (s) {
    case "PAID": case "ACTIVE": return "completed";
    case "SENT": return "active";
    case "TRIALING": case "PENDING": case "NOT_BILLED": return "pending";
    case "OVERDUE": case "FAILED": case "PAST_DUE": case "SUSPENDED": case "CANCELLED": case "EXPIRED": return "expired";
    default: return "neutral";
  }
}

function tierTone(tier: string): StatusTone {
  switch (tier) {
    case "FULL": return "expired";
    case "UPGRADE_RECOMMENDED": return "pending";
    case "APPROACHING_CAPACITY": return "active";
    default: return "completed";
  }
}

type Tab = "licenses" | "plans" | "invoices";

export default function SuperAdminLicensePage() {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("licenses");
  const [month, setMonth] = useState(currentMonth());
  const [licenses, setLicenses] = useState<GymLicenseRow[]>([]);
  const [plans, setPlans] = useState<LicensePlan[]>([]);
  const [invoices, setInvoices] = useState<SaaSInvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Assign / upgrade modal
  const [assignGym, setAssignGym] = useState<GymLicenseRow | null>(null);
  const [assignPlanId, setAssignPlanId] = useState("");
  const [trialDays, setTrialDays] = useState("");
  const [assignBusy, setAssignBusy] = useState(false);

  // Plan create/edit modal
  const [planModal, setPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<LicensePlan | null>(null);
  const [planForm, setPlanForm] = useState({ name: "", price: "", maxMembers: "", interval: "MONTHLY" as "MONTHLY" | "YEARLY", description: "" });
  const [planBusy, setPlanBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [lic, pl, inv] = await Promise.all([
        licenseService.listLicenses(),
        licenseService.listPlans(true),
        superAdminService.listInvoices(),
      ]);
      setLicenses(lic); setPlans(pl); setInvoices(inv);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load license data.");
    } finally {
      setLoading(false);
    }
  }, [toast]);
  useEffect(() => { void load(); }, [load]);

  const metrics = useMemo(() => {
    const licensed = licenses.filter((l) => l.licenseName);
    const mrr = licensed.filter((l) => l.licenseStatus === "ACTIVE").reduce((s, l) => s + l.monthlyPrice, 0);
    const avgUtil = licensed.length ? Math.round(licensed.reduce((s, l) => s + l.utilizationPct, 0) / licensed.length) : 0;
    const atCapacity = licensed.filter((l) => l.tier === "FULL").length;
    const onTrial = licensed.filter((l) => l.isTrial).length;
    return { mrr, arr: mrr * 12, licensedCount: licensed.length, avgUtil, atCapacity, onTrial };
  }, [licenses]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await licenseService.generate(month);
      toast.success(`${res.created} license invoice(s) for ${res.billingMonth} · ${inr(res.totalBilled)} billed${res.skipped ? ` · ${res.skipped} skipped` : ""}.`);
      await load();
      setTab("invoices");
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to generate invoices.");
    } finally {
      setGenerating(false);
    }
  }

  function openAssign(g: GymLicenseRow) {
    setAssignGym(g);
    setAssignPlanId(plans.find((p) => p.isActive)?.id ?? "");
    setTrialDays("");
  }
  async function submitAssign() {
    if (!assignGym || !assignPlanId) return;
    setAssignBusy(true);
    try {
      await licenseService.assignPlan(assignGym.gymId, { planId: assignPlanId, trialDays: trialDays ? parseInt(trialDays) : undefined });
      toast.success(`License updated for ${assignGym.gymName}.`);
      setAssignGym(null);
      await load();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to update license.");
    } finally {
      setAssignBusy(false);
    }
  }

  async function toggleSuspend(g: GymLicenseRow) {
    setBusyId(g.gymId);
    try {
      if (g.licenseStatus === "SUSPENDED") { await licenseService.resume(g.gymId); toast.success(`${g.gymName} reactivated.`); }
      else { await licenseService.suspend(g.gymId); toast.success(`${g.gymName} suspended.`); }
      await load();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed.");
    } finally { setBusyId(null); }
  }

  function openPlanCreate() { setEditingPlan(null); setPlanForm({ name: "", price: "", maxMembers: "", interval: "MONTHLY", description: "" }); setPlanModal(true); }
  function openPlanEdit(p: LicensePlan) {
    setEditingPlan(p);
    setPlanForm({ name: p.name, price: String(p.price), maxMembers: p.maxMembers != null ? String(p.maxMembers) : "", interval: p.interval, description: p.description ?? "" });
    setPlanModal(true);
  }
  async function submitPlan() {
    if (!planForm.name.trim() || !planForm.price) return;
    setPlanBusy(true);
    try {
      const payload = {
        name: planForm.name.trim(), price: parseFloat(planForm.price), interval: planForm.interval,
        maxMembers: planForm.maxMembers ? parseInt(planForm.maxMembers) : undefined, description: planForm.description || undefined,
      };
      if (editingPlan) await licenseService.updatePlan(editingPlan.id, payload);
      else await licenseService.createPlan(payload);
      toast.success(editingPlan ? "Plan updated." : "Plan created.");
      setPlanModal(false);
      await load();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to save plan.");
    } finally { setPlanBusy(false); }
  }

  async function handlePay(inv: SaaSInvoiceRow) {
    setBusyId(inv.id);
    try { await superAdminService.recordPayment(inv.id); toast.success(`Payment recorded for ${inv.invoiceNumber}.`); await load(); }
    catch { toast.error("Failed to record payment."); }
    finally { setBusyId(null); }
  }

  const visibleInvoices = useMemo(
    () => invoices.filter((i) => !month || i.billingMonth === month || i.billingMonth == null),
    [invoices, month],
  );

  return (
    <Page
      title="License Management"
      eyebrow="SaaS Command Center"
      description="License-based SaaS billing — each gym pays a flat monthly fee for its licensed member capacity. Members always pay the gym directly."
      action={
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="eyebrow mb-1 block">Billing month</label>
            <input type="month" value={month} max={currentMonth()} onChange={(e) => setMonth(e.target.value)}
              className="h-10 rounded-xl border border-border bg-(--surface-solid) px-3 text-sm text-(--text-primary) outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15" />
          </div>
          <Button iconLeft={<FileText className="h-4 w-4" />} loading={generating} onClick={() => void handleGenerate()}>Generate invoices</Button>
          <Button variant="secondary" iconLeft={<RefreshCw className="h-4 w-4" />} onClick={() => void load()}>Refresh</Button>
        </div>
      }
    >
      <div className="space-y-8">
        {/* MRR / utilization metrics */}
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-5">
          <StatTile label="MRR (license)" value={loading ? "—" : inr(metrics.mrr)} icon={<IndianRupee />} tone="energy" />
          <StatTile label="ARR" value={loading ? "—" : inr(metrics.arr)} icon={<CheckCircle2 />} tone="neutral" />
          <StatTile label="Licensed gyms" value={loading ? "—" : String(metrics.licensedCount)} icon={<Crown />} tone="neutral" />
          <StatTile label="Avg utilization" value={loading ? "—" : `${metrics.avgUtil}%`} icon={<Gauge />} tone={metrics.avgUtil >= 90 ? "energy" : "neutral"} />
          <StatTile label="At capacity" value={loading ? "—" : String(metrics.atCapacity)} icon={<ShieldAlert />} tone={metrics.atCapacity > 0 ? "energy" : "neutral"} />
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <Button size="sm" variant={tab === "licenses" ? "primary" : "secondary"} onClick={() => setTab("licenses")}>Gym Licenses</Button>
          <Button size="sm" variant={tab === "plans" ? "primary" : "secondary"} onClick={() => setTab("plans")}>License Plans</Button>
          <Button size="sm" variant={tab === "invoices" ? "primary" : "secondary"} onClick={() => setTab("invoices")}>Invoices</Button>
        </div>

        {loading ? (
          <div className="surface-card p-4"><div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height="h-16" />)}</div></div>
        ) : tab === "licenses" ? (
          licenses.length === 0 ? (
            <div className="surface-card"><EmptyMomentumState icon={<Crown />} title="No gyms yet" description="Create gyms, then assign each a GymPro license plan to start recurring SaaS billing." /></div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {licenses.map((g) => (
                <div key={g.gymId} className="surface-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold text-(--text-primary)">{g.gymName}</p>
                      <p className="truncate text-xs text-(--text-muted)">{g.ownerEmail ?? "—"}</p>
                    </div>
                    <StatusPill tone={statusTone(g.licenseStatus)}>{g.isTrial ? "TRIAL" : g.licenseStatus}</StatusPill>
                  </div>

                  {g.licenseName ? (
                    <>
                      <div className="mt-3 flex items-baseline justify-between">
                        <p className="text-sm font-semibold text-(--text-primary)">{g.licenseName}</p>
                        <p className="text-sm font-bold text-(--text-primary)">{inr(g.monthlyPrice)}<span className="text-xs font-normal text-(--text-muted)">/{g.interval === "YEARLY" ? "yr" : "mo"}</span></p>
                      </div>
                      {/* Capacity progress */}
                      <div className="mt-3">
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="text-(--text-secondary)">{g.activeMembers} / {g.capacity ?? "∞"} members</span>
                          <span className="font-semibold text-(--text-primary)">{g.utilizationPct}%</span>
                        </div>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-(--surface-secondary)">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${Math.min(100, g.utilizationPct)}%`, background: g.utilizationPct >= 90 ? "var(--flame)" : g.utilizationPct >= 80 ? "var(--accent, var(--flame))" : "var(--success)" }} />
                        </div>
                        <div className="mt-1.5 flex items-center justify-between">
                          <StatusPill tone={tierTone(g.tier)}>{g.tierMessage}</StatusPill>
                          <span className="text-xs text-(--text-muted)">{g.remaining != null ? `${g.remaining} slots left` : "uncapped"}</span>
                        </div>
                      </div>
                      {/* Enterprise dimensions — branches + staff */}
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <DimBar label="Branches" u={g.branchUsage} />
                        <DimBar label="Staff" u={g.staffUsage} />
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-(--text-secondary)">
                        <span>Renewal: <span className="text-(--text-primary)">{fmtDate(g.renewalDate)}</span></span>
                        <span>Billing: <span className="text-(--text-primary)">{g.billingStatus}</span></span>
                        {g.isTrial && <span>Trial ends: <span className="text-(--text-primary)">{fmtDate(g.trialEndsAt)}</span></span>}
                        <span>Next invoice: <span className="text-(--text-primary)">{inr(g.nextInvoiceTotal)}</span></span>
                      </div>
                    </>
                  ) : (
                    <p className="mt-3 rounded-xl bg-(--surface-secondary) p-3 text-sm text-(--text-secondary)">No license assigned · {g.activeMembers} active members</p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" iconLeft={<ArrowUpCircle className="h-4 w-4" />} onClick={() => openAssign(g)}>{g.licenseName ? "Change plan" : "Assign license"}</Button>
                    {g.licenseName && (
                      <Button size="sm" variant="secondary" loading={busyId === g.gymId} onClick={() => void toggleSuspend(g)}>
                        {g.licenseStatus === "SUSPENDED" ? "Reactivate" : "Suspend"}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : tab === "plans" ? (
          <div className="space-y-6">
            <div className="surface-card p-0">
              <div className="flex items-center justify-between px-5 pt-5">
                <SectionHeader eyebrow="License catalogue" title="Plans" />
                <Button size="sm" iconLeft={<Plus className="h-4 w-4" />} onClick={openPlanCreate}>New plan</Button>
              </div>
              {plans.length === 0 ? (
                <div className="p-5"><EmptyMomentumState icon={<Crown />} title="No plans yet" description="Create license tiers (e.g. Launch 100, Scale 250, Elite 500)." /></div>
              ) : (
                <div className="grid gap-4 p-5 md:grid-cols-2 lg:grid-cols-3">
                  {plans.map((p) => (
                    <button key={p.id} onClick={() => openPlanEdit(p)} className="rounded-2xl border border-border bg-(--surface-secondary) p-4 text-left transition hover:border-(--flame)/40">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-(--text-primary)">{p.name}</p>
                        {!p.isActive && <StatusPill tone="neutral">INACTIVE</StatusPill>}
                      </div>
                      <p className="mt-1 text-2xl font-black text-(--text-primary)">{inr(p.price)}<span className="text-sm font-normal text-(--text-muted)">/{p.interval === "YEARLY" ? "yr" : "mo"}</span></p>
                      <p className="mt-1 text-sm text-(--text-secondary)">Up to {p.maxMembers ?? "∞"} active members</p>
                      <p className="text-xs text-(--text-muted)">{p.maxBranches ?? "∞"} branches · {p.maxStaff ?? "∞"} staff</p>
                      {p.description && <p className="mt-1 text-xs text-(--text-muted)">{p.description}</p>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Plan comparison matrix */}
            {plans.length > 0 && (
              <div className="surface-card overflow-hidden p-0">
                <SectionHeader eyebrow="At a glance" title="Plan comparison" className="px-5 pt-5" />
                <div className="overflow-x-auto p-5">
                  <table className="w-full text-left text-sm">
                    <thead className="text-xs uppercase tracking-wide text-(--text-muted)">
                      <tr>
                        <th className="py-2 pr-4 font-bold">Limit</th>
                        {plans.map((p) => <th key={p.id} className="px-3 py-2 text-center font-bold text-(--text-primary)">{p.name}</th>)}
                      </tr>
                    </thead>
                    <tbody className="text-(--text-secondary)">
                      {([
                        ["Price", (p: LicensePlan) => `${inr(p.price)}/${p.interval === "YEARLY" ? "yr" : "mo"}`],
                        ["Members", (p: LicensePlan) => p.maxMembers ?? "Unlimited"],
                        ["Branches", (p: LicensePlan) => p.maxBranches ?? "Unlimited"],
                        ["Staff", (p: LicensePlan) => p.maxStaff ?? "Unlimited"],
                      ] as const).map(([label, fn]) => (
                        <tr key={label} className="border-t border-border">
                          <td className="py-2 pr-4 font-semibold text-(--text-primary)">{label}</td>
                          {plans.map((p) => <td key={p.id} className="px-3 py-2 text-center">{String(fn(p))}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-3 text-xs text-(--text-muted)">Storage, AI, SMS, WhatsApp, API access, white-label and per-role staff limits are part of the Enterprise License schema (migration pending approval).</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Invoices */
          visibleInvoices.length === 0 ? (
            <div className="surface-card"><EmptyMomentumState icon={<FileText />} title="No invoices for this month" description="Generate license invoices to bill gyms their flat monthly fee." /></div>
          ) : (
            <div className="surface-card overflow-hidden p-0">
              <SectionHeader eyebrow="SaaS invoices" title="Invoices" className="px-5 pt-5" />
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-(--surface-secondary) text-xs uppercase tracking-wide text-(--text-muted)">
                    <tr>
                      <th className="px-5 py-3 font-bold">Invoice</th><th className="px-5 py-3 font-bold">Gym</th>
                      <th className="px-5 py-3 font-bold">Month</th><th className="px-5 py-3 font-bold">Total</th>
                      <th className="px-5 py-3 font-bold">Status</th><th className="px-5 py-3 font-bold">Due</th>
                      <th className="px-5 py-3 font-bold"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleInvoices.map((inv) => (
                      <tr key={inv.id} className="border-b border-border last:border-0">
                        <td className="px-5 py-3 font-mono text-xs text-(--text-secondary)">{inv.invoiceNumber}</td>
                        <td className="px-5 py-3 text-(--text-primary)">{inv.gym?.name ?? "—"}</td>
                        <td className="px-5 py-3 text-(--text-secondary)">{inv.billingMonth ?? "—"}</td>
                        <td className="px-5 py-3 font-semibold text-(--text-primary)">{inr(inv.totalAmount)}</td>
                        <td className="px-5 py-3"><StatusPill tone={statusTone(inv.effectiveStatus ?? inv.status)}>{inv.effectiveStatus ?? inv.status}</StatusPill></td>
                        <td className="px-5 py-3 text-(--text-secondary)">{fmtDate(inv.dueDate)}</td>
                        <td className="px-5 py-3 text-right">
                          {inv.status !== "PAID" && inv.status !== "CANCELLED" && (
                            <Button size="sm" variant="secondary" loading={busyId === inv.id} onClick={() => void handlePay(inv)}>Mark paid</Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </div>

      {/* Assign / upgrade license */}
      <Modal open={!!assignGym} onClose={() => setAssignGym(null)} title={assignGym?.licenseName ? `Change license — ${assignGym?.gymName}` : `Assign license — ${assignGym?.gymName}`}
        footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setAssignGym(null)} disabled={assignBusy}>Cancel</Button><Button onClick={() => void submitAssign()} loading={assignBusy}>Apply</Button></div>}>
        <div className="space-y-4">
          <Select label="License plan" value={assignPlanId} onChange={(e) => setAssignPlanId(e.target.value)}
            options={plans.filter((p) => p.isActive).map((p) => ({ label: `${p.name} — ${inr(p.price)}/${p.interval === "YEARLY" ? "yr" : "mo"} · up to ${p.maxMembers ?? "∞"}`, value: p.id }))} />
          <Input label="Trial days (optional)" type="number" value={trialDays} onChange={(e) => setTrialDays(e.target.value)} placeholder="e.g. 30 — billing starts after trial" />
          {assignGym?.licenseName && <p className="text-xs text-(--text-muted)">Current: {assignGym.licenseName} ({assignGym.activeMembers}/{assignGym.capacity ?? "∞"}). Changing the plan updates capacity, billing and renewal immediately; the old license is kept in history.</p>}
        </div>
      </Modal>

      {/* Plan create / edit */}
      <Modal open={planModal} onClose={() => setPlanModal(false)} title={editingPlan ? "Edit license plan" : "New license plan"}
        footer={<div className="flex justify-between gap-2">
          {editingPlan && <Button variant="secondary" onClick={() => { void licenseService.updatePlan(editingPlan.id, { isActive: !editingPlan.isActive }).then(() => { toast.success(editingPlan.isActive ? "Plan deactivated." : "Plan activated."); setPlanModal(false); void load(); }); }}>{editingPlan.isActive ? "Deactivate" : "Activate"}</Button>}
          <div className="ml-auto flex gap-2"><Button variant="secondary" onClick={() => setPlanModal(false)} disabled={planBusy}>Cancel</Button><Button onClick={() => void submitPlan()} loading={planBusy}>Save</Button></div>
        </div>}>
        <div className="space-y-4">
          <Input label="Plan name" value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} placeholder="e.g. Scale" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Monthly price (₹)" type="number" value={planForm.price} onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })} placeholder="2999" />
            <Input label="Capacity (max active members)" type="number" value={planForm.maxMembers} onChange={(e) => setPlanForm({ ...planForm, maxMembers: e.target.value })} placeholder="250" />
          </div>
          <Select label="Billing cycle" value={planForm.interval} onChange={(e) => setPlanForm({ ...planForm, interval: e.target.value as "MONTHLY" | "YEARLY" })}
            options={[{ label: "Monthly", value: "MONTHLY" }, { label: "Yearly", value: "YEARLY" }]} />
          <Input label="Description (optional)" value={planForm.description} onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })} />
        </div>
      </Modal>
    </Page>
  );
}
