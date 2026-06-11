import { useEffect, useState } from "react";
import { Megaphone, Plus, Send, X } from "lucide-react";
import Page from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/common/EmptyState";
import { useToast } from "@/hooks/useToast";
import { announcementService, type Announcement, type AnnouncementAudience, type AnnouncementPriority } from "@/services/comms.service";

const statusTone = (s: string) => (s === "SENT" ? "success" : s === "CANCELLED" || s === "EXPIRED" ? "danger" : s === "SCHEDULED" ? "info" : "default");
const prioTone = (p: string) => (p === "URGENT" ? "danger" : p === "HIGH" ? "warning" : "default");

export default function AnnouncementsPage() {
  const toast = useToast();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  async function load() { setItems(await announcementService.list().catch(() => [])); setLoading(false); }
  useEffect(() => { void load(); }, []);

  async function send(a: Announcement) {
    try { await announcementService.send(a.id); toast.success("Announcement sent"); void load(); }
    catch (e) { toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Send failed"); }
  }
  async function cancel(a: Announcement) {
    try { await announcementService.cancel(a.id); toast.success("Cancelled"); void load(); }
    catch { toast.error("Cancel failed"); }
  }

  return (
    <Page title="Announcements" description="Create, schedule, and send gym announcements with read tracking."
      action={<Button iconLeft={<Plus className="h-4 w-4" />} onClick={() => setAdding(true)}>New Announcement</Button>}>
      {loading ? <Skeleton height="h-64" /> : items.length === 0 ? (
        <EmptyState icon={<Megaphone className="h-7 w-7" />} title="No announcements" message="Create your first announcement." />
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <Card key={a.id} variant="solid" className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-(--text-primary)">{a.title}</span>
                    <Badge variant={statusTone(a.status)}>{a.status}</Badge>
                    <Badge variant={prioTone(a.priority)}>{a.priority}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-(--text-secondary)">{a.message}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-(--text-secondary)">
                    <span>Audience: {a.audience}</span>
                    {a.status === "SENT" && <span>{a._count?.receipts ?? 0} recipients</span>}
                    {a.channels.length > 0 && <span>Channels: {a.channels.join(", ")}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  {a.status !== "SENT" && a.status !== "CANCELLED" && (
                    <>
                      <Button size="sm" iconLeft={<Send className="h-3 w-3" />} onClick={() => send(a)}>Send</Button>
                      <Button size="sm" variant="secondary" iconLeft={<X className="h-3 w-3" />} onClick={() => cancel(a)}>Cancel</Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      {adding && <AddModal onClose={() => setAdding(false)} onSaved={() => { setAdding(false); void load(); }} />}
    </Page>
  );
}

function AddModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [f, setF] = useState<{ title: string; message: string; audience: AnnouncementAudience; priority: AnnouncementPriority }>({ title: "", message: "", audience: "ALL", priority: "NORMAL" });
  const [saving, setSaving] = useState(false);
  async function save() {
    if (!f.title || !f.message) { toast.error("Title and message required"); return; }
    setSaving(true);
    try { await announcementService.create(f); toast.success("Created (draft)"); onSaved(); }
    catch { toast.error("Create failed"); } finally { setSaving(false); }
  }
  return (
    <Modal open onClose={onClose} title="New Announcement">
      <div className="space-y-3">
        <Input label="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <div>
          <label className="text-sm font-semibold text-(--text-secondary)">Message</label>
          <textarea className="mt-1 w-full rounded-md border border-border bg-(--surface) px-3 py-2 text-sm" rows={3} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold text-(--text-secondary)">Audience</label>
            <select className="mt-1 w-full rounded-md border border-border bg-(--surface) px-3 py-2 text-sm" value={f.audience} onChange={(e) => setF({ ...f, audience: e.target.value as AnnouncementAudience })}>
              {["ALL", "MEMBERS", "TRAINERS", "STAFF"].map((a) => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-(--text-secondary)">Priority</label>
            <select className="mt-1 w-full rounded-md border border-border bg-(--surface) px-3 py-2 text-sm" value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value as AnnouncementPriority })}>
              {["LOW", "NORMAL", "HIGH", "URGENT"].map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={saving} onClick={save}>Create</Button>
        </div>
      </div>
    </Modal>
  );
}
