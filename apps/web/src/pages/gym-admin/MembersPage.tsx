import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Users as UsersIcon, UserCheck, UserX, KeyRound, Trash2,
  MapPin, Dumbbell, CalendarClock, ArrowRight,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/forms/Input";
import Select from "@/components/forms/Select";
import SearchInput from "@/components/common/SearchInput";
import SetPasswordModal from "@/components/common/SetPasswordModal";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  CommandHero, Highlight, MetricCard, SectionHeader, StatusPill,
  EmptyMomentumState, type StatusTone,
} from "@/components/premium";
import { useToast } from "@/hooks/useToast";
import { memberService, type CreateMemberPayload } from "@/services/member.service";
import { branchService, type Branch } from "@/services/branch.service";
import { userService, type GymUser } from "@/services/user.service";
import type { Member } from "@/types/member.types";

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

interface FormState {
  name: string; email: string; password: string; phone: string; gender: string;
  dateOfBirth: string; address: string; fitnessGoal: string; branchId: string;
  trainerId: string; emergencyContactName: string; emergencyContactPhone: string;
  healthNotes: string; injuryNotes: string; medicalConditions: string; referralCode: string;
}

const emptyForm: FormState = {
  name: "", email: "", password: "", phone: "", gender: "", dateOfBirth: "",
  address: "", fitnessGoal: "", branchId: "", trainerId: "",
  emergencyContactName: "", emergencyContactPhone: "", healthNotes: "",
  injuryNotes: "", medicalConditions: "", referralCode: "",
};

const GENDER_OPTIONS = [
  { label: "Male", value: "MALE" },
  { label: "Female", value: "FEMALE" },
  { label: "Other", value: "OTHER" },
];

function errMsg(err: unknown, fallback: string) {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;
}

function daysUntil(d?: string | null): number | null {
  if (!d) return null;
  const t = new Date(d); t.setHours(0, 0, 0, 0);
  const n = new Date(); n.setHours(0, 0, 0, 0);
  return Math.round((t.getTime() - n.getTime()) / 86_400_000);
}

function statusTone(s: Member["status"]): StatusTone {
  if (s === "ACTIVE") return "active";
  if (s === "EXPIRED" || s === "SUSPENDED") return "expired";
  return "pending";
}

