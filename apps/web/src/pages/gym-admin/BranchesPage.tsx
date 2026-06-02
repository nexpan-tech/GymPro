import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, MapPin } from "lucide-react";
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
  branchService,
  type Branch,
  type CreateBranchPayload,
} from "@/services/branch.service";

interface FormState {
  name: string;
  code: string;
  phone: string;
  email: string;
  address: string;
  city: string;
}

const emptyForm: FormState = {
  name: "",
  code: "",
  phone: "",
  email: "",
  address: "",
  city: "",
};

function suggestCode(name: string) {
  const base = name.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  if (!base) return "";
  return `${base}-${Math.floor(100 + Math.random() * 900)}`;
}

export default function BranchesPage() {
  const toast = useToast();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [codeTouched, setCodeTouched] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadBranches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await branchService.list();
      setBranches(data);
    } catch (err) {
      console.error("Failed to load branches:", err);
      setError("We couldn't load branches. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBranches();
  }, [loadBranches]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return branches;
    return branches.filter(
      (b) =>
        b.name.toLowerCase().includes(query) ||
        b.code.toLowerCase().includes(query) ||
        (b.city ?? "").toLowerCase().includes(query)
    );
  }, [branches, search]);

  function openCreate() {
    setForm(emptyForm);
    setCodeTouched(false);
    setFormErrors({});
    setCreateOpen(true);
  }

  function validate(): boolean {
    const errors: Partial<Record<keyof FormState, string>> = {};
    if (form.name.trim().length < 2) errors.name = "Branch name is required.";
    if (form.code.trim().length < 2) errors.code = "A unique branch code is required.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleCreate() {
    if (!validate()) return;
    try {
      setSubmitting(true);
      const payload: CreateBranchPayload = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
        ...(form.email.trim() ? { email: form.email.trim() } : {}),
        ...(form.address.trim() ? { address: form.address.trim() } : {}),
        ...(form.city.trim() ? { city: form.city.trim() } : {}),
      };
      const created = await branchService.create(payload);
      setBranches((prev) => [created, ...prev]);
      toast.success(`Branch "${created.name}" created.`);
      setCreateOpen(false);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to create branch.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(branch: Branch) {
    try {
      setTogglingId(branch.id);
      const updated = await branchService.update(branch.id, {
        isActive: !branch.isActive,
      });
      setBranches((prev) =>
        prev.map((b) => (b.id === branch.id ? { ...b, isActive: updated.isActive } : b))
      );
      toast.success(
        updated.isActive ? `"${branch.name}" activated.` : `"${branch.name}" deactivated.`
      );
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to update branch.";
      toast.error(message);
    } finally {
      setTogglingId(null);
    }
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // Auto-suggest a code from the name until the user edits the code field.
      if (key === "name" && !codeTouched) {
        next.code = suggestCode(String(value));
      }
      return next;
    });
  }

  return (
    <Page
      title="Branches"
      description="Manage the physical locations of your gym."
      action={
        <Button iconLeft={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Add Branch
        </Button>
      }
    >
      <div className="space-y-6">
        <Card variant="solid" className="p-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name, code, or city"
          />
        </Card>

        {loading ? (
          <Card variant="solid" className="p-4">
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} height="h-12" />
              ))}
            </div>
          </Card>
        ) : error ? (
          <EmptyState
            title="Couldn't load branches"
            message={error}
            action={
              <Button variant="secondary" onClick={() => void loadBranches()}>
                Retry
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<MapPin className="h-7 w-7" />}
            title={branches.length === 0 ? "No branches yet" : "No matching branches"}
            message={
              branches.length === 0
                ? "Add your first physical location (e.g. Salem Branch)."
                : "Try a different search."
            }
            action={
              branches.length === 0 ? (
                <Button iconLeft={<Plus className="h-4 w-4" />} onClick={openCreate}>
                  Add Branch
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Card variant="solid" className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-(--border) text-xs uppercase tracking-wide text-(--text-secondary)">
                  <tr>
                    <th className="px-5 py-3 font-medium">Branch</th>
                    <th className="px-5 py-3 font-medium">Code</th>
                    <th className="px-5 py-3 font-medium">City</th>
                    <th className="px-5 py-3 font-medium">Phone</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--border)">
                  {filtered.map((branch) => (
                    <tr key={branch.id} className="hover:bg-(--surface-hover)">
                      <td className="px-5 py-4 font-medium text-(--text-primary)">
                        {branch.name}
                      </td>
                      <td className="px-5 py-4 text-(--text-secondary)">{branch.code}</td>
                      <td className="px-5 py-4 text-(--text-secondary)">
                        {branch.city ?? "—"}
                      </td>
                      <td className="px-5 py-4 text-(--text-secondary)">
                        {branch.phone ?? "—"}
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={branch.isActive ? "success" : "danger"} dot>
                          {branch.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button
                          size="sm"
                          variant={branch.isActive ? "danger" : "success"}
                          loading={togglingId === branch.id}
                          onClick={() => void handleToggle(branch)}
                        >
                          {branch.isActive ? "Deactivate" : "Activate"}
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
        title="Add Branch"
        description="The branch is automatically linked to your gym."
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setCreateOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={() => void handleCreate()} loading={submitting}>
              Create Branch
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Branch name"
            value={form.name}
            error={formErrors.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="Salem Branch"
          />
          <Input
            label="Branch code"
            value={form.code}
            error={formErrors.code}
            onChange={(e) => {
              setCodeTouched(true);
              updateField("code", e.target.value);
            }}
            placeholder="SALEM-101"
          />
          <Input
            label="Phone (optional)"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            placeholder="+91 90000 00000"
          />
          <Input
            label="Email (optional)"
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder="salem@titanfitness.com"
          />
          <Input
            label="City (optional)"
            value={form.city}
            onChange={(e) => updateField("city", e.target.value)}
            placeholder="Salem"
          />
          <Input
            label="Address (optional)"
            value={form.address}
            onChange={(e) => updateField("address", e.target.value)}
            placeholder="Five Roads, Salem"
          />
        </div>
      </Modal>
    </Page>
  );
}
