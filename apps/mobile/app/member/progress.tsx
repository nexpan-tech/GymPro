import { router } from "expo-router";
import { Plus, TrendingDown, TrendingUp, Minus, Target, Flame } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";

import {
  getMySummary, getMyTimeline, getMyGoals, createMyEntry,
  type ProgressSummary, type ProgressEntry, type ProgressGoal, type Trend,
} from "../../src/api/progress.api";
import { useTheme } from "../../src/theme";
import {
  AppButton, AppCard, AppEmptyState, AppHeader, AppInput,
  AppLoadingState, AppScreen, AppText, ProgressBar, ScorePill,
} from "../../src/components/ui";

const FIELDS: { key: string; label: string; unit: string }[] = [
  { key: "weight", label: "Weight", unit: "kg" },
  { key: "height", label: "Height", unit: "cm" },
  { key: "bodyFatPercentage", label: "Body Fat", unit: "%" },
  { key: "muscleMass", label: "Muscle Mass", unit: "kg" },
  { key: "chest", label: "Chest", unit: "cm" },
  { key: "waist", label: "Waist", unit: "cm" },
  { key: "hips", label: "Hips", unit: "cm" },
  { key: "arms", label: "Arms", unit: "cm" },
  { key: "thighs", label: "Thighs", unit: "cm" },
];

const CARDS = [
  { key: "weight", label: "Weight", unit: "kg" },
  { key: "bmi", label: "BMI", unit: "" },
  { key: "bodyFatPercentage", label: "Body Fat", unit: "%" },
  { key: "waist", label: "Waist", unit: "cm" },
];

function TrendIcon({ trend, color }: { trend: Trend; color: string }) {
  if (trend === "UP") return <TrendingUp size={16} color={color} />;
  if (trend === "DOWN") return <TrendingDown size={16} color={color} />;
  return <Minus size={16} color={color} />;
}

