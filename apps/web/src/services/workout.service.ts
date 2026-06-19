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
  /** Legacy single assignment. */
  memberId?: string;
  /** Multi-assign — one duplicated plan is created per member (preferred). */
  memberIds?: string[];
  title: string;
  description?: string;
  difficulty: Difficulty;
  durationWeeks?: number;
}

/** createPlan returns the first created plan augmented with the full list. */
export type CreateWorkoutPlanResult = WorkoutPlanFull & {
  plans?: WorkoutPlanFull[];
  count?: number;
};

export interface UpdateWorkoutPlanInput {
  title?: string;
  description?: string;
  difficulty?: Difficulty;
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

// ─── Phase 1: calendar-day workout assignments ───────────────────────────────

export type WorkoutAssignmentStatus = "SCHEDULED" | "COMPLETED" | "EXPIRED" | "SKIPPED";

export interface WorkoutAssignmentFull {
  id: string;
  scheduledDate: string;
  dayNumber?: number | null;
  status: WorkoutAssignmentStatus;
  completedAt?: string | null;
  workoutPlan: WorkoutPlanFull & { trainer?: { id: string; name: string } | null };
}

export interface TodayWorkout {
  date: string;
  assignments: WorkoutAssignmentFull[];
}

export type WorkoutDayStatus = "REST" | "SCHEDULED" | "COMPLETED" | "MISSED" | "SKIPPED";
export interface WorkoutWeekDay {
  date: string;
  weekday: string;
  isToday: boolean;
  status: WorkoutDayStatus;
  source: "TRAINER" | "PERSONAL" | null;
  assignmentId: string | null;
  plan: { id: string; title: string; difficulty: string; exerciseCount: number; muscles: string[]; estMinutes: number } | null;
}
export interface WorkoutWeek {
  weekStart: string;
  weekEnd: string;
  weekOffset: number;
  days: WorkoutWeekDay[];
}

export interface AssignWorkoutInput {
  workoutPlanId: string;
  memberIds?: string[];
  assignToAll?: boolean;
  dayNumber?: number;
  scheduledDate?: string;
  dates?: string[];
  weekly?: { weekdays: number[]; startDate: string; weeks: number };
}

/** The caller's LOCAL calendar day (YYYY-MM-DD) so "today" matches their date. */
function localDay(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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

  createPlan: async (input: CreateWorkoutPlanInput): Promise<CreateWorkoutPlanResult> => {
    const res = await api.post("/workouts", input);
    return unwrap<CreateWorkoutPlanResult>(res);
  },

  getById: async (id: string): Promise<WorkoutPlanFull> => {
    const res = await api.get(`/workouts/${id}`);
    return unwrap<WorkoutPlanFull>(res);
  },

  updatePlan: async (id: string, input: UpdateWorkoutPlanInput): Promise<WorkoutPlanFull> => {
    const res = await api.patch(`/workouts/${id}`, input);
    return unwrap<WorkoutPlanFull>(res);
  },

  deletePlan: async (id: string): Promise<void> => {
    await api.delete(`/workouts/${id}`);
  },

  addExercise: async (planId: string, input: AddWorkoutExerciseInput) => {
    const res = await api.post(`/workouts/${planId}/exercises`, input);
    return unwrap(res);
  },

  removeExercise: async (exerciseId: string): Promise<void> => {
    await api.delete(`/workouts/exercises/${exerciseId}`);
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

  // ─── Phase 1: calendar-day assignment engine ───────────────────────────────
  // The client passes its LOCAL day so "today" matches the member's date.
  getToday: async (): Promise<TodayWorkout> => {
    const res = await api.get(`/workouts/today?date=${localDay()}`);
    return unwrap<TodayWorkout>(res) ?? { date: localDay(), assignments: [] };
  },

  getUpcoming: async (): Promise<WorkoutAssignmentFull[]> => {
    const res = await api.get(`/workouts/upcoming?date=${localDay()}`);
    return unwrap<WorkoutAssignmentFull[]>(res) ?? [];
  },

  getWeek: async (weekOffset = 0): Promise<WorkoutWeek> => {
    const res = await api.get(`/workouts/week?date=${localDay()}&weekOffset=${weekOffset}`);
    return unwrap<WorkoutWeek>(res) ?? { weekStart: "", weekEnd: "", weekOffset, days: [] };
  },

  getHistory: async (): Promise<WorkoutAssignmentFull[]> => {
    const res = await api.get(`/workouts/history?date=${localDay()}`);
    return unwrap<WorkoutAssignmentFull[]>(res) ?? [];
  },

  completeAssignment: async (assignmentId: string): Promise<void> => {
    await api.post(`/workouts/assignments/${assignmentId}/complete`);
  },

  /** TRAINER/ADMIN — assign a plan to members across one or more days. */
  assignPlan: async (input: AssignWorkoutInput): Promise<{ assigned: number; members: number; days: number }> => {
    const res = await api.post("/workouts/assign", input);
    return unwrap<{ assigned: number; members: number; days: number }>(res);
  },
};