import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Snowflake, Clock, Users, AlertTriangle, CalendarClock } from "lucide-react";
import Page from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/forms/Input";
import Select from "@/components/forms/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  MetricCard, StatusPill, type StatusTone, SectionHeader, InsightCard, EmptyMomentumState,
} from "@/components/premium";
import { useToast } from "@/hooks/useToast";
import {
  membershipService,
  type MembershipPlan,
  type MembershipRecord,
  type MembershipAnalytics,
  type CreatePlanPayload,
} from "@/services/membership.service";
import { memberService } from "@/services/member.service";
import type { Member } from "@/types/member.types";

type Tab = "memberships" | "plans";

function fmt(d?: string | null) {
  return d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";
}
function statusTone(s: string): StatusTone {
  if (s === "ACTIVE") return "active";
  if (s === "EXPIRED" || s === "CANCELLED") return "expired";
  if (s === "FROZEN") return "pending";
  return "neutral";
}
function errMsg(err: unknown, fallback: string) {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;
}

const emptyPlan = { name: "", description: "", durationDays: "30", price: "", isActive: true };

export default function MembershipsPage() {
  const toast = useToast();

  const [tab, setTab] = useState<Tab>("memberships");
  const [view, setView] = useState<"current" | "history">("current");
  const [analytics, setAnalytics] = useState<MembershipAnalytics | null>(null);
  const [memberships, setMemberships] = useState<MembershipRecord[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Plan form
  const [planOpen, setPlanOpen] = useState(false);
  const [planEditId, setPlanEditId] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState(emptyPlan);
  const [planSubmitting, setPlanSubmitting] = useState(false);

  // Assign form
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignMemberId, setAssignMemberId] = useState("");
  const [assignPlanId, setAssignPlanId] = useState("");
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  // Extend form
  const [extendId, setExtendId] = useState<string | null>(null);
  const [extendDays, setExtendDays] = useState("30");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [a, ms, pl] = await Promise.all([
        membershipService.analytics(),
        membershipService.list({ currentOnly: view === "current" }),
        membershipService.listPlans(true),
      ]);
      setAnalytics(a);
      setMemberships(ms);
      setPlans(pl);
    } catch (err) {
      console.error(err);
      setError("We couldn't load membership data.");
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    void load();
    memberService.list().then((r) => setMembers(r.data?.members ?? [])).catch(() => undefined);
  }, [load]);

  const activePlans = useMemo(() => plans.filter((p) => p.isActive), [plans]);

  // ── Plan handlers ──────────────────────────────────────────────────────────
  function openCreatePlan() {
    setPlanEditId(null);
    setPlanForm(emptyPlan);
    setPlanOpen(true);
  }
  function openEditPlan(p: MembershipPlan) {
    setPlanEditId(p.id);
    setPlanForm({
      name: p.name,
      description: p.description ?? "",
      durationDays: String(p.durationDays),
      price: String(p.price),
      isActive: p.isActive,
    });
    setPlanOpen(true);
  }
  async function submitPlan() {
    if (planForm.name.trim().length < 2) return toast.error("Plan name is required.");
    const durationDays = Number(planForm.durationDays);
    const price = Number(planForm.price);
    if (!Number.isInteger(durationDays) || durationDays <= 0) return toast.error("Duration must be a positive number of days.");
    if (Number.isNaN(price) || price < 0) return toast.error("Enter a valid price.");
    try {
      setPlanSubmitting(true);
      const payload: CreatePlanPayload = {
        name: planForm.name.trim(),
        description: planForm.description.trim() || undefined,
        durationDays,
        price,
        isActive: planForm.isActive,
      };
      if (planEditId) {
        await membershipService.updatePlan(planEditId, payload);
        toast.success("Plan updated.");
      } else {
        await membershipService.createPlan(payload);
        toast.success("Plan created.");
      }
      setPlanOpen(false);
      await load();
    } catch (err) {
      toast.error(errMsg(err, "Failed to save plan."));
    } finally {
      setPlanSubmitting(false);
    }
  }
  async function removePlan(p: MembershipPlan) {
    try {
      setBusyId(p.id);
      await membershipService.removePlan(p.id);
      toast.success("Plan removed.");
      await load();
    } catch (err) {
      toast.error(errMsg(err, "Failed to remove plan."));
    } finally {
      setBusyId(null);
    }
  }

  // ── Membership handlers ────────────────────────────────────────────────────
  async function submitAssign() {
    if (!assignMemberId) return toast.error("Select a member.");
    if (!assignPlanId) return toast.error("Select a plan.");
    try {
      setAssignSubmitting(true);
      await membershipService.create({ memberId: assignMemberId, planId: assignPlanId });
      toast.success("Membership assigned.");
      setAssignOpen(false);
      setAssignMemberId("");
      setAssignPlanId("");
      await load();
    } catch (err) {
      toast.error(errMsg(err, "Failed to assign membership."));
    } finally {
      setAssignSubmitting(false);
    }
  }
  async function renew(m: MembershipRecord) {
    try {
      setBusyId(m.id);
      await membershipService.renew(m.id);
      toast.success("Renewed.");
      await load();
    } catch (err) {
      toast.error(errMsg(err, "Failed to renew."));
    } finally {
      setBusyId(null);
    }
  }
  async function freeze(m: MembershipRecord) {
    try {
      setBusyId(m.id);
      await membershipService.freeze(m.id, {});
      toast.success("Frozen.");
      await load();
    } catch (err) {
      toast.error(errMsg(err, "Failed to freeze."));
    } finally {
      setBusyId(null);
    }
  }
  async function submitExtend() {
    if (!extendId) return;
    const days = Number(extendDays);
    if (!Number.isInteger(days) || days <= 0) return toast.error("Enter a positive number of days.");
    try {
      setBusyId(extendId);
      await membershipService.extend(extendId, days);
      toast.success(`Extended by ${days} days.`);
      setExtendId(null);
      await load();
    } catch (err) {
      toast.error(errMsg(err, "Failed to extend."));
    } finally {
      setBusyId(null);
    }
  }

  const planName = (m: MembershipRecord) => m.planRef?.name ?? m.plan ?? "—";

  return (
    <Page
      title="Memberships"
      eyebrow="Subscription Intelligence Center"
      description="Plans, assignments, renewals, and the full subscription lifecycle — at a glance."
      action={
        tab === "plans" ? (
          <Button iconLeft={<Plus className="h-4 w-4" />} onClick={openCreatePlan}>New Plan</Button>
        ) : (
          <Button iconLeft={<Plus className="h-4 w-4" />} onClick={() => setAssignOpen(true)}>Assign Membership</Button>
        )
      }
    >
      <div className="space-y-8">
        {/* Lifecycle metrics */}
        <div className="grid grid-cols-2 gap-5 stagger lg:grid-cols-4">
          <MetricCard label="Active Members" value={analytics?.activeMembers ?? "—"} icon={<Users />} tone="energy" />
          <MetricCard label="Expired" value={analytics?.expiredMemberships ?? "—"} icon={<AlertTriangle />} tone={(analytics?.expiredMemberships ?? 0) > 0 ? "energy" : "neutral"} />
          <MetricCard label="Renewals Due This Week" value={analytics?.renewalsDueThisWeek ?? "—"} icon={<CalendarClock />} tone={(analytics?.renewalsDueThisWeek ?? 0) > 0 ? "energy" : "neutral"} />
          <MetricCard label="Due This Month" value={analytics?.renewalsDueThisMonth ?? "—"} icon={<CalendarClock />} tone="neutral" />
        </div>

        {/* Lifecycle insight */}
        {analytics && (analytics.renewalsDueThisWeek ?? 0) > 0 && (
          <InsightCard
            tone="opportunity"
            title="Renewals are knocking"
            description={`${analytics.renewalsDueThisWeek} membership${analytics.renewalsDueThisWeek === 1 ? "" : "s"} expire this week. A timely nudge now is the cheapest revenue you'll earn all month.`}
            metric={analytics.renewalsDueThisWeek}
            metricLabel="due"
            action={<Button size="sm" variant="secondary" onClick={() => setView("current")}>Review current</Button>}
          />
        )}

        {/* Tabs */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <Button size="sm" variant={tab === "memberships" ? "primary" : "secondary"} onClick={() => setTab("memberships")}>Memberships</Button>
            <Button size="sm" variant={tab === "plans" ? "primary" : "secondary"} onClick={() => setTab("plans")}>Plans</Button>
          </div>
          {tab === "memberships" && (
            <div className="flex gap-1 rounded-lg border border-border p-1">
              <Button size="sm" variant={view === "current" ? "primary" : "ghost"} onClick={() => setView("current")}>Current</Button>
              <Button size="sm" variant={view === "history" ? "primary" : "ghost"} onClick={() => setView("history")}>History</Button>
            </div>
          )}
        </div>

        {loading ? (
          <Card variant="solid" className="p-4"><div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height="h-12" />)}</div></Card>
        ) : error ? (
          <div className="surface-card"><EmptyMomentumState icon={<AlertTriangle />} title="Couldn't load data" description={error} action={<Button variant="secondary" onClick={() => void load()}>Retry</Button>} /></div>
        ) : tab === "plans" ? (
          plans.length === 0 ? (
            <div className="surface-card"><EmptyMomentumState icon={<Plus />} title="Design your first plan" description="Create a membership plan and start turning visitors into committed members." action={<Button iconLeft={<Plus className="h-4 w-4" />} onClick={openCreatePlan}>New Plan</Button>} /></div>
          ) : (
            <Card variant="solid" className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border text-xs uppercase tracking-wide text-(--text-secondary)">
                    <tr>
                      <th className="px-5 py-3 font-medium">Plan</th>
                      <th className="px-5 py-3 font-medium">Duration</th>
                      <th className="px-5 py-3 font-medium">Price</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {plans.map((p) => (
                      <tr key={p.id} className="hover:bg-(--surface-hover)">
                        <td className="px-5 py-4">
                          <div className="font-medium text-(--text-primary)">{p.name}</div>
                          {p.description && <div className="text-xs text-(--text-secondary)">{p.description}</div>}
                        </td>
                        <td className="px-5 py-4 text-(--text-secondary)">{p.durationDays} days</td>
                        <td className="px-5 py-4 text-(--text-secondary)">₹{p.price}</td>
                        <td className="px-5 py-4"><StatusPill tone={p.isActive ? "active" : "neutral"} size="sm">{p.isActive ? "Active" : "Inactive"}</StatusPill></td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="secondary" onClick={() => openEditPlan(p)}>Edit</Button>
                            <Button size="sm" variant="danger" loading={busyId === p.id} onClick={() => void removePlan(p)}>Remove</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )
        ) : memberships.length === 0 ? (
          <div className="surface-card"><EmptyMomentumState icon={<Users />} title="Put members on a plan" description="Assign a plan to a member and start the relationship that keeps them coming back." action={<Button iconLeft={<Plus className="h-4 w-4" />} onClick={() => setAssignOpen(true)}>Assign Membership</Button>} /></div>
        ) : (
          <Card variant="solid" className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase tracking-wide text-(--text-secondary)">
                  <tr>
                    <th className="px-5 py-3 font-medium">Member</th>
                    <th className="px-5 py-3 font-medium">Plan</th>
                    <th className="px-5 py-3 font-medium">Valid Until</th>
                    <th className="px-5 py-3 font-medium">Days Left</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {memberships.map((m) => (
                    <tr key={m.id} className="hover:bg-(--surface-hover)">
                      <td className="px-5 py-4">
                        <div className="font-medium text-(--text-primary)">{m.member?.user?.name ?? "—"}</div>
                        <div className="text-xs text-(--text-secondary)">{m.member?.user?.email}</div>
                      </td>
                      <td className="px-5 py-4 text-(--text-secondary)">{planName(m)}</td>
                      <td className="px-5 py-4 text-(--text-secondary)">{fmt(m.endDate)}</td>
                      <td className="px-5 py-4 text-(--text-secondary)">{m.daysRemaining}</td>
                      <td className="px-5 py-4"><StatusPill tone={statusTone(m.effectiveStatus)} size="sm">{m.effectiveStatus}</StatusPill></td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button size="sm" variant="secondary" iconLeft={<RefreshCw className="h-3.5 w-3.5" />} loading={busyId === m.id} onClick={() => void renew(m)}>Renew</Button>
                          <Button size="sm" variant="ghost" iconLeft={<Snowflake className="h-3.5 w-3.5" />} onClick={() => void freeze(m)}>Freeze</Button>
                          <Button size="sm" variant="ghost" iconLeft={<Clock className="h-3.5 w-3.5" />} onClick={() => { setExtendId(m.id); setExtendDays("30"); }}>Extend</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Plan modal */}
      <Modal
        open={planOpen}
        onClose={() => !planSubmitting && setPlanOpen(false)}
        title={planEditId ? "Edit Plan" : "New Plan"}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setPlanOpen(false)} disabled={planSubmitting}>Cancel</Button>
            <Button onClick={() => void submitPlan()} loading={planSubmitting}>{planEditId ? "Save" : "Create"}</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Plan name" value={planForm.name} onChange={(e) => setPlanForm((p) => ({ ...p, name: e.target.value }))} placeholder="Gold Monthly" />
          <Input label="Description (optional)" value={planForm.description} onChange={(e) => setPlanForm((p) => ({ ...p, description: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Duration (days)" type="number" value={planForm.durationDays} onChange={(e) => setPlanForm((p) => ({ ...p, durationDays: e.target.value }))} />
            <Input label="Price (₹)" type="number" value={planForm.price} onChange={(e) => setPlanForm((p) => ({ ...p, price: e.target.value }))} />
          </div>
          <label className="flex items-center gap-2 text-sm text-(--text-primary)">
            <input type="checkbox" checked={planForm.isActive} onChange={(e) => setPlanForm((p) => ({ ...p, isActive: e.target.checked }))} />
            Active
          </label>
        </div>
      </Modal>

      {/* Assign modal */}
      <Modal
        open={assignOpen}
        onClose={() => !assignSubmitting && setAssignOpen(false)}
        title="Assign Membership"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setAssignOpen(false)} disabled={assignSubmitting}>Cancel</Button>
            <Button onClick={() => void submitAssign()} loading={assignSubmitting}>Assign</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Select label="Member" options={members.map((m) => ({ label: `${m.user?.name ?? "Member"} (${m.user?.email ?? ""})`, value: m.id }))} value={assignMemberId} placeholder="Select a member" onChange={(e) => setAssignMemberId(e.target.value)} />
          {activePlans.length === 0 ? (
            <p className="text-sm text-(--text-secondary)">No active plans. Create one in the Plans tab first.</p>
          ) : (
            <Select label="Plan" options={activePlans.map((p) => ({ label: `${p.name} — ₹${p.price} / ${p.durationDays}d`, value: p.id }))} value={assignPlanId} placeholder="Select a plan" onChange={(e) => setAssignPlanId(e.target.value)} />
          )}
        </div>
      </Modal>

      {/* Extend modal */}
      <Modal
        open={extendId !== null}
        onClose={() => busyId === null && setExtendId(null)}
        title="Extend Membership"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setExtendId(null)}>Cancel</Button>
            <Button onClick={() => void submitExtend()} loading={busyId === extendId}>Extend</Button>
          </div>
        }
      >
        <Input label="Number of days" type="number" value={extendDays} onChange={(e) => setExtendDays(e.target.value)} />
      </Modal>
    </Page>
  );
}
