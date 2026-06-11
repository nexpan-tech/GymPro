import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Funnel, UserPlus, Percent, FlaskConical, XCircle } from "lucide-react";
import Page from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/hooks/useToast";
import {
  crmService,
  type Lead,
  type LeadActivity,
  type LeadFunnel,
  type LeadStatus,
  type TrialStats,
} from "@/services/crm.service";

// The six canonical pipeline columns (spec). Richer backend statuses fold in.
const COLUMNS: { key: LeadStatus; label: string; maps: LeadStatus[] }[] = [
  { key: "NEW", label: "New", maps: ["NEW"] },
  { key: "CONTACTED", label: "Contacted", maps: ["CONTACTED"] },
  { key: "INTERESTED", label: "Interested", maps: ["INTERESTED"] },
  { key: "TRIAL", label: "Trial", maps: ["TRIAL", "TRIAL_BOOKED", "TRIAL_COMPLETED", "NEGOTIATION"] },
  { key: "CONVERTED", label: "Converted", maps: ["CONVERTED"] },
  { key: "LOST", label: "Lost", maps: ["LOST"] },
];
const STAGE_OPTIONS: LeadStatus[] = ["NEW", "CONTACTED", "INTERESTED", "TRIAL", "CONVERTED", "LOST"];

const badgeFor = (s: LeadStatus) =>
  s === "CONVERTED" ? "success" : s === "LOST" ? "danger" : s === "TRIAL" || s === "TRIAL_BOOKED" ? "info" : "default";

