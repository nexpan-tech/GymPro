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

export type WorkoutAssignmentStatus = "SCHEDULED" | "COMPLETED" | "EXPIRED" | "SKIPPED";

export interface WorkoutAssignmentFull {
  id: string;
  scheduledDate: string;
  dayNumber?: number | null;
  status: WorkoutAssignmentStatus;
  completedAt?: string | null;
  workoutPlan: WorkoutPlan & { trainer?: { id: string; name: string } | null };
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

/** Caller's LOCAL day (YYYY-MM-DD) so "today" matches the member's date. */
function localDay(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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

  // ─── Phase 1: calendar-day assignment engine (today's workout) ─────────────
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
};
