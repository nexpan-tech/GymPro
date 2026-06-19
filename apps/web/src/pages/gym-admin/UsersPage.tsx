import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Users as UsersIcon } from "lucide-react";
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
import {
  userService,
  type GymUser,
  type GymAssignableRole,
  type CreateUserPayload,
} from "@/services/user.service";

// Admins page manages STAFF only. Members + Trainers have their own pages.
// NOTE: Receptionist is RESERVED FOR V2 — hidden from the gym-admin role
// selector (backend support + Super Admin creation + existing receptionist
// logins all remain intact; we only stop offering it as a new gym-admin choice).
const ROLE_OPTIONS: { label: string; value: GymAssignableRole }[] = [
  { label: "Gym Admin", value: "ADMIN" },
  // { label: "Receptionist", value: "RECEPTIONIST" }, // V2 reserved
];

// Roles surfaced on the Admins page (read filter). RECEPTIONIST kept so any
// existing (or Super-Admin-created) receptionists still appear in the list.
const STAFF_ROLES = ["ADMIN", "RECEPTIONIST", "BRANCH_MANAGER", "REGIONAL_MANAGER"];

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Gym Admin",
  RECEPTIONIST: "Receptionist",
  BRANCH_MANAGER: "Branch Manager",
  REGIONAL_MANAGER: "Regional Manager",
};

interface FormState {
  name: string;
  email: string;
  password: string;
  role: GymAssignableRole;
}

const emptyForm: FormState = {
  name: "",
  email: "",
  password: "",
  role: "ADMIN",
};

function roleVariant(role: string): "primary" | "info" | "success" | "default" {
  if (role === "ADMIN") return "primary";
  if (role === "TRAINER") return "info";
  if (role === "RECEPTIONIST") return "success";
  return "default";
}

export default function UsersPage() {
  const toast = useToast();

  const [users, setUsers] = useState<GymUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Admins page = staff accounts only (members + trainers have their own pages).
      const data = await userService.listByRoles(STAFF_ROLES);
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users:", err);
      setError("We couldn't load users. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.role.toLowerCase().includes(query)
    );
  }, [users, search]);

  function openCreate() {
    setForm(emptyForm);
    setFormErrors({});
    setCreateOpen(true);
  }

  function validate(): boolean {
    const errors: Partial<Record<keyof FormState, string>> = {};
    if (form.name.trim().length < 2) errors.name = "Name is required.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email))
      errors.email = "A valid email is required.";
    if (form.password.length < 6)
      errors.password = "Password must be at least 6 characters.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleCreate() {
    if (!validate()) return;
    try {
      setSubmitting(true);
      const payload: CreateUserPayload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      };
      const created = await userService.create(payload);
      setUsers((prev) => [created, ...prev]);
      toast.success(`${ROLE_LABELS[created.role] ?? "User"} "${created.name}" created.`);
      setCreateOpen(false);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to create user.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(user: GymUser) {
    try {
      setTogglingId(user.id);
      const updated = await userService.setActive(user.id, !user.isActive);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: updated.isActive } : u))
      );
      toast.success(
        updated.isActive ? `"${user.name}" activated.` : `"${user.name}" deactivated.`
      );
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to update user.";
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
      title="Admins"
      description="Manage staff and admin accounts for your gym."
      action={
        <Button iconLeft={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Add User
        </Button>
      }
    >
      <div className="space-y-6">
        <Card variant="solid" className="p-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name, email, or role"
          />
        </Card>

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
            title="Couldn't load users"
            message={error}
            action={
              <Button variant="secondary" onClick={() => void loadUsers()}>
                Retry
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<UsersIcon className="h-7 w-7" />}
            title={users.length === 0 ? "No users yet" : "No matching users"}
            message={
              users.length === 0
                ? "Add your first gym admin, trainer, or member."
                : "Try a different search."
            }
            action={
              users.length === 0 ? (
                <Button iconLeft={<Plus className="h-4 w-4" />} onClick={openCreate}>
                  Add User
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
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-5 py-3 font-medium">Email</th>
                    <th className="px-5 py-3 font-medium">Role</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((user) => (
                    <tr key={user.id} className="hover:bg-(--surface-hover)">
                      <td className="px-5 py-4 font-medium text-(--text-primary)">
                        {user.name}
                      </td>
                      <td className="px-5 py-4 text-(--text-secondary)">{user.email}</td>
                      <td className="px-5 py-4">
                        <Badge variant={roleVariant(user.role)}>
                          {ROLE_LABELS[user.role] ?? user.role}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={user.isActive ? "success" : "danger"} dot>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button
                          size="sm"
                          variant={user.isActive ? "danger" : "success"}
                          loading={togglingId === user.id}
                          onClick={() => void handleToggle(user)}
                        >
                          {user.isActive ? "Deactivate" : "Activate"}
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

      <Modal
        open={createOpen}
        onClose={() => !submitting && setCreateOpen(false)}
        title="Add Admin"
        description="Create a staff or admin account inside your gym."
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setCreateOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={() => void handleCreate()} loading={submitting}>
              Create User
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Full name"
            value={form.name}
            error={formErrors.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="Arun Kumar"
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            error={formErrors.email}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder="arun@example.com"
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            error={formErrors.password}
            onChange={(e) => updateField("password", e.target.value)}
            placeholder="Min. 6 characters"
          />
          <Select
            label="Role"
            options={ROLE_OPTIONS}
            value={form.role}
            placeholder="Select a role"
            onChange={(e) => updateField("role", e.target.value as GymAssignableRole)}
          />
        </div>
      </Modal>
    </Page>
  );
}
