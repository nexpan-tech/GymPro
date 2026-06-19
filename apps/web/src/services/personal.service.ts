import { api } from "@/lib/api";

function unwrap<T>(res: { data: { data?: T } | T }): T {
  return ((res.data as { data?: T }).data ?? res.data) as T;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PersonalExercise {
  id?: string;
  exerciseId?: string | null;
  name: string;
  sets: number;
  reps: string;
  restSeconds?: number | null;
  notes?: string | null;
  order?: number;
}

export interface PersonalWorkout {
  id: string;
  title: string;
  category?: string | null;
  difficulty?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | null;
  tags: string[];
  notes?: string | null;
  isTemplate: boolean;
  isFavorite: boolean;
  isArchived: boolean;
  dayOfWeek?: string | null;
  estMinutes?: number | null;
  exercises: PersonalExercise[];
  updatedAt: string;
}

export type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" | "PRE_WORKOUT" | "POST_WORKOUT";
export interface PersonalMeal {
  id?: string;
  mealType: MealType;
  title: string;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fats?: number | null;
  time?: string | null;
  notes?: string | null;
  order?: number;
}
export interface PersonalDiet {
  id: string;
  title: string;
  category?: string | null;
  tags: string[];
  notes?: string | null;
  isTemplate: boolean;
  isFavorite: boolean;
  isArchived: boolean;
  dayOfWeek?: string | null;
  meals: PersonalMeal[];
  updatedAt: string;
}

export interface ListParams { archived?: boolean; favorite?: boolean; template?: boolean; category?: string; search?: string }
function qs(p: ListParams = {}) {
  const s = new URLSearchParams();
  if (p.archived !== undefined) s.set("archived", String(p.archived));
  if (p.favorite) s.set("favorite", "true");
  if (p.template !== undefined) s.set("template", String(p.template));
  if (p.category) s.set("category", p.category);
  if (p.search) s.set("search", p.search);
  const q = s.toString();
  return q ? `?${q}` : "";
}

// ─── Personal Workouts ───────────────────────────────────────────────────────

export const personalWorkoutService = {
  list: async (p?: ListParams): Promise<PersonalWorkout[]> => unwrap<PersonalWorkout[]>(await api.get(`/personal-workouts${qs(p)}`)) ?? [],
  get: async (id: string): Promise<PersonalWorkout> => unwrap<PersonalWorkout>(await api.get(`/personal-workouts/${id}`)),
  create: async (data: Partial<PersonalWorkout> & { exercises?: PersonalExercise[] }): Promise<PersonalWorkout> => unwrap<PersonalWorkout>(await api.post("/personal-workouts", data)),
  update: async (id: string, data: Partial<PersonalWorkout> & { exercises?: PersonalExercise[] }): Promise<PersonalWorkout> => unwrap<PersonalWorkout>(await api.patch(`/personal-workouts/${id}`, data)),
  remove: async (id: string): Promise<void> => { await api.delete(`/personal-workouts/${id}`); },
  duplicate: async (id: string): Promise<PersonalWorkout> => unwrap<PersonalWorkout>(await api.post(`/personal-workouts/${id}/duplicate`)),
  archive: async (id: string, isArchived = true): Promise<PersonalWorkout> => unwrap<PersonalWorkout>(await api.patch(`/personal-workouts/${id}/archive`, { isArchived })),
  favorite: async (id: string): Promise<PersonalWorkout> => unwrap<PersonalWorkout>(await api.patch(`/personal-workouts/${id}/favorite`)),
  complete: async (id: string, data: { durationMinutes?: number; notes?: string } = {}): Promise<unknown> => unwrap(await api.post(`/personal-workouts/${id}/complete`, data)),
  history: async (): Promise<{ id: string; completedAt: string; personalWorkout: { id: string; title: string } }[]> => unwrap(await api.get("/personal-workouts/history")) ?? [],
  stats: async (): Promise<Record<string, unknown>> => unwrap(await api.get("/personal-workouts/stats")),
};

// ─── Personal Diets ──────────────────────────────────────────────────────────

export const personalDietService = {
  list: async (p?: ListParams): Promise<PersonalDiet[]> => unwrap<PersonalDiet[]>(await api.get(`/personal-diets${qs(p)}`)) ?? [],
  get: async (id: string): Promise<PersonalDiet> => unwrap<PersonalDiet>(await api.get(`/personal-diets/${id}`)),
  create: async (data: Partial<PersonalDiet> & { meals?: PersonalMeal[] }): Promise<PersonalDiet> => unwrap<PersonalDiet>(await api.post("/personal-diets", data)),
  update: async (id: string, data: Partial<PersonalDiet> & { meals?: PersonalMeal[] }): Promise<PersonalDiet> => unwrap<PersonalDiet>(await api.patch(`/personal-diets/${id}`, data)),
  remove: async (id: string): Promise<void> => { await api.delete(`/personal-diets/${id}`); },
  duplicate: async (id: string): Promise<PersonalDiet> => unwrap<PersonalDiet>(await api.post(`/personal-diets/${id}/duplicate`)),
  archive: async (id: string, isArchived = true): Promise<PersonalDiet> => unwrap<PersonalDiet>(await api.patch(`/personal-diets/${id}/archive`, { isArchived })),
  favorite: async (id: string): Promise<PersonalDiet> => unwrap<PersonalDiet>(await api.patch(`/personal-diets/${id}/favorite`)),
  stats: async (): Promise<Record<string, unknown>> => unwrap(await api.get("/personal-diets/stats")),
  getWater: async (): Promise<{ date: string; glasses: number }> => unwrap(await api.get("/personal-diets/water")),
  setWater: async (glasses: number): Promise<{ date: string; glasses: number }> => unwrap(await api.put("/personal-diets/water", { glasses })),
};
