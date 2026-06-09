import { router, useLocalSearchParams } from "expo-router";
import { Plus } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";

import {
  getMemberSummary, getMemberTimeline, createMemberEntry,
  type ProgressSummary, type ProgressEntry,
} from "../../src/api/progress.api";
import { useTheme } from "../../src/theme";
import {
  AppButton, AppCard, AppEmptyState, AppHeader, AppInput,
  AppLoadingState, AppScreen, AppText,
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

export default function MemberProgressScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const params = useLocalSearchParams<{ memberId?: string; name?: string }>();
  const memberId = params.memberId ?? "";

  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [timeline, setTimeline] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!memberId) { setLoading(false); return; }
    try {
      const [s, t] = await Promise.all([
        getMemberSummary(memberId), getMemberTimeline(memberId),
      ]);
      setSummary(s); setTimeline(t);
    } catch (err) {
      console.log("Member progress load failed", err);
    } finally {
      setLoading(false);
    }
  }, [memberId]);

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
      await createMemberEntry(memberId, payload);
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
        <AppHeader title="Member Progress" onBack={() => router.back()} />
        <AppLoadingState rows={4} />
      </AppScreen>
    );
  }

  const m = summary?.metrics ?? {};
  const hasData = (summary?.entryCount ?? 0) > 0;

  return (
    <AppScreen>
      <AppHeader
        title={params.name ? `${params.name} — Progress` : "Member Progress"}
        subtitle="Record & review measurements"
        onBack={() => router.back()}
        right={
          <AppButton size="sm" icon={<Plus size={16} color={c.onPrimary} />} onPress={() => setShowForm((s) => !s)}>
            {showForm ? "Close" : "Add"}
          </AppButton>
        }
      />

      {showForm ? (
        <AppCard>
          <AppText variant="label" color="textSecondary">New entry for this member</AppText>
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

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {CARDS.map((card) => {
          const data = m[card.key];
          return (
            <AppCard key={card.key} style={{ width: "47%" }}>
              <AppText variant="caption" color="textSecondary">{card.label}</AppText>
              <AppText variant="title" style={{ marginTop: 4 }}>
                {data ? `${data.latest}${card.unit}` : "—"}
              </AppText>
              {data?.changeSinceFirst != null ? (
                <AppText variant="caption" color="textMuted" style={{ marginTop: 2 }}>
                  {data.changeSinceFirst > 0 ? "+" : ""}{data.changeSinceFirst}{card.unit} total
                </AppText>
              ) : null}
            </AppCard>
          );
        })}
      </View>

      {!hasData ? (
        <AppEmptyState emoji="📈" title="No progress yet" description="Tap Add to record the first measurement." />
      ) : (
        <>
          <AppCard>
            <AppText variant="label" color="textSecondary">Summary</AppText>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
              <View>
                <AppText variant="title">{summary?.entryCount ?? 0}</AppText>
                <AppText variant="caption" color="textMuted">entries</AppText>
              </View>
              <View>
                <AppText variant="title">{summary?.consistencyScore ?? 0}%</AppText>
                <AppText variant="caption" color="textMuted">consistency</AppText>
              </View>
            </View>
          </AppCard>

          <AppText variant="label" color="textSecondary" style={{ marginTop: 4 }}>Timeline</AppText>
          <View style={{ gap: 8 }}>
            {timeline.map((e) => (
              <AppCard key={e.id}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <AppText variant="bodyStrong">{new Date(e.recordedAt).toLocaleDateString()}</AppText>
                  {e.weight != null ? <AppText variant="body">{e.weight} kg</AppText> : null}
                </View>
                <AppText variant="caption" color="textMuted" style={{ marginTop: 4 }}>
                  {[
                    e.bmi != null ? `BMI ${e.bmi}` : null,
                    e.bodyFatPercentage != null ? `BF ${e.bodyFatPercentage}%` : null,
                    e.waist != null ? `Waist ${e.waist}cm` : null,
                  ].filter(Boolean).join("  ·  ") || "—"}
                </AppText>
                {e.notes ? (
                  <AppText variant="caption" color="textSecondary" style={{ marginTop: 4 }}>{e.notes}</AppText>
                ) : null}
              </AppCard>
            ))}
          </View>
        </>
      )}
    </AppScreen>
  );
}
