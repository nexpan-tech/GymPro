import { router } from "expo-router";
import { ArrowLeft, Salad, Utensils } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AppCard from "../../src/components/AppCard";
import { dietService, type DietPlan } from "../../src/services/diet.service";
import { memberService } from "../../src/services/member.service";

// ─── types & helpers ─────────────────────────────────────────────────────────

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

// Meal types to look for when parsing free-text
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

  // Try structured parsing: look for lines starting with meal type keywords
  const meals: ParsedMeal[] = [];
  let currentMeal: ParsedMeal | null = null;

  for (const line of lines) {
    const lower = line.toLowerCase();
    const matchedType = MEAL_TYPE_PATTERNS.find((m) =>
      m.keywords.some((kw) => lower.startsWith(kw) || lower.includes(`: ${kw}`) || lower === kw)
    );

    if (matchedType) {
      if (currentMeal) meals.push(currentMeal);
      // Extract anything after the label on the same line
      const colonIdx = line.indexOf(":");
      const rest = colonIdx > -1 ? line.slice(colonIdx + 1).trim() : "";
      currentMeal = { type: matchedType.label, items: rest ? [rest] : [] };
    } else if (currentMeal) {
      // Sub-items: calories/macros detection
      if (/cal(orie)?s?:/i.test(line) || /kcal/i.test(line)) {
        currentMeal.calories = line;
      } else if (/protein|carb|fat/i.test(line)) {
        currentMeal.macros = line;
      } else {
        currentMeal.items.push(line);
      }
    } else {
      // No structured type found — treat each line as a generic entry
      meals.push({ type: "Meal", items: [line] });
    }
  }

  if (currentMeal) meals.push(currentMeal);

  // If nothing structured was found, present the raw lines grouped as one entry
  if (meals.length === 0) {
    return [{ type: "Today's Plan", items: lines }];
  }

  return meals;
}

// ─── screen ──────────────────────────────────────────────────────────────────

type TabId = "yesterday" | "today" | "tomorrow";

const TABS: { id: TabId; label: string }[] = [
  { id: "yesterday", label: "Yesterday" },
  { id: "today", label: "Today" },
  { id: "tomorrow", label: "Tomorrow" },
];

export default function DietScreen() {
  const [plan, setPlan] = useState<DietPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("today");

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

  const mealTypeColors: Record<string, string> = {
    Breakfast: "#f59e0b",
    "Pre Workout": "#6366f1",
    Lunch: "#059669",
    "Post Workout": "#8b5cf6",
    Dinner: "#0ea5e9",
    Snack: "#f97316",
    Meal: "#94a3b8",
    "Today's Plan": "#94a3b8",
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#6366f1" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft color="#f8fafc" size={22} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Diet Plan</Text>
          <Text style={styles.subtitle}>
            {plan?.goal || "Your weekly nutrition schedule"}
          </Text>
        </View>
      </View>

      {/* Today / Yesterday / Tomorrow tabs */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: "#0f172a",
          borderRadius: 16,
          padding: 4,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: "rgba(148,163,184,0.14)",
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
                borderRadius: 13,
                alignItems: "center",
                backgroundColor: isActive ? "#4f46e5" : "transparent",
              }}
            >
              <Text
                style={{
                  color: isActive ? "#fff" : "#64748b",
                  fontWeight: "800",
                  fontSize: 13,
                }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Plan notes */}
      {plan?.notes && (
        <AppCard style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Salad color="#059669" size={18} />
            <Text style={{ color: "#94a3b8", fontWeight: "700", fontSize: 13 }}>
              Trainer Note
            </Text>
          </View>
          <Text
            style={{
              color: "#cbd5e1",
              marginTop: 8,
              lineHeight: 20,
              fontSize: 14,
            }}
          >
            {plan.notes}
          </Text>
        </AppCard>
      )}

      {/* Meals */}
      {meals.length === 0 ? (
        <AppCard>
          <View style={{ alignItems: "center", paddingVertical: 24 }}>
            <Utensils color="#334155" size={34} />
            <Text
              style={{
                color: "#475569",
                marginTop: 12,
                fontWeight: "700",
                textAlign: "center",
                lineHeight: 22,
              }}
            >
              No diet plan assigned{"\n"}for this day.
            </Text>
          </View>
        </AppCard>
      ) : (
        <View style={{ gap: 12 }}>
          {meals.map((meal, idx) => {
            const accentColor =
              mealTypeColors[meal.type] ?? "#94a3b8";
            return (
              <AppCard key={`${meal.type}-${idx}`}>
                {/* Meal type header */}
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
                  <Text
                    style={{
                      color: accentColor,
                      fontWeight: "900",
                      fontSize: 12,
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                    }}
                  >
                    {meal.type}
                  </Text>
                </View>

                {/* Items */}
                {meal.items.map((item, i) => (
                  <Text
                    key={i}
                    style={{
                      color: "#f8fafc",
                      fontSize: 14,
                      lineHeight: 22,
                      fontWeight: i === 0 ? "700" : "400",
                    }}
                  >
                    {item}
                  </Text>
                ))}

                {/* Calories */}
                {meal.calories && (
                  <Text
                    style={{
                      color: "#f59e0b",
                      fontSize: 13,
                      fontWeight: "700",
                      marginTop: 8,
                    }}
                  >
                    {meal.calories}
                  </Text>
                )}

                {/* Macros */}
                {meal.macros && (
                  <Text
                    style={{
                      color: "#64748b",
                      fontSize: 12,
                      marginTop: 4,
                      lineHeight: 18,
                    }}
                  >
                    {meal.macros}
                  </Text>
                )}
              </AppCard>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = {
  screen: { flex: 1, backgroundColor: "#020617" },
  content: { padding: 20, paddingTop: 64, paddingBottom: 48 },
  center: {
    flex: 1,
    backgroundColor: "#020617",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 14,
    marginBottom: 24,
  },
  backButton: {
    height: 44,
    width: 44,
    borderRadius: 16,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.18)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  title: { color: "#f8fafc", fontSize: 26, fontWeight: "900" as const },
  subtitle: { color: "#94a3b8", marginTop: 4, fontSize: 13 },
};
