import api from "@/lib/axios";

export interface WorkoutPlan {
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

export const workoutService = {
  getAll: async (): Promise<WorkoutPlan[]> => {
    const res = await api.get("/workouts");
    return unwrap<WorkoutPlan[]>(res);
  },

  getByMember: async (memberId: string): Promise<WorkoutPlan | null> => {
    const res = await api.get(`/workouts/member/${memberId}`);
    return unwrap<WorkoutPlan | null>(res);
  },

  create: async (data: Partial<WorkoutPlan>): Promise<WorkoutPlan> => {
    const res = await api.post("/workouts", data);
    return unwrap<WorkoutPlan>(res);
  },
};