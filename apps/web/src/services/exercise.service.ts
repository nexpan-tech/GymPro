import { api } from "@/lib/api";

export type MuscleGroup =
  | "CHEST"
  | "BACK"
  | "SHOULDERS"
  | "BICEPS"
  | "TRICEPS"
  | "LEGS"
  | "GLUTES"
  | "CORE"
  | "FULL_BODY";

export type ExerciseCategory =
  | "STRENGTH"
  | "CARDIO"
  | "FLEXIBILITY"
  | "MOBILITY"
  | "WARMUP"
  | "STRETCHING";

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  category: ExerciseCategory;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  videoUrl?: string | null;
}

export interface CreateExerciseInput {
  name: string;
  muscleGroup: MuscleGroup;
  category?: ExerciseCategory;
  difficulty?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  videoUrl?: string;
}

function unwrap<T>(res: { data: { data?: T } | T }): T {
  return ((res.data as { data?: T }).data ?? res.data) as T;
}

export const exerciseService = {
  list: async (): Promise<Exercise[]> => {
    const res = await api.get("/exercises");
    return unwrap<Exercise[]>(res) ?? [];
  },

  // Creates a gym-scoped exercise so it can be attached to a workout plan.
  create: async (input: CreateExerciseInput): Promise<Exercise> => {
    const res = await api.post("/exercises", {
      category: "STRENGTH",
      difficulty: "INTERMEDIATE",
      ...input,
    });
    return unwrap<Exercise>(res);
  },
};
