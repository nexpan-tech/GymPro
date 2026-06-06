import { router } from "expo-router";
import { Salad } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";

import { dietService, type DietPlan } from "../../src/services/diet.service";
import { memberService } from "../../src/services/member.service";
import { useTheme } from "../../src/theme";
import {
  AppCard,
  AppEmptyState,
  AppHeader,
  AppLoadingState,
  AppScreen,
  AppText,
} from "../../src/components/ui";

// ─── types & helpers (unchanged) ─────────────────────────────────────────────

type DayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

const DAY_KEYS: DayKey[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

function todayKey(): DayKey {
  const map: DayKey[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return map[new Date().getDay()];
}

function shiftDay(base: DayKey, delta: -1 | 0 | 1): DayKey {
  const idx = DAY_KEYS.indexOf(base) + delta;
  return DAY_KEYS[(idx + 7) % 7];
}

const MEAL_TYPE_PATTERNS: { label: string; keywords: string[] }[] = [
  { label: "Breakfast", keywords: ["breakfast"] },
  { label: "Pre Workout", keywords: ["pre workout", "pre-workout", "preworkout"] },
  { label: "Lunch", keywords: ["lunch"] },
  { label: "Post Workout", keywords: ["post workout", "post-workout", "postworkout"] },
  { label: "Dinner", keywords: ["dinner"] },
  { label: "Snack", keywords: ["snack"] },
];

interface ParsedMeal {
  type: string;
  items: string[];
  calories?: string;
  macros?: string;
}

function parseMeals(raw: string | null | undefined): ParsedMeal[] {
  if (!raw) return [];

  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  const meals: ParsedMeal[] = [];
  let currentMeal: ParsedMeal | null = null;

  for (const line of lines) {
    const lower = line.toLowerCase();
    const matchedType = MEAL_TYPE_PATTERNS.find((m) =>
      m.keywords.some(
        (kw) => lower.startsWith(kw) || lower.includes(`: ${kw}`) || lower === kw,
      ),
    );

    if (matchedType) {
      if (currentMeal) meals.push(currentMeal);
      const colonIdx = line.indexOf(":");
      const rest = colonIdx > -1 ? line.slice(colonIdx + 1).trim() : "";
      currentMeal = { type: matchedType.label, items: rest ? [rest] : [] };
    } else if (currentMeal) {
      if (/cal(orie)?s?:/i.test(line) || /kcal/i.test(line)) {
        currentMeal.calories = line;
      } else if (/protein|carb|fat/i.test(line)) {
        currentMeal.macros = line;
      } else {
        currentMeal.items.push(line);
      }
    } else {
      meals.push({ type: "Meal", items: [line] });
    }
  }

  if (currentMeal) meals.push(currentMeal);
  if (meals.length === 0) {
    return [{ type: "Today's Plan", items: lines }];
  }
  return meals;
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
      const profile = await memberService.getMyProfile();
      if (profile?.id) {
        const data = await dietService.getByMember(profile.id);
        setPlan(data);
      }
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
  const meals = parseMeals(plan?.[activeDay] ?? null);
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

  // Meal-category accent hues (readable on both themes).
  const mealTypeColors: Record<string, string> = {
    Breakfast: "#f59e0b",
    "Pre Workout": c.primary,
    Lunch: "#059669",
    "Post Workout": "#8b5cf6",
    Dinner: "#0ea5e9",
    Snack: "#f97316",
    Meal: c.textSecondary,
    "Today's Plan": c.textSecondary,
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
          title="No diet plan"
          description="No diet plan assigned for this day."
        />
      ) : (
        <View style={{ gap: 12 }}>
          {meals.map((meal, idx) => {
            const accentColor = mealTypeColors[meal.type] ?? c.textSecondary;
            return (
              <AppCard key={`${meal.type}-${idx}`}>
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
                    {meal.type}
                  </AppText>
                </View>

                {meal.items.map((item, i) => (
                  <AppText
                    key={i}
                    variant={i === 0 ? "bodyStrong" : "body"}
                    style={{ lineHeight: 22 }}
                  >
                    {item}
                  </AppText>
                ))}

                {meal.calories ? (
                  <AppText
                    variant="label"
                    style={{ color: "#f59e0b", marginTop: 8 }}
                  >
                    {meal.calories}
                  </AppText>
                ) : null}

                {meal.macros ? (
                  <AppText variant="caption" color="textMuted" style={{ marginTop: 4 }}>
                    {meal.macros}
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
