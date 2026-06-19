import { router } from "expo-router";
import { Copy, Plus, Star, Trash2, Archive, Salad, Pencil, X } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Modal, ScrollView, TouchableOpacity, View } from "react-native";

import { personalDietApi, type PersonalDiet, type PersonalMeal, type MealType } from "../../src/api/personal.api";
import { useTheme } from "../../src/theme";
import { AppBadge, AppButton, AppCard, AppEmptyState, AppHeader, AppInput, AppLoadingState, AppScreen, AppText } from "../../src/components/ui";

const MEAL_TYPES: MealType[] = ["BREAKFAST", "LUNCH", "DINNER", "SNACK", "PRE_WORKOUT", "POST_WORKOUT"];
const MEAL_ORDER: Record<string, number> = { BREAKFAST: 0, PRE_WORKOUT: 1, LUNCH: 2, SNACK: 3, POST_WORKOUT: 4, DINNER: 5 };
const DAYS = ["", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const cap = (s?: string | null) => (s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : "");
const mealLabel = (t: string) => t.toLowerCase().split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
const emptyMeal: PersonalMeal = { mealType: "BREAKFAST", title: "" };

export default function PersonalDietsScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [items, setItems] = useState<PersonalDiet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  // form
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [day, setDay] = useState("");
  const [notes, setNotes] = useState("");
  const [meals, setMeals] = useState<PersonalMeal[]>([{ ...emptyMeal }]);
  const [saving, setSaving] = useState(false);
  // detail
  const [detail, setDetail] = useState<PersonalDiet | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await personalDietApi.list(showArchived)); } catch { setItems([]); } finally { setLoading(false); }
  }, [showArchived]);
  useEffect(() => { void load(); }, [load]);

  function resetForm() { setEditingId(null); setTitle(""); setCategory(""); setDay(""); setNotes(""); setMeals([{ ...emptyMeal }]); }
  function openCreate() { resetForm(); setAdding(true); }
  function openEdit(d: PersonalDiet) {
    setDetail(null);
    setEditingId(d.id); setTitle(d.title); setCategory(d.category ?? ""); setDay(d.dayOfWeek ?? "");
    setNotes(d.notes ?? ""); setMeals(d.meals.length ? d.meals.map((m) => ({ ...m })) : [{ ...emptyMeal }]);
    setAdding(true);
  }

  async function save() {
    const m = meals.filter((x) => x.title.trim());
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      const payload = { title: title.trim(), category: category || undefined, dayOfWeek: day || undefined, notes: notes || undefined, meals: m };
      if (editingId) await personalDietApi.update(editingId, payload);
      else await personalDietApi.create(payload);
      resetForm(); setAdding(false); await load();
    } finally { setSaving(false); }
  }
  async function act(fn: () => Promise<unknown>) { await fn().catch(() => undefined); setDetail(null); await load(); }

  const setMeal = (i: number, patch: Partial<PersonalMeal>) => { const n = [...meals]; n[i] = { ...n[i], ...patch }; setMeals(n); };
  const cycleType = (i: number) => { const idx = MEAL_TYPES.indexOf(meals[i].mealType); setMeal(i, { mealType: MEAL_TYPES[(idx + 1) % MEAL_TYPES.length] }); };
  const cycleDay = () => setDay(DAYS[(DAYS.indexOf(day) + 1) % DAYS.length]);
  const kcalOf = (d: PersonalDiet) => d.meals.reduce((s, m) => s + (m.calories ?? 0), 0);

  if (loading) {
    return <AppScreen><AppHeader title="Personal Diets" onBack={() => router.back()} /><AppLoadingState rows={3} /></AppScreen>;
  }

  return (
    <AppScreen>
      <AppHeader title="Personal Diets" subtitle="Private to you — separate from trainer plans" onBack={() => router.back()} />

      {adding ? (
        <AppCard>
          <AppText variant="bodyStrong" style={{ marginBottom: 8 }}>{editingId ? "Edit diet" : "New diet"}</AppText>
          <AppInput placeholder="Title (e.g. Meal prep)" value={title} onChangeText={setTitle} />
          <View style={{ height: 8 }} />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1 }}><AppInput placeholder="Category" value={category} onChangeText={setCategory} /></View>
            <TouchableOpacity onPress={cycleDay} style={{ flex: 1, justifyContent: "center", paddingHorizontal: 12, borderRadius: theme.radius.sm, backgroundColor: c.primarySoft }}>
              <AppText variant="caption" style={{ color: c.primary, fontWeight: "700" }}>Day: {day ? cap(day) : "Any"}</AppText>
            </TouchableOpacity>
          </View>
          <View style={{ height: 8 }} />
          <AppInput placeholder="Notes (optional)" value={notes} onChangeText={setNotes} multiline />
          <View style={{ height: 10 }} />
          <AppText variant="label" color="textMuted" style={{ marginBottom: 6 }}>Meals</AppText>
          {meals.map((m, i) => (
            <View key={i} style={{ marginBottom: 8, padding: 8, borderRadius: theme.radius.sm, borderWidth: 1, borderColor: c.border }}>
              <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                <TouchableOpacity onPress={() => cycleType(i)} style={{ paddingHorizontal: 10, paddingVertical: 10, borderRadius: theme.radius.sm, backgroundColor: c.primarySoft }}>
                  <AppText variant="caption" style={{ color: c.primary, fontWeight: "800" }}>{m.mealType.split("_")[0].slice(0, 3)}</AppText>
                </TouchableOpacity>
                <View style={{ flex: 2 }}><AppInput placeholder="Meal" value={m.title} onChangeText={(v) => setMeal(i, { title: v })} /></View>
                <View style={{ flex: 1 }}><AppInput placeholder="time" value={m.time ?? ""} onChangeText={(v) => setMeal(i, { time: v })} /></View>
                {meals.length > 1 ? <TouchableOpacity onPress={() => setMeals(meals.filter((_, j) => j !== i))} hitSlop={8}><Trash2 color={c.textMuted} size={18} /></TouchableOpacity> : null}
              </View>
              <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
                <View style={{ flex: 1 }}><AppInput placeholder="kcal" keyboardType="numeric" value={m.calories != null ? String(m.calories) : ""} onChangeText={(v) => setMeal(i, { calories: v === "" ? undefined : parseInt(v) })} /></View>
                <View style={{ flex: 1 }}><AppInput placeholder="P" keyboardType="numeric" value={m.protein != null ? String(m.protein) : ""} onChangeText={(v) => setMeal(i, { protein: v === "" ? undefined : parseFloat(v) })} /></View>
                <View style={{ flex: 1 }}><AppInput placeholder="C" keyboardType="numeric" value={m.carbs != null ? String(m.carbs) : ""} onChangeText={(v) => setMeal(i, { carbs: v === "" ? undefined : parseFloat(v) })} /></View>
                <View style={{ flex: 1 }}><AppInput placeholder="F" keyboardType="numeric" value={m.fats != null ? String(m.fats) : ""} onChangeText={(v) => setMeal(i, { fats: v === "" ? undefined : parseFloat(v) })} /></View>
              </View>
              <View style={{ height: 6 }} />
              <AppInput placeholder="Meal notes (optional)" value={m.notes ?? ""} onChangeText={(v) => setMeal(i, { notes: v })} />
            </View>
          ))}
          <TouchableOpacity onPress={() => setMeals([...meals, { ...emptyMeal }])} style={{ paddingVertical: 6 }}>
            <AppText variant="label" color="primary">+ Add meal</AppText>
          </TouchableOpacity>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
            <View style={{ flex: 1 }}><AppButton variant="secondary" onPress={() => { setAdding(false); resetForm(); }}>Cancel</AppButton></View>
            <View style={{ flex: 1 }}><AppButton onPress={save} loading={saving}>{editingId ? "Save" : "Create"}</AppButton></View>
          </View>
        </AppCard>
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <TouchableOpacity onPress={() => setShowArchived((s) => !s)} hitSlop={8}>
            <AppText variant="label" color="primary">{showArchived ? "Show active" : "Show archived"}</AppText>
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <AppButton onPress={openCreate}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}><Plus color={c.onPrimary} size={16} /><AppText variant="label" style={{ color: c.onPrimary }}>New Diet</AppText></View>
            </AppButton>
          </View>
        </View>
      )}

      {items.length === 0 ? (
        <AppEmptyState emoji="🥗" title={showArchived ? "Nothing archived" : "No personal diets"} description={showArchived ? "Archived diets show up here." : "Create your own — meal prep, a macro plan, your favourite meals."} />
      ) : (
        <View style={{ gap: 10 }}>
          {items.map((d) => {
            const kcal = kcalOf(d);
            return (
              <TouchableOpacity key={d.id} activeOpacity={0.85} onPress={() => setDetail(d)}>
                <AppCard>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    {d.isFavorite ? <Star color={c.primary} size={14} fill={c.primary} /> : <Salad color={c.primary} size={16} />}
                    <AppText variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>{d.title}</AppText>
                    {d.isArchived ? <AppBadge label="Archived" tone="warning" /> : null}
                  </View>
                  <AppText variant="caption" color="textMuted" style={{ marginTop: 2 }}>
                    Personal · {d.meals.length} meal{d.meals.length === 1 ? "" : "s"}{kcal > 0 ? ` · ${kcal} kcal` : ""}{d.category ? ` · ${d.category}` : ""}{d.dayOfWeek ? ` · ${cap(d.dayOfWeek)}` : ""}
                  </AppText>
                  <View style={{ flexDirection: "row", gap: 14, marginTop: 10 }}>
                    <TouchableOpacity onPress={() => act(() => personalDietApi.favorite(d.id))} hitSlop={8}><Star color={d.isFavorite ? c.primary : c.textMuted} size={20} fill={d.isFavorite ? c.primary : "transparent"} /></TouchableOpacity>
                    <TouchableOpacity onPress={() => openEdit(d)} hitSlop={8}><Pencil color={c.textMuted} size={20} /></TouchableOpacity>
                    <TouchableOpacity onPress={() => act(() => personalDietApi.duplicate(d.id))} hitSlop={8}><Copy color={c.textMuted} size={20} /></TouchableOpacity>
                    <TouchableOpacity onPress={() => act(() => personalDietApi.archive(d.id, !d.isArchived))} hitSlop={8}><Archive color={c.textMuted} size={20} /></TouchableOpacity>
                    <TouchableOpacity onPress={() => act(() => personalDietApi.remove(d.id))} hitSlop={8}><Trash2 color={c.textMuted} size={20} /></TouchableOpacity>
                  </View>
                </AppCard>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* ── Detail modal ─────────────────────────────────────────────────── */}
      <Modal visible={!!detail} animationType="slide" transparent onRequestClose={() => setDetail(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
          <View style={{ maxHeight: "88%", backgroundColor: c.surface, borderTopLeftRadius: theme.radius.xl, borderTopRightRadius: theme.radius.xl, padding: theme.spacing.lg }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <AppText variant="heading" style={{ flex: 1 }} numberOfLines={1}>{detail?.title}</AppText>
              <TouchableOpacity onPress={() => setDetail(null)} hitSlop={8}><X color={c.textMuted} size={22} /></TouchableOpacity>
            </View>
            {detail ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                  <AppBadge label="Personal Plan" tone="primary" />
                  {detail.category ? <AppBadge label={detail.category} tone="info" /> : null}
                  {detail.dayOfWeek ? <AppBadge label={cap(detail.dayOfWeek)} tone="neutral" /> : null}
                  {detail.isFavorite ? <AppBadge label="Favorite" tone="warning" /> : null}
                  {detail.isArchived ? <AppBadge label="Archived" tone="warning" /> : null}
                </View>
                {kcalOf(detail) > 0 ? (
                  <AppText variant="caption" color="textSecondary" style={{ marginBottom: 8 }}>
                    Daily total: {kcalOf(detail)} kcal · P {detail.meals.reduce((s, m) => s + (m.protein ?? 0), 0)}g · C {detail.meals.reduce((s, m) => s + (m.carbs ?? 0), 0)}g · F {detail.meals.reduce((s, m) => s + (m.fats ?? 0), 0)}g
                  </AppText>
                ) : null}
                {detail.notes ? <AppText variant="body" color="textSecondary" style={{ marginBottom: 10 }}>{detail.notes}</AppText> : null}

                <View style={{ gap: 6 }}>
                  {[...detail.meals].sort((a, b) => (MEAL_ORDER[a.mealType] ?? 9) - (MEAL_ORDER[b.mealType] ?? 9)).map((m, i) => (
                    <View key={m.id ?? i} style={{ padding: 10, borderRadius: theme.radius.sm, borderWidth: 1, borderColor: c.border }}>
                      <AppText variant="overline" color="primary">{mealLabel(m.mealType)}{m.time ? ` · ${m.time}` : ""}</AppText>
                      <AppText variant="bodyStrong" style={{ marginTop: 2 }}>{m.title}</AppText>
                      <AppText variant="caption" color="textMuted" style={{ marginTop: 2 }}>
                        {m.calories != null ? `${m.calories} kcal` : ""}{m.protein != null ? ` · P ${m.protein}g` : ""}{m.carbs != null ? ` · C ${m.carbs}g` : ""}{m.fats != null ? ` · F ${m.fats}g` : ""}
                      </AppText>
                      {m.notes ? <AppText variant="caption" color="textSecondary" style={{ marginTop: 2 }}>{m.notes}</AppText> : null}
                    </View>
                  ))}
                </View>

                <View style={{ flexDirection: "row", gap: 8, marginTop: 16, marginBottom: 8 }}>
                  <View style={{ flex: 1 }}><AppButton variant="secondary" onPress={() => openEdit(detail)}>Edit</AppButton></View>
                  <View style={{ flex: 1 }}><AppButton variant="secondary" onPress={() => act(() => personalDietApi.duplicate(detail.id))}>Duplicate</AppButton></View>
                </View>
                <View style={{ marginBottom: 4 }}>
                  <AppButton variant="secondary" onPress={() => act(() => personalDietApi.remove(detail.id))}>Delete</AppButton>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}
