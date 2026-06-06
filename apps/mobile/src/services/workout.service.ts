import { api } from "../api/client";

export interface WorkoutExerciseItem {
  id: string;
  dayNumber: number;
  sets: number;
  reps: string;
  restSeconds?: number | null;
  notes?: string | null;
  exercise: {
    id: string;
    name: string;
    muscleGroup?: string | null;
    equipment?: string | null;
    videoUrl?: string | null;
  };
}

export interface WorkoutCompletionRecord {
  id: string;
  workoutExerciseId?: string | null;
  dayNumber?: number | null;
  completedAt: string;
}

export interface WorkoutPlan {
  id: string;
  title: string;
  description?: string | null;
  difficulty?: string | null;
  durationWeeks?: number | null;
  exercises: WorkoutExerciseItem[];
  completions?: WorkoutCompletionRecord[];
}

export interface CompleteWorkoutInput {
  workoutPlanId: string;
  workoutExerciseId?: string;
  dayNumber?: number;
  notes?: string;
}

function unwrap<T>(res: { data: { data?: T } | T }): T {
  return ((res.data as { data?: T }).data ?? res.data) as T;
}

export const workoutService = {
  // Plans for the logged-in member (derived from the auth token server-side).
  getMyPlans: async (): Promise<WorkoutPlan[]> => {
    const res = await api.get(`/workouts/my`);
    return unwrap<WorkoutPlan[]>(res) ?? [];
  },

  getByMember: async (memberId: string): Promise<WorkoutPlan[]> => {
    const res = await api.get(`/workouts/member/${memberId}`);
    return unwrap<WorkoutPlan[]>(res) ?? [];
  },

  complete: async (input: CompleteWorkoutInput) => {
    const res = await api.post(`/workouts/complete`, input);
    return unwrap(res);
  },
};
