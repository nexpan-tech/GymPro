import { api } from "@/lib/api";

export interface DietPlan {
  id: string;
  memberId: string;
  goal?: string | null;
  notes?: string | null;
  monday?: string | null;
  tuesday?: string | null;
  wednesday?: string | null;
  thursday?: string | null;
  friday?: string | null;
  saturday?: string | null;
  sunday?: string | null;
}

// ─── Stage 4: structured diet plans (builder) ────────────────────────────────

export type MealType =
  | "BREAKFAST"
  | "LUNCH"
  | "DINNER"
  | "SNACK"
  | "PRE_WORKOUT"
  | "POST_WORKOUT";

export interface DietMealRow {
  id: string;
  dayOfWeek: string;
  mealType: MealType;
  title: string;
  description?: string | null;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fats?: number | null;
  time?: string | null;
}

export interface DietPlanFull {
  id: string;
  memberId: string;
  goal?: string | null;
  notes?: string | null;
  member?: { id: string; user?: { name: string; email: string } } | null;
  meals: DietMealRow[];
}

export interface CreateDietBuilderPlanInput {
  /** Legacy single assignment. */
  memberId?: string;
  /** Multi-assign — one plan is upserted per member (preferred). */
  memberIds?: string[];
  goal?: string;
  notes?: string;
}

/** createBuilderPlan returns the first plan augmented with the full list. */
export type CreateDietBuilderPlanResult = DietPlanFull & {
  plans?: DietPlanFull[];
  count?: number;
};

export interface AddDietMealInput {
  dayOfWeek: string;
  mealType: MealType;
  title: string;
  description?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  time?: string;
}

function unwrap<T>(res: { data: { data?: T } | T }): T {
  return ((res.data as { data?: T }).data ?? res.data) as T;
}

export const dietService = {
  getAll: async (): Promise<DietPlan[]> => {
    const res = await api.get("/diets");
    return unwrap<DietPlan[]>(res);
  },

  getByMember: async (memberId: string): Promise<DietPlan | null> => {
    const res = await api.get(`/diets/${memberId}`);
    return unwrap<DietPlan | null>(res);
  },

  create: async (data: Partial<DietPlan>): Promise<DietPlan> => {
    const res = await api.post("/diets", data);
    return unwrap<DietPlan>(res);
  },

  // Structured plans via the diet-builder module — role-scoped server-side.
  listBuilderPlans: async (): Promise<DietPlanFull[]> => {
    const res = await api.get("/diet-builder");
    return unwrap<DietPlanFull[]>(res) ?? [];
  },

  createBuilderPlan: async (input: CreateDietBuilderPlanInput): Promise<CreateDietBuilderPlanResult> => {
    const res = await api.post("/diet-builder", input);
    return unwrap<CreateDietBuilderPlanResult>(res);
  },

  getBuilderPlanById: async (id: string): Promise<DietPlanFull> => {
    const res = await api.get(`/diet-builder/${id}`);
    return unwrap<DietPlanFull>(res);
  },

  updateBuilderPlan: async (id: string, input: { goal?: string; notes?: string }): Promise<DietPlanFull> => {
    const res = await api.put(`/diet-builder/${id}`, input);
    return unwrap<DietPlanFull>(res);
  },

  deleteBuilderPlan: async (id: string): Promise<void> => {
    await api.delete(`/diet-builder/${id}`);
  },

  addMeal: async (dietPlanId: string, input: AddDietMealInput): Promise<DietMealRow> => {
    const res = await api.post(`/diet-builder/${dietPlanId}/meals`, input);
    return unwrap<DietMealRow>(res);
  },

  deleteMeal: async (mealId: string): Promise<void> => {
    await api.delete(`/diet-builder/meals/${mealId}`);
  },

  // Logged-in member's own structured plan (with meals) — for the member UI.
  getMy: async (): Promise<DietPlanFull | null> => {
    const res = await api.get("/diets/my");
    return unwrap<DietPlanFull | null>(res);
  },

  // Phase 2 — only TODAY's meals (day-of-week filtered). The client passes its
  // LOCAL weekday so the view matches the member's date, not the server's.
  getMyToday: async (): Promise<TodayDiet> => {
    const day = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][new Date().getDay()];
    const res = await api.get(`/diets/my/today?day=${day}`);
    return (
      unwrap<TodayDiet>(res) ?? { day, meals: [], dayPlanText: null, mealCount: 0, goal: null }
    );
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
  meals: DietMealRow[];
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
  meals: DietMealRow[];
  dayPlanText?: string | null;
  mealCount: number;
}