import { router } from "expo-router";
import { Droplets, Flame, Salad, Sparkles } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TouchableOpacity, View } from "react-native";

import { dietService, type TodayDiet, type DietWeek } from "../../src/services/diet.service";
import { personalDietApi, type PersonalDiet } from "../../src/api/personal.api";
import { useTheme } from "../../src/theme";
import {
  AppBadge,
  AppCard,
  AppEmptyState,
  AppHeader,
  AppLoadingState,
  AppScreen,
  AppText,
  CelebrationCard,
  ProgressBar,
  ScorePill,
} from "../../src/components/ui";

const MEAL_ORDER: Record<string, number> = {
  BREAKFAST: 0, MORNING_SNACK: 1, LUNCH: 2, SNACK: 3, EVENING_SNACK: 4, DINNER: 5,
};

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const cap = (s?: string | null) => (s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : "");

function mealTypeLabel(t: string): string {
  return t.toLowerCase().split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

const WATER_GOAL = 8;

// Today's meals only — sourced from GET /diets/my/today (day-of-week filtered).
export default function DietScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [today, setToday] = useState<TodayDiet | null>(null);
  const [week, setWeek] = useState<DietWeek | null>(null);
  const [showWeek, setShowWeek] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dayDone, setDayDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [water, setWater] = useState(0);
  const [personal, setPersonal] = useState<PersonalDiet[]>([]);

  const load = useCallback(async () => {
    try {
      const [t, p] = await Promise.all([
        dietService.getMyToday(),
        personalDietApi.list(false).catch(() => [] as PersonalDiet[]),
      ]);
      setToday(t);
      setPersonal(p);
    } catch (err) {
      console.log("Diet load failed", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (showWeek && !week) void dietService.getMyWeek().then(setWeek).catch(() => setWeek(null));
  }, [showWeek, week]);

  const meals = useMemo(
    () => [...(today?.meals ?? [])].sort((a, b) => (MEAL_ORDER[a.mealType] ?? 9) - (MEAL_ORDER[b.mealType] ?? 9)),
    [today],
  );

  const totals = useMemo(
    () =>
      meals.reduce(
        (acc, m) => ({
          kcal: acc.kcal + (m.calories ?? 0),
          protein: acc.protein + (m.protein ?? 0),
          carbs: acc.carbs + (m.carbs ?? 0),
          fats: acc.fats + (m.fats ?? 0),
        }),
        { kcal: 0, protein: 0, carbs: 0, fats: 0 },
      ),
    [meals],
  );

  const coachTip = useMemo(() => {
    if (totals.protein >= 120) return "Strong protein target today — perfect for muscle repair and recovery.";
    if (totals.kcal > 0 && totals.kcal < 1500) return "Lighter calorie day. Stay hydrated and listen to your energy.";
    if (meals.length >= 4) return "Balanced meal spacing keeps energy steady. Eat on schedule for best results.";
    return "Fuel with intention. Every meal you log is a vote for the body you're building.";
  }, [totals, meals.length]);

  async function markDayComplete() {
    if (!today?.planId || dayDone || saving) return;
    setSaving(true);
    try {
      await dietService.complete({ dietPlanId: today.planId, dayOfWeek: today.day });
      setDayDone(true);
    } catch (err) {
      console.log("Diet completion failed", err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AppScreen>
        <AppHeader title="Today's Nutrition" onBack={() => router.back()} />
        <AppLoadingState rows={4} />
      </AppScreen>
    );
  }

  const dayLabel = today?.day ? today.day.charAt(0).toUpperCase() + today.day.slice(1) : "Today";

  return (
    <AppScreen>
      <AppHeader title="Today's Nutrition" subtitle={today?.goal || "Your daily fuel plan"} onBack={() => router.back()} />

      {/* Today's nutrition hero */}
      {meals.length > 0 ? (
        dayDone ? (
          <CelebrationCard
            emoji="🥗"
            title="Nutrition locked in"
            message="You fuelled your body right today. Consistency like this is how transformations are made."
          />
        ) : (
          <AppCard variant="elevated">
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Salad color={c.primary} size={18} />
              <AppText variant="overline" color="primary">{dayLabel}'s Nutrition</AppText>
            </View>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <ScorePill value={`${totals.kcal}`} label="Calories" emphasis />
              <ScorePill value={`${totals.protein}g`} label="Protein" />
              <ScorePill value={`${meals.length}`} label="Meals" />
            </View>
            <AppText variant="caption" color="textMuted" style={{ marginTop: 10 }}>
              {totals.carbs}g carbs · {totals.fats}g fats planned today
            </AppText>
          </AppCard>
        )
      ) : null}

      {/* Hydration tracker (session-local) */}
      <AppCard>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Droplets color={c.primary} size={18} />
            <AppText variant="bodyStrong">Hydration</AppText>
          </View>
          <AppText variant="caption" color="textMuted">{water} / {WATER_GOAL} glasses</AppText>
        </View>
        <View style={{ flexDirection: "row", gap: 6, marginTop: 12 }}>
          {Array.from({ length: WATER_GOAL }).map((_, i) => {
            const filled = i < water;
            return (
              <TouchableOpacity
                key={i}
                activeOpacity={0.8}
                onPress={() => setWater(filled && i === water - 1 ? i : i + 1)}
                style={{
                  flex: 1, height: 30, borderRadius: theme.radius.sm,
                  backgroundColor: filled ? c.primarySoft : c.muted,
                  borderWidth: 1, borderColor: filled ? c.primary : c.border,
                  alignItems: "center", justifyContent: "center",
                }}
              >
                <Droplets color={filled ? c.primary : c.textMuted} size={13} />
              </TouchableOpacity>
            );
          })}
        </View>
        {water >= WATER_GOAL ? (
          <AppText variant="caption" color="primary" style={{ marginTop: 8 }}>💧 Goal hit — hydration on point!</AppText>
        ) : null}
      </AppCard>

      {/* Coach insight */}
      <AppCard>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ height: 40, width: 40, borderRadius: theme.radius.md, backgroundColor: c.primarySoft, alignItems: "center", justifyContent: "center" }}>
            <Sparkles color={c.primary} size={18} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="label" color="primary">Coach insight</AppText>
            <AppText variant="body" color="textSecondary" style={{ marginTop: 3, lineHeight: 20 }}>{coachTip}</AppText>
          </View>
        </View>
      </AppCard>

      {/* Trainer note */}
      {today?.dayPlanText ? (
        <AppCard>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Salad color={c.textSecondary} size={18} />
            <AppText variant="label" color="textSecondary">Trainer Note</AppText>
          </View>
          <AppText variant="body" color="textSecondary" style={{ marginTop: 8 }}>{today.dayPlanText}</AppText>
        </AppCard>
      ) : null}

      {/* Meals */}
      {meals.length === 0 ? (
        <AppEmptyState
          emoji="🍽️"
          title="A clean plate, ready for you"
          description={`No meals are scheduled for ${dayLabel.toLowerCase()}. Rest, refuel, and check back for tomorrow's plan.`}
        />
      ) : (
        <View style={{ gap: 12 }}>
          <AppText variant="heading">{meals.length} meal{meals.length === 1 ? "" : "s"} today</AppText>
          {meals.map((meal, idx) => {
            const label = mealTypeLabel(meal.mealType);
            const macros = [
              meal.protein != null ? `P ${meal.protein}g` : null,
              meal.carbs != null ? `C ${meal.carbs}g` : null,
              meal.fats != null ? `F ${meal.fats}g` : null,
            ].filter(Boolean);
            return (
              <AppCard key={meal.id}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <View style={{ height: 24, width: 24, borderRadius: theme.radius.sm, backgroundColor: c.primarySoft, alignItems: "center", justifyContent: "center" }}>
                    <AppText style={{ fontSize: 11, fontWeight: "900", color: c.primary }}>{idx + 1}</AppText>
                  </View>
                  <AppText variant="overline" color="primary">{label}{meal.time ? ` · ${meal.time}` : ""}</AppText>
                  {meal.calories != null ? (
                    <View style={{ marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Flame color={c.textMuted} size={12} />
                      <AppText variant="caption" color="textMuted">{meal.calories} kcal</AppText>
                    </View>
                  ) : null}
                </View>

                <AppText variant="bodyStrong" style={{ lineHeight: 22 }}>{meal.title}</AppText>
                {meal.description ? (
                  <AppText variant="body" color="textSecondary" style={{ marginTop: 2 }}>{meal.description}</AppText>
                ) : null}

                {macros.length > 0 ? (
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                    {macros.map((m) => (
                      <View key={m} style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: theme.radius.sm, backgroundColor: c.muted, borderWidth: 1, borderColor: c.border }}>
                        <AppText variant="caption" color="textSecondary" style={{ fontWeight: "700" }}>{m}</AppText>
                      </View>
                    ))}
                  </View>
                ) : null}
              </AppCard>
            );
          })}
        </View>
      )}

      {/* Personal Plan — same day, below trainer */}
      {personal.filter((p) => (p.dayOfWeek ?? "").toLowerCase() === WEEKDAYS[new Date().getDay()]).length > 0 ? (
        <View style={{ gap: 8, marginTop: 8 }}>
          <AppText variant="overline" color="primary">Personal Plan · Today</AppText>
          {personal
            .filter((p) => (p.dayOfWeek ?? "").toLowerCase() === WEEKDAYS[new Date().getDay()])
            .map((p) => {
              const kcal = p.meals.reduce((s, m) => s + (m.calories ?? 0), 0);
              return (
                <TouchableOpacity key={p.id} onPress={() => router.push("/member/personal-diets")} activeOpacity={0.85}>
                  <AppCard>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <View style={{ flex: 1 }}>
                        <AppText variant="bodyStrong" numberOfLines={1}>{p.title}</AppText>
                        <AppText variant="caption" color="textMuted" numberOfLines={1}>
                          {p.meals.length} meal{p.meals.length === 1 ? "" : "s"}{kcal > 0 ? ` · ${kcal} kcal` : ""}{p.category ? ` · ${p.category}` : ""}
                        </AppText>
                      </View>
                      <AppBadge label="Personal" tone="neutral" />
                    </View>
                  </AppCard>
                </TouchableOpacity>
              );
            })}
        </View>
      ) : null}

      {/* Mark day complete */}
      {meals.length > 0 && !dayDone ? (
        <TouchableOpacity
          onPress={markDayComplete}
          activeOpacity={0.85}
          disabled={saving}
          style={{ marginTop: 4, paddingVertical: 14, borderRadius: theme.radius.md, alignItems: "center", backgroundColor: c.primary }}
        >
          <AppText variant="label" style={{ color: c.onPrimary }}>{saving ? "Saving…" : "Mark today's nutrition complete"}</AppText>
        </TouchableOpacity>
      ) : null}

      {meals.length > 0 ? (
        <View style={{ marginTop: 4 }}>
          <ProgressBar progress={dayDone ? 1 : 0} />
        </View>
      ) : null}

      {/* Personal diets link */}
      <TouchableOpacity onPress={() => router.push("/member/personal-diets")} activeOpacity={0.8} style={{ marginTop: 8 }}>
        <AppCard>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <AppText variant="bodyStrong">My Personal Diets</AppText>
            <AppText variant="label" color="primary">Open →</AppText>
          </View>
          <AppText variant="caption" color="textMuted" style={{ marginTop: 2 }}>Your own private diets — separate from trainer plans.</AppText>
        </AppCard>
      </TouchableOpacity>

      {/* Phase D — weekly diet */}
      <TouchableOpacity onPress={() => setShowWeek((s) => !s)} activeOpacity={0.8} style={{ marginTop: 8 }}>
        <AppText variant="label" color="primary">{showWeek ? "Hide weekly plan" : "View weekly plan"}</AppText>
      </TouchableOpacity>
      {showWeek ? (
        !week ? (
          <AppText variant="caption" color="textMuted">Loading week…</AppText>
        ) : (
          <View style={{ gap: 8 }}>
            {week.days.map((d) => {
              const dayPersonal = personal.filter((p) => (p.dayOfWeek ?? "").toLowerCase() === d.day.toLowerCase());
              return (
              <AppCard key={d.day} style={{ opacity: d.mealCount === 0 && dayPersonal.length === 0 ? 0.6 : 1, borderColor: d.isToday ? c.primary : c.border }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flex: 1 }}>
                    <AppText variant="overline" color="textMuted">Trainer Assigned</AppText>
                    <AppText variant="bodyStrong" style={{ textTransform: "capitalize" }}>{d.day}{d.isToday ? " · Today" : ""}</AppText>
                  </View>
                  <AppText variant="caption" color="textMuted">
                    {d.mealCount > 0 ? `${d.mealCount} meals · ${d.totals.kcal} kcal` : "No meals"}
                  </AppText>
                </View>
                {dayPersonal.length > 0 ? (
                  <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: c.border }}>
                    <AppText variant="overline" color="primary">Personal Plan</AppText>
                    {dayPersonal.map((p) => (
                      <AppText key={p.id} variant="caption" color="textSecondary" numberOfLines={1} style={{ marginTop: 2 }}>
                        {p.title} · {p.meals.length} meal{p.meals.length === 1 ? "" : "s"}{p.category ? ` · ${cap(p.category)}` : ""}
                      </AppText>
                    ))}
                  </View>
                ) : null}
              </AppCard>
              );
            })}
          </View>
        )
      ) : null}
    </AppScreen>
  );
}
