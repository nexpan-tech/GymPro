import { useCallback, useEffect, useMemo, useState } from "react";
import { CreditCard, Plus, Pencil, Archive, RotateCcw, Users, Building2, UserCog, Sparkles, HardDrive, Palette, LifeBuoy, Check } from "lucide-react";
import Page from "@/components/ui/Page";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/forms/Input";
import Select from "@/components/forms/Select";
import Textarea from "@/components/forms/Textarea";
import SearchInput from "@/components/common/SearchInput";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatTile, SectionHeader, StatusPill, EmptyMomentumState } from "@/components/premium";
import { useToast } from "@/hooks/useToast";
import { licenseService, type LicensePlan, type Interval } from "@/services/license.service";

type StatusFilter = "ALL" | "ACTIVE" | "ARCHIVED";

interface PlanForm {
  name: string;
  description: string;
  interval: Interval;
  price: string;
  maxMembers: string;
  maxStaff: string;
  maxBranches: string;
}

const emptyForm: PlanForm = { name: "", description: "", interval: "MONTHLY", price: "", maxMembers: "", maxStaff: "", maxBranches: "" };

const inr = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const cap = (n?: number | null) => (n == null ? "Unlimited" : n.toLocaleString("en-IN"));
/** Enterprise uses price 0 to mean custom/negotiated pricing. */
const priceLabel = (price: number, interval: Interval) =>
  price <= 0 ? "Custom" : `${inr(price)}/${interval === "YEARLY" ? "yr" : "mo"}`;

/**
 * Default GymPro SaaS tiers — mirror the backend auto-seed (license.service
 * DEFAULT_PLANS). The backend seeds these automatically on first load; this
 * button is a manual "restore". Enterprise = custom price (0) + unlimited caps.
 */
const DEFAULT_TIERS: Array<Partial<LicensePlan> & { name: string; price: number; interval: Interval }> = [
  { name: "Starter", description: "For new, single-location gyms getting started.", interval: "MONTHLY", price: 999, maxMembers: 100, maxStaff: 5, maxBranches: 1 },
  { name: "Growth", description: "For growing studios scaling membership & engagement.", interval: "MONTHLY", price: 1999, maxMembers: 300, maxStaff: 15, maxBranches: 3 },
  { name: "Professional", description: "For established multi-branch fitness businesses.", interval: "MONTHLY", price: 3999, maxMembers: 700, maxStaff: 50, maxBranches: 10 },
  { name: "Enterprise", description: "Custom pricing. Unlimited members, branches & staff.", interval: "MONTHLY", price: 0 },
];

/**
 * Plan tier → included feature highlights + perks. Mirrors the backend
 * PLAN_FEATURE_MATRIX / PLAN_PERKS (license.service). Drives the feature list
 * shown on each tier card. Keyed by plan name (the named tiers).
 */
const TIER_FEATURES: Record<string, string[]> = {
  Starter: ["Members & Attendance", "Memberships & Payments", "Billing & Invoices", "Workout & Diet Builder", "Goals & Progress", "Chat & Announcements", "Analytics & Reports"],
  Growth: ["Everything in Starter", "Referral Campaigns", "Leaderboard & Gamification", "Community & Challenges", "Leads CRM", "Automation"],
  Professional: ["Everything in Growth", "White-Label Branding", "Advanced Reports", "Retention & Churn AI", "AI Insights", "Personal Plans"],
  Enterprise: ["Everything in Professional", "Unlimited everything", "API Access", "Priority Support", "Dedicated onboarding"],
};
const TIER_PERKS: Record<string, { storage: string; branding: boolean; priority: boolean }> = {
  Starter: { storage: "5 GB", branding: false, priority: false },
  Growth: { storage: "25 GB", branding: false, priority: false },
  Professional: { storage: "100 GB", branding: true, priority: true },
  Enterprise: { storage: "Unlimited", branding: true, priority: true },
};

