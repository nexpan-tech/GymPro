import { useCallback, useEffect, useState } from "react";
import { Plus, Star, Archive, Copy, Trash2, Pencil, Salad, Droplets } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/forms/Input";
import Select from "@/components/forms/Select";
import Textarea from "@/components/forms/Textarea";
import { Skeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/common/EmptyState";
import { personalDietService, type PersonalDiet, type PersonalMeal, type MealType } from "@/services/personal.service";

const MEAL_TYPES: MealType[] = ["BREAKFAST", "LUNCH", "DINNER", "SNACK", "PRE_WORKOUT", "POST_WORKOUT"];
const MEAL_ORDER: Record<string, number> = { BREAKFAST: 0, PRE_WORKOUT: 1, LUNCH: 2, SNACK: 3, POST_WORKOUT: 4, DINNER: 5 };
const DAYS = ["", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const mealLabel = (t: string) => t.toLowerCase().split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");

interface FormState { title: string; category: string; dayOfWeek: string; notes: string; meals: PersonalMeal[] }
const emptyMeal: PersonalMeal = { mealType: "BREAKFAST", title: "" };
const emptyForm: FormState = { title: "", category: "", dayOfWeek: "", notes: "", meals: [{ ...emptyMeal }] };

export default function PersonalDietsPanel() {
  const [items, setItems] = useState<PersonalDiet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [water, setWater] = useState(0);
  const [detail, setDetail] = useState<PersonalDiet | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, w] = await Promise.all([personalDietService.list({ archived: showArchived }), personalDietService.getWater().catch(() => ({ glasses: 0 }))]);
      setItems(list); setWater(w.glasses);
    } finally { setLoading(false); }
  }, [showArchived]);
  useEffect(() => { void load(); }, [load]);

  function openCreate() { setEditingId(null); setForm(emptyForm); setModalOpen(true); }
  function openEdit(d: PersonalDiet) {
    setDetail(null);
    setEditingId(d.id);
    setForm({ title: d.title, category: d.category ?? "", dayOfWeek: d.dayOfWeek ?? "", notes: d.notes ?? "", meals: d.meals.length ? d.meals.map((m) => ({ mealType: m.mealType, title: m.title, calories: m.calories, protein: m.protein, carbs: m.carbs, fats: m.fats, time: m.time, notes: m.notes })) : [{ ...emptyMeal }] });
    setModalOpen(true);
  }

  async function save() {
    const meals = form.meals.filter((m) => m.title.trim());
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const payload = { title: form.title.trim(), category: form.category || undefined, dayOfWeek: form.dayOfWeek || undefined, notes: form.notes || undefined, meals };
      if (editingId) await personalDietService.update(editingId, payload); else await personalDietService.create(payload);
      setModalOpen(false); await load();
    } finally { setSaving(false); }
  }
  async function act(fn: () => Promise<unknown>) { await fn(); await load(); setDetail(null); }
  async function setGlasses(n: number) { setWater(n); await personalDietService.setWater(n).catch(() => undefined); }

  const num = (v?: number | null) => (v == null || Number.isNaN(v) ? undefined : v);
  const updateMeal = (i: number, patch: Partial<PersonalMeal>) => { const next = [...form.meals]; next[i] = { ...next[i], ...patch }; setForm({ ...form, meals: next }); };
  const dietTotals = (d: PersonalDiet) => d.meals.reduce((s, m) => ({ kcal: s.kcal + (m.calories ?? 0), protein: s.protein + (m.protein ?? 0), carbs: s.carbs + (m.carbs ?? 0), fats: s.fats + (m.fats ?? 0) }), { kcal: 0, protein: 0, carbs: 0, fats: 0 });

  return (
    <div className="space-y-4">
      {/* Water tracker */}
      <Card variant="solid" className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><Droplets className="h-4 w-4 text-(--flame)" /><p className="text-sm font-semibold text-(--text-primary)">Water today</p></div>
          <p className="text-xs text-(--text-secondary)">{water} / 8 glasses</p>
        </div>
        <div className="mt-2 flex gap-1.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <button key={i} onClick={() => void setGlasses(i < water && i === water - 1 ? i : i + 1)} className={`h-7 flex-1 rounded-md border ${i < water ? "border-(--flame) bg-(--flame)/15" : "border-border bg-(--surface-secondary)"}`} />
          ))}
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm font-semibold text-(--text-secondary)">{showArchived ? "Archived" : "My personal diets"}</p>
          <button onClick={() => setShowArchived((s) => !s)} className="text-xs font-semibold text-(--flame)">{showArchived ? "Show active" : "Show archived"}</button>
        </div>
        {!showArchived && <Button variant="primary" onClick={openCreate} iconLeft={<Plus className="h-4 w-4" />}>New diet</Button>}
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height="h-20" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={<Salad className="h-7 w-7" />} title={showArchived ? "Nothing archived" : "No personal diets yet"} message={showArchived ? "" : "Create your own — meal prep, a macro plan, your favourite meals."} action={!showArchived ? <Button variant="secondary" onClick={openCreate}>Create one</Button> : undefined} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((d) => {
            const t = dietTotals(d);
            return (
              <Card key={d.id} variant="glass" className="cursor-pointer transition hover:border-(--flame)/40" onClick={() => setDetail(d)}>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {d.isFavorite && <Star className="h-3.5 w-3.5 shrink-0 fill-(--flame) text-(--flame)" />}
                    <p className="truncate font-semibold text-(--text-primary)">{d.title}</p>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge variant="default">Personal</Badge>
                    {d.category && <Badge variant="info">{d.category}</Badge>}
                    {d.dayOfWeek && <Badge variant="default" className="capitalize">{d.dayOfWeek}</Badge>}
                    {d.isArchived && <Badge variant="warning">Archived</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-(--text-secondary)">{d.meals.length} meal{d.meals.length === 1 ? "" : "s"}{t.kcal > 0 ? ` · ${t.kcal} kcal` : ""}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => void act(() => personalDietService.favorite(d.id))} title="Favorite" className={`rounded-lg p-1.5 ${d.isFavorite ? "text-(--flame)" : "text-(--text-secondary) hover:text-(--flame)"}`}><Star className={`h-4 w-4 ${d.isFavorite ? "fill-(--flame)" : ""}`} /></button>
                    <button onClick={() => openEdit(d)} title="Edit" className="rounded-lg p-1.5 text-(--text-secondary) hover:text-(--text-primary)"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => void act(() => personalDietService.duplicate(d.id))} title="Duplicate" className="rounded-lg p-1.5 text-(--text-secondary) hover:text-(--text-primary)"><Copy className="h-4 w-4" /></button>
                    <button onClick={() => void act(() => personalDietService.archive(d.id, !d.isArchived))} title={d.isArchived ? "Unarchive" : "Archive"} className="rounded-lg p-1.5 text-(--text-secondary) hover:text-(--text-primary)"><Archive className="h-4 w-4" /></button>
                    <button onClick={() => { if (window.confirm(`Delete "${d.title}"?`)) void act(() => personalDietService.remove(d.id)); }} title="Delete" className="rounded-lg p-1.5 text-(--text-secondary) hover:text-(--danger)"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Detail view ─────────────────────────────────────────────────────── */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.title ?? ""} size="lg"
        footer={detail && (
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={() => openEdit(detail)} iconLeft={<Pencil className="h-4 w-4" />}>Edit</Button>
            <Button variant="secondary" onClick={() => void act(() => personalDietService.duplicate(detail.id))} iconLeft={<Copy className="h-4 w-4" />}>Duplicate</Button>
            <Button variant="danger" onClick={() => { if (window.confirm(`Delete "${detail.title}"?`)) void act(() => personalDietService.remove(detail.id)); }} iconLeft={<Trash2 className="h-4 w-4" />}>Delete</Button>
          </div>
        )}>
        {detail && (() => {
          const t = dietTotals(detail);
          const meals = [...detail.meals].sort((a, b) => (MEAL_ORDER[a.mealType] ?? 9) - (MEAL_ORDER[b.mealType] ?? 9));
          return (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="default">Personal Plan</Badge>
                {detail.category && <Badge variant="info">{detail.category}</Badge>}
                {detail.dayOfWeek && <Badge variant="default" className="capitalize">{detail.dayOfWeek}</Badge>}
                {detail.isFavorite && <Badge variant="warning" className="flex items-center gap-1"><Star className="h-3 w-3" />Favorite</Badge>}
                {detail.isArchived && <Badge variant="warning">Archived</Badge>}
              </div>
              {t.kcal > 0 && <p className="text-sm text-(--text-secondary)">Daily total: <span className="font-semibold text-(--text-primary)">{t.kcal} kcal</span> · P {t.protein}g · C {t.carbs}g · F {t.fats}g</p>}
              {detail.notes && <p className="rounded-xl bg-(--surface-secondary) p-3 text-sm text-(--text-secondary)">{detail.notes}</p>}
              <div className="space-y-2">
                {meals.map((m, i) => (
                  <div key={m.id ?? i} className="rounded-xl border border-border p-2.5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-(--flame)">{mealLabel(m.mealType)}{m.time ? ` · ${m.time}` : ""}</p>
                    <p className="text-sm font-medium text-(--text-primary)">{m.title}</p>
                    <p className="mt-0.5 text-xs text-(--text-muted)">
                      {m.calories != null ? `${m.calories} kcal` : ""}{m.protein != null ? ` · P ${m.protein}g` : ""}{m.carbs != null ? ` · C ${m.carbs}g` : ""}{m.fats != null ? ` · F ${m.fats}g` : ""}
                    </p>
                    {m.notes && <p className="mt-0.5 text-xs text-(--text-secondary)">{m.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ── Create / Edit (full meal options) ───────────────────────────────── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit personal diet" : "New personal diet"} size="lg"
        footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</Button><Button variant="primary" onClick={() => void save()} disabled={saving}>{saving ? "Saving…" : "Save"}</Button></div>}>
        <div className="space-y-4">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Meal prep — high protein" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Category (optional)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Cutting / Bulking…" />
            <Select label="Day (optional)" options={DAYS.map((d) => ({ label: d ? d[0].toUpperCase() + d.slice(1) : "— none —", value: d }))} value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })} />
          </div>
          <Textarea label="Notes" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" />
          <div>
            <p className="mb-2 text-sm font-medium text-(--text-secondary)">Meals</p>
            <div className="space-y-3">
              {form.meals.map((m, i) => (
                <div key={i} className="rounded-xl border border-border p-2.5">
                  <div className="grid grid-cols-[120px_1fr_84px_28px] items-center gap-2">
                    <Select options={MEAL_TYPES.map((tp) => ({ label: mealLabel(tp), value: tp }))} value={m.mealType} onChange={(e) => updateMeal(i, { mealType: e.target.value as MealType })} />
                    <Input value={m.title} onChange={(e) => updateMeal(i, { title: e.target.value })} placeholder="Meal" />
                    <Input value={m.time ?? ""} onChange={(e) => updateMeal(i, { time: e.target.value })} placeholder="time" />
                    <button onClick={() => setForm({ ...form, meals: form.meals.filter((_, j) => j !== i) })} className="text-(--text-muted) hover:text-(--danger)"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {(["calories", "protein", "carbs", "fats"] as const).map((k) => (
                      <Input key={k} type="number" placeholder={k === "calories" ? "kcal" : k[0].toUpperCase() + " g"} value={num(m[k]) != null ? String(m[k]) : ""} onChange={(e) => updateMeal(i, { [k]: e.target.value === "" ? undefined : parseFloat(e.target.value) })} />
                    ))}
                  </div>
                  <Input className="mt-2" value={m.notes ?? ""} onChange={(e) => updateMeal(i, { notes: e.target.value })} placeholder="Meal notes (optional)" />
                </div>
              ))}
            </div>
            <Button variant="ghost" onClick={() => setForm({ ...form, meals: [...form.meals, { ...emptyMeal }] })} iconLeft={<Plus className="h-4 w-4" />}>Add meal</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
