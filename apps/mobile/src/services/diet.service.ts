import { api } from "../api/client";

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
  getByMember: async (memberId: string): Promise<DietPlan | null> => {
    const res = await api.get(`/diets/${memberId}`);
    return unwrap<DietPlan | null>(res);
  },

  complete: async (input: CompleteDietInput) => {
    const res = await api.post(`/diets/completions`, input);
    return unwrap(res);
  },
};