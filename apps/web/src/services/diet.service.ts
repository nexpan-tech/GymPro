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
  memberId: string;
  goal?: string;
  notes?: string;
}

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

  createBuilderPlan: async (input: CreateDietBuilderPlanInput): Promise<DietPlanFull> => {
    const res = await api.post("/diet-builder", input);
    return unwrap<DietPlanFull>(res);
  },

  addMeal: async (dietPlanId: string, input: AddDietMealInput): Promise<DietMealRow> => {
    const res = await api.post(`/diet-builder/${dietPlanId}/meals`, input);
    return unwrap<DietMealRow>(res);
  },

  // Logged-in member's own structured plan (with meals) — for the member UI.
  getMy: async (): Promise<DietPlanFull | null> => {
    const res = await api.get("/diets/my");
    return unwrap<DietPlanFull | null>(res);
  },
};