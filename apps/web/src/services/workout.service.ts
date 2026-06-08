import { api } from "@/lib/api";

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

// ─── Stage 4: structured workout plans (builder) ─────────────────────────────

export type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface WorkoutExerciseRow {
  id: string;
  dayNumber: number;
  sets: number;
  reps: string;
  restSeconds?: number | null;
  notes?: string | null;
  exercise: { id: string; name: string; muscleGroup?: string | null; videoUrl?: string | null };
}

export interface WorkoutPlanFull {
  id: string;
  title: string;
  description?: string | null;
  difficulty: Difficulty;
  durationWeeks?: number | null;
  memberId?: string | null;
  member?: { id: string; user?: { name: string; email: string } } | null;
  exercises: WorkoutExerciseRow[];
  completions?: { id: string }[];
}

export interface CreateWorkoutPlanInput {
  memberId: string;
  title: string;
  description?: string;
  difficulty: Difficulty;
  durationWeeks?: number;
}

export interface AddWorkoutExerciseInput {
  exerciseId: string;
  dayNumber: number;
  sets: number;
  reps: string;
  restSeconds?: number;
  notes?: string;
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

  // Structured plans — role-scoped server-side (trainer → own, admin → gym).
  listPlans: async (): Promise<WorkoutPlanFull[]> => {
    const res = await api.get("/workouts");
    return unwrap<WorkoutPlanFull[]>(res) ?? [];
  },

  createPlan: async (input: CreateWorkoutPlanInput): Promise<WorkoutPlanFull> => {
    const res = await api.post("/workouts", input);
    return unwrap<WorkoutPlanFull>(res);
  },

  addExercise: async (planId: string, input: AddWorkoutExerciseInput) => {
    const res = await api.post(`/workouts/${planId}/exercises`, input);
    return unwrap(res);
  },

  assign: async (planId: string, memberId: string): Promise<WorkoutPlanFull> => {
    const res = await api.patch(`/workouts/${planId}/assign`, { memberId });
    return unwrap<WorkoutPlanFull>(res);
  },

  // Logged-in member's own structured plans (with exercises) — for the member UI.
  getMy: async (): Promise<WorkoutPlanFull[]> => {
    const res = await api.get("/workouts/my");
    return unwrap<WorkoutPlanFull[]>(res) ?? [];
  },
};