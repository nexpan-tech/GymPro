import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Building2, Plus, Users, Power, IndianRupee } from "lucide-react";
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
import { gymService, type CreateGymPayload } from "@/services/gym.service";
import { superAdminService, type PlatformGymRow } from "@/services/superAdmin.service";

type StatusFilter = "ALL" | "ACTIVE" | "SUSPENDED";

interface FormState {
  name: string;
  email: string;
  phone: string;
  address: string;
  pricePerActiveMember: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

const emptyForm: FormState = {
  name: "", email: "", phone: "", address: "", pricePerActiveMember: "",
  adminName: "", adminEmail: "", adminPassword: "",
};

const inr = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
function formatDate(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function GymsPage() {
  const toast = useToast();

  const [gyms, setGyms] = useState<PlatformGymRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadGyms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setGyms(await superAdminService.getGyms());
    } catch (err) {
      console.error("Failed to load gyms:", err);
      setError("We couldn't load gyms. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadGyms(); }, [loadGyms]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return gyms.filter((gym) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && gym.isActive) ||
        (statusFilter === "SUSPENDED" && !gym.isActive);
      const matchesQuery =
        !query || gym.name.toLowerCase().includes(query) || gym.email.toLowerCase().includes(query);
      return matchesStatus && matchesQuery;
    });
  }, [gyms, search, statusFilter]);

  const stats = useMemo(() => {
    const total = gyms.length;
    const active = gyms.filter((g) => g.isActive).length;
    const activeMembers = gyms.reduce((sum, g) => sum + g.activeMemberCount, 0);
    return { total, active, suspended: total - active, activeMembers };
  }, [gyms]);

  function openCreate() {
    setForm(emptyForm);
    setFormErrors({});
    setCreateOpen(true);
  }

  function validate(): boolean {
    const errors: Partial<Record<keyof FormState, string>> = {};
    if (form.name.trim().length < 2) errors.name = "Gym name is required.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) errors.email = "A valid gym contact email is required.";
    const price = Number(form.pricePerActiveMember);
    if (form.pricePerActiveMember.trim() === "" || Number.isNaN(price) || price < 0)
      errors.pricePerActiveMember = "Set a price per active member (₹, 0 or more).";

    const anyAdmin = form.adminName || form.adminEmail || form.adminPassword;
    if (anyAdmin) {
      if (form.adminName.trim().length < 2) errors.adminName = "Admin name is required.";
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.adminEmail)) errors.adminEmail = "A valid admin email is required.";
      if (form.adminPassword.length < 6) errors.adminPassword = "Password must be at least 6 characters.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleCreate() {
    if (!validate()) return;
    try {
      setSubmitting(true);
      const payload: CreateGymPayload = {
        name: form.name.trim(),
        email: form.email.trim(),
        pricePerActiveMember: Number(form.pricePerActiveMember),
        ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
        ...(form.address.trim() ? { address: form.address.trim() } : {}),
        ...(form.adminName.trim()
          ? { adminName: form.adminName.trim(), adminEmail: form.adminEmail.trim(), adminPassword: form.adminPassword }
          : {}),
      };
      const result = await gymService.create(payload);
      toast.success(`Gym "${result.gym.name}" created.`);
      setCreateOpen(false);
      await loadGyms(); // refetch so the new row carries real counts + pricing
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to create gym.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(gym: PlatformGymRow) {
    try {
      setTogglingId(gym.id);
      const updated = gym.isActive ? await gymService.deactivate(gym.id) : await gymService.activate(gym.id);
      setGyms((prev) =>
        prev.map((g) => (g.id === gym.id ? { ...g, isActive: updated.isActive, subscriptionStatus: updated.isActive ? "ACTIVE" : "SUSPENDED" } : g)),
      );
      toast.success(updated.isActive ? `"${gym.name}" reactivated.` : `"${gym.name}" suspended.`);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to update gym status.";
      toast.error(message);
    } finally {
      setTogglingId(null);
    }
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <Page
      title="Gyms"
      eyebrow="Platform"
      description="Create and manage every gym, with real member counts and SaaS pricing."
      action={<Button iconLeft={<Plus className="h-4 w-4" />} onClick={openCreate}>Create Gym</Button>}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SummaryCard label="Total Gyms" value={String(stats.total)} icon={<Building2 className="h-5 w-5" />} />
          <SummaryCard label="Active" value={String(stats.active)} icon={<Power className="h-5 w-5" />} />
          <SummaryCard label="Suspended" value={String(stats.suspended)} icon={<Power className="h-5 w-5" />} />
          <SummaryCard label="Active Members" value={stats.activeMembers.toLocaleString("en-IN")} icon={<Users className="h-5 w-5" />} />
        </div>

        <Card variant="solid" className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <SearchInput value={search} onChange={setSearch} placeholder="Search by gym name or email" />
            </div>
            <div className="flex gap-2">
              {(["ALL", "ACTIVE", "SUSPENDED"] as StatusFilter[]).map((s) => (
                <Button key={s} size="sm" variant={statusFilter === s ? "primary" : "secondary"} onClick={() => setStatusFilter(s)}>
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {loading ? (
          <Card variant="solid" className="p-4">
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height="h-12" />)}</div>
          </Card>
        ) : error ? (
          <EmptyState title="Couldn't load gyms" message={error} action={<Button variant="secondary" onClick={() => void loadGyms()}>Retry</Button>} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Building2 className="h-7 w-7" />}
            title={gyms.length === 0 ? "No gyms yet" : "No matching gyms"}
            message={gyms.length === 0 ? "Create your first gym to get the platform started." : "Try a different search or status filter."}
            action={gyms.length === 0 ? <Button iconLeft={<Plus className="h-4 w-4" />} onClick={openCreate}>Create Gym</Button> : undefined}
          />
        ) : (
          <Card variant="solid" className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase tracking-wide text-(--text-secondary)">
                  <tr>
                    <th className="px-5 py-3 font-medium">Gym</th>
                    <th className="px-5 py-3 font-medium">Branches</th>
                    <th className="px-5 py-3 font-medium">Active / Total</th>
                    <th className="px-5 py-3 font-medium">Staff</th>
                    <th className="px-5 py-3 font-medium">₹ / Member</th>
                    <th className="px-5 py-3 font-medium">Monthly SaaS</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((gym) => (
                    <tr key={gym.id} className="hover:bg-(--surface-hover)">
                      <td className="px-5 py-4">
                        <div className="font-medium text-(--text-primary)">{gym.name}</div>
                        <div className="text-xs text-(--text-secondary)">{gym.email}</div>
                        <div className="text-[11px] text-(--text-muted)">Since {formatDate(gym.createdAt)}</div>
                      </td>
                      <td className="px-5 py-4 tabular-nums text-(--text-secondary)">{gym.branchCount}</td>
                      <td className="px-5 py-4 tabular-nums">
                        <span className="font-semibold text-(--text-primary)">{gym.activeMemberCount}</span>
                        <span className="text-(--text-muted)"> / {gym.totalMemberCount}</span>
                      </td>
                      <td className="px-5 py-4 tabular-nums text-(--text-secondary)">
                        {gym.gymAdminCount} admin · {gym.trainerCount} trainer
                      </td>
                      <td className="px-5 py-4 tabular-nums text-(--text-secondary)">{inr(gym.pricePerActiveMember)}</td>
                      <td className="px-5 py-4 tabular-nums font-semibold text-(--text-primary)">{inr(gym.monthlyAmount)}</td>
                      <td className="px-5 py-4">
                        <Badge variant={gym.isActive ? "success" : "danger"} dot>{gym.isActive ? "Active" : "Suspended"}</Badge>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button size="sm" variant={gym.isActive ? "danger" : "success"} loading={togglingId === gym.id} onClick={() => void handleToggleStatus(gym)}>
                          {gym.isActive ? "Suspend" : "Reactivate"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Create Gym modal */}
      <Modal
        open={createOpen}
        onClose={() => !submitting && setCreateOpen(false)}
        title="Create Gym"
        description="Set up a new gym, its SaaS price per active member, and optionally its first admin."
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setCreateOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={() => void handleCreate()} loading={submitting}>Create Gym</Button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Gym name" value={form.name} error={formErrors.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Titan Fitness" />
            <Input label="Gym contact email" type="email" value={form.email} error={formErrors.email} onChange={(e) => updateField("email", e.target.value)} placeholder="contact@titanfitness.com" />
            <Input label="Phone (optional)" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="+91 90000 00000" />
            <Input label="Address (optional)" value={form.address} onChange={(e) => updateField("address", e.target.value)} placeholder="Salem, Tamil Nadu" />
          </div>

          {/* SaaS pricing — per active member, per month (INR) */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
            <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-(--text-primary)">
              <IndianRupee className="h-4 w-4 text-primary" /> SaaS price per active member / month
            </p>
            <p className="mb-3 text-xs text-(--text-secondary)">
              Each gym is billed <strong>active members × this price</strong> every month (plus GST). e.g. 20 members × ₹20 = ₹400/month.
            </p>
            <Input
              label="Price per active member (₹)"
              type="number"
              value={form.pricePerActiveMember}
              error={formErrors.pricePerActiveMember}
              onChange={(e) => updateField("pricePerActiveMember", e.target.value)}
              placeholder="e.g. 20"
            />
          </div>

          <div className="rounded-xl border border-border p-4">
            <p className="mb-3 text-sm font-semibold text-(--text-primary)">Gym Admin (optional)</p>
            <p className="mb-4 text-xs text-(--text-secondary)">Assign the owner/admin who will manage this gym. Leave blank to add later.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Admin name" value={form.adminName} error={formErrors.adminName} onChange={(e) => updateField("adminName", e.target.value)} placeholder="Ramesh Kumar" />
              <Input label="Admin email" type="email" value={form.adminEmail} error={formErrors.adminEmail} onChange={(e) => updateField("adminEmail", e.target.value)} placeholder="admin@titanfitness.com" />
              <Input label="Admin password" type="password" value={form.adminPassword} error={formErrors.adminPassword} onChange={(e) => updateField("adminPassword", e.target.value)} placeholder="Min. 6 characters" />
            </div>
          </div>
        </div>
      </Modal>
    </Page>
  );
}

function SummaryCard({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <Card variant="solid" className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-(--text-secondary)">{label}</span>
        <span className="text-primary">{icon}</span>
      </div>
      <div className="mt-2 text-2xl font-bold text-(--text-primary)">{value}</div>
    </Card>
  );
}
