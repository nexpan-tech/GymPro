import { router } from "expo-router";
import { CheckCircle2, Copy, Plus, Star, Trash2, Archive, Dumbbell, Pencil, Clock, X, History } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Modal, ScrollView, TouchableOpacity, View } from "react-native";

import { personalWorkoutApi, type PersonalWorkout, type PersonalExercise } from "../../src/api/personal.api";
import { useTheme } from "../../src/theme";
import { useCelebrate } from "../../src/components/CelebrationProvider";
import { AppBadge, AppButton, AppCard, AppEmptyState, AppHeader, AppInput, AppLoadingState, AppScreen, AppText } from "../../src/components/ui";

const CATEGORIES = ["STRENGTH", "CARDIO", "MOBILITY", "YOGA", "HIIT", "CROSSFIT", "RUNNING", "CYCLING", "OTHER"];
const DIFFICULTIES = ["", "BEGINNER", "INTERMEDIATE", "ADVANCED"];
const DAYS = ["", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const cap = (s?: string | null) => (s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : "");
const emptyEx: PersonalExercise = { name: "", sets: 3, reps: "10" };

export default function PersonalWorkoutsScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const celebrate = useCelebrate();

  const [items, setItems] = useState<PersonalWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  // form
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("STRENGTH");
  const [difficulty, setDifficulty] = useState("");
  const [day, setDay] = useState("");
  const [est, setEst] = useState("");
  const [muscles, setMuscles] = useState("");
  const [notes, setNotes] = useState("");
  const [exercises, setExercises] = useState<PersonalExercise[]>([{ ...emptyEx }]);
  const [saving, setSaving] = useState(false);
  // detail
  const [detail, setDetail] = useState<PersonalWorkout | null>(null);
  const [detailHistory, setDetailHistory] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await personalWorkoutApi.list(showArchived)); } catch { setItems([]); } finally { setLoading(false); }
  }, [showArchived]);
  useEffect(() => { void load(); }, [load]);

  function resetForm() {
    setEditingId(null); setTitle(""); setCategory("STRENGTH"); setDifficulty(""); setDay("");
    setEst(""); setMuscles(""); setNotes(""); setExercises([{ ...emptyEx }]);
  }
  function openCreate() { resetForm(); setAdding(true); }
  function openEdit(w: PersonalWorkout) {
    setDetail(null);
    setEditingId(w.id); setTitle(w.title); setCategory(w.category ?? "OTHER"); setDifficulty(w.difficulty ?? "");
    setDay(w.dayOfWeek ?? ""); setEst(w.estMinutes != null ? String(w.estMinutes) : ""); setMuscles((w.tags ?? []).join(", "));
    setNotes(w.notes ?? ""); setExercises(w.exercises.length ? w.exercises.map((e) => ({ ...e })) : [{ ...emptyEx }]);
    setAdding(true);
  }

  async function save() {
    const ex = exercises.filter((e) => e.name.trim());
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      const payload = {
        title: title.trim(), category, difficulty: (difficulty || undefined) as PersonalWorkout["difficulty"],
        tags: muscles.split(",").map((m) => m.trim()).filter(Boolean), dayOfWeek: day || undefined,
        estMinutes: est ? parseInt(est) : undefined, notes: notes || undefined, exercises: ex,
      };
      if (editingId) await personalWorkoutApi.update(editingId, payload);
      else await personalWorkoutApi.create(payload);
      resetForm(); setAdding(false); await load();
    } finally { setSaving(false); }
  }
  async function act(fn: () => Promise<unknown>) { await fn().catch(() => undefined); setDetail(null); await load(); }
  async function complete(w: PersonalWorkout) {
    await personalWorkoutApi.complete(w.id).catch(() => undefined);
    celebrate("WORKOUT", { message: `Logged "${w.title}".` }); setDetail(null);
  }
  async function openDetail(w: PersonalWorkout) {
    setDetail(w); setDetailHistory([]);
    const all = await personalWorkoutApi.history().catch(() => []);
    setDetailHistory(all.filter((h) => h.personalWorkout?.id === w.id).map((h) => h.completedAt));
  }

  const setEx = (i: number, patch: Partial<PersonalExercise>) => { const n = [...exercises]; n[i] = { ...n[i], ...patch }; setExercises(n); };
  const cycle = (arr: string[], cur: string, set: (v: string) => void) => set(arr[(arr.indexOf(cur) + 1) % arr.length]);

  if (loading) {
    return <AppScreen><AppHeader title="Personal Workouts" onBack={() => router.back()} /><AppLoadingState rows={3} /></AppScreen>;
  }

  return (
    <AppScreen>
      <AppHeader title="Personal Workouts" subtitle="Private to you — separate from trainer plans" onBack={() => router.back()} />

      {adding ? (
        <AppCard>
          <AppText variant="bodyStrong" style={{ marginBottom: 8 }}>{editingId ? "Edit workout" : "New workout"}</AppText>
          <AppInput placeholder="Title (e.g. Weekend cardio)" value={title} onChangeText={setTitle} />
          <View style={{ height: 8 }} />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <Chip label={`Category: ${cap(category)}`} onPress={() => cycle(CATEGORIES, category, setCategory)} />
            <Chip label={`Difficulty: ${difficulty ? cap(difficulty) : "Any"}`} onPress={() => cycle(DIFFICULTIES, difficulty, setDifficulty)} />
            <Chip label={`Day: ${day ? cap(day) : "Any"}`} onPress={() => cycle(DAYS, day, setDay)} />
          </View>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
            <View style={{ flex: 1 }}><AppInput placeholder="Est. minutes" keyboardType="numeric" value={est} onChangeText={setEst} /></View>
            <View style={{ flex: 2 }}><AppInput placeholder="Target muscles (comma sep.)" value={muscles} onChangeText={setMuscles} /></View>
          </View>
          <View style={{ height: 8 }} />
          <AppInput placeholder="Notes (optional)" value={notes} onChangeText={setNotes} multiline />
          <View style={{ height: 10 }} />
          <AppText variant="label" color="textMuted" style={{ marginBottom: 6 }}>Exercises</AppText>
          {exercises.map((ex, i) => (
            <View key={i} style={{ marginBottom: 8, padding: 8, borderRadius: theme.radius.sm, borderWidth: 1, borderColor: c.border }}>
              <View style={{ flexDirection: "row", gap: 6 }}>
                <View style={{ flex: 2 }}><AppInput placeholder="Exercise" value={ex.name} onChangeText={(v) => setEx(i, { name: v })} /></View>
                <View style={{ flex: 1 }}><AppInput placeholder="sets" keyboardType="numeric" value={String(ex.sets)} onChangeText={(v) => setEx(i, { sets: parseInt(v) || 0 })} /></View>
                <View style={{ flex: 1 }}><AppInput placeholder="reps" value={ex.reps} onChangeText={(v) => setEx(i, { reps: v })} /></View>
              </View>
              <View style={{ flexDirection: "row", gap: 6, marginTop: 6, alignItems: "center" }}>
                <View style={{ flex: 1 }}><AppInput placeholder="rest (s)" keyboardType="numeric" value={ex.restSeconds != null ? String(ex.restSeconds) : ""} onChangeText={(v) => setEx(i, { restSeconds: v === "" ? undefined : parseInt(v) })} /></View>
                <View style={{ flex: 2 }}><AppInput placeholder="notes" value={ex.notes ?? ""} onChangeText={(v) => setEx(i, { notes: v })} /></View>
                {exercises.length > 1 ? (
                  <TouchableOpacity onPress={() => setExercises(exercises.filter((_, j) => j !== i))} hitSlop={8}><Trash2 color={c.textMuted} size={18} /></TouchableOpacity>
                ) : null}
              </View>
            </View>
          ))}
          <TouchableOpacity onPress={() => setExercises([...exercises, { ...emptyEx }])} style={{ paddingVertical: 6 }}>
            <AppText variant="label" color="primary">+ Add exercise</AppText>
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
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}><Plus color={c.onPrimary} size={16} /><AppText variant="label" style={{ color: c.onPrimary }}>New Workout</AppText></View>
            </AppButton>
          </View>
        </View>
      )}

      {items.length === 0 ? (
        <AppEmptyState emoji="💪" title={showArchived ? "Nothing archived" : "No personal workouts"} description={showArchived ? "Archived workouts show up here." : "Create your own — weekend sessions, extra cardio, a favourite routine."} />
      ) : (
        <View style={{ gap: 10 }}>
          {items.map((w) => (
            <TouchableOpacity key={w.id} activeOpacity={0.85} onPress={() => openDetail(w)}>
              <AppCard>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  {w.isFavorite ? <Star color={c.primary} size={14} fill={c.primary} /> : <Dumbbell color={c.primary} size={16} />}
                  <AppText variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>{w.title}</AppText>
                  {w.isArchived ? <AppBadge label="Archived" tone="warning" /> : null}
                </View>
                <AppText variant="caption" color="textMuted" style={{ marginTop: 2 }}>
                  Personal · {w.exercises.length} exercise{w.exercises.length === 1 ? "" : "s"}
                  {w.estMinutes ? ` · ~${w.estMinutes}m` : ""}{w.category ? ` · ${cap(w.category)}` : ""}{w.dayOfWeek ? ` · ${cap(w.dayOfWeek)}` : ""}
                </AppText>
                <View style={{ flexDirection: "row", gap: 14, marginTop: 10 }}>
                  {!w.isArchived ? <TouchableOpacity onPress={() => complete(w)} hitSlop={8}><CheckCircle2 color={c.success} size={20} /></TouchableOpacity> : null}
                  <TouchableOpacity onPress={() => act(() => personalWorkoutApi.favorite(w.id))} hitSlop={8}><Star color={w.isFavorite ? c.primary : c.textMuted} size={20} fill={w.isFavorite ? c.primary : "transparent"} /></TouchableOpacity>
                  <TouchableOpacity onPress={() => openEdit(w)} hitSlop={8}><Pencil color={c.textMuted} size={20} /></TouchableOpacity>
                  <TouchableOpacity onPress={() => act(() => personalWorkoutApi.duplicate(w.id))} hitSlop={8}><Copy color={c.textMuted} size={20} /></TouchableOpacity>
                  <TouchableOpacity onPress={() => act(() => personalWorkoutApi.archive(w.id, !w.isArchived))} hitSlop={8}><Archive color={c.textMuted} size={20} /></TouchableOpacity>
                  <TouchableOpacity onPress={() => act(() => personalWorkoutApi.remove(w.id))} hitSlop={8}><Trash2 color={c.textMuted} size={20} /></TouchableOpacity>
                </View>
              </AppCard>
            </TouchableOpacity>
          ))}
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
                  {detail.category ? <AppBadge label={cap(detail.category)} tone="info" /> : null}
                  {detail.difficulty ? <AppBadge label={cap(detail.difficulty)} tone="neutral" /> : null}
                  {detail.dayOfWeek ? <AppBadge label={cap(detail.dayOfWeek)} tone="neutral" /> : null}
                  {detail.isFavorite ? <AppBadge label="Favorite" tone="warning" /> : null}
                  {detail.isArchived ? <AppBadge label="Archived" tone="warning" /> : null}
                </View>
                <View style={{ flexDirection: "row", gap: 14, marginBottom: 10 }}>
                  {detail.estMinutes ? <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}><Clock color={c.textMuted} size={14} /><AppText variant="caption" color="textMuted">~{detail.estMinutes} min</AppText></View> : null}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}><Dumbbell color={c.textMuted} size={14} /><AppText variant="caption" color="textMuted">{detail.exercises.length} exercises</AppText></View>
                </View>
                {detail.tags?.length ? <AppText variant="caption" color="textSecondary" style={{ marginBottom: 8 }}>Focus: {detail.tags.join(", ")}</AppText> : null}
                {detail.notes ? <AppText variant="body" color="textSecondary" style={{ marginBottom: 10 }}>{detail.notes}</AppText> : null}

                <AppText variant="label" style={{ marginBottom: 6 }}>Exercises</AppText>
                <View style={{ gap: 6 }}>
                  {detail.exercises.map((e, i) => (
                    <View key={e.id ?? i} style={{ padding: 10, borderRadius: theme.radius.sm, borderWidth: 1, borderColor: c.border }}>
                      <AppText variant="bodyStrong">{e.name}</AppText>
                      <AppText variant="caption" color="textMuted">{e.sets} × {e.reps}{e.restSeconds ? ` · ${e.restSeconds}s rest` : ""}</AppText>
                      {e.notes ? <AppText variant="caption" color="textSecondary" style={{ marginTop: 2 }}>{e.notes}</AppText> : null}
                    </View>
                  ))}
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14, marginBottom: 6 }}>
                  <History color={c.textMuted} size={15} /><AppText variant="label">Completion history</AppText>
                </View>
                {detailHistory.length === 0 ? (
                  <AppText variant="caption" color="textMuted">No completions logged yet.</AppText>
                ) : (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                    {detailHistory.slice(0, 24).map((d, i) => (
                      <AppBadge key={i} label={new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" })} tone="success" />
                    ))}
                  </View>
                )}

                <View style={{ flexDirection: "row", gap: 8, marginTop: 16, marginBottom: 8 }}>
                  {!detail.isArchived ? <View style={{ flex: 1 }}><AppButton onPress={() => complete(detail)}>Complete</AppButton></View> : null}
                  <View style={{ flex: 1 }}><AppButton variant="secondary" onPress={() => openEdit(detail)}>Edit</AppButton></View>
                </View>
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 4 }}>
                  <View style={{ flex: 1 }}><AppButton variant="secondary" onPress={() => act(() => personalWorkoutApi.duplicate(detail.id))}>Duplicate</AppButton></View>
                  <View style={{ flex: 1 }}><AppButton variant="secondary" onPress={() => act(() => personalWorkoutApi.remove(detail.id))}>Delete</AppButton></View>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}

function Chip({ label, onPress }: { label: string; onPress: () => void }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <TouchableOpacity onPress={onPress} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: theme.radius.sm, backgroundColor: c.primarySoft }}>
      <AppText variant="caption" style={{ color: c.primary, fontWeight: "700" }}>{label}</AppText>
    </TouchableOpacity>
  );
}
