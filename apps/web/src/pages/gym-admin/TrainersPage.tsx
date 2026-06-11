import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Dumbbell, UserCheck, Users as UsersIcon, Activity, KeyRound, Trash2, Copy, Crown, CalendarDays } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/forms/Input";
import SearchInput from "@/components/common/SearchInput";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  CommandHero, Highlight, MetricCard, SectionHeader, StatusPill, EmptyMomentumState,
} from "@/components/premium";
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

  const [resetTarget, setResetTarget] = useState<GymUser | null>(null);
  const [resetResult, setResetResult] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GymUser | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const stats = useMemo(() => {
    const total = trainers.length;
    const active = trainers.filter((t) => t.isActive).length;
    const assigned = Object.entries(assignedCount)
      .filter(([id]) => trainers.some((t) => t.id === id))
      .reduce((sum, [, n]) => sum + n, 0);
    const avg = total > 0 ? Math.round((assigned / total) * 10) / 10 : 0;
    return { total, active, assigned, avg };
  }, [trainers, assignedCount]);

  // The most-loaded trainer earns the "Top performer" crown.
  const topAssigned = useMemo(
    () => Math.max(0, ...trainers.map((t) => assignedCount[t.id] ?? 0)),
    [trainers, assignedCount]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return trainers.filter((t) => {
      if (statusFilter === "ACTIVE" && !t.isActive) return false;
      if (statusFilter === "INACTIVE" && t.isActive) return false;
      if (!q) return true;
      return t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q);
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

  async function handleReset() {
    if (!resetTarget) return;
    setResetting(true);
    try {
      const res = await userService.resetPassword(resetTarget.id);
      setResetResult(res.temporaryPassword);
    } catch {
      toast.error("Failed to reset password.");
      setResetTarget(null);
    } finally {
      setResetting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await userService.remove(deleteTarget.id);
      toast.success("Trainer removed.");
      setDeleteTarget(null);
      await load();
    } catch {
      toast.error("Failed to remove trainer.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* ── Trainer Performance Hub hero ────────────────────────────────────── */}
      <CommandHero
        eyebrow="Trainer Performance Hub"
        title={
          <>
            Coaches that make members <Highlight>stay and win.</Highlight>
          </>
        }
        subtitle="See who's carrying the floor, balance the load, and keep your team performing at its best."
        stats={[
          { label: "Trainers", value: loading ? "—" : stats.total.toLocaleString("en-IN") },
          { label: "Members coached", value: loading ? "—" : stats.assigned.toLocaleString("en-IN") },
        ]}
        actions={
          <button
            onClick={openCreate}
            className="press inline-flex items-center gap-1.5 rounded-xl bg-(image:--gradient-primary) px-4 py-2 text-xs font-bold text-white shadow-[0_8px_22px_rgba(231,55,37,0.4)] transition-transform hover:-translate-y-0.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Trainer
          </button>
        }
      />

      {/* ── KPI row ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-5 stagger lg:grid-cols-4">
        <MetricCard label="Total Trainers" value={loading ? "—" : stats.total} icon={<Dumbbell />} tone="energy" loading={loading} />
        <MetricCard label="Active" value={loading ? "—" : stats.active} icon={<UserCheck />} tone="neutral" loading={loading} />
        <MetricCard label="Assigned Members" value={loading ? "—" : stats.assigned} icon={<UsersIcon />} tone="neutral" loading={loading} />
        <MetricCard label="Avg Members / Trainer" value={loading ? "—" : stats.avg} icon={<Activity />} tone="energy" loading={loading} />
      </div>

      {/* ── Team ────────────────────────────────────────────────────────────── */}
      <div>
        <SectionHeader
          eyebrow="The team"
          title="Your coaches"
          action={<span className="text-xs font-semibold text-(--text-muted)">{filtered.length} shown</span>}
        />

        <div className="surface-card mb-5 p-4">
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
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="surface-card p-5"><Skeleton height="h-28" /></div>)}
          </div>
        ) : error ? (
          <div className="surface-card">
            <EmptyMomentumState icon={<Dumbbell />} title="Couldn't load trainers" description={error} action={<Button variant="secondary" onClick={() => void load()}>Retry</Button>} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="surface-card">
            <EmptyMomentumState
              icon={<Dumbbell />}
              title={trainers.length === 0 ? "Assemble your elite coaching team" : "No matching trainers"}
              description={trainers.length === 0 ? "Add your first trainer and start guiding members toward results they'll brag about." : "Try a different search or filter."}
              action={trainers.length === 0 ? <Button iconLeft={<Plus className="h-4 w-4" />} onClick={openCreate}>Add your first trainer</Button> : undefined}
            />
          </div>
        ) : (
          <div className="grid gap-5 stagger sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((t) => {
              const count = assignedCount[t.id] ?? 0;
              const isTop = count > 0 && count === topAssigned;
              return (
                <article key={t.id} className="group surface-card spotlight lift flex flex-col p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-(image:--gradient-primary) text-sm font-black text-white shadow-[0_8px_20px_rgba(231,55,37,0.32)]">
                      {t.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate font-black tracking-tight text-(--text-primary)">{t.name}</p>
                        {isTop && <Crown className="h-4 w-4 shrink-0 text-primary" aria-label="Top performer" />}
                      </div>
                      <p className="truncate text-xs text-(--text-muted)">{t.email}</p>
                    </div>
                    <StatusPill tone={t.isActive ? "active" : "expired"} size="sm">
                      {t.isActive ? "Active" : "Inactive"}
                    </StatusPill>
                  </div>

                  {/* Performance */}
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="metric-number text-3xl text-(--text-primary)">{count}</p>
                      <p className="text-xs font-bold uppercase tracking-wider text-(--text-muted)">members coached</p>
                    </div>
                    {isTop ? (
                      <StatusPill tone="completed" size="sm">Top performer</StatusPill>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-(--text-muted)">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "—"}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
                    <Button size="sm" variant="secondary" className="flex-1" onClick={() => openEdit(t)}>Edit</Button>
                    <Button
                      size="sm"
                      variant={t.isActive ? "danger" : "success"}
                      loading={togglingId === t.id}
                      onClick={() => (t.isActive ? setConfirmToggle(t) : void handleToggle(t))}
                    >
                      {t.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button size="sm" variant="ghost" iconLeft={<KeyRound className="h-3.5 w-3.5" />} onClick={() => { setResetResult(null); setResetTarget(t); }} title="Reset password">
                      <span className="sr-only">Reset password</span>
                    </Button>
                    <Button size="sm" variant="ghost" iconLeft={<Trash2 className="h-3.5 w-3.5 text-primary" />} onClick={() => setDeleteTarget(t)} title="Delete">
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
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

      {/* Reset password */}
      <Modal
        open={!!resetTarget}
        onClose={() => { if (!resetting) { setResetTarget(null); setResetResult(null); } }}
        title="Reset Password"
        size="sm"
        description={resetResult ? undefined : `Generate a new temporary password for ${resetTarget?.name ?? "this trainer"}.`}
        footer={
          resetResult ? (
            <Button onClick={() => { setResetTarget(null); setResetResult(null); }}>Done</Button>
          ) : (
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setResetTarget(null)} disabled={resetting}>Cancel</Button>
              <Button onClick={() => void handleReset()} loading={resetting}>Generate Password</Button>
            </div>
          )
        }
      >
        {resetResult ? (
          <div className="space-y-3">
            <p className="text-sm text-(--text-secondary)">Share this one-time password with the trainer. It won't be shown again.</p>
            <div className="flex items-center justify-between rounded-lg border border-border bg-(--surface-secondary) px-4 py-3">
              <code className="text-lg font-bold tracking-wide text-(--text-primary)">{resetResult}</code>
              <Button size="sm" variant="secondary" iconLeft={<Copy className="h-3.5 w-3.5" />} onClick={() => { navigator.clipboard?.writeText(resetResult); toast.success("Copied"); }}>Copy</Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-(--text-secondary)">A secure temporary password will be generated and shown once.</p>
        )}
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        title="Remove Trainer"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
            <Button variant="danger" onClick={() => void handleDelete()} loading={deleting}>Remove</Button>
          </div>
        }
      >
        <p className="text-sm text-(--text-secondary)">
          Remove <strong className="text-(--text-primary)">{deleteTarget?.name}</strong>? Their assigned members are unassigned automatically. Trainers with chat/feedback/plan history are deactivated instead of hard-deleted.
        </p>
      </Modal>
    </div>
  );
}