export default function PlansPage() {
  const toast = useToast();
  const [plans, setPlans] = useState<LicensePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LicensePlan | null>(null);
  const [form, setForm] = useState<PlanForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // includeInactive=true so archived plans are visible for restore.
      setPlans(await licenseService.listPlans(true));
    } catch (err) {
      console.error("Failed to load plans:", err);
      setError("We couldn't load subscription plans. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return plans.filter((p) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && p.isActive) ||
        (statusFilter === "ARCHIVED" && !p.isActive);
      const matchesQuery = !q || p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [plans, search, statusFilter]);

  const stats = useMemo(() => {
    const active = plans.filter((p) => p.isActive);
    // Exclude custom-priced (₹0) plans like Enterprise from the price range.
    const monthly = active.filter((p) => p.interval === "MONTHLY" && p.price > 0);
    const lowest = monthly.length ? Math.min(...monthly.map((p) => p.price)) : 0;
    const highest = monthly.length ? Math.max(...monthly.map((p) => p.price)) : 0;
    return { total: plans.length, active: active.length, archived: plans.length - active.length, lowest, highest };
  }, [plans]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }
  function openEdit(p: LicensePlan) {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description ?? "",
      interval: p.interval,
      price: String(p.price),
      maxMembers: p.maxMembers != null ? String(p.maxMembers) : "",
      maxStaff: p.maxStaff != null ? String(p.maxStaff) : "",
      maxBranches: p.maxBranches != null ? String(p.maxBranches) : "",
    });
    setOpen(true);
  }

  async function submit() {
    if (form.name.trim().length < 2) return toast.error("A plan name is required.");
    const price = Number(form.price);
    if (form.price.trim() === "" || Number.isNaN(price) || price < 0) return toast.error("Set a valid price (₹, 0 or more).");

    // Empty cap = unlimited. On create we omit the key; on edit we send null to clear.
    const numOrUnlimited = (raw: string): number | null | undefined => {
      if (raw.trim() === "") return editing ? null : undefined;
      const n = Math.floor(Number(raw));
      return Number.isNaN(n) ? undefined : n;
    };

    setSubmitting(true);
    try {
      const payload: Partial<LicensePlan> = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        interval: form.interval,
        price,
        maxMembers: numOrUnlimited(form.maxMembers),
        maxStaff: numOrUnlimited(form.maxStaff),
        maxBranches: numOrUnlimited(form.maxBranches),
      };
      if (editing) {
        await licenseService.updatePlan(editing.id, payload);
        toast.success(`Plan "${payload.name}" updated.`);
      } else {
        await licenseService.createPlan(payload);
        toast.success(`Plan "${payload.name}" created.`);
      }
      setOpen(false);
      await load();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to save plan.");
    } finally {
      setSubmitting(false);
    }
  }

  async function setArchived(p: LicensePlan, archived: boolean) {
    if (archived && !window.confirm(`Archive "${p.name}"? It will be hidden from new license assignments. Gyms already on this plan keep it.`)) return;
    setBusyId(p.id);
    try {
      await licenseService.updatePlan(p.id, { isActive: !archived });
      toast.success(archived ? `"${p.name}" archived.` : `"${p.name}" restored.`);
      await load();
    } catch {
      toast.error(`Failed to ${archived ? "archive" : "restore"} plan.`);
    } finally {
      setBusyId(null);
    }
  }

  async function seedDefaults() {
    setSeeding(true);
    try {
      // Skip names that already exist so this is safe to re-run.
      const existing = new Set(plans.map((p) => p.name.toLowerCase()));
      const toCreate = DEFAULT_TIERS.filter((t) => !existing.has(t.name.toLowerCase()));
      if (toCreate.length === 0) {
        toast.info("Default tiers already exist.");
        return;
      }
      for (const t of toCreate) await licenseService.createPlan(t);
      toast.success(`Created ${toCreate.length} default tier${toCreate.length === 1 ? "" : "s"}.`);
      await load();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to seed default tiers.");
    } finally {
      setSeeding(false);
    }
  }

  return (
    <Page
      title="Subscriptions"
      eyebrow="Platform"
      description="Manage the SaaS license plans gyms subscribe to. Flat per-license pricing — never per member."
      action={
        <div className="flex flex-wrap gap-2">
          {plans.length > 0 && (
            <Button variant="secondary" iconLeft={<Sparkles className="h-4 w-4" />} loading={seeding} onClick={() => void seedDefaults()}>
              Add default tiers
            </Button>
          )}
          <Button iconLeft={<Plus className="h-4 w-4" />} onClick={openCreate}>New plan</Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile label="Total plans" value={loading ? "—" : String(stats.total)} icon={<CreditCard />} tone="neutral" />
          <StatTile label="Active" value={loading ? "—" : String(stats.active)} icon={<CreditCard />} tone="energy" />
          <StatTile label="Archived" value={loading ? "—" : String(stats.archived)} icon={<Archive />} tone="neutral" />
          <StatTile label="Monthly range" value={loading ? "—" : stats.active ? `${inr(stats.lowest)}–${inr(stats.highest)}` : "—"} icon={<Users />} tone="neutral" />
        </div>

        <div className="surface-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="flex-1"><SearchInput value={search} onChange={setSearch} placeholder="Search plans by name or description" /></div>
          <div className="flex gap-2">
            {(["ALL", "ACTIVE", "ARCHIVED"] as StatusFilter[]).map((s) => (
              <Button key={s} size="sm" variant={statusFilter === s ? "primary" : "secondary"} onClick={() => setStatusFilter(s)}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height="h-56" />)}</div>
        ) : error ? (
          <div className="surface-card"><EmptyMomentumState icon={<CreditCard />} title="Couldn't load plans" description={error} action={<Button variant="secondary" onClick={() => void load()}>Retry</Button>} /></div>
        ) : filtered.length === 0 ? (
          <div className="surface-card">
            <EmptyMomentumState
              icon={<CreditCard />}
              title={plans.length === 0 ? "No subscription plans yet" : "No matching plans"}
              description={plans.length === 0 ? "Create your license tiers so gyms can subscribe. Start with the standard tiers or build your own." : "Try a different search or filter."}
              action={plans.length === 0 ? (
                <div className="flex flex-wrap justify-center gap-2">
                  <Button iconLeft={<Sparkles className="h-4 w-4" />} loading={seeding} onClick={() => void seedDefaults()}>Create default tiers</Button>
                  <Button variant="secondary" iconLeft={<Plus className="h-4 w-4" />} onClick={openCreate}>New plan</Button>
                </div>
              ) : undefined}
            />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <div key={p.id} className={`surface-card flex flex-col p-5 ${p.isActive ? "" : "opacity-70"}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-lg font-black tracking-tight text-(--text-primary)">{p.name}</p>
                  <StatusPill tone={p.isActive ? "completed" : "neutral"} size="sm">{p.isActive ? "Active" : "Archived"}</StatusPill>
                </div>
                <p className="mt-1 text-2xl font-black text-(--text-primary)">
                  {p.price <= 0 ? "Custom" : <>{inr(p.price)}<span className="text-sm font-normal text-(--text-muted)">/{p.interval === "YEARLY" ? "yr" : "mo"}</span></>}
                </p>
                {p.description && <p className="mt-1 text-sm text-(--text-secondary)">{p.description}</p>}

                <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                  <div className="flex items-center gap-2 text-(--text-secondary)"><Users className="h-4 w-4 text-primary" /> {cap(p.maxMembers)} members</div>
                  <div className="flex items-center gap-2 text-(--text-secondary)"><UserCog className="h-4 w-4 text-primary" /> {cap(p.maxStaff)} trainers / staff</div>
                  <div className="flex items-center gap-2 text-(--text-secondary)"><Building2 className="h-4 w-4 text-primary" /> {cap(p.maxBranches)} branches</div>
                  {TIER_PERKS[p.name] && (
                    <>
                      <div className="flex items-center gap-2 text-(--text-secondary)"><HardDrive className="h-4 w-4 text-primary" /> {TIER_PERKS[p.name].storage} storage</div>
                      <div className="flex items-center gap-2 text-(--text-secondary)"><Palette className={`h-4 w-4 ${TIER_PERKS[p.name].branding ? "text-primary" : "text-(--text-muted)"}`} /> {TIER_PERKS[p.name].branding ? "Custom branding" : "No custom branding"}</div>
                      <div className="flex items-center gap-2 text-(--text-secondary)"><LifeBuoy className={`h-4 w-4 ${TIER_PERKS[p.name].priority ? "text-primary" : "text-(--text-muted)"}`} /> {TIER_PERKS[p.name].priority ? "Priority support" : "Standard support"}</div>
                    </>
                  )}
                </div>

                {TIER_FEATURES[p.name] && (
                  <ul className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
                    {TIER_FEATURES[p.name].map((f) => (
                      <li key={f} className="flex items-start gap-2 text-(--text-secondary)"><Check className="mt-0.5 h-4 w-4 shrink-0 text-(--success,var(--flame))" /> {f}</li>
                    ))}
                  </ul>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
                  <Button size="sm" variant="secondary" iconLeft={<Pencil className="h-3.5 w-3.5" />} onClick={() => openEdit(p)}>Edit</Button>
                  {p.isActive ? (
                    <Button size="sm" variant="ghost" loading={busyId === p.id} iconLeft={<Archive className="h-3.5 w-3.5" />} onClick={() => void setArchived(p, true)}>Archive</Button>
                  ) : (
                    <Button size="sm" variant="ghost" loading={busyId === p.id} iconLeft={<RotateCcw className="h-3.5 w-3.5" />} onClick={() => void setArchived(p, false)}>Restore</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-(--text-muted)">
          Storage limits and per-plan feature access are governed by <strong>Feature Flags</strong> (per gym) and the pending Enterprise License schema.
          Members always pay their gym directly — these plans are the gym's SaaS subscription to GymPro.
        </p>
      </div>

      {/* Create / edit plan modal */}
      <Modal
        open={open}
        onClose={() => !submitting && setOpen(false)}
        title={editing ? `Edit plan — ${editing.name}` : "New subscription plan"}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={() => void submit()} loading={submitting}>{editing ? "Save plan" : "Create plan"}</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Plan name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Growth" />
          <Textarea label="Description (optional)" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Who is this plan for?" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Price (₹)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="3999" />
            <Select
              label="Billing cycle"
              value={form.interval}
              onChange={(e) => setForm({ ...form, interval: e.target.value as Interval })}
              options={[{ label: "Monthly", value: "MONTHLY" }, { label: "Yearly", value: "YEARLY" }]}
            />
          </div>
          <SectionHeader eyebrow="Capacity" title="Limits" />
          <p className="-mt-2 text-xs text-(--text-muted)">Leave a field blank for unlimited.</p>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Max members" type="number" value={form.maxMembers} onChange={(e) => setForm({ ...form, maxMembers: e.target.value })} placeholder="∞" />
            <Input label="Max trainers" type="number" value={form.maxStaff} onChange={(e) => setForm({ ...form, maxStaff: e.target.value })} placeholder="∞" />
            <Input label="Max branches" type="number" value={form.maxBranches} onChange={(e) => setForm({ ...form, maxBranches: e.target.value })} placeholder="∞" />
          </div>
          {editing && (
            <p className="text-xs text-(--text-muted)">
              Status: {editing.isActive ? "Active" : "Archived"}. Use the Archive / Restore action on the plan card to change availability.
            </p>
          )}
        </div>
      </Modal>
    </Page>
  );
}
