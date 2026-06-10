import { useEffect, useState } from "react";
import { Gift, Plus } from "lucide-react";
import Page from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/common/EmptyState";
import { useToast } from "@/hooks/useToast";
import { gamificationService, type Reward, type Redemption } from "@/services/gamification.service";

const STATUS = ["PENDING", "APPROVED", "FULFILLED", "REJECTED", "CANCELLED"];
const statusTone = (s: string) => (s === "FULFILLED" || s === "APPROVED" ? "success" : s === "REJECTED" || s === "CANCELLED" ? "danger" : "warning");

export default function RewardsPage() {
  const toast = useToast();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  async function load() {
    const [r, d] = await Promise.all([gamificationService.rewards().catch(() => []), gamificationService.redemptions().catch(() => [])]);
    setRewards(r);
    setRedemptions(d);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function setStatus(id: string, status: string) {
    try { await gamificationService.updateRedemption(id, status); toast.success("Updated"); void load(); }
    catch { toast.error("Update failed"); }
  }

  return (
    <Page title="Rewards" description="Create rewards members redeem with points, and manage redemptions."
      action={<Button iconLeft={<Plus className="h-4 w-4" />} onClick={() => setAdding(true)}>New Reward</Button>}>
      {loading ? <Skeleton height="h-64" /> : (
        <div className="space-y-6">
          {/* Catalogue */}
          {rewards.length === 0 ? (
            <EmptyState icon={<Gift className="h-7 w-7" />} title="No rewards yet" message="Create a reward members can redeem with points." />
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {rewards.map((r) => (
                <Card key={r.id} variant="solid" className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-semibold text-(--text-primary)"><Gift className="h-4 w-4 text-pink-500" />{r.title}</span>
                    <Badge variant={r.isActive ? "success" : "danger"}>{r.isActive ? "Active" : "Inactive"}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-(--text-secondary)">{r.description || r.type}</p>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="font-bold text-indigo-500">{r.pointsCost || r.xpCost || 0} pts</span>
                    <span className="text-(--text-secondary)">{r.stock == null ? "Unlimited" : `${r.stock} left`}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Redemptions */}
          <Card variant="solid" className="overflow-hidden p-0">
            <div className="border-b border-(--border) px-5 py-3 text-sm font-semibold text-(--text-primary)">Redemptions</div>
            {redemptions.length === 0 ? (
              <p className="px-5 py-6 text-sm text-(--text-secondary)">No redemptions yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-(--border) text-xs uppercase tracking-wide text-(--text-secondary)">
                    <tr><th className="px-4 py-2">Member</th><th className="px-4 py-2">Reward</th><th className="px-4 py-2">Points</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Action</th></tr>
                  </thead>
                  <tbody className="divide-y divide-(--border)">
                    {redemptions.map((d) => (
                      <tr key={d.id}>
                        <td className="px-4 py-2 font-medium text-(--text-primary)">{d.member?.user?.name ?? "—"}</td>
                        <td className="px-4 py-2 text-(--text-secondary)">{d.reward?.title ?? "—"}</td>
                        <td className="px-4 py-2">{d.pointsSpent}</td>
                        <td className="px-4 py-2"><Badge variant={statusTone(d.status)}>{d.status}</Badge></td>
                        <td className="px-4 py-2">
                          <select className="rounded-md border border-(--border) bg-(--surface) px-2 py-1 text-xs" value={d.status} onChange={(e) => setStatus(d.id, e.target.value)}>
                            {STATUS.map((s) => <option key={s}>{s}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {adding && <AddRewardModal onClose={() => setAdding(false)} onSaved={() => { setAdding(false); void load(); }} />}
    </Page>
  );
}

function AddRewardModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [f, setF] = useState({ title: "", description: "", type: "GIFT", pointsCost: "", stock: "" });
  const [saving, setSaving] = useState(false);
  async function save() {
    if (!f.title || !f.pointsCost) { toast.error("Title and points cost are required"); return; }
    setSaving(true);
    try {
      await gamificationService.createReward({ title: f.title, description: f.description, type: f.type, pointsCost: Number(f.pointsCost), stock: f.stock ? Number(f.stock) : null } as never);
      toast.success("Reward created");
      onSaved();
    } catch { toast.error("Could not create reward"); } finally { setSaving(false); }
  }
  return (
    <Modal open onClose={onClose} title="New Reward">
      <div className="space-y-3">
        <Input label="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <Input label="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold text-(--text-secondary)">Type</label>
            <select className="mt-1 w-full rounded-md border border-(--border) bg-(--surface) px-3 py-2 text-sm" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
              {["GIFT", "DISCOUNT", "BADGE", "XP"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <Input label="Points cost" type="number" value={f.pointsCost} onChange={(e) => setF({ ...f, pointsCost: e.target.value })} />
        </div>
        <Input label="Stock (blank = unlimited)" type="number" value={f.stock} onChange={(e) => setF({ ...f, stock: e.target.value })} />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={saving} onClick={save}>Create</Button>
        </div>
      </div>
    </Modal>
  );
}
