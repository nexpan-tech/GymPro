import { api } from "../api/client";

export interface DietMeal {
  id: string;
  dayOfWeek: string;
  mealType: string;
  title: string;
  description?: string | null;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fats?: number | null;
  time?: string | null;
}

export interface DietPlan {
  id: string;
  memberId: string;
  goal?: string | null;
  notes?: string | null;
  meals: DietMeal[];
}

function unwrap<T>(res: { data: { data?: T } | T }): T {
  return ((res.data as { data?: T }).data ?? res.data) as T;
}

export interface CompleteDietInput {
  dietPlanId: string;
  dietMealId?: string;
  dayOfWeek?: string;
  notes?: string;
}

export const dietService = {
  // Logged-in member's own structured plan (includes DietMeal rows created via
  // the trainer's diet builder). Derived from the auth token server-side.
  getMyPlan: async (): Promise<DietPlan | null> => {
    const res = await api.get(`/diets/my`);
    return unwrap<DietPlan | null>(res);
  },

  // A specific member's structured plan (trainer/admin viewing an assigned
  // member). Backend enforces access + returns meals.
  getByMember: async (memberId: string): Promise<DietPlan | null> => {
    const res = await api.get(`/diets/${memberId}`);
    return unwrap<DietPlan | null>(res);
  },

  complete: async (input: CompleteDietInput) => {
    const res = await api.post(`/diets/completions`, input);
    return unwrap(res);
  },

  // Phase 2 — only TODAY's meals (day-of-week filtered). Client passes its LOCAL
  // weekday so the view matches the member's date, not the server's.
  getMyToday: async (): Promise<TodayDiet> => {
    const day = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][new Date().getDay()];
    const res = await api.get(`/diets/my/today?day=${day}`);
    return unwrap<TodayDiet>(res) ?? { day, meals: [], dayPlanText: null, mealCount: 0, goal: null };
  },

  // Phase D — full Mon–Sun diet week.
  getMyWeek: async (): Promise<DietWeek> => {
    const res = await api.get(`/diets/my/week`);
    return unwrap<DietWeek>(res) ?? { planId: null, goal: null, days: [] };
  },
};

export interface DietWeekDay {
  day: string;
  isToday: boolean;
  mealCount: number;
  meals: DietMeal[];
  totals: { kcal: number; protein: number; carbs: number; fats: number };
  dayPlanText?: string | null;
  source: "TRAINER" | "PERSONAL" | null;
}
export interface DietWeek {
  planId: string | null;
  goal: string | null;
  days: DietWeekDay[];
}

export interface TodayDiet {
  day: string;
  planId?: string;
  goal?: string | null;
  meals: DietMeal[];
  dayPlanText?: string | null;
  mealCount: number;
}
