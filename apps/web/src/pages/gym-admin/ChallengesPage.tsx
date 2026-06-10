import { useEffect, useState } from "react";
import { Trophy, Plus, Users } from "lucide-react";
import Page from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/common/EmptyState";
import { useToast } from "@/hooks/useToast";
import { challengeService, type Challenge, type LeaderboardRow } from "@/services/gamification.service";

const TYPES = ["ATTENDANCE", "WORKOUT", "WEIGHT_LOSS", "CONSISTENCY", "CUSTOM"];
const statusTone = (s: string) => (s === "ACTIVE" ? "success" : s === "COMPLETED" ? "info" : s === "CANCELLED" ? "danger" : "warning");

export default function ChallengesPage() {
  const toast = useToast();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<Challenge | null>(null);

  async function load() {
    setChallenges(await challengeService.list().catch(() => []));
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  return (
    <Page
      title="Challenges"
      description="Create gym challenges, track participants, and view leaderboards."
      action={<Button iconLeft={<Plus className="h-4 w-4" />} onClick={() => setAdding(true)}>New Challenge</Button>}
    >
      {loading ? (
        <Skeleton height="h-64" />
      ) : challenges.length === 0 ? (
        <EmptyState icon={<Trophy className="h-7 w-7" />} title="No challenges yet" message="Create your first challenge to boost engagement." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {challenges.map((c) => (
            <Card key={c.id} variant="solid" className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    <span className="font-semibold text-(--text-primary)">{c.title}</span>
                  </div>
                  <p className="mt-1 text-sm text-(--text-secondary)">{c.description || c.type}</p>
                </div>
                <Badge variant={statusTone(c.status)}>{c.status}</Badge>
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-(--text-secondary)">
                <span>{c.type}</span>
                {c.targetValue != null && <span>Target {c.targetValue}</span>}
                <span className="flex items-center gap-1"><Users className="h-3 w-3" />{c.participants?.length ?? 0}</span>
                <span>{new Date(c.startDate).toLocaleDateString()} → {new Date(c.endDate).toLocaleDateString()}</span>
              </div>
              <Button size="sm" variant="secondary" className="mt-3" onClick={() => setSelected(c)}>View participants & leaderboard</Button>
            </Card>
          ))}
        </div>
      )}

      {adding && <AddChallengeModal onClose={() => setAdding(false)} onSaved={() => { setAdding(false); void load(); }} />}
      {selected && <ChallengeDetailModal challenge={selected} onClose={() => setSelected(null)} />}
    </Page>
  );
}

function AddChallengeModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [f, setF] = useState({ title: "", description: "", type: "ATTENDANCE", targetValue: "", status: "ACTIVE", startDate: "", endDate: "" });
  const [saving, setSaving] = useState(false);
  async function save() {
    if (!f.title || !f.startDate || !f.endDate) { toast.error("Title, start and end dates are required"); return; }
    setSaving(true);
    try {
      await challengeService.create({ ...f, targetValue: f.targetValue ? Number(f.targetValue) : undefined } as never);
      toast.success("Challenge created");
      onSaved();
    } catch { toast.error("Could not create challenge"); } finally { setSaving(false); }
  }
  return (
    <Modal open onClose={onClose} title="New Challenge">
      <div className="space-y-3">
        <Input label="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <Input label="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold text-(--text-secondary)">Type</label>
            <select className="mt-1 w-full rounded-md border border-(--border) bg-(--surface) px-3 py-2 text-sm" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <Input label="Target value" type="number" value={f.targetValue} onChange={(e) => setF({ ...f, targetValue: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Start date" type="date" value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} />
          <Input label="End date" type="date" value={f.endDate} onChange={(e) => setF({ ...f, endDate: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={saving} onClick={save}>Create</Button>
        </div>
      </div>
    </Modal>
  );
}

function ChallengeDetailModal({ challenge, onClose }: { challenge: Challenge; onClose: () => void }) {
  const [board, setBoard] = useState<LeaderboardRow[]>([]);
  useEffect(() => { challengeService.leaderboard(challenge.id).then(setBoard).catch(() => setBoard([])); }, [challenge.id]);
  return (
    <Modal open onClose={onClose} title={`${challenge.title} — Leaderboard`}>
      {board.length === 0 ? (
        <p className="py-4 text-center text-sm text-(--text-secondary)">No participants yet.</p>
      ) : (
        <div className="space-y-1">
          {board.map((r) => (
            <div key={r.memberId} className="flex items-center justify-between rounded-md border border-(--border) px-3 py-2 text-sm">
              <span className="flex items-center gap-2"><span className="w-6 font-bold text-(--text-secondary)">#{r.rank}</span>{r.name}</span>
              <span className="flex items-center gap-2">{r.progress}{r.isCompleted && <Badge variant="success">Done</Badge>}</span>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
