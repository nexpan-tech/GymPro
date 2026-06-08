import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Plus, Dumbbell, UserCheck, Users as UsersIcon, Activity } from "lucide-react";
import Page from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/forms/Input";
import SearchInput from "@/components/common/SearchInput";
import EmptyState from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/hooks/useToast";
import { userService, type GymUser } from "@/services/user.service";
import { memberService } from "@/services/member.service";

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

interface TrainerFormState {
  name: string;
  email: string;
  password: string;
}

const emptyForm: TrainerFormState = { name: "", email: "", password: "" };

export default function TrainersPage() {
  const toast = useToast();
  const [trainers, setTrainers] = useState<GymUser[]>([]);
  // memberId/trainerId pairs → assigned-member counts per trainer
  const [assignedCount, setAssignedCount] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<GymUser | null>(null);
  const [form, setForm] = useState<TrainerFormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<GymUser | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [users, memberRes] = await Promise.all([
        userService.list(),
        memberService.list(),
      ]);
      setTrainers(users.filter((u) => u.role === "TRAINER"));

      const counts: Record<string, number> = {};
      for (const m of memberRes.data.members ?? []) {
        if (m.trainerId) counts[m.trainerId] = (counts[m.trainerId] ?? 0) + 1;
      }
      setAssignedCount(counts);
    } catch {
      setError("Couldn't load trainers. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // ── Stats ──
  const stats = useMemo(() => {
    const total = trainers.length;
    const active = trainers.filter((t) => t.isActive).length;
    const assigned = Object.entries(assignedCount)
      .filter(([id]) => trainers.some((t) => t.id === id))
      .reduce((sum, [, n]) => sum + n, 0);
    const avg = total > 0 ? Math.round((assigned / total) * 10) / 10 : 0;
    return { total, active, assigned, avg };
  }, [trainers, assignedCount]);

  // ── Filter ──
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return trainers.filter((t) => {
      if (statusFilter === "ACTIVE" && !t.isActive) return false;
      if (statusFilter === "INACTIVE" && t.isActive) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q)
      );
    });
  }, [trainers, search, statusFilter]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  }
  function openEdit(t: GymUser) {
    setEditing(t);
    setForm({ name: t.name, email: t.email, password: "" });
    setFormOpen(true);
  }

  async function handleSubmit() {
    if (!form.name.trim()) return toast.error("Trainer name is required.");
    if (!editing) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        return toast.error("Enter a valid email.");
      if (form.password.length < 6)
        return toast.error("Temporary password must be at least 6 characters.");
    }
    setSubmitting(true);
    try {
      if (editing) {
        await userService.update(editing.id, { name: form.name });
        toast.success("Trainer updated.");
      } else {
        await userService.create({
          name: form.name,
          email: form.email,
          password: form.password,
          role: "TRAINER",
        });
        toast.success("Trainer created. They can now log in.");
      }
      setFormOpen(false);
      await load();
    } catch {
      toast.error(
        editing ? "Failed to update trainer." : "Failed to create trainer (email may already exist).",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(t: GymUser) {
    setTogglingId(t.id);
    try {
      await userService.setActive(t.id, !t.isActive);
      toast.success(t.isActive ? "Trainer deactivated." : "Trainer activated.");
      setConfirmToggle(null);
      await load();
    } catch {
      toast.error("Failed to update trainer status.");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <Page
      title="Trainers"
      description="Manage trainers, assignments, and member coaching."
      action={
        <Button iconLeft={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Add Trainer
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SummaryCard label="Total Trainers" value={stats.total} icon={<Dumbbell className="h-5 w-5" />} />
          <SummaryCard label="Active" value={stats.active} tone="success" icon={<UserCheck className="h-5 w-5" />} />
          <SummaryCard label="Assigned Members" value={stats.assigned} icon={<UsersIcon className="h-5 w-5" />} />
          <SummaryCard label="Avg Members / Trainer" value={stats.avg} icon={<Activity className="h-5 w-5" />} />
        </div>

        {/* Search + filter */}
        <Card variant="solid" className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex-1">
              <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email" />
            </div>
            <div className="flex gap-2">
              {(["ALL", "ACTIVE", "INACTIVE"] as StatusFilter[]).map((s) => (
                <Button key={s} size="sm" variant={statusFilter === s ? "primary" : "secondary"} onClick={() => setStatusFilter(s)}>
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* List */}
        {loading ? (
          <Card variant="solid" className="p-4">
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height="h-12" />)}</div>
          </Card>
        ) : error ? (
          <EmptyState title="Couldn't load trainers" message={error} action={<Button variant="secondary" onClick={() => void load()}>Retry</Button>} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Dumbbell className="h-7 w-7" />}
            title={trainers.length === 0 ? "No trainers yet" : "No matching trainers"}
            message={trainers.length === 0 ? "Add your first trainer to start assigning members." : "Try a different search or filter."}
            action={trainers.length === 0 ? <Button iconLeft={<Plus className="h-4 w-4" />} onClick={openCreate}>Add Trainer</Button> : undefined}
          />
        ) : (
          <Card variant="solid" className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-(--border) text-xs uppercase tracking-wide text-(--text-secondary)">
                  <tr>
                    <th className="px-5 py-3 font-medium">Trainer</th>
                    <th className="px-5 py-3 font-medium">Assigned</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Joined</th>
                    <th className="px-5 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--border)">
                  {filtered.map((t) => (
                    <tr key={t.id} className="hover:bg-(--surface-hover)">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(image:--gradient-primary) text-xs font-bold text-white">
                            {t.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-(--text-primary)">{t.name}</div>
                            <div className="truncate text-xs text-(--text-secondary)">{t.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-(--text-secondary)">
                        {assignedCount[t.id] ?? 0} member{(assignedCount[t.id] ?? 0) !== 1 ? "s" : ""}
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={t.isActive ? "success" : "danger"} dot>
                          {t.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-(--text-secondary)">
                        {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="secondary" onClick={() => openEdit(t)}>Edit</Button>
                          <Button
                            size="sm"
                            variant={t.isActive ? "danger" : "success"}
                            loading={togglingId === t.id}
                            onClick={() => (t.isActive ? setConfirmToggle(t) : void handleToggle(t))}
                          >
                            {t.isActive ? "Deactivate" : "Activate"}
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

      {/* Create / Edit modal */}
      <Modal
        open={formOpen}
        onClose={() => !submitting && setFormOpen(false)}
        title={editing ? "Edit Trainer" : "Add Trainer"}
        description={editing ? "Update the trainer's details." : "Create a trainer account — they can log in immediately."}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setFormOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleSubmit} loading={submitting}>{editing ? "Save Changes" : "Create Trainer"}</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Full Name" placeholder="Jane Smith" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          <Input label="Email" type="email" placeholder="trainer@gym.com" value={form.email} disabled={!!editing} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
          {!editing ? (
            <Input label="Temporary Password" type="password" placeholder="Min. 6 characters" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
          ) : (
            <p className="rounded-xl bg-(--surface-secondary) p-3 text-xs text-(--text-secondary)">
              To deactivate this trainer or reset access, use the Deactivate action. Status:{" "}
              <strong>{editing.isActive ? "Active" : "Inactive"}</strong>.
            </p>
          )}
        </div>
      </Modal>

      {/* Deactivate confirmation */}
      <Modal
        open={!!confirmToggle}
        onClose={() => setConfirmToggle(null)}
        title="Deactivate trainer?"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setConfirmToggle(null)}>Cancel</Button>
            <Button variant="danger" loading={togglingId === confirmToggle?.id} onClick={() => confirmToggle && void handleToggle(confirmToggle)}>Deactivate</Button>
          </div>
        }
      >
        <p className="text-sm text-(--text-secondary)">
          <strong>{confirmToggle?.name}</strong> will no longer be able to log in. Their assigned members and plans are kept. You can reactivate them anytime.
        </p>
      </Modal>
    </Page>
  );
}

function SummaryCard({ label, value, icon, tone = "default" }: { label: string; value: number; icon: ReactNode; tone?: "default" | "success" | "danger" }) {
  const toneClass =
    tone === "success" ? "text-emerald-600 dark:text-emerald-400" : tone === "danger" ? "text-red-600 dark:text-red-400" : "text-indigo-600 dark:text-indigo-400";
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