export default function LeadsPage() {
  const toast = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [funnel, setFunnel] = useState<LeadFunnel | null>(null);
  const [trialStats, setTrialStats] = useState<TrialStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<Lead | null>(null);

  async function load() {
    const [l, f, t] = await Promise.all([
      crmService.listLeads().catch(() => []),
      crmService.funnel().catch(() => null),
      crmService.trialStats().catch(() => null),
    ]);
    setLeads(l);
    setFunnel(f);
    setTrialStats(t);
    setLoading(false);
  }
  useEffect(() => {
    void load();
  }, []);

  const byColumn = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    for (const col of COLUMNS) map[col.key] = [];
    for (const lead of leads) {
      const col = COLUMNS.find((c) => c.maps.includes(lead.status)) ?? COLUMNS[0];
      map[col.key].push(lead);
    }
    return map;
  }, [leads]);

  async function moveStage(lead: Lead, status: LeadStatus) {
    try {
      await crmService.changeStatus(lead.id, status);
      toast.success(`${lead.name} → ${status}`);
      void load();
    } catch {
      toast.error("Could not update stage");
    }
  }

  return (
    <Page
      title="Leads CRM"
      description="Capture leads, manage the sales pipeline, and convert trials into members."
      action={
        <Button iconLeft={<UserPlus className="h-4 w-4" />} onClick={() => setAdding(true)}>
          Add Lead
        </Button>
      }
    >
      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height="h-24" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* CRM dashboard stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Total Leads" value={String(funnel?.totalLeads ?? leads.length)} icon={<Funnel className="h-5 w-5" />} />
            <Stat label="Conversion Rate" value={`${funnel?.conversionRate ?? 0}%`} icon={<Percent className="h-5 w-5" />} tone="neutral" />
            <Stat label="Trials (converted)" value={`${trialStats?.active ?? 0} (${trialStats?.converted ?? 0})`} icon={<FlaskConical className="h-5 w-5" />} />
            <Stat label="Lost" value={String(funnel?.funnel?.LOST ?? 0)} icon={<XCircle className="h-5 w-5" />} tone="rose" />
          </div>

          {/* Pipeline board */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {COLUMNS.map((col) => (
              <div key={col.key} className="rounded-lg border border-border bg-(--surface) p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-(--text-secondary)">{col.label}</span>
                  <Badge variant={badgeFor(col.key)}>{byColumn[col.key]?.length ?? 0}</Badge>
                </div>
                <div className="space-y-2">
                  {(byColumn[col.key] ?? []).map((lead) => (
                    <button
                      key={lead.id}
                      onClick={() => setSelected(lead)}
                      className="w-full rounded-md border border-border bg-(--surface-elevated) p-2 text-left transition hover:border-primary/40"
                    >
                      <div className="truncate text-sm font-medium text-(--text-primary)">{lead.name}</div>
                      <div className="truncate text-xs text-(--text-secondary)">{lead.phone}</div>
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-(--text-secondary)">
                        <span className="rounded bg-(--surface) px-1 py-0.5">{lead.source}</span>
                        <span>score {lead.leadScore}</span>
                      </div>
                    </button>
                  ))}
                  {(byColumn[col.key] ?? []).length === 0 && (
                    <p className="py-4 text-center text-xs text-(--text-secondary)">—</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {adding && <AddLeadModal onClose={() => setAdding(false)} onSaved={() => { setAdding(false); void load(); }} />}
      {selected && (
        <LeadDetailModal
          lead={selected}
          onClose={() => setSelected(null)}
          onMove={(s) => moveStage(selected, s)}
        />
      )}
    </Page>
  );
}

function Stat({ label, value, icon, tone }: { label: string; value: string; icon: ReactNode; tone?: "neutral" | "rose" }) {
  const color = tone === "neutral" ? "text-muted-foreground" : tone === "rose" ? "text-primary" : "text-primary";
  return (
    <Card variant="solid" className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-(--text-secondary)">{label}</span>
        <span className={color}>{icon}</span>
      </div>
      <div className="mt-2 text-2xl font-bold text-(--text-primary)">{value}</div>
    </Card>
  );
}

function AddLeadModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: "", phone: "", email: "", source: "WALK_IN", fitnessGoal: "" });
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!form.name || !form.phone) {
      toast.error("Name and phone are required");
      return;
    }
    setSaving(true);
    try {
      await crmService.createLead(form as never);
      toast.success("Lead added");
      onSaved();
    } catch {
      toast.error("Could not add lead");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Add Lead">
      <div className="space-y-3">
        <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <div>
          <label className="text-sm font-semibold text-(--text-secondary)">Source</label>
          <select
            className="mt-1 w-full rounded-md border border-border bg-(--surface) px-3 py-2 text-sm"
            value={form.source}
            onChange={(e) => setForm({ ...form, source: e.target.value })}
          >
            {["WALK_IN", "WEBSITE", "WHATSAPP", "INSTAGRAM", "FACEBOOK", "REFERRAL", "CALL", "OTHER"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <Input label="Fitness goal" value={form.fitnessGoal} onChange={(e) => setForm({ ...form, fitnessGoal: e.target.value })} />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={saving} onClick={save}>Save Lead</Button>
        </div>
      </div>
    </Modal>
  );
}

function LeadDetailModal({ lead, onClose, onMove }: { lead: Lead; onClose: () => void; onMove: (s: LeadStatus) => void }) {
  const toast = useToast();
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [note, setNote] = useState("");
  const [type, setType] = useState("NOTE");

  async function loadActivities() {
    setActivities(await crmService.activities(lead.id).catch(() => []));
  }
  useEffect(() => {
    void loadActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id]);

  async function addNote() {
    if (!note.trim()) return;
    try {
      await crmService.addActivity(lead.id, { type, note });
      setNote("");
      toast.success("Activity logged");
      void loadActivities();
    } catch {
      toast.error("Could not log activity");
    }
  }

  return (
    <Modal open onClose={onClose} title={lead.name}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Badge variant={badgeFor(lead.status)}>{lead.status}</Badge>
          <span className="text-(--text-secondary)">{lead.phone}</span>
          {lead.email && <span className="text-(--text-secondary)">{lead.email}</span>}
          <span className="text-(--text-secondary)">Source: {lead.source}</span>
        </div>

        <div>
          <label className="text-sm font-semibold text-(--text-secondary)">Move to stage</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {STAGE_OPTIONS.map((s) => (
              <Button key={s} size="sm" variant={s === "CONVERTED" ? "success" : s === "LOST" ? "danger" : "secondary"} onClick={() => onMove(s)}>
                {s}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-(--text-secondary)">Log activity</label>
          <div className="mt-1 flex gap-2">
            <select className="rounded-md border border-border bg-(--surface) px-2 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
              {["NOTE", "CALL", "WHATSAPP", "EMAIL", "MEETING", "FOLLOW_UP"].map((t) => <option key={t}>{t}</option>)}
            </select>
            <Input className="flex-1" placeholder="Add a note…" value={note} onChange={(e) => setNote(e.target.value)} />
            <Button onClick={addNote}>Add</Button>
          </div>
        </div>

        <div className="max-h-56 space-y-2 overflow-y-auto">
          {activities.length === 0 ? (
            <p className="py-3 text-center text-sm text-(--text-secondary)">No activity yet.</p>
          ) : (
            activities.map((a) => (
              <div key={a.id} className="rounded-md border border-border p-2 text-sm">
                <div className="flex items-center justify-between">
                  <Badge variant="info">{a.type}</Badge>
                  <span className="text-xs text-(--text-secondary)">{new Date(a.createdAt).toLocaleString()}</span>
                </div>
                {a.note && <p className="mt-1 text-(--text-secondary)">{a.note}</p>}
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
