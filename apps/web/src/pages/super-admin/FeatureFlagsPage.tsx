import { useCallback, useEffect, useMemo, useState } from "react";
import { Flag, Plus, Pencil, Power } from "lucide-react";
import Page from "@/components/ui/Page";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/forms/Input";
import Textarea from "@/components/forms/Textarea";
import SearchInput from "@/components/common/SearchInput";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusPill, EmptyMomentumState } from "@/components/premium";
import { useToast } from "@/hooks/useToast";
import { superAdminService, type FeatureFlagRow } from "@/services/superAdmin.service";

interface FormState {
  key: string; label: string; description: string; category: string;
  defaultEnabled: boolean; rolloutPercentage: string; environment: string;
}
const emptyForm: FormState = { key: "", label: "", description: "", category: "", defaultEnabled: true, rolloutPercentage: "", environment: "" };

export default function SuperAdminFeatureFlagsPage() {
  const toast = useToast();
  const [flags, setFlags] = useState<FeatureFlagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [open, setOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setFlags(await superAdminService.listFlags());
    } catch {
      toast.error("Failed to load feature flags.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return flags.filter((f) => !q || f.key.includes(q) || f.label.toLowerCase().includes(q) || (f.category ?? "").toLowerCase().includes(q));
  }, [flags, search]);

  function openCreate() { setEditingKey(null); setForm(emptyForm); setOpen(true); }
  function openEdit(f: FeatureFlagRow) {
    setEditingKey(f.key);
    setForm({
      key: f.key, label: f.label, description: f.description ?? "", category: f.category ?? "",
      defaultEnabled: f.defaultEnabled, rolloutPercentage: f.rolloutPercentage != null ? String(f.rolloutPercentage) : "",
      environment: f.environment ?? "",
    });
    setOpen(true);
  }

  async function submit() {
    if (!editingKey && !/^[a-z0-9-]+$/.test(form.key.trim())) return toast.error("Key must be slug format (a-z, 0-9, hyphens).");
    if (form.label.trim().length < 2) return toast.error("A label is required.");
    setSubmitting(true);
    try {
      const payload = {
        label: form.label.trim(),
        description: form.description || undefined,
        category: form.category || undefined,
        defaultEnabled: form.defaultEnabled,
        rolloutPercentage: form.rolloutPercentage === "" ? null : Number(form.rolloutPercentage),
        environment: form.environment || undefined,
      };
      if (editingKey) {
        await superAdminService.updateFlag(editingKey, payload);
        toast.success("Feature flag updated.");
      } else {
        await superAdminService.createFlag({ key: form.key.trim().toLowerCase(), ...payload } as any);
        toast.success("Feature flag created.");
      }
      setOpen(false);
      await load();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to save feature flag.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleDefault(f: FeatureFlagRow) {
    setBusyKey(f.key);
    try {
      await superAdminService.updateFlag(f.key, { defaultEnabled: !f.defaultEnabled });
      toast.success(`"${f.label}" ${!f.defaultEnabled ? "enabled" : "disabled"} globally.`);
      await load();
    } catch {
      toast.error("Failed to update flag.");
    } finally {
      setBusyKey(null);
    }
  }

  async function deactivate(f: FeatureFlagRow) {
    if (!window.confirm(`Deactivate "${f.label}"? It will be hidden from the catalogue but runtime checks stay intact.`)) return;
    setBusyKey(f.key);
    try {
      await superAdminService.deleteFlag(f.key);
      toast.success(`"${f.label}" deactivated.`);
      await load();
    } catch {
      toast.error("Failed to deactivate flag.");
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <Page
      title="Feature Flags"
      eyebrow="Platform"
      description="Toggle platform capabilities globally or per gym, with safe rollout controls."
      action={<Button iconLeft={<Plus className="h-4 w-4" />} onClick={openCreate}>New Flag</Button>}
    >
      <div className="space-y-6">
        <div className="surface-card p-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by key, label, or category" />
        </div>

        {loading ? (
          <div className="surface-card p-4"><div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height="h-12" />)}</div></div>
        ) : filtered.length === 0 ? (
          <div className="surface-card">
            <EmptyMomentumState icon={<Flag />} title={flags.length === 0 ? "No feature flags yet" : "No matching flags"} description={flags.length === 0 ? "Create your first feature flag to start gating platform capabilities." : "Try a different search."} action={flags.length === 0 ? <Button iconLeft={<Plus className="h-4 w-4" />} onClick={openCreate}>New Flag</Button> : undefined} />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((f) => (
              <div key={f.id} className={`surface-card p-5 ${f.isActive ? "" : "opacity-60"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-black tracking-tight text-(--text-primary)">{f.label}</p>
                      {!f.isActive && <StatusPill tone="neutral" size="sm">Inactive</StatusPill>}
                    </div>
                    <p className="font-mono text-xs text-(--text-muted)">{f.key}</p>
                  </div>
                  <StatusPill tone={f.defaultEnabled ? "active" : "neutral"} size="sm">{f.defaultEnabled ? "On" : "Off"}</StatusPill>
                </div>
                {f.description && <p className="mt-2 text-sm text-(--text-secondary)">{f.description}</p>}
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {f.category && <span className="chip">{f.category}</span>}
                  {f.environment && <span className="chip">{f.environment}</span>}
                  {f.rolloutPercentage != null && <span className="chip">{f.rolloutPercentage}% rollout</span>}
                  <span className="chip">{f.overrides} gym override{f.overrides === 1 ? "" : "s"}</span>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
                  <Button size="sm" variant="secondary" loading={busyKey === f.key} onClick={() => void toggleDefault(f)}>
                    {f.defaultEnabled ? "Disable globally" : "Enable globally"}
                  </Button>
                  <Button size="sm" variant="ghost" iconLeft={<Pencil className="h-3.5 w-3.5" />} onClick={() => openEdit(f)}>Edit</Button>
                  {f.isActive && (
                    <Button size="sm" variant="ghost" iconLeft={<Power className="h-3.5 w-3.5 text-primary" />} onClick={() => void deactivate(f)}>Deactivate</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / edit modal */}
      <Modal
        open={open}
        onClose={() => !submitting && setOpen(false)}
        title={editingKey ? "Edit Feature Flag" : "New Feature Flag"}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={() => void submit()} loading={submitting}>{editingKey ? "Save" : "Create"}</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Key (slug)" value={form.key} disabled={!!editingKey} onChange={(e) => setForm({ ...form, key: e.target.value })} placeholder="e.g. new-onboarding" />
          <Input label="Label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="New Onboarding" />
          <Textarea label="Description" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Core" />
            <Input label="Environment" value={form.environment} onChange={(e) => setForm({ ...form, environment: e.target.value })} placeholder="all" />
          </div>
          <Input label="Rollout % (optional)" type="number" value={form.rolloutPercentage} onChange={(e) => setForm({ ...form, rolloutPercentage: e.target.value })} placeholder="0–100" />
          <label className="flex items-center gap-2 text-sm text-(--text-primary)">
            <input type="checkbox" checked={form.defaultEnabled} onChange={(e) => setForm({ ...form, defaultEnabled: e.target.checked })} />
            Enabled by default (globally)
          </label>
        </div>
      </Modal>
    </Page>
  );
}
