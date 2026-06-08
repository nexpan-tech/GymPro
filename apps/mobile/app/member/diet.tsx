import { router } from "expo-router";
import { Salad } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TouchableOpacity, View } from "react-native";

import { dietService, type DietPlan } from "../../src/services/diet.service";
import { useTheme } from "../../src/theme";
import {
  AppCard,
  AppEmptyState,
  AppHeader,
  AppLoadingState,
  AppScreen,
  AppText,
} from "../../src/components/ui";

// ─── day config ──────────────────────────────────────────────────────────────
// Diet plans store meals against a lowercase `dayOfWeek` (matches the trainer's
// diet builder).

type DayKey =
  | "monday" | "tuesday" | "wednesday" | "thursday"
  | "friday" | "saturday" | "sunday";

const DAY_KEYS: DayKey[] = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
];

function todayKey(): DayKey {
  const map: DayKey[] = [
    "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday",
  ];
  return map[new Date().getDay()];
}

function shiftDay(base: DayKey, delta: -1 | 0 | 1): DayKey {
  const idx = DAY_KEYS.indexOf(base) + delta;
  return DAY_KEYS[(idx + 7) % 7];
}

function mealTypeLabel(t: string): string {
  return t
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

type TabId = "yesterday" | "today" | "tomorrow";

const TABS: { id: TabId; label: string }[] = [
  { id: "yesterday", label: "Yesterday" },
  { id: "today", label: "Today" },
  { id: "tomorrow", label: "Tomorrow" },
];

export default function DietScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [plan, setPlan] = useState<DietPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("today");
  const [completedDays, setCompletedDays] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const loadPlan = useCallback(async () => {
    try {
      const data = await dietService.getMyPlan();
      setPlan(data);
    } catch (err) {
      console.log("Diet load failed", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlan();
  }, [loadPlan]);

  const today = todayKey();
  const dayKeyForTab: Record<TabId, DayKey> = {
    yesterday: shiftDay(today, -1),
    today,
    tomorrow: shiftDay(today, 1),
  };

  const activeDay = dayKeyForTab[activeTab];
  const meals = useMemo(
    () =>
      (plan?.meals ?? []).filter(
        (m) => (m.dayOfWeek ?? "").toLowerCase() === activeDay,
      ),
    [plan, activeDay],
  );
  const dayDone = !!completedDays[activeDay];

  async function markDayComplete() {
    if (!plan || dayDone || saving) return;
    setSaving(true);
    try {
      await dietService.complete({ dietPlanId: plan.id, dayOfWeek: activeDay });
      setCompletedDays((prev) => ({ ...prev, [activeDay]: true }));
    } catch (err) {
      console.log("Diet completion failed", err);
    } finally {
      setSaving(false);
    }
  }

  const mealTypeColors: Record<string, string> = {
    Breakfast: "#f59e0b",
    "Pre Workout": c.primary,
    Lunch: "#059669",
    "Post Workout": "#8b5cf6",
    Dinner: "#0ea5e9",
    Snack: "#f97316",
  };

  if (loading) {
    return (
      <AppScreen>
        <AppHeader title="Diet Plan" onBack={() => router.back()} />
        <AppLoadingState rows={4} />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <AppHeader
        title="Diet Plan"
        subtitle={plan?.goal || "Your weekly nutrition schedule"}
        onBack={() => router.back()}
      />

      {/* Day tabs */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: c.surface,
          borderRadius: theme.radius.md,
          padding: 4,
          borderWidth: 1,
          borderColor: c.border,
        }}
      >
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.8}
              style={{
                flex: 1,
                paddingVertical: 9,
                borderRadius: theme.radius.sm,
                alignItems: "center",
                backgroundColor: isActive ? c.primary : "transparent",
              }}
            >
              <AppText
                variant="label"
                style={{ color: isActive ? c.onPrimary : c.textMuted }}
              >
                {tab.label}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Trainer note */}
      {plan?.notes ? (
        <AppCard>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Salad color={c.success} size={18} />
            <AppText variant="label" color="textSecondary">
              Trainer Note
            </AppText>
          </View>
          <AppText variant="body" color="textSecondary" style={{ marginTop: 8 }}>
            {plan.notes}
          </AppText>
        </AppCard>
      ) : null}

      {/* Meals */}
      {meals.length === 0 ? (
        <AppEmptyState
          emoji="🍽️"
          title="No meals"
          description="No meals assigned for this day."
        />
      ) : (
        <View style={{ gap: 12 }}>
          {meals.map((meal) => {
            const label = mealTypeLabel(meal.mealType);
            const accentColor = mealTypeColors[label] ?? c.textSecondary;
            const macros = [
              meal.protein != null ? `P ${meal.protein}g` : null,
              meal.carbs != null ? `C ${meal.carbs}g` : null,
              meal.fats != null ? `F ${meal.fats}g` : null,
            ].filter(Boolean);
            return (
              <AppCard key={meal.id}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <View
                    style={{
                      height: 8,
                      width: 8,
                      borderRadius: 4,
                      backgroundColor: accentColor,
                    }}
                  />
                  <AppText variant="overline" style={{ color: accentColor }}>
                    {label}
                  </AppText>
                </View>

                <AppText variant="bodyStrong" style={{ lineHeight: 22 }}>
                  {meal.title}
                </AppText>
                {meal.description ? (
                  <AppText variant="body" color="textSecondary" style={{ marginTop: 2 }}>
                    {meal.description}
                  </AppText>
                ) : null}

                {meal.calories != null ? (
                  <AppText
                    variant="label"
                    style={{ color: "#f59e0b", marginTop: 8 }}
                  >
                    {meal.calories} kcal
                  </AppText>
                ) : null}

                {macros.length > 0 ? (
                  <AppText variant="caption" color="textMuted" style={{ marginTop: 4 }}>
                    {macros.join("  ·  ")}
                  </AppText>
                ) : null}
              </AppCard>
            );
          })}
        </View>
      )}

      {/* Mark day complete */}
      {meals.length > 0 ? (
        <TouchableOpacity
          onPress={markDayComplete}
          activeOpacity={0.85}
          disabled={dayDone || saving}
          style={{
            marginTop: 16,
            paddingVertical: 14,
            borderRadius: theme.radius.md,
            alignItems: "center",
            backgroundColor: dayDone ? c.successSoft : c.primary,
            borderWidth: 1,
            borderColor: dayDone ? c.success : c.primary,
          }}
        >
          <AppText
            variant="label"
            style={{ color: dayDone ? c.success : c.onPrimary }}
          >
            {dayDone
              ? "Day marked complete ✓"
              : saving
                ? "Saving…"
                : "Mark this day complete"}
          </AppText>
        </TouchableOpacity>
      ) : null}
    </AppScreen>
  );
}
