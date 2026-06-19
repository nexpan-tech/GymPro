import { router } from "expo-router";
import { CheckCircle2, Plus, Target, Trash2 } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";

import { getMyGoals, createMyGoal, updateMyGoal, deleteMyGoal, type ProgressGoal } from "../../src/api/progress.api";
import { useTheme } from "../../src/theme";
import { useCelebrate } from "../../src/components/CelebrationProvider";
import { AppButton, AppCard, AppEmptyState, AppHeader, AppInput, AppLoadingState, AppScreen, AppText } from "../../src/components/ui";

function statusColor(status: string, c: ReturnType<typeof useTheme>["theme"]["colors"]) {
  return status === "COMPLETED" ? c.success : status === "ACTIVE" ? c.primary : c.textMuted;
}

// Phase O fix — member goals on mobile (was a broken Home link).
export default function GoalsScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const celebrate = useCelebrate();

  const [goals, setGoals] = useState<ProgressGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setGoals(await getMyGoals());
    } catch {
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function create() {
    const t = parseFloat(target);
    if (!title.trim() || Number.isNaN(t) || saving) return;
    setSaving(true);
    try {
      await createMyGoal({ title: title.trim(), targetValue: t });
      setTitle(""); setTarget(""); setAdding(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function complete(g: ProgressGoal) {
    await updateMyGoal(g.id, { status: "COMPLETED" }).catch(() => undefined);
    celebrate("GOAL", { message: `You crushed "${g.title}".` });
    await load();
  }

  async function remove(g: ProgressGoal) {
    await deleteMyGoal(g.id).catch(() => undefined);
    await load();
  }

  if (loading) {
    return (
      <AppScreen>
        <AppHeader title="Goals" onBack={() => router.back()} />
        <AppLoadingState rows={3} />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <AppHeader title="Goals" subtitle="Set targets, track progress" onBack={() => router.back()} />

      {adding ? (
        <AppCard>
          <AppText variant="bodyStrong" style={{ marginBottom: 8 }}>New goal</AppText>
          <AppInput placeholder="Title (e.g. Lose 5kg)" value={title} onChangeText={setTitle} />
          <View style={{ height: 8 }} />
          <AppInput placeholder="Target value" value={target} onChangeText={setTarget} keyboardType="numeric" />
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
            <View style={{ flex: 1 }}><AppButton variant="secondary" onPress={() => setAdding(false)}>Cancel</AppButton></View>
            <View style={{ flex: 1 }}><AppButton onPress={create} loading={saving}>Create</AppButton></View>
          </View>
        </AppCard>
      ) : (
        <AppButton onPress={() => setAdding(true)}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Plus color={c.onPrimary} size={16} />
            <AppText variant="label" style={{ color: c.onPrimary }}>New Goal</AppText>
          </View>
        </AppButton>
      )}

      {goals.length === 0 ? (
        <AppEmptyState emoji="🎯" title="No goals yet" description="Create your first goal — weight, attendance, workouts, or anything you want to achieve." />
      ) : (
        <View style={{ gap: 12 }}>
          {goals.map((g) => {
            const pct = Math.max(0, Math.min(100, Math.round(g.progressPercent ?? 0)));
            return (
              <AppCard key={g.id}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Target color={statusColor(g.status, c)} size={18} />
                  <AppText variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>{g.title}</AppText>
                  {g.status === "ACTIVE" ? (
                    <TouchableOpacity onPress={() => complete(g)} hitSlop={8}><CheckCircle2 color={c.success} size={20} /></TouchableOpacity>
                  ) : null}
                  <TouchableOpacity onPress={() => remove(g)} hitSlop={8}><Trash2 color={c.textMuted} size={18} /></TouchableOpacity>
                </View>
                <View style={{ marginTop: 10 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                    <AppText variant="caption" color="textMuted">
                      {g.currentValue ?? 0}{g.unit ? ` ${g.unit}` : ""} → {g.targetValue ?? 0}{g.unit ? ` ${g.unit}` : ""}
                    </AppText>
                    <AppText variant="caption" style={{ fontWeight: "800" }}>{g.status === "COMPLETED" ? 100 : pct}%</AppText>
                  </View>
                  <View style={{ height: 8, borderRadius: 4, backgroundColor: c.muted, overflow: "hidden" }}>
                    <View style={{ height: "100%", width: `${g.status === "COMPLETED" ? 100 : pct}%`, backgroundColor: g.status === "COMPLETED" ? c.success : c.primary }} />
                  </View>
                </View>
              </AppCard>
            );
          })}
        </View>
      )}
    </AppScreen>
  );
}
