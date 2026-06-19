import { useCallback, useEffect, useState } from "react";
import { Plus, Star, Archive, Copy, Trash2, Pencil, CheckCircle2, Dumbbell, Clock, Flame, History } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/forms/Input";
import Select from "@/components/forms/Select";
import Textarea from "@/components/forms/Textarea";
import { Skeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/common/EmptyState";
import { useCelebrate } from "@/components/premium/CelebrationProvider";
import { personalWorkoutService, type PersonalWorkout, type PersonalExercise } from "@/services/personal.service";

const CATEGORIES = ["STRENGTH", "CARDIO", "MOBILITY", "YOGA", "STRETCHING", "RUNNING", "CYCLING", "HIIT", "CROSSFIT", "OTHER"];
const DIFFICULTIES = ["", "BEGINNER", "INTERMEDIATE", "ADVANCED"];
const DAYS = ["", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const cap = (s?: string | null) => (s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : "");

interface FormState {
  title: string; category: string; difficulty: string; muscles: string;
  dayOfWeek: string; estMinutes: string; notes: string; exercises: PersonalExercise[];
}
const emptyEx: PersonalExercise = { name: "", sets: 3, reps: "10" };
const emptyForm: FormState = { title: "", category: "STRENGTH", difficulty: "", muscles: "", dayOfWeek: "", estMinutes: "", notes: "", exercises: [{ ...emptyEx }] };

export default function PersonalWorkoutsPanel() {
  const celebrate = useCelebrate();
  const [items, setItems] = useState<PersonalWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  // Detail view
  const [detail, setDetail] = useState<PersonalWorkout | null>(null);
  const [detailHistory, setDetailHistory] = useState<{ id: string; completedAt: string }[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await personalWorkoutService.list({ archived: showArchived })); }
    finally { setLoading(false); }
  }, [showArchived]);
  useEffect(() => { void load(); }, [load]);

  async function openDetail(w: PersonalWorkout) {
    setDetail(w);
    setDetailHistory([]);
    const all = await personalWorkoutService.history().catch(() => []);
    setDetailHistory(all.filter((h) => h.personalWorkout?.id === w.id).map((h) => ({ id: h.id, completedAt: h.completedAt })));
  }

  function openCreate() { setEditingId(null); setForm(emptyForm); setModalOpen(true); }
  function openEdit(w: PersonalWorkout) {
    setDetail(null);
    setEditingId(w.id);
    setForm({
      title: w.title, category: w.category ?? "OTHER", difficulty: w.difficulty ?? "",
      muscles: (w.tags ?? []).join(", "), dayOfWeek: w.dayOfWeek ?? "", estMinutes: w.estMinutes != null ? String(w.estMinutes) : "",
      notes: w.notes ?? "",
      exercises: w.exercises.length ? w.exercises.map((e) => ({ name: e.name, sets: e.sets, reps: e.reps, restSeconds: e.restSeconds, notes: e.notes })) : [{ ...emptyEx }],
    });
    setModalOpen(true);
  }

  async function save() {
    const exercises = form.exercises.filter((e) => e.name.trim());
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        category: form.category,
        difficulty: (form.difficulty || undefined) as PersonalWorkout["difficulty"],
        tags: form.muscles.split(",").map((m) => m.trim()).filter(Boolean),
        dayOfWeek: form.dayOfWeek || undefined,
        estMinutes: form.estMinutes ? parseInt(form.estMinutes) : undefined,
        notes: form.notes || undefined,
        exercises,
      };
      if (editingId) await personalWorkoutService.update(editingId, payload);
      else await personalWorkoutService.create(payload);
      setModalOpen(false);
      await load();
    } finally { setSaving(false); }
  }

  async function act(fn: () => Promise<unknown>) { await fn(); await load(); setDetail(null); }
  async function complete(w: PersonalWorkout) { await personalWorkoutService.complete(w.id); celebrate("WORKOUT", { message: `Logged "${w.title}".` }); setDetail(null); await load(); }

  const updateEx = (i: number, patch: Partial<PersonalExercise>) => {
    const next = [...form.exercises]; next[i] = { ...next[i], ...patch }; setForm({ ...form, exercises: next });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm font-semibold text-(--text-secondary)">{showArchived ? "Archived" : "My personal workouts"}</p>
          <button onClick={() => setShowArchived((s) => !s)} className="text-xs font-semibold text-(--flame)">{showArchived ? "Show active" : "Show archived"}</button>
        </div>
        {!showArchived && <Button variant="primary" onClick={openCreate} iconLeft={<Plus className="h-4 w-4" />}>New workout</Button>}
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height="h-20" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={<Dumbbell className="h-7 w-7" />} title={showArchived ? "Nothing archived" : "No personal workouts yet"} message={showArchived ? "" : "Create your own — weekend sessions, extra cardio, a favourite routine."} action={!showArchived ? <Button variant="secondary" onClick={openCreate}>Create one</Button> : undefined} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((w) => (
            <Card key={w.id} variant="glass" className="cursor-pointer transition hover:border-(--flame)/40" onClick={() => void openDetail(w)}>
              <CardContent>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {w.isFavorite && <Star className="h-3.5 w-3.5 shrink-0 fill-(--flame) text-(--flame)" />}
                      <p className="truncate font-semibold text-(--text-primary)">{w.title}</p>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge variant="default">Personal</Badge>
                      {w.category && <Badge variant="info">{w.category}</Badge>}
                      {w.dayOfWeek && <Badge variant="default" className="capitalize">{w.dayOfWeek}</Badge>}
                      {w.isArchived && <Badge variant="warning">Archived</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-(--text-secondary)">{w.exercises.length} exercise{w.exercises.length === 1 ? "" : "s"}{w.estMinutes ? ` · ~${w.estMinutes} min` : ""}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  {!w.isArchived && <button onClick={() => void complete(w)} title="Log completion" className="rounded-lg p-1.5 text-(--text-secondary) hover:text-(--success)"><CheckCircle2 className="h-4 w-4" /></button>}
                  <button onClick={() => void act(() => personalWorkoutService.favorite(w.id))} title="Favorite" className={`rounded-lg p-1.5 ${w.isFavorite ? "text-(--flame)" : "text-(--text-secondary) hover:text-(--flame)"}`}><Star className={`h-4 w-4 ${w.isFavorite ? "fill-(--flame)" : ""}`} /></button>
                  <button onClick={() => openEdit(w)} title="Edit" className="rounded-lg p-1.5 text-(--text-secondary) hover:text-(--text-primary)"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => void act(() => personalWorkoutService.duplicate(w.id))} title="Duplicate" className="rounded-lg p-1.5 text-(--text-secondary) hover:text-(--text-primary)"><Copy className="h-4 w-4" /></button>
                  <button onClick={() => void act(() => personalWorkoutService.archive(w.id, !w.isArchived))} title={w.isArchived ? "Unarchive" : "Archive"} className="rounded-lg p-1.5 text-(--text-secondary) hover:text-(--text-primary)"><Archive className="h-4 w-4" /></button>
                  <button onClick={() => { if (window.confirm(`Delete "${w.title}"?`)) void act(() => personalWorkoutService.remove(w.id)); }} title="Delete" className="rounded-lg p-1.5 text-(--text-secondary) hover:text-(--danger)"><Trash2 className="h-4 w-4" /></button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Detail view ─────────────────────────────────────────────────────── */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.title ?? ""} size="lg"
        footer={detail && (
          <div className="flex flex-wrap justify-end gap-2">
            {!detail.isArchived && <Button variant="secondary" onClick={() => void complete(detail)} iconLeft={<CheckCircle2 className="h-4 w-4" />}>Complete</Button>}
            <Button variant="secondary" onClick={() => openEdit(detail)} iconLeft={<Pencil className="h-4 w-4" />}>Edit</Button>
            <Button variant="secondary" onClick={() => void act(() => personalWorkoutService.duplicate(detail.id))} iconLeft={<Copy className="h-4 w-4" />}>Duplicate</Button>
            <Button variant="danger" onClick={() => { if (window.confirm(`Delete "${detail.title}"?`)) void act(() => personalWorkoutService.remove(detail.id)); }} iconLeft={<Trash2 className="h-4 w-4" />}>Delete</Button>
          </div>
        )}>
        {detail && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="default">Personal Plan</Badge>
              {detail.category && <Badge variant="info">{detail.category}</Badge>}
              {detail.difficulty && <Badge variant="default">{cap(detail.difficulty)}</Badge>}
              {detail.dayOfWeek && <Badge variant="default" className="capitalize">{detail.dayOfWeek}</Badge>}
              {detail.isFavorite && <Badge variant="warning" className="flex items-center gap-1"><Star className="h-3 w-3" />Favorite</Badge>}
              {detail.isArchived && <Badge variant="warning">Archived</Badge>}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-(--text-secondary)">
              {detail.estMinutes ? <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />~{detail.estMinutes} min</span> : null}
              {detail.tags?.length ? <span className="flex items-center gap-1.5"><Flame className="h-4 w-4 text-(--flame)" />{detail.tags.join(", ")}</span> : null}
              <span className="flex items-center gap-1.5"><Dumbbell className="h-4 w-4" />{detail.exercises.length} exercises</span>
            </div>
            {detail.notes && <p className="rounded-xl bg-(--surface-secondary) p-3 text-sm text-(--text-secondary)">{detail.notes}</p>}
            <div>
              <p className="mb-2 text-sm font-semibold text-(--text-primary)">Exercises</p>
              <div className="space-y-2">
                {detail.exercises.map((e, i) => (
                  <div key={e.id ?? i} className="rounded-xl border border-border p-2.5">
                    <p className="text-sm font-medium text-(--text-primary)">{e.name}</p>
                    <p className="text-xs text-(--text-secondary)">{e.sets} × {e.reps}{e.restSeconds ? ` · ${e.restSeconds}s rest` : ""}</p>
                    {e.notes && <p className="mt-0.5 text-xs text-(--text-muted)">{e.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-(--text-primary)"><History className="h-4 w-4" />Completion history</p>
              {detailHistory.length === 0 ? (
                <p className="text-xs text-(--text-secondary)">No completions logged yet.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {detailHistory.slice(0, 20).map((h) => (
                    <Badge key={h.id} variant="success">{new Date(h.completedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Create / Edit (full trainer-parity form) ────────────────────────── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit personal workout" : "New personal workout"} size="lg"
        footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</Button><Button variant="primary" onClick={() => void save()} disabled={saving}>{saving ? "Saving…" : "Save"}</Button></div>}>
        <div className="space-y-4">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Weekend cardio" />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Category" options={CATEGORIES.map((c) => ({ label: cap(c), value: c }))} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <Select label="Difficulty" options={DIFFICULTIES.map((d) => ({ label: d ? cap(d) : "— none —", value: d }))} value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Day (optional)" options={DAYS.map((d) => ({ label: d ? cap(d) : "— none —", value: d }))} value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })} />
            <Input label="Est. duration (min)" type="number" value={form.estMinutes} onChange={(e) => setForm({ ...form, estMinutes: e.target.value })} placeholder="45" />
          </div>
          <Input label="Target muscles / focus (comma-separated)" value={form.muscles} onChange={(e) => setForm({ ...form, muscles: e.target.value })} placeholder="Chest, Triceps" />
          <Textarea label="Notes" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" />
          <div>
            <p className="mb-2 text-sm font-medium text-(--text-secondary)">Exercises</p>
            <div className="space-y-3">
              {form.exercises.map((ex, i) => (
                <div key={i} className="rounded-xl border border-border p-2.5">
                  <div className="grid grid-cols-[1fr_60px_64px_64px_28px] items-center gap-2">
                    <Input value={ex.name} onChange={(e) => updateEx(i, { name: e.target.value })} placeholder="Exercise" />
                    <Input type="number" value={String(ex.sets)} onChange={(e) => updateEx(i, { sets: parseInt(e.target.value) || 0 })} placeholder="sets" />
                    <Input value={ex.reps} onChange={(e) => updateEx(i, { reps: e.target.value })} placeholder="reps" />
                    <Input type="number" value={ex.restSeconds != null ? String(ex.restSeconds) : ""} onChange={(e) => updateEx(i, { restSeconds: e.target.value === "" ? undefined : parseInt(e.target.value) })} placeholder="rest" />
                    <button onClick={() => setForm({ ...form, exercises: form.exercises.filter((_, j) => j !== i) })} className="text-(--text-muted) hover:text-(--danger)"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <Input className="mt-2" value={ex.notes ?? ""} onChange={(e) => updateEx(i, { notes: e.target.value })} placeholder="Exercise notes (optional)" />
                </div>
              ))}
            </div>
            <Button variant="ghost" onClick={() => setForm({ ...form, exercises: [...form.exercises, { ...emptyEx }] })} iconLeft={<Plus className="h-4 w-4" />}>Add exercise</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
