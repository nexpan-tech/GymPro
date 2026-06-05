import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarPlus, RefreshCw, Snowflake, Clock } from "lucide-react";
import Page from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/forms/Input";
import Select from "@/components/forms/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/common/EmptyState";
import { useToast } from "@/hooks/useToast";
import { memberService } from "@/services/member.service";
import {
  membershipService,
  type MembershipRecord,
  type MembershipPlan,
} from "@/services/membership.service";
import type { Member } from "@/types/member.types";

function fmt(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function statusVariant(s: string): "success" | "danger" | "warning" | "default" {
  if (s === "ACTIVE") return "success";
  if (s === "EXPIRED" || s === "CANCELLED") return "danger";
  if (s === "FROZEN") return "warning";
  return "default";
}

function errMsg(err: unknown, fallback: string) {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;
}

export default function MemberProfilePage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [member, setMember] = useState<Member | null>(null);
  const [history, setHistory] = useState<MembershipRecord[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignPlanId, setAssignPlanId] = useState("");
  const [assignStart, setAssignStart] = useState("");

  const [extendOpen, setExtendOpen] = useState(false);
  const [extendDays, setExtendDays] = useState("30");

  const [freezeOpen, setFreezeOpen] = useState(false);
  const [freezeStart, setFreezeStart] = useState("");
  const [freezeEnd, setFreezeEnd] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [memberRes, hist] = await Promise.all([
        memberService.getById(id),
        membershipService.getByMember(id),
      ]);
      setMember(memberRes.data);
      setHistory(hist);
    } catch (err) {
      console.error(err);
      setError("We couldn't load this member.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
    membershipService.listPlans(false).then(setPlans).catch(() => undefined);
  }, [load]);

  const current = useMemo(
    () =>
      history.find((m) => m.effectiveStatus === "ACTIVE") ??
      history.find((m) => m.effectiveStatus === "FROZEN") ??
      history[0] ??
      null,
    [history]
  );

  async function refreshHistory() {
    const hist = await membershipService.getByMember(id);
    setHistory(hist);
  }

  async function handleAssign() {
    if (!assignPlanId) {
      toast.error("Select a plan.");
      return;
    }
    try {
      setBusy(true);
      await membershipService.create({
        memberId: id,
        planId: assignPlanId,
        ...(assignStart ? { startDate: assignStart } : {}),
      });
      toast.success("Membership assigned.");
      setAssignOpen(false);
      setAssignPlanId("");
      setAssignStart("");
      await refreshHistory();
    } catch (err) {
      toast.error(errMsg(err, "Failed to assign membership."));
    } finally {
      setBusy(false);
    }
  }

  async function handleRenew() {
    if (!current) return;
    try {
      setBusy(true);
      await membershipService.renew(current.id);
      toast.success("Membership renewed.");
      await refreshHistory();
    } catch (err) {
      toast.error(errMsg(err, "Failed to renew."));
    } finally {
      setBusy(false);
    }
  }

  async function handleExtend() {
    if (!current) return;
    const days = Number(extendDays);
    if (!Number.isInteger(days) || days <= 0) {
      toast.error("Enter a positive number of days.");
      return;
    }
    try {
      setBusy(true);
      await membershipService.extend(current.id, days);
      toast.success(`Extended by ${days} days.`);
      setExtendOpen(false);
      await refreshHistory();
    } catch (err) {
      toast.error(errMsg(err, "Failed to extend."));
    } finally {
      setBusy(false);
    }
  }

  async function handleFreeze() {
    if (!current) return;
    try {
      setBusy(true);
      await membershipService.freeze(current.id, {
        ...(freezeStart ? { freezeStartDate: freezeStart } : {}),
        ...(freezeEnd ? { freezeEndDate: freezeEnd } : {}),
      });
      toast.success("Membership frozen.");
      setFreezeOpen(false);
      setFreezeStart("");
      setFreezeEnd("");
      await refreshHistory();
    } catch (err) {
      toast.error(errMsg(err, "Failed to freeze."));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <Page title="Member" description="Loading…">
        <div className="space-y-4">
          <Skeleton height="h-32" />
          <Skeleton height="h-48" />
        </div>
      </Page>
    );
  }

  if (error || !member) {
    return (
      <Page title="Member">
        <EmptyState title="Member not found" message={error ?? "This member does not exist."} action={<Button variant="secondary" onClick={() => navigate("/gym-admin/members")}>Back to Members</Button>} />
      </Page>
    );
  }

  const planLabel = (m: MembershipRecord) => m.planRef?.name ?? m.plan ?? "—";

  return (
    <Page
      title={member.user?.name ?? "Member"}
      description={member.user?.email}
      action={
        <Button variant="secondary" iconLeft={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate("/gym-admin/members")}>
          Back
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Top: details + current membership */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card variant="solid" className="p-6 lg:col-span-2">
            <div className="mb-4 flex items-center gap-3">
              <h3 className="text-base font-semibold text-(--text-primary)">Profile</h3>
              <Badge variant={member.status === "ACTIVE" ? "success" : "danger"} dot>
                {member.status === "ACTIVE" ? "Active" : "Inactive"}
              </Badge>
            </div>
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <Field label="Phone" value={member.phone} />
              <Field label="Gender" value={member.gender as string} />
              <Field label="Date of birth" value={fmt(member.dateOfBirth)} />
              <Field label="Joined" value={fmt(member.joinedAt ?? member.createdAt)} />
              <Field label="Branch" value={member.branch?.name} />
              <Field label="Trainer" value={member.trainer?.name} />
              <Field label="Address" value={member.address} />
              <Field label="Fitness goal" value={member.fitnessGoal} />
            </dl>
          </Card>

          <Card variant="solid" className="p-6">
            <h3 className="mb-4 text-base font-semibold text-(--text-primary)">Current Membership</h3>
            {current ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-(--text-primary)">{planLabel(current)}</span>
                  <Badge variant={statusVariant(current.effectiveStatus)} dot>{current.effectiveStatus}</Badge>
                </div>
                <Field label="Valid until" value={fmt(current.endDate)} />
                <Field label="Days remaining" value={String(current.daysRemaining)} />
                <Field label="Amount" value={`₹${current.amount}`} />
                <Field label="Payment" value={current.paymentStatus} />
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button size="sm" iconLeft={<RefreshCw className="h-3.5 w-3.5" />} loading={busy} onClick={() => void handleRenew()}>Renew</Button>
                  <Button size="sm" variant="secondary" iconLeft={<Snowflake className="h-3.5 w-3.5" />} onClick={() => setFreezeOpen(true)}>Freeze</Button>
                  <Button size="sm" variant="secondary" iconLeft={<Clock className="h-3.5 w-3.5" />} onClick={() => setExtendOpen(true)}>Extend</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-(--text-secondary)">No membership assigned yet.</p>
                <Button size="sm" iconLeft={<CalendarPlus className="h-4 w-4" />} onClick={() => setAssignOpen(true)}>Assign Membership</Button>
              </div>
            )}
            {current && (
              <div className="mt-4 border-t border-(--border) pt-4">
                <Button size="sm" variant="ghost" iconLeft={<CalendarPlus className="h-4 w-4" />} onClick={() => setAssignOpen(true)}>Assign New Plan</Button>
              </div>
            )}
          </Card>
        </div>

        {/* Health profile */}
        <Card variant="solid" className="p-6">
          <h3 className="mb-4 text-base font-semibold text-(--text-primary)">Health Profile</h3>
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <Field label="Emergency contact" value={member.emergencyContactName} />
            <Field label="Emergency phone" value={member.emergencyContactPhone} />
            <Field label="Health notes" value={member.healthNotes} />
            <Field label="Injury notes" value={member.injuryNotes} />
            <Field label="Medical conditions" value={member.medicalConditions} />
          </dl>
        </Card>

        {/* Membership history */}
        <Card variant="solid" className="overflow-hidden p-0">
          <div className="border-b border-(--border) px-6 py-4">
            <h3 className="text-base font-semibold text-(--text-primary)">Membership History</h3>
          </div>
          {history.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-(--text-secondary)">No membership history yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-(--border) text-xs uppercase tracking-wide text-(--text-secondary)">
                  <tr>
                    <th className="px-6 py-3 font-medium">Plan</th>
                    <th className="px-6 py-3 font-medium">Start</th>
                    <th className="px-6 py-3 font-medium">End</th>
                    <th className="px-6 py-3 font-medium">Amount</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--border)">
                  {history.map((m) => (
                    <tr key={m.id} className="hover:bg-(--surface-hover)">
                      <td className="px-6 py-3 text-(--text-primary)">{planLabel(m)}</td>
                      <td className="px-6 py-3 text-(--text-secondary)">{fmt(m.startDate)}</td>
                      <td className="px-6 py-3 text-(--text-secondary)">{fmt(m.endDate)}</td>
                      <td className="px-6 py-3 text-(--text-secondary)">₹{m.amount}</td>
                      <td className="px-6 py-3"><Badge variant={statusVariant(m.effectiveStatus)}>{m.effectiveStatus}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Assign modal */}
      <Modal
        open={assignOpen}
        onClose={() => !busy && setAssignOpen(false)}
        title="Assign Membership"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setAssignOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={() => void handleAssign()} loading={busy}>Assign</Button>
          </div>
        }
      >
        <div className="space-y-4">
          {plans.length === 0 ? (
            <p className="text-sm text-(--text-secondary)">No active plans. Create one on the Memberships page first.</p>
          ) : (
            <Select
              label="Plan"
              options={plans.map((p) => ({ label: `${p.name} — ₹${p.price} / ${p.durationDays}d`, value: p.id }))}
              value={assignPlanId}
              placeholder="Select a plan"
              onChange={(e) => setAssignPlanId(e.target.value)}
            />
          )}
          <Input label="Start date (optional)" type="date" value={assignStart} onChange={(e) => setAssignStart(e.target.value)} />
        </div>
      </Modal>

      {/* Extend modal */}
      <Modal
        open={extendOpen}
        onClose={() => !busy && setExtendOpen(false)}
        title="Extend Membership"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setExtendOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={() => void handleExtend()} loading={busy}>Extend</Button>
          </div>
        }
      >
        <Input label="Number of days" type="number" value={extendDays} onChange={(e) => setExtendDays(e.target.value)} />
      </Modal>

      {/* Freeze modal */}
      <Modal
        open={freezeOpen}
        onClose={() => !busy && setFreezeOpen(false)}
        title="Freeze Membership"
        description="Optionally set a freeze window — the end date is pushed out by the freeze span."
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setFreezeOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={() => void handleFreeze()} loading={busy}>Freeze</Button>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Freeze from (optional)" type="date" value={freezeStart} onChange={(e) => setFreezeStart(e.target.value)} />
          <Input label="Freeze until (optional)" type="date" value={freezeEnd} onChange={(e) => setFreezeEnd(e.target.value)} />
        </div>
      </Modal>
    </Page>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-(--text-secondary)">{label}</dt>
      <dd className="mt-0.5 text-sm text-(--text-primary)">{value || "—"}</dd>
    </div>
  );
}