function statusLabel(s: Member["status"]): string {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

export default function MembersPage() {
  const toast = useToast();
  const navigate = useNavigate();

  const [members, setMembers] = useState<Member[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [trainers, setTrainers] = useState<GymUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [branchFilter, setBranchFilter] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [resetTarget, setResetTarget] = useState<Member | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await memberService.list();
      setMembers(res.data?.members ?? []);
    } catch (err) {
      console.error("Failed to load members:", err);
      setError("We couldn't load members. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMembers();
    branchService.list().then(setBranches).catch(() => undefined);
    userService
      .list()
      .then((users) => setTrainers(users.filter((u) => u.role === "TRAINER")))
      .catch(() => undefined);
  }, [loadMembers]);

  const trainerName = useCallback(
    (m: Member) => m.trainer?.name ?? trainers.find((t) => t.id === m.trainerId)?.name ?? null,
    [trainers]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => {
      const matchesStatus = statusFilter === "ALL" || m.status === statusFilter;
      const matchesBranch = !branchFilter || m.branchId === branchFilter;
      const matchesQuery =
        !q ||
        m.user?.name?.toLowerCase().includes(q) ||
        m.user?.email?.toLowerCase().includes(q) ||
        m.phone?.toLowerCase().includes(q);
      return matchesStatus && matchesBranch && matchesQuery;
    });
  }, [members, search, statusFilter, branchFilter]);

  const stats = useMemo(() => {
    const total = members.length;
    const active = members.filter((m) => m.status === "ACTIVE").length;
    const renewingSoon = members.filter((m) => {
      const d = daysUntil(m.activeMembership?.endDate);
      return d !== null && d >= 0 && d <= 7;
    }).length;
    return { total, active, inactive: total - active, renewingSoon };
  }, [members]);

  function openCreate() {
    setEditingId(null); setForm(emptyForm); setFormErrors({}); setFormOpen(true);
  }

  function openEdit(m: Member) {
    setEditingId(m.id);
    setForm({
      name: m.user?.name ?? "", email: m.user?.email ?? "", password: "",
      phone: m.phone ?? "", gender: (m.gender as string) ?? "",
      dateOfBirth: m.dateOfBirth ? m.dateOfBirth.slice(0, 10) : "",
      address: m.address ?? "", fitnessGoal: m.fitnessGoal ?? "",
      branchId: m.branchId ?? "", trainerId: m.trainerId ?? "",
      emergencyContactName: m.emergencyContactName ?? "",
      emergencyContactPhone: m.emergencyContactPhone ?? "",
      healthNotes: m.healthNotes ?? "", injuryNotes: m.injuryNotes ?? "",
      medicalConditions: m.medicalConditions ?? "", referralCode: "",
    });
    setFormErrors({}); setFormOpen(true);
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (form.name.trim().length < 2) e.name = "Name is required.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = "Valid email required.";
    if (!editingId && form.password.length < 6) e.password = "Min. 6 characters.";
    if (form.phone.trim().length < 6) e.phone = "Valid phone required.";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  }

  function buildPayload() {
    const p: Record<string, unknown> = {
      name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(),
    };
    if (form.gender) p.gender = form.gender;
    if (form.dateOfBirth) p.dateOfBirth = form.dateOfBirth;
    if (form.address.trim()) p.address = form.address.trim();
    if (form.fitnessGoal.trim()) p.fitnessGoal = form.fitnessGoal.trim();
    if (form.branchId) p.branchId = form.branchId;
    if (form.trainerId) p.trainerId = form.trainerId;
    if (form.emergencyContactName.trim()) p.emergencyContactName = form.emergencyContactName.trim();
    if (form.emergencyContactPhone.trim()) p.emergencyContactPhone = form.emergencyContactPhone.trim();
    if (form.healthNotes.trim()) p.healthNotes = form.healthNotes.trim();
    if (form.injuryNotes.trim()) p.injuryNotes = form.injuryNotes.trim();
    if (form.medicalConditions.trim()) p.medicalConditions = form.medicalConditions.trim();
    // Referral code is capture-once at registration only (never on edit).
    if (!editingId && form.referralCode.trim()) p.referralCode = form.referralCode.trim();
    return p;
  }

  async function handleSubmit() {
    if (!validate()) return;
    try {
      setSubmitting(true);
      if (editingId) {
        await memberService.update(editingId, buildPayload());
        toast.success("Member updated.");
      } else {
        await memberService.create({ ...buildPayload(), password: form.password } as CreateMemberPayload);
        toast.success("Member created.");
      }
      setFormOpen(false);
      await loadMembers();
    } catch (err) {
      toast.error(errMsg(err, "Failed to save member."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(m: Member) {
    try {
      setTogglingId(m.id);
      if (m.status === "ACTIVE") {
        await memberService.remove(m.id);
        toast.success(`${m.user?.name ?? "Member"} deactivated.`);
      } else {
        await memberService.update(m.id, { status: "ACTIVE" });
        toast.success(`${m.user?.name ?? "Member"} reactivated.`);
      }
      await loadMembers();
    } catch (err) {
      toast.error(errMsg(err, "Failed to update member."));
    } finally {
      setTogglingId(null);
    }
  }


  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await memberService.remove(deleteTarget.id, true);
      toast.success("Member permanently deleted.");
      setDeleteTarget(null);
      await loadMembers();
    } catch (err) {
      toast.error(errMsg(err, "Member has history — deactivate instead of deleting."));
    } finally {
      setDeleting(false);
    }
  }

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  const branchOptions = branches.map((b) => ({ label: b.name, value: b.id }));
  const trainerOptions = trainers.map((t) => ({ label: t.name, value: t.id }));

  return (
    <div className="space-y-8">
      {/* ── Member Command Center hero ──────────────────────────────────────── */}
      <CommandHero
        eyebrow="Member Command Center"
        title={
          <>
            Build a community members <Highlight>never want to leave.</Highlight>
          </>
        }
        subtitle="Every member, their status, and their next renewal — at a glance."
        stats={[
          { label: "Total members", value: loading ? "—" : stats.total.toLocaleString("en-IN") },
          { label: "Active", value: loading ? "—" : stats.active.toLocaleString("en-IN") },
        ]}
        actions={
          <button
            onClick={openCreate}
            className="press inline-flex items-center gap-1.5 rounded-xl bg-(image:--gradient-primary) px-4 py-2 text-xs font-bold text-white shadow-[0_8px_22px_rgba(231,55,37,0.4)] transition-transform hover:-translate-y-0.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Member
          </button>
        }
      />

      {/* ── KPI row ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-5 stagger xl:grid-cols-4">
        <MetricCard label="Total Members" value={loading ? "—" : stats.total} icon={<UsersIcon />} tone="energy" loading={loading} />
        <MetricCard label="Active" value={loading ? "—" : stats.active} icon={<UserCheck />} tone="neutral" loading={loading} />
        <MetricCard label="Inactive" value={loading ? "—" : stats.inactive} icon={<UserX />} tone="neutral" loading={loading} />
        <MetricCard
          label="Renewing ≤ 7 days"
          value={loading ? "—" : stats.renewingSoon}
          icon={<CalendarClock />}
          tone={stats.renewingSoon > 0 ? "energy" : "neutral"}
          changeLabel={stats.renewingSoon > 0 ? "Reach out soon" : "Nothing urgent"}
          loading={loading}
        />
      </div>

      {/* ── Roster ──────────────────────────────────────────────────────────── */}
      <div>
        <SectionHeader
          eyebrow="Roster"
          title="Your members"
          action={<span className="text-xs font-semibold text-(--text-muted)">{filtered.length} shown</span>}
        />

        {/* Filters */}
        <div className="surface-card mb-5 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex-1">
              <SearchInput value={search} onChange={setSearch} placeholder="Search by name, email, or phone" />
            </div>
            <div className="flex gap-2">
              {(["ALL", "ACTIVE", "INACTIVE"] as StatusFilter[]).map((s) => (
                <Button key={s} size="sm" variant={statusFilter === s ? "primary" : "secondary"} onClick={() => setStatusFilter(s)}>
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </Button>
              ))}
            </div>
            {branches.length > 0 && (
              <div className="w-full lg:w-56">
                <Select
                  options={[{ label: "All branches", value: "" }, ...branchOptions]}
                  value={branchFilter}
                  placeholder="All branches"
                  onChange={(e) => setBranchFilter(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="surface-card p-5"><Skeleton height="h-28" /></div>
            ))}
          </div>
        ) : error ? (
          <div className="surface-card">
            <EmptyMomentumState
              icon={<UsersIcon />}
              title="Couldn't load members"
              description={error}
              action={<Button variant="secondary" onClick={() => void loadMembers()}>Retry</Button>}
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="surface-card">
            <EmptyMomentumState
              icon={<UsersIcon />}
              title={members.length === 0 ? "Start building your fitness community" : "No matching members"}
              description={
                members.length === 0
                  ? "Add your first member and begin transforming lives. Every champion starts with day one."
                  : "Try a different search or filter to find who you're looking for."
              }
              action={
                members.length === 0
                  ? <Button iconLeft={<Plus className="h-4 w-4" />} onClick={openCreate}>Add your first member</Button>
                  : undefined
              }
            />
          </div>
        ) : (
          <div className="grid gap-5 stagger sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((m) => (
              <MemberCard
                key={m.id}
                member={m}
                trainerName={trainerName(m)}
                toggling={togglingId === m.id}
                onView={() => navigate(`/gym-admin/members/${m.id}`)}
                onEdit={() => openEdit(m)}
                onToggle={() => void handleToggle(m)}
                onReset={() => setResetTarget(m)}
                onDelete={() => setDeleteTarget(m)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Set new password (admin sets it directly — never generated/shown) */}
      <SetPasswordModal
        open={!!resetTarget}
        onClose={() => setResetTarget(null)}
        subjectName={resetTarget?.user?.name ?? "this member"}
        onSubmit={async (password) => { if (resetTarget) await memberService.resetPassword(resetTarget.id, password); }}
      />

      {/* Delete confirmation */}
      <Modal
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        title="Delete Member"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
            <Button variant="danger" onClick={() => void handleDelete()} loading={deleting}>Delete Permanently</Button>
          </div>
        }
      >
        <p className="text-sm text-(--text-secondary)">
          Permanently delete <strong className="text-(--text-primary)">{deleteTarget?.user?.name}</strong>? This cannot be undone.
          Members with payment, membership, or attendance history cannot be deleted — deactivate them instead.
        </p>
      </Modal>

      {/* Create / edit form */}
      <Modal
        open={formOpen}
        onClose={() => !submitting && setFormOpen(false)}
        title={editingId ? "Edit Member" : "Add Member"}
        description="Personal details, branch assignment, and health profile."
        size="xl"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setFormOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={() => void handleSubmit()} loading={submitting}>
              {editingId ? "Save Changes" : "Create Member"}
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          <Section title="Personal details">
            <Input label="Full name" value={form.name} error={formErrors.name} onChange={(e) => set("name", e.target.value)} />
            <Input label="Email" type="email" value={form.email} error={formErrors.email} onChange={(e) => set("email", e.target.value)} disabled={!!editingId} />
            {!editingId && (
              <Input label="Password" type="password" value={form.password} error={formErrors.password} onChange={(e) => set("password", e.target.value)} placeholder="Min. 6 characters" />
            )}
            <Input label="Phone" value={form.phone} error={formErrors.phone} onChange={(e) => set("phone", e.target.value)} />
            <Select label="Gender" options={GENDER_OPTIONS} value={form.gender} placeholder="Select gender" onChange={(e) => set("gender", e.target.value)} />
            <Input label="Date of birth" type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
            <Input label="Address" value={form.address} onChange={(e) => set("address", e.target.value)} />
            <Input label="Fitness goal" value={form.fitnessGoal} onChange={(e) => set("fitnessGoal", e.target.value)} />
            {!editingId && (
              <Input label="Referral code (optional)" value={form.referralCode} onChange={(e) => set("referralCode", e.target.value)} placeholder="e.g. REF-AB12CD — who referred them" />
            )}
          </Section>

          <Section title="Assignment">
            <Select label="Branch" options={[{ label: "Unassigned", value: "" }, ...branchOptions]} value={form.branchId} placeholder="Unassigned" onChange={(e) => set("branchId", e.target.value)} />
            <Select label="Trainer" options={[{ label: "Unassigned", value: "" }, ...trainerOptions]} value={form.trainerId} placeholder="Unassigned" onChange={(e) => set("trainerId", e.target.value)} />
          </Section>

          <Section title="Health profile">
            <Input label="Emergency contact name" value={form.emergencyContactName} onChange={(e) => set("emergencyContactName", e.target.value)} />
            <Input label="Emergency contact phone" value={form.emergencyContactPhone} onChange={(e) => set("emergencyContactPhone", e.target.value)} />
            <Input label="Health notes" value={form.healthNotes} onChange={(e) => set("healthNotes", e.target.value)} />
            <Input label="Injury notes" value={form.injuryNotes} onChange={(e) => set("injuryNotes", e.target.value)} />
            <Input label="Medical conditions" value={form.medicalConditions} onChange={(e) => set("medicalConditions", e.target.value)} />
          </Section>
        </div>
      </Modal>
    </div>
  );
}

// ─── Member card ───────────────────────────────────────────────────────────────

function MemberCard({
  member: m, trainerName, toggling, onView, onEdit, onToggle, onReset, onDelete,
}: {
  member: Member;
  trainerName: string | null;
  toggling: boolean;
  onView: () => void;
  onEdit: () => void;
  onToggle: () => void;
  onReset: () => void;
  onDelete: () => void;
}) {
  const isActive = m.status === "ACTIVE";
  const renewIn = daysUntil(m.activeMembership?.endDate);
  const plan = m.activeMembership?.planName ?? null;
  const level = m.xp?.level;
  const initial = (m.user?.name ?? "—").charAt(0).toUpperCase();

  return (
    <article className="group surface-card spotlight lift flex flex-col p-5">
      {/* Header */}
      <button onClick={onView} className="flex items-start gap-3 text-left">
        <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-(image:--gradient-primary) text-base font-black text-white shadow-[0_8px_20px_rgba(231,55,37,0.32)]">
          {initial}
          {typeof level === "number" && (
            <span className="absolute -bottom-1.5 -right-1.5 rounded-full border-2 border-(--surface-solid) bg-(--surface-solid) px-1.5 text-[10px] font-black text-primary">
              L{level}
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-black tracking-tight text-(--text-primary) group-hover:text-primary">
            {m.user?.name ?? "—"}
          </p>
          <p className="truncate text-xs text-(--text-muted)">{m.user?.email}</p>
        </div>
        <StatusPill tone={statusTone(m.status)} size="sm">
          {statusLabel(m.status)}
        </StatusPill>
      </button>

      {/* Meta */}
      <dl className="mt-4 grid grid-cols-2 gap-2.5 text-xs">
        <MetaRow icon={<MapPin className="h-3.5 w-3.5" />} label={m.branch?.name ?? "No branch"} />
        <MetaRow icon={<Dumbbell className="h-3.5 w-3.5" />} label={trainerName ?? "No trainer"} />
        <MetaRow icon={<UsersIcon className="h-3.5 w-3.5" />} label={m.phone || "No phone"} />
        <MetaRow icon={<CalendarClock className="h-3.5 w-3.5" />} label={plan ?? "No plan"} />
      </dl>

      {/* Renewal urgency */}
      {renewIn !== null && renewIn <= 14 && (
        <div className="mt-3">
          {renewIn < 0 ? (
            <StatusPill tone="expired" size="sm">Membership expired</StatusPill>
          ) : renewIn <= 7 ? (
            <StatusPill tone="expired" size="sm">Renews in {renewIn === 0 ? "today" : `${renewIn}d`}</StatusPill>
          ) : (
            <StatusPill tone="pending" size="sm">Renews in {renewIn}d</StatusPill>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
        <Button size="sm" variant="secondary" className="flex-1" iconRight={<ArrowRight className="h-3.5 w-3.5" />} onClick={onView}>
          View
        </Button>
        <Button size="sm" variant="ghost" onClick={onEdit}>Edit</Button>
        <Button size="sm" variant={isActive ? "danger" : "success"} loading={toggling} onClick={onToggle}>
          {isActive ? "Deactivate" : "Activate"}
        </Button>
        <Button size="sm" variant="ghost" iconLeft={<KeyRound className="h-3.5 w-3.5" />} onClick={onReset} title="Reset password">
          <span className="sr-only">Reset password</span>
        </Button>
        <Button size="sm" variant="ghost" iconLeft={<Trash2 className="h-3.5 w-3.5 text-primary" />} onClick={onDelete} title="Delete">
          <span className="sr-only">Delete</span>
        </Button>
      </div>
    </article>
  );
}

function MetaRow({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5 text-(--text-secondary)">
      <span className="shrink-0 text-(--text-muted)">{icon}</span>
      <span className="truncate font-medium">{label}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-(--text-primary)">{title}</p>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}