export default function ProgressScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [timeline, setTimeline] = useState<ProgressEntry[]>([]);
  const [goals, setGoals] = useState<ProgressGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, t, g] = await Promise.all([
        getMySummary(), getMyTimeline(), getMyGoals(),
      ]);
      setSummary(s); setTimeline(t); setGoals(g);
    } catch (err) {
      console.log("Progress load failed", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function save() {
    const payload: Record<string, number | string> = {};
    for (const f of FIELDS) {
      const v = form[f.key]?.trim();
      if (v) payload[f.key] = Number(v);
    }
    if (Object.keys(payload).length === 0) return;
    if (form.notes?.trim()) payload.notes = form.notes.trim();
    setSaving(true);
    try {
      await createMyEntry(payload);
      setForm({});
      setShowForm(false);
      setLoading(true);
      await load();
    } catch (err) {
      console.log("Save entry failed", err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AppScreen>
        <AppHeader title="Transformation" onBack={() => router.back()} />
        <AppLoadingState rows={4} />
      </AppScreen>
    );
  }

  const m = summary?.metrics ?? {};
  const hasData = (summary?.entryCount ?? 0) > 0;
  const consistency = summary?.consistencyScore ?? 0;
  const consistencyMsg =
    consistency >= 80
      ? "Elite consistency. Your body is responding to the work."
      : consistency >= 50
        ? "Solid rhythm. Keep logging to reveal the full picture."
        : "Every entry tells your story. Keep showing up.";

  return (
    <AppScreen>
      <AppHeader
        title="Transformation"
        subtitle="Your measurable journey"
        onBack={() => router.back()}
        right={
          <AppButton size="sm" icon={<Plus size={16} color={c.onPrimary} />} onPress={() => setShowForm((s) => !s)}>
            {showForm ? "Close" : "Add"}
          </AppButton>
        }
      />

      {/* Add-entry form (numeric only — no photos/camera) */}
      {showForm ? (
        <AppCard>
          <AppText variant="label" color="textSecondary">New entry (BMI auto-calculated)</AppText>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
            {FIELDS.map((f) => (
              <View key={f.key} style={{ width: "47%" }}>
                <AppInput
                  label={`${f.label} (${f.unit})`}
                  keyboardType="numeric"
                  value={form[f.key] ?? ""}
                  onChangeText={(v) => setForm((p) => ({ ...p, [f.key]: v }))}
                />
              </View>
            ))}
          </View>
          <View style={{ marginTop: 6 }}>
            <AppInput label="Notes" value={form.notes ?? ""} onChangeText={(v) => setForm((p) => ({ ...p, notes: v }))} />
          </View>
          <AppButton onPress={save} loading={saving} style={{ marginTop: 12 }}>Save Entry</AppButton>
        </AppCard>
      ) : null}

      {/* ── Transformation hero ─────────────────────────────────────────────── */}
      {hasData ? (
        <AppCard variant="elevated">
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Flame color={c.primary} size={16} />
                <AppText variant="overline" color="primary">Consistency</AppText>
              </View>
              <AppText style={{ fontSize: 38, fontWeight: "900", color: c.textPrimary, letterSpacing: -1, marginTop: 4 }}>
                {consistency}%
              </AppText>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <AppText style={{ fontSize: 22, fontWeight: "900", color: c.primary }}>
                {summary?.entryCount ?? 0}
              </AppText>
              <AppText variant="caption" color="textMuted">entries logged</AppText>
            </View>
          </View>
          <View style={{ marginTop: 14 }}>
            <ProgressBar progress={consistency / 100} />
          </View>
          <AppText variant="caption" color="textSecondary" style={{ marginTop: 10, lineHeight: 18 }}>
            {consistencyMsg}
          </AppText>
        </AppCard>
      ) : null}

      {/* Metric cards — your changes since day one */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {CARDS.map((card) => {
          const data = m[card.key];
          return (
            <AppCard key={card.key} style={{ width: "47%" }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <AppText variant="caption" color="textSecondary">{card.label}</AppText>
                {data ? <TrendIcon trend={data.trend} color={c.textMuted} /> : null}
              </View>
              <AppText variant="title" style={{ marginTop: 4 }}>
                {data ? `${data.latest}${card.unit}` : "—"}
              </AppText>
              {data?.changeSinceFirst != null ? (
                <View
                  style={{
                    alignSelf: "flex-start",
                    marginTop: 8,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: theme.radius.sm,
                    backgroundColor: data.changeSinceFirst !== 0 ? c.primarySoft : c.muted,
                  }}
                >
                  <AppText variant="caption" style={{ color: data.changeSinceFirst !== 0 ? c.primary : c.textMuted, fontWeight: "800" }}>
                    {data.changeSinceFirst > 0 ? "+" : ""}{data.changeSinceFirst}{card.unit} since start
                  </AppText>
                </View>
              ) : null}
            </AppCard>
          );
        })}
      </View>

      {!hasData ? (
        <AppEmptyState
          emoji="📈"
          title="Your transformation starts here"
          description="Log your first measurements and watch the story of your progress unfold — one honest number at a time."
        />
      ) : (
        <>
          {/* Goals */}
          {goals.length > 0 ? (
            <AppCard>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Target size={16} color={c.primary} />
                <AppText variant="label" color="textSecondary">Goals</AppText>
              </View>
              {goals.map((g) => (
                <View key={g.id} style={{ marginBottom: 14 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                    <AppText variant="bodyStrong">{g.title}</AppText>
                    <AppText variant="caption" color="primary" style={{ fontWeight: "800" }}>{g.progressPercent}%</AppText>
                  </View>
                  <ProgressBar progress={(g.progressPercent ?? 0) / 100} height={6} />
                </View>
              ))}
            </AppCard>
          ) : null}

          {/* Timeline */}
          <AppText variant="heading" style={{ marginTop: 4 }}>Your timeline</AppText>
          <View style={{ gap: 8 }}>
            {timeline.map((e, idx) => {
              const isFirst = idx === timeline.length - 1;
              return (
                <AppCard key={e.id} style={{ borderColor: isFirst ? c.primary : c.border }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <View
                        style={{
                          height: 10,
                          width: 10,
                          borderRadius: 5,
                          backgroundColor: c.primary,
                        }}
                      />
                      <AppText variant="bodyStrong">{new Date(e.recordedAt).toLocaleDateString()}</AppText>
                    </View>
                    {e.weight != null ? <AppText variant="body" color="primary" style={{ fontWeight: "800" }}>{e.weight} kg</AppText> : null}
                  </View>
                  <AppText variant="caption" color="textMuted" style={{ marginTop: 6, marginLeft: 20 }}>
                    {[
                      e.bmi != null ? `BMI ${e.bmi}` : null,
                      e.bodyFatPercentage != null ? `BF ${e.bodyFatPercentage}%` : null,
                      e.waist != null ? `Waist ${e.waist}cm` : null,
                    ].filter(Boolean).join("  ·  ") || "—"}
                  </AppText>
                  {isFirst ? (
                    <AppText variant="caption" color="primary" style={{ marginTop: 6, marginLeft: 20, fontWeight: "700" }}>
                      ⭐ Where it all began
                    </AppText>
                  ) : null}
                  {e.notes ? (
                    <AppText variant="caption" color="textSecondary" style={{ marginTop: 4, marginLeft: 20 }}>{e.notes}</AppText>
                  ) : null}
                </AppCard>
              );
            })}
          </View>
        </>
      )}
    </AppScreen>
  );
}
