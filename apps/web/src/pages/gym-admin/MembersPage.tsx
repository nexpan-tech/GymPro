import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Users as UsersIcon, UserCheck, UserX } from "lucide-react";
import Page from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/forms/Input";
import Select from "@/components/forms/Select";
import SearchInput from "@/components/common/SearchInput";
import EmptyState from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/hooks/useToast";
import { memberService, type CreateMemberPayload } from "@/services/member.service";
import { branchService, type Branch } from "@/services/branch.service";
import { userService, type GymUser } from "@/services/user.service";
import type { Member } from "@/types/member.types";

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

interface FormState {
  name: string;
  email: string;
  password: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  fitnessGoal: string;
  branchId: string;
  trainerId: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  healthNotes: string;
  injuryNotes: string;
  medicalConditions: string;
}

const emptyForm: FormState = {
  name: "", email: "", password: "", phone: "", gender: "", dateOfBirth: "",
  address: "", fitnessGoal: "", branchId: "", trainerId: "",
  emergencyContactName: "", emergencyContactPhone: "", healthNotes: "",
  injuryNotes: "", medicalConditions: "",
};

const GENDER_OPTIONS = [
  { label: "Male", value: "MALE" },
  { label: "Female", value: "FEMALE" },
  { label: "Other", value: "OTHER" },
];

function errMsg(err: unknown, fallback: string) {
  return (
    (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback
  );
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
    // Branches + trainers feed the assignment dropdowns; failures are non-fatal.
    branchService.list().then(setBranches).catch(() => undefined);
    userService
      .list()
      .then((users) => setTrainers(users.filter((u) => u.role === "TRAINER")))
      .catch(() => undefined);
  }, [loadMembers]);

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
    return { total, active, inactive: total - active };
  }, [members]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormErrors({});
    setFormOpen(true);
  }

  function openEdit(m: Member) {
    setEditingId(m.id);
    setForm({
      name: m.user?.name ?? "",
      email: m.user?.email ?? "",
      password: "",
      phone: m.phone ?? "",
      gender: (m.gender as string) ?? "",
      dateOfBirth: m.dateOfBirth ? m.dateOfBirth.slice(0, 10) : "",
      address: m.address ?? "",
      fitnessGoal: m.fitnessGoal ?? "",
      branchId: m.branchId ?? "",
      trainerId: m.trainerId ?? "",
      emergencyContactName: m.emergencyContactName ?? "",
      emergencyContactPhone: m.emergencyContactPhone ?? "",
      healthNotes: m.healthNotes ?? "",
      injuryNotes: m.injuryNotes ?? "",
      medicalConditions: m.medicalConditions ?? "",
    });
    setFormErrors({});
    setFormOpen(true);
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
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
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

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  const branchOptions = branches.map((b) => ({ label: b.name, value: b.id }));
  const trainerOptions = trainers.map((t) => ({ label: t.name, value: t.id }));

  return (
    <Page
      title="Members"
      description="Manage your gym members, branches, and health profiles."
      action={
        <Button iconLeft={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Add Member
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <SummaryCard label="Total Members" value={stats.total} icon={<UsersIcon className="h-5 w-5" />} />
          <SummaryCard label="Active" value={stats.active} tone="success" icon={<UserCheck className="h-5 w-5" />} />
          <SummaryCard label="Inactive" value={stats.inactive} tone="danger" icon={<UserX className="h-5 w-5" />} />
        </div>

        <Card variant="solid" className="p-4">
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
        </Card>

        {loading ? (
          <Card variant="solid" className="p-4">
            <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height="h-12" />)}</div>
          </Card>
        ) : error ? (
          <EmptyState title="Couldn't load members" message={error} action={<Button variant="secondary" onClick={() => void loadMembers()}>Retry</Button>} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<UsersIcon className="h-7 w-7" />}
            title={members.length === 0 ? "No members yet" : "No matching members"}
            message={members.length === 0 ? "Add your first gym member." : "Try different filters."}
            action={members.length === 0 ? <Button iconLeft={<Plus className="h-4 w-4" />} onClick={openCreate}>Add Member</Button> : undefined}
          />
        ) : (
          <Card variant="solid" className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-(--border) text-xs uppercase tracking-wide text-(--text-secondary)">
                  <tr>
                    <th className="px-5 py-3 font-medium">Member</th>
                    <th className="px-5 py-3 font-medium">Phone</th>
                    <th className="px-5 py-3 font-medium">Branch</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--border)">
                  {filtered.map((m) => (
                    <tr
                      key={m.id}
                      className="cursor-pointer hover:bg-(--surface-hover)"
                      onClick={() => navigate(`/gym-admin/members/${m.id}`)}
                    >
                      <td className="px-5 py-4">
                        <div className="font-medium text-(--text-primary)">{m.user?.name ?? "—"}</div>
                        <div className="text-xs text-(--text-secondary)">{m.user?.email}</div>
                      </td>
                      <td className="px-5 py-4 text-(--text-secondary)">{m.phone}</td>
                      <td className="px-5 py-4 text-(--text-secondary)">{m.branch?.name ?? "—"}</td>
                      <td className="px-5 py-4">
                        <Badge variant={m.status === "ACTIVE" ? "success" : "danger"} dot>
                          {m.status === "ACTIVE" ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="secondary" onClick={() => openEdit(m)}>Edit</Button>
                          <Button
                            size="sm"
                            variant={m.status === "ACTIVE" ? "danger" : "success"}
                            loading={togglingId === m.id}
                            onClick={() => void handleToggle(m)}
                          >
                            {m.status === "ACTIVE" ? "Deactivate" : "Activate"}
                          </Button>
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
    </Page>
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

function SummaryCard({ label, value, icon, tone = "default" }: { label: string; value: number; icon: ReactNode; tone?: "default" | "success" | "danger"; }) {
  const toneClass = tone === "success" ? "text-emerald-600 dark:text-emerald-400" : tone === "danger" ? "text-red-600 dark:text-red-400" : "text-indigo-600 dark:text-indigo-400";
  return (
    <Card variant="solid" className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-(--text-secondary)">{label}</span>
        <span className={toneClass}>{icon}</span>
      </div>
      <div className="mt-2 text-2xl font-bold text-(--text-primary)">{value}</div>
    </Card>
  );
}
