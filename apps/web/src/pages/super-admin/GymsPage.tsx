import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Building2, Plus, Users, Power } from "lucide-react";
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
import {
  gymService,
  type PlatformGym,
  type CreateGymPayload,
} from "@/services/gym.service";

type StatusFilter = "ALL" | "ACTIVE" | "SUSPENDED";

interface FormState {
  name: string;
  email: string;
  phone: string;
  address: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

const emptyForm: FormState = {
  name: "",
  email: "",
  phone: "",
  address: "",
  adminName: "",
  adminEmail: "",
  adminPassword: "",
};

function formatDate(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function GymsPage() {
  const toast = useToast();

  const [gyms, setGyms] = useState<PlatformGym[]>([]);
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
      const data = await gymService.list();
      setGyms(data);
    } catch (err) {
      console.error("Failed to load gyms:", err);
      setError("We couldn't load gyms. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGyms();
  }, [loadGyms]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return gyms.filter((gym) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && gym.isActive) ||
        (statusFilter === "SUSPENDED" && !gym.isActive);
      const matchesQuery =
        !query ||
        gym.name.toLowerCase().includes(query) ||
        gym.email.toLowerCase().includes(query);
      return matchesStatus && matchesQuery;
    });
  }, [gyms, search, statusFilter]);

  const stats = useMemo(() => {
    const total = gyms.length;
    const active = gyms.filter((g) => g.isActive).length;
    const members = gyms.reduce((sum, g) => sum + (g._count?.members ?? 0), 0);
    return { total, active, suspended: total - active, members };
  }, [gyms]);

  function openCreate() {
    setForm(emptyForm);
    setFormErrors({});
    setCreateOpen(true);
  }

  function validate(): boolean {
    const errors: Partial<Record<keyof FormState, string>> = {};
    if (form.name.trim().length < 2) errors.name = "Gym name is required.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email))
      errors.email = "A valid gym contact email is required.";

    const anyAdmin =
      form.adminName || form.adminEmail || form.adminPassword;
    if (anyAdmin) {
      if (form.adminName.trim().length < 2)
        errors.adminName = "Admin name is required.";
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.adminEmail))
        errors.adminEmail = "A valid admin email is required.";
      if (form.adminPassword.length < 6)
        errors.adminPassword = "Password must be at least 6 characters.";
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
        ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
        ...(form.address.trim() ? { address: form.address.trim() } : {}),
        ...(form.adminName.trim()
          ? {
              adminName: form.adminName.trim(),
              adminEmail: form.adminEmail.trim(),
              adminPassword: form.adminPassword,
            }
          : {}),
      };
      const result = await gymService.create(payload);
      setGyms((prev) => [result.gym, ...prev]);
      toast.success(`Gym "${result.gym.name}" created.`);
      setCreateOpen(false);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to create gym.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(gym: PlatformGym) {
    try {
      setTogglingId(gym.id);
      const updated = gym.isActive
        ? await gymService.deactivate(gym.id)
        : await gymService.activate(gym.id);
      setGyms((prev) =>
        prev.map((g) => (g.id === gym.id ? { ...g, isActive: updated.isActive } : g))
      );
      toast.success(
        updated.isActive
          ? `"${gym.name}" reactivated.`
          : `"${gym.name}" suspended.`
      );
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to update gym status.";
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
      description="Create and manage every gym on the platform."
      action={
        <Button iconLeft={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Create Gym
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SummaryCard label="Total Gyms" value={stats.total} icon={<Building2 className="h-5 w-5" />} />
          <SummaryCard label="Active" value={stats.active} icon={<Power className="h-5 w-5" />} tone="success" />
          <SummaryCard label="Suspended" value={stats.suspended} icon={<Power className="h-5 w-5" />} tone="danger" />
          <SummaryCard label="Total Members" value={stats.members} icon={<Users className="h-5 w-5" />} />
        </div>

        {/* Filters */}
        <Card variant="solid" className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search by gym name or email"
              />
            </div>
            <div className="flex gap-2">
              {(["ALL", "ACTIVE", "SUSPENDED"] as StatusFilter[]).map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={statusFilter === s ? "primary" : "secondary"}
                  onClick={() => setStatusFilter(s)}
                >
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Content states */}
        {loading ? (
          <Card variant="solid" className="p-4">
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} height="h-12" />
              ))}
            </div>
          </Card>
        ) : error ? (
          <EmptyState
            title="Couldn't load gyms"
            message={error}
            action={
              <Button variant="secondary" onClick={() => void loadGyms()}>
                Retry
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Building2 className="h-7 w-7" />}
            title={gyms.length === 0 ? "No gyms yet" : "No matching gyms"}
            message={
              gyms.length === 0
                ? "Create your first gym to get the platform started."
                : "Try a different search or status filter."
            }
            action={
              gyms.length === 0 ? (
                <Button iconLeft={<Plus className="h-4 w-4" />} onClick={openCreate}>
                  Create Gym
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Card variant="solid" className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase tracking-wide text-(--text-secondary)">
                  <tr>
                    <th className="px-5 py-3 font-medium">Gym</th>
                    <th className="px-5 py-3 font-medium">Admin</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Members</th>
                    <th className="px-5 py-3 font-medium">Branches</th>
                    <th className="px-5 py-3 font-medium">Created</th>
                    <th className="px-5 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((gym) => {
                    const admin = gym.users?.find((u) => u.role === "ADMIN");
                    return (
                      <tr key={gym.id} className="hover:bg-(--surface-hover)">
                        <td className="px-5 py-4">
                          <div className="font-medium text-(--text-primary)">{gym.name}</div>
                          <div className="text-xs text-(--text-secondary)">{gym.email}</div>
                        </td>
                        <td className="px-5 py-4 text-(--text-secondary)">
                          {admin ? (
                            <div>
                              <div className="text-(--text-primary)">{admin.name}</div>
                              <div className="text-xs">{admin.email}</div>
                            </div>
                          ) : (
                            <span className="text-xs italic">Not assigned</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant={gym.isActive ? "success" : "danger"} dot>
                            {gym.isActive ? "Active" : "Suspended"}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-(--text-secondary)">
                          {gym._count?.members ?? 0}
                        </td>
                        <td className="px-5 py-4 text-(--text-secondary)">
                          {gym._count?.users ?? "—"}
                        </td>
                        <td className="px-5 py-4 text-(--text-secondary)">
                          {formatDate(gym.createdAt)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Button
                            size="sm"
                            variant={gym.isActive ? "danger" : "success"}
                            loading={togglingId === gym.id}
                            onClick={() => void handleToggleStatus(gym)}
                          >
                            {gym.isActive ? "Suspend" : "Reactivate"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
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
        description="Set up a new gym and optionally its first admin account."
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setCreateOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={() => void handleCreate()} loading={submitting}>
              Create Gym
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Gym name"
              value={form.name}
              error={formErrors.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Titan Fitness"
            />
            <Input
              label="Gym contact email"
              type="email"
              value={form.email}
              error={formErrors.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="contact@titanfitness.com"
            />
            <Input
              label="Phone (optional)"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="+91 90000 00000"
            />
            <Input
              label="Address (optional)"
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              placeholder="Salem, Tamil Nadu"
            />
          </div>

          <div className="rounded-xl border border-border p-4">
            <p className="mb-3 text-sm font-semibold text-(--text-primary)">
              Gym Admin (optional)
            </p>
            <p className="mb-4 text-xs text-(--text-secondary)">
              Assign the owner/admin who will manage this gym. Leave blank to add later.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Admin name"
                value={form.adminName}
                error={formErrors.adminName}
                onChange={(e) => updateField("adminName", e.target.value)}
                placeholder="Ramesh Kumar"
              />
              <Input
                label="Admin email"
                type="email"
                value={form.adminEmail}
                error={formErrors.adminEmail}
                onChange={(e) => updateField("adminEmail", e.target.value)}
                placeholder="admin@titanfitness.com"
              />
              <Input
                label="Admin password"
                type="password"
                value={form.adminPassword}
                error={formErrors.adminPassword}
                onChange={(e) => updateField("adminPassword", e.target.value)}
                placeholder="Min. 6 characters"
              />
            </div>
          </div>
        </div>
      </Modal>
    </Page>
  );
}

// ─── Local summary card ───────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value: number;
  icon: ReactNode;
  tone?: "default" | "success" | "danger";
}) {
  const toneClasses =
    tone === "success"
      ? "text-muted-foreground"
      : tone === "danger"
        ? "text-primary"
        : "text-primary";
  return (
    <Card variant="solid" className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-(--text-secondary)">{label}</span>
        <span className={toneClasses}>{icon}</span>
      </div>
      <div className="mt-2 text-2xl font-bold text-(--text-primary)">{value}</div>
    </Card>
  );
}
