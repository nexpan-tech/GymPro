import { apiClient } from "./client";

function unwrap<T>(res: { data: { data?: T } | T }): T {
  return ((res.data as { data?: T }).data ?? res.data) as T;
}

export interface PersonalExercise { id?: string; name: string; sets: number; reps: string; restSeconds?: number | null; notes?: string | null }
export interface PersonalWorkout {
  id: string; title: string; category?: string | null; difficulty?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | null;
  tags: string[]; notes?: string | null; estMinutes?: number | null;
  isTemplate: boolean; isFavorite: boolean; isArchived: boolean; dayOfWeek?: string | null; exercises: PersonalExercise[];
}
export type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" | "PRE_WORKOUT" | "POST_WORKOUT";
export interface PersonalMeal { id?: string; mealType: MealType; title: string; calories?: number | null; protein?: number | null; carbs?: number | null; fats?: number | null; time?: string | null; notes?: string | null }
export interface PersonalDiet {
  id: string; title: string; category?: string | null; tags: string[]; notes?: string | null;
  isTemplate: boolean; isFavorite: boolean; isArchived: boolean; dayOfWeek?: string | null; meals: PersonalMeal[];
}
export interface PersonalWorkoutCompletion { id: string; completedAt: string; personalWorkout?: { id: string; title: string } | null }

export const personalWorkoutApi = {
  list: async (archived = false): Promise<PersonalWorkout[]> => unwrap<PersonalWorkout[]>(await apiClient.get(`/personal-workouts?archived=${archived}`)) ?? [],
  create: async (data: Partial<PersonalWorkout> & { exercises?: PersonalExercise[] }): Promise<PersonalWorkout> => unwrap(await apiClient.post("/personal-workouts", data)),
  update: async (id: string, data: Partial<PersonalWorkout> & { exercises?: PersonalExercise[] }): Promise<PersonalWorkout> => unwrap(await apiClient.patch(`/personal-workouts/${id}`, data)),
  remove: async (id: string): Promise<void> => { await apiClient.delete(`/personal-workouts/${id}`); },
  duplicate: async (id: string): Promise<PersonalWorkout> => unwrap(await apiClient.post(`/personal-workouts/${id}/duplicate`, {})),
  archive: async (id: string, isArchived = true): Promise<PersonalWorkout> => unwrap(await apiClient.patch(`/personal-workouts/${id}/archive`, { isArchived })),
  favorite: async (id: string): Promise<PersonalWorkout> => unwrap(await apiClient.patch(`/personal-workouts/${id}/favorite`, {})),
  complete: async (id: string): Promise<unknown> => unwrap(await apiClient.post(`/personal-workouts/${id}/complete`, {})),
  history: async (): Promise<PersonalWorkoutCompletion[]> => unwrap<PersonalWorkoutCompletion[]>(await apiClient.get("/personal-workouts/history")) ?? [],
};

export const personalDietApi = {
  list: async (archived = false): Promise<PersonalDiet[]> => unwrap<PersonalDiet[]>(await apiClient.get(`/personal-diets?archived=${archived}`)) ?? [],
  create: async (data: Partial<PersonalDiet> & { meals?: PersonalMeal[] }): Promise<PersonalDiet> => unwrap(await apiClient.post("/personal-diets", data)),
  update: async (id: string, data: Partial<PersonalDiet> & { meals?: PersonalMeal[] }): Promise<PersonalDiet> => unwrap(await apiClient.patch(`/personal-diets/${id}`, data)),
  remove: async (id: string): Promise<void> => { await apiClient.delete(`/personal-diets/${id}`); },
  duplicate: async (id: string): Promise<PersonalDiet> => unwrap(await apiClient.post(`/personal-diets/${id}/duplicate`, {})),
  archive: async (id: string, isArchived = true): Promise<PersonalDiet> => unwrap(await apiClient.patch(`/personal-diets/${id}/archive`, { isArchived })),
  favorite: async (id: string): Promise<PersonalDiet> => unwrap(await apiClient.patch(`/personal-diets/${id}/favorite`, {})),
};
