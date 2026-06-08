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
};
